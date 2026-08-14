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
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Handle, MarkerType, Position, ReactFlow } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { accentOf, dependencyLabel, memberInitial, memberStateLabel, memberStatusText, taskTone, teamVisibleTo, } from "./activity-ui.js";
import { memberArtUrl } from "./artwork.js";
import reactFlowCss from '\0dsh-react-flow-css';
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
/** Liang–Barsky: does segment (x1,y1)-(x2,y2) intersect the box? */
function segmentHitsBox(x1, y1, x2, y2, box) {
    let t0 = 0;
    let t1 = 1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - box.left, box.right - x1, y1 - box.top, box.bottom - y1];
    for (let i = 0; i < 4; i++) {
        const pi = p[i] ?? 0;
        const qi = q[i] ?? 0;
        if (pi === 0) {
            if (qi < 0)
                return false;
        }
        else {
            const r = qi / pi;
            if (pi < 0) {
                if (r > t1)
                    return false;
                if (r > t0)
                    t0 = r;
            }
            else {
                if (r < t0)
                    return false;
                if (r < t1)
                    t1 = r;
            }
        }
    }
    return true;
}
/**
 * Route a connection so it never crosses another node: use the direct
 * cubic when clear; otherwise detour through the first free horizontal
 * channel above or below all obstacles (three-segment path).
 */
