/**
 * Shared UI vocabulary for the AgentTeams activity panel and the task board.
 * @module dsh-agent-teams/client/activity-ui
 */
import type { StateDotState } from '@deepseek-ai/dsh-client-ui-primitives';
/** One member row of a host snapshot. */
export interface ActivityMember {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly activity: 'working' | 'idle' | 'unknown';
    readonly progress: number;
    readonly done: number;
    readonly total: number;
    readonly currentTask: string;
    readonly unread: number;
}
/** One task row of a host snapshot. */
export interface ActivityTask {
    readonly id: string;
    readonly subject: string;
    /** Requirement this task is a stage of ('' = its own requirement). */
    readonly requirement: string;
    readonly status: string;
    readonly state: 'blocked' | 'open' | 'running' | 'completed';
    readonly assignee: string;
    readonly dependencies: readonly string[];
    readonly depth: number;
}
/** One captain-inbox preview row. */
export interface ActivityMessage {
    readonly from: string;
    readonly content: string;
}
/** One team snapshot (mirrors the host TeamActivitySnapshot). */
export interface ActivityTeam {
    readonly workspace: string;
    readonly teamId: string;
    readonly name: string;
    readonly description?: string;
    readonly captainSessionId: string;
    readonly members: readonly ActivityMember[];
    readonly tasks: readonly ActivityTask[];
    readonly messageCount: number;
    readonly captainInbox: readonly ActivityMessage[];
}
/**
 * Whether a session may view a team: its captain or one of its active
 * members. Removed members are already filtered out of the snapshot, so
 * they never match here.
 */
export declare function teamVisibleTo(team: ActivityTeam, sessionId: string | undefined): boolean;
/** Initial-letter fallback for unmatched roles. */
export declare function memberInitial(name: string): string;
export declare function accentOf(id: string): string;
export declare function taskStatusLabel(status: string): string;
/** Badge/bar coloring key: visual state, widened for terminal statuses. */
export declare function taskTone(state: ActivityTask['state'], status: string): string;
export declare function memberDotState(member: ActivityMember, tasks: readonly ActivityTask[]): StateDotState;
export declare function memberStateLabel(member: ActivityMember, tasks: readonly ActivityTask[]): string;
export declare function memberStatusText(member: ActivityMember, tasks: readonly ActivityTask[]): string;
export declare function dependencyLabel(task: ActivityTask, tasks: readonly ActivityTask[]): string;
