import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { accentOf, dependencyLabel, memberInitial, memberStateLabel, memberStatusText, taskStatusLabel, taskTone, teamVisibleTo, } from "./activity-ui.js";
import { memberArtUrl } from "./artwork.js";
import css from './BoardView.module.css';
/** Poll cadence for the host snapshot route. */
const POLL_MS = 1000;
/** Host route serving team snapshots. */
const STATE_URL = '/plugins/dsh-agent-teams/state';
/** Class marker for the injected conversation tab. */
export const BOARD_TAB_CLASS = 'dsh-agent-teams-board-tab';
/** Style tag id for the injected tab's global stylesheet. */
const BOARD_TAB_STYLE_ID = 'dsh-agent-teams-board-tab-styles';
/** Global stylesheet for the injected tab (mirrors the shell tab look
 * without depending on the shell's hashed class names; the css-module
 * pipeline cannot emit these `::after` rules). */
const BOARD_TAB_CSS = `
.${BOARD_TAB_CLASS}{position:relative;padding:0 0 11px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:13px;font-weight:500;line-height:16px;cursor:pointer}
.${BOARD_TAB_CLASS}:hover{color:var(--dsw-alias-label-primary)}
.${BOARD_TAB_CLASS}::after{position:absolute;right:0;bottom:1px;left:0;height:2px;border-radius:2px;background:transparent;content:''}
.${BOARD_TAB_CLASS}[aria-selected='true']{color:var(--dsw-alias-state-business-primary)}
.${BOARD_TAB_CLASS}[aria-selected='true']::after{background:var(--dsw-alias-state-business-primary)}
`;
/** One task card in a board column. */
export function TaskCard({ task, tasks }) {
    const tone = taskTone(task.state, task.status);
    return (_jsxs("div", { className: css.taskCard, "data-state": tone, title: task.subject, children: [_jsxs("span", { className: css.taskCardHead, children: [_jsx("span", { className: css.taskCardId, children: task.id }), _jsx("span", { className: css.taskBadge, "data-state": tone, children: taskStatusLabel(task.status) })] }), _jsx("span", { className: css.taskCardSubject, children: task.subject }), _jsxs("span", { className: css.taskCardRoute, children: [_jsx("span", { className: css.taskOwner, children: task.assignee || '待认领' }), task.dependencies.length > 0 && (_jsxs("span", { className: css.taskCardDeps, children: ["\u4F9D\u8D56 ", dependencyLabel(task, tasks)] }))] })] }));
}
/** Board columns in workflow order; failed/cancelled land in the last one. */
const BOARD_COLUMNS = [
    { key: 'pending', label: '待认领', tone: 'open', match: (status) => status === 'pending' },
    { key: 'claimed', label: '已认领', tone: 'claimed', match: (status) => status === 'claimed' },
    { key: 'in_progress', label: '进行中', tone: 'running', match: (status) => status === 'in_progress' },
    { key: 'completed', label: '已完成', tone: 'completed', match: (status) => status === 'completed' },
    { key: 'failed', label: '异常', tone: 'failed', match: (status) => status === 'failed' || status === 'cancelled' },
];
/**
 * Board content for one team: a member status strip on top (who is doing
 * what right now) plus per-status task columns in workflow order.
 */
export function KanbanBoard({ team, onNavigate }) {
    const completedCount = team.tasks.filter((task) => task.status === 'completed').length;
    return (_jsxs("section", { className: css.board, "data-board": true, "data-team-id": team.teamId, children: [_jsxs("header", { className: css.boardHead, children: [_jsx("span", { className: css.teamName, title: team.name, children: team.name }), _jsxs("span", { className: css.teamStats, children: [_jsxs("span", { "data-stat": "members", children: [team.members.length, " \u6210\u5458"] }), _jsxs("span", { "data-stat": "tasks", children: [completedCount, "/", team.tasks.length, " \u5B8C\u6210"] }), _jsxs("span", { "data-stat": "messages", children: [team.messageCount, " \u6D88\u606F"] })] })] }), _jsx("div", { className: css.memberStrip, "aria-label": "\u6210\u5458\u5B9E\u65F6\u72B6\u6001", children: team.members.map((member) => (_jsxs("button", { type: "button", className: css.memberCard, "data-activity": member.activity, onClick: () => { if (member.id !== '')
                        onNavigate(member.id); }, title: `${member.name} · ${memberStatusText(member, team.tasks)}`, children: [_jsx("span", { className: css.memberCardAvatar, "data-activity": member.activity, children: memberArtUrl(member.name, member.role) !== null ? (_jsx("img", { className: css.memberArt, src: memberArtUrl(member.name, member.role) ?? '', alt: "", "aria-hidden": true })) : (_jsx("span", { className: css.memberCardInitial, style: { background: accentOf(member.id) }, children: memberInitial(member.name) })) }), _jsxs("span", { className: css.memberCardInfo, children: [_jsx("span", { className: css.memberCardName, children: member.name }), _jsx("span", { className: css.memberCardStatus, "data-activity": member.activity, children: memberStateLabel(member, team.tasks) })] }), member.unread > 0 && _jsx("span", { className: css.unreadPill, children: member.unread })] }, member.id))) }), _jsx("div", { className: css.kanbanColumns, children: BOARD_COLUMNS.map((column) => {
                    const tasks = team.tasks.filter((task) => column.match(task.status));
                    return (_jsxs("div", { className: css.kanbanColumn, "data-column": column.key, children: [_jsxs("header", { className: css.kanbanColumnHead, "data-state": column.tone, children: [_jsx("span", { children: column.label }), _jsx("span", { className: css.kanbanCount, children: tasks.length })] }), _jsxs("div", { className: css.kanbanColumnBody, children: [tasks.length === 0 && _jsx("span", { className: css.taskEmpty, children: "\u6682\u65E0\u4EFB\u52A1" }), tasks.map((task) => (_jsx(TaskCard, { task: task, tasks: team.tasks }, task.id)))] })] }, column.key));
                }) })] }));
}
/**
 * Locate the conversation view tab bar: the parent of the Trajectory tab.
 * Relative location (role + text) keeps this working across shell upgrades
 * that change hashed class names; Trajectory text is matched in both
 * supported locales.
 */
