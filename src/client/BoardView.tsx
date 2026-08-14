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

import { Fragment, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Handle, MarkerType, Position, ReactFlow, type Edge, type EdgeProps, type Node } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
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
import reactFlowCss from '\0dsh-react-flow-css'
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
/** Axis-aligned box in svg coordinates. */
interface Box {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

/** Liang–Barsky: does segment (x1,y1)-(x2,y2) intersect the box? */
function segmentHitsBox(x1: number, y1: number, x2: number, y2: number, box: Box): boolean {
  let t0 = 0
  let t1 = 1
  const dx = x2 - x1
  const dy = y2 - y1
  const p = [-dx, dx, -dy, dy]
  const q = [x1 - box.left, box.right - x1, y1 - box.top, box.bottom - y1]
  for (let i = 0; i < 4; i++) {
    const pi = p[i] ?? 0
    const qi = q[i] ?? 0
    if (pi === 0) {
      if (qi < 0) return false
    } else {
      const r = qi / pi
      if (pi < 0) {
        if (r > t1) return false
        if (r > t0) t0 = r
      } else {
        if (r < t0) return false
        if (r < t1) t1 = r
      }
    }
  }
  return true
}

/**
 * Route a connection so it never crosses another node: use the direct
 * cubic when clear; otherwise detour through the first free horizontal
 * channel above or below all obstacles (three-segment path).
 */
function routeConnection(
  x1: number, y1: number, x2: number, y2: number,
  obstacles: readonly Box[], bend: number,
): string {
  if (!obstacles.some((box) => segmentHitsBox(x1, y1, x2, y2, box))) {
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
  }
  const channelFree = (cy: number): boolean => !obstacles.some((box) =>
    segmentHitsBox(x1, y1, x1, cy, box)
    || segmentHitsBox(x1, cy, x2, cy, box)
    || segmentHitsBox(x2, cy, x2, y2, box),
  )
  // Candidate channels: just above/below the endpoints, plus every obstacle
  // edge (row gaps between nodes are the natural corridors).
  const candidates = [Math.min(y1, y2) - 46, Math.max(y1, y2) + 46]
  for (const box of obstacles) {
    candidates.push(box.top - 20, box.bottom + 20)
  }
  const midY = (y1 + y2) / 2
  const channel = [...new Set(candidates)]
    .filter((cy) => cy >= 6)
    .sort((a, b) => Math.abs(a - midY) - Math.abs(b - midY))
    .find((cy) => channelFree(cy))
  if (channel !== undefined) {
    return `M ${x1} ${y1} L ${x1} ${channel} L ${x2} ${channel} L ${x2} ${y2}`
  }
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
}


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

/** One requirement orb: a small ball nested inside its worker orb. The orb
 * is marked active while its worker is actually executing it, so a working
 * node visibly shows the requirement it is handling. */
function TaskOrb({ task, tasks, dimmed, hot, onFocus, onBlur }: {
  readonly task: ActivityTask
  readonly tasks: readonly ActivityTask[]
  readonly dimmed: boolean
  readonly hot: boolean
  readonly onFocus: (taskId: string) => void
  readonly onBlur: () => void
}) {
  const tone = taskTone(task.state, task.status)
  const active = task.status === 'in_progress'
  return (
    <button
      type="button"
      className={css.taskOrb}
      data-state={tone}
      data-active={active}
      data-dimmed={dimmed}
      data-hot={hot}
      title={`${task.id} ${task.subject}${active ? ' · 正在执行' : ''}${task.dependencies.length > 0 ? ` · 依赖 ${dependencyLabel(task, tasks)}` : ''}`}
      onMouseEnter={() => { onFocus(task.id) }}
      onMouseLeave={onBlur}
      onFocus={() => { onFocus(task.id) }}
      onBlur={onBlur}
    >
      {task.id}
    </button>
  )
}

/** One worker orb: the big ball holding its requirement orbs inside. Every
 * stage orb of the worker's requirements is shown; the stage currently
 * being executed is marked active (filled, breathing), so the board reads
 * which stage is live while the full flow stays visible. */
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
  // All orbs sit on the ring (a single orb lands at 3 o'clock), so the
  // avatar in the middle is never covered.
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
                style={{ transform: `rotate(${index * angleStep}deg) translate(46px) rotate(${-index * angleStep}deg)` }}
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
/** Requirement rail groups in display order (everything the team carries). */
/** One requirement: an independent unit (e.g. a feature) whose stages are
 * its individual work items (write docs, develop, test, ...). */
interface Requirement {
  /** Stable id: the shared requirement name, or the task id for
   * single-stage requirements. */
  readonly id: string
  /** Display subject: the requirement name (or the single task's). */
  readonly subject: string
  readonly stages: readonly ActivityTask[]
}

/** Build requirements from tasks: tasks sharing a `requirement` name form
 * that requirement's stages; tasks without one are their own single-stage
 * requirement. Requirements are independent — no cross-requirement links. */
function buildRequirements(tasks: readonly ActivityTask[]): Requirement[] {
  const byName = new Map<string, ActivityTask[]>()
  for (const task of tasks) {
    const key = task.requirement !== '' ? task.requirement : task.id
    const list = byName.get(key) ?? []
    list.push(task)
    byName.set(key, list)
  }
  return [...byName.entries()]
    .map(([key, stages]) => ({
      id: key,
      subject: stages[0]!.requirement !== '' ? stages[0]!.requirement : stages[0]!.subject,
      stages: stages.slice().sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })),
    }))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
}

