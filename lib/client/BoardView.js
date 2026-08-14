import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { accentOf, dependencyLabel, memberInitial, memberStateLabel, memberStatusText, taskTone, teamVisibleTo, } from "./activity-ui.js";
import { memberArtUrl } from "./artwork.js";
import css from './BoardView.module.css';
/** Poll cadence for the host snapshot route. */
const POLL_MS = 1000;
/** Host route serving team snapshots. */
const STATE_URL = '/plugins/dsh-agent-teams/state';
/** Class marker for the injected conversation tab. */
export const BOARD_TAB_CLASS = 'dsh-agent-teams-board-tab';
/** Style tag id for the injected tab's global stylesheet. */
const BOARD_GLOBAL_STYLE_ID = 'dsh-agent-teams-board-global-styles';
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
`;
/** Build worker-to-worker requirement edges. Same-worker dependencies and
 * unassigned tasks stay inside the node / pool instead of becoming edges. */
function buildEdges(tasks) {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const edges = [];
    for (const task of tasks) {
        if (task.assignee === '')
            continue;
        for (const depId of task.dependencies) {
            const dep = byId.get(depId);
            if (dep === undefined || dep.assignee === '' || dep.assignee === task.assignee)
                continue;
            edges.push({ id: `${task.id}:${depId}`, task, dep, from: dep.assignee, to: task.assignee });
        }
    }
    return edges;
}
/** Max requirement orbs rendered inside one worker orb (+N for the rest). */
const TASK_ORB_COUNT = 6;
/** One requirement orb: a small ball nested inside its worker orb. */
function TaskOrb({ task, tasks, dimmed, hot, onFocus, onBlur }) {
    const tone = taskTone(task.state, task.status);
    return (_jsx("button", { type: "button", className: css.taskOrb, "data-state": tone, "data-dimmed": dimmed, "data-hot": hot, title: `${task.id} ${task.subject}${task.dependencies.length > 0 ? ` · 依赖 ${dependencyLabel(task, tasks)}` : ''}`, onMouseEnter: () => { onFocus(task.id); }, onMouseLeave: onBlur, onFocus: () => { onFocus(task.id); }, onBlur: onBlur, children: task.id }));
}
/** One worker orb: the big ball holding its requirement orbs inside. */
function WorkerNode({ member, tasks, focusedRelated, onFocus, onBlur, onNavigate }) {
    const owned = tasks.filter((task) => task.assignee === member.name);
    const involved = focusedRelated === null || owned.some((task) => focusedRelated.has(task.id));
    const visible = owned.slice(0, TASK_ORB_COUNT);
    const overflow = owned.length - visible.length;
    const angleStep = visible.length <= 1 ? 0 : 360 / visible.length;
    return (_jsxs("div", { className: css.workerSlot, children: [_jsxs("div", { className: css.workerOrb, "data-worker-node": true, "data-worker-name": member.name, "data-activity": member.activity, "data-dimmed": focusedRelated !== null && !involved, "data-hot": focusedRelated !== null && involved, children: [_jsx("button", { type: "button", className: css.orbAvatar, onClick: () => { if (member.id !== '')
                            onNavigate(member.id); }, title: `${member.name} · ${memberStatusText(member, tasks)}`, children: memberArtUrl(member.name, member.role) !== null ? (_jsx("img", { className: css.orbArt, src: memberArtUrl(member.name, member.role) ?? '', alt: "", "aria-hidden": true })) : (_jsx("span", { className: css.orbInitial, style: { background: accentOf(member.id) }, children: memberInitial(member.name) })) }), visible.length > 0 && (_jsx("div", { className: css.orbTasks, children: visible.map((task, index) => (_jsx("span", { className: css.orbTaskSlot, style: visible.length > 1
                                ? { transform: `rotate(${index * angleStep}deg) translate(46px) rotate(${-index * angleStep}deg)` }
                                : undefined, children: _jsx(TaskOrb, { task: task, tasks: tasks, dimmed: focusedRelated !== null && !focusedRelated.has(task.id), hot: focusedRelated !== null && focusedRelated.has(task.id), onFocus: onFocus, onBlur: onBlur }) }, task.id))) })), overflow > 0 && (_jsxs("span", { className: css.orbOverflow, title: owned.slice(TASK_ORB_COUNT).map((task) => `${task.id} ${task.subject}`).join('\n'), children: ["+", overflow] })), member.unread > 0 && _jsx("span", { className: css.orbUnread, children: member.unread })] }), _jsx("div", { className: css.workerName, title: member.name, children: member.name }), _jsxs("div", { className: css.workerMeta, children: [_jsx("span", { className: css.workerRole, children: member.role }), _jsxs("span", { className: css.workerState, "data-activity": member.activity, children: [_jsx("span", { className: css.workerStateDot, "data-activity": member.activity, "aria-hidden": true }), memberStateLabel(member, tasks)] })] })] }));
}
/** Build requirements from tasks: a requirement is a root task (no
 * dependencies) plus every task that transitively depends on it. Each task
 * belongs to the requirement of its root, so requirements never overlap. */
function buildRequirements(tasks) {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const rootOf = new Map();
    const findRoot = (task) => {
        const cached = rootOf.get(task.id);
        if (cached !== undefined)
            return cached;
        const first = task.dependencies[0];
        const dep = first !== undefined ? byId.get(first) : undefined;
        const root = dep !== undefined ? findRoot(dep) : task.id;
        rootOf.set(task.id, root);
        return root;
    };
    const byRoot = new Map();
    for (const task of tasks) {
        const root = findRoot(task);
        const list = byRoot.get(root) ?? [];
        list.push(task);
        byRoot.set(root, list);
    }
    return [...byRoot.entries()].map(([rootId, stages]) => {
        const root = byId.get(rootId) ?? stages[0];
        return {
            id: rootId,
            root,
            stages: stages.slice().sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })),
        };
    });
}
/** Overall status of one requirement, derived from its stages. */
function requirementStatus(requirement) {
    if (requirement.stages.some((stage) => stage.status === 'failed' || stage.status === 'cancelled'))
        return 'failed';
    if (requirement.stages.some((stage) => stage.status === 'in_progress'))
        return 'running';
    if (requirement.stages.every((stage) => stage.status === 'completed'))
        return 'done';
    return 'pending';
}
/** The worker holding the requirement right now (working stage, else the
 * first non-completed stage, else the root's assignee). */
function currentHolderOf(requirement) {
    const working = requirement.stages.find((stage) => stage.status === 'in_progress');
    if (working !== undefined)
        return working.assignee !== '' ? working.assignee : '待认领';
    const next = requirement.stages.find((stage) => stage.status !== 'completed');
    if (next !== undefined)
        return next.assignee !== '' ? next.assignee : '待认领';
    return '已收齐';
}
/** The left requirement rail: independent requirements grouped by their
 * overall status. Hovering one highlights its whole flow path. */
function RequirementRail({ requirements, focusedRequirementId, related, onFocus, onBlur }) {
    const groups = [
        { key: 'pending', label: '未开始', match: (r) => requirementStatus(r) === 'pending' },
        { key: 'running', label: '进行中', match: (r) => requirementStatus(r) === 'running' },
        { key: 'done', label: '已完成', match: (r) => requirementStatus(r) === 'done' },
        { key: 'failed', label: '异常', match: (r) => requirementStatus(r) === 'failed' },
    ];
    return (_jsx("aside", { className: css.requirementRail, "aria-label": "\u9700\u6C42\u5217\u8868", children: groups.map((group) => {
            const items = requirements.filter(group.match);
            if (items.length === 0)
                return null;
            return (_jsxs("div", { className: css.railGroup, children: [_jsxs("header", { className: css.railGroupHead, children: [_jsx("span", { children: group.label }), _jsx("span", { className: css.railCount, children: items.length })] }), items.map((requirement) => {
                        const hot = focusedRequirementId !== null && focusedRequirementId === requirement.id;
                        const dimmed = focusedRequirementId !== null && !hot;
                        const holder = currentHolderOf(requirement);
                        return (_jsxs("button", { type: "button", className: css.railItem, "data-state": requirementStatus(requirement), "data-hot": hot, "data-dimmed": dimmed, "data-rail-task": requirement.id, title: `${requirement.id} ${requirement.root.subject} · ${requirement.stages.length} 个环节`, onMouseEnter: () => { onFocus(requirement.id); }, onMouseLeave: onBlur, onFocus: () => { onFocus(requirement.id); }, onBlur: onBlur, children: [_jsx("span", { className: css.railItemId, children: requirement.id }), _jsx("span", { className: css.railItemSubject, children: requirement.root.subject }), _jsxs("span", { className: css.railItemOwner, children: [requirement.stages.length > 1 ? `${requirement.stages.length} 环节 · ` : '', holder] })] }, requirement.id));
                    })] }, group.key));
        }) }));
}
/**
 * Board content for one team: one node per worker, requirement edges drawn
 * between workers (a requirement flows from its dependency's worker to its
 * own worker), and hovering a requirement highlights its whole flow path.
 */
export function FlowBoard({ team, onNavigate }) {
    const [focusedRequirementId, setFocusedRequirementId] = useState(null);
    const requirements = useMemo(() => buildRequirements(team.tasks), [team.tasks]);
    const requirementByTask = useMemo(() => {
        const map = new Map();
        for (const requirement of requirements) {
            for (const stage of requirement.stages)
                map.set(stage.id, requirement.id);
        }
        return map;
    }, [requirements]);
    const focusRequirementOf = (taskId) => {
        setFocusedRequirementId(requirementByTask.get(taskId) ?? null);
    };
    const containerRef = useRef(null);
    const [nodeRects, setNodeRects] = useState(new Map());
    const [railRects, setRailRects] = useState(new Map());
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const edges = useMemo(() => buildEdges(team.tasks), [team.tasks]);
    const related = useMemo(() => {
        if (focusedRequirementId === null)
            return null;
        const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId);
        return requirement === undefined ? null : new Set(requirement.stages.map((stage) => stage.id));
    }, [focusedRequirementId, requirements]);
    const involvedWorkers = useMemo(() => {
        if (related === null)
            return null;
        const names = new Set();
        for (const task of team.tasks) {
            if (related.has(task.id) && task.assignee !== '')
                names.add(task.assignee);
        }
        return names;
    }, [related, team.tasks]);
    const completedCount = team.tasks.filter((task) => task.status === 'completed').length;
    // Measure worker nodes and the container so edges can be drawn between
    // nodes in the SVG layer (re-measured on layout changes).
    useLayoutEffect(() => {
        const update = () => {
            const container = containerRef.current;
            if (container === null)
                return;
            const map = new Map();
            for (const el of container.querySelectorAll('[data-worker-node]')) {
                const name = el.dataset.workerName;
                if (name !== undefined)
                    map.set(name, el.getBoundingClientRect());
            }
            const railMap = new Map();
            for (const el of container.querySelectorAll('[data-rail-task]')) {
                const taskId = el.dataset.railTask;
                if (taskId !== undefined)
                    railMap.set(taskId, el.getBoundingClientRect());
            }
            setNodeRects(map);
            setRailRects(railMap);
            setContainerSize({ width: container.clientWidth, height: container.clientHeight });
        };
        update();
        const observer = new ResizeObserver(update);
        const container = containerRef.current;
        if (container !== null)
            observer.observe(container);
        window.addEventListener('resize', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);
    // Parallel edges between the same worker pair fan out vertically.
    const pairTotal = new Map();
    for (const edge of edges) {
        const key = `${edge.from}>${edge.to}`;
        pairTotal.set(key, (pairTotal.get(key) ?? 0) + 1);
    }
    const pairIndex = new Map();
    const containerRect = containerRef.current?.getBoundingClientRect() ?? null;
    return (_jsxs("section", { className: css.board, "data-board": true, "data-team-id": team.teamId, children: [_jsxs("header", { className: css.boardHead, children: [_jsx("span", { className: css.teamName, title: team.name, children: team.name }), _jsxs("span", { className: css.teamStats, children: [_jsxs("span", { "data-stat": "members", children: [team.members.length, " \u6210\u5458"] }), _jsxs("span", { "data-stat": "tasks", children: [completedCount, "/", team.tasks.length, " \u5B8C\u6210"] }), _jsxs("span", { "data-stat": "messages", children: [team.messageCount, " \u6D88\u606F"] })] })] }), _jsxs("div", { className: css.boardLayout, ref: containerRef, children: [_jsx(RequirementRail, { requirements: requirements, focusedRequirementId: focusedRequirementId, related: related, onFocus: setFocusedRequirementId, onBlur: () => { setFocusedRequirementId(null); } }), _jsx("div", { className: css.flowArea, children: _jsx("div", { className: css.workerGrid, children: team.members.map((member) => (_jsx(WorkerNode, { member: member, tasks: team.tasks, focusedRelated: related, onFocus: focusRequirementOf, onBlur: () => { setFocusedRequirementId(null); }, onNavigate: onNavigate }, member.id))) }) }), _jsxs("svg", { className: css.flowSvg, width: containerSize.width, height: containerSize.height, "aria-hidden": true, children: [_jsx("defs", { children: _jsx("marker", { id: `at-flow-arrow-${team.teamId}`, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "8", markerHeight: "8", orient: "auto-start-reverse", children: _jsx("path", { d: "M 0 0 L 10 5 L 0 10 z", className: css.edgeArrow }) }) }), edges.map((edge) => {
                                const from = nodeRects.get(edge.from);
                                const to = nodeRects.get(edge.to);
                                if (from === undefined || to === undefined || containerRect === null)
                                    return null;
                                const x1 = from.left + from.width / 2 - containerRect.left;
                                const y1 = from.top + from.height / 2 - containerRect.top;
                                const x2 = to.left + to.width / 2 - containerRect.left;
                                const y2 = to.top + to.height / 2 - containerRect.top;
                                const pairKey = `${edge.from}>${edge.to}`;
                                const index = pairIndex.get(pairKey) ?? 0;
                                pairIndex.set(pairKey, index + 1);
                                const offset = (index - ((pairTotal.get(pairKey) ?? 1) - 1) / 2) * 16;
                                const bend = 36;
                                const midY = (y1 + y2) / 2 + offset;
                                const path = `M ${x1} ${y1} C ${x1 + bend} ${midY}, ${x2 - bend} ${midY}, ${x2} ${y2}`;
                                const hot = related !== null && related.has(edge.task.id) && related.has(edge.dep.id);
                                const dimmed = related !== null && !hot;
                                const labelWidth = Math.max(36, edge.task.id.length * 8 + 16);
                                return (_jsxs("g", { children: [_jsx("path", { className: css.edgePath, "data-dimmed": dimmed, "data-hot": hot, d: path, markerEnd: `url(#at-flow-arrow-${team.teamId})` }), _jsxs("g", { className: css.edgeLabel, "data-dimmed": dimmed, "data-hot": hot, transform: `translate(${(x1 + x2) / 2} ${midY})`, onMouseEnter: () => { focusRequirementOf(edge.task.id); }, onMouseLeave: () => { setFocusedRequirementId(null); }, onFocus: () => { focusRequirementOf(edge.task.id); }, onBlur: () => { setFocusedRequirementId(null); }, role: "button", tabIndex: 0, "aria-label": `需求 ${edge.task.id} 从 ${edge.from} 流转到 ${edge.to}`, children: [_jsx("rect", { className: css.edgeLabelBg, width: labelWidth, height: 20, rx: 10 }), _jsx("text", { className: css.edgeLabelText, x: labelWidth / 2, y: 14, textAnchor: "middle", children: edge.task.id }), _jsx("title", { children: `${edge.task.id} ${edge.task.subject}：${edge.from} → ${edge.to}` })] })] }, edge.id));
                            }), requirements.map((requirement) => {
                                const holder = currentHolderOf(requirement);
                                if (holder === '待认领' || holder === '已收齐')
                                    return null;
                                const rail = railRects.get(requirement.id);
                                const orb = nodeRects.get(holder);
                                if (rail === undefined || orb === undefined || containerRect === null)
                                    return null;
                                const x1 = rail.right - containerRect.left;
                                const y1 = rail.top + rail.height / 2 - containerRect.top;
                                const cx = orb.left + orb.width / 2 - containerRect.left;
                                const cy = orb.top + orb.height / 2 - containerRect.top;
                                const dx = x1 - cx;
                                const dy = y1 - cy;
                                const length = Math.hypot(dx, dy) || 1;
                                const radius = orb.width / 2 - 2;
                                const x2 = cx + (dx / length) * radius;
                                const y2 = cy + (dy / length) * radius;
                                const bend = Math.max(16, Math.abs(x1 - x2) * 0.4);
                                const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
                                const hot = related !== null && related.has(requirement.root.id);
                                const dimmed = related !== null && !hot;
                                return (_jsx("path", { className: css.handlerLink, markerEnd: `url(#at-flow-arrow-${team.teamId})`, "data-hot": hot, "data-dimmed": dimmed, d: path }, `handler:${requirement.id}`));
                            })] })] })] }));
}
export function findConversationTabBar() {
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
        const text = (tab.textContent ?? '').trim();
        if (text === 'Trajectory' || text === '轨迹')
            return tab.parentElement;
    }
    return null;
}
/** The conversation header (tab bar + title row) hosting the tab bar. */
function findConversationHeader(tabBar) {
    let el = tabBar.parentElement;
    while (el !== null && el.tagName !== 'HEADER')
        el = el.parentElement;
    return el;
}
/** The conversation root: the first ancestor tall enough to span the
 * viewport (the header is the same width, so width cannot distinguish
 * them; height can). */
