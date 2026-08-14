/**
 * Shared UI vocabulary for the AgentTeams activity panel and the task board.
 * @module dsh-agent-teams/client/activity-ui
 */

import type { StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'

/** One member row of a host snapshot. */
export interface ActivityMember {
  readonly id: string
  readonly name: string
  readonly role: string
  readonly activity: 'working' | 'idle' | 'unknown'
  readonly progress: number
  readonly done: number
  readonly total: number
  readonly currentTask: string
  readonly unread: number
}

/** One task row of a host snapshot. */
export interface ActivityTask {
  readonly id: string
  readonly subject: string
  readonly status: string
  readonly state: 'blocked' | 'open' | 'running' | 'completed'
  readonly assignee: string
  readonly dependencies: readonly string[]
  readonly depth: number
}

/** One captain-inbox preview row. */
export interface ActivityMessage {
  readonly from: string
  readonly content: string
}

/** One team snapshot (mirrors the host TeamActivitySnapshot). */
export interface ActivityTeam {
  readonly workspace: string
  readonly teamId: string
  readonly name: string
  readonly description?: string
  readonly captainSessionId: string
  readonly members: readonly ActivityMember[]
  readonly tasks: readonly ActivityTask[]
  readonly messageCount: number
  readonly captainInbox: readonly ActivityMessage[]
}

/**
 * Whether a session may view a team: its captain or one of its active
 * members. Removed members are already filtered out of the snapshot, so
 * they never match here.
 */
export function teamVisibleTo(team: ActivityTeam, sessionId: string | undefined): boolean {
  if (sessionId === undefined) return false
  return team.captainSessionId === sessionId
    || team.members.some((member) => member.id === sessionId)
}

/** Initial-letter fallback for unmatched roles. */
export function memberInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function stableHash(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

const ACCENTS = [
  'var(--dsw-alias-state-business-primary)',
  'var(--dsw-alias-state-success)',
  'var(--dsw-alias-state-danger)',
  'var(--dsw-alias-state-warning)',
  'var(--dsw-alias-label-tertiary)',
] as const

export function accentOf(id: string): string {
  return ACCENTS[stableHash(id) % ACCENTS.length] ?? ACCENTS[0]
}

/** Badge text follows the raw task status (finer than the 4 visual states):
 * claimed/pending/failed/cancelled keep their own labels and colors. */
const TASK_STATUS_LABEL: Record<string, string> = {
  pending: '待领取',
  claimed: '已认领',
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

export function taskStatusLabel(status: string): string {
  return TASK_STATUS_LABEL[status] ?? status
}

/** Badge/bar coloring key: visual state, widened for terminal statuses. */
export function taskTone(state: ActivityTask['state'], status: string): string {
  if (status === 'failed') return 'failed'
  if (status === 'cancelled') return 'cancelled'
  return state
}

export function memberDotState(member: ActivityMember, tasks: readonly ActivityTask[]): StateDotState {
  const owned = tasks.filter((task) => task.assignee === member.name)
  if (member.activity === 'working') return 'ongoing'
  if (owned.some((task) => task.status === 'failed')) return 'error'
  if (owned.length > 0 && owned.every((task) => task.status === 'completed')) return 'done'
  return 'warning'
}

export function memberStateLabel(member: ActivityMember, tasks: readonly ActivityTask[]): string {
  const owned = tasks.filter((task) => task.assignee === member.name)
  if (member.activity === 'working') return '工作中'
  if (owned.some((task) => task.status === 'failed')) return '有失败'
  if (owned.some((task) => task.state === 'blocked')) return '等待'
  if (owned.length > 0 && owned.every((task) => task.status === 'completed')) return '已交付'
  if (owned.length > 0) return '待执行'
  return '待派工'
}

export function memberStatusText(member: ActivityMember, tasks: readonly ActivityTask[]): string {
  const owned = tasks.filter((task) => task.assignee === member.name)
  const current = owned.find((task) => task.id === member.currentTask)
  const blocked = owned.find((task) => task.state === 'blocked')
  if (member.activity === 'working' && current !== undefined) return `正在执行 ${current.id}`
  if (member.activity === 'working') return '正在处理已派任务'
  if (blocked !== undefined) {
    const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== 'completed')
    if (dependency !== undefined) return `等待 ${dependency.id} · ${dependency.assignee || '待认领'}`
    return '等待前置任务'
  }
  if (member.total === 0) return '等待队长派工'
  if (member.done === member.total) return '任务已交付'
  return member.activity === 'idle' ? '待继续执行' : '状态未知'
}

export function dependencyLabel(task: ActivityTask, tasks: readonly ActivityTask[]): string {
  return task.dependencies.map((id) => {
    const dependency = tasks.find((candidate) => candidate.id === id)
    return dependency?.assignee ? `${id}·${dependency.assignee}` : id
  }).join('、')
}
