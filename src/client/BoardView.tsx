/**
 * Task board view: a third conversation tab (Chat | Trajectory | 任务看板)
 * showing the team workflow overview in the main interface.
 *
 * The shell renders the conversation view internally (dsh-client-ui-
 * conversation) with no tab extension point, so the board tab is injected
 * next to the Trajectory tab by relative DOM location (never by hashed class
 * names) and kept alive across shell re-renders by a MutationObserver. The
 * board itself renders through a body portal overlay aligned to the
 * conversation root, so no shell DOM is touched while it is closed.
 * @module dsh-agent-teams/client/board
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ObservableSnapshot, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  type ActivityMember, type ActivityTask, type ActivityTeam, accentOf,
  dependencyLabel, memberDotState, memberInitial, memberStateLabel, memberStatusText,
  taskStatusLabel, taskTone, teamVisibleTo,
} from './activity-ui.ts'
import { relatedTaskIds } from './activity-model.ts'
import { memberArtUrl } from './artwork.ts'
import css from './BoardView.module.css'

/** Poll cadence for the host snapshot route. */
const POLL_MS = 1000
/** Host route serving team snapshots. */
const STATE_URL = '/plugins/dsh-agent-teams/state'
/** Class marker for the injected conversation tab. */
export const BOARD_TAB_CLASS = 'dsh-agent-teams-board-tab'
/** Style tag id for the injected tab's global stylesheet. */
const BOARD_GLOBAL_STYLE_ID = 'dsh-agent-teams-board-global-styles'
/** Global stylesheet: the injected tab (mirrors the shell tab look without
 * depending on the shell's hashed class names; the css-module pipeline
 * cannot emit these `::after` rules) and the board panel placeholder that
 * replaces the conversation content while the board tab is active. */
const BOARD_GLOBAL_CSS = `
.${BOARD_TAB_CLASS}{position:relative;padding:0 0 11px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:13px;font-weight:500;line-height:16px;cursor:pointer}
.${BOARD_TAB_CLASS}:hover{color:var(--dsw-alias-label-primary)}
.${BOARD_TAB_CLASS}::after{position:absolute;right:0;bottom:1px;left:0;height:2px;border-radius:2px;background:transparent;content:''}
.${BOARD_TAB_CLASS}[aria-selected='true']{color:var(--dsw-alias-state-business-primary)}
.${BOARD_TAB_CLASS}[aria-selected='true']::after{background:var(--dsw-alias-state-business-primary)}
[data-agent-teams-board-panel]{flex:1 1 auto;min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;display:flex;flex-direction:column;box-sizing:border-box;padding:12px 16px;background:var(--dsw-alias-bg-base)}
`

/** One flow edge: a requirement handed from one worker to another. */
interface FlowEdge {
  readonly id: string
  /** The requirement flowing (the dependent task). */
  readonly task: ActivityTask
  /** The upstream requirement it depends on. */
  readonly dep: ActivityTask
  /** Sender worker (the dependency's assignee). */
  readonly from: string
  /** Receiver worker (this task's assignee). */
  readonly to: string
}

/** Build worker-to-worker requirement edges. Same-worker dependencies and
 * unassigned tasks stay inside the node / pool instead of becoming edges. */
function buildEdges(tasks: readonly ActivityTask[]): FlowEdge[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const edges: FlowEdge[] = []
  for (const task of tasks) {
    if (task.assignee === '') continue
    for (const depId of task.dependencies) {
      const dep = byId.get(depId)
      if (dep === undefined || dep.assignee === '' || dep.assignee === task.assignee) continue
      edges.push({ id: `${task.id}:${depId}`, task, dep, from: dep.assignee, to: task.assignee })
    }
  }
  return edges
}

/** Max requirement orbs rendered inside one worker orb (+N for the rest). */
const TASK_ORB_COUNT = 6

/** One requirement orb: a small ball nested inside its worker orb. */
function TaskOrb({ task, tasks, dimmed, hot, onFocus, onBlur }: {
  readonly task: ActivityTask
  readonly tasks: readonly ActivityTask[]
  readonly dimmed: boolean
  readonly hot: boolean
  readonly onFocus: (taskId: string) => void
  readonly onBlur: () => void
}) {
  const tone = taskTone(task.state, task.status)
  return (
    <button
      type="button"
      className={css.taskOrb}
      data-state={tone}
      data-dimmed={dimmed}
      data-hot={hot}
      title={`${task.id} ${task.subject}${task.dependencies.length > 0 ? ` · 依赖 ${dependencyLabel(task, tasks)}` : ''}`}
      onMouseEnter={() => { onFocus(task.id) }}
      onMouseLeave={onBlur}
      onFocus={() => { onFocus(task.id) }}
      onBlur={onBlur}
    >
      {task.id}
    </button>
  )
}