function findConversationRoot(tabBar) {
    const viewportHeight = window.innerHeight;
    let root = tabBar.parentElement;
    while (root !== null && root.getBoundingClientRect().height < viewportHeight * 0.8)
        root = root.parentElement;
    return root;
}
/**
 * The conversation content panel: the root's sibling right after the
 * header's wrapper. Hidden while the board tab is active so the board is a
 * real page switch, not an overlay.
 */
function findContentPanel(root, header) {
    const wrapper = header.parentElement;
    if (wrapper === null)
        return null;
    const content = wrapper.nextElementSibling;
    return content instanceof HTMLElement && root.contains(content) ? content : null;
}
/** The shell's active-tab class (hashed prefix, stable `tabActive` local
 * name) on one tab element, if any. */
function shellActiveTabClass(tab) {
    return [...tab.classList].find((name) => name.endsWith('tabActive'));
}
/** The shell-owned tabs of the conversation tab bar (ours excluded). */
function shellTabsOf(tabBar) {
    return [...tabBar.querySelectorAll('[role="tab"]')]
        .filter((tab) => !tab.classList.contains(BOARD_TAB_CLASS));
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
export function BoardOverlay({ sessionsList, openSession }) {
    const [open, setOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [panelEl, setPanelEl] = useState(null);
    const openRef = useRef(false);
    openRef.current = open;
    /** The shell tab that was active before the board opened (restored on
     * close unless the shell already re-activated a tab itself). */
    const savedActiveRef = useRef(null);
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
    // While the board tab is active, clear the shell tabs' active styles so
    // Chat/Trajectory don't stay highlighted; restore the previously active
    // shell tab on close (unless the shell already re-activated one).
    useEffect(() => {
        const tabBar = findConversationTabBar();
        if (tabBar === null)
            return;
        const shellTabs = shellTabsOf(tabBar);
        if (open) {
            savedActiveRef.current = null;
            for (const tab of shellTabs) {
                const activeClass = shellActiveTabClass(tab);
                if (activeClass !== undefined) {
                    if (savedActiveRef.current === null) {
                        savedActiveRef.current = { text: (tab.textContent ?? '').trim(), cls: activeClass };
                    }
                    tab.classList.remove(activeClass);
                    tab.setAttribute('aria-selected', 'false');
                }
            }
        }
        else {
            const restored = savedActiveRef.current;
            savedActiveRef.current = null;
            if (restored !== null && shellTabs.every((tab) => shellActiveTabClass(tab) === undefined)) {
                const target = shellTabs.find((tab) => (tab.textContent ?? '').trim() === restored.text);
                if (target !== undefined) {
                    target.classList.add(restored.cls);
                    target.setAttribute('aria-selected', 'true');
                }
            }
        }
    }, [open]);
    // Replace the conversation content with the board panel while open.
    useEffect(() => {
        if (!open)
            return;
        const tabBar = findConversationTabBar();
        if (tabBar === null)
            return;
        const root = findConversationRoot(tabBar);
        const header = findConversationHeader(tabBar);
        if (root === null || header === null)
            return;
        const content = findContentPanel(root, header);
        const previousDisplay = content?.style.display;
        if (content !== null)
            content.style.display = 'none';
        let panel = root.querySelector('[data-agent-teams-board-panel]');
        if (panel === null) {
            panel = document.createElement('div');
            panel.dataset.agentTeamsBoardPanel = '';
            root.appendChild(panel);
        }
        setPanelEl(panel);
        return () => {
            if (content !== null && previousDisplay !== undefined)
                content.style.display = previousDisplay;
            const existing = root.querySelector('[data-agent-teams-board-panel]');
            if (existing !== null)
                existing.remove();
            setPanelEl(null);
        };
    }, [open]);
    // Inject the tab, keep it alive across shell re-renders, and close when
    // another conversation tab is picked.
    useEffect(() => {
        if (document.getElementById(BOARD_GLOBAL_STYLE_ID) === null) {
            const style = document.createElement('style');
            style.id = BOARD_GLOBAL_STYLE_ID;
            style.dataset.plugin = 'dsh-agent-teams';
            style.textContent = BOARD_GLOBAL_CSS;
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
                setOpen(true);
            });
            tabBar.appendChild(tab);
        };
        const onCaptureClick = (event) => {
            const target = event.target;
            const tab = target?.closest('[role="tab"]');
            if (tab !== null && tab !== undefined && !tab.classList.contains(BOARD_TAB_CLASS)) {
                setOpen(false);
            }
        };
        ensureTab();
        const observer = new MutationObserver(() => {
            ensureTab();
            // A shell re-render may have dropped the board panel while the tab is
            // active; re-apply the page switch (and clear any shell tab active
            // style the re-render restored).
            if (openRef.current) {
                const tabBar = findConversationTabBar();
                if (tabBar !== null) {
                    for (const tab of shellTabsOf(tabBar)) {
                        const activeClass = shellActiveTabClass(tab);
                        if (activeClass !== undefined)
                            tab.classList.remove(activeClass);
                    }
                    const root = findConversationRoot(tabBar);
                    const header = findConversationHeader(tabBar);
                    if (root !== null && header !== null) {
                        const content = findContentPanel(root, header);
                        if (content !== null)
                            content.style.display = 'none';
                        let panel = root.querySelector('[data-agent-teams-board-panel]');
                        if (panel === null) {
                            panel = document.createElement('div');
                            panel.dataset.agentTeamsBoardPanel = '';
                            root.appendChild(panel);
                        }
                        setPanelEl(panel);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
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
    const visibleTeams = current === undefined ? [] : teams.filter((team) => teamVisibleTo(team, current));
    if (!open || panelEl === null || visibleTeams.length === 0)
        return null;
    return createPortal(_jsx(_Fragment, { children: visibleTeams.map((team) => (_jsx(FlowBoard, { team: team, onNavigate: (id) => { openSession(id); } }, team.teamId))) }), panelEl);
}