/** Overall status of one requirement, derived from its stages. */
function requirementStatus(requirement: Requirement): 'pending' | 'running' | 'done' | 'failed' {
  if (requirement.stages.some((stage) => stage.status === 'failed' || stage.status === 'cancelled')) return 'failed'
  if (requirement.stages.some((stage) => stage.status === 'in_progress')) return 'running'
  if (requirement.stages.every((stage) => stage.status === 'completed')) return 'done'
  return 'pending'
}

/** The worker holding the requirement right now (working stage, else the
 * first non-completed stage, else the root's assignee). */
function currentHolderOf(requirement: Requirement): string {
  const working = requirement.stages.find((stage) => stage.status === 'in_progress')
  if (working !== undefined) return working.assignee !== '' ? working.assignee : '待认领'
  const next = requirement.stages.find((stage) => stage.status !== 'completed')
  if (next !== undefined) return next.assignee !== '' ? next.assignee : '待认领'
  return '已收齐'
}

/** The left requirement rail: independent requirements grouped by their
 * overall status. Hovering one highlights its whole flow path. */
function RequirementRail({ requirements, focusedRequirementId, related, onFocus, onBlur }: {
  readonly requirements: readonly Requirement[]
  readonly focusedRequirementId: string | null
  readonly related: ReadonlySet<string> | null
  readonly onFocus: (requirementId: string) => void
  readonly onBlur: () => void
}) {
  const groups: readonly { readonly key: string; readonly label: string; readonly match: (requirement: Requirement) => boolean }[] = [
    { key: 'pending', label: '未开始', match: (r) => requirementStatus(r) === 'pending' },
    { key: 'running', label: '进行中', match: (r) => requirementStatus(r) === 'running' },
    { key: 'done', label: '已完成', match: (r) => requirementStatus(r) === 'done' },
    { key: 'failed', label: '异常', match: (r) => requirementStatus(r) === 'failed' },
  ]
  return (
    <aside className={css.requirementRail} aria-label="需求列表">
      {groups.map((group) => {
        const items = requirements.filter(group.match)
        if (items.length === 0) return null
        return (
          <div key={group.key} className={css.railGroup}>
            <header className={css.railGroupHead}>
              <span>{group.label}</span>
              <span className={css.railCount}>{items.length}</span>
            </header>
            {items.map((requirement) => {
              const hot = focusedRequirementId !== null && focusedRequirementId === requirement.id
              const dimmed = focusedRequirementId !== null && !hot
              const holder = currentHolderOf(requirement)
              const stagesSummary = requirement.stages.map((stage) => stage.id).join(' → ')
              return (
                <button
                  type="button"
                  key={requirement.id}
                  className={css.railItem}
                  data-state={requirementStatus(requirement)}
                  data-hot={hot}
                  data-dimmed={dimmed}
                  data-rail-task={requirement.id}
                  title={`${requirement.subject} · 环节 ${stagesSummary}`}
                  onMouseEnter={() => { onFocus(requirement.id) }}
                  onMouseLeave={onBlur}
                  onFocus={() => { onFocus(requirement.id) }}
                  onBlur={onBlur}
                >
                  <span className={css.railItemSubject}>{requirement.subject}</span>
                  <span className={css.railItemOwner}>
                    {requirement.stages.length > 1 ? `${requirement.stages.length} 环节 · ` : ''}{holder}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </aside>
  )
}




/** React Flow node payload for a worker orb. Deliberately free of the
 * hover focus: nodes/edges arrays keep a stable reference across hover
 * state changes, so React Flow never rebuilds node DOM under the mouse
 * (which would fire mouseleave and loop the hover state). */
interface WorkerOrbData {
  readonly member: ActivityMember
  readonly tasks: readonly ActivityTask[]
  readonly onFocus: (taskId: string) => void
  readonly onBlur: () => void
  readonly onNavigate: (id: SessionId) => void
}

/** Hover focus shared with node/edge components without touching React
 * Flow's controlled props (see WorkerOrbData). */
const HoverFocusContext = createContext<{ readonly id: string | null; readonly related: ReadonlySet<string> | null }>({
  id: null,
  related: null,
})

/** Custom node renderer: the worker orb (big ball with requirement orbs).
 * Every requirement orb gets a hidden source/target handle pair at its
 * ring position (always mounted: edges reference them, so they must exist
 * even when the orb itself is hidden), so flow edges run from mini node to
 * mini node (the requirement's stage balls), not orb edge to orb edge. */
function WorkerOrbNode({ data }: { readonly data: WorkerOrbData }) {
  const { related } = useContext(HoverFocusContext)
  const owned = data.tasks.filter((task) => task.assignee === data.member.name)
  const all = owned.slice(0, TASK_ORB_COUNT)
  const angleStep = all.length <= 1 ? 0 : 360 / all.length
  return (
    <div className={css.nodeWrap}>
      {all.map((task, index) => {
        const angle = (index * angleStep * Math.PI) / 180
        // Orb center is at the top-left of the node box; ring radius 46px.
        // Matches the CSS ring transform `rotate(θ) translate(46px)`
        // (angle 0 = 3 o'clock, clockwise, y down).
        const hx = ORB_DIAMETER / 2 + ORB_RING_RADIUS * Math.cos(angle)
        const hy = ORB_DIAMETER / 2 + ORB_RING_RADIUS * Math.sin(angle)
        // Edges run horizontally between columns (dagre LR): offset the
        // source handle to the orb's right rim and the target handle to the
        // left rim, so the arrow visibly leaves/enters the mini node.
        const sourceStyle = { left: hx + ORB_MINI_RADIUS, top: hy, transform: 'translate(-50%, -50%)' }
        const targetStyle = { left: hx - ORB_MINI_RADIUS, top: hy, transform: 'translate(-50%, -50%)' }
        return (
          <Fragment key={task.id}>
            <Handle
              id={`src-${task.id}`}
              type="source"
              position={Position.Right}
              className={css.nodeHandle}
              style={sourceStyle}
            />
            <Handle
              id={`tgt-${task.id}`}
              type="target"
              position={Position.Left}
              className={css.nodeHandle}
              style={targetStyle}
            />
          </Fragment>
        )
      })}
      <WorkerNode
        member={data.member}
        tasks={data.tasks}
        focusedRelated={related}
        onFocus={data.onFocus}
        onBlur={data.onBlur}
        onNavigate={data.onNavigate}
      />
    </div>
  )
}

/** React Flow edge payload: static per team (hover state is read from
 * HoverFocusContext inside the edge component, keeping the edges array
 * reference stable across hover changes). */
interface FlowEdgeData extends Record<string, unknown> {
  readonly taskId: string
  readonly depId: string
  readonly label: string
}

/** Custom edge renderer: bezier path with arrow marker and a label; reads
 * the hover focus from context so the edges array never changes on hover.
 * Edges stay mounted and visible: the requirement's stage flow (t2 → t3 →
 * t4) is always shown from mini node to mini node; hovering a requirement
 * highlights its path. The marker defs are declared once in the board
 * (see markerDefs below); this component only switches the url() reference
 * by hover state. */
function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<Edge<FlowEdgeData>>) {
  const { related } = useContext(HoverFocusContext)
  const taskId = data?.taskId ?? ''
  const depId = data?.depId ?? ''
  const label = data?.label ?? ''
  const hot = related !== null && related.has(taskId) && related.has(depId)
  const dimmed = related !== null && !hot
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={hot ? 'url(#dsh-agent-teams-arrow-hot)' : 'url(#dsh-agent-teams-arrow-base)'}
        style={{
          stroke: hot ? 'var(--dsw-alias-state-business-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: hot ? 2.5 : 1.5,
          opacity: dimmed ? 0.12 : hot ? 1 : 0.7,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={css.edgeLabel}
          data-hot={hot}
          data-dimmed={dimmed}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
        >
          <span className={css.edgeLabelBg}>{label}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

/** Stable registries (React Flow requires constant references). */
const workerOrbNodeTypes = { workerOrb: WorkerOrbNode }
const flowEdgeTypes = { flow: FlowEdge }

/** Shared arrow marker definitions for the flow edges (React Flow custom
 * edges receive a marker url string, so the defs live here once). */
function EdgeMarkerDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <marker id="dsh-agent-teams-arrow-base" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" orient="auto-start-reverse">
          <path d="M 0 0 L 16 8 L 0 16 z" fill="var(--dsw-alias-label-secondary)" />
        </marker>
        <marker id="dsh-agent-teams-arrow-hot" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" orient="auto-start-reverse">
          <path d="M 0 0 L 16 8 L 0 16 z" fill="var(--dsw-alias-state-business-primary)" />
        </marker>
      </defs>
    </svg>
  )
}

/** Node box used by the dagre layout (orb + name + meta below). */
const ORB_NODE_WIDTH = 148
const ORB_NODE_HEIGHT = 200
/** Worker orb diameter (matches .workerOrb in BoardView.module.css). */
const ORB_DIAMETER = 148
/** Ring radius of the requirement orbs inside a worker orb. */
const ORB_RING_RADIUS = 46
/** Radius of one requirement mini orb (matches .taskOrb). */
const ORB_MINI_RADIUS = 15

/**
 * Left-to-right dagre layout: workers with flow relationships land in
 * adjacent columns, so requirement edges run between columns and never
 * cross another worker orb.
 */
function layoutWorkerOrbs(team: ActivityTeam): Map<string, { x: number; y: number }> {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 150, marginx: 0, marginy: 0 })
  graph.setDefaultEdgeLabel(() => ({}))
  for (const member of team.members) {
    graph.setNode(member.name, { width: ORB_NODE_WIDTH, height: ORB_NODE_HEIGHT })
  }
  for (const edge of buildEdges(team.tasks)) {
    if (!graph.hasEdge(edge.from, edge.to)) graph.setEdge(edge.from, edge.to)
  }
  dagre.layout(graph)
  const positions = new Map<string, { x: number; y: number }>()
  for (const member of team.members) {
    const node = graph.node(member.name)
    positions.set(member.name, {
      x: node.x - ORB_NODE_WIDTH / 2,
      y: node.y - ORB_NODE_HEIGHT / 2,
    })
  }
  return positions
}

/**
 * Board content for one team: worker orbs laid out by dagre and rendered
 * with React Flow; requirement edges run between adjacent columns with
 * arrow markers; hovering a requirement (rail item or nested orb) draws a
 * line from the requirement itself to the node currently handling it, and
 * highlights its whole flow path.
 */
export function FlowBoard({ team, onNavigate }: {
  readonly team: ActivityTeam
  readonly onNavigate: (id: SessionId) => void
}) {
  const [focusedRequirementId, setFocusedRequirementId] = useState<string | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  /** SVG path (layout coordinates) of the hover link from the focused rail
   * item to its handler orb, routed around every other orb. */
  const [hoverLinkPath, setHoverLinkPath] = useState<string | null>(null)
  const requirements = useMemo(() => buildRequirements(team.tasks), [team.tasks])
  const requirementByTask = useMemo(() => {
    const map = new Map<string, string>()
    for (const requirement of requirements) {
      for (const stage of requirement.stages) map.set(stage.id, requirement.id)
    }
    return map
  }, [requirements])
  const focusRequirementOf = useCallback((taskId: string): void => {
    setFocusedRequirementId(requirementByTask.get(taskId) ?? null)
  }, [requirementByTask])
  const blur = useCallback(() => { setFocusedRequirementId(null) }, [])
  const related = useMemo(() => {
    if (focusedRequirementId === null) return null
    const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId)
    return requirement === undefined ? null : new Set(requirement.stages.map((stage) => stage.id))
  }, [focusedRequirementId, requirements])
  const completedCount = team.tasks.filter((task) => task.status === 'completed').length
  const positions = useMemo(() => layoutWorkerOrbs(team), [team])

  // Measure the hover link from the focused rail item to its handler orb.
  // Re-measured on window resize and on the layout scroll so the line
  // tracks the panel while it scrolls.
  useEffect(() => {
    if (focusedRequirementId === null) {
      setHoverLinkPath(null)
      return
    }
    const layout = layoutRef.current
    if (layout === null) return
    const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId)
    if (requirement === undefined) {
      setHoverLinkPath(null)
      return
    }
    const measure = (): void => {
      const railItem = layout.querySelector<HTMLElement>(`[data-rail-task="${focusedRequirementId}"]`)
      // The link starts from the requirement's first stage (its origin, e.g.
      // t2), not from the stage currently in progress.
      const origin = requirement.stages[0]
      const orb = origin !== undefined && origin.assignee !== ''
        ? layout.querySelector<HTMLElement>(`[data-worker-node][data-worker-name="${origin.assignee}"]`)
        : null
      if (railItem === null || orb === null || origin === undefined) {
        setHoverLinkPath(null)
        return
      }
      const layoutRect = layout.getBoundingClientRect()
      const railRect = railItem.getBoundingClientRect()
      const orbRect = orb.getBoundingClientRect()
      const x1 = railRect.right - layoutRect.left
      const y1 = railRect.top + railRect.height / 2 - layoutRect.top
      // Target the origin stage's mini orb inside its node, falling back to
      // the node's left rim when the orb is not rendered.
      const orbEl = [...orb.querySelectorAll<HTMLElement>('button')]
        .find((button) => button.textContent.trim() === origin.id)
      const targetRect = orbEl !== undefined ? orbEl.getBoundingClientRect() : undefined
      const x2 = targetRect !== undefined ? targetRect.left - layoutRect.left : orbRect.left - layoutRect.left
      const y2 = targetRect !== undefined
        ? targetRect.top + targetRect.height / 2 - layoutRect.top
        : orbRect.top + orbRect.height / 2 - layoutRect.top
      // Every other orb is an obstacle: the link may never cross a node.
      const obstacles: Box[] = [...layout.querySelectorAll<HTMLElement>('[data-worker-node]')]
        .filter((el) => el.dataset.workerName !== origin.assignee)
        .map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            left: rect.left - layoutRect.left,
            top: rect.top - layoutRect.top,
            right: rect.right - layoutRect.left,
            bottom: rect.bottom - layoutRect.top,
          }
        })
      setHoverLinkPath(routeConnection(x1, y1, x2, y2, obstacles, 42))
    }
    measure()
    const onResize = (): void => { measure() }
    window.addEventListener('resize', onResize)
    layout.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      layout.removeEventListener('scroll', onResize, true)
    }
  }, [focusedRequirementId, requirements])

  // nodes/edges arrays depend only on team data (never on hover state):
  // React Flow therefore never rebuilds DOM under the mouse, so hover
  // focus changes cannot loop through mouseleave. Hover state travels via
  // HoverFocusContext instead.
  const nodes = useMemo<Node[]>(() => team.members.map((member) => ({
    id: member.name,
    type: 'workerOrb',
    position: positions.get(member.name) ?? { x: 0, y: 0 },
    data: {
      member,
      tasks: team.tasks,
      onFocus: focusRequirementOf,
      onBlur: blur,
      onNavigate,
    } satisfies WorkerOrbData,
  })), [team.members, team.tasks, positions, focusRequirementOf, blur, onNavigate])

  const edges = useMemo<Edge[]>(() => buildEdges(team.tasks).map((edge) => ({
    id: edge.id,
    source: edge.from,
    // Anchor the edge to the actual requirement orbs (mini nodes), so the
    // arrow runs from the dependency's orb to this task's orb.
    sourceHandle: `src-${edge.dep.id}`,
    target: edge.to,
    targetHandle: `tgt-${edge.task.id}`,
    type: 'flow',
    data: {
      taskId: edge.task.id,
      depId: edge.dep.id,
      label: edge.task.id,
    } satisfies FlowEdgeData,
  })), [team.tasks])

  const markerId = `dsh-agent-teams-hover-arrow-${team.teamId.replace(/[^a-zA-Z0-9_-]/g, '')}`

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

      <div className={css.boardLayout} ref={layoutRef}>
        <RequirementRail
          requirements={requirements}
          focusedRequirementId={focusedRequirementId}
          related={related}
          onFocus={setFocusedRequirementId}
          onBlur={blur}
        />

        <div className={css.flowArea}>
          <EdgeMarkerDefs />
          <HoverFocusContext.Provider value={{ id: focusedRequirementId, related }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={workerOrbNodeTypes}
              edgeTypes={flowEdgeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.5}
              maxZoom={2}
              proOptions={{ hideAttribution: false }}
              className={css.flowCanvas}
            />
          </HoverFocusContext.Provider>
        </div>

        {hoverLinkPath !== null && (
          <svg className={css.hoverLinkLayer} aria-hidden>
            <defs>
              <marker
                id={markerId}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className={css.hoverLinkArrow} />
              </marker>
            </defs>
            <path className={css.hoverLink} d={hoverLinkPath} markerEnd={`url(#${markerId})`} />
          </svg>
        )}
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

/** Root marker while the board tab is active: the activity floater hides
 * itself when this is present so it never covers the board or steals its
 * hover events. */
export const BOARD_OPEN_ATTRIBUTE = 'data-agent-teams-board-open'

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
  /** Stable navigate callback: a new function identity would re-create the
   * React Flow node payloads (and their DOM) on every board re-render. */
  const navigate = useCallback((id: SessionId) => { openSession(id) }, [openSession])

  // Poll host snapshots. Keep the previous array reference when the payload
  // is unchanged, so re-renders do not rebuild the flow DOM (see navigate).
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
          if (!cancelled && Array.isArray(body.teams)) {
            setTeams((previous) => {
              const next = body.teams as readonly ActivityTeam[]
              if (previous.length === next.length && JSON.stringify(previous) === JSON.stringify(next)) {
                return previous
              }
              return next
            })
          }
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

  // Announce the board on the document root while the tab is active, so the
  // activity floater hides itself and never covers the board or steals its
  // hover events.
  useEffect(() => {
    const root = document.documentElement
    if (open) root.setAttribute(BOARD_OPEN_ATTRIBUTE, '')
    else root.removeAttribute(BOARD_OPEN_ATTRIBUTE)
    return () => { root.removeAttribute(BOARD_OPEN_ATTRIBUTE) }
  }, [open])

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
      style.textContent = BOARD_GLOBAL_CSS + "\n" + reactFlowCss
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
        <FlowBoard key={team.teamId} team={team} onNavigate={navigate} />
      ))}
    </>,
    panelEl,
  )
}
