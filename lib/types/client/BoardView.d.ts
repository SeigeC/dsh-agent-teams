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
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { ObservableSnapshot, SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
import { type ActivityTeam } from './activity-ui.ts';
/** Class marker for the injected conversation tab. */
export declare const BOARD_TAB_CLASS = "dsh-agent-teams-board-tab";
/**
 * Board content for one team: worker orbs laid out by dagre and rendered
 * with React Flow; requirement edges run between adjacent columns with
 * arrow markers; hovering a requirement (rail item or nested orb)
 * highlights its whole flow path.
 */
export declare function FlowBoard({ team, onNavigate }: {
    readonly team: ActivityTeam;
    readonly onNavigate: (id: SessionId) => void;
}): import("react").JSX.Element;
export declare function findConversationTabBar(): HTMLElement | null;
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
export declare function BoardOverlay({ sessionsList, openSession }: {
    readonly sessionsList: ObservableSnapshot<SessionListState>;
    readonly openSession: (id: SessionId) => void;
}): import("react").ReactPortal | null;