function routeConnection(x1, y1, x2, y2, obstacles, bend) {
    if (!obstacles.some((box) => segmentHitsBox(x1, y1, x2, y2, box))) {
        return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
    }
    const channelFree = (cy) => !obstacles.some((box) => segmentHitsBox(x1, y1, x1, cy, box)
        || segmentHitsBox(x1, cy, x2, cy, box)
        || segmentHitsBox(x2, cy, x2, y2, box));
    // Candidate channels: just above/below the endpoints, plus every obstacle
    // edge (row gaps between nodes are the natural corridors).
    const candidates = [Math.min(y1, y2) - 46, Math.max(y1, y2) + 46];
    for (const box of obstacles) {
        candidates.push(box.top - 20, box.bottom + 20);
    }
    const midY = (y1 + y2) / 2;
    const channel = [...new Set(candidates)]
        .filter((cy) => cy >= 6)
        .sort((a, b) => Math.abs(a - midY) - Math.abs(b - midY))
        .find((cy) => channelFree(cy));
    if (channel !== undefined) {
        return `M ${x1} ${y1} L ${x1} ${channel} L ${x2} ${channel} L ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}
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
/** Custom node renderer: the worker orb (big ball with requirement orbs). */
function WorkerOrbNode({ data }) {
    return (_jsxs("div", { className: css.nodeWrap, children: [_jsx(Handle, { type: "target", position: Position.Left, className: css.nodeHandle }), _jsx(WorkerNode, { member: data.member, tasks: data.tasks, focusedRelated: data.focusedRelated, onFocus: data.onFocus, onBlur: data.onBlur, onNavigate: data.onNavigate }), _jsx(Handle, { type: "source", position: Position.Right, className: css.nodeHandle })] }));
}
/** Stable node type registry (React Flow requires a constant reference). */
const workerOrbNodeTypes = { workerOrb: WorkerOrbNode };
/** Node box used by the dagre layout (orb + name + meta below). */
const ORB_NODE_WIDTH = 148;
const ORB_NODE_HEIGHT = 200;
/**
 * Left-to-right dagre layout: workers with flow relationships land in
 * adjacent columns, so requirement edges run between columns and never
 * cross another worker orb.
 */
function layoutWorkerOrbs(team) {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 150, marginx: 0, marginy: 0 });
    graph.setDefaultEdgeLabel(() => ({}));
    for (const member of team.members) {
        graph.setNode(member.name, { width: ORB_NODE_WIDTH, height: ORB_NODE_HEIGHT });
    }
    for (const edge of buildEdges(team.tasks)) {
        if (!graph.hasEdge(edge.from, edge.to))
            graph.setEdge(edge.from, edge.to);
    }
    dagre.layout(graph);
    const positions = new Map();
    for (const member of team.members) {
        const node = graph.node(member.name);
        positions.set(member.name, {
            x: node.x - ORB_NODE_WIDTH / 2,
            y: node.y - ORB_NODE_HEIGHT / 2,
        });
    }
    return positions;
}
/**
 * Board content for one team: worker orbs laid out by dagre and rendered
 * with React Flow; requirement edges run between adjacent columns with
 * arrow markers; hovering a requirement (rail item or nested orb)
 * highlights its whole flow path.
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
    const blur = useCallback(() => { setFocusedRequirementId(null); }, []);
    const related = useMemo(() => {
        if (focusedRequirementId === null)
            return null;
        const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId);
        return requirement === undefined ? null : new Set(requirement.stages.map((stage) => stage.id));
    }, [focusedRequirementId, requirements]);
    const completedCount = team.tasks.filter((task) => task.status === 'completed').length;
    const positions = useMemo(() => layoutWorkerOrbs(team), [team]);
    const nodes = useMemo(() => team.members.map((member) => ({
        id: member.name,
        type: 'workerOrb',
        position: positions.get(member.name) ?? { x: 0, y: 0 },
        data: {
            member,
            tasks: team.tasks,
            focusedRelated: related,
            onFocus: focusRequirementOf,
            onBlur: blur,
            onNavigate,
        },
    })), [team.members, team.tasks, positions, related, blur, onNavigate]);
    const edges = useMemo(() => buildEdges(team.tasks).map((edge) => {
        const hot = related !== null && related.has(edge.task.id) && related.has(edge.dep.id);
        const dimmed = related !== null && !hot;
        return {
            id: edge.id,
            source: edge.from,
            target: edge.to,
            type: 'default',
            label: edge.task.id,
            labelStyle: { fill: 'var(--dsw-alias-label-secondary)', fontWeight: 600, fontSize: 10 },
            labelBgStyle: { fill: 'var(--dsw-alias-bg-base)', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1 },
            labelBgPadding: [4, 3],
            labelBgBorderRadius: 8,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: hot ? 'var(--dsw-alias-state-business-primary)' : 'var(--dsw-alias-label-secondary)',
            },
            style: {
                stroke: hot ? 'var(--dsw-alias-state-business-primary)' : 'var(--dsw-alias-label-secondary)',
                strokeWidth: hot ? 2.5 : 1.5,
                opacity: dimmed ? 0.12 : hot ? 1 : 0.7,
            },
        };
    }), [team.tasks, related]);
    return (_jsxs("section", { className: css.board, "data-board": true, "data-team-id": team.teamId, children: [_jsxs("header", { className: css.boardHead, children: [_jsx("span", { className: css.teamName, title: team.name, children: team.name }), _jsxs("span", { className: css.teamStats, children: [_jsxs("span", { "data-stat": "members", children: [team.members.length, " \u6210\u5458"] }), _jsxs("span", { "data-stat": "tasks", children: [completedCount, "/", team.tasks.length, " \u5B8C\u6210"] }), _jsxs("span", { "data-stat": "messages", children: [team.messageCount, " \u6D88\u606F"] })] })] }), _jsxs("div", { className: css.boardLayout, children: [_jsx(RequirementRail, { requirements: requirements, focusedRequirementId: focusedRequirementId, related: related, onFocus: setFocusedRequirementId, onBlur: blur }), _jsx("div", { className: css.flowArea, children: _jsx(ReactFlow, { nodes: nodes, edges: edges, nodeTypes: workerOrbNodeTypes, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, panOnDrag: false, zoomOnScroll: false, zoomOnPinch: false, zoomOnDoubleClick: false, fitView: true, fitViewOptions: { padding: 0.12 }, minZoom: 0.5, maxZoom: 2, proOptions: { hideAttribution: false }, className: css.flowCanvas }) })] })] }));
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
            style.textContent = BOARD_GLOBAL_CSS + "\n" + reactFlowCss;
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