/** One worker orb: the big ball holding its requirement orbs inside. */
function WorkerNode({ member, tasks, focusedRelated, onFocus, onBlur, onNavigate }: {
  readonly member: ActivityMember
  readonly tasks: readonly ActivityTask[]
  readonly focusedRelated: ReadonlySet<string> | null
  readonly onFocus: (taskId: string) => void
  readonly onBlur: () => void
  readonly onNavigate: (id: SessionId) => void
}) {
  const owned = tasks.filter((task) => task.assignee === member.name)
  const involved = focusedRelated === null || owned.some((task) => focusedRelated.has(task.id))
  const visible = owned.slice(0, TASK_ORB_COUNT)
  const overflow = owned.length - visible.length
  const angleStep = visible.length <= 1 ? 0 : 360 / visible.length
  return (
    <div className={css.workerSlot}>
      <div
        className={css.workerOrb}
        data-worker-node
        data-worker-name={member.name}
        data-activity={member.activity}
        data-dimmed={focusedRelated !== null && !involved}
        data-hot={focusedRelated !== null && involved}
      >
        <button
          type="button"
          className={css.orbAvatar}
          onClick={() => { if (member.id !== '') onNavigate(member.id as SessionId) }}
          title={`${member.name} · ${memberStatusText(member, tasks)}`}
        >
          {memberArtUrl(member.name, member.role) !== null ? (
            <img className={css.orbArt} src={memberArtUrl(member.name, member.role) ?? ''} alt="" aria-hidden />
          ) : (
            <span className={css.orbInitial} style={{ background: accentOf(member.id) }}>{memberInitial(member.name)}</span>
          )}
        </button>
        {visible.length > 0 && (
          <div className={css.orbTasks}>
            {visible.map((task, index) => (
              <span
                key={task.id}
                className={css.orbTaskSlot}
                style={visible.length > 1
                  ? { transform: `rotate(${index * angleStep}deg) translate(46px) rotate(${-index * angleStep}deg)` }
                  : undefined}
              >
                <TaskOrb
                  task={task}
                  tasks={tasks}
                  dimmed={focusedRelated !== null && !focusedRelated.has(task.id)}
                  hot={focusedRelated !== null && focusedRelated.has(task.id)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </span>
            ))}
          </div>
        )}
        {overflow > 0 && (
          <span className={css.orbOverflow} title={owned.slice(TASK_ORB_COUNT).map((task) => `${task.id} ${task.subject}`).join('\n')}>
            +{overflow}
          </span>
        )}
        {member.unread > 0 && <span className={css.orbUnread}>{member.unread}</span>}
      </div>
      <div className={css.workerName} title={member.name}>{member.name}</div>
      <div className={css.workerMeta}>
        <span className={css.workerRole}>{member.role}</span>
        <span className={css.workerState} data-activity={member.activity}>
          <span className={css.workerStateDot} data-activity={member.activity} aria-hidden />
          {memberStateLabel(member, tasks)}
        </span>
      </div>
    </div>
  )
}



/**
 * Board content for one team: one node per worker, requirement edges drawn
 * between workers (a requirement flows from its dependency's worker to its
 * own worker), and hovering a requirement highlights its whole flow path.
 */
export function FlowBoard({ team, onNavigate }: {
  readonly team: ActivityTeam
  readonly onNavigate: (id: SessionId) => void
}) {
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodeRects, setNodeRects] = useState<ReadonlyMap<string, DOMRect>>(new Map())
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const edges = useMemo(() => buildEdges(team.tasks), [team.tasks])
  const related = useMemo(
    () => (focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, team.tasks)),
    [focusedTaskId, team.tasks],
  )
  const involvedWorkers = useMemo(() => {
    if (related === null) return null
    const names = new Set<string>()
    for (const task of team.tasks) {
      if (related.has(task.id) && task.assignee !== '') names.add(task.assignee)
    }
    return names
  }, [related, team.tasks])
  const completedCount = team.tasks.filter((task) => task.status === 'completed').length
  const unassigned = team.tasks.filter((task) => task.assignee === '')

  // Measure worker nodes and the container so edges can be drawn between
  // nodes in the SVG layer (re-measured on layout changes).
  useLayoutEffect(() => {
    const update = (): void => {
      const container = containerRef.current
      if (container === null) return
      const map = new Map<string, DOMRect>()
      for (const el of container.querySelectorAll<HTMLElement>('[data-worker-node]')) {
        const name = el.dataset.workerName
        if (name !== undefined) map.set(name, el.getBoundingClientRect())
      }
      setNodeRects(map)
      setContainerSize({ width: container.clientWidth, height: container.clientHeight })
    }
    update()
    const observer = new ResizeObserver(update)
    const container = containerRef.current
    if (container !== null) observer.observe(container)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // Parallel edges between the same worker pair fan out vertically.
  const pairTotal = new Map<string, number>()
  for (const edge of edges) {
    const key = `${edge.from}>${edge.to}`
    pairTotal.set(key, (pairTotal.get(key) ?? 0) + 1)
  }
  const pairIndex = new Map<string, number>()
  const containerRect = containerRef.current?.getBoundingClientRect() ?? null

  return (
    <section className={css.board} data-board data-team-id={team.teamId}>
      <header className={css.boardHead}>
        <span className={css.teamName} title={team.name}>{team.name}</span>
        <span className={css.teamStats}>
          <span data-stat="members">{team.members.length} 成员</span>
          <span data-stat="tasks">{completedCount}/{team.tasks.length} 完成</span>
          <span data-stat="messages">{team.messageCount} 消息</span>
        </span>
      </header>

      {unassigned.length > 0 && (
        <div className={css.unassignedBar}>
          <span className={css.unassignedLabel}>待认领</span>
          {unassigned.map((task) => (
            <TaskOrb
              key={task.id}
              task={task}
              tasks={team.tasks}
              dimmed={related !== null && !related.has(task.id)}
              hot={related !== null && related.has(task.id)}
              onFocus={setFocusedTaskId}
              onBlur={() => { setFocusedTaskId(null) }}
            />
          ))}
        </div>
      )}

      <div className={css.flowArea} ref={containerRef}>
        <svg
          className={css.flowSvg}
          width={containerSize.width}
          height={containerSize.height}
          aria-hidden
        >
          <defs>
            <marker
              id={`at-flow-arrow-${team.teamId}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className={css.edgeArrow} />
            </marker>
          </defs>
          {edges.map((edge) => {
            const from = nodeRects.get(edge.from)
            const to = nodeRects.get(edge.to)
            if (from === undefined || to === undefined || containerRect === null) return null
            const x1 = from.left + from.width / 2 - containerRect.left
            const y1 = from.top + from.height / 2 - containerRect.top
            const x2 = to.left + to.width / 2 - containerRect.left
            const y2 = to.top + to.height / 2 - containerRect.top
            const pairKey = `${edge.from}>${edge.to}`
            const index = pairIndex.get(pairKey) ?? 0
            pairIndex.set(pairKey, index + 1)
            const offset = (index - ((pairTotal.get(pairKey) ?? 1) - 1) / 2) * 16
            const bend = 36
            const midY = (y1 + y2) / 2 + offset
            const path = `M ${x1} ${y1} C ${x1 + bend} ${midY}, ${x2 - bend} ${midY}, ${x2} ${y2}`
            const hot = related !== null && related.has(edge.task.id) && related.has(edge.dep.id)
            const dimmed = related !== null && !hot
            const labelWidth = Math.max(36, edge.task.id.length * 8 + 16)
            return (
              <g key={edge.id}>
                <path className={css.edgePath} data-dimmed={dimmed} data-hot={hot} d={path} markerEnd={`url(#at-flow-arrow-${team.teamId})`} />
                <g
                  className={css.edgeLabel}
                  data-dimmed={dimmed}
                  data-hot={hot}
                  transform={`translate(${(x1 + x2) / 2} ${midY})`}
                  onMouseEnter={() => { setFocusedTaskId(edge.task.id) }}
                  onMouseLeave={() => { setFocusedTaskId(null) }}
                  onFocus={() => { setFocusedTaskId(edge.task.id) }}
                  onBlur={() => { setFocusedTaskId(null) }}
                  role="button"
                  tabIndex={0}
                  aria-label={`需求 ${edge.task.id} 从 ${edge.from} 流转到 ${edge.to}`}
                >
                  <rect className={css.edgeLabelBg} width={labelWidth} height={20} rx={10} />
                  <text className={css.edgeLabelText} x={labelWidth / 2} y={14} textAnchor="middle">{edge.task.id}</text>
                  <title>{`${edge.task.id} ${edge.task.subject}：${edge.from} → ${edge.to}`}</title>
                </g>
              </g>
            )
          })}
        </svg>

        <div className={css.workerGrid}>
          {team.members.map((member) => (
            <WorkerNode
              key={member.id}
              member={member}
              tasks={team.tasks}
              focusedRelated={related}
              onFocus={setFocusedTaskId}
              onBlur={() => { setFocusedTaskId(null) }}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </section>
  )
}


export function findConversationTabBar(): HTMLElement | null {
  const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]')
  for (const tab of tabs) {
    const text = (tab.textContent ?? '').trim()
    if (text === 'Trajectory' || text === '轨迹') return tab.parentElement
  }
  return null
}

/** The conversation header (tab bar + title row) hosting the tab bar. */
function findConversationHeader(tabBar: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = tabBar.parentElement
  while (el !== null && el.tagName !== 'HEADER') el = el.parentElement
  return el
}

/** The conversation root: the first ancestor tall enough to span the
 * viewport (the header is the same width, so width cannot distinguish
 * them; height can). */
function findConversationRoot(tabBar: HTMLElement): HTMLElement | null {
  const viewportHeight = window.innerHeight
  let root: HTMLElement | null = tabBar.parentElement
  while (root !== null && root.getBoundingClientRect().height < viewportHeight * 0.8) root = root.parentElement
  return root
}

/**
 * The conversation content panel: the root's sibling right after the
 * header's wrapper. Hidden while the board tab is active so the board is a
 * real page switch, not an overlay.
 */
function findContentPanel(root: HTMLElement, header: HTMLElement): HTMLElement | null {
  const wrapper = header.parentElement
  if (wrapper === null) return null
  const content = wrapper.nextElementSibling
  return content instanceof HTMLElement && root.contains(content) ? content : null
}

/** The shell's active-tab class (hashed prefix, stable `tabActive` local
 * name) on one tab element, if any. */
function shellActiveTabClass(tab: HTMLElement): string | undefined {
  return [...tab.classList].find((name) => name.endsWith('tabActive'))
}

/** The shell-owned tabs of the conversation tab bar (ours excluded). */
function shellTabsOf(tabBar: HTMLElement): HTMLElement[] {
  return [...tabBar.querySelectorAll<HTMLElement>('[role="tab"]')]
    .filter((tab) => !tab.classList.contains(BOARD_TAB_CLASS))
}

/**
 * The main-interface task board: injects the 任务看板 tab and, while the
 * tab is active, replaces the conversation content panel with the board
 * (the shell exposes no tab extension point, so the tab is injected by
 * relative DOM location and kept alive across shell re-renders by a
 * MutationObserver). The board follows the current session (captain or
 * member), polls the host snapshot route, and closes on session switch or
 * when another conversation tab is picked.
 */
export function BoardOverlay({ sessionsList, openSession }: {
  readonly sessionsList: ObservableSnapshot<SessionListState>
  readonly openSession: (id: SessionId) => void
}) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<readonly ActivityTeam[]>([])
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null)
  const openRef = useRef(false)
  openRef.current = open
  /** The shell tab that was active before the board opened (restored on
   * close unless the shell already re-activated a tab itself). */
  const savedActiveRef = useRef<{ readonly text: string; readonly cls: string } | null>(null)
  const current = useSyncExternalStore(
    sessionsList.subscribe,
    sessionsList.getSnapshot,
  ).current

  // Poll host snapshots.
  useEffect(() => {
    let cancelled = false
    let inFlight = false
    const tick = async (): Promise<void> => {
      if (inFlight || cancelled) return
      inFlight = true
      try {
        const response = await fetch(STATE_URL, { cache: 'no-store' })
        if (response.ok) {
          const body = (await response.json()) as { teams?: unknown }
          if (!cancelled && Array.isArray(body.teams)) setTeams(body.teams as readonly ActivityTeam[])
        }
      } catch {
        // Host restarting; keep the last snapshot.
      } finally {
        inFlight = false
      }
    }
    void tick()
    const timer = setInterval(() => { void tick() }, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  // Session switch closes the board (the shell resets to Chat on navigation).
  useEffect(() => { setOpen(false) }, [current])

  // While the board tab is active, clear the shell tabs' active styles so
  // Chat/Trajectory don't stay highlighted; restore the previously active
  // shell tab on close (unless the shell already re-activated one).
  useEffect(() => {
    const tabBar = findConversationTabBar()
    if (tabBar === null) return
    const shellTabs = shellTabsOf(tabBar)
    if (open) {
      savedActiveRef.current = null
      for (const tab of shellTabs) {
        const activeClass = shellActiveTabClass(tab)
        if (activeClass !== undefined) {
          if (savedActiveRef.current === null) {
            savedActiveRef.current = { text: (tab.textContent ?? '').trim(), cls: activeClass }
          }
          tab.classList.remove(activeClass)
          tab.setAttribute('aria-selected', 'false')
        }
      }
    } else {
      const restored = savedActiveRef.current
      savedActiveRef.current = null
      if (restored !== null && shellTabs.every((tab) => shellActiveTabClass(tab) === undefined)) {
        const target = shellTabs.find((tab) => (tab.textContent ?? '').trim() === restored.text)
        if (target !== undefined) {
          target.classList.add(restored.cls)
          target.setAttribute('aria-selected', 'true')
        }
      }
    }
  }, [open])

  // Replace the conversation content with the board panel while open.
  useEffect(() => {
    if (!open) return
    const tabBar = findConversationTabBar()
    if (tabBar === null) return
    const root = findConversationRoot(tabBar)
    const header = findConversationHeader(tabBar)
    if (root === null || header === null) return
    const content = findContentPanel(root, header)
    const previousDisplay = content?.style.display
    if (content !== null) content.style.display = 'none'
    let panel = root.querySelector<HTMLElement>('[data-agent-teams-board-panel]')
    if (panel === null) {
      panel = document.createElement('div')
      panel.dataset.agentTeamsBoardPanel = ''
      root.appendChild(panel)
    }
    setPanelEl(panel)
    return () => {
      if (content !== null && previousDisplay !== undefined) content.style.display = previousDisplay
      const existing = root.querySelector('[data-agent-teams-board-panel]')
      if (existing !== null) existing.remove()
      setPanelEl(null)
    }
  }, [open])

  // Inject the tab, keep it alive across shell re-renders, and close when
  // another conversation tab is picked.
  useEffect(() => {
    if (document.getElementById(BOARD_GLOBAL_STYLE_ID) === null) {
      const style = document.createElement('style')
      style.id = BOARD_GLOBAL_STYLE_ID
      style.dataset.plugin = 'dsh-agent-teams'
      style.textContent = BOARD_GLOBAL_CSS
      document.head.appendChild(style)
    }
    const ensureTab = (): void => {
      const tabBar = findConversationTabBar()
      if (tabBar === null) return
      if (tabBar.querySelector(`button.${BOARD_TAB_CLASS}`) !== null) return
      const tab = document.createElement('button')
      tab.type = 'button'
      tab.role = 'tab'
      tab.className = BOARD_TAB_CLASS
      tab.textContent = '任务看板'
      tab.addEventListener('click', () => {
        setOpen(true)
      })
      tabBar.appendChild(tab)
    }
    const onCaptureClick = (event: Event): void => {
      const target = event.target as HTMLElement | null
      const tab = target?.closest<HTMLElement>('[role="tab"]')
      if (tab !== null && tab !== undefined && !tab.classList.contains(BOARD_TAB_CLASS)) {
        setOpen(false)
      }
    }
    ensureTab()
    const observer = new MutationObserver(() => {
      ensureTab()
      // A shell re-render may have dropped the board panel while the tab is
      // active; re-apply the page switch (and clear any shell tab active
      // style the re-render restored).
      if (openRef.current) {
        const tabBar = findConversationTabBar()
        if (tabBar !== null) {
          for (const tab of shellTabsOf(tabBar)) {
            const activeClass = shellActiveTabClass(tab)
            if (activeClass !== undefined) tab.classList.remove(activeClass)
          }
          const root = findConversationRoot(tabBar)
          const header = findConversationHeader(tabBar)
          if (root !== null && header !== null) {
            const content = findContentPanel(root, header)
            if (content !== null) content.style.display = 'none'
            let panel = root.querySelector<HTMLElement>('[data-agent-teams-board-panel]')
            if (panel === null) {
              panel = document.createElement('div')
              panel.dataset.agentTeamsBoardPanel = ''
              root.appendChild(panel)
            }
            setPanelEl(panel)
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', onCaptureClick, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', onCaptureClick, true)
    }
  }, [])

  // Sync the tab highlight with the open state (survives re-injection).
  useEffect(() => {
    const tabBar = findConversationTabBar()
    const tab = tabBar?.querySelector<HTMLButtonElement>(`button.${BOARD_TAB_CLASS}`)
    if (tab === null || tab === undefined) return
    if (open) tab.setAttribute('aria-selected', 'true')
    else tab.removeAttribute('aria-selected')
  }, [open])

  const visibleTeams = current === undefined ? [] : teams.filter((team) => teamVisibleTo(team, current))
  if (!open || panelEl === null || visibleTeams.length === 0) return null

  return createPortal(
    <>
      {visibleTeams.map((team) => (
        <FlowBoard key={team.teamId} team={team} onNavigate={(id: SessionId) => { openSession(id) }} />
      ))}
    </>,
    panelEl,
  )
}