export function findConversationTabBar() {
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
        const text = (tab.textContent ?? '').trim();
        if (text === 'Trajectory' || text === '轨迹')
            return tab.parentElement;
    }
    return null;
}
function computeOverlayRect() {
    const tabBar = findConversationTabBar();
    if (tabBar === null)
        return null;
    const barRect = tabBar.getBoundingClientRect();
    // The conversation root is the first ancestor tall enough to span the
    // viewport (the tab bar's parent header is the same width, so width
    // cannot distinguish them; height can).
    const viewportHeight = window.innerHeight;
    let root = tabBar.parentElement;
    while (root !== null && root.getBoundingClientRect().height < viewportHeight * 0.8)
        root = root.parentElement;
    if (root === null)
        return null;
    const rootRect = root.getBoundingClientRect();
    return {
        top: barRect.bottom,
        left: rootRect.left,
        width: rootRect.width,
        height: Math.max(0, rootRect.bottom - barRect.bottom),
    };
}
/**
 * The main-interface task board: injects the 任务看板 tab and renders the
 * board overlay while the tab is active. The overlay follows the current
 * session (captain or member), polls the host snapshot route, and closes on
 * session switch or when another conversation tab is picked.
 */
export function BoardOverlay({ sessionsList, openSession }) {
    const [open, setOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [rect, setRect] = useState(null);
    const openRef = useRef(false);
    openRef.current = open;
    const current = useSyncExternalStore(sessionsList.subscribe, sessionsList.getSnapshot).current;
    // Poll host snapshots.
    useEffect(() => {
        let cancelled = false;
        let inFlight = false;
        const tick = async () => {
            if (inFlight || cancelled)
                return;
            inFlight = true;
            try {
                const response = await fetch(STATE_URL, { cache: 'no-store' });
                if (response.ok) {
                    const body = (await response.json());
                    if (!cancelled && Array.isArray(body.teams))
                        setTeams(body.teams);
                }
            }
            catch {
                // Host restarting; keep the last snapshot.
            }
            finally {
                inFlight = false;
            }
        };
        void tick();
        const timer = setInterval(() => { void tick(); }, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);
    // Session switch closes the board (the shell resets to Chat on navigation).
    useEffect(() => { setOpen(false); }, [current]);
    // Inject the tab, keep it alive across shell re-renders, and close when
    // another conversation tab is picked.
    useEffect(() => {
        if (document.getElementById(BOARD_TAB_STYLE_ID) === null) {
            const style = document.createElement('style');
            style.id = BOARD_TAB_STYLE_ID;
            style.dataset.plugin = 'dsh-agent-teams';
            style.textContent = BOARD_TAB_CSS;
            document.head.appendChild(style);
        }
        const ensureTab = () => {
            const tabBar = findConversationTabBar();
            if (tabBar === null)
                return;
            if (tabBar.querySelector(`button.${BOARD_TAB_CLASS}`) !== null)
                return;
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.role = 'tab';
            tab.className = BOARD_TAB_CLASS;
            tab.textContent = '任务看板';
            tab.addEventListener('click', () => {
                setRect(computeOverlayRect());
                setOpen(true);
            });
            tabBar.appendChild(tab);
        };
        ensureTab();
        const observer = new MutationObserver(() => { ensureTab(); });
        observer.observe(document.body, { childList: true, subtree: true });
        const onCaptureClick = (event) => {
            const target = event.target;
            const tab = target?.closest('[role="tab"]');
            if (tab !== null && tab !== undefined && !tab.classList.contains(BOARD_TAB_CLASS)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onCaptureClick, true);
        return () => {
            observer.disconnect();
            document.removeEventListener('click', onCaptureClick, true);
        };
    }, []);
    // Sync the tab highlight with the open state (survives re-injection).
    useEffect(() => {
        const tabBar = findConversationTabBar();
        const tab = tabBar?.querySelector(`button.${BOARD_TAB_CLASS}`);
        if (tab === null || tab === undefined)
            return;
        if (open)
            tab.setAttribute('aria-selected', 'true');
        else
            tab.removeAttribute('aria-selected');
    }, [open]);
    // Keep the overlay aligned with the conversation root while open.
    useEffect(() => {
        if (!open)
            return;
        const update = () => { setRect(computeOverlayRect()); };
        update();
        window.addEventListener('resize', update);
        return () => { window.removeEventListener('resize', update); };
    }, [open]);
    const visibleTeams = current === undefined ? [] : teams.filter((team) => teamVisibleTo(team, current));
    if (!open || rect === null || visibleTeams.length === 0)
        return null;
    return createPortal(_jsx("div", { className: css.overlay, "data-board-overlay": true, style: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, children: visibleTeams.map((team) => (_jsx(KanbanBoard, { team: team, onNavigate: (id) => { openSession(id); } }, team.teamId))) }), document.body);
}
