window.__ModuleLoader__.load({
	id: "dsh-agent-teams",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		let react = require("react");
		react = __toESM(react, 1);
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_dom = require("react-dom");
		//#region lib/client/activity-ui.js
		/**
		* Shared UI vocabulary for the AgentTeams activity panel and the task board.
		* @module dsh-agent-teams/client/activity-ui
		*/
		/**
		* Whether a session may view a team: its captain or one of its active
		* members. Removed members are already filtered out of the snapshot, so
		* they never match here.
		*/
		function teamVisibleTo(team, sessionId) {
			if (sessionId === void 0) return false;
			return team.captainSessionId === sessionId || team.members.some((member) => member.id === sessionId);
		}
		/** Initial-letter fallback for unmatched roles. */
		function memberInitial(name) {
			return name.trim().slice(0, 1).toUpperCase() || "?";
		}
		function stableHash(value) {
			let hash = 0;
			for (let index = 0; index < value.length; index += 1) hash = (hash << 5) - hash + value.charCodeAt(index) | 0;
			return Math.abs(hash);
		}
		const ACCENTS = [
			"var(--dsw-alias-state-business-primary)",
			"var(--dsw-alias-state-success)",
			"var(--dsw-alias-state-danger)",
			"var(--dsw-alias-state-warning)",
			"var(--dsw-alias-label-tertiary)"
		];
		function accentOf(id) {
			return ACCENTS[stableHash(id) % ACCENTS.length] ?? ACCENTS[0];
		}
		/** Badge text follows the raw task status (finer than the 4 visual states):
		* claimed/pending/failed/cancelled keep their own labels and colors. */
		const TASK_STATUS_LABEL = {
			pending: "待领取",
			claimed: "已认领",
			in_progress: "进行中",
			completed: "已完成",
			failed: "失败",
			cancelled: "已取消"
		};
		function taskStatusLabel(status) {
			return TASK_STATUS_LABEL[status] ?? status;
		}
		/** Badge/bar coloring key: visual state, widened for terminal statuses. */
		function taskTone(state, status) {
			if (status === "failed") return "failed";
			if (status === "cancelled") return "cancelled";
			return state;
		}
		function memberDotState(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return "ongoing";
			if (owned.some((task) => task.status === "failed")) return "error";
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return "done";
			return "warning";
		}
		function memberStateLabel(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			if (member.activity === "working") return "工作中";
			if (owned.some((task) => task.status === "failed")) return "有失败";
			if (owned.some((task) => task.state === "blocked")) return "等待";
			if (owned.length > 0 && owned.every((task) => task.status === "completed")) return "已交付";
			if (owned.length > 0) return "待执行";
			return "待派工";
		}
		function memberStatusText(member, tasks) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			const current = owned.find((task) => task.id === member.currentTask);
			const blocked = owned.find((task) => task.state === "blocked");
			if (member.activity === "working" && current !== void 0) return `正在执行 ${current.id}`;
			if (member.activity === "working") return "正在处理已派任务";
			if (blocked !== void 0) {
				const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== "completed");
				if (dependency !== void 0) return `等待 ${dependency.id} · ${dependency.assignee || "待认领"}`;
				return "等待前置任务";
			}
			if (member.total === 0) return "等待队长派工";
			if (member.done === member.total) return "任务已交付";
			return member.activity === "idle" ? "待继续执行" : "状态未知";
		}
		function dependencyLabel(task, tasks) {
			return task.dependencies.map((id) => {
				const dependency = tasks.find((candidate) => candidate.id === id);
				return dependency?.assignee ? `${id}·${dependency.assignee}` : id;
			}).join("、");
		}
		//#endregion
		//#region lib/client/activity-model.js
		/** Pure relationship projections used by the AgentTeams activity panel. */
		/**
		* Whether an expanded activity panel still belongs to the current session.
		*
		* The panel is mounted through a body portal, so React does not remount it
		* when the conversation route changes. Ownership keeps an expanded panel
		* from leaking onto the new-session screen (or another conversation) while
		* its local open state is being reset.
		*/
		function activityPanelExpandedForSession(open, owner, current) {
			return open && owner !== void 0 && owner === current;
		}
		/** Group tasks by their precomputed dependency depth. */
		function taskStages(tasks) {
			const byDepth = /* @__PURE__ */ new Map();
			for (const task of tasks) {
				const depth = Number.isFinite(task.depth) ? Math.max(0, Math.floor(task.depth)) : 0;
				const stage = byDepth.get(depth) ?? [];
				stage.push(task);
				byDepth.set(depth, stage);
			}
			return [...byDepth.entries()].sort(([left], [right]) => left - right).map(([depth, stageTasks]) => ({
				depth,
				tasks: stageTasks.slice().sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }))
			}));
		}
		/**
		* Return the complete upstream/downstream chain around one task.
		*
		* Traversal uses both dependency directions and remains cycle-safe, so the UI
		* can highlight every handoff related to the focused task even if malformed
		* durable data contains a cycle.
		*/
		function relatedTaskIds(taskId, tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			if (!byId.has(taskId)) return /* @__PURE__ */ new Set();
			const dependents = /* @__PURE__ */ new Map();
			for (const task of tasks) for (const dependency of task.dependencies) {
				const targets = dependents.get(dependency) ?? [];
				targets.push(task.id);
				dependents.set(dependency, targets);
			}
			const related = /* @__PURE__ */ new Set();
			const upstreamSeen = /* @__PURE__ */ new Set();
			const downstreamSeen = /* @__PURE__ */ new Set();
			const visitUpstream = (id) => {
				if (upstreamSeen.has(id)) return;
				upstreamSeen.add(id);
				related.add(id);
				for (const dependency of byId.get(id)?.dependencies ?? []) visitUpstream(dependency);
			};
			const visitDownstream = (id) => {
				if (downstreamSeen.has(id)) return;
				downstreamSeen.add(id);
				related.add(id);
				for (const dependent of dependents.get(id) ?? []) visitDownstream(dependent);
			};
			visitUpstream(taskId);
			visitDownstream(taskId);
			return related;
		}
		//#endregion
		//#region lib/client/artwork.js
		/**
		* Shared whale artwork lookup for the activity panel and the conversation
		* card: role keywords map to the packaged role images; the captain always
		* uses the lead whale.
		* @module dsh-agent-teams/client/artwork
		*/
		/** Artwork route prefix served by the plugin host half. */
		const ART_BASE = "/plugins/dsh-agent-teams/assets/";
		/** Whale role artwork per role keyword. */
		const ROLE_ART = [
			[/resear|analys|investig|explor|data|study|研究|分析|数据|调查|探索|调研/, "researcher.png"],
			[/engineer|dev\b|server|backend|\bapi\b|runtime|watcher|contract|工程|后端|服务|接口|开发|代码|编程/, "engineer.png"],
			[/\bqa\b|test|verif|quality|测试|质量/, "qa-engineer.png"],
			[/design|\bui\b|\bux\b|front|theme|accessib|设计|前端|主题/, "designer.png"],
			[/secur|audit|risk|threat|review|安全|审计|审查|风险/, "security-reviewer.png"],
			[/docs|writer|product|spec|coordin|撰写|文案|写作|文档|协调/, "docs-coordinator.png"],
			[/release|\bbuild\b|deploy|\bops\b|\bci\b|ship|发布|构建|部署/, "engineer.png"]
		];
		/** Captain artwork (always the lead whale). */
		const LEAD_ART = `${ART_BASE}team-lead.png`;
		/** Status action artwork per member activity. */
		const ACTION_ART = {
			working: `${ART_BASE}action-working.png`,
			idle: `${ART_BASE}action-sleeping.png`,
			unknown: `${ART_BASE}action-thinking.png`
		};
		/**
		* Member artwork URL, or null when no role matches (initial-letter fallback).
		* @param name - the member's display name.
		* @param role - the member's role text.
		* @returns the artwork URL, or null when unmatched.
		*/
		function memberArtUrl(name, role) {
			const identity = `${name} ${role}`.toLowerCase();
			for (const [pattern, art] of ROLE_ART) if (pattern.test(identity)) return `${ART_BASE}${art}`;
			return null;
		}
		//#endregion
		//#region \0dsh-css:/Users/nanmi/workspace/myself_code/dsh-agent-teams/src/client/AgentTeamsCard.module.css.mjs
		const css$3 = "._6Ci0pW_root{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:10px;flex-direction:column;gap:8px;width:100%;min-width:0;padding:10px 12px;display:flex}._6Ci0pW_head{align-items:center;gap:8px;min-width:0;display:flex}._6Ci0pW_leadAvatar{border:1px solid var(--dsw-alias-border-l3);object-fit:cover;background:#0b1d33;border-radius:50%;flex:none;width:24px;height:24px}._6Ci0pW_teamName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:0 auto;font-size:13px;font-weight:600;line-height:20px;overflow:hidden}._6Ci0pW_memberCount{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;margin-left:auto;font-size:11px;line-height:16px}._6Ci0pW_panelButton{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;flex:none;padding:2px 8px;font-size:10.5px;font-weight:600;line-height:16px;transition:border-color .12s,color .12s}._6Ci0pW_panelButton:hover{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}._6Ci0pW_panelButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._6Ci0pW_members{flex-wrap:wrap;gap:6px;min-width:0;display:flex}._6Ci0pW_member{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);max-width:160px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:5px;padding:3px 8px 3px 3px;font-size:11px;font-weight:500;line-height:16px;transition:border-color .12s,background-color .12s;display:inline-flex}._6Ci0pW_member:hover{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-markdown-tag)}._6Ci0pW_member:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._6Ci0pW_memberArt{border:1px solid var(--dsw-alias-border-l3);object-fit:cover;background:#0b1d33;border-radius:50%;width:20px;height:20px}._6Ci0pW_memberInitial{background:var(--dsw-alias-state-business-tertiary);width:20px;height:20px;color:var(--dsw-alias-label-primary-foreground);border-radius:50%;justify-content:center;align-items:center;font-size:10px;font-weight:600;line-height:20px;display:inline-flex}._6Ci0pW_memberName{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}";
		const tagId$2 = "dsh-agent-teams/AgentTeamsCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-agent-teams";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var AgentTeamsCard_module_css_default = {
			"memberCount": "_6Ci0pW_memberCount",
			"members": "_6Ci0pW_members",
			"memberName": "_6Ci0pW_memberName",
			"head": "_6Ci0pW_head",
			"root": "_6Ci0pW_root",
			"panelButton": "_6Ci0pW_panelButton",
			"member": "_6Ci0pW_member",
			"memberInitial": "_6Ci0pW_memberInitial",
			"teamName": "_6Ci0pW_teamName",
			"leadAvatar": "_6Ci0pW_leadAvatar",
			"memberArt": "_6Ci0pW_memberArt"
		};
		//#endregion
		//#region lib/client/AgentTeamsCard.js
		/**
		* AgentTeams conversation card: the lightweight in-conversation summary for
		* one team — the captain's whale avatar and name, the member roster as
		* clickable whale avatars (opening the member's subagent transcript), and
		* an "activity panel" button that re-activates the top-right floater.
		*
		* The floater and this card share the `agent-teams:open-panel` window event
		* so the card can summon the panel even after it was closed (or when an old
		* session is re-opened for review).
		* @module dsh-agent-teams/client/card
		*/
		/** Window event name the floater listens for to open itself. */
		const OPEN_PANEL_EVENT = "agent-teams:open-panel";
		/** Re-activate the top-right activity panel, carrying this team's summary
		* so the panel can show it even when the team no longer exists on disk
		* (historical session review). */
		function openActivityPanel(data) {
			window.dispatchEvent(new CustomEvent(OPEN_PANEL_EVENT, { detail: {
				teamId: data.teamId,
				captainSessionId: data.captainSessionId,
				teamName: data.teamName,
				members: data.members
			} }));
		}
		/** Render one durable team as a compact conversation card. */
		function AgentTeamsCard({ node, openSession, currentSessionId }) {
			const data = node.data;
			const owner = data.captainSessionId || currentSessionId() || "";
			const [snapshot, setSnapshot] = (0, react.useState)();
			(0, react.useEffect)(() => {
				let cancelled = false;
				const tick = async () => {
					for (const url of ["/plugins/dsh-agent-teams/state", "/plugins/dsh-agent-teams/state?archived=1"]) try {
						const response = await fetch(url, { cache: "no-store" });
						if (!response.ok) continue;
						const body = await response.json();
						const found = Array.isArray(body.teams) ? body.teams.find((team) => team.teamId === data.teamId && (owner === "" || team.captainSessionId === owner)) : void 0;
						if (found !== void 0) {
							if (!cancelled) setSnapshot(found);
							return;
						}
					} catch {}
				};
				tick();
				const timer = setInterval(() => {
					tick();
				}, 1500);
				return () => {
					cancelled = true;
					clearInterval(timer);
				};
			}, [data.teamId, owner]);
			const resolved = (0, react.useMemo)(() => ({
				...data,
				captainSessionId: snapshot?.captainSessionId ?? owner,
				teamName: snapshot?.name ?? data.teamName,
				members: snapshot?.members.map((member) => ({
					id: member.id,
					name: member.name,
					role: member.role
				})) ?? data.members
			}), [
				data,
				owner,
				snapshot
			]);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: AgentTeamsCard_module_css_default.root,
				"data-agent-teams-card": true,
				"data-team-id": resolved.teamId,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: AgentTeamsCard_module_css_default.head,
					children: [
						(0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.leadAvatar,
							src: LEAD_ART,
							alt: "",
							"aria-hidden": true
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.teamName,
							title: resolved.teamName,
							children: resolved.teamName
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: AgentTeamsCard_module_css_default.memberCount,
							children: [resolved.members.length, " 名成员"]
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: AgentTeamsCard_module_css_default.panelButton,
							onClick: () => {
								openActivityPanel(resolved);
							},
							"aria-label": "打开活动面板",
							title: "打开活动面板",
							children: "活动面板"
						})
					]
				}), resolved.members.length > 0 && (0, react_jsx_runtime.jsx)("div", {
					className: AgentTeamsCard_module_css_default.members,
					children: resolved.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: AgentTeamsCard_module_css_default.member,
						onClick: () => {
							if (member.id !== "") openSession(member.id);
						},
						title: member.role === "" ? member.name : `${member.name} · ${member.role}`,
						children: [memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
							className: AgentTeamsCard_module_css_default.memberArt,
							src: memberArtUrl(member.name, member.role) ?? "",
							alt: "",
							"aria-hidden": true
						}) : (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberInitial,
							children: member.name.trim().slice(0, 1).toUpperCase() || "?"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: AgentTeamsCard_module_css_default.memberName,
							children: member.name
						})]
					}, member.id))
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/nanmi/workspace/myself_code/dsh-agent-teams/src/client/ActivityPanel.module.css.mjs
		const css$2 = "html{--agent-teams-panel-width:388px;--agent-teams-panel-right:calc(18px + var(--dsh-sidebar-width,0px));--agent-teams-panel-gap:14px;--agent-teams-panel-shift:calc(var(--agent-teams-panel-width) + 18px + var(--agent-teams-panel-gap))}.qZToFW_badge{top:64px;right:var(--agent-teams-panel-right);z-index:2147483000;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 92%, transparent);backdrop-filter:blur(16px);height:34px;box-shadow:0 8px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:7px;padding:0 12px;font-size:12px;font-weight:600;line-height:20px;transition:border-color .15s,transform .12s;display:inline-flex;position:fixed}.qZToFW_badge:hover{border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}.qZToFW_badge:active{transform:translateY(0)scale(.98)}.qZToFW_badge:focus-visible,.qZToFW_closeButton:focus-visible,.qZToFW_memberRow:focus-visible,.qZToFW_taskNode:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.qZToFW_badgeDot,.qZToFW_panelDot{background:var(--dsw-alias-label-tertiary);border-radius:50%;width:7px;height:7px}.qZToFW_badgeDot[data-busy=true],.qZToFW_panelDot[data-busy=true]{background:var(--dsw-alias-state-business-primary);animation:1.25s ease-in-out infinite qZToFW_agentTeamsPulse}.qZToFW_badgeCount,.qZToFW_memberCount,.qZToFW_teamStats,.qZToFW_stageLabel,.qZToFW_taskId{font-variant-numeric:tabular-nums}.qZToFW_panel{top:64px;right:var(--agent-teams-panel-right);z-index:2147483000;width:min(var(--agent-teams-panel-width), calc(100vw - 24px));box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l3) 58%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-module-platform) 95%, transparent);backdrop-filter:blur(20px)saturate(1.08);max-height:70dvh;box-shadow:0 12px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent), 0 32px 72px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);border-radius:16px;flex-direction:column;animation:.18s ease-out qZToFW_agentTeamsPanelIn;display:flex;position:fixed;overflow:hidden}@keyframes qZToFW_agentTeamsPanelIn{0%{opacity:0;transform:translateY(-6px)scale(.99)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes qZToFW_agentTeamsPulse{0%,to{opacity:.42}50%{opacity:1}}.qZToFW_panelHead{border-bottom:1px solid var(--dsw-alias-border-l2);flex:none;justify-content:space-between;align-items:center;min-height:44px;padding:0 14px 0 16px;display:flex}.qZToFW_panelTitle{color:var(--dsw-alias-label-primary);align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.qZToFW_closeButton{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:7px;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,transform .12s;display:inline-flex}.qZToFW_closeButton:hover{background:var(--dsw-alias-markdown-tag);color:var(--dsw-alias-label-primary)}.qZToFW_closeButton:active{transform:scale(.94)}.qZToFW_teams{overscroll-behavior:contain;flex-direction:column;min-height:0;display:flex;overflow-y:auto}.qZToFW_team{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:12px;padding:12px 14px 16px;display:flex}.qZToFW_team:last-child{border-bottom:0}.qZToFW_teamHead{align-items:center;gap:10px;min-width:0;display:flex}.qZToFW_teamName{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;font-weight:600;line-height:18px;overflow:hidden}.qZToFW_teamStats{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;gap:8px;font-size:10.5px;line-height:16px;display:inline-flex}.qZToFW_sectionHead{justify-content:space-between;align-items:center;gap:8px;min-width:0;display:flex}.qZToFW_sectionTitle{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:11px;font-weight:600;line-height:16px;display:inline-flex}.qZToFW_sectionHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.qZToFW_delegationSection{min-width:0}.qZToFW_captainNode{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-layer-1));width:100%;min-width:0;min-height:48px;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:10px;grid-template-columns:38px minmax(0,1fr) auto auto;align-items:center;gap:9px;padding:8px 10px;transition:background-color .12s;display:grid}.qZToFW_captainNode:hover{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, var(--dsw-alias-bg-layer-1))}.qZToFW_captainChevron{color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;transition:color .12s,transform .12s;display:inline-flex}.qZToFW_captainNode:hover .qZToFW_captainChevron{color:var(--dsw-alias-state-business-primary);transform:translate(1px)}.qZToFW_captainAvatar,.qZToFW_memberAvatar{flex:none;justify-content:center;align-items:center;display:inline-flex;position:relative}.qZToFW_captainAvatar{width:36px;height:36px}.qZToFW_leadAvatar,.qZToFW_memberArt,.qZToFW_memberInitial{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l3);object-fit:cover;background:#0b1d33;border-radius:50%;width:34px;height:34px}.qZToFW_captainInfo,.qZToFW_memberInfo{flex-direction:column;min-width:0;display:flex}.qZToFW_captainInfo{gap:2px}.qZToFW_captainLine,.qZToFW_memberLine{align-items:center;gap:6px;min-width:0;display:flex}.qZToFW_captainName,.qZToFW_memberName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600;line-height:18px;overflow:hidden}.qZToFW_captainRole,.qZToFW_memberRole{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.qZToFW_captainSummary,.qZToFW_memberStatusLine{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:15px;overflow:hidden}.qZToFW_captainState,.qZToFW_memberState{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;align-items:center;gap:5px;font-size:10px;font-weight:500;line-height:15px;display:inline-flex}.qZToFW_captainState[data-busy=true],.qZToFW_memberState[data-activity=working]{color:var(--dsw-alias-state-business-primary)}.qZToFW_delegationTree{flex-direction:column;gap:2px;margin-left:18px;padding:9px 0 0 20px;display:flex;position:relative}.qZToFW_delegationTree:before{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));content:\"\";width:1px;position:absolute;top:0;bottom:22px;left:0}.qZToFW_memberBlock{flex-direction:column;min-width:0;padding:3px 0 7px;display:flex;position:relative}.qZToFW_memberBranch{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));width:20px;height:1px;display:block;position:absolute;top:23px;right:100%}.qZToFW_memberBranch:before{background:var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;width:5px;height:5px;position:absolute;top:-2px;right:-1px}.qZToFW_memberRow{box-sizing:border-box;width:100%;min-width:0;min-height:44px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px;transition:background-color .12s,transform .12s;display:grid}.qZToFW_memberRow:hover,.qZToFW_memberRow[data-activity=working]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1))}.qZToFW_memberRow:active{transform:scale(.995)}.qZToFW_memberAvatar{width:34px;height:34px}.qZToFW_memberAvatar[data-unread=true]:after{border:1px solid var(--dsw-alias-state-business-primary);content:\"\";border-radius:50%;animation:1.5s ease-out infinite qZToFW_agentTeamsRing;position:absolute;inset:-3px}@keyframes qZToFW_agentTeamsRing{0%{opacity:.82;transform:scale(.94)}75%,to{opacity:0;transform:scale(1.18)}}.qZToFW_memberInitial{color:var(--dsw-alias-label-primary-foreground);justify-content:center;align-items:center;font-size:14px;font-weight:600;line-height:20px;display:inline-flex}.qZToFW_stateArt{box-sizing:border-box;border:2px solid var(--dsw-alias-bg-module-platform);object-fit:cover;background:#0b1d33;border-radius:50%;width:19px;height:19px;position:absolute;bottom:-4px;right:-4px}.qZToFW_stateArt[data-activity=working]{animation:2.4s ease-in-out infinite qZToFW_agentTeamsFloat}.qZToFW_stateArt[data-activity=idle]{animation:4.2s ease-in-out infinite qZToFW_agentTeamsBreathe}.qZToFW_stateArt[data-activity=unknown]{animation:2.8s ease-in-out infinite qZToFW_agentTeamsThink}@keyframes qZToFW_agentTeamsFloat{0%,to{transform:translateY(0)rotate(-4deg)}50%{transform:translateY(-2px)rotate(4deg)}}@keyframes qZToFW_agentTeamsBreathe{0%,to{opacity:.82;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}@keyframes qZToFW_agentTeamsThink{0%,to{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}.qZToFW_memberState{margin-left:auto}.qZToFW_memberCount{color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:16px}.qZToFW_assignmentLine{align-items:center;gap:7px;min-width:0;padding:0 6px 0 52px;display:flex}.qZToFW_assignmentLabel{color:var(--dsw-alias-label-tertiary);flex:none;font-size:9.5px;line-height:14px}.qZToFW_assignmentTasks{flex-wrap:wrap;flex:1;gap:4px;min-width:0;display:flex}.qZToFW_assignmentChip{background:var(--dsw-alias-markdown-tag);min-height:16px;color:var(--dsw-alias-label-secondary);border-radius:4px;align-items:center;padding:0 5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;font-weight:600;line-height:14px;display:inline-flex}.qZToFW_assignmentChip[data-state=running]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_assignmentChip[data-state=completed]{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_assignmentChip[data-state=blocked]{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_assignmentChip[data-state=failed]{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, var(--dsw-alias-bg-base));color:var(--dsw-alias-label-primary-foreground)}.qZToFW_assignmentChip[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}.qZToFW_unreadPill{color:var(--dsw-alias-state-business-primary);white-space:nowrap;flex:none;font-size:9.5px;font-weight:600;line-height:14px}.qZToFW_taskEmpty{color:var(--dsw-alias-label-tertiary);font-size:9.5px;line-height:14px}.qZToFW_dependencySection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:7px;min-width:0;padding-top:10px;display:flex}.qZToFW_stageFlow{scrollbar-width:thin;align-items:stretch;gap:0;min-width:0;padding:1px 1px 5px;display:flex;overflow-x:auto}.qZToFW_stageGroup{flex:1 0 126px;min-width:126px;display:flex;position:relative}.qZToFW_stageConnector{width:22px;height:14px;color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;margin-top:0;display:flex}.qZToFW_stageLine{background:var(--dsw-alias-border-l3);flex:1;height:1px;display:block}.qZToFW_stageColumn{flex-direction:column;flex:1;gap:5px;min-width:0;display:flex}.qZToFW_stageLabel{color:var(--dsw-alias-label-tertiary);justify-content:space-between;align-items:center;gap:6px;padding:0 2px;font-size:9.5px;font-weight:600;line-height:14px;display:flex}.qZToFW_stageLabel span{background:var(--dsw-alias-markdown-tag);border-radius:4px;justify-content:center;align-items:center;min-width:14px;height:14px;font-size:8.5px;display:inline-flex}.qZToFW_stageTasks{flex-direction:column;gap:5px;display:flex}.qZToFW_taskNode{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:0;min-height:72px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;border-radius:8px;flex-direction:column;gap:4px;padding:7px 8px;transition:border-color .14s,opacity .14s,transform .12s,background-color .14s;display:flex}.qZToFW_taskNode:hover,.qZToFW_taskNode[data-focused=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, var(--dsw-alias-bg-layer-1));transform:translateY(-1px)}.qZToFW_taskNode[data-dimmed=true]{opacity:.34}.qZToFW_taskNode[data-state=completed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 48%, var(--dsw-alias-border-l2))}.qZToFW_taskNode[data-state=blocked]{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 52%, var(--dsw-alias-border-l2))}.qZToFW_taskNode[data-state=failed]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 56%, var(--dsw-alias-border-l2))}.qZToFW_taskNodeHead,.qZToFW_taskRoute{justify-content:space-between;align-items:center;gap:5px;min-width:0;display:flex}.qZToFW_taskId{color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;font-weight:700}.qZToFW_taskBadge{background:var(--dsw-alias-markdown-tag);min-height:14px;color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;align-items:center;padding:0 4px;font-size:8.5px;font-weight:600;line-height:13px;display:inline-flex}.qZToFW_taskBadge[data-state=running]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_taskBadge[data-state=completed]{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_taskBadge[data-state=blocked]{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-label-primary-foreground)}.qZToFW_taskBadge[data-state=failed]{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, var(--dsw-alias-bg-base));color:var(--dsw-alias-label-primary-foreground)}.qZToFW_taskBadge[data-state=cancelled]{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}.qZToFW_taskSubject{min-height:30px;color:var(--dsw-alias-label-primary);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:10.5px;font-weight:500;line-height:15px;display:-webkit-box;overflow:hidden}.qZToFW_taskRoute{color:var(--dsw-alias-label-tertiary);margin-top:auto;font-size:8.5px;line-height:13px}.qZToFW_taskOwner,.qZToFW_taskDeps{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.qZToFW_taskOwner{max-width:48%;color:var(--dsw-alias-label-secondary);font-weight:600}.qZToFW_taskDeps{text-align:right;flex:1}.qZToFW_taskStart{color:var(--dsw-alias-label-tertiary)}.qZToFW_unclaimed,.qZToFW_inbox{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:5px;min-width:0;padding-top:10px;display:flex}.qZToFW_unclaimedTitle{color:var(--dsw-alias-label-secondary);font-size:10.5px;font-weight:600;line-height:15px}.qZToFW_inboxRow{border-radius:6px;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:8px;min-width:0;min-height:24px;padding:2px 5px;display:grid}.qZToFW_inboxRow:hover{background:var(--dsw-alias-bg-layer-1)}.qZToFW_inboxRoute{min-width:0;color:var(--dsw-alias-state-business-primary);text-overflow:ellipsis;white-space:nowrap;align-items:center;gap:3px;font-size:9.5px;font-weight:600;line-height:14px;display:inline-flex;overflow:hidden}.qZToFW_inboxContent{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}.qZToFW_emptyHint{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:11px;line-height:16px}.qZToFW_team[data-historic],.qZToFW_archivedWrap{opacity:.82}.qZToFW_historicPill{background:var(--dsw-alias-markdown-tag);color:var(--dsw-alias-label-tertiary);border-radius:4px;flex:none;margin-left:auto;padding:1px 7px;font-size:9.5px;font-weight:600;line-height:15px}.qZToFW_members{flex-direction:column;gap:3px;display:flex}.qZToFW_archivedWrap:before{color:var(--dsw-alias-label-tertiary);content:\"已结束 · 历史归档\";padding:5px 14px 0;font-size:9.5px;font-weight:600;line-height:14px;display:block}@media (prefers-reduced-motion:reduce){[data-phase=active],.qZToFW_panel,.qZToFW_badge,.qZToFW_badgeDot,.qZToFW_panelDot,.qZToFW_stateArt,.qZToFW_memberAvatar[data-unread=true]:after{transition:none;animation:none}}@media (width<=640px){html{--agent-teams-panel-right:calc(10px + var(--dsh-sidebar-width,0px))}.qZToFW_panel{width:auto;max-height:calc(100dvh - 68px);top:56px;left:10px}.qZToFW_badge{top:56px}.qZToFW_teamStats span[data-stat=messages]{display:none}.qZToFW_captainNode{grid-template-columns:38px minmax(0,1fr) auto}.qZToFW_captainState{display:none}.qZToFW_delegationTree{margin-left:12px;padding-left:15px}.qZToFW_memberBranch{width:15px}.qZToFW_assignmentLine{padding-left:45px}}";
		const tagId$1 = "dsh-agent-teams/ActivityPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-agent-teams";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ActivityPanel_module_css_default = {
			"members": "qZToFW_members",
			"assignmentTasks": "qZToFW_assignmentTasks",
			"stageTasks": "qZToFW_stageTasks",
			"memberArt": "qZToFW_memberArt",
			"stageLabel": "qZToFW_stageLabel",
			"memberBlock": "qZToFW_memberBlock",
			"captainRole": "qZToFW_captainRole",
			"inboxContent": "qZToFW_inboxContent",
			"assignmentLabel": "qZToFW_assignmentLabel",
			"teamName": "qZToFW_teamName",
			"badge": "qZToFW_badge",
			"captainName": "qZToFW_captainName",
			"memberState": "qZToFW_memberState",
			"captainSummary": "qZToFW_captainSummary",
			"memberRole": "qZToFW_memberRole",
			"taskSubject": "qZToFW_taskSubject",
			"memberName": "qZToFW_memberName",
			"agentTeamsRing": "qZToFW_agentTeamsRing",
			"panelHead": "qZToFW_panelHead",
			"stageFlow": "qZToFW_stageFlow",
			"taskNodeHead": "qZToFW_taskNodeHead",
			"teamHead": "qZToFW_teamHead",
			"leadAvatar": "qZToFW_leadAvatar",
			"sectionHint": "qZToFW_sectionHint",
			"taskStart": "qZToFW_taskStart",
			"unclaimedTitle": "qZToFW_unclaimedTitle",
			"stageLine": "qZToFW_stageLine",
			"panel": "qZToFW_panel",
			"taskBadge": "qZToFW_taskBadge",
			"sectionHead": "qZToFW_sectionHead",
			"taskNode": "qZToFW_taskNode",
			"historicPill": "qZToFW_historicPill",
			"delegationSection": "qZToFW_delegationSection",
			"unclaimed": "qZToFW_unclaimed",
			"captainLine": "qZToFW_captainLine",
			"panelTitle": "qZToFW_panelTitle",
			"captainInfo": "qZToFW_captainInfo",
			"memberInfo": "qZToFW_memberInfo",
			"memberStatusLine": "qZToFW_memberStatusLine",
			"assignmentChip": "qZToFW_assignmentChip",
			"memberAvatar": "qZToFW_memberAvatar",
			"memberRow": "qZToFW_memberRow",
			"teamStats": "qZToFW_teamStats",
			"agentTeamsFloat": "qZToFW_agentTeamsFloat",
			"stageGroup": "qZToFW_stageGroup",
			"taskOwner": "qZToFW_taskOwner",
			"captainAvatar": "qZToFW_captainAvatar",
			"team": "qZToFW_team",
			"badgeCount": "qZToFW_badgeCount",
			"agentTeamsPulse": "qZToFW_agentTeamsPulse",
			"captainState": "qZToFW_captainState",
			"dependencySection": "qZToFW_dependencySection",
			"stageConnector": "qZToFW_stageConnector",
			"taskDeps": "qZToFW_taskDeps",
			"agentTeamsPanelIn": "qZToFW_agentTeamsPanelIn",
			"captainNode": "qZToFW_captainNode",
			"memberBranch": "qZToFW_memberBranch",
			"emptyHint": "qZToFW_emptyHint",
			"inbox": "qZToFW_inbox",
			"closeButton": "qZToFW_closeButton",
			"agentTeamsBreathe": "qZToFW_agentTeamsBreathe",
			"inboxRoute": "qZToFW_inboxRoute",
			"teams": "qZToFW_teams",
			"memberLine": "qZToFW_memberLine",
			"memberCount": "qZToFW_memberCount",
			"memberInitial": "qZToFW_memberInitial",
			"delegationTree": "qZToFW_delegationTree",
			"panelDot": "qZToFW_panelDot",
			"assignmentLine": "qZToFW_assignmentLine",
			"unreadPill": "qZToFW_unreadPill",
			"badgeDot": "qZToFW_badgeDot",
			"taskId": "qZToFW_taskId",
			"taskEmpty": "qZToFW_taskEmpty",
			"taskRoute": "qZToFW_taskRoute",
			"stageColumn": "qZToFW_stageColumn",
			"inboxRow": "qZToFW_inboxRow",
			"agentTeamsThink": "qZToFW_agentTeamsThink",
			"captainChevron": "qZToFW_captainChevron",
			"stateArt": "qZToFW_stateArt",
			"sectionTitle": "qZToFW_sectionTitle",
			"archivedWrap": "qZToFW_archivedWrap"
		};
		//#endregion
		//#region lib/client/ActivityPanel.js
		/**
		* AgentTeams activity panel: the top-right floater monitoring every team.
		*
		* Modeled on the Claude Code desktop SessionActivityPanel: a fixed glass
		* panel at the top-right corner. On wide viewports it cooperatively makes the
		* conversation column yield space; narrow viewports keep overlay mode. It
		* polls the host `/plugins/dsh-agent-teams/state` route for
		* server-side snapshots (durable files + live subagent activity), with a
		* collapsed badge that auto-expands once when activity appears. Archived
		* teams stay available for the owning conversation after live work ends.
		*
		* The floater mounts through a body portal (no top-right slot exists in the
		* web shell); it is not a conversation node — the in-conversation panel was
		* removed in favor of this always-available monitor.
		* @module dsh-agent-teams/client/activity
		*/
		/** Poll cadence for the host snapshot route. */
		const POLL_MS$1 = 1e3;
		/** Grace before the panel collapses once no team remains. */
		const AUTOCLOSE_GRACE_MS = 2e3;
		/**
		* Page-settle window after mount: activity restored on page load only shows
		* the collapsed badge, so the panel never yanks the conversation column
		* right after load. New activity after this window auto-expands as usual.
		*/
		const AUTO_OPEN_SETTLE_MS = 4e3;
		/** Host route serving team snapshots. */
		const STATE_URL$1 = "/plugins/dsh-agent-teams/state";
		/** Root marker shared with the panel CSS while the portal is expanded. */
		const PANEL_OPEN_ATTRIBUTE = "data-agent-teams-panel-open";
		/** Collapsed badge: an always-visible corner pill while any team exists. */
		function CollapsedBadge({ count, busy, onClick }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.badge,
				"data-busy": busy,
				onClick,
				"aria-label": `AgentTeams 活动，${count} 个团队`,
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeDot,
					"data-busy": busy,
					"aria-hidden": true
				}), (0, react_jsx_runtime.jsx)("span", {
					className: ActivityPanel_module_css_default.badgeCount,
					children: count
				})]
			});
		}
		function TaskNode({ task, tasks, focused, dimmed, pinned, onPin, onPreview }) {
			const tone = taskTone(task.state, task.status);
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ActivityPanel_module_css_default.taskNode,
				"data-task-id": task.id,
				"data-state": tone,
				"data-focused": focused,
				"data-dimmed": dimmed,
				"aria-pressed": pinned,
				title: `${task.id} · ${task.subject}（点击固定依赖链）`,
				onClick: () => {
					onPin(task.id);
				},
				onMouseEnter: () => {
					onPreview(task.id);
				},
				onMouseLeave: () => {
					onPreview(null);
				},
				onFocus: () => {
					onPreview(task.id);
				},
				onBlur: () => {
					onPreview(null);
				},
				children: [
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.taskNodeHead,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskId,
							children: task.id
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskBadge,
							"data-state": tone,
							children: taskStatusLabel(task.status)
						})]
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.taskSubject,
						children: task.subject
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.taskRoute,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskOwner,
							children: task.assignee || "待认领"
						}), task.dependencies.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.taskStart,
							children: "起点"
						}) : (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.taskDeps,
							children: ["依赖 ", dependencyLabel(task, tasks)]
						})]
					})
				]
			});
		}
		function DependencyMap({ tasks }) {
			const [previewTaskId, setPreviewTaskId] = (0, react.useState)(null);
			const [pinnedTaskId, setPinnedTaskId] = (0, react.useState)(null);
			const focusedTaskId = pinnedTaskId ?? previewTaskId;
			const stages = (0, react.useMemo)(() => taskStages(tasks), [tasks]);
			const related = (0, react.useMemo)(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") setPinnedTaskId(null);
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, []);
			if (tasks.length === 0) return null;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.dependencySection,
				"aria-label": "任务依赖链",
				"data-dependency-map": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.sectionHead,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.sectionTitle,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {}), " 任务依赖"]
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.sectionHint,
						children: pinnedTaskId === null ? "悬停预览 · 点击固定" : `${pinnedTaskId} 已固定 · Esc 取消`
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.stageFlow,
					children: stages.map((stage, index) => (0, react_jsx_runtime.jsxs)("div", {
						className: ActivityPanel_module_css_default.stageGroup,
						"data-depth": stage.depth,
						children: [index > 0 && (0, react_jsx_runtime.jsxs)("span", {
							className: ActivityPanel_module_css_default.stageConnector,
							"aria-hidden": true,
							children: [(0, react_jsx_runtime.jsx)("span", { className: ActivityPanel_module_css_default.stageLine }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {})]
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.stageColumn,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.stageLabel,
								children: [stage.depth === 0 ? "起点" : `依赖层 ${stage.depth}`, (0, react_jsx_runtime.jsx)("span", { children: stage.tasks.length })]
							}), (0, react_jsx_runtime.jsx)("div", {
								className: ActivityPanel_module_css_default.stageTasks,
								children: stage.tasks.map((task) => (0, react_jsx_runtime.jsx)(TaskNode, {
									task,
									tasks,
									focused: related?.has(task.id) ?? false,
									dimmed: related !== null && !related.has(task.id),
									pinned: pinnedTaskId === task.id,
									onPin: (id) => {
										setPinnedTaskId((current) => current === id ? null : id);
									},
									onPreview: setPreviewTaskId
								}, task.id))
							})]
						})]
					}, stage.depth))
				})]
			});
		}
		function TeamSection({ team, onNavigate, historic = false }) {
			const busyCount = team.members.filter((member) => member.activity === "working").length;
			const assignedCount = team.tasks.filter((task) => task.assignee !== "").length;
			const completedCount = team.tasks.filter((task) => task.status === "completed").length;
			const allCompleted = team.tasks.length > 0 && completedCount === team.tasks.length;
			const unclaimed = team.tasks.filter((task) => {
				if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") return false;
				if (task.assignee === "") return true;
				return !team.members.some((member) => member.name === task.assignee);
			});
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ActivityPanel_module_css_default.team,
				"data-team-id": team.teamId,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: ActivityPanel_module_css_default.teamHead,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.teamName,
								title: team.name,
								children: team.name
							}),
							historic && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.historicPill,
								children: "已结束"
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.teamStats,
								children: [
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "members",
										children: [team.members.length, " 成员"]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "tasks",
										children: [
											completedCount,
											"/",
											team.tasks.length,
											" 完成"
										]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										"data-stat": "messages",
										children: [team.messageCount, " 消息"]
									})
								]
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.delegationSection,
						"aria-label": "队长派工关系",
						"data-delegation-map": true,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ActivityPanel_module_css_default.captainNode,
							onClick: () => {
								onNavigate(team.captainSessionId);
							},
							title: "回到队长会话",
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.captainAvatar,
									children: (0, react_jsx_runtime.jsx)("img", {
										className: ActivityPanel_module_css_default.leadAvatar,
										src: LEAD_ART,
										alt: "",
										"aria-hidden": true
									})
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.captainInfo,
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainLine,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainName,
											children: "队长"
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.captainRole,
											children: "拆解 · 派发 · 汇总"
										})]
									}), (0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.captainSummary,
										children: [
											"已派发 ",
											assignedCount,
											" 项任务给 ",
											team.members.length,
											" 名成员"
										]
									})]
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: ActivityPanel_module_css_default.captainState,
									"data-busy": busyCount > 0,
									children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: busyCount > 0 ? "ongoing" : allCompleted ? "done" : "warning" }), busyCount > 0 ? `${busyCount} 人执行中` : allCompleted ? "已收齐" : "等待回报"]
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: ActivityPanel_module_css_default.captainChevron,
									"aria-hidden": true,
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {})
								})
							]
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.delegationTree,
							children: [team.members.length === 0 && (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.emptyHint,
								children: "暂无成员，等待队长组建团队"
							}), team.members.map((member) => {
								const owned = team.tasks.filter((task) => task.assignee === member.name);
								return (0, react_jsx_runtime.jsxs)("div", {
									className: ActivityPanel_module_css_default.memberBlock,
									"data-activity": member.activity,
									children: [
										(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberBranch,
											"aria-hidden": true,
											children: (0, react_jsx_runtime.jsx)("span", {})
										}),
										(0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: ActivityPanel_module_css_default.memberRow,
											"data-activity": member.activity,
											onClick: () => {
												if (member.id !== "") onNavigate(member.id);
											},
											children: [
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberAvatar,
													"data-unread": member.unread > 0,
													children: [memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
														className: ActivityPanel_module_css_default.memberArt,
														src: memberArtUrl(member.name, member.role) ?? "",
														alt: "",
														"aria-hidden": true
													}) : (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.memberInitial,
														style: { background: accentOf(member.id) },
														children: memberInitial(member.name)
													}), (0, react_jsx_runtime.jsx)("img", {
														className: ActivityPanel_module_css_default.stateArt,
														"data-activity": member.activity,
														src: ACTION_ART[member.activity],
														alt: "",
														"aria-hidden": true
													})]
												}),
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberInfo,
													children: [(0, react_jsx_runtime.jsxs)("span", {
														className: ActivityPanel_module_css_default.memberLine,
														children: [
															(0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberName,
																children: member.name
															}),
															member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
																className: ActivityPanel_module_css_default.memberRole,
																children: member.role
															}),
															(0, react_jsx_runtime.jsxs)("span", {
																className: ActivityPanel_module_css_default.memberState,
																"data-activity": member.activity,
																children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: memberDotState(member, team.tasks) }), memberStateLabel(member, team.tasks)]
															})
														]
													}), (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.memberStatusLine,
														children: memberStatusText(member, team.tasks)
													})]
												}),
												(0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.memberCount,
													children: [
														member.done,
														"/",
														member.total
													]
												})
											]
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: ActivityPanel_module_css_default.assignmentLine,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.assignmentLabel,
													children: "队长派发"
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.assignmentTasks,
													children: owned.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.taskEmpty,
														children: "暂无任务"
													}) : owned.map((task) => (0, react_jsx_runtime.jsx)("span", {
														className: ActivityPanel_module_css_default.assignmentChip,
														"data-state": taskTone(task.state, task.status),
														title: task.subject,
														children: task.id
													}, task.id))
												}),
												member.unread > 0 && (0, react_jsx_runtime.jsxs)("span", {
													className: ActivityPanel_module_css_default.unreadPill,
													children: [member.unread, " 条消息"]
												})
											]
										})
									]
								}, member.id);
							})]
						})]
					}),
					(0, react_jsx_runtime.jsx)(DependencyMap, { tasks: team.tasks }),
					unclaimed.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.unclaimed,
						"aria-label": "待认领任务",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.unclaimedTitle,
							children: "待队长认领或改派"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.assignmentTasks,
							children: unclaimed.map((task) => (0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.assignmentChip,
								"data-state": taskTone(task.state, task.status),
								title: task.subject,
								children: [
									task.id,
									" · ",
									task.assignee || "未分配"
								]
							}, task.id))
						})]
					}),
					team.captainInbox.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ActivityPanel_module_css_default.inbox,
						"aria-label": "成员回报队长",
						children: [(0, react_jsx_runtime.jsxs)("header", {
							className: ActivityPanel_module_css_default.sectionHead,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.sectionTitle,
								children: "成员回报"
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.sectionHint,
								children: "流向队长"
							})]
						}), team.captainInbox.slice(-2).map((message, index) => (0, react_jsx_runtime.jsxs)("div", {
							className: ActivityPanel_module_css_default.inboxRow,
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: ActivityPanel_module_css_default.inboxRoute,
								children: [
									message.from,
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {}),
									"队长"
								]
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ActivityPanel_module_css_default.inboxContent,
								title: message.content,
								children: message.content
							})]
						}, index))]
					})
				]
			});
		}
		/** The top-right activity floater. Live teams follow the current session:
		* visible while their captain session — or one of their member sessions — is
		* the one currently open. Historic card summaries and archived teams are
		* captain-only recovery views. */
		function ActivityPanel({ sessionsList, openSession }) {
			const navigateToSession = (id) => {
				setOpen(false);
				setWasActive(false);
				openSession(id);
			};
			const [teams, setTeams] = (0, react.useState)([]);
			const [archivedTeams, setArchivedTeams] = (0, react.useState)([]);
			const [open, setOpen] = (0, react.useState)(false);
			const [openOwner, setOpenOwner] = (0, react.useState)();
			const [autoOpened, setAutoOpened] = (0, react.useState)(false);
			const [wasActive, setWasActive] = (0, react.useState)(false);
			const [historic, setHistoric] = (0, react.useState)(/* @__PURE__ */ new Map());
			const current = (0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot).current;
			const currentRef = (0, react.useRef)(current);
			(0, react.useEffect)(() => {
				currentRef.current = current;
			}, [current]);
			const mountedAtRef = (0, react.useRef)(performance.now());
			const expanded = activityPanelExpandedForSession(open, openOwner, current);
			(0, react.useLayoutEffect)(() => {
				if (openOwner === void 0 || openOwner === current) return;
				setOpen(false);
				setOpenOwner(void 0);
				setWasActive(false);
				setAutoOpened(false);
			}, [current, openOwner]);
			(0, react.useLayoutEffect)(() => {
				const root = document.documentElement;
				if (expanded) root.setAttribute(PANEL_OPEN_ATTRIBUTE, "");
				else root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
				return () => {
					root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
				};
			}, [expanded]);
			(0, react.useEffect)(() => {
				let cancelled = false;
				let inFlight = false;
				const tick = async () => {
					if (inFlight || cancelled) return;
					inFlight = true;
					try {
						const [liveResponse, archivedResponse] = await Promise.all([fetch(STATE_URL$1, { cache: "no-store" }), fetch(`${STATE_URL$1}?archived=1`, { cache: "no-store" })]);
						if (liveResponse.ok) {
							const body = await liveResponse.json();
							if (!cancelled && Array.isArray(body.teams)) setTeams(body.teams);
						}
						if (archivedResponse.ok) {
							const body = await archivedResponse.json();
							if (!cancelled && Array.isArray(body.teams)) setArchivedTeams(body.teams);
						}
					} catch {} finally {
						inFlight = false;
					}
				};
				tick();
				const timer = setInterval(() => {
					tick();
				}, POLL_MS$1);
				return () => {
					cancelled = true;
					clearInterval(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				const onOpenPanel = (event) => {
					const activeSession = currentRef.current;
					if (activeSession === void 0) return;
					setOpenOwner(activeSession);
					setOpen(true);
					const detail = event.detail;
					if (detail?.teamId !== void 0) {
						const owner = detail.captainSessionId !== "" ? detail.captainSessionId : currentRef.current ?? "";
						const teamKey = `${owner}:${detail.teamId}`;
						setHistoric((previous) => {
							const next = new Map(previous);
							next.set(teamKey, {
								data: detail,
								owner
							});
							return next;
						});
					}
				};
				window.addEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				return () => {
					window.removeEventListener(OPEN_PANEL_EVENT, onOpenPanel);
				};
			}, []);
			const visibleTeams = (0, react.useMemo)(() => current === void 0 ? [] : teams.filter((team) => teamVisibleTo(team, current)), [teams, current]);
			const visibleHistoric = (0, react.useMemo)(() => current === void 0 ? [] : [...historic.values()].filter(({ data, owner }) => owner === current && !teams.some((live) => live.captainSessionId === current && live.teamId === data.teamId) && !archivedTeams.some((archived) => archived.captainSessionId === current && archived.teamId === data.teamId)), [
				historic,
				current,
				teams,
				archivedTeams
			]);
			const visibleArchived = (0, react.useMemo)(() => current === void 0 ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId)), [
				archivedTeams,
				current,
				teams
			]);
			const visibleCount = visibleTeams.length + visibleArchived.length + visibleHistoric.length;
			(0, react.useEffect)(() => {
				if (visibleCount > 0) {
					setWasActive(true);
					const settled = performance.now() - mountedAtRef.current >= AUTO_OPEN_SETTLE_MS;
					if (!autoOpened && settled) {
						setOpenOwner(current);
						setOpen(true);
						setAutoOpened(true);
					}
					return;
				}
				if (!wasActive) return;
				const timer = setTimeout(() => {
					setOpen(false);
					setOpenOwner(void 0);
					setWasActive(false);
					setAutoOpened(false);
				}, AUTOCLOSE_GRACE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [
				visibleCount,
				autoOpened,
				wasActive
			]);
			const busy = (0, react.useMemo)(() => visibleTeams.some((team) => team.members.some((member) => member.activity === "working")), [visibleTeams]);
			if (!(visibleCount > 0) && !expanded) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!expanded && (0, react_jsx_runtime.jsx)(CollapsedBadge, {
				count: visibleCount,
				busy,
				onClick: () => {
					if (current === void 0) return;
					setOpenOwner(current);
					setOpen(true);
				}
			}), expanded && (0, react_jsx_runtime.jsxs)("aside", {
				className: ActivityPanel_module_css_default.panel,
				"data-agent-teams-activity": true,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ActivityPanel_module_css_default.panelHead,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: ActivityPanel_module_css_default.panelTitle,
						children: ["AgentTeams 活动", (0, react_jsx_runtime.jsx)("span", {
							className: ActivityPanel_module_css_default.panelDot,
							"data-busy": busy,
							"aria-hidden": true
						})]
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ActivityPanel_module_css_default.closeButton,
						onClick: () => {
							setOpen(false);
							setOpenOwner(void 0);
						},
						"aria-label": "关闭",
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: ActivityPanel_module_css_default.teams,
					children: visibleCount === 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: ActivityPanel_module_css_default.emptyHint,
						children: "暂无团队活动"
					}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(TeamSection, {
							team,
							onNavigate: navigateToSession
						}, team.teamId)),
						visibleArchived.map((team) => (0, react_jsx_runtime.jsx)("div", {
							"data-team-id": team.teamId,
							"data-historic": true,
							className: ActivityPanel_module_css_default.archivedWrap,
							children: (0, react_jsx_runtime.jsx)(TeamSection, {
								team,
								onNavigate: navigateToSession,
								historic: true
							})
						}, `${team.captainSessionId}:${team.teamId}`)),
						visibleHistoric.map(({ data: team, owner }) => {
							const teamKey = `${owner}:${team.teamId}`;
							return (0, react_jsx_runtime.jsxs)("section", {
								className: ActivityPanel_module_css_default.team,
								"data-team-id": team.teamId,
								"data-historic": true,
								children: [(0, react_jsx_runtime.jsxs)("header", {
									className: ActivityPanel_module_css_default.teamHead,
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ActivityPanel_module_css_default.teamName,
										title: team.teamName,
										children: [
											(0, react_jsx_runtime.jsx)("img", {
												className: ActivityPanel_module_css_default.leadAvatar,
												src: LEAD_ART,
												alt: "",
												"aria-hidden": true
											}),
											" ",
											team.teamName
										]
									}), (0, react_jsx_runtime.jsx)("span", {
										className: ActivityPanel_module_css_default.historicPill,
										children: "已结束"
									})]
								}), (0, react_jsx_runtime.jsx)("div", {
									className: ActivityPanel_module_css_default.members,
									children: team.members.map((member) => (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: ActivityPanel_module_css_default.memberRow,
										"data-activity": "idle",
										onClick: () => {
											if (member.id !== "") navigateToSession(member.id);
										},
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberAvatar,
											children: memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
												className: ActivityPanel_module_css_default.memberArt,
												src: memberArtUrl(member.name, member.role) ?? "",
												alt: "",
												"aria-hidden": true
											}) : (0, react_jsx_runtime.jsx)("span", {
												className: ActivityPanel_module_css_default.memberInitial,
												style: { background: accentOf(member.id) },
												children: memberInitial(member.name)
											})
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ActivityPanel_module_css_default.memberInfo,
											children: (0, react_jsx_runtime.jsxs)("span", {
												className: ActivityPanel_module_css_default.memberLine,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.memberName,
													children: member.name
												}), member.role !== "" && (0, react_jsx_runtime.jsx)("span", {
													className: ActivityPanel_module_css_default.memberRole,
													children: member.role
												})]
											})
										})]
									}, member.id))
								})]
							}, teamKey);
						})
					] })
				})]
			})] });
		}
		//#endregion
		//#region node_modules/.pnpm/classcat@5.0.5/node_modules/classcat/index.js
		function cc(names) {
			if (typeof names === "string" || typeof names === "number") return "" + names;
			let out = "";
			if (Array.isArray(names)) {
				for (let i = 0, tmp; i < names.length; i++) if ((tmp = cc(names[i])) !== "") out += (out && " ") + tmp;
			} else for (let k in names) if (names[k]) out += (out && " ") + k;
			return out;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js
		var noop = { value: () => {} };
		function dispatch() {
			for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
				if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
				_[t] = [];
			}
			return new Dispatch(_);
		}
		function Dispatch(_) {
			this._ = _;
		}
		function parseTypenames$1(typenames, types) {
			return typenames.trim().split(/^|\s+/).map(function(t) {
				var name = "", i = t.indexOf(".");
				if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
				if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
				return {
					type: t,
					name
				};
			});
		}
		Dispatch.prototype = dispatch.prototype = {
			constructor: Dispatch,
			on: function(typename, callback) {
				var _ = this._, T = parseTypenames$1(typename + "", _), t, i = -1, n = T.length;
				if (arguments.length < 2) {
					while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
					return;
				}
				if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
				while (++i < n) if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
				else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
				return this;
			},
			copy: function() {
				var copy = {}, _ = this._;
				for (var t in _) copy[t] = _[t].slice();
				return new Dispatch(copy);
			},
			call: function(type, that) {
				if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
				if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
				for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
			},
			apply: function(type, that, args) {
				if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
				for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
			}
		};
		function get$1(type, name) {
			for (var i = 0, n = type.length, c; i < n; ++i) if ((c = type[i]).name === name) return c.value;
		}
		function set$1(type, name, callback) {
			for (var i = 0, n = type.length; i < n; ++i) if (type[i].name === name) {
				type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
				break;
			}
			if (callback != null) type.push({
				name,
				value: callback
			});
			return type;
		}
		var namespaces_default = {
			svg: "http://www.w3.org/2000/svg",
			xhtml: "http://www.w3.org/1999/xhtml",
			xlink: "http://www.w3.org/1999/xlink",
			xml: "http://www.w3.org/XML/1998/namespace",
			xmlns: "http://www.w3.org/2000/xmlns/"
		};
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js
		function namespace_default(name) {
			var prefix = name += "", i = prefix.indexOf(":");
			if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
			return namespaces_default.hasOwnProperty(prefix) ? {
				space: namespaces_default[prefix],
				local: name
			} : name;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js
		function creatorInherit(name) {
			return function() {
				var document = this.ownerDocument, uri = this.namespaceURI;
				return uri === "http://www.w3.org/1999/xhtml" && document.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? document.createElement(name) : document.createElementNS(uri, name);
			};
		}
		function creatorFixed(fullname) {
			return function() {
				return this.ownerDocument.createElementNS(fullname.space, fullname.local);
			};
		}
		function creator_default(name) {
			var fullname = namespace_default(name);
			return (fullname.local ? creatorFixed : creatorInherit)(fullname);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js
		function none() {}
		function selector_default(selector) {
			return selector == null ? none : function() {
				return this.querySelector(selector);
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js
		function select_default$2(select) {
			if (typeof select !== "function") select = selector_default(select);
			for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
				if ("__data__" in node) subnode.__data__ = node.__data__;
				subgroup[i] = subnode;
			}
			return new Selection$1(subgroups, this._parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/array.js
		function array(x) {
			return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js
		function empty() {
			return [];
		}
		function selectorAll_default(selector) {
			return selector == null ? empty : function() {
				return this.querySelectorAll(selector);
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js
		function arrayAll(select) {
			return function() {
				return array(select.apply(this, arguments));
			};
		}
		function selectAll_default$1(select) {
			if (typeof select === "function") select = arrayAll(select);
			else select = selectorAll_default(select);
			for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) if (node = group[i]) {
				subgroups.push(select.call(node, node.__data__, i, group));
				parents.push(node);
			}
			return new Selection$1(subgroups, parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js
		function matcher_default(selector) {
			return function() {
				return this.matches(selector);
			};
		}
		function childMatcher(selector) {
			return function(node) {
				return node.matches(selector);
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js
		var find = Array.prototype.find;
		function childFind(match) {
			return function() {
				return find.call(this.children, match);
			};
		}
		function childFirst() {
			return this.firstElementChild;
		}
		function selectChild_default(match) {
			return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js
		var filter = Array.prototype.filter;
		function children() {
			return Array.from(this.children);
		}
		function childrenFilter(match) {
			return function() {
				return filter.call(this.children, match);
			};
		}
		function selectChildren_default(match) {
			return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js
		function filter_default$1(match) {
			if (typeof match !== "function") match = matcher_default(match);
			for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) if ((node = group[i]) && match.call(node, node.__data__, i, group)) subgroup.push(node);
			return new Selection$1(subgroups, this._parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js
		function sparse_default(update) {
			return new Array(update.length);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js
		function enter_default() {
			return new Selection$1(this._enter || this._groups.map(sparse_default), this._parents);
		}
		function EnterNode(parent, datum) {
			this.ownerDocument = parent.ownerDocument;
			this.namespaceURI = parent.namespaceURI;
			this._next = null;
			this._parent = parent;
			this.__data__ = datum;
		}
		EnterNode.prototype = {
			constructor: EnterNode,
			appendChild: function(child) {
				return this._parent.insertBefore(child, this._next);
			},
			insertBefore: function(child, next) {
				return this._parent.insertBefore(child, next);
			},
			querySelector: function(selector) {
				return this._parent.querySelector(selector);
			},
			querySelectorAll: function(selector) {
				return this._parent.querySelectorAll(selector);
			}
		};
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js
		function constant_default$3(x) {
			return function() {
				return x;
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js
		function bindIndex(parent, group, enter, update, exit, data) {
			var i = 0, node, groupLength = group.length, dataLength = data.length;
			for (; i < dataLength; ++i) if (node = group[i]) {
				node.__data__ = data[i];
				update[i] = node;
			} else enter[i] = new EnterNode(parent, data[i]);
			for (; i < groupLength; ++i) if (node = group[i]) exit[i] = node;
		}
		function bindKey(parent, group, enter, update, exit, data, key) {
			var i, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
			for (i = 0; i < groupLength; ++i) if (node = group[i]) {
				keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
				if (nodeByKeyValue.has(keyValue)) exit[i] = node;
				else nodeByKeyValue.set(keyValue, node);
			}
			for (i = 0; i < dataLength; ++i) {
				keyValue = key.call(parent, data[i], i, data) + "";
				if (node = nodeByKeyValue.get(keyValue)) {
					update[i] = node;
					node.__data__ = data[i];
					nodeByKeyValue.delete(keyValue);
				} else enter[i] = new EnterNode(parent, data[i]);
			}
			for (i = 0; i < groupLength; ++i) if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) exit[i] = node;
		}
		function datum(node) {
			return node.__data__;
		}
		function data_default(value, key) {
			if (!arguments.length) return Array.from(this, datum);
			var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
			if (typeof value !== "function") value = constant_default$3(value);
			for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
				var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength);
				bind(parent, group, enterGroup, updateGroup, exit[j] = new Array(groupLength), data, key);
				for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) if (previous = enterGroup[i0]) {
					if (i0 >= i1) i1 = i0 + 1;
					while (!(next = updateGroup[i1]) && ++i1 < dataLength);
					previous._next = next || null;
				}
			}
			update = new Selection$1(update, parents);
			update._enter = enter;
			update._exit = exit;
			return update;
		}
		function arraylike(data) {
			return typeof data === "object" && "length" in data ? data : Array.from(data);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js
		function exit_default() {
			return new Selection$1(this._exit || this._groups.map(sparse_default), this._parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js
		function join_default(onenter, onupdate, onexit) {
			var enter = this.enter(), update = this, exit = this.exit();
			if (typeof onenter === "function") {
				enter = onenter(enter);
				if (enter) enter = enter.selection();
			} else enter = enter.append(onenter + "");
			if (onupdate != null) {
				update = onupdate(update);
				if (update) update = update.selection();
			}
			if (onexit == null) exit.remove();
			else onexit(exit);
			return enter && update ? enter.merge(update).order() : update;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js
		function merge_default$1(context) {
			var selection = context.selection ? context.selection() : context;
			for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) if (node = group0[i] || group1[i]) merge[i] = node;
			for (; j < m0; ++j) merges[j] = groups0[j];
			return new Selection$1(merges, this._parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js
		function order_default() {
			for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) if (node = group[i]) {
				if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
				next = node;
			}
			return this;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js
		function sort_default(compare) {
			if (!compare) compare = ascending;
			function compareNode(a, b) {
				return a && b ? compare(a.__data__, b.__data__) : !a - !b;
			}
			for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
				for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) if (node = group[i]) sortgroup[i] = node;
				sortgroup.sort(compareNode);
			}
			return new Selection$1(sortgroups, this._parents).order();
		}
		function ascending(a, b) {
			return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js
		function call_default() {
			var callback = arguments[0];
			arguments[0] = this;
			callback.apply(null, arguments);
			return this;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js
		function nodes_default() {
			return Array.from(this);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js
		function node_default() {
			for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
				var node = group[i];
				if (node) return node;
			}
			return null;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js
		function size_default() {
			let size = 0;
			for (const node of this) ++size;
			return size;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js
		function empty_default() {
			return !this.node();
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js
		function each_default(callback) {
			for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) if (node = group[i]) callback.call(node, node.__data__, i, group);
			return this;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js
		function attrRemove$1(name) {
			return function() {
				this.removeAttribute(name);
			};
		}
		function attrRemoveNS$1(fullname) {
			return function() {
				this.removeAttributeNS(fullname.space, fullname.local);
			};
		}
		function attrConstant$1(name, value) {
			return function() {
				this.setAttribute(name, value);
			};
		}
		function attrConstantNS$1(fullname, value) {
			return function() {
				this.setAttributeNS(fullname.space, fullname.local, value);
			};
		}
		function attrFunction$1(name, value) {
			return function() {
				var v = value.apply(this, arguments);
				if (v == null) this.removeAttribute(name);
				else this.setAttribute(name, v);
			};
		}
		function attrFunctionNS$1(fullname, value) {
			return function() {
				var v = value.apply(this, arguments);
				if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
				else this.setAttributeNS(fullname.space, fullname.local, v);
			};
		}
		function attr_default$1(name, value) {
			var fullname = namespace_default(name);
			if (arguments.length < 2) {
				var node = this.node();
				return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
			}
			return this.each((value == null ? fullname.local ? attrRemoveNS$1 : attrRemove$1 : typeof value === "function" ? fullname.local ? attrFunctionNS$1 : attrFunction$1 : fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/window.js
		function window_default(node) {
			return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js
		function styleRemove$1(name) {
			return function() {
				this.style.removeProperty(name);
			};
		}
		function styleConstant$1(name, value, priority) {
			return function() {
				this.style.setProperty(name, value, priority);
			};
		}
		function styleFunction$1(name, value, priority) {
			return function() {
				var v = value.apply(this, arguments);
				if (v == null) this.style.removeProperty(name);
				else this.style.setProperty(name, v, priority);
			};
		}
		function style_default$1(name, value, priority) {
			return arguments.length > 1 ? this.each((value == null ? styleRemove$1 : typeof value === "function" ? styleFunction$1 : styleConstant$1)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
		}
		function styleValue(node, name) {
			return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js
		function propertyRemove(name) {
			return function() {
				delete this[name];
			};
		}
		function propertyConstant(name, value) {
			return function() {
				this[name] = value;
			};
		}
		function propertyFunction(name, value) {
			return function() {
				var v = value.apply(this, arguments);
				if (v == null) delete this[name];
				else this[name] = v;
			};
		}
		function property_default(name, value) {
			return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js
		function classArray(string) {
			return string.trim().split(/^|\s+/);
		}
		function classList(node) {
			return node.classList || new ClassList(node);
		}
		function ClassList(node) {
			this._node = node;
			this._names = classArray(node.getAttribute("class") || "");
		}
		ClassList.prototype = {
			add: function(name) {
				if (this._names.indexOf(name) < 0) {
					this._names.push(name);
					this._node.setAttribute("class", this._names.join(" "));
				}
			},
			remove: function(name) {
				var i = this._names.indexOf(name);
				if (i >= 0) {
					this._names.splice(i, 1);
					this._node.setAttribute("class", this._names.join(" "));
				}
			},
			contains: function(name) {
				return this._names.indexOf(name) >= 0;
			}
		};
		function classedAdd(node, names) {
			var list = classList(node), i = -1, n = names.length;
			while (++i < n) list.add(names[i]);
		}
		function classedRemove(node, names) {
			var list = classList(node), i = -1, n = names.length;
			while (++i < n) list.remove(names[i]);
		}
		function classedTrue(names) {
			return function() {
				classedAdd(this, names);
			};
		}
		function classedFalse(names) {
			return function() {
				classedRemove(this, names);
			};
		}
		function classedFunction(names, value) {
			return function() {
				(value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
			};
		}
		function classed_default(name, value) {
			var names = classArray(name + "");
			if (arguments.length < 2) {
				var list = classList(this.node()), i = -1, n = names.length;
				while (++i < n) if (!list.contains(names[i])) return false;
				return true;
			}
			return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js
		function textRemove() {
			this.textContent = "";
		}
		function textConstant$1(value) {
			return function() {
				this.textContent = value;
			};
		}
		function textFunction$1(value) {
			return function() {
				var v = value.apply(this, arguments);
				this.textContent = v == null ? "" : v;
			};
		}
		function text_default$1(value) {
			return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction$1 : textConstant$1)(value)) : this.node().textContent;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js
		function htmlRemove() {
			this.innerHTML = "";
		}
		function htmlConstant(value) {
			return function() {
				this.innerHTML = value;
			};
		}
		function htmlFunction(value) {
			return function() {
				var v = value.apply(this, arguments);
				this.innerHTML = v == null ? "" : v;
			};
		}
		function html_default(value) {
			return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js
		function raise() {
			if (this.nextSibling) this.parentNode.appendChild(this);
		}
		function raise_default() {
			return this.each(raise);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js
		function lower() {
			if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
		}
		function lower_default() {
			return this.each(lower);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js
		function append_default(name) {
			var create = typeof name === "function" ? name : creator_default(name);
			return this.select(function() {
				return this.appendChild(create.apply(this, arguments));
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js
		function constantNull() {
			return null;
		}
		function insert_default(name, before) {
			var create = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
			return this.select(function() {
				return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js
		function remove() {
			var parent = this.parentNode;
			if (parent) parent.removeChild(this);
		}
		function remove_default$1() {
			return this.each(remove);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js
		function selection_cloneShallow() {
			var clone = this.cloneNode(false), parent = this.parentNode;
			return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
		}
		function selection_cloneDeep() {
			var clone = this.cloneNode(true), parent = this.parentNode;
			return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
		}
		function clone_default(deep) {
			return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js
		function datum_default(value) {
			return arguments.length ? this.property("__data__", value) : this.node().__data__;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js
		function contextListener(listener) {
			return function(event) {
				listener.call(this, event, this.__data__);
			};
		}
		function parseTypenames(typenames) {
			return typenames.trim().split(/^|\s+/).map(function(t) {
				var name = "", i = t.indexOf(".");
				if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
				return {
					type: t,
					name
				};
			});
		}
		function onRemove(typename) {
			return function() {
				var on = this.__on;
				if (!on) return;
				for (var j = 0, i = -1, m = on.length, o; j < m; ++j) if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) this.removeEventListener(o.type, o.listener, o.options);
				else on[++i] = o;
				if (++i) on.length = i;
				else delete this.__on;
			};
		}
		function onAdd(typename, value, options) {
			return function() {
				var on = this.__on, o, listener = contextListener(value);
				if (on) {
					for (var j = 0, m = on.length; j < m; ++j) if ((o = on[j]).type === typename.type && o.name === typename.name) {
						this.removeEventListener(o.type, o.listener, o.options);
						this.addEventListener(o.type, o.listener = listener, o.options = options);
						o.value = value;
						return;
					}
				}
				this.addEventListener(typename.type, listener, options);
				o = {
					type: typename.type,
					name: typename.name,
					value,
					listener,
					options
				};
				if (!on) this.__on = [o];
				else on.push(o);
			};
		}
		function on_default$1(typename, value, options) {
			var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;
			if (arguments.length < 2) {
				var on = this.node().__on;
				if (on) {
					for (var j = 0, m = on.length, o; j < m; ++j) for (i = 0, o = on[j]; i < n; ++i) if ((t = typenames[i]).type === o.type && t.name === o.name) return o.value;
				}
				return;
			}
			on = value ? onAdd : onRemove;
			for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
			return this;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js
		function dispatchEvent(node, type, params) {
			var window = window_default(node), event = window.CustomEvent;
			if (typeof event === "function") event = new event(type, params);
			else {
				event = window.document.createEvent("Event");
				if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
				else event.initEvent(type, false, false);
			}
			node.dispatchEvent(event);
		}
		function dispatchConstant(type, params) {
			return function() {
				return dispatchEvent(this, type, params);
			};
		}
		function dispatchFunction(type, params) {
			return function() {
				return dispatchEvent(this, type, params.apply(this, arguments));
			};
		}
		function dispatch_default(type, params) {
			return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js
		function* iterator_default() {
			for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) if (node = group[i]) yield node;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js
		var root = [null];
		function Selection$1(groups, parents) {
			this._groups = groups;
			this._parents = parents;
		}
		function selection() {
			return new Selection$1([[document.documentElement]], root);
		}
		function selection_selection() {
			return this;
		}
		Selection$1.prototype = selection.prototype = {
			constructor: Selection$1,
			select: select_default$2,
			selectAll: selectAll_default$1,
			selectChild: selectChild_default,
			selectChildren: selectChildren_default,
			filter: filter_default$1,
			data: data_default,
			enter: enter_default,
			exit: exit_default,
			join: join_default,
			merge: merge_default$1,
			selection: selection_selection,
			order: order_default,
			sort: sort_default,
			call: call_default,
			nodes: nodes_default,
			node: node_default,
			size: size_default,
			empty: empty_default,
			each: each_default,
			attr: attr_default$1,
			style: style_default$1,
			property: property_default,
			classed: classed_default,
			text: text_default$1,
			html: html_default,
			raise: raise_default,
			lower: lower_default,
			append: append_default,
			insert: insert_default,
			remove: remove_default$1,
			clone: clone_default,
			datum: datum_default,
			on: on_default$1,
			dispatch: dispatch_default,
			[Symbol.iterator]: iterator_default
		};
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/select.js
		function select_default$1(selector) {
			return typeof selector === "string" ? new Selection$1([[document.querySelector(selector)]], [document.documentElement]) : new Selection$1([[selector]], root);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/sourceEvent.js
		function sourceEvent_default(event) {
			let sourceEvent;
			while (sourceEvent = event.sourceEvent) event = sourceEvent;
			return event;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/pointer.js
		function pointer_default(event, node) {
			event = sourceEvent_default(event);
			if (node === void 0) node = event.currentTarget;
			if (node) {
				var svg = node.ownerSVGElement || node;
				if (svg.createSVGPoint) {
					var point = svg.createSVGPoint();
					point.x = event.clientX, point.y = event.clientY;
					point = point.matrixTransform(node.getScreenCTM().inverse());
					return [point.x, point.y];
				}
				if (node.getBoundingClientRect) {
					var rect = node.getBoundingClientRect();
					return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
				}
			}
			return [event.pageX, event.pageY];
		}
		//#endregion
		//#region node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/noevent.js
		const nonpassive = { passive: false };
		const nonpassivecapture = {
			capture: true,
			passive: false
		};
		function nopropagation$1(event) {
			event.stopImmediatePropagation();
		}
		function noevent_default$1(event) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
		//#endregion
		//#region node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/nodrag.js
		function nodrag_default(view) {
			var root = view.document.documentElement, selection = select_default$1(view).on("dragstart.drag", noevent_default$1, nonpassivecapture);
			if ("onselectstart" in root) selection.on("selectstart.drag", noevent_default$1, nonpassivecapture);
			else {
				root.__noselect = root.style.MozUserSelect;
				root.style.MozUserSelect = "none";
			}
		}
		function yesdrag(view, noclick) {
			var root = view.document.documentElement, selection = select_default$1(view).on("dragstart.drag", null);
			if (noclick) {
				selection.on("click.drag", noevent_default$1, nonpassivecapture);
				setTimeout(function() {
					selection.on("click.drag", null);
				}, 0);
			}
			if ("onselectstart" in root) selection.on("selectstart.drag", null);
			else {
				root.style.MozUserSelect = root.__noselect;
				delete root.__noselect;
			}
		}
		//#endregion
		//#region node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/constant.js
		var constant_default$2 = (x) => () => x;
		//#endregion
		//#region node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/event.js
		function DragEvent(type, { sourceEvent, subject, target, identifier, active, x, y, dx, dy, dispatch }) {
			Object.defineProperties(this, {
				type: {
					value: type,
					enumerable: true,
					configurable: true
				},
				sourceEvent: {
					value: sourceEvent,
					enumerable: true,
					configurable: true
				},
				subject: {
					value: subject,
					enumerable: true,
					configurable: true
				},
				target: {
					value: target,
					enumerable: true,
					configurable: true
				},
				identifier: {
					value: identifier,
					enumerable: true,
					configurable: true
				},
				active: {
					value: active,
					enumerable: true,
					configurable: true
				},
				x: {
					value: x,
					enumerable: true,
					configurable: true
				},
				y: {
					value: y,
					enumerable: true,
					configurable: true
				},
				dx: {
					value: dx,
					enumerable: true,
					configurable: true
				},
				dy: {
					value: dy,
					enumerable: true,
					configurable: true
				},
				_: { value: dispatch }
			});
		}
		DragEvent.prototype.on = function() {
			var value = this._.on.apply(this._, arguments);
			return value === this._ ? this : value;
		};
		//#endregion
		//#region node_modules/.pnpm/d3-drag@3.0.0/node_modules/d3-drag/src/drag.js
		function defaultFilter$1(event) {
			return !event.ctrlKey && !event.button;
		}
		function defaultContainer() {
			return this.parentNode;
		}
		function defaultSubject(event, d) {
			return d == null ? {
				x: event.x,
				y: event.y
			} : d;
		}
		function defaultTouchable$1() {
			return navigator.maxTouchPoints || "ontouchstart" in this;
		}
		function drag_default() {
			var filter = defaultFilter$1, container = defaultContainer, subject = defaultSubject, touchable = defaultTouchable$1, gestures = {}, listeners = dispatch("start", "drag", "end"), active = 0, mousedownx, mousedowny, mousemoving, touchending, clickDistance2 = 0;
			function drag(selection) {
				selection.on("mousedown.drag", mousedowned).filter(touchable).on("touchstart.drag", touchstarted).on("touchmove.drag", touchmoved, nonpassive).on("touchend.drag touchcancel.drag", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
			}
			function mousedowned(event, d) {
				if (touchending || !filter.call(this, event, d)) return;
				var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
				if (!gesture) return;
				select_default$1(event.view).on("mousemove.drag", mousemoved, nonpassivecapture).on("mouseup.drag", mouseupped, nonpassivecapture);
				nodrag_default(event.view);
				nopropagation$1(event);
				mousemoving = false;
				mousedownx = event.clientX;
				mousedowny = event.clientY;
				gesture("start", event);
			}
			function mousemoved(event) {
				noevent_default$1(event);
				if (!mousemoving) {
					var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
					mousemoving = dx * dx + dy * dy > clickDistance2;
				}
				gestures.mouse("drag", event);
			}
			function mouseupped(event) {
				select_default$1(event.view).on("mousemove.drag mouseup.drag", null);
				yesdrag(event.view, mousemoving);
				noevent_default$1(event);
				gestures.mouse("end", event);
			}
			function touchstarted(event, d) {
				if (!filter.call(this, event, d)) return;
				var touches = event.changedTouches, c = container.call(this, event, d), n = touches.length, i, gesture;
				for (i = 0; i < n; ++i) if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
					nopropagation$1(event);
					gesture("start", event, touches[i]);
				}
			}
			function touchmoved(event) {
				var touches = event.changedTouches, n = touches.length, i, gesture;
				for (i = 0; i < n; ++i) if (gesture = gestures[touches[i].identifier]) {
					noevent_default$1(event);
					gesture("drag", event, touches[i]);
				}
			}
			function touchended(event) {
				var touches = event.changedTouches, n = touches.length, i, gesture;
				if (touchending) clearTimeout(touchending);
				touchending = setTimeout(function() {
					touchending = null;
				}, 500);
				for (i = 0; i < n; ++i) if (gesture = gestures[touches[i].identifier]) {
					nopropagation$1(event);
					gesture("end", event, touches[i]);
				}
			}
			function beforestart(that, container, event, d, identifier, touch) {
				var dispatch = listeners.copy(), p = pointer_default(touch || event, container), dx, dy, s;
				if ((s = subject.call(that, new DragEvent("beforestart", {
					sourceEvent: event,
					target: drag,
					identifier,
					active,
					x: p[0],
					y: p[1],
					dx: 0,
					dy: 0,
					dispatch
				}), d)) == null) return;
				dx = s.x - p[0] || 0;
				dy = s.y - p[1] || 0;
				return function gesture(type, event, touch) {
					var p0 = p, n;
					switch (type) {
						case "start":
							gestures[identifier] = gesture, n = active++;
							break;
						case "end": delete gestures[identifier], --active;
						case "drag":
							p = pointer_default(touch || event, container), n = active;
							break;
					}
					dispatch.call(type, that, new DragEvent(type, {
						sourceEvent: event,
						subject: s,
						target: drag,
						identifier,
						active: n,
						x: p[0] + dx,
						y: p[1] + dy,
						dx: p[0] - p0[0],
						dy: p[1] - p0[1],
						dispatch
					}), d);
				};
			}
			drag.filter = function(_) {
				return arguments.length ? (filter = typeof _ === "function" ? _ : constant_default$2(!!_), drag) : filter;
			};
			drag.container = function(_) {
				return arguments.length ? (container = typeof _ === "function" ? _ : constant_default$2(_), drag) : container;
			};
			drag.subject = function(_) {
				return arguments.length ? (subject = typeof _ === "function" ? _ : constant_default$2(_), drag) : subject;
			};
			drag.touchable = function(_) {
				return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default$2(!!_), drag) : touchable;
			};
			drag.on = function() {
				var value = listeners.on.apply(listeners, arguments);
				return value === listeners ? drag : value;
			};
			drag.clickDistance = function(_) {
				return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
			};
			return drag;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-color@3.1.0/node_modules/d3-color/src/define.js
		function define_default(constructor, factory, prototype) {
			constructor.prototype = factory.prototype = prototype;
			prototype.constructor = constructor;
		}
		function extend(parent, definition) {
			var prototype = Object.create(parent.prototype);
			for (var key in definition) prototype[key] = definition[key];
			return prototype;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-color@3.1.0/node_modules/d3-color/src/color.js
		function Color() {}
		var darker = .7;
		var brighter = 1 / darker;
		var reI = "\\s*([+-]?\\d+)\\s*";
		var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
		var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
		var reHex = /^#([0-9a-f]{3,8})$/;
		var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
		var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
		var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
		var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
		var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
		var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
		var named = {
			aliceblue: 15792383,
			antiquewhite: 16444375,
			aqua: 65535,
			aquamarine: 8388564,
			azure: 15794175,
			beige: 16119260,
			bisque: 16770244,
			black: 0,
			blanchedalmond: 16772045,
			blue: 255,
			blueviolet: 9055202,
			brown: 10824234,
			burlywood: 14596231,
			cadetblue: 6266528,
			chartreuse: 8388352,
			chocolate: 13789470,
			coral: 16744272,
			cornflowerblue: 6591981,
			cornsilk: 16775388,
			crimson: 14423100,
			cyan: 65535,
			darkblue: 139,
			darkcyan: 35723,
			darkgoldenrod: 12092939,
			darkgray: 11119017,
			darkgreen: 25600,
			darkgrey: 11119017,
			darkkhaki: 12433259,
			darkmagenta: 9109643,
			darkolivegreen: 5597999,
			darkorange: 16747520,
			darkorchid: 10040012,
			darkred: 9109504,
			darksalmon: 15308410,
			darkseagreen: 9419919,
			darkslateblue: 4734347,
			darkslategray: 3100495,
			darkslategrey: 3100495,
			darkturquoise: 52945,
			darkviolet: 9699539,
			deeppink: 16716947,
			deepskyblue: 49151,
			dimgray: 6908265,
			dimgrey: 6908265,
			dodgerblue: 2003199,
			firebrick: 11674146,
			floralwhite: 16775920,
			forestgreen: 2263842,
			fuchsia: 16711935,
			gainsboro: 14474460,
			ghostwhite: 16316671,
			gold: 16766720,
			goldenrod: 14329120,
			gray: 8421504,
			green: 32768,
			greenyellow: 11403055,
			grey: 8421504,
			honeydew: 15794160,
			hotpink: 16738740,
			indianred: 13458524,
			indigo: 4915330,
			ivory: 16777200,
			khaki: 15787660,
			lavender: 15132410,
			lavenderblush: 16773365,
			lawngreen: 8190976,
			lemonchiffon: 16775885,
			lightblue: 11393254,
			lightcoral: 15761536,
			lightcyan: 14745599,
			lightgoldenrodyellow: 16448210,
			lightgray: 13882323,
			lightgreen: 9498256,
			lightgrey: 13882323,
			lightpink: 16758465,
			lightsalmon: 16752762,
			lightseagreen: 2142890,
			lightskyblue: 8900346,
			lightslategray: 7833753,
			lightslategrey: 7833753,
			lightsteelblue: 11584734,
			lightyellow: 16777184,
			lime: 65280,
			limegreen: 3329330,
			linen: 16445670,
			magenta: 16711935,
			maroon: 8388608,
			mediumaquamarine: 6737322,
			mediumblue: 205,
			mediumorchid: 12211667,
			mediumpurple: 9662683,
			mediumseagreen: 3978097,
			mediumslateblue: 8087790,
			mediumspringgreen: 64154,
			mediumturquoise: 4772300,
			mediumvioletred: 13047173,
			midnightblue: 1644912,
			mintcream: 16121850,
			mistyrose: 16770273,
			moccasin: 16770229,
			navajowhite: 16768685,
			navy: 128,
			oldlace: 16643558,
			olive: 8421376,
			olivedrab: 7048739,
			orange: 16753920,
			orangered: 16729344,
			orchid: 14315734,
			palegoldenrod: 15657130,
			palegreen: 10025880,
			paleturquoise: 11529966,
			palevioletred: 14381203,
			papayawhip: 16773077,
			peachpuff: 16767673,
			peru: 13468991,
			pink: 16761035,
			plum: 14524637,
			powderblue: 11591910,
			purple: 8388736,
			rebeccapurple: 6697881,
			red: 16711680,
			rosybrown: 12357519,
			royalblue: 4286945,
			saddlebrown: 9127187,
			salmon: 16416882,
			sandybrown: 16032864,
			seagreen: 3050327,
			seashell: 16774638,
			sienna: 10506797,
			silver: 12632256,
			skyblue: 8900331,
			slateblue: 6970061,
			slategray: 7372944,
			slategrey: 7372944,
			snow: 16775930,
			springgreen: 65407,
			steelblue: 4620980,
			tan: 13808780,
			teal: 32896,
			thistle: 14204888,
			tomato: 16737095,
			turquoise: 4251856,
			violet: 15631086,
			wheat: 16113331,
			white: 16777215,
			whitesmoke: 16119285,
			yellow: 16776960,
			yellowgreen: 10145074
		};
		define_default(Color, color, {
			copy(channels) {
				return Object.assign(new this.constructor(), this, channels);
			},
			displayable() {
				return this.rgb().displayable();
			},
			hex: color_formatHex,
			formatHex: color_formatHex,
			formatHex8: color_formatHex8,
			formatHsl: color_formatHsl,
			formatRgb: color_formatRgb,
			toString: color_formatRgb
		});
		function color_formatHex() {
			return this.rgb().formatHex();
		}
		function color_formatHex8() {
			return this.rgb().formatHex8();
		}
		function color_formatHsl() {
			return hslConvert(this).formatHsl();
		}
		function color_formatRgb() {
			return this.rgb().formatRgb();
		}
		function color(format) {
			var m, l;
			format = (format + "").trim().toLowerCase();
			return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
		}
		function rgbn(n) {
			return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
		}
		function rgba(r, g, b, a) {
			if (a <= 0) r = g = b = NaN;
			return new Rgb(r, g, b, a);
		}
		function rgbConvert(o) {
			if (!(o instanceof Color)) o = color(o);
			if (!o) return new Rgb();
			o = o.rgb();
			return new Rgb(o.r, o.g, o.b, o.opacity);
		}
		function rgb(r, g, b, opacity) {
			return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
		}
		function Rgb(r, g, b, opacity) {
			this.r = +r;
			this.g = +g;
			this.b = +b;
			this.opacity = +opacity;
		}
		define_default(Rgb, rgb, extend(Color, {
			brighter(k) {
				k = k == null ? brighter : Math.pow(brighter, k);
				return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
			},
			darker(k) {
				k = k == null ? darker : Math.pow(darker, k);
				return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
			},
			rgb() {
				return this;
			},
			clamp() {
				return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
			},
			displayable() {
				return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
			},
			hex: rgb_formatHex,
			formatHex: rgb_formatHex,
			formatHex8: rgb_formatHex8,
			formatRgb: rgb_formatRgb,
			toString: rgb_formatRgb
		}));
		function rgb_formatHex() {
			return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
		}
		function rgb_formatHex8() {
			return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
		}
		function rgb_formatRgb() {
			const a = clampa(this.opacity);
			return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
		}
		function clampa(opacity) {
			return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
		}
		function clampi(value) {
			return Math.max(0, Math.min(255, Math.round(value) || 0));
		}
		function hex(value) {
			value = clampi(value);
			return (value < 16 ? "0" : "") + value.toString(16);
		}
		function hsla(h, s, l, a) {
			if (a <= 0) h = s = l = NaN;
			else if (l <= 0 || l >= 1) h = s = NaN;
			else if (s <= 0) h = NaN;
			return new Hsl(h, s, l, a);
		}
		function hslConvert(o) {
			if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
			if (!(o instanceof Color)) o = color(o);
			if (!o) return new Hsl();
			if (o instanceof Hsl) return o;
			o = o.rgb();
			var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
			if (s) {
				if (r === max) h = (g - b) / s + (g < b) * 6;
				else if (g === max) h = (b - r) / s + 2;
				else h = (r - g) / s + 4;
				s /= l < .5 ? max + min : 2 - max - min;
				h *= 60;
			} else s = l > 0 && l < 1 ? 0 : h;
			return new Hsl(h, s, l, o.opacity);
		}
		function hsl(h, s, l, opacity) {
			return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
		}
		function Hsl(h, s, l, opacity) {
			this.h = +h;
			this.s = +s;
			this.l = +l;
			this.opacity = +opacity;
		}
		define_default(Hsl, hsl, extend(Color, {
			brighter(k) {
				k = k == null ? brighter : Math.pow(brighter, k);
				return new Hsl(this.h, this.s, this.l * k, this.opacity);
			},
			darker(k) {
				k = k == null ? darker : Math.pow(darker, k);
				return new Hsl(this.h, this.s, this.l * k, this.opacity);
			},
			rgb() {
				var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < .5 ? l : 1 - l) * s, m1 = 2 * l - m2;
				return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
			},
			clamp() {
				return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
			},
			displayable() {
				return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
			},
			formatHsl() {
				const a = clampa(this.opacity);
				return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
			}
		}));
		function clamph(value) {
			value = (value || 0) % 360;
			return value < 0 ? value + 360 : value;
		}
		function clampt(value) {
			return Math.max(0, Math.min(1, value || 0));
		}
		function hsl2rgb(h, m1, m2) {
			return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js
		var constant_default$1 = (x) => () => x;
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js
		function linear(a, d) {
			return function(t) {
				return a + t * d;
			};
		}
		function exponential(a, b, y) {
			return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
				return Math.pow(a + t * b, y);
			};
		}
		function gamma(y) {
			return (y = +y) === 1 ? nogamma : function(a, b) {
				return b - a ? exponential(a, b, y) : constant_default$1(isNaN(a) ? b : a);
			};
		}
		function nogamma(a, b) {
			var d = b - a;
			return d ? linear(a, d) : constant_default$1(isNaN(a) ? b : a);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js
		var rgb_default = (function rgbGamma(y) {
			var color = gamma(y);
			function rgb$1(start, end) {
				var r = color((start = rgb(start)).r, (end = rgb(end)).r), g = color(start.g, end.g), b = color(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
				return function(t) {
					start.r = r(t);
					start.g = g(t);
					start.b = b(t);
					start.opacity = opacity(t);
					return start + "";
				};
			}
			rgb$1.gamma = rgbGamma;
			return rgb$1;
		})(1);
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/numberArray.js
		function numberArray_default(a, b) {
			if (!b) b = [];
			var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
			return function(t) {
				for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
				return c;
			};
		}
		function isNumberArray(x) {
			return ArrayBuffer.isView(x) && !(x instanceof DataView);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/array.js
		function genericArray(a, b) {
			var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i;
			for (i = 0; i < na; ++i) x[i] = value_default(a[i], b[i]);
			for (; i < nb; ++i) c[i] = b[i];
			return function(t) {
				for (i = 0; i < na; ++i) c[i] = x[i](t);
				return c;
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/date.js
		function date_default(a, b) {
			var d = /* @__PURE__ */ new Date();
			return a = +a, b = +b, function(t) {
				return d.setTime(a * (1 - t) + b * t), d;
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js
		function number_default(a, b) {
			return a = +a, b = +b, function(t) {
				return a * (1 - t) + b * t;
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/object.js
		function object_default(a, b) {
			var i = {}, c = {}, k;
			if (a === null || typeof a !== "object") a = {};
			if (b === null || typeof b !== "object") b = {};
			for (k in b) if (k in a) i[k] = value_default(a[k], b[k]);
			else c[k] = b[k];
			return function(t) {
				for (k in i) c[k] = i[k](t);
				return c;
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js
		var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
		var reB = new RegExp(reA.source, "g");
		function zero(b) {
			return function() {
				return b;
			};
		}
		function one(b) {
			return function(t) {
				return b(t) + "";
			};
		}
		function string_default(a, b) {
			var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
			a = a + "", b = b + "";
			while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
				if ((bs = bm.index) > bi) {
					bs = b.slice(bi, bs);
					if (s[i]) s[i] += bs;
					else s[++i] = bs;
				}
				if ((am = am[0]) === (bm = bm[0])) if (s[i]) s[i] += bm;
				else s[++i] = bm;
				else {
					s[++i] = null;
					q.push({
						i,
						x: number_default(am, bm)
					});
				}
				bi = reB.lastIndex;
			}
			if (bi < b.length) {
				bs = b.slice(bi);
				if (s[i]) s[i] += bs;
				else s[++i] = bs;
			}
			return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function(t) {
				for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
				return s.join("");
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/value.js
		function value_default(a, b) {
			var t = typeof b, c;
			return b == null || t === "boolean" ? constant_default$1(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js
		var degrees = 180 / Math.PI;
		var identity$2 = {
			translateX: 0,
			translateY: 0,
			rotate: 0,
			skewX: 0,
			scaleX: 1,
			scaleY: 1
		};
		function decompose_default(a, b, c, d, e, f) {
			var scaleX, scaleY, skewX;
			if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
			if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
			if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
			if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
			return {
				translateX: e,
				translateY: f,
				rotate: Math.atan2(b, a) * degrees,
				skewX: Math.atan(skewX) * degrees,
				scaleX,
				scaleY
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js
		var svgNode;
		function parseCss(value) {
			const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
			return m.isIdentity ? identity$2 : decompose_default(m.a, m.b, m.c, m.d, m.e, m.f);
		}
		function parseSvg(value) {
			if (value == null) return identity$2;
			if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
			svgNode.setAttribute("transform", value);
			if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
			value = value.matrix;
			return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js
		function interpolateTransform(parse, pxComma, pxParen, degParen) {
			function pop(s) {
				return s.length ? s.pop() + " " : "";
			}
			function translate(xa, ya, xb, yb, s, q) {
				if (xa !== xb || ya !== yb) {
					var i = s.push("translate(", null, pxComma, null, pxParen);
					q.push({
						i: i - 4,
						x: number_default(xa, xb)
					}, {
						i: i - 2,
						x: number_default(ya, yb)
					});
				} else if (xb || yb) s.push("translate(" + xb + pxComma + yb + pxParen);
			}
			function rotate(a, b, s, q) {
				if (a !== b) {
					if (a - b > 180) b += 360;
					else if (b - a > 180) a += 360;
					q.push({
						i: s.push(pop(s) + "rotate(", null, degParen) - 2,
						x: number_default(a, b)
					});
				} else if (b) s.push(pop(s) + "rotate(" + b + degParen);
			}
			function skewX(a, b, s, q) {
				if (a !== b) q.push({
					i: s.push(pop(s) + "skewX(", null, degParen) - 2,
					x: number_default(a, b)
				});
				else if (b) s.push(pop(s) + "skewX(" + b + degParen);
			}
			function scale(xa, ya, xb, yb, s, q) {
				if (xa !== xb || ya !== yb) {
					var i = s.push(pop(s) + "scale(", null, ",", null, ")");
					q.push({
						i: i - 4,
						x: number_default(xa, xb)
					}, {
						i: i - 2,
						x: number_default(ya, yb)
					});
				} else if (xb !== 1 || yb !== 1) s.push(pop(s) + "scale(" + xb + "," + yb + ")");
			}
			return function(a, b) {
				var s = [], q = [];
				a = parse(a), b = parse(b);
				translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
				rotate(a.rotate, b.rotate, s, q);
				skewX(a.skewX, b.skewX, s, q);
				scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
				a = b = null;
				return function(t) {
					var i = -1, n = q.length, o;
					while (++i < n) s[(o = q[i]).i] = o.x(t);
					return s.join("");
				};
			};
		}
		var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
		var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
		//#endregion
		//#region node_modules/.pnpm/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/zoom.js
		var epsilon2 = 1e-12;
		function cosh(x) {
			return ((x = Math.exp(x)) + 1 / x) / 2;
		}
		function sinh(x) {
			return ((x = Math.exp(x)) - 1 / x) / 2;
		}
		function tanh(x) {
			return ((x = Math.exp(2 * x)) - 1) / (x + 1);
		}
		var zoom_default$1 = (function zoomRho(rho, rho2, rho4) {
			function zoom(p0, p1) {
				var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
				if (d2 < epsilon2) {
					S = Math.log(w1 / w0) / rho;
					i = function(t) {
						return [
							ux0 + t * dx,
							uy0 + t * dy,
							w0 * Math.exp(rho * t * S)
						];
					};
				} else {
					var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
					S = (Math.log(Math.sqrt(b1 * b1 + 1) - b1) - r0) / rho;
					i = function(t) {
						var s = t * S, coshr0 = cosh(r0), u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
						return [
							ux0 + u * dx,
							uy0 + u * dy,
							w0 * coshr0 / cosh(rho * s + r0)
						];
					};
				}
				i.duration = S * 1e3 * rho / Math.SQRT2;
				return i;
			}
			zoom.rho = function(_) {
				var _1 = Math.max(.001, +_), _2 = _1 * _1;
				return zoomRho(_1, _2, _2 * _2);
			};
			return zoom;
		})(Math.SQRT2, 2, 4);
		//#endregion
		//#region node_modules/.pnpm/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js
		var frame = 0;
		var timeout = 0;
		var interval = 0;
		var pokeDelay = 1e3;
		var taskHead;
		var taskTail;
		var clockLast = 0;
		var clockNow = 0;
		var clockSkew = 0;
		var clock = typeof performance === "object" && performance.now ? performance : Date;
		var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
			setTimeout(f, 17);
		};
		function now() {
			return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
		}
		function clearNow() {
			clockNow = 0;
		}
		function Timer() {
			this._call = this._time = this._next = null;
		}
		Timer.prototype = timer.prototype = {
			constructor: Timer,
			restart: function(callback, delay, time) {
				if (typeof callback !== "function") throw new TypeError("callback is not a function");
				time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
				if (!this._next && taskTail !== this) {
					if (taskTail) taskTail._next = this;
					else taskHead = this;
					taskTail = this;
				}
				this._call = callback;
				this._time = time;
				sleep();
			},
			stop: function() {
				if (this._call) {
					this._call = null;
					this._time = Infinity;
					sleep();
				}
			}
		};
		function timer(callback, delay, time) {
			var t = new Timer();
			t.restart(callback, delay, time);
			return t;
		}
		function timerFlush() {
			now();
			++frame;
			var t = taskHead, e;
			while (t) {
				if ((e = clockNow - t._time) >= 0) t._call.call(void 0, e);
				t = t._next;
			}
			--frame;
		}
		function wake() {
			clockNow = (clockLast = clock.now()) + clockSkew;
			frame = timeout = 0;
			try {
				timerFlush();
			} finally {
				frame = 0;
				nap();
				clockNow = 0;
			}
		}
		function poke() {
			var now = clock.now(), delay = now - clockLast;
			if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
		}
		function nap() {
			var t0, t1 = taskHead, t2, time = Infinity;
			while (t1) if (t1._call) {
				if (time > t1._time) time = t1._time;
				t0 = t1, t1 = t1._next;
			} else {
				t2 = t1._next, t1._next = null;
				t1 = t0 ? t0._next = t2 : taskHead = t2;
			}
			taskTail = t0;
			sleep(time);
		}
		function sleep(time) {
			if (frame) return;
			if (timeout) timeout = clearTimeout(timeout);
			if (time - clockNow > 24) {
				if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
				if (interval) interval = clearInterval(interval);
			} else {
				if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
				frame = 1, setFrame(wake);
			}
		}
		//#endregion
		//#region node_modules/.pnpm/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js
		function timeout_default(callback, delay, time) {
			var t = new Timer();
			delay = delay == null ? 0 : +delay;
			t.restart((elapsed) => {
				t.stop();
				callback(elapsed + delay);
			}, delay, time);
			return t;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/schedule.js
		var emptyOn = dispatch("start", "end", "cancel", "interrupt");
		var emptyTween = [];
		function schedule_default(node, name, id, index, group, timing) {
			var schedules = node.__transition;
			if (!schedules) node.__transition = {};
			else if (id in schedules) return;
			create(node, id, {
				name,
				index,
				group,
				on: emptyOn,
				tween: emptyTween,
				time: timing.time,
				delay: timing.delay,
				duration: timing.duration,
				ease: timing.ease,
				timer: null,
				state: 0
			});
		}
		function init(node, id) {
			var schedule = get(node, id);
			if (schedule.state > 0) throw new Error("too late; already scheduled");
			return schedule;
		}
		function set(node, id) {
			var schedule = get(node, id);
			if (schedule.state > 3) throw new Error("too late; already running");
			return schedule;
		}
		function get(node, id) {
			var schedule = node.__transition;
			if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
			return schedule;
		}
		function create(node, id, self) {
			var schedules = node.__transition, tween;
			schedules[id] = self;
			self.timer = timer(schedule, 0, self.time);
			function schedule(elapsed) {
				self.state = 1;
				self.timer.restart(start, self.delay, self.time);
				if (self.delay <= elapsed) start(elapsed - self.delay);
			}
			function start(elapsed) {
				var i, j, n, o;
				if (self.state !== 1) return stop();
				for (i in schedules) {
					o = schedules[i];
					if (o.name !== self.name) continue;
					if (o.state === 3) return timeout_default(start);
					if (o.state === 4) {
						o.state = 6;
						o.timer.stop();
						o.on.call("interrupt", node, node.__data__, o.index, o.group);
						delete schedules[i];
					} else if (+i < id) {
						o.state = 6;
						o.timer.stop();
						o.on.call("cancel", node, node.__data__, o.index, o.group);
						delete schedules[i];
					}
				}
				timeout_default(function() {
					if (self.state === 3) {
						self.state = 4;
						self.timer.restart(tick, self.delay, self.time);
						tick(elapsed);
					}
				});
				self.state = 2;
				self.on.call("start", node, node.__data__, self.index, self.group);
				if (self.state !== 2) return;
				self.state = 3;
				tween = new Array(n = self.tween.length);
				for (i = 0, j = -1; i < n; ++i) if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) tween[++j] = o;
				tween.length = j + 1;
			}
			function tick(elapsed) {
				var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = 5, 1), i = -1, n = tween.length;
				while (++i < n) tween[i].call(node, t);
				if (self.state === 5) {
					self.on.call("end", node, node.__data__, self.index, self.group);
					stop();
				}
			}
			function stop() {
				self.state = 6;
				self.timer.stop();
				delete schedules[id];
				for (var i in schedules) return;
				delete node.__transition;
			}
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/interrupt.js
		function interrupt_default$1(node, name) {
			var schedules = node.__transition, schedule, active, empty = true, i;
			if (!schedules) return;
			name = name == null ? null : name + "";
			for (i in schedules) {
				if ((schedule = schedules[i]).name !== name) {
					empty = false;
					continue;
				}
				active = schedule.state > 2 && schedule.state < 5;
				schedule.state = 6;
				schedule.timer.stop();
				schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
				delete schedules[i];
			}
			if (empty) delete node.__transition;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/interrupt.js
		function interrupt_default(name) {
			return this.each(function() {
				interrupt_default$1(this, name);
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/tween.js
		function tweenRemove(id, name) {
			var tween0, tween1;
			return function() {
				var schedule = set(this, id), tween = schedule.tween;
				if (tween !== tween0) {
					tween1 = tween0 = tween;
					for (var i = 0, n = tween1.length; i < n; ++i) if (tween1[i].name === name) {
						tween1 = tween1.slice();
						tween1.splice(i, 1);
						break;
					}
				}
				schedule.tween = tween1;
			};
		}
		function tweenFunction(id, name, value) {
			var tween0, tween1;
			if (typeof value !== "function") throw new Error();
			return function() {
				var schedule = set(this, id), tween = schedule.tween;
				if (tween !== tween0) {
					tween1 = (tween0 = tween).slice();
					for (var t = {
						name,
						value
					}, i = 0, n = tween1.length; i < n; ++i) if (tween1[i].name === name) {
						tween1[i] = t;
						break;
					}
					if (i === n) tween1.push(t);
				}
				schedule.tween = tween1;
			};
		}
		function tween_default(name, value) {
			var id = this._id;
			name += "";
			if (arguments.length < 2) {
				var tween = get(this.node(), id).tween;
				for (var i = 0, n = tween.length, t; i < n; ++i) if ((t = tween[i]).name === name) return t.value;
				return null;
			}
			return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
		}
		function tweenValue(transition, name, value) {
			var id = transition._id;
			transition.each(function() {
				var schedule = set(this, id);
				(schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
			});
			return function(node) {
				return get(node, id).value[name];
			};
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/interpolate.js
		function interpolate_default(a, b) {
			var c;
			return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c = color(b)) ? (b = c, rgb_default) : string_default)(a, b);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/attr.js
		function attrRemove(name) {
			return function() {
				this.removeAttribute(name);
			};
		}
		function attrRemoveNS(fullname) {
			return function() {
				this.removeAttributeNS(fullname.space, fullname.local);
			};
		}
		function attrConstant(name, interpolate, value1) {
			var string00, string1 = value1 + "", interpolate0;
			return function() {
				var string0 = this.getAttribute(name);
				return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
			};
		}
		function attrConstantNS(fullname, interpolate, value1) {
			var string00, string1 = value1 + "", interpolate0;
			return function() {
				var string0 = this.getAttributeNS(fullname.space, fullname.local);
				return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
			};
		}
		function attrFunction(name, interpolate, value) {
			var string00, string10, interpolate0;
			return function() {
				var string0, value1 = value(this), string1;
				if (value1 == null) return void this.removeAttribute(name);
				string0 = this.getAttribute(name);
				string1 = value1 + "";
				return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
			};
		}
		function attrFunctionNS(fullname, interpolate, value) {
			var string00, string10, interpolate0;
			return function() {
				var string0, value1 = value(this), string1;
				if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
				string0 = this.getAttributeNS(fullname.space, fullname.local);
				string1 = value1 + "";
				return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
			};
		}
		function attr_default(name, value) {
			var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
			return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname) : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/attrTween.js
		function attrInterpolate(name, i) {
			return function(t) {
				this.setAttribute(name, i.call(this, t));
			};
		}
		function attrInterpolateNS(fullname, i) {
			return function(t) {
				this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
			};
		}
		function attrTweenNS(fullname, value) {
			var t0, i0;
			function tween() {
				var i = value.apply(this, arguments);
				if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
				return t0;
			}
			tween._value = value;
			return tween;
		}
		function attrTween(name, value) {
			var t0, i0;
			function tween() {
				var i = value.apply(this, arguments);
				if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
				return t0;
			}
			tween._value = value;
			return tween;
		}
		function attrTween_default(name, value) {
			var key = "attr." + name;
			if (arguments.length < 2) return (key = this.tween(key)) && key._value;
			if (value == null) return this.tween(key, null);
			if (typeof value !== "function") throw new Error();
			var fullname = namespace_default(name);
			return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/delay.js
		function delayFunction(id, value) {
			return function() {
				init(this, id).delay = +value.apply(this, arguments);
			};
		}
		function delayConstant(id, value) {
			return value = +value, function() {
				init(this, id).delay = value;
			};
		}
		function delay_default(value) {
			var id = this._id;
			return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value)) : get(this.node(), id).delay;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/duration.js
		function durationFunction(id, value) {
			return function() {
				set(this, id).duration = +value.apply(this, arguments);
			};
		}
		function durationConstant(id, value) {
			return value = +value, function() {
				set(this, id).duration = value;
			};
		}
		function duration_default(value) {
			var id = this._id;
			return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value)) : get(this.node(), id).duration;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/ease.js
		function easeConstant(id, value) {
			if (typeof value !== "function") throw new Error();
			return function() {
				set(this, id).ease = value;
			};
		}
		function ease_default(value) {
			var id = this._id;
			return arguments.length ? this.each(easeConstant(id, value)) : get(this.node(), id).ease;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/easeVarying.js
		function easeVarying(id, value) {
			return function() {
				var v = value.apply(this, arguments);
				if (typeof v !== "function") throw new Error();
				set(this, id).ease = v;
			};
		}
		function easeVarying_default(value) {
			if (typeof value !== "function") throw new Error();
			return this.each(easeVarying(this._id, value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/filter.js
		function filter_default(match) {
			if (typeof match !== "function") match = matcher_default(match);
			for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) if ((node = group[i]) && match.call(node, node.__data__, i, group)) subgroup.push(node);
			return new Transition(subgroups, this._parents, this._name, this._id);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/merge.js
		function merge_default(transition) {
			if (transition._id !== this._id) throw new Error();
			for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) if (node = group0[i] || group1[i]) merge[i] = node;
			for (; j < m0; ++j) merges[j] = groups0[j];
			return new Transition(merges, this._parents, this._name, this._id);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/on.js
		function start(name) {
			return (name + "").trim().split(/^|\s+/).every(function(t) {
				var i = t.indexOf(".");
				if (i >= 0) t = t.slice(0, i);
				return !t || t === "start";
			});
		}
		function onFunction(id, name, listener) {
			var on0, on1, sit = start(name) ? init : set;
			return function() {
				var schedule = sit(this, id), on = schedule.on;
				if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);
				schedule.on = on1;
			};
		}
		function on_default(name, listener) {
			var id = this._id;
			return arguments.length < 2 ? get(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/remove.js
		function removeFunction(id) {
			return function() {
				var parent = this.parentNode;
				for (var i in this.__transition) if (+i !== id) return;
				if (parent) parent.removeChild(this);
			};
		}
		function remove_default() {
			return this.on("end.remove", removeFunction(this._id));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/select.js
		function select_default(select) {
			var name = this._name, id = this._id;
			if (typeof select !== "function") select = selector_default(select);
			for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
				if ("__data__" in node) subnode.__data__ = node.__data__;
				subgroup[i] = subnode;
				schedule_default(subgroup[i], name, id, i, subgroup, get(node, id));
			}
			return new Transition(subgroups, this._parents, name, id);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/selectAll.js
		function selectAll_default(select) {
			var name = this._name, id = this._id;
			if (typeof select !== "function") select = selectorAll_default(select);
			for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) if (node = group[i]) {
				for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) if (child = children[k]) schedule_default(child, name, id, k, children, inherit);
				subgroups.push(children);
				parents.push(node);
			}
			return new Transition(subgroups, parents, name, id);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/selection.js
		var Selection = selection.prototype.constructor;
		function selection_default() {
			return new Selection(this._groups, this._parents);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/style.js
		function styleNull(name, interpolate) {
			var string00, string10, interpolate0;
			return function() {
				var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
				return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
			};
		}
		function styleRemove(name) {
			return function() {
				this.style.removeProperty(name);
			};
		}
		function styleConstant(name, interpolate, value1) {
			var string00, string1 = value1 + "", interpolate0;
			return function() {
				var string0 = styleValue(this, name);
				return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
			};
		}
		function styleFunction(name, interpolate, value) {
			var string00, string10, interpolate0;
			return function() {
				var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
				if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
				return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
			};
		}
		function styleMaybeRemove(id, name) {
			var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
			return function() {
				var schedule = set(this, id), on = schedule.on, listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : void 0;
				if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);
				schedule.on = on1;
			};
		}
		function style_default(name, value, priority) {
			var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
			return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove(name)) : typeof value === "function" ? this.styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant(name, i, value), priority).on("end.style." + name, null);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/styleTween.js
		function styleInterpolate(name, i, priority) {
			return function(t) {
				this.style.setProperty(name, i.call(this, t), priority);
			};
		}
		function styleTween(name, value, priority) {
			var t, i0;
			function tween() {
				var i = value.apply(this, arguments);
				if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
				return t;
			}
			tween._value = value;
			return tween;
		}
		function styleTween_default(name, value, priority) {
			var key = "style." + (name += "");
			if (arguments.length < 2) return (key = this.tween(key)) && key._value;
			if (value == null) return this.tween(key, null);
			if (typeof value !== "function") throw new Error();
			return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/text.js
		function textConstant(value) {
			return function() {
				this.textContent = value;
			};
		}
		function textFunction(value) {
			return function() {
				var value1 = value(this);
				this.textContent = value1 == null ? "" : value1;
			};
		}
		function text_default(value) {
			return this.tween("text", typeof value === "function" ? textFunction(tweenValue(this, "text", value)) : textConstant(value == null ? "" : value + ""));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/textTween.js
		function textInterpolate(i) {
			return function(t) {
				this.textContent = i.call(this, t);
			};
		}
		function textTween(value) {
			var t0, i0;
			function tween() {
				var i = value.apply(this, arguments);
				if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
				return t0;
			}
			tween._value = value;
			return tween;
		}
		function textTween_default(value) {
			var key = "text";
			if (arguments.length < 1) return (key = this.tween(key)) && key._value;
			if (value == null) return this.tween(key, null);
			if (typeof value !== "function") throw new Error();
			return this.tween(key, textTween(value));
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/transition.js
		function transition_default$1() {
			var name = this._name, id0 = this._id, id1 = newId();
			for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) if (node = group[i]) {
				var inherit = get(node, id0);
				schedule_default(node, name, id1, i, group, {
					time: inherit.time + inherit.delay + inherit.duration,
					delay: 0,
					duration: inherit.duration,
					ease: inherit.ease
				});
			}
			return new Transition(groups, this._parents, name, id1);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/end.js
		function end_default() {
			var on0, on1, that = this, id = that._id, size = that.size();
			return new Promise(function(resolve, reject) {
				var cancel = { value: reject }, end = { value: function() {
					if (--size === 0) resolve();
				} };
				that.each(function() {
					var schedule = set(this, id), on = schedule.on;
					if (on !== on0) {
						on1 = (on0 = on).copy();
						on1._.cancel.push(cancel);
						on1._.interrupt.push(cancel);
						on1._.end.push(end);
					}
					schedule.on = on1;
				});
				if (size === 0) resolve();
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/index.js
		var id = 0;
		function Transition(groups, parents, name, id) {
			this._groups = groups;
			this._parents = parents;
			this._name = name;
			this._id = id;
		}
		function transition(name) {
			return selection().transition(name);
		}
		function newId() {
			return ++id;
		}
		var selection_prototype = selection.prototype;
		Transition.prototype = transition.prototype = {
			constructor: Transition,
			select: select_default,
			selectAll: selectAll_default,
			selectChild: selection_prototype.selectChild,
			selectChildren: selection_prototype.selectChildren,
			filter: filter_default,
			merge: merge_default,
			selection: selection_default,
			transition: transition_default$1,
			call: selection_prototype.call,
			nodes: selection_prototype.nodes,
			node: selection_prototype.node,
			size: selection_prototype.size,
			empty: selection_prototype.empty,
			each: selection_prototype.each,
			on: on_default,
			attr: attr_default,
			attrTween: attrTween_default,
			style: style_default,
			styleTween: styleTween_default,
			text: text_default,
			textTween: textTween_default,
			remove: remove_default,
			tween: tween_default,
			delay: delay_default,
			duration: duration_default,
			ease: ease_default,
			easeVarying: easeVarying_default,
			end: end_default,
			[Symbol.iterator]: selection_prototype[Symbol.iterator]
		};
		//#endregion
		//#region node_modules/.pnpm/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js
		function cubicInOut(t) {
			return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/transition.js
		var defaultTiming = {
			time: null,
			delay: 0,
			duration: 250,
			ease: cubicInOut
		};
		function inherit(node, id) {
			var timing;
			while (!(timing = node.__transition) || !(timing = timing[id])) if (!(node = node.parentNode)) throw new Error(`transition ${id} not found`);
			return timing;
		}
		function transition_default(name) {
			var id, timing;
			if (name instanceof Transition) id = name._id, name = name._name;
			else id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
			for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) if (node = group[i]) schedule_default(node, name, id, i, group, timing || inherit(node, id));
			return new Transition(groups, this._parents, name, id);
		}
		//#endregion
		//#region node_modules/.pnpm/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/index.js
		selection.prototype.interrupt = interrupt_default;
		selection.prototype.transition = transition_default;
		//#endregion
		//#region node_modules/.pnpm/d3-zoom@3.0.0/node_modules/d3-zoom/src/constant.js
		var constant_default = (x) => () => x;
		//#endregion
		//#region node_modules/.pnpm/d3-zoom@3.0.0/node_modules/d3-zoom/src/event.js
		function ZoomEvent(type, { sourceEvent, target, transform, dispatch }) {
			Object.defineProperties(this, {
				type: {
					value: type,
					enumerable: true,
					configurable: true
				},
				sourceEvent: {
					value: sourceEvent,
					enumerable: true,
					configurable: true
				},
				target: {
					value: target,
					enumerable: true,
					configurable: true
				},
				transform: {
					value: transform,
					enumerable: true,
					configurable: true
				},
				_: { value: dispatch }
			});
		}
		//#endregion
		//#region node_modules/.pnpm/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js
		function Transform(k, x, y) {
			this.k = k;
			this.x = x;
			this.y = y;
		}
		Transform.prototype = {
			constructor: Transform,
			scale: function(k) {
				return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
			},
			translate: function(x, y) {
				return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
			},
			apply: function(point) {
				return [point[0] * this.k + this.x, point[1] * this.k + this.y];
			},
			applyX: function(x) {
				return x * this.k + this.x;
			},
			applyY: function(y) {
				return y * this.k + this.y;
			},
			invert: function(location) {
				return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
			},
			invertX: function(x) {
				return (x - this.x) / this.k;
			},
			invertY: function(y) {
				return (y - this.y) / this.k;
			},
			rescaleX: function(x) {
				return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
			},
			rescaleY: function(y) {
				return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
			},
			toString: function() {
				return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
			}
		};
		var identity$1 = new Transform(1, 0, 0);
		transform.prototype = Transform.prototype;
		function transform(node) {
			while (!node.__zoom) if (!(node = node.parentNode)) return identity$1;
			return node.__zoom;
		}
		//#endregion
		//#region node_modules/.pnpm/d3-zoom@3.0.0/node_modules/d3-zoom/src/noevent.js
		function nopropagation(event) {
			event.stopImmediatePropagation();
		}
		function noevent_default(event) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
		//#endregion
		//#region node_modules/.pnpm/d3-zoom@3.0.0/node_modules/d3-zoom/src/zoom.js
		function defaultFilter(event) {
			return (!event.ctrlKey || event.type === "wheel") && !event.button;
		}
		function defaultExtent() {
			var e = this;
			if (e instanceof SVGElement) {
				e = e.ownerSVGElement || e;
				if (e.hasAttribute("viewBox")) {
					e = e.viewBox.baseVal;
					return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
				}
				return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
			}
			return [[0, 0], [e.clientWidth, e.clientHeight]];
		}
		function defaultTransform() {
			return this.__zoom || identity$1;
		}
		function defaultWheelDelta(event) {
			return -event.deltaY * (event.deltaMode === 1 ? .05 : event.deltaMode ? 1 : .002) * (event.ctrlKey ? 10 : 1);
		}
		function defaultTouchable() {
			return navigator.maxTouchPoints || "ontouchstart" in this;
		}
		function defaultConstrain(transform, extent, translateExtent) {
			var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0], dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
			return transform.translate(dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1), dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1));
		}
		function zoom_default() {
			var filter = defaultFilter, extent = defaultExtent, constrain = defaultConstrain, wheelDelta = defaultWheelDelta, touchable = defaultTouchable, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate = zoom_default$1, listeners = dispatch("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
			function zoom(selection) {
				selection.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
			}
			zoom.transform = function(collection, transform, point, event) {
				var selection = collection.selection ? collection.selection() : collection;
				selection.property("__zoom", defaultTransform);
				if (collection !== selection) schedule(collection, transform, point, event);
				else selection.interrupt().each(function() {
					gesture(this, arguments).event(event).start().zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform).end();
				});
			};
			zoom.scaleBy = function(selection, k, p, event) {
				zoom.scaleTo(selection, function() {
					return this.__zoom.k * (typeof k === "function" ? k.apply(this, arguments) : k);
				}, p, event);
			};
			zoom.scaleTo = function(selection, k, p, event) {
				zoom.transform(selection, function() {
					var e = extent.apply(this, arguments), t0 = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p, p1 = t0.invert(p0), k1 = typeof k === "function" ? k.apply(this, arguments) : k;
					return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
				}, p, event);
			};
			zoom.translateBy = function(selection, x, y, event) {
				zoom.transform(selection, function() {
					return constrain(this.__zoom.translate(typeof x === "function" ? x.apply(this, arguments) : x, typeof y === "function" ? y.apply(this, arguments) : y), extent.apply(this, arguments), translateExtent);
				}, null, event);
			};
			zoom.translateTo = function(selection, x, y, p, event) {
				zoom.transform(selection, function() {
					var e = extent.apply(this, arguments), t = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
					return constrain(identity$1.translate(p0[0], p0[1]).scale(t.k).translate(typeof x === "function" ? -x.apply(this, arguments) : -x, typeof y === "function" ? -y.apply(this, arguments) : -y), e, translateExtent);
				}, p, event);
			};
			function scale(transform, k) {
				k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
				return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
			}
			function translate(transform, p0, p1) {
				var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
				return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
			}
			function centroid(extent) {
				return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
			}
			function schedule(transition, transform, point, event) {
				transition.on("start.zoom", function() {
					gesture(this, arguments).event(event).start();
				}).on("interrupt.zoom end.zoom", function() {
					gesture(this, arguments).event(event).end();
				}).tween("zoom", function() {
					var that = this, args = arguments, g = gesture(that, args).event(event), e = extent.apply(that, args), p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point, w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]), a = that.__zoom, b = typeof transform === "function" ? transform.apply(that, args) : transform, i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
					return function(t) {
						if (t === 1) t = b;
						else {
							var l = i(t), k = w / l[2];
							t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k);
						}
						g.zoom(null, t);
					};
				});
			}
			function gesture(that, args, clean) {
				return !clean && that.__zooming || new Gesture(that, args);
			}
			function Gesture(that, args) {
				this.that = that;
				this.args = args;
				this.active = 0;
				this.sourceEvent = null;
				this.extent = extent.apply(that, args);
				this.taps = 0;
			}
			Gesture.prototype = {
				event: function(event) {
					if (event) this.sourceEvent = event;
					return this;
				},
				start: function() {
					if (++this.active === 1) {
						this.that.__zooming = this;
						this.emit("start");
					}
					return this;
				},
				zoom: function(key, transform) {
					if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
					if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
					if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
					this.that.__zoom = transform;
					this.emit("zoom");
					return this;
				},
				end: function() {
					if (--this.active === 0) {
						delete this.that.__zooming;
						this.emit("end");
					}
					return this;
				},
				emit: function(type) {
					var d = select_default$1(this.that).datum();
					listeners.call(type, this.that, new ZoomEvent(type, {
						sourceEvent: this.sourceEvent,
						target: zoom,
						type,
						transform: this.that.__zoom,
						dispatch: listeners
					}), d);
				}
			};
			function wheeled(event, ...args) {
				if (!filter.apply(this, arguments)) return;
				var g = gesture(this, args).event(event), t = this.__zoom, k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))), p = pointer_default(event);
				if (g.wheel) {
					if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) g.mouse[1] = t.invert(g.mouse[0] = p);
					clearTimeout(g.wheel);
				} else if (t.k === k) return;
				else {
					g.mouse = [p, t.invert(p)];
					interrupt_default$1(this);
					g.start();
				}
				noevent_default(event);
				g.wheel = setTimeout(wheelidled, wheelDelay);
				g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));
				function wheelidled() {
					g.wheel = null;
					g.end();
				}
			}
			function mousedowned(event, ...args) {
				if (touchending || !filter.apply(this, arguments)) return;
				var currentTarget = event.currentTarget, g = gesture(this, args, true).event(event), v = select_default$1(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p = pointer_default(event, currentTarget), x0 = event.clientX, y0 = event.clientY;
				nodrag_default(event.view);
				nopropagation(event);
				g.mouse = [p, this.__zoom.invert(p)];
				interrupt_default$1(this);
				g.start();
				function mousemoved(event) {
					noevent_default(event);
					if (!g.moved) {
						var dx = event.clientX - x0, dy = event.clientY - y0;
						g.moved = dx * dx + dy * dy > clickDistance2;
					}
					g.event(event).zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer_default(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
				}
				function mouseupped(event) {
					v.on("mousemove.zoom mouseup.zoom", null);
					yesdrag(event.view, g.moved);
					noevent_default(event);
					g.event(event).end();
				}
			}
			function dblclicked(event, ...args) {
				if (!filter.apply(this, arguments)) return;
				var t0 = this.__zoom, p0 = pointer_default(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t0.invert(p0), k1 = t0.k * (event.shiftKey ? .5 : 2), t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);
				noevent_default(event);
				if (duration > 0) select_default$1(this).transition().duration(duration).call(schedule, t1, p0, event);
				else select_default$1(this).call(zoom.transform, t1, p0, event);
			}
			function touchstarted(event, ...args) {
				if (!filter.apply(this, arguments)) return;
				var touches = event.touches, n = touches.length, g = gesture(this, args, event.changedTouches.length === n).event(event), started, i, t, p;
				nopropagation(event);
				for (i = 0; i < n; ++i) {
					t = touches[i], p = pointer_default(t, this);
					p = [
						p,
						this.__zoom.invert(p),
						t.identifier
					];
					if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
					else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
				}
				if (touchstarting) touchstarting = clearTimeout(touchstarting);
				if (started) {
					if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() {
						touchstarting = null;
					}, touchDelay);
					interrupt_default$1(this);
					g.start();
				}
			}
			function touchmoved(event, ...args) {
				if (!this.__zooming) return;
				var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t, p, l;
				noevent_default(event);
				for (i = 0; i < n; ++i) {
					t = touches[i], p = pointer_default(t, this);
					if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
					else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
				}
				t = g.that.__zoom;
				if (g.touch1) {
					var p0 = g.touch0[0], l0 = g.touch0[1], p1 = g.touch1[0], l1 = g.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
					t = scale(t, Math.sqrt(dp / dl));
					p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
					l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
				} else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
				else return;
				g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
			}
			function touchended(event, ...args) {
				if (!this.__zooming) return;
				var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t;
				nopropagation(event);
				if (touchending) clearTimeout(touchending);
				touchending = setTimeout(function() {
					touchending = null;
				}, touchDelay);
				for (i = 0; i < n; ++i) {
					t = touches[i];
					if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
					else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
				}
				if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
				if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
				else {
					g.end();
					if (g.taps === 2) {
						t = pointer_default(t, this);
						if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
							var p = select_default$1(this).on("dblclick.zoom");
							if (p) p.apply(this, arguments);
						}
					}
				}
			}
			zoom.wheelDelta = function(_) {
				return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant_default(+_), zoom) : wheelDelta;
			};
			zoom.filter = function(_) {
				return arguments.length ? (filter = typeof _ === "function" ? _ : constant_default(!!_), zoom) : filter;
			};
			zoom.touchable = function(_) {
				return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default(!!_), zoom) : touchable;
			};
			zoom.extent = function(_) {
				return arguments.length ? (extent = typeof _ === "function" ? _ : constant_default([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
			};
			zoom.scaleExtent = function(_) {
				return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
			};
			zoom.translateExtent = function(_) {
				return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
			};
			zoom.constrain = function(_) {
				return arguments.length ? (constrain = _, zoom) : constrain;
			};
			zoom.duration = function(_) {
				return arguments.length ? (duration = +_, zoom) : duration;
			};
			zoom.interpolate = function(_) {
				return arguments.length ? (interpolate = _, zoom) : interpolate;
			};
			zoom.on = function() {
				var value = listeners.on.apply(listeners, arguments);
				return value === listeners ? zoom : value;
			};
			zoom.clickDistance = function(_) {
				return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
			};
			zoom.tapDistance = function(_) {
				return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
			};
			return zoom;
		}
		//#endregion
		//#region node_modules/.pnpm/@xyflow+system@0.0.80/node_modules/@xyflow/system/dist/esm/index.js
		const errorMessages = {
			error001: (lib = "react") => `Seems like you have not used ${lib === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${lib}flow.dev/error#001`,
			error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
			error003: (nodeType) => `Node type "${nodeType}" not found. Using fallback type "default".`,
			error004: () => "The parent container needs a width and a height to render the graph.",
			error005: () => "Only child nodes can use a parent extent.",
			error006: () => "Can't create edge. An edge needs a source and a target.",
			error007: (id) => `The old edge with id=${id} does not exist.`,
			error009: (type) => `Marker type "${type}" doesn't exist.`,
			error008: (handleType, { id, sourceHandle, targetHandle }) => `Couldn't create edge for ${handleType} handle id: "${handleType === "source" ? sourceHandle : targetHandle}", edge id: ${id}.`,
			error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
			error011: (edgeType) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
			error012: (id) => `Node with id "${id}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
			error013: (lib = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${lib}/dist/style.css' or base.css to make sure everything is working properly.`,
			error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
			error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
			error016: (id) => `Edge with id "${id}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
		};
		const infiniteExtent = [[Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY], [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]];
		const elementSelectionKeys = [
			"Enter",
			" ",
			"Escape"
		];
		const defaultAriaLabelConfig = {
			"node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
			"node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
			"node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) => `Moved selected node ${direction}. New position, x: ${x}, y: ${y}`,
			"edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
			"controls.ariaLabel": "Control Panel",
			"controls.zoomIn.ariaLabel": "Zoom In",
			"controls.zoomOut.ariaLabel": "Zoom Out",
			"controls.fitView.ariaLabel": "Fit View",
			"controls.interactive.ariaLabel": "Toggle Interactivity",
			"minimap.ariaLabel": "Mini Map",
			"handle.ariaLabel": "Handle"
		};
		/**
		* The `ConnectionMode` is used to set the mode of connection between nodes.
		* The `Strict` mode is the default one and only allows source to target edges.
		* `Loose` mode allows source to source and target to target edges as well.
		*
		* @public
		*/
		var ConnectionMode;
		(function(ConnectionMode) {
			ConnectionMode["Strict"] = "strict";
			ConnectionMode["Loose"] = "loose";
		})(ConnectionMode || (ConnectionMode = {}));
		/**
		* This enum is used to set the different modes of panning the viewport when the
		* user scrolls. The `Free` mode allows the user to pan in any direction by scrolling
		* with a device like a trackpad. The `Vertical` and `Horizontal` modes restrict
		* scroll panning to only the vertical or horizontal axis, respectively.
		*
		* @public
		*/
		var PanOnScrollMode;
		(function(PanOnScrollMode) {
			PanOnScrollMode["Free"] = "free";
			PanOnScrollMode["Vertical"] = "vertical";
			PanOnScrollMode["Horizontal"] = "horizontal";
		})(PanOnScrollMode || (PanOnScrollMode = {}));
		var SelectionMode;
		(function(SelectionMode) {
			SelectionMode["Partial"] = "partial";
			SelectionMode["Full"] = "full";
		})(SelectionMode || (SelectionMode = {}));
		const initialConnection = {
			inProgress: false,
			isValid: null,
			from: null,
			fromHandle: null,
			fromPosition: null,
			fromNode: null,
			to: null,
			toHandle: null,
			toPosition: null,
			toNode: null,
			pointer: null
		};
		/**
		* If you set the `connectionLineType` prop on your [`<ReactFlow />`](/api-reference/react-flow#connection-connectionLineType)
		*component, it will dictate the style of connection line rendered when creating
		*new edges.
		*
		* @public
		*
		* @remarks If you choose to render a custom connection line component, this value will be
		*passed to your component as part of its [`ConnectionLineComponentProps`](/api-reference/types/connection-line-component-props).
		*/
		var ConnectionLineType;
		(function(ConnectionLineType) {
			ConnectionLineType["Bezier"] = "default";
			ConnectionLineType["Straight"] = "straight";
			ConnectionLineType["Step"] = "step";
			ConnectionLineType["SmoothStep"] = "smoothstep";
			ConnectionLineType["SimpleBezier"] = "simplebezier";
		})(ConnectionLineType || (ConnectionLineType = {}));
		/**
		* Edges may optionally have a marker on either end. The MarkerType type enumerates
		* the options available to you when configuring a given marker.
		*
		* @public
		*/
		var MarkerType;
		(function(MarkerType) {
			MarkerType["Arrow"] = "arrow";
			MarkerType["ArrowClosed"] = "arrowclosed";
		})(MarkerType || (MarkerType = {}));
		/**
		* While [`PanelPosition`](/api-reference/types/panel-position) can be used to place a
		* component in the corners of a container, the `Position` enum is less precise and used
		* primarily in relation to edges and handles.
		*
		* @public
		*/
		var Position;
		(function(Position) {
			Position["Left"] = "left";
			Position["Top"] = "top";
			Position["Right"] = "right";
			Position["Bottom"] = "bottom";
		})(Position || (Position = {}));
		const oppositePosition = {
			[Position.Left]: Position.Right,
			[Position.Right]: Position.Left,
			[Position.Top]: Position.Bottom,
			[Position.Bottom]: Position.Top
		};
		function getConnectionStatus(isValid) {
			return isValid === null ? null : isValid ? "valid" : "invalid";
		}
		/**
		* Test whether an object is usable as an Edge
		* @public
		* @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Edge if it returns true
		* @param element - The element to test
		* @returns A boolean indicating whether the element is an Edge
		*/
		const isEdgeBase = (element) => !!element && typeof element === "object" && "id" in element && "source" in element && "target" in element;
		/**
		* Test whether an object is usable as a Node
		* @public
		* @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Node if it returns true
		* @param element - The element to test
		* @returns A boolean indicating whether the element is an Node
		*/
		const isNodeBase = (element) => !!element && typeof element === "object" && "id" in element && "position" in element && !("source" in element) && !("target" in element);
		const isInternalNodeBase = (element) => !!element && typeof element === "object" && "id" in element && "internals" in element && !("source" in element) && !("target" in element);
		const getNodePositionWithOrigin = (node, nodeOrigin = [0, 0]) => {
			const { width, height } = getNodeDimensions(node);
			const origin = node.origin ?? nodeOrigin;
			const offsetX = width * origin[0];
			const offsetY = height * origin[1];
			return {
				x: node.position.x - offsetX,
				y: node.position.y - offsetY
			};
		};
		/**
		* Returns the bounding box that contains all the given nodes in an array. This can
		* be useful when combined with [`getViewportForBounds`](/api-reference/utils/get-viewport-for-bounds)
		* to calculate the correct transform to fit the given nodes in a viewport.
		* @public
		* @remarks Useful when combined with {@link getViewportForBounds} to calculate the correct transform to fit the given nodes in a viewport.
		* @param nodes - Nodes to calculate the bounds for.
		* @returns Bounding box enclosing all nodes.
		*
		* @remarks This function was previously called `getRectOfNodes`
		*
		* @example
		* ```js
		*import { getNodesBounds } from '@xyflow/react';
		*
		*const nodes = [
		*  {
		*    id: 'a',
		*    position: { x: 0, y: 0 },
		*    data: { label: 'a' },
		*    width: 50,
		*    height: 25,
		*  },
		*  {
		*    id: 'b',
		*    position: { x: 100, y: 100 },
		*    data: { label: 'b' },
		*    width: 50,
		*    height: 25,
		*  },
		*];
		*
		*const bounds = getNodesBounds(nodes);
		*```
		*/
		const getNodesBounds = (nodes, params = { nodeOrigin: [0, 0] }) => {
			if (nodes.length === 0) return {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			let hasNode = false;
			const box = nodes.reduce((currBox, nodeOrId) => {
				const isId = typeof nodeOrId === "string";
				let currentNode = !params.nodeLookup && !isId ? nodeOrId : void 0;
				if (params.nodeLookup) currentNode = isId ? params.nodeLookup.get(nodeOrId) : !isInternalNodeBase(nodeOrId) ? params.nodeLookup.get(nodeOrId.id) : nodeOrId;
				if (!currentNode) return currBox;
				hasNode = true;
				return getBoundsOfBoxes(currBox, nodeToBox(currentNode, params.nodeOrigin));
			}, {
				x: Infinity,
				y: Infinity,
				x2: -Infinity,
				y2: -Infinity
			});
			return hasNode ? boxToRect(box) : {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		};
		/**
		* Determines a bounding box that contains all given nodes in an array
		* @internal
		*/
		const getInternalNodesBounds = (nodeLookup, params = {}) => {
			let box = {
				x: Infinity,
				y: Infinity,
				x2: -Infinity,
				y2: -Infinity
			};
			let hasVisibleNodes = false;
			nodeLookup.forEach((node) => {
				if (params.filter === void 0 || params.filter(node)) {
					box = getBoundsOfBoxes(box, nodeToBox(node));
					hasVisibleNodes = true;
				}
			});
			return hasVisibleNodes ? boxToRect(box) : {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		};
		const getNodesInside = (nodes, rect, [tx, ty, tScale] = [
			0,
			0,
			1
		], partially = false, excludeNonSelectableNodes = false) => {
			const paneX = (rect.x - tx) / tScale;
			const paneY = (rect.y - ty) / tScale;
			const paneWidth = rect.width / tScale;
			const paneHeight = rect.height / tScale;
			const visibleNodes = [];
			for (const node of nodes.values()) {
				const { measured, selectable = true, hidden = false } = node;
				if (excludeNonSelectableNodes && !selectable || hidden) continue;
				const width = measured.width ?? node.width ?? node.initialWidth ?? 0;
				const height = measured.height ?? node.height ?? node.initialHeight ?? 0;
				const { x, y } = node.internals.positionAbsolute;
				const overlappingArea = getRectsOverlappingArea(paneX, paneY, paneWidth, paneHeight, x, y, width, height);
				const area = width * height;
				const partiallyVisible = partially && overlappingArea > 0;
				if (!node.internals.handleBounds || partiallyVisible || overlappingArea >= area || node.dragging) visibleNodes.push(node);
			}
			return visibleNodes;
		};
		/**
		* This utility filters an array of edges, keeping only those where either the source or target
		* node is present in the given array of nodes.
		* @public
		* @param nodes - Nodes you want to get the connected edges for.
		* @param edges - All edges.
		* @returns Array of edges that connect any of the given nodes with each other.
		*
		* @example
		* ```js
		*import { getConnectedEdges } from '@xyflow/react';
		*
		*const nodes = [
		*  { id: 'a', position: { x: 0, y: 0 } },
		*  { id: 'b', position: { x: 100, y: 0 } },
		*];
		*
		*const edges = [
		*  { id: 'a->c', source: 'a', target: 'c' },
		*  { id: 'c->d', source: 'c', target: 'd' },
		*];
		*
		*const connectedEdges = getConnectedEdges(nodes, edges);
		* // => [{ id: 'a->c', source: 'a', target: 'c' }]
		*```
		*/
		const getConnectedEdges = (nodes, edges) => {
			const nodeIds = /* @__PURE__ */ new Set();
			nodes.forEach((node) => {
				nodeIds.add(node.id);
			});
			return edges.filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target));
		};
		function getFitViewNodes(nodeLookup, options) {
			const fitViewNodes = /* @__PURE__ */ new Map();
			const optionNodeIds = options?.nodes ? new Set(options.nodes.map((node) => node.id)) : null;
			nodeLookup.forEach((n) => {
				let isVisible;
				if (options?.includeHiddenNodes) {
					const { width, height } = getNodeDimensions(n);
					isVisible = width > 0 && height > 0;
				} else isVisible = Boolean(n.measured.width && n.measured.height && !n.hidden);
				if (isVisible && (!optionNodeIds || optionNodeIds.has(n.id))) fitViewNodes.set(n.id, n);
			});
			return fitViewNodes;
		}
		async function fitViewport({ nodes, width, height, panZoom, minZoom, maxZoom }, options) {
			if (nodes.size === 0) return true;
			const nodesToFit = getFitViewNodes(nodes, options);
			const bounds = getInternalNodesBounds(nodesToFit);
			const viewport = getViewportForBounds(bounds, width, height, options?.minZoom ?? minZoom, options?.maxZoom ?? maxZoom, options?.padding ?? .1);
			await panZoom.setViewport(viewport, {
				duration: options?.duration,
				ease: options?.ease,
				interpolate: options?.interpolate
			});
			return true;
		}
		/**
		* This function calculates the next position of a node, taking into account the node's extent, parent node, and origin.
		*
		* @internal
		* @returns position, positionAbsolute
		*/
		function calculateNodePosition({ nodeId, nextPosition, nodeLookup, nodeOrigin = [0, 0], nodeExtent, onError }) {
			const node = nodeLookup.get(nodeId);
			const parentNode = node.parentId ? nodeLookup.get(node.parentId) : void 0;
			const { x: parentX, y: parentY } = parentNode ? parentNode.internals.positionAbsolute : {
				x: 0,
				y: 0
			};
			const origin = node.origin ?? nodeOrigin;
			let extent = node.extent || nodeExtent;
			if (node.extent === "parent" && !node.expandParent) if (!parentNode) onError?.("005", errorMessages["error005"]());
			else {
				const { width: parentWidth, height: parentHeight } = getNodeDimensions(parentNode);
				if (parentWidth && parentHeight) extent = [[parentX, parentY], [parentX + parentWidth, parentY + parentHeight]];
			}
			else if (parentNode && isCoordinateExtent(node.extent)) extent = [[node.extent[0][0] + parentX, node.extent[0][1] + parentY], [node.extent[1][0] + parentX, node.extent[1][1] + parentY]];
			const positionAbsolute = isCoordinateExtent(extent) ? clampPosition(nextPosition, extent, node.measured) : nextPosition;
			if (node.measured.width === void 0 || node.measured.height === void 0) onError?.("015", errorMessages["error015"]());
			return {
				position: {
					x: positionAbsolute.x - parentX + (node.measured.width ?? 0) * origin[0],
					y: positionAbsolute.y - parentY + (node.measured.height ?? 0) * origin[1]
				},
				positionAbsolute
			};
		}
		/**
		* Pass in nodes & edges to delete, get arrays of nodes and edges that actually can be deleted
		* @internal
		* @param param.nodesToRemove - The nodes to remove
		* @param param.edgesToRemove - The edges to remove
		* @param param.nodes - All nodes
		* @param param.edges - All edges
		* @param param.onBeforeDelete - Callback to check which nodes and edges can be deleted
		* @returns nodes: nodes that can be deleted, edges: edges that can be deleted
		*/
		async function getElementsToRemove({ nodesToRemove = [], edgesToRemove = [], nodes, edges, onBeforeDelete }) {
			const nodeIds = new Set(nodesToRemove.map((node) => node.id));
			const matchingNodes = [];
			for (const node of nodes) {
				if (node.deletable === false) continue;
				const isIncluded = nodeIds.has(node.id);
				const parentHit = !isIncluded && node.parentId && matchingNodes.find((n) => n.id === node.parentId);
				if (isIncluded || parentHit) matchingNodes.push(node);
			}
			const edgeIds = new Set(edgesToRemove.map((edge) => edge.id));
			const deletableEdges = edges.filter((edge) => edge.deletable !== false);
			const matchingEdges = getConnectedEdges(matchingNodes, deletableEdges);
			for (const edge of deletableEdges) if (edgeIds.has(edge.id) && !matchingEdges.find((e) => e.id === edge.id)) matchingEdges.push(edge);
			if (!onBeforeDelete) return {
				edges: matchingEdges,
				nodes: matchingNodes
			};
			const onBeforeDeleteResult = await onBeforeDelete({
				nodes: matchingNodes,
				edges: matchingEdges
			});
			if (typeof onBeforeDeleteResult === "boolean") return onBeforeDeleteResult ? {
				edges: matchingEdges,
				nodes: matchingNodes
			} : {
				edges: [],
				nodes: []
			};
			return onBeforeDeleteResult;
		}
		const clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);
		const clampPosition = (position = {
			x: 0,
			y: 0
		}, extent, dimensions) => ({
			x: clamp(position.x, extent[0][0], extent[1][0] - (dimensions?.width ?? 0)),
			y: clamp(position.y, extent[0][1], extent[1][1] - (dimensions?.height ?? 0))
		});
		function clampPositionToParent(childPosition, childDimensions, parent) {
			const { width: parentWidth, height: parentHeight } = getNodeDimensions(parent);
			const { x: parentX, y: parentY } = parent.internals.positionAbsolute;
			return clampPosition(childPosition, [[parentX, parentY], [parentX + parentWidth, parentY + parentHeight]], childDimensions);
		}
		/**
		* Calculates the velocity of panning when the mouse is close to the edge of the canvas
		* @internal
		* @param value - One dimensional poition of the mouse (x or y)
		* @param min - Minimal position on canvas before panning starts
		* @param max - Maximal position on canvas before panning starts
		* @returns - A number between 0 and 1 that represents the velocity of panning
		*/
		const calcAutoPanVelocity = (value, min, max) => {
			if (value < min) return clamp(Math.abs(value - min), 1, min) / min;
			else if (value > max) return -clamp(Math.abs(value - max), 1, min) / min;
			return 0;
		};
		const calcAutoPan = (pos, bounds, speed = 15, distance = 40) => {
			return [calcAutoPanVelocity(pos.x, distance, bounds.width - distance) * speed, calcAutoPanVelocity(pos.y, distance, bounds.height - distance) * speed];
		};
		const getBoundsOfBoxes = (box1, box2) => ({
			x: Math.min(box1.x, box2.x),
			y: Math.min(box1.y, box2.y),
			x2: Math.max(box1.x2, box2.x2),
			y2: Math.max(box1.y2, box2.y2)
		});
		const rectToBox = ({ x, y, width, height }) => ({
			x,
			y,
			x2: x + width,
			y2: y + height
		});
		const boxToRect = ({ x, y, x2, y2 }) => ({
			x,
			y,
			width: x2 - x,
			height: y2 - y
		});
		const nodeToRect = (node, nodeOrigin = [0, 0]) => {
			const { x, y } = isInternalNodeBase(node) ? node.internals.positionAbsolute : getNodePositionWithOrigin(node, nodeOrigin);
			return {
				x,
				y,
				width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
				height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0
			};
		};
		const nodeToBox = (node, nodeOrigin = [0, 0]) => {
			const { x, y } = isInternalNodeBase(node) ? node.internals.positionAbsolute : getNodePositionWithOrigin(node, nodeOrigin);
			return {
				x,
				y,
				x2: x + (node.measured?.width ?? node.width ?? node.initialWidth ?? 0),
				y2: y + (node.measured?.height ?? node.height ?? node.initialHeight ?? 0)
			};
		};
		const getBoundsOfRects = (rect1, rect2) => boxToRect(getBoundsOfBoxes(rectToBox(rect1), rectToBox(rect2)));
		const getRectsOverlappingArea = (aX, aY, aWidth, aHeight, bX, bY, bWidth, bHeight) => {
			const xOverlap = Math.max(0, Math.min(aX + aWidth, bX + bWidth) - Math.max(aX, bX));
			const yOverlap = Math.max(0, Math.min(aY + aHeight, bY + bHeight) - Math.max(aY, bY));
			return Math.ceil(xOverlap * yOverlap);
		};
		const getOverlappingArea = (rectA, rectB) => getRectsOverlappingArea(rectA.x, rectA.y, rectA.width, rectA.height, rectB.x, rectB.y, rectB.width, rectB.height);
		const isRectObject = (obj) => isNumeric(obj.width) && isNumeric(obj.height) && isNumeric(obj.x) && isNumeric(obj.y);
		const isNumeric = (n) => !isNaN(n) && isFinite(n);
		const createDevWarn = (lib, helpUrl) => (id, message) => {};
		const snapPosition = (position, snapGrid = [1, 1]) => {
			return {
				x: snapGrid[0] * Math.round(position.x / snapGrid[0]),
				y: snapGrid[1] * Math.round(position.y / snapGrid[1])
			};
		};
		const pointToRendererPoint = ({ x, y }, [tx, ty, tScale], snapToGrid = false, snapGrid = [1, 1]) => {
			const position = {
				x: (x - tx) / tScale,
				y: (y - ty) / tScale
			};
			return snapToGrid ? snapPosition(position, snapGrid) : position;
		};
		const rendererPointToPoint = ({ x, y }, [tx, ty, tScale]) => {
			return {
				x: x * tScale + tx,
				y: y * tScale + ty
			};
		};
		/**
		* Parses a single padding value to a number
		* @internal
		* @param padding - Padding to parse
		* @param viewport - Width or height of the viewport
		* @returns The padding in pixels
		*/
		function parsePadding(padding, viewport) {
			if (typeof padding === "number") return Math.floor((viewport - viewport / (1 + padding)) * .5);
			if (typeof padding === "string" && padding.endsWith("px")) {
				const paddingValue = parseFloat(padding);
				if (!Number.isNaN(paddingValue)) return Math.floor(paddingValue);
			}
			if (typeof padding === "string" && padding.endsWith("%")) {
				const paddingValue = parseFloat(padding);
				if (!Number.isNaN(paddingValue)) return Math.floor(viewport * paddingValue * .01);
			}
			console.error(`The padding value "${padding}" is invalid. Please provide a number or a string with a valid unit (px or %).`);
			return 0;
		}
		/**
		* Parses the paddings to an object with top, right, bottom, left, x and y paddings
		* @internal
		* @param padding - Padding to parse
		* @param width - Width of the viewport
		* @param height - Height of the viewport
		* @returns An object with the paddings in pixels
		*/
		function parsePaddings(padding, width, height) {
			if (typeof padding === "string" || typeof padding === "number") {
				const paddingY = parsePadding(padding, height);
				const paddingX = parsePadding(padding, width);
				return {
					top: paddingY,
					right: paddingX,
					bottom: paddingY,
					left: paddingX,
					x: paddingX * 2,
					y: paddingY * 2
				};
			}
			if (typeof padding === "object") {
				const top = parsePadding(padding.top ?? padding.y ?? 0, height);
				const bottom = parsePadding(padding.bottom ?? padding.y ?? 0, height);
				const left = parsePadding(padding.left ?? padding.x ?? 0, width);
				const right = parsePadding(padding.right ?? padding.x ?? 0, width);
				return {
					top,
					right,
					bottom,
					left,
					x: left + right,
					y: top + bottom
				};
			}
			return {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				x: 0,
				y: 0
			};
		}
		/**
		* Calculates the resulting paddings if the new viewport is applied
		* @internal
		* @param bounds - Bounds to fit inside viewport
		* @param x - X position of the viewport
		* @param y - Y position of the viewport
		* @param zoom - Zoom level of the viewport
		* @param width - Width of the viewport
		* @param height - Height of the viewport
		* @returns An object with the minimum padding required to fit the bounds inside the viewport
		*/
		function calculateAppliedPaddings(bounds, x, y, zoom, width, height) {
			const { x: left, y: top } = rendererPointToPoint(bounds, [
				x,
				y,
				zoom
			]);
			const { x: boundRight, y: boundBottom } = rendererPointToPoint({
				x: bounds.x + bounds.width,
				y: bounds.y + bounds.height
			}, [
				x,
				y,
				zoom
			]);
			const right = width - boundRight;
			const bottom = height - boundBottom;
			return {
				left: Math.floor(left),
				top: Math.floor(top),
				right: Math.floor(right),
				bottom: Math.floor(bottom)
			};
		}
		/**
		* Returns a viewport that encloses the given bounds with padding.
		* @public
		* @remarks You can determine bounds of nodes with {@link getNodesBounds} and {@link getBoundsOfRects}
		* @param bounds - Bounds to fit inside viewport.
		* @param width - Width of the viewport.
		* @param height  - Height of the viewport.
		* @param minZoom - Minimum zoom level of the resulting viewport.
		* @param maxZoom - Maximum zoom level of the resulting viewport.
		* @param padding - Padding around the bounds.
		* @returns A transformed {@link Viewport} that encloses the given bounds which you can pass to e.g. {@link setViewport}.
		* @example
		* const { x, y, zoom } = getViewportForBounds(
		* { x: 0, y: 0, width: 100, height: 100},
		* 1200, 800, 0.5, 2);
		*/
		const getViewportForBounds = (bounds, width, height, minZoom, maxZoom, padding) => {
			const p = parsePaddings(padding, width, height);
			const xZoom = (width - p.x) / bounds.width;
			const yZoom = (height - p.y) / bounds.height;
			const clampedZoom = clamp(Math.min(xZoom, yZoom), minZoom, maxZoom);
			const boundsCenterX = bounds.x + bounds.width / 2;
			const boundsCenterY = bounds.y + bounds.height / 2;
			const x = width / 2 - boundsCenterX * clampedZoom;
			const y = height / 2 - boundsCenterY * clampedZoom;
			const newPadding = calculateAppliedPaddings(bounds, x, y, clampedZoom, width, height);
			const offset = {
				left: Math.min(newPadding.left - p.left, 0),
				top: Math.min(newPadding.top - p.top, 0),
				right: Math.min(newPadding.right - p.right, 0),
				bottom: Math.min(newPadding.bottom - p.bottom, 0)
			};
			return {
				x: x - offset.left + offset.right,
				y: y - offset.top + offset.bottom,
				zoom: clampedZoom
			};
		};
		const isMacOs = () => typeof navigator !== "undefined" && navigator?.userAgent?.indexOf("Mac") >= 0;
		function isCoordinateExtent(extent) {
			return extent !== void 0 && extent !== null && extent !== "parent";
		}
		function getNodeDimensions(node) {
			return {
				width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
				height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0
			};
		}
		function nodeHasDimensions(node) {
			return (node.measured?.width ?? node.width ?? node.initialWidth) !== void 0 && (node.measured?.height ?? node.height ?? node.initialHeight) !== void 0;
		}
		/**
		* Convert child position to absolute position
		*
		* @internal
		* @param position
		* @param parentId
		* @param nodeLookup
		* @param nodeOrigin
		* @returns an internal node with an absolute position
		*/
		function evaluateAbsolutePosition(position, dimensions = {
			width: 0,
			height: 0
		}, parentId, nodeLookup, nodeOrigin) {
			const positionAbsolute = { ...position };
			const parent = nodeLookup.get(parentId);
			if (parent) {
				const origin = parent.origin || nodeOrigin;
				positionAbsolute.x += parent.internals.positionAbsolute.x - (dimensions.width ?? 0) * origin[0];
				positionAbsolute.y += parent.internals.positionAbsolute.y - (dimensions.height ?? 0) * origin[1];
			}
			return positionAbsolute;
		}
		function areSetsEqual(a, b) {
			if (a.size !== b.size) return false;
			for (const item of a) if (!b.has(item)) return false;
			return true;
		}
		/**
		* Polyfill for Promise.withResolvers until we can use it in all browsers
		* @internal
		*/
		function withResolvers() {
			let resolve;
			let reject;
			return {
				promise: new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				}),
				resolve,
				reject
			};
		}
		function mergeAriaLabelConfig(partial) {
			return {
				...defaultAriaLabelConfig,
				...partial || {}
			};
		}
		function getPointerPosition(event, { snapGrid = [0, 0], snapToGrid = false, transform, containerBounds }) {
			const { x, y } = getEventPosition(event);
			const pointerPos = pointToRendererPoint({
				x: x - (containerBounds?.left ?? 0),
				y: y - (containerBounds?.top ?? 0)
			}, transform);
			const { x: xSnapped, y: ySnapped } = snapToGrid ? snapPosition(pointerPos, snapGrid) : pointerPos;
			return {
				xSnapped,
				ySnapped,
				...pointerPos
			};
		}
		const getDimensions = (node) => ({
			width: node.offsetWidth,
			height: node.offsetHeight
		});
		const getHostForElement = (element) => element?.getRootNode?.() || window?.document;
		const inputTags = [
			"INPUT",
			"SELECT",
			"TEXTAREA"
		];
		function isInputDOMNode(event) {
			const target = event.composedPath?.()?.[0] || event.target;
			if (target?.nodeType !== 1) return false;
			return inputTags.includes(target.nodeName) || target.hasAttribute("contenteditable") || !!target.closest(".nokey");
		}
		const isMouseEvent = (event) => "clientX" in event;
		const getEventPosition = (event, bounds) => {
			const isMouse = isMouseEvent(event);
			const evtX = isMouse ? event.clientX : event.touches?.[0].clientX;
			const evtY = isMouse ? event.clientY : event.touches?.[0].clientY;
			return {
				x: evtX - (bounds?.left ?? 0),
				y: evtY - (bounds?.top ?? 0)
			};
		};
		const getHandleBounds = (type, nodeElement, nodeBounds, zoom, nodeId) => {
			const handles = nodeElement.querySelectorAll(`.${type}`);
			if (!handles || !handles.length) return null;
			return Array.from(handles).map((handle) => {
				const handleBounds = handle.getBoundingClientRect();
				return {
					id: handle.getAttribute("data-handleid"),
					type,
					nodeId,
					position: handle.getAttribute("data-handlepos"),
					x: (handleBounds.left - nodeBounds.left) / zoom,
					y: (handleBounds.top - nodeBounds.top) / zoom,
					...getDimensions(handle)
				};
			});
		};
		function getBezierEdgeCenter({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY }) {
			const centerX = sourceX * .125 + sourceControlX * .375 + targetControlX * .375 + targetX * .125;
			const centerY = sourceY * .125 + sourceControlY * .375 + targetControlY * .375 + targetY * .125;
			return [
				centerX,
				centerY,
				Math.abs(centerX - sourceX),
				Math.abs(centerY - sourceY)
			];
		}
		function calculateControlOffset(distance, curvature) {
			if (distance >= 0) return .5 * distance;
			return curvature * 25 * Math.sqrt(-distance);
		}
		function getControlWithCurvature({ pos, x1, y1, x2, y2, c }) {
			switch (pos) {
				case Position.Left: return [x1 - calculateControlOffset(x1 - x2, c), y1];
				case Position.Right: return [x1 + calculateControlOffset(x2 - x1, c), y1];
				case Position.Top: return [x1, y1 - calculateControlOffset(y1 - y2, c)];
				case Position.Bottom: return [x1, y1 + calculateControlOffset(y2 - y1, c)];
			}
		}
		/**
		* The `getBezierPath` util returns everything you need to render a bezier edge
		*between two nodes.
		* @public
		* @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
		* and `offsetX`, `offsetY` between source handle and label.
		* - `path`: the path to use in an SVG `<path>` element.
		* - `labelX`: the `x` position you can use to render a label for this edge.
		* - `labelY`: the `y` position you can use to render a label for this edge.
		* - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
		* middle of this path.
		* - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
		* middle of this path.
		* @example
		* ```js
		*  const source = { x: 0, y: 20 };
		*  const target = { x: 150, y: 100 };
		*
		*  const [path, labelX, labelY, offsetX, offsetY] = getBezierPath({
		*    sourceX: source.x,
		*    sourceY: source.y,
		*    sourcePosition: Position.Right,
		*    targetX: target.x,
		*    targetY: target.y,
		*    targetPosition: Position.Left,
		*});
		*```
		*
		* @remarks This function returns a tuple (aka a fixed-size array) to make it easier to
		*work with multiple edge paths at once.
		*/
		function getBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, curvature = .25 }) {
			const [sourceControlX, sourceControlY] = getControlWithCurvature({
				pos: sourcePosition,
				x1: sourceX,
				y1: sourceY,
				x2: targetX,
				y2: targetY,
				c: curvature
			});
			const [targetControlX, targetControlY] = getControlWithCurvature({
				pos: targetPosition,
				x1: targetX,
				y1: targetY,
				x2: sourceX,
				y2: sourceY,
				c: curvature
			});
			const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
				sourceX,
				sourceY,
				targetX,
				targetY,
				sourceControlX,
				sourceControlY,
				targetControlX,
				targetControlY
			});
			return [
				`M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
				labelX,
				labelY,
				offsetX,
				offsetY
			];
		}
		function getEdgeCenter({ sourceX, sourceY, targetX, targetY }) {
			const xOffset = Math.abs(targetX - sourceX) / 2;
			const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
			const yOffset = Math.abs(targetY - sourceY) / 2;
			return [
				centerX,
				targetY < sourceY ? targetY + yOffset : targetY - yOffset,
				xOffset,
				yOffset
			];
		}
		/**
		* Returns the z-index for an edge based on the node it connects and whether it is selected.
		* By default, edges are rendered below nodes. This behaviour is different for edges that are
		* connected to nodes with a parent, as they are rendered above the parent node.
		*/
		function getElevatedEdgeZIndex({ sourceNode, targetNode, selected = false, zIndex = 0, elevateOnSelect = false, zIndexMode = "basic" }) {
			if (zIndexMode === "manual") return zIndex;
			return (elevateOnSelect && selected ? zIndex + 1e3 : zIndex) + Math.max(sourceNode.parentId || elevateOnSelect && sourceNode.selected ? sourceNode.internals.z : 0, targetNode.parentId || elevateOnSelect && targetNode.selected ? targetNode.internals.z : 0);
		}
		function isEdgeVisible({ sourceNode, targetNode, width, height, transform }) {
			const edgeBox = getBoundsOfBoxes(nodeToBox(sourceNode), nodeToBox(targetNode));
			if (edgeBox.x === edgeBox.x2) edgeBox.x2 += 1;
			if (edgeBox.y === edgeBox.y2) edgeBox.y2 += 1;
			const viewRect = {
				x: -transform[0] / transform[2],
				y: -transform[1] / transform[2],
				width: width / transform[2],
				height: height / transform[2]
			};
			return getOverlappingArea(viewRect, boxToRect(edgeBox)) > 0;
		}
		/**
		* The default edge ID generator function. Generates an ID based on the source, target, and handles.
		* @public
		* @param params - The connection or edge to generate an ID for.
		* @returns The generated edge ID.
		*/
		const getEdgeId = ({ source, sourceHandle, target, targetHandle }) => `xy-edge__${source}${sourceHandle || ""}-${target}${targetHandle || ""}`;
		const connectionExists = (edge, edges) => {
			return edges.some((el) => el.source === edge.source && el.target === edge.target && (el.sourceHandle === edge.sourceHandle || !el.sourceHandle && !edge.sourceHandle) && (el.targetHandle === edge.targetHandle || !el.targetHandle && !edge.targetHandle));
		};
		/**
		* This util is a convenience function to add a new Edge to an array of edges. It also performs some validation to make sure you don't add an invalid edge or duplicate an existing one.
		* @public
		* @param edgeParams - Either an `Edge` or a `Connection` you want to add.
		* @param edges - The array of all current edges.
		* @param options - Optional configuration object.
		* @returns A new array of edges with the new edge added.
		*
		* @remarks If an edge with the same `target` and `source` already exists (and the same
		*`targetHandle` and `sourceHandle` if those are set), then this util won't add
		*a new edge even if the `id` property is different.
		*
		*/
		const addEdge$1 = (edgeParams, edges, options = {}) => {
			if (!edgeParams.source || !edgeParams.target) {
				options.onError?.("006", errorMessages["error006"]());
				return edges;
			}
			const edgeIdGenerator = options.getEdgeId || getEdgeId;
			let edge;
			if (isEdgeBase(edgeParams)) edge = { ...edgeParams };
			else edge = {
				...edgeParams,
				id: edgeIdGenerator(edgeParams)
			};
			if (connectionExists(edge, edges)) return edges;
			if (edge.sourceHandle === null) delete edge.sourceHandle;
			if (edge.targetHandle === null) delete edge.targetHandle;
			return edges.concat(edge);
		};
		/**
		* Calculates the straight line path between two points.
		* @public
		* @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
		* and `offsetX`, `offsetY` between source handle and label.
		*
		* - `path`: the path to use in an SVG `<path>` element.
		* - `labelX`: the `x` position you can use to render a label for this edge.
		* - `labelY`: the `y` position you can use to render a label for this edge.
		* - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
		* middle of this path.
		* - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
		* middle of this path.
		* @example
		* ```js
		*  const source = { x: 0, y: 20 };
		*  const target = { x: 150, y: 100 };
		*
		*  const [path, labelX, labelY, offsetX, offsetY] = getStraightPath({
		*    sourceX: source.x,
		*    sourceY: source.y,
		*    sourcePosition: Position.Right,
		*    targetX: target.x,
		*    targetY: target.y,
		*    targetPosition: Position.Left,
		*  });
		* ```
		* @remarks This function returns a tuple (aka a fixed-size array) to make it easier to work with multiple edge paths at once.
		*/
		function getStraightPath({ sourceX, sourceY, targetX, targetY }) {
			const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
				sourceX,
				sourceY,
				targetX,
				targetY
			});
			return [
				`M ${sourceX},${sourceY}L ${targetX},${targetY}`,
				labelX,
				labelY,
				offsetX,
				offsetY
			];
		}
		const handleDirections = {
			[Position.Left]: {
				x: -1,
				y: 0
			},
			[Position.Right]: {
				x: 1,
				y: 0
			},
			[Position.Top]: {
				x: 0,
				y: -1
			},
			[Position.Bottom]: {
				x: 0,
				y: 1
			}
		};
		const getDirection = ({ source, sourcePosition = Position.Bottom, target }) => {
			if (sourcePosition === Position.Left || sourcePosition === Position.Right) return source.x < target.x ? {
				x: 1,
				y: 0
			} : {
				x: -1,
				y: 0
			};
			return source.y < target.y ? {
				x: 0,
				y: 1
			} : {
				x: 0,
				y: -1
			};
		};
		const distance = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
		function getPoints({ source, sourcePosition = Position.Bottom, target, targetPosition = Position.Top, center, offset, stepPosition }) {
			const sourceDir = handleDirections[sourcePosition];
			const targetDir = handleDirections[targetPosition];
			const sourceGapped = {
				x: source.x + sourceDir.x * offset,
				y: source.y + sourceDir.y * offset
			};
			const targetGapped = {
				x: target.x + targetDir.x * offset,
				y: target.y + targetDir.y * offset
			};
			const dir = getDirection({
				source: sourceGapped,
				sourcePosition,
				target: targetGapped
			});
			const dirAccessor = dir.x !== 0 ? "x" : "y";
			const currDir = dir[dirAccessor];
			let points = [];
			let centerX, centerY;
			const sourceGapOffset = {
				x: 0,
				y: 0
			};
			const targetGapOffset = {
				x: 0,
				y: 0
			};
			const [, , defaultOffsetX, defaultOffsetY] = getEdgeCenter({
				sourceX: source.x,
				sourceY: source.y,
				targetX: target.x,
				targetY: target.y
			});
			if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
				if (dirAccessor === "x") {
					centerX = center.x ?? sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
					centerY = center.y ?? (sourceGapped.y + targetGapped.y) / 2;
				} else {
					centerX = center.x ?? (sourceGapped.x + targetGapped.x) / 2;
					centerY = center.y ?? sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
				}
				const verticalSplit = [{
					x: centerX,
					y: sourceGapped.y
				}, {
					x: centerX,
					y: targetGapped.y
				}];
				const horizontalSplit = [{
					x: sourceGapped.x,
					y: centerY
				}, {
					x: targetGapped.x,
					y: centerY
				}];
				if (sourceDir[dirAccessor] === currDir) points = dirAccessor === "x" ? verticalSplit : horizontalSplit;
				else points = dirAccessor === "x" ? horizontalSplit : verticalSplit;
			} else {
				const sourceTarget = [{
					x: sourceGapped.x,
					y: targetGapped.y
				}];
				const targetSource = [{
					x: targetGapped.x,
					y: sourceGapped.y
				}];
				if (dirAccessor === "x") points = sourceDir.x === currDir ? targetSource : sourceTarget;
				else points = sourceDir.y === currDir ? sourceTarget : targetSource;
				if (sourcePosition === targetPosition) {
					const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
					if (diff <= offset) {
						const gapOffset = Math.min(offset - 1, offset - diff);
						if (sourceDir[dirAccessor] === currDir) sourceGapOffset[dirAccessor] = (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
						else targetGapOffset[dirAccessor] = (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
					}
				}
				if (sourcePosition !== targetPosition) {
					const dirAccessorOpposite = dirAccessor === "x" ? "y" : "x";
					const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
					const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
					const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
					if (sourceDir[dirAccessor] === 1 && (!isSameDir && sourceGtTargetOppo || isSameDir && sourceLtTargetOppo) || sourceDir[dirAccessor] !== 1 && (!isSameDir && sourceLtTargetOppo || isSameDir && sourceGtTargetOppo)) points = dirAccessor === "x" ? sourceTarget : targetSource;
				}
				const sourceGapPoint = {
					x: sourceGapped.x + sourceGapOffset.x,
					y: sourceGapped.y + sourceGapOffset.y
				};
				const targetGapPoint = {
					x: targetGapped.x + targetGapOffset.x,
					y: targetGapped.y + targetGapOffset.y
				};
				if (Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x)) >= Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y))) {
					centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
					centerY = points[0].y;
				} else {
					centerX = points[0].x;
					centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
				}
			}
			const gappedSource = {
				x: sourceGapped.x + sourceGapOffset.x,
				y: sourceGapped.y + sourceGapOffset.y
			};
			const gappedTarget = {
				x: targetGapped.x + targetGapOffset.x,
				y: targetGapped.y + targetGapOffset.y
			};
			return [
				[
					source,
					...gappedSource.x !== points[0].x || gappedSource.y !== points[0].y ? [gappedSource] : [],
					...points,
					...gappedTarget.x !== points[points.length - 1].x || gappedTarget.y !== points[points.length - 1].y ? [gappedTarget] : [],
					target
				],
				centerX,
				centerY,
				defaultOffsetX,
				defaultOffsetY
			];
		}
		function getBend(a, b, c, size) {
			const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
			const { x, y } = b;
			if (a.x === x && x === c.x || a.y === y && y === c.y) return `L${x} ${y}`;
			if (a.y === y) {
				const xDir = a.x < c.x ? -1 : 1;
				const yDir = a.y < c.y ? 1 : -1;
				return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
			}
			const xDir = a.x < c.x ? 1 : -1;
			return `L ${x},${y + bendSize * (a.y < c.y ? -1 : 1)}Q ${x},${y} ${x + bendSize * xDir},${y}`;
		}
		/**
		* The `getSmoothStepPath` util returns everything you need to render a stepped path
		* between two nodes. The `borderRadius` property can be used to choose how rounded
		* the corners of those steps are.
		* @public
		* @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
		* and `offsetX`, `offsetY` between source handle and label.
		*
		* - `path`: the path to use in an SVG `<path>` element.
		* - `labelX`: the `x` position you can use to render a label for this edge.
		* - `labelY`: the `y` position you can use to render a label for this edge.
		* - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
		* middle of this path.
		* - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
		* middle of this path.
		* @example
		* ```js
		*  const source = { x: 0, y: 20 };
		*  const target = { x: 150, y: 100 };
		*
		*  const [path, labelX, labelY, offsetX, offsetY] = getSmoothStepPath({
		*    sourceX: source.x,
		*    sourceY: source.y,
		*    sourcePosition: Position.Right,
		*    targetX: target.x,
		*    targetY: target.y,
		*    targetPosition: Position.Left,
		*  });
		* ```
		* @remarks This function returns a tuple (aka a fixed-size array) to make it easier to work with multiple edge paths at once.
		*/
		function getSmoothStepPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, borderRadius = 5, centerX, centerY, offset = 20, stepPosition = .5 }) {
			const [points, labelX, labelY, offsetX, offsetY] = getPoints({
				source: {
					x: sourceX,
					y: sourceY
				},
				sourcePosition,
				target: {
					x: targetX,
					y: targetY
				},
				targetPosition,
				center: {
					x: centerX,
					y: centerY
				},
				offset,
				stepPosition
			});
			let path = `M${points[0].x} ${points[0].y}`;
			for (let i = 1; i < points.length - 1; i++) path += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
			path += `L${points[points.length - 1].x} ${points[points.length - 1].y}`;
			return [
				path,
				labelX,
				labelY,
				offsetX,
				offsetY
			];
		}
		function isNodeInitialized(node) {
			return node && !!(node.internals.handleBounds || node.handles?.length) && !!(node.measured.width || node.width || node.initialWidth);
		}
		function getEdgePosition(params) {
			const { sourceNode, targetNode } = params;
			if (!isNodeInitialized(sourceNode) || !isNodeInitialized(targetNode)) return null;
			const sourceHandleBounds = sourceNode.internals.handleBounds || toHandleBounds(sourceNode.handles);
			const targetHandleBounds = targetNode.internals.handleBounds || toHandleBounds(targetNode.handles);
			const sourceHandle = getHandle$1(sourceHandleBounds?.source ?? [], params.sourceHandle);
			const targetHandle = getHandle$1(params.connectionMode === ConnectionMode.Strict ? targetHandleBounds?.target ?? [] : (targetHandleBounds?.target ?? []).concat(targetHandleBounds?.source ?? []), params.targetHandle);
			if (!sourceHandle || !targetHandle) {
				params.onError?.("008", errorMessages["error008"](!sourceHandle ? "source" : "target", {
					id: params.id,
					sourceHandle: params.sourceHandle,
					targetHandle: params.targetHandle
				}));
				return null;
			}
			const sourcePosition = sourceHandle?.position || Position.Bottom;
			const targetPosition = targetHandle?.position || Position.Top;
			const source = getHandlePosition(sourceNode, sourceHandle, sourcePosition);
			const target = getHandlePosition(targetNode, targetHandle, targetPosition);
			return {
				sourceX: source.x,
				sourceY: source.y,
				targetX: target.x,
				targetY: target.y,
				sourcePosition,
				targetPosition
			};
		}
		function toHandleBounds(handles) {
			if (!handles) return null;
			const source = [];
			const target = [];
			for (const handle of handles) {
				handle.width = handle.width ?? 1;
				handle.height = handle.height ?? 1;
				if (handle.type === "source") source.push(handle);
				else if (handle.type === "target") target.push(handle);
			}
			return {
				source,
				target
			};
		}
		function getHandlePosition(node, handle, fallbackPosition = Position.Left, center = false) {
			const x = (handle?.x ?? 0) + node.internals.positionAbsolute.x;
			const y = (handle?.y ?? 0) + node.internals.positionAbsolute.y;
			const { width, height } = handle ?? getNodeDimensions(node);
			if (center) return {
				x: x + width / 2,
				y: y + height / 2
			};
			switch (handle?.position ?? fallbackPosition) {
				case Position.Top: return {
					x: x + width / 2,
					y
				};
				case Position.Right: return {
					x: x + width,
					y: y + height / 2
				};
				case Position.Bottom: return {
					x: x + width / 2,
					y: y + height
				};
				case Position.Left: return {
					x,
					y: y + height / 2
				};
			}
		}
		function getHandle$1(bounds, handleId) {
			if (!bounds) return null;
			return (!handleId ? bounds[0] : bounds.find((d) => d.id === handleId)) || null;
		}
		function getMarkerId(marker, id) {
			if (!marker) return "";
			if (typeof marker === "string") return marker;
			return `${id ? `${id}__` : ""}${Object.keys(marker).sort().map((key) => `${key}=${marker[key]}`).join("&")}`;
		}
		function createMarkerIds(edges, { id, defaultColor, defaultMarkerStart, defaultMarkerEnd }) {
			const ids = /* @__PURE__ */ new Set();
			return edges.reduce((markers, edge) => {
				[edge.markerStart || defaultMarkerStart, edge.markerEnd || defaultMarkerEnd].forEach((marker) => {
					if (marker && typeof marker === "object") {
						const markerId = getMarkerId(marker, id);
						if (!ids.has(markerId)) {
							markers.push({
								id: markerId,
								color: marker.color || defaultColor,
								...marker
							});
							ids.add(markerId);
						}
					}
				});
				return markers;
			}, []).sort((a, b) => a.id.localeCompare(b.id));
		}
		const SELECTED_NODE_Z = 1e3;
		const ROOT_PARENT_Z_INCREMENT = 10;
		const defaultOptions = {
			nodeOrigin: [0, 0],
			nodeExtent: infiniteExtent,
			elevateNodesOnSelect: true,
			zIndexMode: "basic",
			defaults: {}
		};
		const adoptUserNodesDefaultOptions = {
			...defaultOptions,
			checkEquality: true
		};
		function mergeObjects(base, incoming) {
			const result = { ...base };
			for (const key in incoming) if (incoming[key] !== void 0) result[key] = incoming[key];
			return result;
		}
		function updateAbsolutePositions(nodeLookup, parentLookup, options) {
			const _options = mergeObjects(defaultOptions, options);
			for (const node of nodeLookup.values()) if (node.parentId) updateChildNode(node, nodeLookup, parentLookup, _options);
			else {
				const positionWithOrigin = getNodePositionWithOrigin(node, _options.nodeOrigin);
				const extent = isCoordinateExtent(node.extent) ? node.extent : _options.nodeExtent;
				const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(node));
				node.internals.positionAbsolute = clampedPosition;
			}
		}
		function parseHandles(userNode, internalNode) {
			if (!userNode.handles) return !userNode.measured ? void 0 : internalNode?.internals.handleBounds;
			const source = [];
			const target = [];
			for (const handle of userNode.handles) {
				const handleBounds = {
					id: handle.id,
					width: handle.width ?? 1,
					height: handle.height ?? 1,
					nodeId: userNode.id,
					x: handle.x,
					y: handle.y,
					position: handle.position,
					type: handle.type
				};
				if (handle.type === "source") source.push(handleBounds);
				else if (handle.type === "target") target.push(handleBounds);
			}
			return {
				source,
				target
			};
		}
		function isManualZIndexMode(zIndexMode) {
			return zIndexMode === "manual";
		}
		function adoptUserNodes(nodes, nodeLookup, parentLookup, options = {}) {
			const _options = mergeObjects(adoptUserNodesDefaultOptions, options);
			const rootParentIndex = { i: 0 };
			const tmpLookup = new Map(nodeLookup);
			const selectedNodeZ = _options?.elevateNodesOnSelect && !isManualZIndexMode(_options.zIndexMode) ? SELECTED_NODE_Z : 0;
			let nodesInitialized = nodes.length > 0;
			let hasSelectedNodes = false;
			nodeLookup.clear();
			parentLookup.clear();
			for (const userNode of nodes) {
				let internalNode = tmpLookup.get(userNode.id);
				if (_options.checkEquality && userNode === internalNode?.internals.userNode) nodeLookup.set(userNode.id, internalNode);
				else {
					const positionWithOrigin = getNodePositionWithOrigin(userNode, _options.nodeOrigin);
					const extent = isCoordinateExtent(userNode.extent) ? userNode.extent : _options.nodeExtent;
					const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(userNode));
					internalNode = {
						..._options.defaults,
						...userNode,
						measured: {
							width: userNode.measured?.width,
							height: userNode.measured?.height
						},
						internals: {
							positionAbsolute: clampedPosition,
							handleBounds: parseHandles(userNode, internalNode),
							z: calculateZ(userNode, selectedNodeZ, _options.zIndexMode),
							userNode
						}
					};
					nodeLookup.set(userNode.id, internalNode);
				}
				if ((internalNode.measured === void 0 || internalNode.measured.width === void 0 || internalNode.measured.height === void 0) && !internalNode.hidden) nodesInitialized = false;
				if (userNode.parentId) updateChildNode(internalNode, nodeLookup, parentLookup, options, rootParentIndex);
				hasSelectedNodes ||= userNode.selected ?? false;
			}
			return {
				nodesInitialized,
				hasSelectedNodes
			};
		}
		function updateParentLookup(node, parentLookup) {
			if (!node.parentId) return;
			const childNodes = parentLookup.get(node.parentId);
			if (childNodes) childNodes.set(node.id, node);
			else parentLookup.set(node.parentId, /* @__PURE__ */ new Map([[node.id, node]]));
		}
		/**
		* Updates positionAbsolute and zIndex of a child node and the parentLookup.
		*/
		function updateChildNode(node, nodeLookup, parentLookup, options, rootParentIndex) {
			const { elevateNodesOnSelect, nodeOrigin, nodeExtent, zIndexMode } = mergeObjects(defaultOptions, options);
			const parentId = node.parentId;
			const parentNode = nodeLookup.get(parentId);
			if (!parentNode) {
				console.warn(`Parent node ${parentId} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
				return;
			}
			updateParentLookup(node, parentLookup);
			if (rootParentIndex && !parentNode.parentId && parentNode.internals.rootParentIndex === void 0 && zIndexMode === "auto") {
				parentNode.internals.rootParentIndex = ++rootParentIndex.i;
				parentNode.internals.z = parentNode.internals.z + rootParentIndex.i * ROOT_PARENT_Z_INCREMENT;
			}
			if (rootParentIndex && parentNode.internals.rootParentIndex !== void 0) rootParentIndex.i = parentNode.internals.rootParentIndex;
			const { x, y, z } = calculateChildXYZ(node, parentNode, nodeOrigin, nodeExtent, elevateNodesOnSelect && !isManualZIndexMode(zIndexMode) ? SELECTED_NODE_Z : 0, zIndexMode);
			const { positionAbsolute } = node.internals;
			const positionChanged = x !== positionAbsolute.x || y !== positionAbsolute.y;
			if (positionChanged || z !== node.internals.z) nodeLookup.set(node.id, {
				...node,
				internals: {
					...node.internals,
					positionAbsolute: positionChanged ? {
						x,
						y
					} : positionAbsolute,
					z
				}
			});
		}
		function calculateZ(node, selectedNodeZ, zIndexMode) {
			const zIndex = isNumeric(node.zIndex) ? node.zIndex : 0;
			if (isManualZIndexMode(zIndexMode)) return zIndex;
			return zIndex + (node.selected ? selectedNodeZ : 0);
		}
		function calculateChildXYZ(childNode, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode) {
			const { x: parentX, y: parentY } = parentNode.internals.positionAbsolute;
			const childDimensions = getNodeDimensions(childNode);
			const positionWithOrigin = getNodePositionWithOrigin(childNode, nodeOrigin);
			const clampedPosition = isCoordinateExtent(childNode.extent) ? clampPosition(positionWithOrigin, childNode.extent, childDimensions) : positionWithOrigin;
			let absolutePosition = clampPosition({
				x: parentX + clampedPosition.x,
				y: parentY + clampedPosition.y
			}, nodeExtent, childDimensions);
			if (childNode.extent === "parent") absolutePosition = clampPositionToParent(absolutePosition, childDimensions, parentNode);
			const childZ = calculateZ(childNode, selectedNodeZ, zIndexMode);
			const parentZ = parentNode.internals.z ?? 0;
			return {
				x: absolutePosition.x,
				y: absolutePosition.y,
				z: parentZ >= childZ ? parentZ + 1 : childZ
			};
		}
		function handleExpandParent(children, nodeLookup, parentLookup, nodeOrigin = [0, 0]) {
			const changes = [];
			const parentExpansions = /* @__PURE__ */ new Map();
			for (const child of children) {
				const parent = nodeLookup.get(child.parentId);
				if (!parent) continue;
				const parentRect = parentExpansions.get(child.parentId)?.expandedRect ?? nodeToRect(parent);
				const expandedRect = getBoundsOfRects(parentRect, child.rect);
				parentExpansions.set(child.parentId, {
					expandedRect,
					parent
				});
			}
			if (parentExpansions.size > 0) parentExpansions.forEach(({ expandedRect, parent }, parentId) => {
				const positionAbsolute = parent.internals.positionAbsolute;
				const dimensions = getNodeDimensions(parent);
				const origin = parent.origin ?? nodeOrigin;
				const xChange = expandedRect.x < positionAbsolute.x ? Math.round(Math.abs(positionAbsolute.x - expandedRect.x)) : 0;
				const yChange = expandedRect.y < positionAbsolute.y ? Math.round(Math.abs(positionAbsolute.y - expandedRect.y)) : 0;
				const newWidth = Math.max(dimensions.width, Math.round(expandedRect.width));
				const newHeight = Math.max(dimensions.height, Math.round(expandedRect.height));
				const widthChange = (newWidth - dimensions.width) * origin[0];
				const heightChange = (newHeight - dimensions.height) * origin[1];
				if (xChange > 0 || yChange > 0 || widthChange || heightChange) {
					changes.push({
						id: parentId,
						type: "position",
						position: {
							x: parent.position.x - xChange + widthChange,
							y: parent.position.y - yChange + heightChange
						}
					});
					parentLookup.get(parentId)?.forEach((childNode) => {
						if (!children.some((child) => child.id === childNode.id)) changes.push({
							id: childNode.id,
							type: "position",
							position: {
								x: childNode.position.x + xChange,
								y: childNode.position.y + yChange
							}
						});
					});
				}
				if (dimensions.width < expandedRect.width || dimensions.height < expandedRect.height || xChange || yChange) changes.push({
					id: parentId,
					type: "dimensions",
					setAttributes: true,
					dimensions: {
						width: newWidth + (xChange ? origin[0] * xChange - widthChange : 0),
						height: newHeight + (yChange ? origin[1] * yChange - heightChange : 0)
					}
				});
			});
			return changes;
		}
		function updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, zIndexMode) {
			const viewportNode = domNode?.querySelector(".xyflow__viewport");
			let updatedInternals = false;
			if (!viewportNode) return {
				changes: [],
				updatedInternals
			};
			const changes = [];
			const style = window.getComputedStyle(viewportNode);
			const { m22: zoom } = new window.DOMMatrixReadOnly(style.transform);
			const parentExpandChildren = [];
			for (const update of updates.values()) {
				const node = nodeLookup.get(update.id);
				if (!node) continue;
				if (node.hidden) {
					nodeLookup.set(node.id, {
						...node,
						internals: {
							...node.internals,
							handleBounds: void 0
						}
					});
					updatedInternals = true;
					continue;
				}
				const dimensions = getDimensions(update.nodeElement);
				const dimensionChanged = node.measured.width !== dimensions.width || node.measured.height !== dimensions.height;
				if (!!(dimensions.width && dimensions.height && (dimensionChanged || !node.internals.handleBounds || update.force))) {
					const nodeBounds = update.nodeElement.getBoundingClientRect();
					const extent = isCoordinateExtent(node.extent) ? node.extent : nodeExtent;
					let { positionAbsolute } = node.internals;
					if (node.parentId && node.extent === "parent") {
						const parentNode = nodeLookup.get(node.parentId);
						if (parentNode) positionAbsolute = clampPositionToParent(positionAbsolute, dimensions, parentNode);
					} else if (extent) positionAbsolute = clampPosition(positionAbsolute, extent, dimensions);
					const newNode = {
						...node,
						measured: dimensions,
						internals: {
							...node.internals,
							positionAbsolute,
							handleBounds: {
								source: getHandleBounds("source", update.nodeElement, nodeBounds, zoom, node.id),
								target: getHandleBounds("target", update.nodeElement, nodeBounds, zoom, node.id)
							}
						}
					};
					nodeLookup.set(node.id, newNode);
					if (node.parentId) updateChildNode(newNode, nodeLookup, parentLookup, {
						nodeOrigin,
						zIndexMode
					});
					updatedInternals = true;
					if (dimensionChanged) {
						changes.push({
							id: node.id,
							type: "dimensions",
							dimensions
						});
						if (node.expandParent && node.parentId) parentExpandChildren.push({
							id: node.id,
							parentId: node.parentId,
							rect: nodeToRect(newNode, nodeOrigin)
						});
					}
				}
			}
			if (parentExpandChildren.length > 0) {
				const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin);
				changes.push(...parentExpandChanges);
			}
			return {
				changes,
				updatedInternals
			};
		}
		async function panBy({ delta, panZoom, transform, translateExtent, width, height }) {
			if (!panZoom || !delta.x && !delta.y) return false;
			const nextViewport = await panZoom.setViewportConstrained({
				x: transform[0] + delta.x,
				y: transform[1] + delta.y,
				zoom: transform[2]
			}, [[0, 0], [width, height]], translateExtent);
			return !!nextViewport && (nextViewport.x !== transform[0] || nextViewport.y !== transform[1] || nextViewport.k !== transform[2]);
		}
		/**
		* this function adds the connection to the connectionLookup
		* at the following keys: nodeId-type-handleId, nodeId-type and nodeId
		* @param type type of the connection
		* @param connection connection that should be added to the lookup
		* @param connectionKey at which key the connection should be added
		* @param connectionLookup reference to the connection lookup
		* @param nodeId nodeId of the connection
		* @param handleId handleId of the connection
		*/
		function addConnectionToLookup(type, connection, connectionKey, connectionLookup, nodeId, handleId) {
			let key = nodeId;
			const nodeMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
			connectionLookup.set(key, nodeMap.set(connectionKey, connection));
			key = `${nodeId}-${type}`;
			const typeMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
			connectionLookup.set(key, typeMap.set(connectionKey, connection));
			if (handleId) {
				key = `${nodeId}-${type}-${handleId}`;
				const handleMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
				connectionLookup.set(key, handleMap.set(connectionKey, connection));
			}
		}
		function updateConnectionLookup(connectionLookup, edgeLookup, edges) {
			connectionLookup.clear();
			edgeLookup.clear();
			for (const edge of edges) {
				const { source: sourceNode, target: targetNode, sourceHandle = null, targetHandle = null } = edge;
				const connection = {
					edgeId: edge.id,
					source: sourceNode,
					target: targetNode,
					sourceHandle,
					targetHandle
				};
				const sourceKey = `${sourceNode}-${sourceHandle}--${targetNode}-${targetHandle}`;
				addConnectionToLookup("source", connection, `${targetNode}-${targetHandle}--${sourceNode}-${sourceHandle}`, connectionLookup, sourceNode, sourceHandle);
				addConnectionToLookup("target", connection, sourceKey, connectionLookup, targetNode, targetHandle);
				edgeLookup.set(edge.id, edge);
			}
		}
		function isParentSelected(node, nodeLookup) {
			if (!node.parentId) return false;
			const parentNode = nodeLookup.get(node.parentId);
			if (!parentNode) return false;
			if (parentNode.selected) return true;
			return isParentSelected(parentNode, nodeLookup);
		}
		function hasSelector(target, selector, domNode) {
			let current = target;
			do {
				if (current?.matches?.(selector)) return true;
				if (current === domNode) return false;
				current = current?.parentElement;
			} while (current);
			return false;
		}
		function getDragItems(nodeLookup, nodesDraggable, mousePos, nodeId) {
			const dragItems = /* @__PURE__ */ new Map();
			for (const [id, node] of nodeLookup) if ((node.selected || node.id === nodeId) && (!node.parentId || !isParentSelected(node, nodeLookup)) && (node.draggable || nodesDraggable && typeof node.draggable === "undefined")) {
				const internalNode = nodeLookup.get(id);
				if (internalNode) dragItems.set(id, {
					id,
					position: internalNode.position || {
						x: 0,
						y: 0
					},
					distance: {
						x: mousePos.x - internalNode.internals.positionAbsolute.x,
						y: mousePos.y - internalNode.internals.positionAbsolute.y
					},
					extent: internalNode.extent,
					parentId: internalNode.parentId,
					origin: internalNode.origin,
					expandParent: internalNode.expandParent,
					internals: { positionAbsolute: internalNode.internals.positionAbsolute || {
						x: 0,
						y: 0
					} },
					measured: {
						width: internalNode.measured.width ?? 0,
						height: internalNode.measured.height ?? 0
					}
				});
			}
			return dragItems;
		}
		function getEventHandlerParams({ nodeId, dragItems, nodeLookup, dragging = true }) {
			const nodesFromDragItems = [];
			for (const [id, dragItem] of dragItems) {
				const node = nodeLookup.get(id)?.internals.userNode;
				if (node) nodesFromDragItems.push({
					...node,
					position: dragItem.position,
					dragging
				});
			}
			if (!nodeId) return [nodesFromDragItems[0], nodesFromDragItems];
			const node = nodeLookup.get(nodeId)?.internals.userNode;
			return [!node ? nodesFromDragItems[0] : {
				...node,
				position: dragItems.get(nodeId)?.position || node.position,
				dragging
			}, nodesFromDragItems];
		}
		/**
		* If a selection is being dragged we want to apply the same snap offset to all nodes in the selection.
		* This function calculates the snap offset based on the first node in the selection.
		*/
		function calculateSnapOffset({ dragItems, snapGrid, x, y }) {
			const refDragItem = dragItems.values().next().value;
			if (!refDragItem) return null;
			const refPos = {
				x: x - refDragItem.distance.x,
				y: y - refDragItem.distance.y
			};
			const refPosSnapped = snapPosition(refPos, snapGrid);
			return {
				x: refPosSnapped.x - refPos.x,
				y: refPosSnapped.y - refPos.y
			};
		}
		function XYDrag({ onNodeMouseDown, getStoreItems, onDragStart, onDrag, onDragStop }) {
			let lastPos = {
				x: null,
				y: null
			};
			let autoPanId = 0;
			let dragItems = /* @__PURE__ */ new Map();
			let autoPanStarted = false;
			let mousePosition = {
				x: 0,
				y: 0
			};
			let containerBounds = null;
			let dragStarted = false;
			let d3Selection = null;
			let abortDrag = false;
			let nodePositionsChanged = false;
			let dragEvent = null;
			function update({ noDragClassName, handleSelector, domNode, isSelectable, nodeId, nodeClickDistance = 0 }) {
				d3Selection = select_default$1(domNode);
				function updateNodes({ x, y }) {
					const { nodeLookup, nodeExtent, snapGrid, snapToGrid, nodeOrigin, onNodeDrag, onSelectionDrag, onError, updateNodePositions } = getStoreItems();
					lastPos = {
						x,
						y
					};
					let hasChange = false;
					const isMultiDrag = dragItems.size > 1;
					const nodesBox = isMultiDrag && nodeExtent ? rectToBox(getInternalNodesBounds(dragItems)) : null;
					const multiDragSnapOffset = isMultiDrag && snapToGrid ? calculateSnapOffset({
						dragItems,
						snapGrid,
						x,
						y
					}) : null;
					for (const [id, dragItem] of dragItems) {
						if (!nodeLookup.has(id)) continue;
						let nextPosition = {
							x: x - dragItem.distance.x,
							y: y - dragItem.distance.y
						};
						if (snapToGrid) nextPosition = multiDragSnapOffset ? {
							x: Math.round(nextPosition.x + multiDragSnapOffset.x),
							y: Math.round(nextPosition.y + multiDragSnapOffset.y)
						} : snapPosition(nextPosition, snapGrid);
						let adjustedNodeExtent = null;
						if (isMultiDrag && nodeExtent && !dragItem.extent && nodesBox) {
							const { positionAbsolute } = dragItem.internals;
							const x1 = positionAbsolute.x - nodesBox.x + nodeExtent[0][0];
							const x2 = positionAbsolute.x + dragItem.measured.width - nodesBox.x2 + nodeExtent[1][0];
							const y1 = positionAbsolute.y - nodesBox.y + nodeExtent[0][1];
							const y2 = positionAbsolute.y + dragItem.measured.height - nodesBox.y2 + nodeExtent[1][1];
							adjustedNodeExtent = [[x1, y1], [x2, y2]];
						}
						const { position, positionAbsolute } = calculateNodePosition({
							nodeId: id,
							nextPosition,
							nodeLookup,
							nodeExtent: adjustedNodeExtent ? adjustedNodeExtent : nodeExtent,
							nodeOrigin,
							onError
						});
						hasChange = hasChange || dragItem.position.x !== position.x || dragItem.position.y !== position.y;
						dragItem.position = position;
						dragItem.internals.positionAbsolute = positionAbsolute;
					}
					nodePositionsChanged = nodePositionsChanged || hasChange;
					if (!hasChange) return;
					updateNodePositions(dragItems, true);
					if (dragEvent && (onDrag || onNodeDrag || !nodeId && onSelectionDrag)) {
						const [currentNode, currentNodes] = getEventHandlerParams({
							nodeId,
							dragItems,
							nodeLookup
						});
						onDrag?.(dragEvent, dragItems, currentNode, currentNodes);
						onNodeDrag?.(dragEvent, currentNode, currentNodes);
						if (!nodeId) onSelectionDrag?.(dragEvent, currentNodes);
					}
				}
				async function autoPan() {
					if (!containerBounds) return;
					const { transform, panBy, autoPanSpeed, autoPanOnNodeDrag } = getStoreItems();
					if (!autoPanOnNodeDrag) {
						autoPanStarted = false;
						cancelAnimationFrame(autoPanId);
						return;
					}
					const [xMovement, yMovement] = calcAutoPan(mousePosition, containerBounds, autoPanSpeed);
					if (xMovement !== 0 || yMovement !== 0) {
						lastPos.x = (lastPos.x ?? 0) - xMovement / transform[2];
						lastPos.y = (lastPos.y ?? 0) - yMovement / transform[2];
						if (await panBy({
							x: xMovement,
							y: yMovement
						})) updateNodes(lastPos);
					}
					autoPanId = requestAnimationFrame(autoPan);
				}
				function startDrag(event) {
					const { nodeLookup, multiSelectionActive, nodesDraggable, transform, snapGrid, snapToGrid, selectNodesOnDrag, onNodeDragStart, onSelectionDragStart, unselectNodesAndEdges } = getStoreItems();
					dragStarted = true;
					if ((!selectNodesOnDrag || !isSelectable) && !multiSelectionActive && nodeId) {
						if (!nodeLookup.get(nodeId)?.selected) unselectNodesAndEdges();
					}
					if (isSelectable && selectNodesOnDrag && nodeId) onNodeMouseDown?.(nodeId);
					const pointerPos = getPointerPosition(event.sourceEvent, {
						transform,
						snapGrid,
						snapToGrid,
						containerBounds
					});
					lastPos = pointerPos;
					dragItems = getDragItems(nodeLookup, nodesDraggable, pointerPos, nodeId);
					if (dragItems.size > 0 && (onDragStart || onNodeDragStart || !nodeId && onSelectionDragStart)) {
						const [currentNode, currentNodes] = getEventHandlerParams({
							nodeId,
							dragItems,
							nodeLookup
						});
						onDragStart?.(event.sourceEvent, dragItems, currentNode, currentNodes);
						onNodeDragStart?.(event.sourceEvent, currentNode, currentNodes);
						if (!nodeId) onSelectionDragStart?.(event.sourceEvent, currentNodes);
					}
				}
				const d3DragInstance = drag_default().clickDistance(nodeClickDistance).on("start", (event) => {
					const { domNode, nodeDragThreshold, transform, snapGrid, snapToGrid } = getStoreItems();
					containerBounds = domNode?.getBoundingClientRect() || null;
					abortDrag = false;
					nodePositionsChanged = false;
					dragEvent = event.sourceEvent;
					if (nodeDragThreshold === 0) startDrag(event);
					lastPos = getPointerPosition(event.sourceEvent, {
						transform,
						snapGrid,
						snapToGrid,
						containerBounds
					});
					mousePosition = getEventPosition(event.sourceEvent, containerBounds);
				}).on("drag", (event) => {
					const { autoPanOnNodeDrag, transform, snapGrid, snapToGrid, nodeDragThreshold, nodeLookup } = getStoreItems();
					const pointerPos = getPointerPosition(event.sourceEvent, {
						transform,
						snapGrid,
						snapToGrid,
						containerBounds
					});
					dragEvent = event.sourceEvent;
					if (event.sourceEvent.type === "touchmove" && event.sourceEvent.touches.length > 1 || nodeId && !nodeLookup.has(nodeId)) abortDrag = true;
					if (abortDrag) return;
					if (!autoPanStarted && autoPanOnNodeDrag && dragStarted) {
						autoPanStarted = true;
						autoPan();
					}
					if (!dragStarted) {
						const currentMousePosition = getEventPosition(event.sourceEvent, containerBounds);
						const x = currentMousePosition.x - mousePosition.x;
						const y = currentMousePosition.y - mousePosition.y;
						if (Math.sqrt(x * x + y * y) > nodeDragThreshold) startDrag(event);
					}
					if ((lastPos.x !== pointerPos.xSnapped || lastPos.y !== pointerPos.ySnapped) && dragItems && dragStarted) {
						mousePosition = getEventPosition(event.sourceEvent, containerBounds);
						updateNodes(pointerPos);
					}
				}).on("end", (event) => {
					if (!dragStarted || abortDrag) {
						if (abortDrag && dragItems.size > 0) getStoreItems().updateNodePositions(dragItems, false);
						return;
					}
					autoPanStarted = false;
					dragStarted = false;
					cancelAnimationFrame(autoPanId);
					if (dragItems.size > 0) {
						const { nodeLookup, updateNodePositions, onNodeDragStop, onSelectionDragStop } = getStoreItems();
						if (nodePositionsChanged) {
							updateNodePositions(dragItems, false);
							nodePositionsChanged = false;
						}
						if (onDragStop || onNodeDragStop || !nodeId && onSelectionDragStop) {
							const [currentNode, currentNodes] = getEventHandlerParams({
								nodeId,
								dragItems,
								nodeLookup,
								dragging: false
							});
							onDragStop?.(event.sourceEvent, dragItems, currentNode, currentNodes);
							onNodeDragStop?.(event.sourceEvent, currentNode, currentNodes);
							if (!nodeId) onSelectionDragStop?.(event.sourceEvent, currentNodes);
						}
					}
				}).filter((event) => {
					const target = event.target;
					return !event.button && (!noDragClassName || !hasSelector(target, `.${noDragClassName}`, domNode)) && (!handleSelector || hasSelector(target, handleSelector, domNode));
				});
				d3Selection.call(d3DragInstance);
			}
			function destroy() {
				d3Selection?.on(".drag", null);
			}
			return {
				update,
				destroy
			};
		}
		function getNodesWithinDistance(position, nodeLookup, distance) {
			const nodes = [];
			const rect = {
				x: position.x - distance,
				y: position.y - distance,
				width: distance * 2,
				height: distance * 2
			};
			for (const node of nodeLookup.values()) if (getOverlappingArea(rect, nodeToRect(node)) > 0) nodes.push(node);
			return nodes;
		}
		const ADDITIONAL_DISTANCE = 250;
		function getClosestHandle(position, connectionRadius, nodeLookup, fromHandle) {
			let closestHandles = [];
			let minDistance = Infinity;
			const closeNodes = getNodesWithinDistance(position, nodeLookup, connectionRadius + ADDITIONAL_DISTANCE);
			for (const node of closeNodes) {
				const allHandles = [...node.internals.handleBounds?.source ?? [], ...node.internals.handleBounds?.target ?? []];
				for (const handle of allHandles) {
					if (fromHandle.nodeId === handle.nodeId && fromHandle.type === handle.type && fromHandle.id === handle.id) continue;
					const { x, y } = getHandlePosition(node, handle, handle.position, true);
					const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
					if (distance > connectionRadius) continue;
					if (distance < minDistance) {
						closestHandles = [{
							...handle,
							x,
							y
						}];
						minDistance = distance;
					} else if (distance === minDistance) closestHandles.push({
						...handle,
						x,
						y
					});
				}
			}
			if (!closestHandles.length) return null;
			if (closestHandles.length > 1) {
				const oppositeHandleType = fromHandle.type === "source" ? "target" : "source";
				return closestHandles.find((handle) => handle.type === oppositeHandleType) ?? closestHandles[0];
			}
			return closestHandles[0];
		}
		function getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode, withAbsolutePosition = false) {
			const node = nodeLookup.get(nodeId);
			if (!node) return null;
			const handles = connectionMode === "strict" ? node.internals.handleBounds?.[handleType] : [...node.internals.handleBounds?.source ?? [], ...node.internals.handleBounds?.target ?? []];
			const handle = (handleId ? handles?.find((h) => h.id === handleId) : handles?.[0]) ?? null;
			return handle && withAbsolutePosition ? {
				...handle,
				...getHandlePosition(node, handle, handle.position, true)
			} : handle;
		}
		function getHandleType(edgeUpdaterType, handleDomNode) {
			if (edgeUpdaterType) return edgeUpdaterType;
			else if (handleDomNode?.classList.contains("target")) return "target";
			else if (handleDomNode?.classList.contains("source")) return "source";
			return null;
		}
		function isConnectionValid(isInsideConnectionRadius, isHandleValid) {
			let isValid = null;
			if (isHandleValid) isValid = true;
			else if (isInsideConnectionRadius && !isHandleValid) isValid = false;
			return isValid;
		}
		const alwaysValid = () => true;
		function onPointerDown(event, { connectionMode, connectionRadius, handleId, nodeId, edgeUpdaterType, isTarget, domNode, nodeLookup, lib, autoPanOnConnect, flowId, panBy, cancelConnection, onConnectStart, onConnect, onConnectEnd, isValidConnection = alwaysValid, onReconnectEnd, updateConnection, getTransform, getFromHandle, autoPanSpeed, dragThreshold = 1, handleDomNode }) {
			const doc = getHostForElement(event.target);
			let autoPanId = 0;
			let closestHandle;
			const { x, y } = getEventPosition(event);
			const handleType = getHandleType(edgeUpdaterType, handleDomNode);
			const containerBounds = domNode?.getBoundingClientRect();
			let connectionStarted = false;
			if (!containerBounds || !handleType) return;
			const fromHandleInternal = getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode);
			if (!fromHandleInternal) return;
			let position = getEventPosition(event, containerBounds);
			let autoPanStarted = false;
			let connection = null;
			let isValid = false;
			let resultHandleDomNode = null;
			function autoPan() {
				if (!autoPanOnConnect || !containerBounds) return;
				const [x, y] = calcAutoPan(position, containerBounds, autoPanSpeed);
				panBy({
					x,
					y
				});
				autoPanId = requestAnimationFrame(autoPan);
			}
			const fromHandle = {
				...fromHandleInternal,
				nodeId,
				type: handleType,
				position: fromHandleInternal.position
			};
			const fromInternalNode = nodeLookup.get(nodeId);
			let previousConnection = {
				inProgress: true,
				isValid: null,
				from: getHandlePosition(fromInternalNode, fromHandle, Position.Left, true),
				fromHandle,
				fromPosition: fromHandle.position,
				fromNode: fromInternalNode,
				to: position,
				toHandle: null,
				toPosition: oppositePosition[fromHandle.position],
				toNode: null,
				pointer: position
			};
			function startConnection() {
				connectionStarted = true;
				updateConnection(previousConnection);
				onConnectStart?.(event, {
					nodeId,
					handleId,
					handleType
				});
			}
			if (dragThreshold === 0) startConnection();
			function onPointerMove(event) {
				if (!connectionStarted) {
					const { x: evtX, y: evtY } = getEventPosition(event);
					const dx = evtX - x;
					const dy = evtY - y;
					if (!(dx * dx + dy * dy > dragThreshold * dragThreshold)) return;
					startConnection();
				}
				if (!getFromHandle() || !fromHandle) {
					onPointerUp(event);
					return;
				}
				const transform = getTransform();
				position = getEventPosition(event, containerBounds);
				closestHandle = getClosestHandle(pointToRendererPoint(position, transform, false, [1, 1]), connectionRadius, nodeLookup, fromHandle);
				if (!autoPanStarted) {
					autoPan();
					autoPanStarted = true;
				}
				const result = isValidHandle(event, {
					handle: closestHandle,
					connectionMode,
					fromNodeId: nodeId,
					fromHandleId: handleId,
					fromType: isTarget ? "target" : "source",
					isValidConnection,
					doc,
					lib,
					flowId,
					nodeLookup
				});
				resultHandleDomNode = result.handleDomNode;
				connection = result.connection;
				isValid = isConnectionValid(!!closestHandle, result.isValid);
				const fromInternalNode = nodeLookup.get(nodeId);
				const from = fromInternalNode ? getHandlePosition(fromInternalNode, fromHandle, Position.Left, true) : previousConnection.from;
				const newConnection = {
					...previousConnection,
					from,
					isValid,
					to: result.toHandle && isValid ? rendererPointToPoint({
						x: result.toHandle.x,
						y: result.toHandle.y
					}, transform) : position,
					toHandle: result.toHandle,
					toPosition: isValid && result.toHandle ? result.toHandle.position : oppositePosition[fromHandle.position],
					toNode: result.toHandle ? nodeLookup.get(result.toHandle.nodeId) : null,
					pointer: position
				};
				updateConnection(newConnection);
				previousConnection = newConnection;
			}
			function onPointerUp(event) {
				if ("touches" in event && event.touches.length > 0) return;
				if (connectionStarted) {
					if ((closestHandle || resultHandleDomNode) && connection && isValid) onConnect?.(connection);
					const { inProgress, ...connectionState } = previousConnection;
					const finalConnectionState = {
						...connectionState,
						toPosition: previousConnection.toHandle ? previousConnection.toPosition : null
					};
					onConnectEnd?.(event, finalConnectionState);
					if (edgeUpdaterType) onReconnectEnd?.(event, finalConnectionState);
				}
				cancelConnection();
				cancelAnimationFrame(autoPanId);
				autoPanStarted = false;
				isValid = false;
				connection = null;
				resultHandleDomNode = null;
				doc.removeEventListener("mousemove", onPointerMove);
				doc.removeEventListener("mouseup", onPointerUp);
				doc.removeEventListener("touchmove", onPointerMove);
				doc.removeEventListener("touchend", onPointerUp);
			}
			doc.addEventListener("mousemove", onPointerMove);
			doc.addEventListener("mouseup", onPointerUp);
			doc.addEventListener("touchmove", onPointerMove);
			doc.addEventListener("touchend", onPointerUp);
		}
		function isValidHandle(event, { handle, connectionMode, fromNodeId, fromHandleId, fromType, doc, lib, flowId, isValidConnection = alwaysValid, nodeLookup }) {
			const isTarget = fromType === "target";
			const handleDomNode = handle ? doc.querySelector(`.${lib}-flow__handle[data-id="${flowId}-${handle?.nodeId}-${handle?.id}-${handle?.type}"]`) : null;
			const { x, y } = getEventPosition(event);
			const handleBelow = doc.elementFromPoint(x, y);
			const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`) ? handleBelow : handleDomNode;
			const result = {
				handleDomNode: handleToCheck,
				isValid: false,
				connection: null,
				toHandle: null
			};
			if (handleToCheck) {
				const handleType = getHandleType(void 0, handleToCheck);
				const handleNodeId = handleToCheck.getAttribute("data-nodeid");
				const handleId = handleToCheck.getAttribute("data-handleid");
				const connectable = handleToCheck.classList.contains("connectable");
				const connectableEnd = handleToCheck.classList.contains("connectableend");
				if (!handleNodeId || !handleType) return result;
				const connection = {
					source: isTarget ? handleNodeId : fromNodeId,
					sourceHandle: isTarget ? handleId : fromHandleId,
					target: isTarget ? fromNodeId : handleNodeId,
					targetHandle: isTarget ? fromHandleId : handleId
				};
				result.connection = connection;
				result.isValid = connectable && connectableEnd && (connectionMode === ConnectionMode.Strict ? isTarget && handleType === "source" || !isTarget && handleType === "target" : handleNodeId !== fromNodeId || handleId !== fromHandleId) && isValidConnection(connection);
				result.toHandle = getHandle(handleNodeId, handleType, handleId, nodeLookup, connectionMode, true);
			}
			return result;
		}
		const XYHandle = {
			onPointerDown,
			isValid: isValidHandle
		};
		function XYMinimap({ domNode, panZoom, getTransform, getViewScale }) {
			const selection = select_default$1(domNode);
			function update({ translateExtent, width, height, zoomStep = 1, pannable = true, zoomable = true, inversePan = false }) {
				const zoomHandler = (event) => {
					if (event.sourceEvent.type !== "wheel" || !panZoom) return;
					const transform = getTransform();
					const factor = event.sourceEvent.ctrlKey && isMacOs() ? 10 : 1;
					const pinchDelta = -event.sourceEvent.deltaY * (event.sourceEvent.deltaMode === 1 ? .05 : event.sourceEvent.deltaMode ? 1 : .002) * zoomStep;
					const nextZoom = transform[2] * Math.pow(2, pinchDelta * factor);
					panZoom.scaleTo(nextZoom);
				};
				let panStart = [0, 0];
				const panStartHandler = (event) => {
					if (event.sourceEvent.type === "mousedown" || event.sourceEvent.type === "touchstart") panStart = [event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX, event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY];
				};
				const panHandler = (event) => {
					const transform = getTransform();
					if (event.sourceEvent.type !== "mousemove" && event.sourceEvent.type !== "touchmove" || !panZoom) return;
					const panCurrent = [event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX, event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY];
					const panDelta = [panCurrent[0] - panStart[0], panCurrent[1] - panStart[1]];
					panStart = panCurrent;
					const moveScale = getViewScale() * Math.max(transform[2], Math.log(transform[2])) * (inversePan ? -1 : 1);
					const position = {
						x: transform[0] - panDelta[0] * moveScale,
						y: transform[1] - panDelta[1] * moveScale
					};
					const extent = [[0, 0], [width, height]];
					panZoom.setViewportConstrained({
						x: position.x,
						y: position.y,
						zoom: transform[2]
					}, extent, translateExtent);
				};
				const zoomAndPanHandler = zoom_default().on("start", panStartHandler).on("zoom", pannable ? panHandler : null).on("zoom.wheel", zoomable ? zoomHandler : null);
				selection.call(zoomAndPanHandler, {});
			}
			function destroy() {
				selection.on("zoom", null);
			}
			return {
				update,
				destroy,
				pointer: pointer_default
			};
		}
		const transformToViewport = (transform) => ({
			x: transform.x,
			y: transform.y,
			zoom: transform.k
		});
		const viewportToTransform = ({ x, y, zoom }) => identity$1.translate(x, y).scale(zoom);
		const isWrappedWithClass = (event, className) => event.target.closest(`.${className}`);
		const isRightClickPan = (panOnDrag, usedButton) => usedButton === 2 && Array.isArray(panOnDrag) && panOnDrag.includes(2);
		const defaultEase = (t) => ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
		const getD3Transition = (selection, duration = 0, ease = defaultEase, onEnd = () => {}) => {
			const hasDuration = typeof duration === "number" && duration > 0;
			if (!hasDuration) onEnd();
			return hasDuration ? selection.transition().duration(duration).ease(ease).on("end", onEnd) : selection;
		};
		const wheelDelta = (event) => {
			const factor = event.ctrlKey && isMacOs() ? 10 : 1;
			return -event.deltaY * (event.deltaMode === 1 ? .05 : event.deltaMode ? 1 : .002) * factor;
		};
		function createPanOnScrollHandler({ zoomPanValues, noWheelClassName, d3Selection, d3Zoom, panOnScrollMode, panOnScrollSpeed, zoomOnPinch, onPanZoomStart, onPanZoom, onPanZoomEnd }) {
			return (event) => {
				if (isWrappedWithClass(event, noWheelClassName)) {
					if (event.ctrlKey) event.preventDefault();
					return false;
				}
				event.preventDefault();
				event.stopImmediatePropagation();
				const currentZoom = d3Selection.property("__zoom").k || 1;
				if (event.ctrlKey && zoomOnPinch) {
					const point = pointer_default(event);
					const pinchDelta = wheelDelta(event);
					const zoom = currentZoom * Math.pow(2, pinchDelta);
					d3Zoom.scaleTo(d3Selection, zoom, point, event);
					return;
				}
				const deltaNormalize = event.deltaMode === 1 ? 20 : 1;
				let deltaX = panOnScrollMode === PanOnScrollMode.Vertical ? 0 : event.deltaX * deltaNormalize;
				let deltaY = panOnScrollMode === PanOnScrollMode.Horizontal ? 0 : event.deltaY * deltaNormalize;
				if (!isMacOs() && event.shiftKey && panOnScrollMode !== PanOnScrollMode.Vertical) {
					deltaX = event.deltaY * deltaNormalize;
					deltaY = 0;
				}
				d3Zoom.translateBy(d3Selection, -(deltaX / currentZoom) * panOnScrollSpeed, -(deltaY / currentZoom) * panOnScrollSpeed, { internal: true });
				const nextViewport = transformToViewport(d3Selection.property("__zoom"));
				clearTimeout(zoomPanValues.panScrollTimeout);
				if (!zoomPanValues.isPanScrolling) {
					zoomPanValues.isPanScrolling = true;
					onPanZoomStart?.(event, nextViewport);
				} else onPanZoom?.(event, nextViewport);
				zoomPanValues.panScrollTimeout = setTimeout(() => {
					onPanZoomEnd?.(event, nextViewport);
					zoomPanValues.isPanScrolling = false;
				}, 150);
			};
		}
		function createZoomOnScrollHandler({ noWheelClassName, preventScrolling, d3ZoomHandler }) {
			return function(event, d) {
				const isWheel = event.type === "wheel";
				const preventZoom = !preventScrolling && isWheel && !event.ctrlKey;
				const hasNoWheelClass = isWrappedWithClass(event, noWheelClassName);
				if (event.ctrlKey && isWheel && hasNoWheelClass) event.preventDefault();
				if (preventZoom || hasNoWheelClass) return null;
				event.preventDefault();
				d3ZoomHandler.call(this, event, d);
			};
		}
		function createPanZoomStartHandler({ zoomPanValues, onDraggingChange, onPanZoomStart }) {
			return (event) => {
				if (event.sourceEvent?.internal) return;
				const viewport = transformToViewport(event.transform);
				zoomPanValues.mouseButton = event.sourceEvent?.button || 0;
				zoomPanValues.isZoomingOrPanning = true;
				zoomPanValues.prevViewport = viewport;
				if (event.sourceEvent?.type === "mousedown") onDraggingChange(true);
				if (onPanZoomStart) onPanZoomStart?.(event.sourceEvent, viewport);
			};
		}
		function createPanZoomHandler({ zoomPanValues, panOnDrag, onPaneContextMenu, onTransformChange, onPanZoom }) {
			return (event) => {
				zoomPanValues.usedRightMouseButton = !!(onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0));
				if (!event.sourceEvent?.sync) onTransformChange([
					event.transform.x,
					event.transform.y,
					event.transform.k
				]);
				if (onPanZoom && !event.sourceEvent?.internal) onPanZoom?.(event.sourceEvent, transformToViewport(event.transform));
			};
		}
		function createPanZoomEndHandler({ zoomPanValues, panOnDrag, panOnScroll, onDraggingChange, onPanZoomEnd, onPaneContextMenu }) {
			return (event) => {
				if (event.sourceEvent?.internal) return;
				zoomPanValues.isZoomingOrPanning = false;
				if (onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0) && !zoomPanValues.usedRightMouseButton && event.sourceEvent) onPaneContextMenu(event.sourceEvent);
				zoomPanValues.usedRightMouseButton = false;
				onDraggingChange(false);
				if (onPanZoomEnd) {
					const viewport = transformToViewport(event.transform);
					zoomPanValues.prevViewport = viewport;
					clearTimeout(zoomPanValues.timerId);
					zoomPanValues.timerId = setTimeout(() => {
						onPanZoomEnd?.(event.sourceEvent, viewport);
					}, panOnScroll ? 150 : 0);
				}
			};
		}
		function createFilter({ panActivationKeyPressed, zoomActivationKeyPressed, zoomOnScroll, zoomOnPinch, panOnDrag, panOnScroll, zoomOnDoubleClick, userSelectionActive, noWheelClassName, noPanClassName, lib, connectionInProgress }) {
			return (event) => {
				const zoomScroll = zoomActivationKeyPressed || zoomOnScroll;
				const pinchZoom = zoomOnPinch && event.ctrlKey;
				const isWheelEvent = event.type === "wheel";
				if (event.button === 1 && event.type === "mousedown" && (isWrappedWithClass(event, `${lib}-flow__node`) || isWrappedWithClass(event, `${lib}-flow__edge`) || isWrappedWithClass(event, `${lib}-flow__selection`) || isWrappedWithClass(event, `${lib}-flow__nodesselection`))) return true;
				if (!panOnDrag && !zoomScroll && !panOnScroll && !zoomOnDoubleClick && !zoomOnPinch) return false;
				if (userSelectionActive) return false;
				if (connectionInProgress && !isWheelEvent) return false;
				if (isWrappedWithClass(event, noWheelClassName) && isWheelEvent) return false;
				if (isWrappedWithClass(event, noPanClassName) && (!isWheelEvent || panOnScroll && isWheelEvent && !zoomActivationKeyPressed)) return false;
				if (!zoomOnPinch && event.ctrlKey && isWheelEvent) return false;
				if (!zoomOnPinch && event.type === "touchstart" && event.touches?.length > 1) {
					event.preventDefault();
					return false;
				}
				if (!zoomScroll && !panOnScroll && !pinchZoom && isWheelEvent) return false;
				if (!panOnDrag && (event.type === "mousedown" || event.type === "touchstart")) return false;
				if (Array.isArray(panOnDrag) && !panOnDrag.includes(event.button) && event.type === "mousedown") return false;
				const buttonAllowed = Array.isArray(panOnDrag) && panOnDrag.includes(event.button) || !event.button || event.button <= 1;
				return (!event.ctrlKey || isWheelEvent || panActivationKeyPressed) && buttonAllowed;
			};
		}
		function XYPanZoom({ domNode, minZoom, maxZoom, translateExtent, viewport, onPanZoom, onPanZoomStart, onPanZoomEnd, onDraggingChange }) {
			const zoomPanValues = {
				isZoomingOrPanning: false,
				usedRightMouseButton: false,
				prevViewport: {},
				mouseButton: 0,
				timerId: void 0,
				panScrollTimeout: void 0,
				isPanScrolling: false
			};
			const bbox = domNode.getBoundingClientRect();
			let cachedExtent = [[0, 0], [bbox.width, bbox.height]];
			(typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) cachedExtent = [[0, 0], [entry.contentRect.width, entry.contentRect.height]];
			}) : null)?.observe(domNode);
			const d3ZoomInstance = zoom_default().extent(() => cachedExtent).scaleExtent([minZoom, maxZoom]).translateExtent(translateExtent);
			const d3Selection = select_default$1(domNode).call(d3ZoomInstance);
			setViewportConstrained({
				x: viewport.x,
				y: viewport.y,
				zoom: clamp(viewport.zoom, minZoom, maxZoom)
			}, [[0, 0], [bbox.width, bbox.height]], translateExtent);
			const d3ZoomHandler = d3Selection.on("wheel.zoom");
			const d3DblClickZoomHandler = d3Selection.on("dblclick.zoom");
			d3ZoomInstance.wheelDelta(wheelDelta);
			async function setTransform(transform, options) {
				if (d3Selection) return new Promise((resolve) => {
					d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default$1).transform(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), transform);
				});
				return false;
			}
			function update({ noWheelClassName, noPanClassName, onPaneContextMenu, userSelectionActive, panOnScroll, panOnDrag, panOnScrollMode, panOnScrollSpeed, preventScrolling, zoomOnPinch, zoomOnScroll, zoomOnDoubleClick, panActivationKeyPressed = false, zoomActivationKeyPressed, lib, onTransformChange, connectionInProgress, paneClickDistance, selectionOnDrag }) {
				if (userSelectionActive && !zoomPanValues.isZoomingOrPanning) destroy();
				const isPanOnScroll = panOnScroll && !zoomActivationKeyPressed && !userSelectionActive;
				d3ZoomInstance.clickDistance(selectionOnDrag ? Infinity : !isNumeric(paneClickDistance) || paneClickDistance < 0 ? 0 : paneClickDistance);
				const wheelHandler = isPanOnScroll ? createPanOnScrollHandler({
					zoomPanValues,
					noWheelClassName,
					d3Selection,
					d3Zoom: d3ZoomInstance,
					panOnScrollMode,
					panOnScrollSpeed,
					zoomOnPinch,
					onPanZoomStart,
					onPanZoom,
					onPanZoomEnd
				}) : createZoomOnScrollHandler({
					noWheelClassName,
					preventScrolling,
					d3ZoomHandler
				});
				d3Selection.on("wheel.zoom", wheelHandler, { passive: false });
				const startHandler = createPanZoomStartHandler({
					zoomPanValues,
					onDraggingChange,
					onPanZoomStart
				});
				d3ZoomInstance.on("start", startHandler);
				const panZoomHandler = createPanZoomHandler({
					zoomPanValues,
					panOnDrag,
					onPaneContextMenu: !!onPaneContextMenu,
					onPanZoom,
					onTransformChange
				});
				d3ZoomInstance.on("zoom", panZoomHandler);
				const panZoomEndHandler = createPanZoomEndHandler({
					zoomPanValues,
					panOnDrag,
					panOnScroll,
					onPaneContextMenu,
					onPanZoomEnd,
					onDraggingChange
				});
				d3ZoomInstance.on("end", panZoomEndHandler);
				const filter = createFilter({
					panActivationKeyPressed,
					zoomActivationKeyPressed,
					panOnDrag,
					zoomOnScroll,
					panOnScroll,
					zoomOnDoubleClick,
					zoomOnPinch,
					userSelectionActive,
					noPanClassName,
					noWheelClassName,
					lib,
					connectionInProgress
				});
				d3ZoomInstance.filter(filter);
				if (zoomOnDoubleClick) d3Selection.on("dblclick.zoom", d3DblClickZoomHandler);
				else d3Selection.on("dblclick.zoom", null);
			}
			function destroy() {
				d3ZoomInstance.on("zoom", null);
			}
			async function setViewportConstrained(viewport, extent, translateExtent) {
				const nextTransform = viewportToTransform(viewport);
				const contrainedTransform = d3ZoomInstance?.constrain()(nextTransform, extent, translateExtent);
				if (contrainedTransform) await setTransform(contrainedTransform);
				return contrainedTransform;
			}
			async function setViewport(viewport, options) {
				const nextTransform = viewportToTransform(viewport);
				await setTransform(nextTransform, options);
				return nextTransform;
			}
			function syncViewport(viewport) {
				if (d3Selection) {
					const nextTransform = viewportToTransform(viewport);
					const currentTransform = d3Selection.property("__zoom");
					if (currentTransform.k !== viewport.zoom || currentTransform.x !== viewport.x || currentTransform.y !== viewport.y) d3ZoomInstance?.transform(d3Selection, nextTransform, null, { sync: true });
				}
			}
			function getViewport() {
				const transform$1 = d3Selection ? transform(d3Selection.node()) : {
					x: 0,
					y: 0,
					k: 1
				};
				return {
					x: transform$1.x,
					y: transform$1.y,
					zoom: transform$1.k
				};
			}
			async function scaleTo(zoom, options) {
				if (d3Selection) return new Promise((resolve) => {
					d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default$1).scaleTo(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), zoom);
				});
				return false;
			}
			async function scaleBy(factor, options) {
				if (d3Selection) return new Promise((resolve) => {
					d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default$1).scaleBy(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), factor);
				});
				return false;
			}
			function setScaleExtent(scaleExtent) {
				d3ZoomInstance?.scaleExtent(scaleExtent);
			}
			function setTranslateExtent(translateExtent) {
				d3ZoomInstance?.translateExtent(translateExtent);
			}
			function setClickDistance(distance) {
				const validDistance = !isNumeric(distance) || distance < 0 ? 0 : distance;
				d3ZoomInstance?.clickDistance(validDistance);
			}
			return {
				update,
				destroy,
				setViewport,
				setViewportConstrained,
				getViewport,
				scaleTo,
				scaleBy,
				setScaleExtent,
				setTranslateExtent,
				syncViewport,
				setClickDistance
			};
		}
		/**
		* Used to determine the variant of the resize control
		*
		* @public
		*/
		var ResizeControlVariant;
		(function(ResizeControlVariant) {
			ResizeControlVariant["Line"] = "line";
			ResizeControlVariant["Handle"] = "handle";
		})(ResizeControlVariant || (ResizeControlVariant = {}));
		/**
		* Get all connecting edges for a given set of nodes
		* @param width - new width of the node
		* @param prevWidth - previous width of the node
		* @param height - new height of the node
		* @param prevHeight - previous height of the node
		* @param affectsX - whether to invert the resize direction for the x axis
		* @param affectsY - whether to invert the resize direction for the y axis
		* @returns array of two numbers representing the direction of the resize for each axis, 0 = no change, 1 = increase, -1 = decrease
		*/
		function getResizeDirection({ width, prevWidth, height, prevHeight, affectsX, affectsY }) {
			const deltaWidth = width - prevWidth;
			const deltaHeight = height - prevHeight;
			const direction = [deltaWidth > 0 ? 1 : deltaWidth < 0 ? -1 : 0, deltaHeight > 0 ? 1 : deltaHeight < 0 ? -1 : 0];
			if (deltaWidth && affectsX) direction[0] = direction[0] * -1;
			if (deltaHeight && affectsY) direction[1] = direction[1] * -1;
			return direction;
		}
		/**
		* Parses the control position that is being dragged to dimensions that are being resized
		* @param controlPosition - position of the control that is being dragged
		* @returns isHorizontal, isVertical, affectsX, affectsY,
		*/
		function getControlDirection(controlPosition) {
			return {
				isHorizontal: controlPosition.includes("right") || controlPosition.includes("left"),
				isVertical: controlPosition.includes("bottom") || controlPosition.includes("top"),
				affectsX: controlPosition.includes("left"),
				affectsY: controlPosition.includes("top")
			};
		}
		function getLowerExtentClamp(lowerExtent, lowerBound) {
			return Math.max(0, lowerBound - lowerExtent);
		}
		function getUpperExtentClamp(upperExtent, upperBound) {
			return Math.max(0, upperExtent - upperBound);
		}
		function getSizeClamp(size, minSize, maxSize) {
			return Math.max(0, minSize - size, size - maxSize);
		}
		function xor(a, b) {
			return a ? !b : b;
		}
		/**
		* Calculates new width & height and x & y of node after resize based on pointer position
		* @description - Buckle up, this is a chunky one... If you want to determine the new dimensions of a node after a resize,
		* you have to account for all possible restrictions: min/max width/height of the node, the maximum extent the node is allowed
		* to move in (in this case: resize into) determined by the parent node, the minimal extent determined by child nodes
		* with expandParent or extent: 'parent' set and oh yeah, these things also have to work with keepAspectRatio!
		* The way this is done is by determining how much each of these restricting actually restricts the resize and then applying the
		* strongest restriction. Because the resize affects x, y and width, height and width, height of a opposing side with keepAspectRatio,
		* the resize amount is always kept in distX & distY amount (the distance in mouse movement)
		* Instead of clamping each value, we first calculate the biggest 'clamp' (for the lack of a better name) and then apply it to all values.
		* To complicate things nodeOrigin has to be taken into account as well. This is done by offsetting the nodes as if their origin is [0, 0],
		* then calculating the restrictions as usual
		* @param startValues - starting values of resize
		* @param controlDirection - dimensions affected by the resize
		* @param pointerPosition - the current pointer position corrected for snapping
		* @param boundaries - minimum and maximum dimensions of the node
		* @param keepAspectRatio - prevent changes of asprect ratio
		* @returns x, y, width and height of the node after resize
		*/
		function getDimensionsAfterResize(startValues, controlDirection, pointerPosition, boundaries, keepAspectRatio, nodeOrigin, extent, childExtent) {
			let { affectsX, affectsY } = controlDirection;
			const { isHorizontal, isVertical } = controlDirection;
			const isDiagonal = isHorizontal && isVertical;
			const { xSnapped, ySnapped } = pointerPosition;
			const { minWidth, maxWidth, minHeight, maxHeight } = boundaries;
			const { x: startX, y: startY, width: startWidth, height: startHeight, aspectRatio } = startValues;
			let distX = Math.floor(isHorizontal ? xSnapped - startValues.pointerX : 0);
			let distY = Math.floor(isVertical ? ySnapped - startValues.pointerY : 0);
			const newWidth = startWidth + (affectsX ? -distX : distX);
			const newHeight = startHeight + (affectsY ? -distY : distY);
			const originOffsetX = -nodeOrigin[0] * startWidth;
			const originOffsetY = -nodeOrigin[1] * startHeight;
			let clampX = getSizeClamp(newWidth, minWidth, maxWidth);
			let clampY = getSizeClamp(newHeight, minHeight, maxHeight);
			if (extent) {
				let xExtentClamp = 0;
				let yExtentClamp = 0;
				if (affectsX && distX < 0) xExtentClamp = getLowerExtentClamp(startX + distX + originOffsetX, extent[0][0]);
				else if (!affectsX && distX > 0) xExtentClamp = getUpperExtentClamp(startX + newWidth + originOffsetX, extent[1][0]);
				if (affectsY && distY < 0) yExtentClamp = getLowerExtentClamp(startY + distY + originOffsetY, extent[0][1]);
				else if (!affectsY && distY > 0) yExtentClamp = getUpperExtentClamp(startY + newHeight + originOffsetY, extent[1][1]);
				clampX = Math.max(clampX, xExtentClamp);
				clampY = Math.max(clampY, yExtentClamp);
			}
			if (childExtent) {
				let xExtentClamp = 0;
				let yExtentClamp = 0;
				if (affectsX && distX > 0) xExtentClamp = getUpperExtentClamp(startX + distX, childExtent[0][0]);
				else if (!affectsX && distX < 0) xExtentClamp = getLowerExtentClamp(startX + newWidth, childExtent[1][0]);
				if (affectsY && distY > 0) yExtentClamp = getUpperExtentClamp(startY + distY, childExtent[0][1]);
				else if (!affectsY && distY < 0) yExtentClamp = getLowerExtentClamp(startY + newHeight, childExtent[1][1]);
				clampX = Math.max(clampX, xExtentClamp);
				clampY = Math.max(clampY, yExtentClamp);
			}
			if (keepAspectRatio) {
				if (isHorizontal) {
					const aspectHeightClamp = getSizeClamp(newWidth / aspectRatio, minHeight, maxHeight) * aspectRatio;
					clampX = Math.max(clampX, aspectHeightClamp);
					if (extent) {
						let aspectExtentClamp = 0;
						if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) aspectExtentClamp = getUpperExtentClamp(startY + originOffsetY + newWidth / aspectRatio, extent[1][1]) * aspectRatio;
						else aspectExtentClamp = getLowerExtentClamp(startY + originOffsetY + (affectsX ? distX : -distX) / aspectRatio, extent[0][1]) * aspectRatio;
						clampX = Math.max(clampX, aspectExtentClamp);
					}
					if (childExtent) {
						let aspectExtentClamp = 0;
						if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) aspectExtentClamp = getLowerExtentClamp(startY + newWidth / aspectRatio, childExtent[1][1]) * aspectRatio;
						else aspectExtentClamp = getUpperExtentClamp(startY + (affectsX ? distX : -distX) / aspectRatio, childExtent[0][1]) * aspectRatio;
						clampX = Math.max(clampX, aspectExtentClamp);
					}
				}
				if (isVertical) {
					const aspectWidthClamp = getSizeClamp(newHeight * aspectRatio, minWidth, maxWidth) / aspectRatio;
					clampY = Math.max(clampY, aspectWidthClamp);
					if (extent) {
						let aspectExtentClamp = 0;
						if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) aspectExtentClamp = getUpperExtentClamp(startX + newHeight * aspectRatio + originOffsetX, extent[1][0]) / aspectRatio;
						else aspectExtentClamp = getLowerExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio + originOffsetX, extent[0][0]) / aspectRatio;
						clampY = Math.max(clampY, aspectExtentClamp);
					}
					if (childExtent) {
						let aspectExtentClamp = 0;
						if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) aspectExtentClamp = getLowerExtentClamp(startX + newHeight * aspectRatio, childExtent[1][0]) / aspectRatio;
						else aspectExtentClamp = getUpperExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio, childExtent[0][0]) / aspectRatio;
						clampY = Math.max(clampY, aspectExtentClamp);
					}
				}
			}
			distY = distY + (distY < 0 ? clampY : -clampY);
			distX = distX + (distX < 0 ? clampX : -clampX);
			if (keepAspectRatio) if (isDiagonal) if (newWidth > newHeight * aspectRatio) distY = (xor(affectsX, affectsY) ? -distX : distX) / aspectRatio;
			else distX = (xor(affectsX, affectsY) ? -distY : distY) * aspectRatio;
			else if (isHorizontal) {
				distY = distX / aspectRatio;
				affectsY = affectsX;
			} else {
				distX = distY * aspectRatio;
				affectsX = affectsY;
			}
			const x = affectsX ? startX + distX : startX;
			const y = affectsY ? startY + distY : startY;
			return {
				width: startWidth + (affectsX ? -distX : distX),
				height: startHeight + (affectsY ? -distY : distY),
				x: nodeOrigin[0] * distX * (!affectsX ? 1 : -1) + x,
				y: nodeOrigin[1] * distY * (!affectsY ? 1 : -1) + y
			};
		}
		const initPrevValues$1 = {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		const initStartValues = {
			...initPrevValues$1,
			pointerX: 0,
			pointerY: 0,
			aspectRatio: 1
		};
		function nodeToChildExtent(child, parent, nodeOrigin) {
			const x = parent.position.x + child.position.x;
			const y = parent.position.y + child.position.y;
			const width = child.measured.width ?? 0;
			const height = child.measured.height ?? 0;
			const originOffsetX = nodeOrigin[0] * width;
			const originOffsetY = nodeOrigin[1] * height;
			return [[x - originOffsetX, y - originOffsetY], [x + width - originOffsetX, y + height - originOffsetY]];
		}
		function XYResizer({ domNode, nodeId, getStoreItems, onChange, onEnd }) {
			const selection = select_default$1(domNode);
			let params = {
				controlDirection: getControlDirection("bottom-right"),
				boundaries: {
					minWidth: 0,
					minHeight: 0,
					maxWidth: Number.MAX_VALUE,
					maxHeight: Number.MAX_VALUE
				},
				resizeDirection: void 0,
				keepAspectRatio: false
			};
			function update({ controlPosition, boundaries, keepAspectRatio, resizeDirection, onResizeStart, onResize, onResizeEnd, shouldResize }) {
				let prevValues = { ...initPrevValues$1 };
				let startValues = { ...initStartValues };
				params = {
					boundaries,
					resizeDirection,
					keepAspectRatio,
					controlDirection: getControlDirection(controlPosition)
				};
				let node = void 0;
				let containerBounds = null;
				let childNodes = [];
				let parentNode = void 0;
				let nodeExtent = void 0;
				let childExtent = void 0;
				let resizeDetected = false;
				const dragHandler = drag_default().on("start", (event) => {
					const { nodeLookup, transform, snapGrid, snapToGrid, nodeOrigin, paneDomNode } = getStoreItems();
					node = nodeLookup.get(nodeId);
					if (!node) return;
					containerBounds = paneDomNode?.getBoundingClientRect() ?? null;
					const { xSnapped, ySnapped } = getPointerPosition(event.sourceEvent, {
						transform,
						snapGrid,
						snapToGrid,
						containerBounds
					});
					prevValues = {
						width: node.measured.width ?? 0,
						height: node.measured.height ?? 0,
						x: node.position.x ?? 0,
						y: node.position.y ?? 0
					};
					startValues = {
						...prevValues,
						pointerX: xSnapped,
						pointerY: ySnapped,
						aspectRatio: prevValues.width / prevValues.height
					};
					parentNode = void 0;
					nodeExtent = isCoordinateExtent(node.extent) ? node.extent : void 0;
					if (node.parentId && (node.extent === "parent" || node.expandParent)) parentNode = nodeLookup.get(node.parentId);
					if (parentNode && node.extent === "parent") nodeExtent = [[0, 0], [parentNode.measured.width, parentNode.measured.height]];
					childNodes = [];
					childExtent = void 0;
					for (const [childId, child] of nodeLookup) if (child.parentId === nodeId) {
						childNodes.push({
							id: childId,
							position: { ...child.position },
							extent: child.extent
						});
						if (child.extent === "parent" || child.expandParent) {
							const extent = nodeToChildExtent(child, node, child.origin ?? nodeOrigin);
							if (childExtent) childExtent = [[Math.min(extent[0][0], childExtent[0][0]), Math.min(extent[0][1], childExtent[0][1])], [Math.max(extent[1][0], childExtent[1][0]), Math.max(extent[1][1], childExtent[1][1])]];
							else childExtent = extent;
						}
					}
					onResizeStart?.(event, { ...prevValues });
				}).on("drag", (event) => {
					const { transform, snapGrid, snapToGrid, nodeOrigin: storeNodeOrigin } = getStoreItems();
					const pointerPosition = getPointerPosition(event.sourceEvent, {
						transform,
						snapGrid,
						snapToGrid,
						containerBounds
					});
					const childChanges = [];
					if (!node) return;
					const { x: prevX, y: prevY, width: prevWidth, height: prevHeight } = prevValues;
					const change = {};
					const nodeOrigin = node.origin ?? storeNodeOrigin;
					const { width, height, x, y } = getDimensionsAfterResize(startValues, params.controlDirection, pointerPosition, params.boundaries, params.keepAspectRatio, nodeOrigin, nodeExtent, childExtent);
					const isWidthChange = width !== prevWidth;
					const isHeightChange = height !== prevHeight;
					const isXPosChange = x !== prevX && isWidthChange;
					const isYPosChange = y !== prevY && isHeightChange;
					if (!isXPosChange && !isYPosChange && !isWidthChange && !isHeightChange) return;
					if (isXPosChange || isYPosChange || nodeOrigin[0] === 1 || nodeOrigin[1] === 1) {
						change.x = isXPosChange ? x : prevValues.x;
						change.y = isYPosChange ? y : prevValues.y;
						prevValues.x = change.x;
						prevValues.y = change.y;
						if (childNodes.length > 0) {
							const xChange = x - prevX;
							const yChange = y - prevY;
							for (const childNode of childNodes) {
								childNode.position = {
									x: childNode.position.x - xChange + nodeOrigin[0] * (width - prevWidth),
									y: childNode.position.y - yChange + nodeOrigin[1] * (height - prevHeight)
								};
								childChanges.push(childNode);
							}
						}
					}
					if (isWidthChange || isHeightChange) {
						change.width = isWidthChange && (!params.resizeDirection || params.resizeDirection === "horizontal") ? width : prevValues.width;
						change.height = isHeightChange && (!params.resizeDirection || params.resizeDirection === "vertical") ? height : prevValues.height;
						prevValues.width = change.width;
						prevValues.height = change.height;
					}
					if (parentNode && node.expandParent) {
						const xLimit = nodeOrigin[0] * (change.width ?? 0);
						if (change.x && change.x < xLimit) {
							prevValues.x = xLimit;
							startValues.x = startValues.x - (change.x - xLimit);
						}
						const yLimit = nodeOrigin[1] * (change.height ?? 0);
						if (change.y && change.y < yLimit) {
							prevValues.y = yLimit;
							startValues.y = startValues.y - (change.y - yLimit);
						}
					}
					const direction = getResizeDirection({
						width: prevValues.width,
						prevWidth,
						height: prevValues.height,
						prevHeight,
						affectsX: params.controlDirection.affectsX,
						affectsY: params.controlDirection.affectsY
					});
					const nextValues = {
						...prevValues,
						direction
					};
					if (shouldResize?.(event, nextValues) === false) return;
					resizeDetected = true;
					onResize?.(event, nextValues);
					onChange(change, childChanges);
				}).on("end", (event) => {
					if (!resizeDetected) return;
					onResizeEnd?.(event, { ...prevValues });
					onEnd?.({ ...prevValues });
					resizeDetected = false;
				});
				selection.call(dragHandler);
			}
			function destroy() {
				selection.on(".drag", null);
			}
			return {
				update,
				destroy
			};
		}
		//#endregion
		//#region node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
		/**
		* @license React
		* use-sync-external-store-shim.production.js
		*
		* Copyright (c) Meta Platforms, Inc. and affiliates.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_use_sync_external_store_shim_production = /* @__PURE__ */ __commonJSMin(((exports) => {
			var React$1 = require("react");
			function is(x, y) {
				return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
			}
			var objectIs = "function" === typeof Object.is ? Object.is : is;
			var useState = React$1.useState;
			var useEffect = React$1.useEffect;
			var useLayoutEffect = React$1.useLayoutEffect;
			var useDebugValue = React$1.useDebugValue;
			function useSyncExternalStore$2(subscribe, getSnapshot) {
				var value = getSnapshot(), _useState = useState({ inst: {
					value,
					getSnapshot
				} }), inst = _useState[0].inst, forceUpdate = _useState[1];
				useLayoutEffect(function() {
					inst.value = value;
					inst.getSnapshot = getSnapshot;
					checkIfSnapshotChanged(inst) && forceUpdate({ inst });
				}, [
					subscribe,
					value,
					getSnapshot
				]);
				useEffect(function() {
					checkIfSnapshotChanged(inst) && forceUpdate({ inst });
					return subscribe(function() {
						checkIfSnapshotChanged(inst) && forceUpdate({ inst });
					});
				}, [subscribe]);
				useDebugValue(value);
				return value;
			}
			function checkIfSnapshotChanged(inst) {
				var latestGetSnapshot = inst.getSnapshot;
				inst = inst.value;
				try {
					var nextValue = latestGetSnapshot();
					return !objectIs(inst, nextValue);
				} catch (error) {
					return !0;
				}
			}
			function useSyncExternalStore$1(subscribe, getSnapshot) {
				return getSnapshot();
			}
			var shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
			exports.useSyncExternalStore = void 0 !== React$1.useSyncExternalStore ? React$1.useSyncExternalStore : shim;
		}));
		//#endregion
		//#region node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js
		var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_use_sync_external_store_shim_production();
		}));
		//#endregion
		//#region node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
		/**
		* @license React
		* use-sync-external-store-shim/with-selector.production.js
		*
		* Copyright (c) Meta Platforms, Inc. and affiliates.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_with_selector_production = /* @__PURE__ */ __commonJSMin(((exports) => {
			var React = require("react");
			var shim = require_shim();
			function is(x, y) {
				return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
			}
			var objectIs = "function" === typeof Object.is ? Object.is : is;
			var useSyncExternalStore = shim.useSyncExternalStore;
			var useRef = React.useRef;
			var useEffect = React.useEffect;
			var useMemo = React.useMemo;
			var useDebugValue = React.useDebugValue;
			exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
				var instRef = useRef(null);
				if (null === instRef.current) {
					var inst = {
						hasValue: !1,
						value: null
					};
					instRef.current = inst;
				} else inst = instRef.current;
				instRef = useMemo(function() {
					function memoizedSelector(nextSnapshot) {
						if (!hasMemo) {
							hasMemo = !0;
							memoizedSnapshot = nextSnapshot;
							nextSnapshot = selector(nextSnapshot);
							if (void 0 !== isEqual && inst.hasValue) {
								var currentSelection = inst.value;
								if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
							}
							return memoizedSelection = nextSnapshot;
						}
						currentSelection = memoizedSelection;
						if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
						var nextSelection = selector(nextSnapshot);
						if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
						memoizedSnapshot = nextSnapshot;
						return memoizedSelection = nextSelection;
					}
					var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
					return [function() {
						return memoizedSelector(getSnapshot());
					}, null === maybeGetServerSnapshot ? void 0 : function() {
						return memoizedSelector(maybeGetServerSnapshot());
					}];
				}, [
					getSnapshot,
					getServerSnapshot,
					selector,
					isEqual
				]);
				var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
				useEffect(function() {
					inst.hasValue = !0;
					inst.value = value;
				}, [value]);
				useDebugValue(value);
				return value;
			};
		}));
		//#endregion
		//#region node_modules/.pnpm/zustand@4.5.7_@types+react@18.3.31_react@18.3.1/node_modules/zustand/esm/vanilla.mjs
		var import_with_selector = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_with_selector_production();
		})))(), 1);
		const createStoreImpl = (createState) => {
			let state;
			const listeners = /* @__PURE__ */ new Set();
			const setState = (partial, replace) => {
				const nextState = typeof partial === "function" ? partial(state) : partial;
				if (!Object.is(nextState, state)) {
					const previousState = state;
					state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
					listeners.forEach((listener) => listener(state, previousState));
				}
			};
			const getState = () => state;
			const getInitialState = () => initialState;
			const subscribe = (listener) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			};
			const destroy = () => {
				listeners.clear();
			};
			const api = {
				setState,
				getState,
				getInitialState,
				subscribe,
				destroy
			};
			const initialState = state = createState(setState, getState, api);
			return api;
		};
		const createStore$1 = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
		//#endregion
		//#region node_modules/.pnpm/zustand@4.5.7_@types+react@18.3.31_react@18.3.1/node_modules/zustand/esm/traditional.mjs
		const { useDebugValue } = react.default;
		const { useSyncExternalStoreWithSelector } = import_with_selector.default;
		const identity = (arg) => arg;
		function useStoreWithEqualityFn(api, selector = identity, equalityFn) {
			const slice = useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getInitialState, selector, equalityFn);
			useDebugValue(slice);
			return slice;
		}
		const createWithEqualityFnImpl = (createState, defaultEqualityFn) => {
			const api = createStore$1(createState);
			const useBoundStoreWithEqualityFn = (selector, equalityFn = defaultEqualityFn) => useStoreWithEqualityFn(api, selector, equalityFn);
			Object.assign(useBoundStoreWithEqualityFn, api);
			return useBoundStoreWithEqualityFn;
		};
		const createWithEqualityFn = (createState, defaultEqualityFn) => createState ? createWithEqualityFnImpl(createState, defaultEqualityFn) : createWithEqualityFnImpl;
		//#endregion
		//#region node_modules/.pnpm/zustand@4.5.7_@types+react@18.3.31_react@18.3.1/node_modules/zustand/esm/shallow.mjs
		function shallow$1(objA, objB) {
			if (Object.is(objA, objB)) return true;
			if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) return false;
			if (objA instanceof Map && objB instanceof Map) {
				if (objA.size !== objB.size) return false;
				for (const [key, value] of objA) if (!Object.is(value, objB.get(key))) return false;
				return true;
			}
			if (objA instanceof Set && objB instanceof Set) {
				if (objA.size !== objB.size) return false;
				for (const value of objA) if (!objB.has(value)) return false;
				return true;
			}
			const keysA = Object.keys(objA);
			if (keysA.length !== Object.keys(objB).length) return false;
			for (const keyA of keysA) if (!Object.prototype.hasOwnProperty.call(objB, keyA) || !Object.is(objA[keyA], objB[keyA])) return false;
			return true;
		}
		//#endregion
		//#region node_modules/.pnpm/@xyflow+react@12.11.3_@types+react-dom@19.2.4_@types+react@18.3.31__@types+react@18.3.3_26a902b2d2345071a1ba8dd920d8943c/node_modules/@xyflow/react/dist/esm/index.js
		const StoreContext = (0, react.createContext)(null);
		const Provider$1 = StoreContext.Provider;
		const zustandErrorMessage = errorMessages["error001"]("react");
		/**
		* This hook can be used to subscribe to internal state changes of the React Flow
		* component. The `useStore` hook is re-exported from the [Zustand](https://github.com/pmndrs/zustand)
		* state management library, so you should check out their docs for more details.
		*
		* @public
		* @param selector - A selector function that returns a slice of the flow's internal state.
		* Extracting or transforming just the state you need is a good practice to avoid unnecessary
		* re-renders.
		* @param equalityFn - A function to compare the previous and next value. This is incredibly useful
		* for preventing unnecessary re-renders. Good sensible defaults are using `Object.is` or importing
		* `zustand/shallow`, but you can be as granular as you like.
		* @returns The selected state slice.
		*
		* @example
		* ```ts
		* const nodes = useStore((state) => state.nodes);
		* ```
		*
		* @remarks This hook should only be used if there is no other way to access the internal
		* state. For many of the common use cases, there are dedicated hooks available
		* such as {@link useReactFlow}, {@link useViewport}, etc.
		*/
		function useStore(selector, equalityFn) {
			const store = (0, react.useContext)(StoreContext);
			if (store === null) throw new Error(zustandErrorMessage);
			return useStoreWithEqualityFn(store, selector, equalityFn);
		}
		/**
		* In some cases, you might need to access the store directly. This hook returns the store object which can be used on demand to access the state or dispatch actions.
		*
		* @returns The store object.
		* @example
		* ```ts
		* const store = useStoreApi();
		* ```
		*
		* @remarks This hook should only be used if there is no other way to access the internal
		* state. For many of the common use cases, there are dedicated hooks available
		* such as {@link useReactFlow}, {@link useViewport}, etc.
		*/
		function useStoreApi() {
			const store = (0, react.useContext)(StoreContext);
			if (store === null) throw new Error(zustandErrorMessage);
			return (0, react.useMemo)(() => ({
				getState: store.getState,
				setState: store.setState,
				subscribe: store.subscribe
			}), [store]);
		}
		const style = { display: "none" };
		const ariaLiveStyle = {
			position: "absolute",
			width: 1,
			height: 1,
			margin: -1,
			border: 0,
			padding: 0,
			overflow: "hidden",
			clip: "rect(0px, 0px, 0px, 0px)",
			clipPath: "inset(100%)"
		};
		const ARIA_NODE_DESC_KEY = "react-flow__node-desc";
		const ARIA_EDGE_DESC_KEY = "react-flow__edge-desc";
		const ARIA_LIVE_MESSAGE = "react-flow__aria-live";
		const ariaLiveSelector = (s) => s.ariaLiveMessage;
		const ariaLabelConfigSelector = (s) => s.ariaLabelConfig;
		function AriaLiveMessage({ rfId }) {
			const ariaLiveMessage = useStore(ariaLiveSelector);
			return (0, react_jsx_runtime.jsx)("div", {
				id: `${ARIA_LIVE_MESSAGE}-${rfId}`,
				"aria-live": "assertive",
				"aria-atomic": "true",
				style: ariaLiveStyle,
				children: ariaLiveMessage
			});
		}
		function A11yDescriptions({ rfId, disableKeyboardA11y }) {
			const ariaLabelConfig = useStore(ariaLabelConfigSelector);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("div", {
					id: `${ARIA_NODE_DESC_KEY}-${rfId}`,
					style,
					children: disableKeyboardA11y ? ariaLabelConfig["node.a11yDescription.default"] : ariaLabelConfig["node.a11yDescription.keyboardDisabled"]
				}),
				(0, react_jsx_runtime.jsx)("div", {
					id: `${ARIA_EDGE_DESC_KEY}-${rfId}`,
					style,
					children: ariaLabelConfig["edge.a11yDescription.default"]
				}),
				!disableKeyboardA11y && (0, react_jsx_runtime.jsx)(AriaLiveMessage, { rfId })
			] });
		}
		/**
		* The `<Panel />` component helps you position content above the viewport.
		* It is used internally by the [`<MiniMap />`](/api-reference/components/minimap)
		* and [`<Controls />`](/api-reference/components/controls) components.
		*
		* @public
		*
		* @example
		* ```jsx
		*import { ReactFlow, Background, Panel } from '@xyflow/react';
		*
		*export default function Flow() {
		*  return (
		*    <ReactFlow nodes={[]} fitView>
		*      <Panel position="top-left">top-left</Panel>
		*      <Panel position="top-center">top-center</Panel>
		*      <Panel position="top-right">top-right</Panel>
		*      <Panel position="bottom-left">bottom-left</Panel>
		*      <Panel position="bottom-center">bottom-center</Panel>
		*      <Panel position="bottom-right">bottom-right</Panel>
		*    </ReactFlow>
		*  );
		*}
		*```
		*/
		const Panel = (0, react.forwardRef)(({ position = "top-left", children, className, style, ...rest }, ref) => {
			return (0, react_jsx_runtime.jsx)("div", {
				className: cc([
					"react-flow__panel",
					className,
					...`${position}`.split("-")
				]),
				style,
				ref,
				...rest,
				children
			});
		});
		Panel.displayName = "Panel";
		const link = `https://reactflow.dev?utm_source=attribution`;
		function Attribution({ proOptions, position = "bottom-right" }) {
			if (proOptions?.hideAttribution) return null;
			return (0, react_jsx_runtime.jsx)(Panel, {
				position,
				className: "react-flow__attribution",
				"data-message": `Please only hide this attribution when you are subscribed to React Flow Pro: ${link}`,
				children: (0, react_jsx_runtime.jsx)("a", {
					href: link,
					target: "_blank",
					rel: "noopener noreferrer",
					"aria-label": "React Flow attribution",
					children: "React Flow"
				})
			});
		}
		const selector$l = (s) => {
			const selectedNodes = [];
			const selectedEdges = [];
			for (const [, node] of s.nodeLookup) if (node.selected) selectedNodes.push(node.internals.userNode);
			for (const [, edge] of s.edgeLookup) if (edge.selected) selectedEdges.push(edge);
			return {
				selectedNodes,
				selectedEdges
			};
		};
		const selectId = (obj) => obj.id;
		function areEqual$1(a, b) {
			return shallow$1(a.selectedNodes.map(selectId), b.selectedNodes.map(selectId)) && shallow$1(a.selectedEdges.map(selectId), b.selectedEdges.map(selectId));
		}
		function SelectionListenerInner({ onSelectionChange }) {
			const store = useStoreApi();
			const { selectedNodes, selectedEdges } = useStore(selector$l, areEqual$1);
			(0, react.useEffect)(() => {
				const params = {
					nodes: selectedNodes,
					edges: selectedEdges
				};
				onSelectionChange?.(params);
				store.getState().onSelectionChangeHandlers.forEach((fn) => fn(params));
			}, [
				selectedNodes,
				selectedEdges,
				onSelectionChange
			]);
			return null;
		}
		const changeSelector = (s) => !!s.onSelectionChangeHandlers;
		function SelectionListener({ onSelectionChange }) {
			const storeHasSelectionChangeHandlers = useStore(changeSelector);
			if (onSelectionChange || storeHasSelectionChangeHandlers) return (0, react_jsx_runtime.jsx)(SelectionListenerInner, { onSelectionChange });
			return null;
		}
		const defaultNodeOrigin = [0, 0];
		const defaultViewport = {
			x: 0,
			y: 0,
			zoom: 1
		};
		const fieldsToTrack = [...[
			"nodes",
			"edges",
			"defaultNodes",
			"defaultEdges",
			"onConnect",
			"onConnectStart",
			"onConnectEnd",
			"onClickConnectStart",
			"onClickConnectEnd",
			"nodesDraggable",
			"autoPanOnNodeFocus",
			"nodesConnectable",
			"nodesFocusable",
			"edgesFocusable",
			"edgesReconnectable",
			"elevateNodesOnSelect",
			"elevateEdgesOnSelect",
			"minZoom",
			"maxZoom",
			"nodeExtent",
			"onNodesChange",
			"onEdgesChange",
			"elementsSelectable",
			"connectionMode",
			"snapGrid",
			"snapToGrid",
			"translateExtent",
			"connectOnClick",
			"defaultEdgeOptions",
			"fitView",
			"fitViewOptions",
			"onNodesDelete",
			"onEdgesDelete",
			"onDelete",
			"onNodeDrag",
			"onNodeDragStart",
			"onNodeDragStop",
			"onSelectionDrag",
			"onSelectionDragStart",
			"onSelectionDragStop",
			"onMoveStart",
			"onMove",
			"onMoveEnd",
			"noPanClassName",
			"nodeOrigin",
			"autoPanOnConnect",
			"autoPanOnNodeDrag",
			"onError",
			"connectionRadius",
			"isValidConnection",
			"selectNodesOnDrag",
			"nodeDragThreshold",
			"connectionDragThreshold",
			"onBeforeDelete",
			"debug",
			"autoPanSpeed",
			"ariaLabelConfig",
			"zIndexMode"
		], "rfId"];
		const selector$k = (s) => ({
			setNodes: s.setNodes,
			setEdges: s.setEdges,
			setMinZoom: s.setMinZoom,
			setMaxZoom: s.setMaxZoom,
			setTranslateExtent: s.setTranslateExtent,
			setNodeExtent: s.setNodeExtent,
			reset: s.reset,
			setDefaultNodesAndEdges: s.setDefaultNodesAndEdges
		});
		const initPrevValues = {
			translateExtent: infiniteExtent,
			nodeOrigin: defaultNodeOrigin,
			minZoom: .5,
			maxZoom: 2,
			elementsSelectable: true,
			noPanClassName: "nopan",
			rfId: "1"
		};
		function StoreUpdater(props) {
			const { setNodes, setEdges, setMinZoom, setMaxZoom, setTranslateExtent, setNodeExtent, reset, setDefaultNodesAndEdges } = useStore(selector$k, shallow$1);
			const store = useStoreApi();
			(0, react.useEffect)(() => {
				setDefaultNodesAndEdges(props.defaultNodes, props.defaultEdges);
				return () => {
					previousFields.current = initPrevValues;
					reset();
				};
			}, []);
			const previousFields = (0, react.useRef)(initPrevValues);
			(0, react.useEffect)(() => {
				for (const fieldName of fieldsToTrack) {
					const fieldValue = props[fieldName];
					if (fieldValue === previousFields.current[fieldName]) continue;
					if (typeof props[fieldName] === "undefined") continue;
					if (fieldName === "nodes") setNodes(fieldValue);
					else if (fieldName === "edges") setEdges(fieldValue);
					else if (fieldName === "minZoom") setMinZoom(fieldValue);
					else if (fieldName === "maxZoom") setMaxZoom(fieldValue);
					else if (fieldName === "translateExtent") setTranslateExtent(fieldValue);
					else if (fieldName === "nodeExtent") setNodeExtent(fieldValue);
					else if (fieldName === "ariaLabelConfig") store.setState({ ariaLabelConfig: mergeAriaLabelConfig(fieldValue) });
					else if (fieldName === "fitView") store.setState({ fitViewQueued: fieldValue });
					else if (fieldName === "fitViewOptions") store.setState({ fitViewOptions: fieldValue });
					else store.setState({ [fieldName]: fieldValue });
				}
				previousFields.current = props;
			}, fieldsToTrack.map((fieldName) => props[fieldName]));
			return null;
		}
		function getMediaQuery() {
			if (typeof window === "undefined" || !window.matchMedia) return null;
			return window.matchMedia("(prefers-color-scheme: dark)");
		}
		/**
		* Hook for receiving the current color mode class 'dark' or 'light'.
		*
		* @internal
		* @param colorMode - The color mode to use ('dark', 'light' or 'system')
		*/
		function useColorModeClass(colorMode) {
			const [colorModeClass, setColorModeClass] = (0, react.useState)(colorMode === "system" ? null : colorMode);
			(0, react.useEffect)(() => {
				if (colorMode !== "system") {
					setColorModeClass(colorMode);
					return;
				}
				const mediaQuery = getMediaQuery();
				const updateColorModeClass = () => setColorModeClass(mediaQuery?.matches ? "dark" : "light");
				updateColorModeClass();
				mediaQuery?.addEventListener("change", updateColorModeClass);
				return () => {
					mediaQuery?.removeEventListener("change", updateColorModeClass);
				};
			}, [colorMode]);
			return colorModeClass !== null ? colorModeClass : getMediaQuery()?.matches ? "dark" : "light";
		}
		const defaultDoc = typeof document !== "undefined" ? document : null;
		/**
		* This hook lets you listen for specific key codes and tells you whether they are
		* currently pressed or not.
		*
		* @public
		* @param options - Options
		*
		* @example
		* ```tsx
		*import { useKeyPress } from '@xyflow/react';
		*
		*export default function () {
		*  const spacePressed = useKeyPress('Space');
		*  const cmdAndSPressed = useKeyPress(['Meta+s', 'Strg+s']);
		*
		*  return (
		*    <div>
		*     {spacePressed && <p>Space pressed!</p>}
		*     {cmdAndSPressed && <p>Cmd + S pressed!</p>}
		*    </div>
		*  );
		*}
		*```
		*/
		function useKeyPress(keyCode = null, options = {
			target: defaultDoc,
			actInsideInputWithModifier: true
		}) {
			const [keyPressed, setKeyPressed] = (0, react.useState)(false);
			const modifierPressed = (0, react.useRef)(false);
			const pressedKeys = (0, react.useRef)(/* @__PURE__ */ new Set([]));
			const [keyCodes, keysToWatch] = (0, react.useMemo)(() => {
				if (keyCode !== null) {
					const keys = (Array.isArray(keyCode) ? keyCode : [keyCode]).filter((kc) => typeof kc === "string").map((kc) => kc.replace(/\+/g, "\n").replace("\n\n", "\n+").split("\n"));
					return [keys, keys.reduce((res, item) => res.concat(...item), [])];
				}
				return [[], []];
			}, [keyCode]);
			(0, react.useEffect)(() => {
				const target = options?.target ?? defaultDoc;
				const actInsideInputWithModifier = options?.actInsideInputWithModifier ?? true;
				if (keyCode !== null) {
					const downHandler = (event) => {
						modifierPressed.current = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
						if ((!modifierPressed.current || modifierPressed.current && !actInsideInputWithModifier) && isInputDOMNode(event)) return false;
						const keyOrCode = useKeyOrCode(event.code, keysToWatch);
						pressedKeys.current.add(event[keyOrCode]);
						if (isMatchingKey(keyCodes, pressedKeys.current, false)) {
							const target = event.composedPath?.()?.[0] || event.target;
							const isInteractiveElement = target?.nodeName === "BUTTON" || target?.nodeName === "A";
							if (options.preventDefault !== false && (modifierPressed.current || !isInteractiveElement)) event.preventDefault();
							setKeyPressed(true);
						}
					};
					const upHandler = (event) => {
						const keyOrCode = useKeyOrCode(event.code, keysToWatch);
						if (isMatchingKey(keyCodes, pressedKeys.current, true)) {
							setKeyPressed(false);
							pressedKeys.current.clear();
						} else pressedKeys.current.delete(event[keyOrCode]);
						if (event.key === "Meta") pressedKeys.current.clear();
						modifierPressed.current = false;
					};
					const resetHandler = () => {
						pressedKeys.current.clear();
						setKeyPressed(false);
					};
					target?.addEventListener("keydown", downHandler);
					target?.addEventListener("keyup", upHandler);
					window.addEventListener("blur", resetHandler);
					window.addEventListener("contextmenu", resetHandler);
					return () => {
						target?.removeEventListener("keydown", downHandler);
						target?.removeEventListener("keyup", upHandler);
						window.removeEventListener("blur", resetHandler);
						window.removeEventListener("contextmenu", resetHandler);
					};
				}
			}, [keyCode, setKeyPressed]);
			return keyPressed;
		}
		function isMatchingKey(keyCodes, pressedKeys, isUp) {
			return keyCodes.filter((keys) => isUp || keys.length === pressedKeys.size).some((keys) => keys.every((k) => pressedKeys.has(k)));
		}
		function useKeyOrCode(eventCode, keysToWatch) {
			return keysToWatch.includes(eventCode) ? "code" : "key";
		}
		/**
		* Hook for getting viewport helper functions.
		*
		* @internal
		* @returns viewport helper functions
		*/
		const useViewportHelper = () => {
			const store = useStoreApi();
			return (0, react.useMemo)(() => {
				return {
					zoomIn: async (options) => {
						const { panZoom } = store.getState();
						return panZoom ? panZoom.scaleBy(1.2, options) : false;
					},
					zoomOut: async (options) => {
						const { panZoom } = store.getState();
						return panZoom ? panZoom.scaleBy(1 / 1.2, options) : false;
					},
					zoomTo: async (zoomLevel, options) => {
						const { panZoom } = store.getState();
						return panZoom ? panZoom.scaleTo(zoomLevel, options) : false;
					},
					getZoom: () => store.getState().transform[2],
					setViewport: async (viewport, options) => {
						const { transform: [tX, tY, tZoom], panZoom } = store.getState();
						if (!panZoom) return false;
						await panZoom.setViewport({
							x: viewport.x ?? tX,
							y: viewport.y ?? tY,
							zoom: viewport.zoom ?? tZoom
						}, options);
						return true;
					},
					getViewport: () => {
						const [x, y, zoom] = store.getState().transform;
						return {
							x,
							y,
							zoom
						};
					},
					setCenter: async (x, y, options) => {
						return store.getState().setCenter(x, y, options);
					},
					fitBounds: async (bounds, options) => {
						const { width, height, minZoom, maxZoom, panZoom } = store.getState();
						const viewport = getViewportForBounds(bounds, width, height, minZoom, maxZoom, options?.padding ?? .1);
						if (!panZoom) return false;
						await panZoom.setViewport(viewport, {
							duration: options?.duration,
							ease: options?.ease,
							interpolate: options?.interpolate
						});
						return true;
					},
					screenToFlowPosition: (clientPosition, options = {}) => {
						const { transform, snapGrid, snapToGrid, domNode } = store.getState();
						if (!domNode) return clientPosition;
						const { x: domX, y: domY } = domNode.getBoundingClientRect();
						const correctedPosition = {
							x: clientPosition.x - domX,
							y: clientPosition.y - domY
						};
						const _snapGrid = options.snapGrid ?? snapGrid;
						return pointToRendererPoint(correctedPosition, transform, options.snapToGrid ?? snapToGrid, _snapGrid);
					},
					flowToScreenPosition: (flowPosition) => {
						const { transform, domNode } = store.getState();
						if (!domNode) return flowPosition;
						const { x: domX, y: domY } = domNode.getBoundingClientRect();
						const rendererPosition = rendererPointToPoint(flowPosition, transform);
						return {
							x: rendererPosition.x + domX,
							y: rendererPosition.y + domY
						};
					}
				};
			}, []);
		};
		function applyChanges(changes, elements) {
			const updatedElements = [];
			const changesMap = /* @__PURE__ */ new Map();
			const addItemChanges = [];
			for (const change of changes) if (change.type === "add") {
				addItemChanges.push(change);
				continue;
			} else if (change.type === "remove" || change.type === "replace") changesMap.set(change.id, [change]);
			else {
				const elementChanges = changesMap.get(change.id);
				if (elementChanges) elementChanges.push(change);
				else changesMap.set(change.id, [change]);
			}
			for (const element of elements) {
				const changes = changesMap.get(element.id);
				if (!changes) {
					updatedElements.push(element);
					continue;
				}
				if (changes[0].type === "remove") continue;
				if (changes[0].type === "replace") {
					updatedElements.push({ ...changes[0].item });
					continue;
				}
				/**
				* For other types of changes, we want to start with a shallow copy of the
				* object so React knows this element has changed. Sequential changes will
				* each _mutate_ this object, so there's only ever one copy.
				*/
				const updatedElement = { ...element };
				for (const change of changes) applyChange(change, updatedElement);
				updatedElements.push(updatedElement);
			}
			if (addItemChanges.length) addItemChanges.forEach((change) => {
				if (change.index !== void 0) updatedElements.splice(change.index, 0, { ...change.item });
				else updatedElements.push({ ...change.item });
			});
			return updatedElements;
		}
		function applyChange(change, element) {
			switch (change.type) {
				case "select":
					element.selected = change.selected;
					break;
				case "position":
					if (typeof change.position !== "undefined") element.position = change.position;
					if (typeof change.dragging !== "undefined") element.dragging = change.dragging;
					break;
				case "dimensions":
					if (typeof change.dimensions !== "undefined") {
						element.measured = { ...change.dimensions };
						if (change.setAttributes) {
							if (change.setAttributes === true || change.setAttributes === "width") element.width = change.dimensions.width;
							if (change.setAttributes === true || change.setAttributes === "height") element.height = change.dimensions.height;
						}
					}
					if (typeof change.resizing === "boolean") element.resizing = change.resizing;
					break;
			}
		}
		/**
		* Drop in function that applies node changes to an array of nodes.
		* @public
		* @param changes - Array of changes to apply.
		* @param nodes - Array of nodes to apply the changes to.
		* @returns Array of updated nodes.
		* @example
		*```tsx
		*import { useState, useCallback } from 'react';
		*import { ReactFlow, applyNodeChanges, type Node, type Edge, type OnNodesChange } from '@xyflow/react';
		*
		*export default function Flow() {
		*  const [nodes, setNodes] = useState<Node[]>([]);
		*  const [edges, setEdges] = useState<Edge[]>([]);
		*  const onNodesChange: OnNodesChange = useCallback(
		*    (changes) => {
		*      setNodes((oldNodes) => applyNodeChanges(changes, oldNodes));
		*    },
		*    [setNodes],
		*  );
		*
		*  return (
		*    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} />
		*  );
		*}
		*```
		* @remarks Various events on the <ReactFlow /> component can produce an {@link NodeChange}
		* that describes how to update the edges of your flow in some way.
		* If you don't need any custom behaviour, this util can be used to take an array
		* of these changes and apply them to your edges.
		*/
		function applyNodeChanges(changes, nodes) {
			return applyChanges(changes, nodes);
		}
		/**
		* Drop in function that applies edge changes to an array of edges.
		* @public
		* @param changes - Array of changes to apply.
		* @param edges - Array of edge to apply the changes to.
		* @returns Array of updated edges.
		* @example
		* ```tsx
		*import { useState, useCallback } from 'react';
		*import { ReactFlow, applyEdgeChanges } from '@xyflow/react';
		*
		*export default function Flow() {
		*  const [nodes, setNodes] = useState([]);
		*  const [edges, setEdges] = useState([]);
		*  const onEdgesChange = useCallback(
		*    (changes) => {
		*      setEdges((oldEdges) => applyEdgeChanges(changes, oldEdges));
		*    },
		*    [setEdges],
		*  );
		*
		*  return (
		*    <ReactFlow nodes={nodes} edges={edges} onEdgesChange={onEdgesChange} />
		*  );
		*}
		*```
		* @remarks Various events on the <ReactFlow /> component can produce an {@link EdgeChange}
		* that describes how to update the edges of your flow in some way.
		* If you don't need any custom behaviour, this util can be used to take an array
		* of these changes and apply them to your edges.
		*/
		function applyEdgeChanges(changes, edges) {
			return applyChanges(changes, edges);
		}
		function createSelectionChange(id, selected) {
			return {
				id,
				type: "select",
				selected
			};
		}
		function getSelectionChanges(items, selectedIds = /* @__PURE__ */ new Set(), mutateItem = false) {
			const changes = [];
			for (const [id, item] of items) {
				const willBeSelected = selectedIds.has(id);
				if (!(item.selected === void 0 && !willBeSelected) && item.selected !== willBeSelected) {
					if (mutateItem) item.selected = willBeSelected;
					changes.push(createSelectionChange(item.id, willBeSelected));
				}
			}
			return changes;
		}
		function getElementsDiffChanges({ items = [], lookup }) {
			const changes = [];
			const itemsLookup = new Map(items.map((item) => [item.id, item]));
			for (const [index, item] of items.entries()) {
				const lookupItem = lookup.get(item.id);
				const storeItem = lookupItem?.internals?.userNode ?? lookupItem;
				if (storeItem !== void 0 && storeItem !== item) changes.push({
					id: item.id,
					item,
					type: "replace"
				});
				if (storeItem === void 0) changes.push({
					item,
					type: "add",
					index
				});
			}
			for (const [id] of lookup) if (itemsLookup.get(id) === void 0) changes.push({
				id,
				type: "remove"
			});
			return changes;
		}
		function elementToRemoveChange(item) {
			return {
				id: item.id,
				type: "remove"
			};
		}
		const defaultOnError = createDevWarn("React Flow", "https://reactflow.dev/");
		function addEdge(edgeParams, edges, options = {}) {
			return addEdge$1(edgeParams, edges, {
				...options,
				onError: options.onError ?? defaultOnError
			});
		}
		/**
		* Test whether an object is usable as an [`Node`](/api-reference/types/node).
		* In TypeScript this is a type guard that will narrow the type of whatever you pass in to
		* [`Node`](/api-reference/types/node) if it returns `true`.
		*
		* @public
		* @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Node if it returns true
		* @param element - The element to test.
		* @returns Tests whether the provided value can be used as a `Node`. If you're using TypeScript,
		* this function acts as a type guard and will narrow the type of the value to `Node` if it returns
		* `true`.
		*
		* @example
		* ```js
		*import { isNode } from '@xyflow/react';
		*
		*if (isNode(node)) {
		* // ...
		*}
		*```
		*/
		const isNode = (element) => isNodeBase(element);
		/**
		* Test whether an object is usable as an [`Edge`](/api-reference/types/edge).
		* In TypeScript this is a type guard that will narrow the type of whatever you pass in to
		* [`Edge`](/api-reference/types/edge) if it returns `true`.
		*
		* @public
		* @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Edge if it returns true
		* @param element - The element to test
		* @returns Tests whether the provided value can be used as an `Edge`. If you're using TypeScript,
		* this function acts as a type guard and will narrow the type of the value to `Edge` if it returns
		* `true`.
		*
		* @example
		* ```js
		*import { isEdge } from '@xyflow/react';
		*
		*if (isEdge(edge)) {
		* // ...
		*}
		*```
		*/
		const isEdge = (element) => isEdgeBase(element);
		function fixedForwardRef(render) {
			return (0, react.forwardRef)(render);
		}
		const useIsomorphicLayoutEffect = typeof window !== "undefined" ? react.useLayoutEffect : react.useEffect;
		/**
		* This hook returns a queue that can be used to batch updates.
		*
		* @param runQueue - a function that gets called when the queue is flushed
		* @internal
		*
		* @returns a Queue object
		*/
		function useQueue(runQueue) {
			const [serial, setSerial] = (0, react.useState)(BigInt(0));
			const [queue] = (0, react.useState)(() => createQueue(() => setSerial((n) => n + BigInt(1))));
			useIsomorphicLayoutEffect(() => {
				const queueItems = queue.get();
				if (queueItems.length) {
					runQueue(queueItems);
					queue.reset();
				}
			}, [serial]);
			return queue;
		}
		function createQueue(cb) {
			let queue = [];
			return {
				get: () => queue,
				reset: () => {
					queue = [];
				},
				push: (item) => {
					queue.push(item);
					cb();
				}
			};
		}
		const BatchContext = (0, react.createContext)(null);
		/**
		* This is a context provider that holds and processes the node and edge update queues
		* that are needed to handle setNodes, addNodes, setEdges and addEdges.
		*
		* @internal
		*/
		function BatchProvider({ children }) {
			const store = useStoreApi();
			const nodeQueue = useQueue((0, react.useCallback)((queueItems) => {
				const { nodes = [], setNodes, hasDefaultNodes, onNodesChange, nodeLookup, fitViewQueued, onNodesChangeMiddlewareMap } = store.getState();
				let next = nodes;
				for (const payload of queueItems) next = typeof payload === "function" ? payload(next) : payload;
				let changes = getElementsDiffChanges({
					items: next,
					lookup: nodeLookup
				});
				for (const middleware of onNodesChangeMiddlewareMap.values()) changes = middleware(changes);
				if (hasDefaultNodes) setNodes(next);
				if (changes.length > 0) onNodesChange?.(changes);
				else if (fitViewQueued) window.requestAnimationFrame(() => {
					const { fitViewQueued, nodes, setNodes } = store.getState();
					if (fitViewQueued) setNodes(nodes);
				});
			}, []));
			const edgeQueue = useQueue((0, react.useCallback)((queueItems) => {
				const { edges = [], setEdges, hasDefaultEdges, onEdgesChange, edgeLookup } = store.getState();
				let next = edges;
				for (const payload of queueItems) next = typeof payload === "function" ? payload(next) : payload;
				if (hasDefaultEdges) setEdges(next);
				else if (onEdgesChange) onEdgesChange(getElementsDiffChanges({
					items: next,
					lookup: edgeLookup
				}));
			}, []));
			const value = (0, react.useMemo)(() => ({
				nodeQueue,
				edgeQueue
			}), []);
			return (0, react_jsx_runtime.jsx)(BatchContext.Provider, {
				value,
				children
			});
		}
		function useBatchContext() {
			const batchContext = (0, react.useContext)(BatchContext);
			if (!batchContext) throw new Error("useBatchContext must be used within a BatchProvider");
			return batchContext;
		}
		const selector$j = (s) => !!s.panZoom;
		/**
		* This hook returns a ReactFlowInstance that can be used to update nodes and edges, manipulate the viewport, or query the current state of the flow.
		*
		* @public
		* @example
		* ```jsx
		*import { useCallback, useState } from 'react';
		*import { useReactFlow } from '@xyflow/react';
		*
		*export function NodeCounter() {
		*  const reactFlow = useReactFlow();
		*  const [count, setCount] = useState(0);
		*  const countNodes = useCallback(() => {
		*    setCount(reactFlow.getNodes().length);
		*    // you need to pass it as a dependency if you are using it with useEffect or useCallback
		*    // because at the first render, it's not initialized yet and some functions might not work.
		*  }, [reactFlow]);
		*
		*  return (
		*    <div>
		*      <button onClick={countNodes}>Update count</button>
		*      <p>There are {count} nodes in the flow.</p>
		*    </div>
		*  );
		*}
		*```
		*/
		function useReactFlow() {
			const viewportHelper = useViewportHelper();
			const store = useStoreApi();
			const batchContext = useBatchContext();
			const viewportInitialized = useStore(selector$j);
			const generalHelper = (0, react.useMemo)(() => {
				const getInternalNode = (id) => store.getState().nodeLookup.get(id);
				const setNodes = (payload) => {
					batchContext.nodeQueue.push(payload);
				};
				const setEdges = (payload) => {
					batchContext.edgeQueue.push(payload);
				};
				const getNodeRect = (node) => {
					const { nodeLookup, nodeOrigin } = store.getState();
					const nodeToUse = isNode(node) ? node : nodeLookup.get(node.id);
					const position = nodeToUse.parentId ? evaluateAbsolutePosition(nodeToUse.position, nodeToUse.measured, nodeToUse.parentId, nodeLookup, nodeOrigin) : nodeToUse.position;
					return nodeToRect({
						...nodeToUse,
						position,
						width: nodeToUse.measured?.width ?? nodeToUse.width,
						height: nodeToUse.measured?.height ?? nodeToUse.height
					});
				};
				const updateNode = (id, nodeUpdate, options = { replace: false }) => {
					setNodes((prevNodes) => prevNodes.map((node) => {
						if (node.id === id) {
							const nextNode = typeof nodeUpdate === "function" ? nodeUpdate(node) : nodeUpdate;
							return options.replace && isNode(nextNode) ? nextNode : {
								...node,
								...nextNode
							};
						}
						return node;
					}));
				};
				const updateEdge = (id, edgeUpdate, options = { replace: false }) => {
					setEdges((prevEdges) => prevEdges.map((edge) => {
						if (edge.id === id) {
							const nextEdge = typeof edgeUpdate === "function" ? edgeUpdate(edge) : edgeUpdate;
							return options.replace && isEdge(nextEdge) ? nextEdge : {
								...edge,
								...nextEdge
							};
						}
						return edge;
					}));
				};
				return {
					getNodes: () => store.getState().nodes.map((n) => ({ ...n })),
					getNode: (id) => getInternalNode(id)?.internals.userNode,
					getInternalNode,
					getEdges: () => {
						const { edges = [] } = store.getState();
						return edges.map((e) => ({ ...e }));
					},
					getEdge: (id) => store.getState().edgeLookup.get(id),
					setNodes,
					setEdges,
					addNodes: (payload) => {
						const newNodes = Array.isArray(payload) ? payload : [payload];
						batchContext.nodeQueue.push((nodes) => [...nodes, ...newNodes]);
					},
					addEdges: (payload) => {
						const newEdges = Array.isArray(payload) ? payload : [payload];
						batchContext.edgeQueue.push((edges) => [...edges, ...newEdges]);
					},
					toObject: () => {
						const { nodes = [], edges = [], transform } = store.getState();
						const [x, y, zoom] = transform;
						return {
							nodes: nodes.map((n) => ({ ...n })),
							edges: edges.map((e) => ({ ...e })),
							viewport: {
								x,
								y,
								zoom
							}
						};
					},
					deleteElements: async ({ nodes: nodesToRemove = [], edges: edgesToRemove = [] }) => {
						const { nodes, edges, onNodesDelete, onEdgesDelete, triggerNodeChanges, triggerEdgeChanges, onDelete, onBeforeDelete } = store.getState();
						const { nodes: matchingNodes, edges: matchingEdges } = await getElementsToRemove({
							nodesToRemove,
							edgesToRemove,
							nodes,
							edges,
							onBeforeDelete
						});
						const hasMatchingEdges = matchingEdges.length > 0;
						const hasMatchingNodes = matchingNodes.length > 0;
						if (hasMatchingEdges) {
							const edgeChanges = matchingEdges.map(elementToRemoveChange);
							onEdgesDelete?.(matchingEdges);
							triggerEdgeChanges(edgeChanges);
						}
						if (hasMatchingNodes) {
							const nodeChanges = matchingNodes.map(elementToRemoveChange);
							onNodesDelete?.(matchingNodes);
							triggerNodeChanges(nodeChanges);
						}
						if (hasMatchingNodes || hasMatchingEdges) onDelete?.({
							nodes: matchingNodes,
							edges: matchingEdges
						});
						return {
							deletedNodes: matchingNodes,
							deletedEdges: matchingEdges
						};
					},
					/**
					* Partial is defined as "the 2 nodes/areas are intersecting partially".
					* If a is contained in b or b is contained in a, they are both
					* considered fully intersecting.
					*/
					getIntersectingNodes: (nodeOrRect, partially = true, nodes) => {
						const isRect = isRectObject(nodeOrRect);
						const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
						const hasNodesOption = nodes !== void 0;
						if (!nodeRect) return [];
						return (nodes || store.getState().nodes).filter((n) => {
							const internalNode = store.getState().nodeLookup.get(n.id);
							if (internalNode && !isRect && (n.id === nodeOrRect.id || !internalNode.internals.positionAbsolute)) return false;
							const currNodeRect = nodeToRect(hasNodesOption ? n : internalNode);
							const overlappingArea = getOverlappingArea(currNodeRect, nodeRect);
							return partially && overlappingArea > 0 || overlappingArea >= currNodeRect.width * currNodeRect.height || overlappingArea >= nodeRect.width * nodeRect.height;
						});
					},
					isNodeIntersecting: (nodeOrRect, area, partially = true) => {
						const nodeRect = isRectObject(nodeOrRect) ? nodeOrRect : getNodeRect(nodeOrRect);
						if (!nodeRect) return false;
						const overlappingArea = getOverlappingArea(nodeRect, area);
						return partially && overlappingArea > 0 || overlappingArea >= area.width * area.height || overlappingArea >= nodeRect.width * nodeRect.height;
					},
					updateNode,
					updateNodeData: (id, dataUpdate, options = { replace: false }) => {
						updateNode(id, (node) => {
							const nextData = typeof dataUpdate === "function" ? dataUpdate(node) : dataUpdate;
							return options.replace ? {
								...node,
								data: nextData
							} : {
								...node,
								data: {
									...node.data,
									...nextData
								}
							};
						}, options);
					},
					updateEdge,
					updateEdgeData: (id, dataUpdate, options = { replace: false }) => {
						updateEdge(id, (edge) => {
							const nextData = typeof dataUpdate === "function" ? dataUpdate(edge) : dataUpdate;
							return options.replace ? {
								...edge,
								data: nextData
							} : {
								...edge,
								data: {
									...edge.data,
									...nextData
								}
							};
						}, options);
					},
					getNodesBounds: (nodes) => {
						const { nodeLookup, nodeOrigin } = store.getState();
						return getNodesBounds(nodes, {
							nodeLookup,
							nodeOrigin
						});
					},
					getHandleConnections: ({ type, id, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}-${type}${id ? `-${id}` : ""}`)?.values() ?? []),
					getNodeConnections: ({ type, handleId, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}${type ? handleId ? `-${type}-${handleId}` : `-${type}` : ""}`)?.values() ?? []),
					fitView: async (options) => {
						const fitViewResolver = store.getState().fitViewResolver ?? withResolvers();
						store.setState({
							fitViewQueued: true,
							fitViewOptions: options,
							fitViewResolver
						});
						batchContext.nodeQueue.push((nodes) => [...nodes]);
						return fitViewResolver.promise;
					}
				};
			}, []);
			return (0, react.useMemo)(() => {
				return {
					...generalHelper,
					...viewportHelper,
					viewportInitialized
				};
			}, [viewportInitialized]);
		}
		const selected = (item) => item.selected;
		const win$1 = typeof window !== "undefined" ? window : void 0;
		/**
		* Hook for handling global key events.
		*
		* @internal
		*/
		function useGlobalKeyHandler({ deleteKeyCode, multiSelectionKeyCode }) {
			const store = useStoreApi();
			const { deleteElements } = useReactFlow();
			const deleteKeyPressed = useKeyPress(deleteKeyCode, { actInsideInputWithModifier: false });
			const multiSelectionKeyPressed = useKeyPress(multiSelectionKeyCode, { target: win$1 });
			(0, react.useEffect)(() => {
				if (deleteKeyPressed) {
					const { edges, nodes } = store.getState();
					deleteElements({
						nodes: nodes.filter(selected),
						edges: edges.filter(selected)
					});
					store.setState({ nodesSelectionActive: false });
				}
			}, [deleteKeyPressed]);
			(0, react.useEffect)(() => {
				store.setState({ multiSelectionActive: multiSelectionKeyPressed });
			}, [multiSelectionKeyPressed]);
		}
		/**
		* Hook for handling resize events.
		*
		* @internal
		*/
		function useResizeHandler(domNode) {
			const store = useStoreApi();
			(0, react.useEffect)(() => {
				const updateDimensions = () => {
					if (!domNode.current || !(domNode.current.checkVisibility?.() ?? true)) return false;
					const size = getDimensions(domNode.current);
					if (size.height === 0 || size.width === 0) store.getState().onError?.("004", errorMessages["error004"]());
					store.setState({
						width: size.width || 500,
						height: size.height || 500
					});
				};
				if (domNode.current) {
					updateDimensions();
					window.addEventListener("resize", updateDimensions);
					const resizeObserver = new ResizeObserver(() => updateDimensions());
					resizeObserver.observe(domNode.current);
					return () => {
						window.removeEventListener("resize", updateDimensions);
						if (resizeObserver && domNode.current) resizeObserver.unobserve(domNode.current);
					};
				}
			}, []);
		}
		const containerStyle = {
			position: "absolute",
			width: "100%",
			height: "100%",
			top: 0,
			left: 0
		};
		const selector$i = (s) => ({
			userSelectionActive: s.userSelectionActive,
			lib: s.lib,
			connectionInProgress: s.connection.inProgress
		});
		function ZoomPane({ onPaneContextMenu, zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panActivationKeyPressed, panOnScrollSpeed = .5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, defaultViewport, translateExtent, minZoom, maxZoom, zoomActivationKeyCode, preventScrolling = true, children, noWheelClassName, noPanClassName, onViewportChange, isControlledViewport, paneClickDistance, selectionOnDrag }) {
			const store = useStoreApi();
			const zoomPane = (0, react.useRef)(null);
			const { userSelectionActive, lib, connectionInProgress } = useStore(selector$i, shallow$1);
			const zoomActivationKeyPressed = useKeyPress(zoomActivationKeyCode);
			const panZoom = (0, react.useRef)();
			useResizeHandler(zoomPane);
			const onTransformChange = (0, react.useCallback)((transform) => {
				onViewportChange?.({
					x: transform[0],
					y: transform[1],
					zoom: transform[2]
				});
				if (!isControlledViewport) store.setState({ transform });
			}, [onViewportChange, isControlledViewport]);
			(0, react.useEffect)(() => {
				if (zoomPane.current) {
					panZoom.current = XYPanZoom({
						domNode: zoomPane.current,
						minZoom,
						maxZoom,
						translateExtent,
						viewport: defaultViewport,
						onDraggingChange: (paneDragging) => store.setState((prevState) => prevState.paneDragging === paneDragging ? prevState : { paneDragging }),
						onPanZoomStart: (event, vp) => {
							const { onViewportChangeStart, onMoveStart } = store.getState();
							onMoveStart?.(event, vp);
							onViewportChangeStart?.(vp);
						},
						onPanZoom: (event, vp) => {
							const { onViewportChange, onMove } = store.getState();
							onMove?.(event, vp);
							onViewportChange?.(vp);
						},
						onPanZoomEnd: (event, vp) => {
							const { onViewportChangeEnd, onMoveEnd } = store.getState();
							onMoveEnd?.(event, vp);
							onViewportChangeEnd?.(vp);
						}
					});
					const { x, y, zoom } = panZoom.current.getViewport();
					store.setState({
						panZoom: panZoom.current,
						transform: [
							x,
							y,
							zoom
						],
						domNode: zoomPane.current.closest(".react-flow")
					});
					return () => {
						panZoom.current?.destroy();
					};
				}
			}, []);
			(0, react.useEffect)(() => {
				panZoom.current?.update({
					onPaneContextMenu,
					zoomOnScroll,
					zoomOnPinch,
					panOnScroll,
					panActivationKeyPressed,
					panOnScrollSpeed,
					panOnScrollMode,
					zoomOnDoubleClick,
					panOnDrag,
					zoomActivationKeyPressed,
					preventScrolling,
					noPanClassName,
					userSelectionActive,
					noWheelClassName,
					lib,
					onTransformChange,
					connectionInProgress,
					selectionOnDrag,
					paneClickDistance
				});
			}, [
				onPaneContextMenu,
				zoomOnScroll,
				zoomOnPinch,
				panOnScroll,
				panActivationKeyPressed,
				panOnScrollSpeed,
				panOnScrollMode,
				zoomOnDoubleClick,
				panOnDrag,
				zoomActivationKeyPressed,
				preventScrolling,
				noPanClassName,
				userSelectionActive,
				noWheelClassName,
				lib,
				onTransformChange,
				connectionInProgress,
				selectionOnDrag,
				paneClickDistance
			]);
			return (0, react_jsx_runtime.jsx)("div", {
				className: "react-flow__renderer",
				ref: zoomPane,
				style: containerStyle,
				children
			});
		}
		const selector$h = (s) => ({
			userSelectionActive: s.userSelectionActive,
			userSelectionRect: s.userSelectionRect
		});
		function UserSelection() {
			const { userSelectionActive, userSelectionRect } = useStore(selector$h, shallow$1);
			if (!(userSelectionActive && userSelectionRect)) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: "react-flow__selection react-flow__container",
				style: {
					width: userSelectionRect.width,
					height: userSelectionRect.height,
					transform: `translate(${userSelectionRect.x}px, ${userSelectionRect.y}px)`
				}
			});
		}
		const wrapHandler = (handler, containerRef) => {
			return (event) => {
				if (event.target !== containerRef.current) return;
				handler?.(event);
			};
		};
		const selector$g = (s) => ({
			userSelectionActive: s.userSelectionActive,
			elementsSelectable: s.elementsSelectable,
			dragging: s.paneDragging,
			panBy: s.panBy,
			autoPanSpeed: s.autoPanSpeed
		});
		function Pane({ isSelecting, selectionKeyPressed, selectionMode = SelectionMode.Full, panOnDrag, autoPanOnSelection, paneClickDistance, selectionOnDrag, onSelectionStart, onSelectionEnd, onPaneClick, onPaneContextMenu, onPaneScroll, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, children }) {
			const autoPanId = (0, react.useRef)(0);
			const store = useStoreApi();
			const { userSelectionActive, elementsSelectable, dragging, panBy, autoPanSpeed } = useStore(selector$g, shallow$1);
			const isSelectionEnabled = elementsSelectable && (isSelecting || userSelectionActive);
			const container = (0, react.useRef)(null);
			const containerBounds = (0, react.useRef)();
			const selectedNodeIds = (0, react.useRef)(/* @__PURE__ */ new Set());
			const selectedEdgeIds = (0, react.useRef)(/* @__PURE__ */ new Set());
			const connectionEndedOnPane = (0, react.useRef)(false);
			const selectionInProgress = (0, react.useRef)(false);
			const position = (0, react.useRef)({
				x: 0,
				y: 0
			});
			const autoPanStarted = (0, react.useRef)(false);
			const onClick = (event) => {
				if (selectionInProgress.current || connectionEndedOnPane.current || store.getState().connection.inProgress) {
					selectionInProgress.current = false;
					connectionEndedOnPane.current = false;
					return;
				}
				onPaneClick?.(event);
				store.getState().resetSelectedElements();
				store.setState({ nodesSelectionActive: false });
			};
			const onContextMenu = (event) => {
				if (Array.isArray(panOnDrag) && panOnDrag?.includes(2)) {
					event.preventDefault();
					return;
				}
				onPaneContextMenu?.(event);
			};
			const onWheel = onPaneScroll ? (event) => onPaneScroll(event) : void 0;
			const onClickCapture = (event) => {
				if (selectionInProgress.current) {
					event.stopPropagation();
					selectionInProgress.current = false;
				}
			};
			const onPointerDownCapture = (event) => {
				if (event.pointerType === "touch" && panOnDrag !== false && !selectionKeyPressed) return;
				const { domNode, transform } = store.getState();
				containerBounds.current = domNode?.getBoundingClientRect();
				if (!containerBounds.current) return;
				const eventTargetIsContainer = event.target === container.current;
				if (!eventTargetIsContainer && !!event.target.closest(".nokey") || !isSelecting || !(selectionOnDrag && eventTargetIsContainer || selectionKeyPressed) || event.button !== 0 || !event.isPrimary) return;
				event.target?.setPointerCapture?.(event.pointerId);
				selectionInProgress.current = false;
				const { x, y } = getEventPosition(event.nativeEvent, containerBounds.current);
				const userSelectionStartPosition = pointToRendererPoint({
					x,
					y
				}, transform);
				store.setState({ userSelectionRect: {
					width: 0,
					height: 0,
					startX: userSelectionStartPosition.x,
					startY: userSelectionStartPosition.y,
					x,
					y
				} });
				if (!eventTargetIsContainer) {
					event.stopPropagation();
					event.preventDefault();
				}
			};
			function commitUserSelectionRect(mouseX, mouseY) {
				const { userSelectionRect } = store.getState();
				if (!userSelectionRect) return;
				const { transform, nodeLookup, edgeLookup, connectionLookup, triggerNodeChanges, triggerEdgeChanges, defaultEdgeOptions } = store.getState();
				const userStartPosition = {
					x: userSelectionRect.startX,
					y: userSelectionRect.startY
				};
				const { x: screenStartX, y: screenStartY } = rendererPointToPoint(userStartPosition, transform);
				const nextUserSelectRect = {
					startX: userStartPosition.x,
					startY: userStartPosition.y,
					x: mouseX < screenStartX ? mouseX : screenStartX,
					y: mouseY < screenStartY ? mouseY : screenStartY,
					width: Math.abs(mouseX - screenStartX),
					height: Math.abs(mouseY - screenStartY)
				};
				const prevSelectedNodeIds = selectedNodeIds.current;
				const prevSelectedEdgeIds = selectedEdgeIds.current;
				selectedNodeIds.current = new Set(getNodesInside(nodeLookup, nextUserSelectRect, transform, selectionMode === SelectionMode.Partial, true).map((node) => node.id));
				selectedEdgeIds.current = /* @__PURE__ */ new Set();
				const edgesSelectable = defaultEdgeOptions?.selectable ?? true;
				for (const nodeId of selectedNodeIds.current) {
					const connections = connectionLookup.get(nodeId);
					if (!connections) continue;
					for (const { edgeId } of connections.values()) {
						const edge = edgeLookup.get(edgeId);
						if (edge && (edge.selectable ?? edgesSelectable)) selectedEdgeIds.current.add(edgeId);
					}
				}
				if (!areSetsEqual(prevSelectedNodeIds, selectedNodeIds.current)) triggerNodeChanges(getSelectionChanges(nodeLookup, selectedNodeIds.current, true));
				if (!areSetsEqual(prevSelectedEdgeIds, selectedEdgeIds.current)) triggerEdgeChanges(getSelectionChanges(edgeLookup, selectedEdgeIds.current));
				store.setState({
					userSelectionRect: nextUserSelectRect,
					userSelectionActive: true,
					nodesSelectionActive: false
				});
			}
			function autoPan() {
				if (!autoPanOnSelection || !containerBounds.current) return;
				const [x, y] = calcAutoPan(position.current, containerBounds.current, autoPanSpeed);
				panBy({
					x,
					y
				}).then((panned) => {
					if (!selectionInProgress.current || !panned) {
						autoPanId.current = requestAnimationFrame(autoPan);
						return;
					}
					const { x: mx, y: my } = position.current;
					commitUserSelectionRect(mx, my);
					autoPanId.current = requestAnimationFrame(autoPan);
				});
			}
			const cleanupAutoPan = () => {
				cancelAnimationFrame(autoPanId.current);
				autoPanId.current = 0;
				autoPanStarted.current = false;
			};
			(0, react.useEffect)(() => {
				return () => cleanupAutoPan();
			}, []);
			const onPointerMove = (event) => {
				const { userSelectionRect, transform, resetSelectedElements } = store.getState();
				if (!containerBounds.current || !userSelectionRect) return;
				const { x: mouseX, y: mouseY } = getEventPosition(event.nativeEvent, containerBounds.current);
				position.current = {
					x: mouseX,
					y: mouseY
				};
				const screenStart = rendererPointToPoint({
					x: userSelectionRect.startX,
					y: userSelectionRect.startY
				}, transform);
				if (!selectionInProgress.current) {
					const requiredDistance = selectionKeyPressed ? 0 : paneClickDistance;
					if (Math.hypot(mouseX - screenStart.x, mouseY - screenStart.y) <= requiredDistance) return;
					resetSelectedElements();
					onSelectionStart?.(event);
				}
				selectionInProgress.current = true;
				if (!autoPanStarted.current) {
					autoPan();
					autoPanStarted.current = true;
				}
				commitUserSelectionRect(mouseX, mouseY);
			};
			const onPointerUp = (event) => {
				if (!isSelectionEnabled) {
					if (event.target === container.current && store.getState().connection.inProgress) connectionEndedOnPane.current = true;
					return;
				}
				if (event.button !== 0) return;
				event.target?.releasePointerCapture?.(event.pointerId);
				if (!userSelectionActive && event.target === container.current && store.getState().userSelectionRect) onClick?.(event);
				store.setState({
					userSelectionActive: false,
					userSelectionRect: null
				});
				if (selectionInProgress.current) {
					onSelectionEnd?.(event);
					store.setState({ nodesSelectionActive: selectedNodeIds.current.size > 0 });
				}
				cleanupAutoPan();
			};
			const onPointerCancel = (event) => {
				event.target?.releasePointerCapture?.(event.pointerId);
				cleanupAutoPan();
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: cc(["react-flow__pane", {
					draggable: panOnDrag === true || Array.isArray(panOnDrag) && panOnDrag.includes(0),
					dragging,
					selection: isSelecting
				}]),
				onClick: isSelectionEnabled ? void 0 : wrapHandler(onClick, container),
				onContextMenu: wrapHandler(onContextMenu, container),
				onWheel: wrapHandler(onWheel, container),
				onPointerEnter: isSelectionEnabled ? void 0 : onPaneMouseEnter,
				onPointerMove: isSelectionEnabled ? onPointerMove : onPaneMouseMove,
				onPointerUp,
				onPointerCancel: isSelectionEnabled ? onPointerCancel : void 0,
				onPointerDownCapture: isSelectionEnabled ? onPointerDownCapture : void 0,
				onClickCapture: isSelectionEnabled ? onClickCapture : void 0,
				onPointerLeave: onPaneMouseLeave,
				ref: container,
				style: containerStyle,
				children: [children, (0, react_jsx_runtime.jsx)(UserSelection, {})]
			});
		}
		function handleNodeClick({ id, store, unselect = false, nodeRef }) {
			const { addSelectedNodes, unselectNodesAndEdges, multiSelectionActive, nodeLookup, onError } = store.getState();
			const node = nodeLookup.get(id);
			if (!node) {
				onError?.("012", errorMessages["error012"](id));
				return;
			}
			store.setState({ nodesSelectionActive: false });
			if (!node.selected) addSelectedNodes([id]);
			else if (unselect || node.selected && multiSelectionActive) {
				unselectNodesAndEdges({
					nodes: [node],
					edges: []
				});
				requestAnimationFrame(() => nodeRef?.current?.blur());
			}
		}
		/**
		* Hook for calling XYDrag helper from @xyflow/system.
		*
		* @internal
		*/
		function useDrag({ nodeRef, disabled = false, noDragClassName, handleSelector, nodeId, isSelectable, nodeClickDistance }) {
			const store = useStoreApi();
			const [dragging, setDragging] = (0, react.useState)(false);
			const xyDrag = (0, react.useRef)();
			(0, react.useEffect)(() => {
				if (disabled) return;
				xyDrag.current = XYDrag({
					getStoreItems: () => store.getState(),
					onNodeMouseDown: (id) => {
						handleNodeClick({
							id,
							store,
							nodeRef
						});
					},
					onDragStart: () => {
						setDragging(true);
					},
					onDragStop: () => {
						setDragging(false);
					}
				});
				return () => {
					xyDrag.current?.destroy();
					xyDrag.current = void 0;
				};
			}, [
				disabled,
				store,
				nodeRef
			]);
			(0, react.useEffect)(() => {
				if (disabled || !nodeRef.current || !xyDrag.current) return;
				xyDrag.current.update({
					noDragClassName,
					handleSelector,
					domNode: nodeRef.current,
					isSelectable,
					nodeId,
					nodeClickDistance
				});
			}, [
				noDragClassName,
				handleSelector,
				disabled,
				isSelectable,
				nodeRef,
				nodeId,
				nodeClickDistance
			]);
			return dragging;
		}
		const selectedAndDraggable = (nodesDraggable) => (n) => n.selected && (n.draggable || nodesDraggable && typeof n.draggable === "undefined");
		/**
		* Hook for updating node positions by passing a direction and factor
		*
		* @internal
		* @returns function for updating node positions
		*/
		function useMoveSelectedNodes() {
			const store = useStoreApi();
			return (0, react.useCallback)((params) => {
				const { nodeExtent, snapToGrid, snapGrid, nodesDraggable, onError, updateNodePositions, nodeLookup, nodeOrigin } = store.getState();
				const nodeUpdates = /* @__PURE__ */ new Map();
				const isSelected = selectedAndDraggable(nodesDraggable);
				const xVelo = snapToGrid ? snapGrid[0] : 5;
				const yVelo = snapToGrid ? snapGrid[1] : 5;
				const xDiff = params.direction.x * xVelo * params.factor;
				const yDiff = params.direction.y * yVelo * params.factor;
				for (const [, node] of nodeLookup) {
					if (!isSelected(node)) continue;
					let nextPosition = {
						x: node.internals.positionAbsolute.x + xDiff,
						y: node.internals.positionAbsolute.y + yDiff
					};
					if (snapToGrid) nextPosition = snapPosition(nextPosition, snapGrid);
					const { position, positionAbsolute } = calculateNodePosition({
						nodeId: node.id,
						nextPosition,
						nodeLookup,
						nodeExtent,
						nodeOrigin,
						onError
					});
					node.position = position;
					node.internals.positionAbsolute = positionAbsolute;
					nodeUpdates.set(node.id, node);
				}
				updateNodePositions(nodeUpdates);
			}, []);
		}
		const NodeIdContext = (0, react.createContext)(null);
		const Provider = NodeIdContext.Provider;
		NodeIdContext.Consumer;
		/**
		* You can use this hook to get the id of the node it is used inside. It is useful
		* if you need the node's id deeper in the render tree but don't want to manually
		* drill down the id as a prop.
		*
		* @public
		* @returns The id for a node in the flow.
		*
		* @example
		*```jsx
		*import { useNodeId } from '@xyflow/react';
		*
		*export default function CustomNode() {
		*  return (
		*    <div>
		*      <span>This node has an id of </span>
		*      <NodeIdDisplay />
		*    </div>
		*  );
		*}
		*
		*function NodeIdDisplay() {
		*  const nodeId = useNodeId();
		*
		*  return <span>{nodeId}</span>;
		*}
		*```
		*/
		const useNodeId = () => {
			return (0, react.useContext)(NodeIdContext);
		};
		const selector$f = (s) => ({
			connectOnClick: s.connectOnClick,
			noPanClassName: s.noPanClassName,
			rfId: s.rfId
		});
		const HandleConfigContext = (0, react.createContext)(null);
		function HandleConfigProvider({ children }) {
			const config = useStore(selector$f, shallow$1);
			return (0, react_jsx_runtime.jsx)(HandleConfigContext.Provider, {
				value: config,
				children
			});
		}
		function useHandleConfig() {
			const config = (0, react.useContext)(HandleConfigContext);
			if (!config) throw new Error("useHandleConfig must be used within a HandleConfigProvider");
			return config;
		}
		const idleConnectingState = {
			connectingFrom: false,
			connectingTo: false,
			clickConnecting: false,
			isPossibleEndHandle: true,
			connectionInProcess: false,
			clickConnectionInProcess: false,
			valid: false
		};
		const connectingSelector = (nodeId, handleId, type) => (state) => {
			const { connectionClickStartHandle: clickHandle, connectionMode, connection } = state;
			const { fromHandle, toHandle, isValid } = connection;
			if (!fromHandle && !clickHandle) return idleConnectingState;
			const connectingTo = toHandle?.nodeId === nodeId && toHandle?.id === handleId && toHandle?.type === type;
			return {
				connectingFrom: fromHandle?.nodeId === nodeId && fromHandle?.id === handleId && fromHandle?.type === type,
				connectingTo,
				clickConnecting: clickHandle?.nodeId === nodeId && clickHandle?.id === handleId && clickHandle?.type === type,
				isPossibleEndHandle: connectionMode === ConnectionMode.Strict ? fromHandle?.type !== type : nodeId !== fromHandle?.nodeId || handleId !== fromHandle?.id,
				connectionInProcess: !!fromHandle,
				clickConnectionInProcess: !!clickHandle,
				valid: connectingTo && isValid
			};
		};
		function HandleComponent({ type = "source", position = Position.Top, isValidConnection, isConnectable = true, isConnectableStart = true, isConnectableEnd = true, id, onConnect, children, className, onMouseDown, onTouchStart, ...rest }, ref) {
			const handleId = id || null;
			const isTarget = type === "target";
			const store = useStoreApi();
			const nodeId = useNodeId();
			const { connectOnClick, noPanClassName, rfId } = useHandleConfig();
			const { connectingFrom, connectingTo, clickConnecting, isPossibleEndHandle, connectionInProcess, clickConnectionInProcess, valid } = useStore(connectingSelector(nodeId, handleId, type), shallow$1);
			if (!nodeId) store.getState().onError?.("010", errorMessages["error010"]());
			const onConnectExtended = (params) => {
				const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = store.getState();
				const edgeParams = {
					...defaultEdgeOptions,
					...params
				};
				if (hasDefaultEdges) {
					const { edges, setEdges, onError } = store.getState();
					setEdges(addEdge(edgeParams, edges, { onError }));
				}
				onConnectAction?.(edgeParams);
				onConnect?.(edgeParams);
			};
			const onPointerDown = (event) => {
				if (!nodeId) return;
				const isMouseTriggered = isMouseEvent(event.nativeEvent);
				if (isConnectableStart && (isMouseTriggered && event.button === 0 || !isMouseTriggered)) {
					const currentStore = store.getState();
					XYHandle.onPointerDown(event.nativeEvent, {
						handleDomNode: event.currentTarget,
						autoPanOnConnect: currentStore.autoPanOnConnect,
						connectionMode: currentStore.connectionMode,
						connectionRadius: currentStore.connectionRadius,
						domNode: currentStore.domNode,
						nodeLookup: currentStore.nodeLookup,
						lib: currentStore.lib,
						isTarget,
						handleId,
						nodeId,
						flowId: currentStore.rfId,
						panBy: currentStore.panBy,
						cancelConnection: currentStore.cancelConnection,
						onConnectStart: currentStore.onConnectStart,
						onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
						updateConnection: currentStore.updateConnection,
						onConnect: onConnectExtended,
						isValidConnection: isValidConnection || ((...args) => store.getState().isValidConnection?.(...args) ?? true),
						getTransform: () => store.getState().transform,
						getFromHandle: () => store.getState().connection.fromHandle,
						autoPanSpeed: currentStore.autoPanSpeed,
						dragThreshold: currentStore.connectionDragThreshold
					});
				}
				if (isMouseTriggered) onMouseDown?.(event);
				else onTouchStart?.(event);
			};
			const onClick = (event) => {
				const { onClickConnectStart, onClickConnectEnd, connectionClickStartHandle, connectionMode, isValidConnection: isValidConnectionStore, lib, rfId: flowId, nodeLookup, connection: connectionState } = store.getState();
				if (!nodeId || !connectionClickStartHandle && !isConnectableStart) return;
				if (!connectionClickStartHandle) {
					onClickConnectStart?.(event.nativeEvent, {
						nodeId,
						handleId,
						handleType: type
					});
					store.setState({ connectionClickStartHandle: {
						nodeId,
						type,
						id: handleId
					} });
					return;
				}
				const doc = getHostForElement(event.target);
				const isValidConnectionHandler = isValidConnection || isValidConnectionStore;
				const { connection, isValid } = XYHandle.isValid(event.nativeEvent, {
					handle: {
						nodeId,
						id: handleId,
						type
					},
					connectionMode,
					fromNodeId: connectionClickStartHandle.nodeId,
					fromHandleId: connectionClickStartHandle.id || null,
					fromType: connectionClickStartHandle.type,
					isValidConnection: isValidConnectionHandler,
					flowId,
					doc,
					lib,
					nodeLookup
				});
				if (isValid && connection) onConnectExtended(connection);
				const connectionClone = structuredClone(connectionState);
				delete connectionClone.inProgress;
				connectionClone.toPosition = connectionClone.toHandle ? connectionClone.toHandle.position : null;
				onClickConnectEnd?.(event, connectionClone);
				store.setState({ connectionClickStartHandle: null });
			};
			return (0, react_jsx_runtime.jsx)("div", {
				"data-handleid": handleId,
				"data-nodeid": nodeId,
				"data-handlepos": position,
				"data-id": `${rfId}-${nodeId}-${handleId}-${type}`,
				className: cc([
					"react-flow__handle",
					`react-flow__handle-${position}`,
					"nodrag",
					noPanClassName,
					className,
					{
						source: !isTarget,
						target: isTarget,
						connectable: isConnectable,
						connectablestart: isConnectableStart,
						connectableend: isConnectableEnd,
						clickconnecting: clickConnecting,
						connectingfrom: connectingFrom,
						connectingto: connectingTo,
						valid,
						connectionindicator: isConnectable && (!connectionInProcess || isPossibleEndHandle) && (connectionInProcess || clickConnectionInProcess ? isConnectableEnd : isConnectableStart)
					}
				]),
				onMouseDown: onPointerDown,
				onTouchStart: onPointerDown,
				onClick: connectOnClick ? onClick : void 0,
				ref,
				...rest,
				children
			});
		}
		/**
		* The `<Handle />` component is used in your [custom nodes](/learn/customization/custom-nodes)
		* to define connection points.
		*
		*@public
		*
		*@example
		*
		*```jsx
		*import { Handle, Position } from '@xyflow/react';
		*
		*export function CustomNode({ data }) {
		*  return (
		*    <>
		*      <div style={{ padding: '10px 20px' }}>
		*        {data.label}
		*      </div>
		*
		*      <Handle type="target" position={Position.Left} />
		*      <Handle type="source" position={Position.Right} />
		*    </>
		*  );
		*};
		*```
		*/
		const Handle = (0, react.memo)(fixedForwardRef(HandleComponent));
		function InputNode({ data, isConnectable, sourcePosition = Position.Bottom }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [data?.label, (0, react_jsx_runtime.jsx)(Handle, {
				type: "source",
				position: sourcePosition,
				isConnectable
			})] });
		}
		function DefaultNode({ data, isConnectable, targetPosition = Position.Top, sourcePosition = Position.Bottom }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)(Handle, {
					type: "target",
					position: targetPosition,
					isConnectable
				}),
				data?.label,
				(0, react_jsx_runtime.jsx)(Handle, {
					type: "source",
					position: sourcePosition,
					isConnectable
				})
			] });
		}
		function GroupNode() {
			return null;
		}
		function OutputNode({ data, isConnectable, targetPosition = Position.Top }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(Handle, {
				type: "target",
				position: targetPosition,
				isConnectable
			}), data?.label] });
		}
		const arrowKeyDiffs = {
			ArrowUp: {
				x: 0,
				y: -1
			},
			ArrowDown: {
				x: 0,
				y: 1
			},
			ArrowLeft: {
				x: -1,
				y: 0
			},
			ArrowRight: {
				x: 1,
				y: 0
			}
		};
		const builtinNodeTypes = {
			input: InputNode,
			default: DefaultNode,
			output: OutputNode,
			group: GroupNode
		};
		function getNodeInlineStyleDimensions(node) {
			if (node.internals.handleBounds === void 0) return {
				width: node.width ?? node.initialWidth ?? node.style?.width,
				height: node.height ?? node.initialHeight ?? node.style?.height
			};
			return {
				width: node.width ?? node.style?.width,
				height: node.height ?? node.style?.height
			};
		}
		const selector$e = (s) => {
			const { width, height, x, y } = getInternalNodesBounds(s.nodeLookup, { filter: (node) => !!node.selected });
			return {
				width: isNumeric(width) ? width : null,
				height: isNumeric(height) ? height : null,
				userSelectionActive: s.userSelectionActive,
				transformString: `translate(${s.transform[0]}px,${s.transform[1]}px) scale(${s.transform[2]}) translate(${x}px,${y}px)`
			};
		};
		function NodesSelection({ onSelectionContextMenu, noPanClassName, disableKeyboardA11y }) {
			const store = useStoreApi();
			const { width, height, transformString, userSelectionActive } = useStore(selector$e, shallow$1);
			const moveSelectedNodes = useMoveSelectedNodes();
			const nodeRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!disableKeyboardA11y) nodeRef.current?.focus({ preventScroll: true });
			}, [disableKeyboardA11y]);
			const shouldRender = !userSelectionActive && width !== null && height !== null;
			useDrag({
				nodeRef,
				disabled: !shouldRender
			});
			if (!shouldRender) return null;
			const onContextMenu = onSelectionContextMenu ? (event) => {
				onSelectionContextMenu(event, store.getState().nodes.filter((n) => n.selected));
			} : void 0;
			const onKeyDown = (event) => {
				if (Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
					event.preventDefault();
					moveSelectedNodes({
						direction: arrowKeyDiffs[event.key],
						factor: event.shiftKey ? 4 : 1
					});
				}
			};
			return (0, react_jsx_runtime.jsx)("div", {
				className: cc([
					"react-flow__nodesselection",
					"react-flow__container",
					noPanClassName
				]),
				style: { transform: transformString },
				children: (0, react_jsx_runtime.jsx)("div", {
					ref: nodeRef,
					className: "react-flow__nodesselection-rect",
					onContextMenu,
					tabIndex: disableKeyboardA11y ? void 0 : -1,
					onKeyDown: disableKeyboardA11y ? void 0 : onKeyDown,
					style: {
						width,
						height
					}
				})
			});
		}
		const win = typeof window !== "undefined" ? window : void 0;
		const selector$d = (s) => {
			return {
				nodesSelectionActive: s.nodesSelectionActive,
				userSelectionActive: s.userSelectionActive
			};
		};
		function FlowRendererComponent({ children, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, paneClickDistance, deleteKeyCode, selectionKeyCode, selectionOnDrag, selectionMode, onSelectionStart, onSelectionEnd, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, elementsSelectable, zoomOnScroll, zoomOnPinch, panOnScroll: _panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag: _panOnDrag, autoPanOnSelection, defaultViewport, translateExtent, minZoom, maxZoom, preventScrolling, onSelectionContextMenu, noWheelClassName, noPanClassName, disableKeyboardA11y, onViewportChange, isControlledViewport }) {
			const { nodesSelectionActive, userSelectionActive } = useStore(selector$d, shallow$1);
			const selectionKeyPressed = useKeyPress(selectionKeyCode, { target: win });
			const panActivationKeyPressed = useKeyPress(panActivationKeyCode, { target: win });
			const panOnDrag = panActivationKeyPressed || _panOnDrag;
			const panOnScroll = panActivationKeyPressed || _panOnScroll;
			const _selectionOnDrag = selectionOnDrag && panOnDrag !== true;
			const isSelecting = selectionKeyPressed || userSelectionActive || _selectionOnDrag;
			useGlobalKeyHandler({
				deleteKeyCode,
				multiSelectionKeyCode
			});
			return (0, react_jsx_runtime.jsx)(ZoomPane, {
				onPaneContextMenu,
				elementsSelectable,
				zoomOnScroll,
				zoomOnPinch,
				panOnScroll,
				panActivationKeyPressed,
				panOnScrollSpeed,
				panOnScrollMode,
				zoomOnDoubleClick,
				panOnDrag: !selectionKeyPressed && panOnDrag,
				defaultViewport,
				translateExtent,
				minZoom,
				maxZoom,
				zoomActivationKeyCode,
				preventScrolling,
				noWheelClassName,
				noPanClassName,
				onViewportChange,
				isControlledViewport,
				paneClickDistance,
				selectionOnDrag: _selectionOnDrag,
				children: (0, react_jsx_runtime.jsxs)(Pane, {
					onSelectionStart,
					onSelectionEnd,
					onPaneClick,
					onPaneMouseEnter,
					onPaneMouseMove,
					onPaneMouseLeave,
					onPaneContextMenu,
					onPaneScroll,
					panOnDrag,
					autoPanOnSelection,
					isSelecting: !!isSelecting,
					selectionMode,
					selectionKeyPressed,
					paneClickDistance,
					selectionOnDrag: _selectionOnDrag,
					children: [children, nodesSelectionActive && (0, react_jsx_runtime.jsx)(NodesSelection, {
						onSelectionContextMenu,
						noPanClassName,
						disableKeyboardA11y
					})]
				})
			});
		}
		FlowRendererComponent.displayName = "FlowRenderer";
		const FlowRenderer = (0, react.memo)(FlowRendererComponent);
		const selector$c = (onlyRenderVisible) => (s) => {
			return onlyRenderVisible ? getNodesInside(s.nodeLookup, {
				x: 0,
				y: 0,
				width: s.width,
				height: s.height
			}, s.transform, true).map((node) => node.id) : Array.from(s.nodeLookup.keys());
		};
		/**
		* Hook for getting the visible node ids from the store.
		*
		* @internal
		* @param onlyRenderVisible
		* @returns array with visible node ids
		*/
		function useVisibleNodeIds(onlyRenderVisible) {
			return useStore((0, react.useCallback)(selector$c(onlyRenderVisible), [onlyRenderVisible]), shallow$1);
		}
		const selector$b = (s) => s.updateNodeInternals;
		function useResizeObserver() {
			const updateNodeInternals = useStore(selector$b);
			const [resizeObserver] = (0, react.useState)(() => {
				if (typeof ResizeObserver === "undefined") return null;
				return new ResizeObserver((entries) => {
					const updates = /* @__PURE__ */ new Map();
					entries.forEach((entry) => {
						const id = entry.target.getAttribute("data-id");
						updates.set(id, {
							id,
							nodeElement: entry.target,
							force: true
						});
					});
					updateNodeInternals(updates);
				});
			});
			(0, react.useEffect)(() => {
				return () => {
					resizeObserver?.disconnect();
				};
			}, [resizeObserver]);
			return resizeObserver;
		}
		/**
		* Hook to handle the resize observation + internal updates for the passed node.
		*
		* @internal
		* @returns nodeRef - reference to the node element
		*/
		function useNodeObserver({ node, nodeType, hasDimensions, resizeObserver }) {
			const store = useStoreApi();
			const nodeRef = (0, react.useRef)(null);
			const observedNode = (0, react.useRef)(null);
			const prevSourcePosition = (0, react.useRef)(node.sourcePosition);
			const prevTargetPosition = (0, react.useRef)(node.targetPosition);
			const prevType = (0, react.useRef)(nodeType);
			const isInitialized = hasDimensions && !!node.internals.handleBounds;
			(0, react.useEffect)(() => {
				if (nodeRef.current && !node.hidden && (!isInitialized || observedNode.current !== nodeRef.current)) {
					if (observedNode.current) resizeObserver?.unobserve(observedNode.current);
					resizeObserver?.observe(nodeRef.current);
					observedNode.current = nodeRef.current;
				}
			}, [isInitialized, node.hidden]);
			(0, react.useEffect)(() => {
				return () => {
					if (observedNode.current) {
						resizeObserver?.unobserve(observedNode.current);
						observedNode.current = null;
					}
				};
			}, []);
			(0, react.useEffect)(() => {
				if (nodeRef.current) {
					const typeChanged = prevType.current !== nodeType;
					const sourcePosChanged = prevSourcePosition.current !== node.sourcePosition;
					const targetPosChanged = prevTargetPosition.current !== node.targetPosition;
					if (typeChanged || sourcePosChanged || targetPosChanged) {
						prevType.current = nodeType;
						prevSourcePosition.current = node.sourcePosition;
						prevTargetPosition.current = node.targetPosition;
						store.getState().updateNodeInternals(/* @__PURE__ */ new Map([[node.id, {
							id: node.id,
							nodeElement: nodeRef.current,
							force: true
						}]]));
					}
				}
			}, [
				node.id,
				nodeType,
				node.sourcePosition,
				node.targetPosition
			]);
			return nodeRef;
		}
		function NodeWrapper({ id, onClick, onMouseEnter, onMouseMove, onMouseLeave, onContextMenu, onDoubleClick, nodesDraggable, elementsSelectable, nodesConnectable, nodesFocusable, resizeObserver, noDragClassName, noPanClassName, disableKeyboardA11y, rfId, nodeTypes, nodeClickDistance, onError }) {
			const { node, internals, isParent } = useStore((s) => {
				const node = s.nodeLookup.get(id);
				const isParent = s.parentLookup.has(id);
				return {
					node,
					internals: node.internals,
					isParent
				};
			}, shallow$1);
			let nodeType = node.type || "default";
			let NodeComponent = nodeTypes?.[nodeType] || builtinNodeTypes[nodeType];
			if (NodeComponent === void 0) {
				onError?.("003", errorMessages["error003"](nodeType));
				nodeType = "default";
				NodeComponent = nodeTypes?.["default"] || builtinNodeTypes.default;
			}
			const isDraggable = !!(node.draggable || nodesDraggable && typeof node.draggable === "undefined");
			const isSelectable = !!(node.selectable || elementsSelectable && typeof node.selectable === "undefined");
			const isConnectable = !!(node.connectable || nodesConnectable && typeof node.connectable === "undefined");
			const isFocusable = !!(node.focusable || nodesFocusable && typeof node.focusable === "undefined");
			const store = useStoreApi();
			const hasDimensions = nodeHasDimensions(node);
			const nodeRef = useNodeObserver({
				node,
				nodeType,
				hasDimensions,
				resizeObserver
			});
			const dragging = useDrag({
				nodeRef,
				disabled: node.hidden || !isDraggable,
				noDragClassName,
				handleSelector: node.dragHandle,
				nodeId: id,
				isSelectable,
				nodeClickDistance
			});
			const moveSelectedNodes = useMoveSelectedNodes();
			if (node.hidden) return null;
			const nodeDimensions = getNodeDimensions(node);
			const inlineDimensions = getNodeInlineStyleDimensions(node);
			const hasPointerEvents = isSelectable || isDraggable || onClick || onMouseEnter || onMouseMove || onMouseLeave;
			const onMouseEnterHandler = onMouseEnter ? (event) => onMouseEnter(event, { ...internals.userNode }) : void 0;
			const onMouseMoveHandler = onMouseMove ? (event) => onMouseMove(event, { ...internals.userNode }) : void 0;
			const onMouseLeaveHandler = onMouseLeave ? (event) => onMouseLeave(event, { ...internals.userNode }) : void 0;
			const onContextMenuHandler = onContextMenu ? (event) => onContextMenu(event, { ...internals.userNode }) : void 0;
			const onDoubleClickHandler = onDoubleClick ? (event) => onDoubleClick(event, { ...internals.userNode }) : void 0;
			const onSelectNodeHandler = (event) => {
				const { selectNodesOnDrag, nodeDragThreshold } = store.getState();
				if (isSelectable && (!selectNodesOnDrag || !isDraggable || nodeDragThreshold > 0)) handleNodeClick({
					id,
					store,
					nodeRef
				});
				if (onClick) onClick(event, { ...internals.userNode });
			};
			const onKeyDown = (event) => {
				if (isInputDOMNode(event.nativeEvent) || disableKeyboardA11y) return;
				if (elementSelectionKeys.includes(event.key) && isSelectable) {
					const unselect = event.key === "Escape";
					handleNodeClick({
						id,
						store,
						unselect,
						nodeRef
					});
				} else if (isDraggable && node.selected && Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
					event.preventDefault();
					const { ariaLabelConfig } = store.getState();
					store.setState({ ariaLiveMessage: ariaLabelConfig["node.a11yDescription.ariaLiveMessage"]({
						direction: event.key.replace("Arrow", "").toLowerCase(),
						x: ~~internals.positionAbsolute.x,
						y: ~~internals.positionAbsolute.y
					}) });
					moveSelectedNodes({
						direction: arrowKeyDiffs[event.key],
						factor: event.shiftKey ? 4 : 1
					});
				}
			};
			const onFocus = () => {
				if (disableKeyboardA11y || !nodeRef.current?.matches(":focus-visible")) return;
				const { transform, width, height, autoPanOnNodeFocus, setCenter } = store.getState();
				if (!autoPanOnNodeFocus) return;
				if (!(getNodesInside(/* @__PURE__ */ new Map([[id, node]]), {
					x: 0,
					y: 0,
					width,
					height
				}, transform, true).length > 0)) setCenter(node.position.x + nodeDimensions.width / 2, node.position.y + nodeDimensions.height / 2, { zoom: transform[2] });
			};
			return (0, react_jsx_runtime.jsx)("div", {
				className: cc([
					"react-flow__node",
					`react-flow__node-${nodeType}`,
					{ [noPanClassName]: isDraggable },
					node.className,
					{
						selected: node.selected,
						selectable: isSelectable,
						parent: isParent,
						draggable: isDraggable,
						dragging
					}
				]),
				ref: nodeRef,
				style: {
					zIndex: internals.z,
					transform: `translate(${internals.positionAbsolute.x}px,${internals.positionAbsolute.y}px)`,
					pointerEvents: hasPointerEvents ? "all" : "none",
					visibility: hasDimensions ? "visible" : "hidden",
					...node.style,
					...inlineDimensions
				},
				"data-id": id,
				"data-testid": `rf__node-${id}`,
				onMouseEnter: onMouseEnterHandler,
				onMouseMove: onMouseMoveHandler,
				onMouseLeave: onMouseLeaveHandler,
				onContextMenu: onContextMenuHandler,
				onClick: onSelectNodeHandler,
				onDoubleClick: onDoubleClickHandler,
				onKeyDown: isFocusable ? onKeyDown : void 0,
				tabIndex: isFocusable ? 0 : void 0,
				onFocus: isFocusable ? onFocus : void 0,
				role: node.ariaRole ?? (isFocusable ? "group" : void 0),
				"aria-roledescription": "node",
				"aria-describedby": disableKeyboardA11y ? void 0 : `${ARIA_NODE_DESC_KEY}-${rfId}`,
				"aria-label": node.ariaLabel,
				...node.domAttributes,
				children: (0, react_jsx_runtime.jsx)(Provider, {
					value: id,
					children: (0, react_jsx_runtime.jsx)(NodeComponent, {
						id,
						data: node.data,
						type: nodeType,
						positionAbsoluteX: internals.positionAbsolute.x,
						positionAbsoluteY: internals.positionAbsolute.y,
						selected: node.selected ?? false,
						selectable: isSelectable,
						draggable: isDraggable,
						deletable: node.deletable ?? true,
						isConnectable,
						sourcePosition: node.sourcePosition,
						targetPosition: node.targetPosition,
						dragging,
						dragHandle: node.dragHandle,
						zIndex: internals.z,
						parentId: node.parentId,
						...nodeDimensions
					})
				})
			});
		}
		var NodeWrapper$1 = (0, react.memo)(NodeWrapper);
		const selector$a = (s) => ({
			nodesConnectable: s.nodesConnectable,
			nodesFocusable: s.nodesFocusable,
			elementsSelectable: s.elementsSelectable,
			onError: s.onError
		});
		function NodeRendererComponent(props) {
			const { nodesConnectable, nodesFocusable, elementsSelectable, onError } = useStore(selector$a, shallow$1);
			const nodeIds = useVisibleNodeIds(props.onlyRenderVisibleElements);
			const resizeObserver = useResizeObserver();
			return (0, react_jsx_runtime.jsx)("div", {
				className: "react-flow__nodes",
				style: containerStyle,
				children: nodeIds.map((nodeId) => {
					return (0, react_jsx_runtime.jsx)(NodeWrapper$1, {
						id: nodeId,
						nodeTypes: props.nodeTypes,
						nodeExtent: props.nodeExtent,
						onClick: props.onNodeClick,
						onMouseEnter: props.onNodeMouseEnter,
						onMouseMove: props.onNodeMouseMove,
						onMouseLeave: props.onNodeMouseLeave,
						onContextMenu: props.onNodeContextMenu,
						onDoubleClick: props.onNodeDoubleClick,
						noDragClassName: props.noDragClassName,
						noPanClassName: props.noPanClassName,
						rfId: props.rfId,
						disableKeyboardA11y: props.disableKeyboardA11y,
						resizeObserver,
						nodesDraggable: props.nodesDraggable ?? true,
						nodesConnectable,
						nodesFocusable,
						elementsSelectable,
						nodeClickDistance: props.nodeClickDistance,
						onError
					}, nodeId);
				})
			});
		}
		NodeRendererComponent.displayName = "NodeRenderer";
		const NodeRenderer = (0, react.memo)(NodeRendererComponent);
		/**
		* Hook for getting the visible edge ids from the store.
		*
		* @internal
		* @param onlyRenderVisible
		* @returns array with visible edge ids
		*/
		function useVisibleEdgeIds(onlyRenderVisible) {
			return useStore((0, react.useCallback)((s) => {
				if (!onlyRenderVisible) return s.edges.map((edge) => edge.id);
				const visibleEdgeIds = [];
				if (s.width && s.height) for (const edge of s.edges) {
					const sourceNode = s.nodeLookup.get(edge.source);
					const targetNode = s.nodeLookup.get(edge.target);
					if (sourceNode && targetNode && isEdgeVisible({
						sourceNode,
						targetNode,
						width: s.width,
						height: s.height,
						transform: s.transform
					})) visibleEdgeIds.push(edge.id);
				}
				return visibleEdgeIds;
			}, [onlyRenderVisible]), shallow$1);
		}
		const ArrowSymbol = ({ color = "none", strokeWidth = 1 }) => {
			return (0, react_jsx_runtime.jsx)("polyline", {
				className: "arrow",
				style: {
					strokeWidth,
					...color && { stroke: color }
				},
				strokeLinecap: "round",
				fill: "none",
				strokeLinejoin: "round",
				points: "-5,-4 0,0 -5,4"
			});
		};
		const ArrowClosedSymbol = ({ color = "none", strokeWidth = 1 }) => {
			return (0, react_jsx_runtime.jsx)("polyline", {
				className: "arrowclosed",
				style: {
					strokeWidth,
					...color && {
						stroke: color,
						fill: color
					}
				},
				strokeLinecap: "round",
				strokeLinejoin: "round",
				points: "-5,-4 0,0 -5,4 -5,-4"
			});
		};
		const MarkerSymbols = {
			[MarkerType.Arrow]: ArrowSymbol,
			[MarkerType.ArrowClosed]: ArrowClosedSymbol
		};
		function useMarkerSymbol(type) {
			const store = useStoreApi();
			return (0, react.useMemo)(() => {
				if (!Object.prototype.hasOwnProperty.call(MarkerSymbols, type)) {
					store.getState().onError?.("009", errorMessages["error009"](type));
					return null;
				}
				return MarkerSymbols[type];
			}, [type]);
		}
		const Marker = ({ id, type, color, width = 12.5, height = 12.5, markerUnits = "strokeWidth", strokeWidth, orient = "auto-start-reverse" }) => {
			const Symbol = useMarkerSymbol(type);
			if (!Symbol) return null;
			return (0, react_jsx_runtime.jsx)("marker", {
				className: "react-flow__arrowhead",
				id,
				markerWidth: `${width}`,
				markerHeight: `${height}`,
				viewBox: "-10 -10 20 20",
				markerUnits,
				orient,
				refX: "0",
				refY: "0",
				children: (0, react_jsx_runtime.jsx)(Symbol, {
					color,
					strokeWidth
				})
			});
		};
		const MarkerDefinitions = ({ defaultColor, rfId }) => {
			const edges = useStore((s) => s.edges);
			const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
			const markers = (0, react.useMemo)(() => {
				return createMarkerIds(edges, {
					id: rfId,
					defaultColor,
					defaultMarkerStart: defaultEdgeOptions?.markerStart,
					defaultMarkerEnd: defaultEdgeOptions?.markerEnd
				});
			}, [
				edges,
				defaultEdgeOptions,
				rfId,
				defaultColor
			]);
			if (!markers.length) return null;
			return (0, react_jsx_runtime.jsx)("svg", {
				className: "react-flow__marker",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("defs", { children: markers.map((marker) => (0, react_jsx_runtime.jsx)(Marker, {
					id: marker.id,
					type: marker.type,
					color: marker.color,
					width: marker.width,
					height: marker.height,
					markerUnits: marker.markerUnits,
					strokeWidth: marker.strokeWidth,
					orient: marker.orient
				}, marker.id)) })
			});
		};
		MarkerDefinitions.displayName = "MarkerDefinitions";
		var MarkerDefinitions$1 = (0, react.memo)(MarkerDefinitions);
		function EdgeTextComponent({ x, y, label, labelStyle, labelShowBg = true, labelBgStyle, labelBgPadding = [2, 4], labelBgBorderRadius = 2, children, className, ...rest }) {
			const [edgeTextBbox, setEdgeTextBbox] = (0, react.useState)({
				x: 1,
				y: 0,
				width: 0,
				height: 0
			});
			const edgeTextClasses = cc(["react-flow__edge-textwrapper", className]);
			const edgeTextRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (edgeTextRef.current) {
					const textBbox = edgeTextRef.current.getBBox();
					setEdgeTextBbox({
						x: textBbox.x,
						y: textBbox.y,
						width: textBbox.width,
						height: textBbox.height
					});
				}
			}, [label]);
			if (!label) return null;
			return (0, react_jsx_runtime.jsxs)("g", {
				transform: `translate(${x - edgeTextBbox.width / 2} ${y - edgeTextBbox.height / 2})`,
				className: edgeTextClasses,
				visibility: edgeTextBbox.width ? "visible" : "hidden",
				...rest,
				children: [
					labelShowBg && (0, react_jsx_runtime.jsx)("rect", {
						width: edgeTextBbox.width + 2 * labelBgPadding[0],
						x: -labelBgPadding[0],
						y: -labelBgPadding[1],
						height: edgeTextBbox.height + 2 * labelBgPadding[1],
						className: "react-flow__edge-textbg",
						style: labelBgStyle,
						rx: labelBgBorderRadius,
						ry: labelBgBorderRadius
					}),
					(0, react_jsx_runtime.jsx)("text", {
						className: "react-flow__edge-text",
						y: edgeTextBbox.height / 2,
						dy: "0.3em",
						ref: edgeTextRef,
						style: labelStyle,
						children: label
					}),
					children
				]
			});
		}
		EdgeTextComponent.displayName = "EdgeText";
		/**
		* You can use the `<EdgeText />` component as a helper component to display text
		* within your custom edges.
		*
		* @public
		*
		* @example
		* ```jsx
		* import { EdgeText } from '@xyflow/react';
		*
		* export function CustomEdgeLabel({ label }) {
		*   return (
		*     <EdgeText
		*       x={100}
		*       y={100}
		*       label={label}
		*       labelStyle={{ fill: 'white' }}
		*       labelShowBg
		*       labelBgStyle={{ fill: 'red' }}
		*       labelBgPadding={[2, 4]}
		*       labelBgBorderRadius={2}
		*     />
		*   );
		* }
		*```
		*/
		const EdgeText = (0, react.memo)(EdgeTextComponent);
		/**
		* The `<BaseEdge />` component gets used internally for all the edges. It can be
		* used inside a custom edge and handles the invisible helper edge and the edge label
		* for you.
		*
		* @public
		* @example
		* ```jsx
		*import { BaseEdge } from '@xyflow/react';
		*
		*export function CustomEdge({ sourceX, sourceY, targetX, targetY, ...props }) {
		*  const [edgePath] = getStraightPath({
		*    sourceX,
		*    sourceY,
		*    targetX,
		*    targetY,
		*  });
		*
		*  return <BaseEdge path={edgePath} {...props} />;
		*}
		*```
		*
		* @remarks If you want to use an edge marker with the [`<BaseEdge />`](/api-reference/components/base-edge) component,
		* you can pass the `markerStart` or `markerEnd` props passed to your custom edge
		* through to the [`<BaseEdge />`](/api-reference/components/base-edge) component.
		* You can see all the props passed to a custom edge by looking at the [`EdgeProps`](/api-reference/types/edge-props) type.
		*/
		function BaseEdge({ path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, interactionWidth = 20, ...props }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("path", {
					...props,
					d: path,
					fill: "none",
					className: cc(["react-flow__edge-path", props.className])
				}),
				interactionWidth ? (0, react_jsx_runtime.jsx)("path", {
					d: path,
					fill: "none",
					strokeOpacity: 0,
					strokeWidth: interactionWidth,
					className: "react-flow__edge-interaction"
				}) : null,
				label && isNumeric(labelX) && isNumeric(labelY) ? (0, react_jsx_runtime.jsx)(EdgeText, {
					x: labelX,
					y: labelY,
					label,
					labelStyle,
					labelShowBg,
					labelBgStyle,
					labelBgPadding,
					labelBgBorderRadius
				}) : null
			] });
		}
		function getControl({ pos, x1, y1, x2, y2 }) {
			if (pos === Position.Left || pos === Position.Right) return [.5 * (x1 + x2), y1];
			return [x1, .5 * (y1 + y2)];
		}
		/**
		* The `getSimpleBezierPath` util returns everything you need to render a simple
		* bezier edge between two nodes.
		* @public
		* @returns
		* - `path`: the path to use in an SVG `<path>` element.
		* - `labelX`: the `x` position you can use to render a label for this edge.
		* - `labelY`: the `y` position you can use to render a label for this edge.
		* - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
		* middle of this path.
		* - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
		* middle of this path.
		*/
		function getSimpleBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top }) {
			const [sourceControlX, sourceControlY] = getControl({
				pos: sourcePosition,
				x1: sourceX,
				y1: sourceY,
				x2: targetX,
				y2: targetY
			});
			const [targetControlX, targetControlY] = getControl({
				pos: targetPosition,
				x1: targetX,
				y1: targetY,
				x2: sourceX,
				y2: sourceY
			});
			const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
				sourceX,
				sourceY,
				targetX,
				targetY,
				sourceControlX,
				sourceControlY,
				targetControlX,
				targetControlY
			});
			return [
				`M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
				labelX,
				labelY,
				offsetX,
				offsetY
			];
		}
		function createSimpleBezierEdge(params) {
			return (0, react.memo)(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style, markerEnd, markerStart, interactionWidth }) => {
				const [path, labelX, labelY] = getSimpleBezierPath({
					sourceX,
					sourceY,
					sourcePosition,
					targetX,
					targetY,
					targetPosition
				});
				return (0, react_jsx_runtime.jsx)(BaseEdge, {
					id: params.isInternal ? void 0 : id,
					path,
					labelX,
					labelY,
					label,
					labelStyle,
					labelShowBg,
					labelBgStyle,
					labelBgPadding,
					labelBgBorderRadius,
					style,
					markerEnd,
					markerStart,
					interactionWidth
				});
			});
		}
		const SimpleBezierEdge = createSimpleBezierEdge({ isInternal: false });
		const SimpleBezierEdgeInternal = createSimpleBezierEdge({ isInternal: true });
		SimpleBezierEdge.displayName = "SimpleBezierEdge";
		SimpleBezierEdgeInternal.displayName = "SimpleBezierEdgeInternal";
		function createSmoothStepEdge(params) {
			return (0, react.memo)(({ id, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style, sourcePosition = Position.Bottom, targetPosition = Position.Top, markerEnd, markerStart, pathOptions, interactionWidth }) => {
				const [path, labelX, labelY] = getSmoothStepPath({
					sourceX,
					sourceY,
					sourcePosition,
					targetX,
					targetY,
					targetPosition,
					borderRadius: pathOptions?.borderRadius,
					offset: pathOptions?.offset,
					stepPosition: pathOptions?.stepPosition
				});
				return (0, react_jsx_runtime.jsx)(BaseEdge, {
					id: params.isInternal ? void 0 : id,
					path,
					labelX,
					labelY,
					label,
					labelStyle,
					labelShowBg,
					labelBgStyle,
					labelBgPadding,
					labelBgBorderRadius,
					style,
					markerEnd,
					markerStart,
					interactionWidth
				});
			});
		}
		/**
		* Component that can be used inside a custom edge to render a smooth step edge.
		*
		* @public
		* @example
		*
		* ```tsx
		* import { SmoothStepEdge } from '@xyflow/react';
		*
		* function CustomEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
		*   return (
		*     <SmoothStepEdge
		*       sourceX={sourceX}
		*       sourceY={sourceY}
		*       targetX={targetX}
		*       targetY={targetY}
		*       sourcePosition={sourcePosition}
		*       targetPosition={targetPosition}
		*     />
		*   );
		* }
		* ```
		*/
		const SmoothStepEdge = createSmoothStepEdge({ isInternal: false });
		/**
		* @internal
		*/
		const SmoothStepEdgeInternal = createSmoothStepEdge({ isInternal: true });
		SmoothStepEdge.displayName = "SmoothStepEdge";
		SmoothStepEdgeInternal.displayName = "SmoothStepEdgeInternal";
		function createStepEdge(params) {
			return (0, react.memo)(({ id, ...props }) => {
				const _id = params.isInternal ? void 0 : id;
				return (0, react_jsx_runtime.jsx)(SmoothStepEdge, {
					...props,
					id: _id,
					pathOptions: (0, react.useMemo)(() => ({
						borderRadius: 0,
						offset: props.pathOptions?.offset
					}), [props.pathOptions?.offset])
				});
			});
		}
		/**
		* Component that can be used inside a custom edge to render a step edge.
		*
		* @public
		* @example
		*
		* ```tsx
		* import { StepEdge } from '@xyflow/react';
		*
		* function CustomEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
		*   return (
		*     <StepEdge
		*       sourceX={sourceX}
		*       sourceY={sourceY}
		*       targetX={targetX}
		*       targetY={targetY}
		*       sourcePosition={sourcePosition}
		*       targetPosition={targetPosition}
		*     />
		*   );
		* }
		* ```
		*/
		const StepEdge = createStepEdge({ isInternal: false });
		/**
		* @internal
		*/
		const StepEdgeInternal = createStepEdge({ isInternal: true });
		StepEdge.displayName = "StepEdge";
		StepEdgeInternal.displayName = "StepEdgeInternal";
		function createStraightEdge(params) {
			return (0, react.memo)(({ id, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style, markerEnd, markerStart, interactionWidth }) => {
				const [path, labelX, labelY] = getStraightPath({
					sourceX,
					sourceY,
					targetX,
					targetY
				});
				return (0, react_jsx_runtime.jsx)(BaseEdge, {
					id: params.isInternal ? void 0 : id,
					path,
					labelX,
					labelY,
					label,
					labelStyle,
					labelShowBg,
					labelBgStyle,
					labelBgPadding,
					labelBgBorderRadius,
					style,
					markerEnd,
					markerStart,
					interactionWidth
				});
			});
		}
		/**
		* Component that can be used inside a custom edge to render a straight line.
		*
		* @public
		* @example
		*
		* ```tsx
		* import { StraightEdge } from '@xyflow/react';
		*
		* function CustomEdge({ sourceX, sourceY, targetX, targetY }) {
		*   return (
		*     <StraightEdge
		*       sourceX={sourceX}
		*       sourceY={sourceY}
		*       targetX={targetX}
		*       targetY={targetY}
		*     />
		*   );
		* }
		* ```
		*/
		const StraightEdge = createStraightEdge({ isInternal: false });
		/**
		* @internal
		*/
		const StraightEdgeInternal = createStraightEdge({ isInternal: true });
		StraightEdge.displayName = "StraightEdge";
		StraightEdgeInternal.displayName = "StraightEdgeInternal";
		function createBezierEdge(params) {
			return (0, react.memo)(({ id, sourceX, sourceY, targetX, targetY, sourcePosition = Position.Bottom, targetPosition = Position.Top, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style, markerEnd, markerStart, pathOptions, interactionWidth }) => {
				const [path, labelX, labelY] = getBezierPath({
					sourceX,
					sourceY,
					sourcePosition,
					targetX,
					targetY,
					targetPosition,
					curvature: pathOptions?.curvature
				});
				return (0, react_jsx_runtime.jsx)(BaseEdge, {
					id: params.isInternal ? void 0 : id,
					path,
					labelX,
					labelY,
					label,
					labelStyle,
					labelShowBg,
					labelBgStyle,
					labelBgPadding,
					labelBgBorderRadius,
					style,
					markerEnd,
					markerStart,
					interactionWidth
				});
			});
		}
		/**
		* Component that can be used inside a custom edge to render a bezier curve.
		*
		* @public
		* @example
		*
		* ```tsx
		* import { BezierEdge } from '@xyflow/react';
		*
		* function CustomEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
		*   return (
		*     <BezierEdge
		*       sourceX={sourceX}
		*       sourceY={sourceY}
		*       targetX={targetX}
		*       targetY={targetY}
		*       sourcePosition={sourcePosition}
		*       targetPosition={targetPosition}
		*     />
		*   );
		* }
		* ```
		*/
		const BezierEdge = createBezierEdge({ isInternal: false });
		/**
		* @internal
		*/
		const BezierEdgeInternal = createBezierEdge({ isInternal: true });
		BezierEdge.displayName = "BezierEdge";
		BezierEdgeInternal.displayName = "BezierEdgeInternal";
		const builtinEdgeTypes = {
			default: BezierEdgeInternal,
			straight: StraightEdgeInternal,
			step: StepEdgeInternal,
			smoothstep: SmoothStepEdgeInternal,
			simplebezier: SimpleBezierEdgeInternal
		};
		const nullPosition = {
			sourceX: null,
			sourceY: null,
			targetX: null,
			targetY: null,
			sourcePosition: null,
			targetPosition: null,
			zIndex: void 0
		};
		const shiftX = (x, shift, position) => {
			if (position === Position.Left) return x - shift;
			if (position === Position.Right) return x + shift;
			return x;
		};
		const shiftY = (y, shift, position) => {
			if (position === Position.Top) return y - shift;
			if (position === Position.Bottom) return y + shift;
			return y;
		};
		const EdgeUpdaterClassName = "react-flow__edgeupdater";
		/**
		* @internal
		*/
		function EdgeAnchor({ position, centerX, centerY, radius = 10, onMouseDown, onMouseEnter, onMouseOut, type }) {
			return (0, react_jsx_runtime.jsx)("circle", {
				onMouseDown,
				onMouseEnter,
				onMouseOut,
				className: cc([EdgeUpdaterClassName, `${EdgeUpdaterClassName}-${type}`]),
				cx: shiftX(centerX, radius, position),
				cy: shiftY(centerY, radius, position),
				r: radius,
				stroke: "transparent",
				fill: "transparent"
			});
		}
		function EdgeUpdateAnchors({ isReconnectable, reconnectRadius, edge, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, onReconnect, onReconnectStart, onReconnectEnd, setReconnecting, setUpdateHover }) {
			const store = useStoreApi();
			const handleEdgeUpdater = (event, oppositeHandle) => {
				if (event.button !== 0) return;
				const { autoPanOnConnect, domNode, connectionMode, connectionRadius, lib, onConnectStart, cancelConnection, nodeLookup, rfId: flowId, panBy, updateConnection } = store.getState();
				const isTarget = oppositeHandle.type === "target";
				const _onReconnectEnd = (evt, connectionState) => {
					setReconnecting(false);
					onReconnectEnd?.(evt, edge, oppositeHandle.type, connectionState);
				};
				const onConnectEdge = (connection) => onReconnect?.(edge, connection);
				const _onConnectStart = (_event, params) => {
					setReconnecting(true);
					onReconnectStart?.(event, edge, oppositeHandle.type);
					onConnectStart?.(_event, params);
				};
				XYHandle.onPointerDown(event.nativeEvent, {
					autoPanOnConnect,
					connectionMode,
					connectionRadius,
					domNode,
					handleId: oppositeHandle.id,
					nodeId: oppositeHandle.nodeId,
					nodeLookup,
					isTarget,
					edgeUpdaterType: oppositeHandle.type,
					lib,
					flowId,
					cancelConnection,
					panBy,
					isValidConnection: (...args) => store.getState().isValidConnection?.(...args) ?? true,
					onConnect: onConnectEdge,
					onConnectStart: _onConnectStart,
					onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
					onReconnectEnd: _onReconnectEnd,
					updateConnection,
					getTransform: () => store.getState().transform,
					getFromHandle: () => store.getState().connection.fromHandle,
					dragThreshold: store.getState().connectionDragThreshold,
					handleDomNode: event.currentTarget
				});
			};
			const onReconnectSourceMouseDown = (event) => handleEdgeUpdater(event, {
				nodeId: edge.target,
				id: edge.targetHandle ?? null,
				type: "target"
			});
			const onReconnectTargetMouseDown = (event) => handleEdgeUpdater(event, {
				nodeId: edge.source,
				id: edge.sourceHandle ?? null,
				type: "source"
			});
			const onReconnectMouseEnter = () => setUpdateHover(true);
			const onReconnectMouseOut = () => setUpdateHover(false);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(isReconnectable === true || isReconnectable === "source") && (0, react_jsx_runtime.jsx)(EdgeAnchor, {
				position: sourcePosition,
				centerX: sourceX,
				centerY: sourceY,
				radius: reconnectRadius,
				onMouseDown: onReconnectSourceMouseDown,
				onMouseEnter: onReconnectMouseEnter,
				onMouseOut: onReconnectMouseOut,
				type: "source"
			}), (isReconnectable === true || isReconnectable === "target") && (0, react_jsx_runtime.jsx)(EdgeAnchor, {
				position: targetPosition,
				centerX: targetX,
				centerY: targetY,
				radius: reconnectRadius,
				onMouseDown: onReconnectTargetMouseDown,
				onMouseEnter: onReconnectMouseEnter,
				onMouseOut: onReconnectMouseOut,
				type: "target"
			})] });
		}
		function EdgeWrapper({ id, edgesFocusable, edgesReconnectable, elementsSelectable, onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseMove, onMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, rfId, edgeTypes, noPanClassName, onError, disableKeyboardA11y }) {
			let edge = useStore((s) => s.edgeLookup.get(id));
			const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
			edge = defaultEdgeOptions ? {
				...defaultEdgeOptions,
				...edge
			} : edge;
			let edgeType = edge.type || "default";
			let EdgeComponent = edgeTypes?.[edgeType] || builtinEdgeTypes[edgeType];
			if (EdgeComponent === void 0) {
				onError?.("011", errorMessages["error011"](edgeType));
				edgeType = "default";
				EdgeComponent = edgeTypes?.["default"] || builtinEdgeTypes.default;
			}
			const isFocusable = !!(edge.focusable || edgesFocusable && typeof edge.focusable === "undefined");
			const isReconnectable = typeof onReconnect !== "undefined" && (edge.reconnectable || edgesReconnectable && typeof edge.reconnectable === "undefined");
			const isSelectable = !!(edge.selectable || elementsSelectable && typeof edge.selectable === "undefined");
			const edgeRef = (0, react.useRef)(null);
			const [updateHover, setUpdateHover] = (0, react.useState)(false);
			const [reconnecting, setReconnecting] = (0, react.useState)(false);
			const store = useStoreApi();
			const { zIndex = edge.zIndex, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = useStore((0, react.useCallback)((store) => {
				const sourceNode = store.nodeLookup.get(edge.source);
				const targetNode = store.nodeLookup.get(edge.target);
				if (!sourceNode || !targetNode) return nullPosition;
				const edgePosition = getEdgePosition({
					id,
					sourceNode,
					targetNode,
					sourceHandle: edge.sourceHandle || null,
					targetHandle: edge.targetHandle || null,
					connectionMode: store.connectionMode,
					onError
				});
				const zIndex = getElevatedEdgeZIndex({
					selected: edge.selected,
					zIndex: edge.zIndex,
					sourceNode,
					targetNode,
					elevateOnSelect: store.elevateEdgesOnSelect,
					zIndexMode: store.zIndexMode
				});
				return {
					...edgePosition || nullPosition,
					zIndex
				};
			}, [
				edge.source,
				edge.target,
				edge.sourceHandle,
				edge.targetHandle,
				edge.selected,
				edge.zIndex,
				onError
			]), shallow$1);
			const markerStartUrl = (0, react.useMemo)(() => edge.markerStart ? `url('#${getMarkerId(edge.markerStart, rfId)}')` : void 0, [edge.markerStart, rfId]);
			const markerEndUrl = (0, react.useMemo)(() => edge.markerEnd ? `url('#${getMarkerId(edge.markerEnd, rfId)}')` : void 0, [edge.markerEnd, rfId]);
			if (edge.hidden || sourceX === null || sourceY === null || targetX === null || targetY === null) return null;
			const onEdgeClick = (event) => {
				const { addSelectedEdges, unselectNodesAndEdges, multiSelectionActive } = store.getState();
				if (isSelectable) {
					store.setState({ nodesSelectionActive: false });
					if (edge.selected && multiSelectionActive) {
						unselectNodesAndEdges({
							nodes: [],
							edges: [edge]
						});
						edgeRef.current?.blur();
					} else addSelectedEdges([id]);
				}
				if (onClick) onClick(event, edge);
			};
			const onEdgeDoubleClick = onDoubleClick ? (event) => {
				onDoubleClick(event, { ...edge });
			} : void 0;
			const onEdgeContextMenu = onContextMenu ? (event) => {
				onContextMenu(event, { ...edge });
			} : void 0;
			const onEdgeMouseEnter = onMouseEnter ? (event) => {
				onMouseEnter(event, { ...edge });
			} : void 0;
			const onEdgeMouseMove = onMouseMove ? (event) => {
				onMouseMove(event, { ...edge });
			} : void 0;
			const onEdgeMouseLeave = onMouseLeave ? (event) => {
				onMouseLeave(event, { ...edge });
			} : void 0;
			const onKeyDown = (event) => {
				if (!disableKeyboardA11y && elementSelectionKeys.includes(event.key) && isSelectable) {
					const { unselectNodesAndEdges, addSelectedEdges } = store.getState();
					if (event.key === "Escape") {
						edgeRef.current?.blur();
						unselectNodesAndEdges({ edges: [edge] });
					} else addSelectedEdges([id]);
				}
			};
			return (0, react_jsx_runtime.jsx)("svg", {
				style: { zIndex },
				children: (0, react_jsx_runtime.jsxs)("g", {
					className: cc([
						"react-flow__edge",
						`react-flow__edge-${edgeType}`,
						edge.className,
						noPanClassName,
						{
							selected: edge.selected,
							animated: edge.animated,
							inactive: !isSelectable && !onClick,
							updating: updateHover,
							selectable: isSelectable
						}
					]),
					onClick: onEdgeClick,
					onDoubleClick: onEdgeDoubleClick,
					onContextMenu: onEdgeContextMenu,
					onMouseEnter: onEdgeMouseEnter,
					onMouseMove: onEdgeMouseMove,
					onMouseLeave: onEdgeMouseLeave,
					onKeyDown: isFocusable ? onKeyDown : void 0,
					tabIndex: isFocusable ? 0 : void 0,
					role: edge.ariaRole ?? (isFocusable ? "group" : "img"),
					"aria-roledescription": "edge",
					"data-id": id,
					"data-testid": `rf__edge-${id}`,
					"aria-label": edge.ariaLabel === null ? void 0 : edge.ariaLabel || `Edge from ${edge.source} to ${edge.target}`,
					"aria-describedby": isFocusable ? `${ARIA_EDGE_DESC_KEY}-${rfId}` : void 0,
					ref: edgeRef,
					...edge.domAttributes,
					children: [!reconnecting && (0, react_jsx_runtime.jsx)(EdgeComponent, {
						id,
						source: edge.source,
						target: edge.target,
						type: edge.type,
						selected: edge.selected,
						animated: edge.animated,
						selectable: isSelectable,
						deletable: edge.deletable ?? true,
						label: edge.label,
						labelStyle: edge.labelStyle,
						labelShowBg: edge.labelShowBg,
						labelBgStyle: edge.labelBgStyle,
						labelBgPadding: edge.labelBgPadding,
						labelBgBorderRadius: edge.labelBgBorderRadius,
						sourceX,
						sourceY,
						targetX,
						targetY,
						sourcePosition,
						targetPosition,
						data: edge.data,
						style: edge.style,
						sourceHandleId: edge.sourceHandle,
						targetHandleId: edge.targetHandle,
						markerStart: markerStartUrl,
						markerEnd: markerEndUrl,
						pathOptions: "pathOptions" in edge ? edge.pathOptions : void 0,
						interactionWidth: edge.interactionWidth
					}), isReconnectable && (0, react_jsx_runtime.jsx)(EdgeUpdateAnchors, {
						edge,
						isReconnectable,
						reconnectRadius,
						onReconnect,
						onReconnectStart,
						onReconnectEnd,
						sourceX,
						sourceY,
						targetX,
						targetY,
						sourcePosition,
						targetPosition,
						setUpdateHover,
						setReconnecting
					})]
				})
			});
		}
		var EdgeWrapper$1 = (0, react.memo)(EdgeWrapper);
		const selector$9 = (s) => ({
			edgesFocusable: s.edgesFocusable,
			edgesReconnectable: s.edgesReconnectable,
			elementsSelectable: s.elementsSelectable,
			connectionMode: s.connectionMode,
			onError: s.onError
		});
		function EdgeRendererComponent({ defaultMarkerColor, onlyRenderVisibleElements, rfId, edgeTypes, noPanClassName, onReconnect, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, onEdgeClick, reconnectRadius, onEdgeDoubleClick, onReconnectStart, onReconnectEnd, disableKeyboardA11y }) {
			const { edgesFocusable, edgesReconnectable, elementsSelectable, onError } = useStore(selector$9, shallow$1);
			const edgeIds = useVisibleEdgeIds(onlyRenderVisibleElements);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "react-flow__edges",
				children: [(0, react_jsx_runtime.jsx)(MarkerDefinitions$1, {
					defaultColor: defaultMarkerColor,
					rfId
				}), edgeIds.map((id) => {
					return (0, react_jsx_runtime.jsx)(EdgeWrapper$1, {
						id,
						edgesFocusable,
						edgesReconnectable,
						elementsSelectable,
						noPanClassName,
						onReconnect,
						onContextMenu: onEdgeContextMenu,
						onMouseEnter: onEdgeMouseEnter,
						onMouseMove: onEdgeMouseMove,
						onMouseLeave: onEdgeMouseLeave,
						onClick: onEdgeClick,
						reconnectRadius,
						onDoubleClick: onEdgeDoubleClick,
						onReconnectStart,
						onReconnectEnd,
						rfId,
						onError,
						edgeTypes,
						disableKeyboardA11y
					}, id);
				})]
			});
		}
		EdgeRendererComponent.displayName = "EdgeRenderer";
		const EdgeRenderer = (0, react.memo)(EdgeRendererComponent);
		const toTransformString = (transform) => `translate(${transform[0]}px,${transform[1]}px) scale(${transform[2]})`;
		function Viewport({ children }) {
			const store = useStoreApi();
			const viewportRef = (0, react.useRef)(null);
			const [initialTransform] = (0, react.useState)(() => store.getState().transform);
			useIsomorphicLayoutEffect(() => {
				let prevTransform = null;
				const applyTransform = () => {
					const transform = store.getState().transform;
					if (prevTransform && transform[0] === prevTransform[0] && transform[1] === prevTransform[1] && transform[2] === prevTransform[2]) return;
					prevTransform = transform;
					if (viewportRef.current) viewportRef.current.style.transform = toTransformString(transform);
				};
				applyTransform();
				return store.subscribe(applyTransform);
			}, [store]);
			return (0, react_jsx_runtime.jsx)("div", {
				ref: viewportRef,
				className: "react-flow__viewport xyflow__viewport react-flow__container",
				style: { transform: toTransformString(initialTransform) },
				children
			});
		}
		/**
		* Hook for calling onInit handler.
		*
		* @internal
		*/
		function useOnInitHandler(onInit) {
			const rfInstance = useReactFlow();
			const isInitialized = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (!isInitialized.current && rfInstance.viewportInitialized && onInit) {
					setTimeout(() => onInit(rfInstance), 1);
					isInitialized.current = true;
				}
			}, [onInit, rfInstance.viewportInitialized]);
		}
		const selector$8 = (state) => state.panZoom?.syncViewport;
		/**
		* Hook for syncing the viewport with the panzoom instance.
		*
		* @internal
		* @param viewport
		*/
		function useViewportSync(viewport) {
			const syncViewport = useStore(selector$8);
			const store = useStoreApi();
			(0, react.useEffect)(() => {
				if (viewport) {
					syncViewport?.(viewport);
					store.setState({ transform: [
						viewport.x,
						viewport.y,
						viewport.zoom
					] });
				}
			}, [viewport, syncViewport]);
			return null;
		}
		function storeSelector$1(s) {
			return s.connection.inProgress ? {
				...s.connection,
				to: pointToRendererPoint(s.connection.to, s.transform)
			} : { ...s.connection };
		}
		function getSelector(connectionSelector) {
			if (connectionSelector) {
				const combinedSelector = (s) => {
					return connectionSelector(storeSelector$1(s));
				};
				return combinedSelector;
			}
			return storeSelector$1;
		}
		/**
		* The `useConnection` hook returns the current connection when there is an active
		* connection interaction. If no connection interaction is active, it returns null
		* for every property. A typical use case for this hook is to colorize handles
		* based on a certain condition (e.g. if the connection is valid or not).
		*
		* @public
		* @param connectionSelector - An optional selector function used to extract a slice of the
		* `ConnectionState` data. Using a selector can prevent component re-renders where data you don't
		* otherwise care about might change. If a selector is not provided, the entire `ConnectionState`
		* object is returned unchanged.
		* @example
		*
		* ```tsx
		*import { useConnection } from '@xyflow/react';
		*
		*function App() {
		*  const connection = useConnection();
		*
		*  return (
		*    <div> {connection ? `Someone is trying to make a connection from ${connection.fromNode} to this one.` : 'There are currently no incoming connections!'}
		*
		*   </div>
		*   );
		* }
		* ```
		*
		* @returns ConnectionState
		*/
		function useConnection(connectionSelector) {
			return useStore(getSelector(connectionSelector), shallow$1);
		}
		const selector$7 = (s) => ({
			nodesConnectable: s.nodesConnectable,
			isValid: s.connection.isValid,
			inProgress: s.connection.inProgress,
			width: s.width,
			height: s.height
		});
		function ConnectionLineWrapper({ containerStyle, style, type, component }) {
			const { nodesConnectable, width, height, isValid, inProgress } = useStore(selector$7, shallow$1);
			if (!!!(width && nodesConnectable && inProgress)) return null;
			return (0, react_jsx_runtime.jsx)("svg", {
				style: containerStyle,
				width,
				height,
				className: "react-flow__connectionline react-flow__container",
				children: (0, react_jsx_runtime.jsx)("g", {
					className: cc(["react-flow__connection", getConnectionStatus(isValid)]),
					children: (0, react_jsx_runtime.jsx)(ConnectionLine, {
						style,
						type,
						CustomComponent: component,
						isValid
					})
				})
			});
		}
		const ConnectionLine = ({ style, type = ConnectionLineType.Bezier, CustomComponent, isValid }) => {
			const { inProgress, from, fromNode, fromHandle, fromPosition, to, toNode, toHandle, toPosition, pointer } = useConnection();
			if (!inProgress) return;
			if (CustomComponent) return (0, react_jsx_runtime.jsx)(CustomComponent, {
				connectionLineType: type,
				connectionLineStyle: style,
				fromNode,
				fromHandle,
				fromX: from.x,
				fromY: from.y,
				toX: to.x,
				toY: to.y,
				fromPosition,
				toPosition,
				connectionStatus: getConnectionStatus(isValid),
				toNode,
				toHandle,
				pointer
			});
			let path = "";
			const pathParams = {
				sourceX: from.x,
				sourceY: from.y,
				sourcePosition: fromPosition,
				targetX: to.x,
				targetY: to.y,
				targetPosition: toPosition
			};
			switch (type) {
				case ConnectionLineType.Bezier:
					[path] = getBezierPath(pathParams);
					break;
				case ConnectionLineType.SimpleBezier:
					[path] = getSimpleBezierPath(pathParams);
					break;
				case ConnectionLineType.Step:
					[path] = getSmoothStepPath({
						...pathParams,
						borderRadius: 0
					});
					break;
				case ConnectionLineType.SmoothStep:
					[path] = getSmoothStepPath(pathParams);
					break;
				default: [path] = getStraightPath(pathParams);
			}
			return (0, react_jsx_runtime.jsx)("path", {
				d: path,
				fill: "none",
				className: "react-flow__connection-path",
				style
			});
		};
		ConnectionLine.displayName = "ConnectionLine";
		const emptyTypes = {};
		function useNodeOrEdgeTypesWarning(nodeOrEdgeTypes = emptyTypes) {
			(0, react.useRef)(nodeOrEdgeTypes);
			useStoreApi();
			(0, react.useEffect)(() => {}, [nodeOrEdgeTypes]);
		}
		function useStylesLoadedWarning() {
			useStoreApi();
			(0, react.useRef)(false);
			(0, react.useEffect)(() => {}, []);
		}
		function GraphViewComponent({ nodeTypes, edgeTypes, onInit, onNodeClick, onEdgeClick, onNodeDoubleClick, onEdgeDoubleClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onSelectionContextMenu, onSelectionStart, onSelectionEnd, connectionLineType, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, selectionKeyCode, selectionOnDrag, selectionMode, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, deleteKeyCode, onlyRenderVisibleElements, elementsSelectable, defaultViewport, translateExtent, minZoom, maxZoom, preventScrolling, defaultMarkerColor, zoomOnScroll, zoomOnPinch, panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag, autoPanOnSelection, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance, nodeClickDistance, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, noDragClassName, noWheelClassName, noPanClassName, disableKeyboardA11y, nodeExtent, rfId, viewport, onViewportChange, nodesDraggable }) {
			useNodeOrEdgeTypesWarning(nodeTypes);
			useNodeOrEdgeTypesWarning(edgeTypes);
			useStylesLoadedWarning();
			useOnInitHandler(onInit);
			useViewportSync(viewport);
			return (0, react_jsx_runtime.jsx)(FlowRenderer, {
				onPaneClick,
				onPaneMouseEnter,
				onPaneMouseMove,
				onPaneMouseLeave,
				onPaneContextMenu,
				onPaneScroll,
				paneClickDistance,
				deleteKeyCode,
				selectionKeyCode,
				selectionOnDrag,
				selectionMode,
				onSelectionStart,
				onSelectionEnd,
				multiSelectionKeyCode,
				panActivationKeyCode,
				zoomActivationKeyCode,
				elementsSelectable,
				zoomOnScroll,
				zoomOnPinch,
				zoomOnDoubleClick,
				panOnScroll,
				panOnScrollSpeed,
				panOnScrollMode,
				panOnDrag,
				autoPanOnSelection,
				defaultViewport,
				translateExtent,
				minZoom,
				maxZoom,
				onSelectionContextMenu,
				preventScrolling,
				noDragClassName,
				noWheelClassName,
				noPanClassName,
				disableKeyboardA11y,
				onViewportChange,
				isControlledViewport: !!viewport,
				children: (0, react_jsx_runtime.jsxs)(Viewport, { children: [
					(0, react_jsx_runtime.jsx)(EdgeRenderer, {
						edgeTypes,
						onEdgeClick,
						onEdgeDoubleClick,
						onReconnect,
						onReconnectStart,
						onReconnectEnd,
						onlyRenderVisibleElements,
						onEdgeContextMenu,
						onEdgeMouseEnter,
						onEdgeMouseMove,
						onEdgeMouseLeave,
						reconnectRadius,
						defaultMarkerColor,
						noPanClassName,
						disableKeyboardA11y,
						rfId
					}),
					(0, react_jsx_runtime.jsx)(ConnectionLineWrapper, {
						style: connectionLineStyle,
						type: connectionLineType,
						component: connectionLineComponent,
						containerStyle: connectionLineContainerStyle
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "react-flow__edgelabel-renderer" }),
					(0, react_jsx_runtime.jsx)(NodeRenderer, {
						nodeTypes,
						onNodeClick,
						onNodeDoubleClick,
						onNodeMouseEnter,
						onNodeMouseMove,
						onNodeMouseLeave,
						onNodeContextMenu,
						nodeClickDistance,
						onlyRenderVisibleElements,
						noPanClassName,
						noDragClassName,
						disableKeyboardA11y,
						nodeExtent,
						rfId,
						nodesDraggable
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "react-flow__viewport-portal" })
				] })
			});
		}
		GraphViewComponent.displayName = "GraphView";
		const GraphView = (0, react.memo)(GraphViewComponent);
		const devWarn = createDevWarn("React Flow", "https://reactflow.dev/");
		const getInitialState = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom = .5, maxZoom = 2, nodeOrigin, nodeExtent, zIndexMode = "basic" } = {}) => {
			const nodeLookup = /* @__PURE__ */ new Map();
			const parentLookup = /* @__PURE__ */ new Map();
			const connectionLookup = /* @__PURE__ */ new Map();
			const edgeLookup = /* @__PURE__ */ new Map();
			const storeEdges = defaultEdges ?? edges ?? [];
			const storeNodes = defaultNodes ?? nodes ?? [];
			const storeNodeOrigin = nodeOrigin ?? [0, 0];
			const storeNodeExtent = nodeExtent ?? infiniteExtent;
			updateConnectionLookup(connectionLookup, edgeLookup, storeEdges);
			const { nodesInitialized } = adoptUserNodes(storeNodes, nodeLookup, parentLookup, {
				nodeOrigin: storeNodeOrigin,
				nodeExtent: storeNodeExtent,
				zIndexMode
			});
			let transform = [
				0,
				0,
				1
			];
			if (fitView && width && height) {
				const { x, y, zoom } = getViewportForBounds(getInternalNodesBounds(nodeLookup, { filter: (node) => !!((node.width || node.initialWidth) && (node.height || node.initialHeight)) }), width, height, minZoom, maxZoom, fitViewOptions?.padding ?? .1);
				transform = [
					x,
					y,
					zoom
				];
			}
			return {
				rfId: "1",
				width: width ?? 0,
				height: height ?? 0,
				transform,
				nodes: storeNodes,
				nodesInitialized,
				nodeLookup,
				parentLookup,
				edges: storeEdges,
				edgeLookup,
				connectionLookup,
				onNodesChange: null,
				onEdgesChange: null,
				hasDefaultNodes: defaultNodes !== void 0,
				hasDefaultEdges: defaultEdges !== void 0,
				panZoom: null,
				minZoom,
				maxZoom,
				translateExtent: infiniteExtent,
				nodeExtent: storeNodeExtent,
				nodesSelectionActive: false,
				userSelectionActive: false,
				userSelectionRect: null,
				connectionMode: ConnectionMode.Strict,
				domNode: null,
				paneDragging: false,
				noPanClassName: "nopan",
				nodeOrigin: storeNodeOrigin,
				nodeDragThreshold: 1,
				connectionDragThreshold: 1,
				snapGrid: [15, 15],
				snapToGrid: false,
				nodesDraggable: true,
				nodesConnectable: true,
				nodesFocusable: true,
				edgesFocusable: true,
				edgesReconnectable: true,
				elementsSelectable: true,
				elevateNodesOnSelect: true,
				elevateEdgesOnSelect: true,
				selectNodesOnDrag: true,
				multiSelectionActive: false,
				fitViewQueued: fitView ?? false,
				fitViewOptions,
				fitViewResolver: null,
				connection: { ...initialConnection },
				connectionClickStartHandle: null,
				connectOnClick: true,
				ariaLiveMessage: "",
				autoPanOnConnect: true,
				autoPanOnNodeDrag: true,
				autoPanOnNodeFocus: true,
				autoPanSpeed: 15,
				connectionRadius: 20,
				onError: devWarn,
				isValidConnection: void 0,
				onSelectionChangeHandlers: [],
				lib: "react",
				debug: false,
				ariaLabelConfig: defaultAriaLabelConfig,
				zIndexMode,
				onNodesChangeMiddlewareMap: /* @__PURE__ */ new Map(),
				onEdgesChangeMiddlewareMap: /* @__PURE__ */ new Map()
			};
		};
		const createStore = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) => createWithEqualityFn((set, get) => {
			async function resolveFitView() {
				const { nodeLookup, panZoom, fitViewOptions, fitViewResolver, width, height, minZoom, maxZoom } = get();
				if (!panZoom) return;
				await fitViewport({
					nodes: nodeLookup,
					width,
					height,
					panZoom,
					minZoom,
					maxZoom
				}, fitViewOptions);
				fitViewResolver?.resolve(true);
				/**
				* wait for the fitViewport to resolve before deleting the resolver,
				* we want to reuse the old resolver if the user calls fitView again in the mean time
				*/
				set({ fitViewResolver: null });
			}
			return {
				...getInitialState({
					nodes,
					edges,
					width,
					height,
					fitView,
					fitViewOptions,
					minZoom,
					maxZoom,
					nodeOrigin,
					nodeExtent,
					defaultNodes,
					defaultEdges,
					zIndexMode
				}),
				setNodes: (nodes) => {
					const { nodeLookup, parentLookup, nodeOrigin, nodeExtent, elevateNodesOnSelect, fitViewQueued, zIndexMode, nodesSelectionActive } = get();
					const { nodesInitialized, hasSelectedNodes } = adoptUserNodes(nodes, nodeLookup, parentLookup, {
						nodeOrigin,
						nodeExtent,
						elevateNodesOnSelect,
						checkEquality: true,
						zIndexMode
					});
					const nextNodesSelectionActive = nodesSelectionActive && hasSelectedNodes;
					if (fitViewQueued && nodesInitialized) {
						resolveFitView();
						set({
							nodes,
							nodesInitialized,
							fitViewQueued: false,
							fitViewOptions: void 0,
							nodesSelectionActive: nextNodesSelectionActive
						});
					} else set({
						nodes,
						nodesInitialized,
						nodesSelectionActive: nextNodesSelectionActive
					});
				},
				setEdges: (edges) => {
					const { connectionLookup, edgeLookup } = get();
					updateConnectionLookup(connectionLookup, edgeLookup, edges);
					set({ edges });
				},
				setDefaultNodesAndEdges: (nodes, edges) => {
					if (nodes) {
						const { setNodes } = get();
						setNodes(nodes);
						set({ hasDefaultNodes: true });
					}
					if (edges) {
						const { setEdges } = get();
						setEdges(edges);
						set({ hasDefaultEdges: true });
					}
				},
				updateNodeInternals: (updates) => {
					const { triggerNodeChanges, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, debug, fitViewQueued, zIndexMode } = get();
					const { changes, updatedInternals } = updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, zIndexMode);
					if (!updatedInternals) return;
					updateAbsolutePositions(nodeLookup, parentLookup, {
						nodeOrigin,
						nodeExtent,
						zIndexMode
					});
					if (fitViewQueued) {
						resolveFitView();
						set({
							fitViewQueued: false,
							fitViewOptions: void 0
						});
					} else set({});
					if (changes?.length > 0) {
						if (debug) console.log("React Flow: trigger node changes", changes);
						triggerNodeChanges?.(changes);
					}
				},
				updateNodePositions: (nodeDragItems, dragging = false) => {
					const parentExpandChildren = [];
					let changes = [];
					const { nodeLookup, triggerNodeChanges, connection, updateConnection, onNodesChangeMiddlewareMap } = get();
					for (const [id, dragItem] of nodeDragItems) {
						const node = nodeLookup.get(id);
						const expandParent = !!(node?.expandParent && node?.parentId && dragItem?.position);
						const change = {
							id,
							type: "position",
							position: expandParent ? {
								x: Math.max(0, dragItem.position.x),
								y: Math.max(0, dragItem.position.y)
							} : dragItem.position,
							dragging
						};
						if (node && connection.inProgress && connection.fromNode.id === node.id) {
							const updatedFrom = getHandlePosition(node, connection.fromHandle, Position.Left, true);
							updateConnection({
								...connection,
								from: updatedFrom
							});
						}
						if (expandParent && node.parentId) parentExpandChildren.push({
							id,
							parentId: node.parentId,
							rect: {
								...dragItem.internals.positionAbsolute,
								width: dragItem.measured.width ?? 0,
								height: dragItem.measured.height ?? 0
							}
						});
						changes.push(change);
					}
					if (parentExpandChildren.length > 0) {
						const { parentLookup, nodeOrigin } = get();
						const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin);
						changes.push(...parentExpandChanges);
					}
					for (const middleware of onNodesChangeMiddlewareMap.values()) changes = middleware(changes);
					triggerNodeChanges(changes);
				},
				triggerNodeChanges: (changes) => {
					const { onNodesChange, setNodes, nodes, hasDefaultNodes, debug } = get();
					if (changes?.length) {
						if (hasDefaultNodes) setNodes(applyNodeChanges(changes, nodes));
						if (debug) console.log("React Flow: trigger node changes", changes);
						onNodesChange?.(changes);
					}
				},
				triggerEdgeChanges: (changes) => {
					const { onEdgesChange, setEdges, edges, hasDefaultEdges, debug } = get();
					if (changes?.length) {
						if (hasDefaultEdges) setEdges(applyEdgeChanges(changes, edges));
						if (debug) console.log("React Flow: trigger edge changes", changes);
						onEdgesChange?.(changes);
					}
				},
				addSelectedNodes: (selectedNodeIds) => {
					const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get();
					if (multiSelectionActive) {
						triggerNodeChanges(selectedNodeIds.map((nodeId) => createSelectionChange(nodeId, true)));
						return;
					}
					triggerNodeChanges(getSelectionChanges(nodeLookup, /* @__PURE__ */ new Set([...selectedNodeIds]), true));
					triggerEdgeChanges(getSelectionChanges(edgeLookup));
				},
				addSelectedEdges: (selectedEdgeIds) => {
					const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get();
					if (multiSelectionActive) {
						triggerEdgeChanges(selectedEdgeIds.map((edgeId) => createSelectionChange(edgeId, true)));
						return;
					}
					triggerEdgeChanges(getSelectionChanges(edgeLookup, /* @__PURE__ */ new Set([...selectedEdgeIds])));
					triggerNodeChanges(getSelectionChanges(nodeLookup, /* @__PURE__ */ new Set(), true));
				},
				unselectNodesAndEdges: ({ nodes, edges } = {}) => {
					const { edges: storeEdges, nodes: storeNodes, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get();
					const nodesToUnselect = nodes ? nodes : storeNodes;
					const edgesToUnselect = edges ? edges : storeEdges;
					const nodeChanges = [];
					for (const node of nodesToUnselect) {
						if (!node.selected) continue;
						const internalNode = nodeLookup.get(node.id);
						if (internalNode) internalNode.selected = false;
						nodeChanges.push(createSelectionChange(node.id, false));
					}
					const edgeChanges = [];
					for (const edge of edgesToUnselect) {
						if (!edge.selected) continue;
						edgeChanges.push(createSelectionChange(edge.id, false));
					}
					triggerNodeChanges(nodeChanges);
					triggerEdgeChanges(edgeChanges);
				},
				setMinZoom: (minZoom) => {
					const { panZoom, maxZoom } = get();
					panZoom?.setScaleExtent([minZoom, maxZoom]);
					set({ minZoom });
				},
				setMaxZoom: (maxZoom) => {
					const { panZoom, minZoom } = get();
					panZoom?.setScaleExtent([minZoom, maxZoom]);
					set({ maxZoom });
				},
				setTranslateExtent: (translateExtent) => {
					get().panZoom?.setTranslateExtent(translateExtent);
					set({ translateExtent });
				},
				resetSelectedElements: () => {
					const { edges, nodes, triggerNodeChanges, triggerEdgeChanges, elementsSelectable } = get();
					if (!elementsSelectable) return;
					const nodeChanges = nodes.reduce((res, node) => node.selected ? [...res, createSelectionChange(node.id, false)] : res, []);
					const edgeChanges = edges.reduce((res, edge) => edge.selected ? [...res, createSelectionChange(edge.id, false)] : res, []);
					triggerNodeChanges(nodeChanges);
					triggerEdgeChanges(edgeChanges);
				},
				setNodeExtent: (nextNodeExtent) => {
					const { nodes, nodeLookup, parentLookup, nodeOrigin, elevateNodesOnSelect, nodeExtent, zIndexMode } = get();
					if (nextNodeExtent[0][0] === nodeExtent[0][0] && nextNodeExtent[0][1] === nodeExtent[0][1] && nextNodeExtent[1][0] === nodeExtent[1][0] && nextNodeExtent[1][1] === nodeExtent[1][1]) return;
					adoptUserNodes(nodes, nodeLookup, parentLookup, {
						nodeOrigin,
						nodeExtent: nextNodeExtent,
						elevateNodesOnSelect,
						checkEquality: false,
						zIndexMode
					});
					set({ nodeExtent: nextNodeExtent });
				},
				panBy: (delta) => {
					const { transform, width, height, panZoom, translateExtent } = get();
					return panBy({
						delta,
						panZoom,
						transform,
						translateExtent,
						width,
						height
					});
				},
				setCenter: async (x, y, options) => {
					const { width, height, maxZoom, panZoom } = get();
					if (!panZoom) return false;
					const nextZoom = typeof options?.zoom !== "undefined" ? options.zoom : maxZoom;
					await panZoom.setViewport({
						x: width / 2 - x * nextZoom,
						y: height / 2 - y * nextZoom,
						zoom: nextZoom
					}, {
						duration: options?.duration,
						ease: options?.ease,
						interpolate: options?.interpolate
					});
					return true;
				},
				cancelConnection: () => {
					set({ connection: { ...initialConnection } });
				},
				updateConnection: (connection) => {
					set({ connection });
				},
				reset: () => set({ ...getInitialState() })
			};
		}, Object.is);
		/**
		* The `<ReactFlowProvider />` component is a [context provider](https://react.dev/learn/passing-data-deeply-with-context#)
		* that makes it possible to access a flow's internal state outside of the
		* [`<ReactFlow />`](/api-reference/react-flow) component. Many of the hooks we
		* provide rely on this component to work.
		* @public
		*
		* @example
		* ```tsx
		*import { ReactFlow, ReactFlowProvider, useNodes } from '@xyflow/react'
		*
		*export default function Flow() {
		*  return (
		*    <ReactFlowProvider>
		*      <ReactFlow nodes={...} edges={...} />
		*      <Sidebar />
		*    </ReactFlowProvider>
		*  );
		*}
		*
		*function Sidebar() {
		*  // This hook will only work if the component it's used in is a child of a
		*  // <ReactFlowProvider />.
		*  const nodes = useNodes()
		*
		*  return <aside>do something with nodes</aside>;
		*}
		*```
		*
		* @remarks If you're using a router and want your flow's state to persist across routes,
		* it's vital that you place the `<ReactFlowProvider />` component _outside_ of
		* your router. If you have multiple flows on the same page you will need to use a separate
		* `<ReactFlowProvider />` for each flow.
		*/
		function ReactFlowProvider({ initialNodes: nodes, initialEdges: edges, defaultNodes, defaultEdges, initialWidth: width, initialHeight: height, initialMinZoom: minZoom, initialMaxZoom: maxZoom, initialFitViewOptions: fitViewOptions, fitView, nodeOrigin, nodeExtent, zIndexMode, children }) {
			const [store] = (0, react.useState)(() => createStore({
				nodes,
				edges,
				defaultNodes,
				defaultEdges,
				width,
				height,
				fitView,
				minZoom,
				maxZoom,
				fitViewOptions,
				nodeOrigin,
				nodeExtent,
				zIndexMode
			}));
			return (0, react_jsx_runtime.jsx)(Provider$1, {
				value: store,
				children: (0, react_jsx_runtime.jsx)(BatchProvider, { children: (0, react_jsx_runtime.jsx)(HandleConfigProvider, { children }) })
			});
		}
		function Wrapper({ children, nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) {
			if ((0, react.useContext)(StoreContext)) return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children });
			return (0, react_jsx_runtime.jsx)(ReactFlowProvider, {
				initialNodes: nodes,
				initialEdges: edges,
				defaultNodes,
				defaultEdges,
				initialWidth: width,
				initialHeight: height,
				fitView,
				initialFitViewOptions: fitViewOptions,
				initialMinZoom: minZoom,
				initialMaxZoom: maxZoom,
				nodeOrigin,
				nodeExtent,
				zIndexMode,
				children
			});
		}
		const wrapperStyle = {
			width: "100%",
			height: "100%",
			overflow: "hidden",
			position: "relative",
			zIndex: 0
		};
		function ReactFlow({ nodes, edges, defaultNodes, defaultEdges, className, nodeTypes, edgeTypes, onNodeClick, onEdgeClick, onInit, onMove, onMoveStart, onMoveEnd, onConnect, onConnectStart, onConnectEnd, onClickConnectStart, onClickConnectEnd, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onNodeDoubleClick, onNodeDragStart, onNodeDrag, onNodeDragStop, onNodesDelete, onEdgesDelete, onDelete, onSelectionChange, onSelectionDragStart, onSelectionDrag, onSelectionDragStop, onSelectionContextMenu, onSelectionStart, onSelectionEnd, onBeforeDelete, connectionMode, connectionLineType = ConnectionLineType.Bezier, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, deleteKeyCode = "Backspace", selectionKeyCode = "Shift", selectionOnDrag = false, selectionMode = SelectionMode.Full, panActivationKeyCode = "Space", multiSelectionKeyCode = isMacOs() ? "Meta" : "Control", zoomActivationKeyCode = isMacOs() ? "Meta" : "Control", snapToGrid, snapGrid, onlyRenderVisibleElements = false, selectNodesOnDrag, nodesDraggable, autoPanOnNodeFocus, nodesConnectable, nodesFocusable, nodeOrigin = defaultNodeOrigin, edgesFocusable, edgesReconnectable, elementsSelectable = true, defaultViewport: defaultViewport$1 = defaultViewport, minZoom = .5, maxZoom = 2, translateExtent = infiniteExtent, preventScrolling = true, nodeExtent, defaultMarkerColor = "#b1b1b7", zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panOnScrollSpeed = .5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance = 1, nodeClickDistance = 0, children, onReconnect, onReconnectStart, onReconnectEnd, onEdgeContextMenu, onEdgeDoubleClick, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius = 10, onNodesChange, onEdgesChange, noDragClassName = "nodrag", noWheelClassName = "nowheel", noPanClassName = "nopan", fitView, fitViewOptions, connectOnClick, attributionPosition, proOptions, defaultEdgeOptions, elevateNodesOnSelect = true, elevateEdgesOnSelect = false, disableKeyboardA11y = false, autoPanOnConnect, autoPanOnNodeDrag, autoPanOnSelection = true, autoPanSpeed, connectionRadius, isValidConnection, onError, style, id, nodeDragThreshold, connectionDragThreshold, viewport, onViewportChange, width, height, colorMode = "light", debug, onScroll, ariaLabelConfig, zIndexMode = "basic", ...rest }, ref) {
			const rfId = id || "1";
			const colorModeClassName = useColorModeClass(colorMode);
			const wrapperOnScroll = (0, react.useCallback)((e) => {
				e.currentTarget.scrollTo({
					top: 0,
					left: 0,
					behavior: "instant"
				});
				onScroll?.(e);
			}, [onScroll]);
			return (0, react_jsx_runtime.jsx)("div", {
				"data-testid": "rf__wrapper",
				...rest,
				onScroll: wrapperOnScroll,
				style: {
					...style,
					...wrapperStyle
				},
				ref,
				className: cc([
					"react-flow",
					className,
					colorModeClassName
				]),
				id,
				role: "application",
				children: (0, react_jsx_runtime.jsxs)(Wrapper, {
					nodes,
					edges,
					width,
					height,
					fitView,
					fitViewOptions,
					minZoom,
					maxZoom,
					nodeOrigin,
					nodeExtent,
					zIndexMode,
					children: [
						(0, react_jsx_runtime.jsx)(StoreUpdater, {
							nodes,
							edges,
							defaultNodes,
							defaultEdges,
							onConnect,
							onConnectStart,
							onConnectEnd,
							onClickConnectStart,
							onClickConnectEnd,
							nodesDraggable,
							autoPanOnNodeFocus,
							nodesConnectable,
							nodesFocusable,
							edgesFocusable,
							edgesReconnectable,
							elementsSelectable,
							elevateNodesOnSelect,
							elevateEdgesOnSelect,
							minZoom,
							maxZoom,
							nodeExtent,
							onNodesChange,
							onEdgesChange,
							snapToGrid,
							snapGrid,
							connectionMode,
							translateExtent,
							connectOnClick,
							defaultEdgeOptions,
							fitView,
							fitViewOptions,
							onNodesDelete,
							onEdgesDelete,
							onDelete,
							onNodeDragStart,
							onNodeDrag,
							onNodeDragStop,
							onSelectionDrag,
							onSelectionDragStart,
							onSelectionDragStop,
							onMove,
							onMoveStart,
							onMoveEnd,
							noPanClassName,
							nodeOrigin,
							rfId,
							autoPanOnConnect,
							autoPanOnNodeDrag,
							autoPanSpeed,
							onError,
							connectionRadius,
							isValidConnection,
							selectNodesOnDrag,
							nodeDragThreshold,
							connectionDragThreshold,
							onBeforeDelete,
							debug,
							ariaLabelConfig,
							zIndexMode
						}),
						(0, react_jsx_runtime.jsx)(GraphView, {
							onInit,
							onNodeClick,
							onEdgeClick,
							onNodeMouseEnter,
							onNodeMouseMove,
							onNodeMouseLeave,
							onNodeContextMenu,
							onNodeDoubleClick,
							nodeTypes,
							edgeTypes,
							connectionLineType,
							connectionLineStyle,
							connectionLineComponent,
							connectionLineContainerStyle,
							selectionKeyCode,
							selectionOnDrag,
							selectionMode,
							deleteKeyCode,
							multiSelectionKeyCode,
							panActivationKeyCode,
							zoomActivationKeyCode,
							onlyRenderVisibleElements,
							defaultViewport: defaultViewport$1,
							translateExtent,
							minZoom,
							maxZoom,
							preventScrolling,
							zoomOnScroll,
							zoomOnPinch,
							zoomOnDoubleClick,
							panOnScroll,
							panOnScrollSpeed,
							panOnScrollMode,
							panOnDrag,
							autoPanOnSelection,
							onPaneClick,
							onPaneMouseEnter,
							onPaneMouseMove,
							onPaneMouseLeave,
							onPaneScroll,
							onPaneContextMenu,
							paneClickDistance,
							nodeClickDistance,
							onSelectionContextMenu,
							onSelectionStart,
							onSelectionEnd,
							onReconnect,
							onReconnectStart,
							onReconnectEnd,
							onEdgeContextMenu,
							onEdgeDoubleClick,
							onEdgeMouseEnter,
							onEdgeMouseMove,
							onEdgeMouseLeave,
							reconnectRadius,
							defaultMarkerColor,
							noDragClassName,
							noWheelClassName,
							noPanClassName,
							rfId,
							disableKeyboardA11y,
							nodeExtent,
							viewport,
							onViewportChange,
							nodesDraggable
						}),
						(0, react_jsx_runtime.jsx)(SelectionListener, { onSelectionChange }),
						children,
						(0, react_jsx_runtime.jsx)(Attribution, {
							proOptions,
							position: attributionPosition
						}),
						(0, react_jsx_runtime.jsx)(A11yDescriptions, {
							rfId,
							disableKeyboardA11y
						})
					]
				})
			});
		}
		/**
		* The `<ReactFlow />` component is the heart of your React Flow application.
		* It renders your nodes and edges and handles user interaction
		*
		* @public
		*
		* @example
		* ```tsx
		*import { ReactFlow } from '@xyflow/react'
		*
		*export default function Flow() {
		*  return (<ReactFlow
		*    nodes={...}
		*    edges={...}
		*    onNodesChange={...}
		*    ...
		*  />);
		*}
		*```
		*/
		var index = fixedForwardRef(ReactFlow);
		errorMessages["error014"]();
		function LinePattern({ dimensions, lineWidth, variant, className }) {
			return (0, react_jsx_runtime.jsx)("path", {
				strokeWidth: lineWidth,
				d: `M${dimensions[0] / 2} 0 V${dimensions[1]} M0 ${dimensions[1] / 2} H${dimensions[0]}`,
				className: cc([
					"react-flow__background-pattern",
					variant,
					className
				])
			});
		}
		function DotPattern({ radius, className }) {
			return (0, react_jsx_runtime.jsx)("circle", {
				cx: radius,
				cy: radius,
				r: radius,
				className: cc([
					"react-flow__background-pattern",
					"dots",
					className
				])
			});
		}
		/**
		* The three variants are exported as an enum for convenience. You can either import
		* the enum and use it like `BackgroundVariant.Lines` or you can use the raw string
		* value directly.
		* @public
		*/
		var BackgroundVariant;
		(function(BackgroundVariant) {
			BackgroundVariant["Lines"] = "lines";
			BackgroundVariant["Dots"] = "dots";
			BackgroundVariant["Cross"] = "cross";
		})(BackgroundVariant || (BackgroundVariant = {}));
		const defaultSize = {
			[BackgroundVariant.Dots]: 1,
			[BackgroundVariant.Lines]: 1,
			[BackgroundVariant.Cross]: 6
		};
		const selector$3 = (s) => ({
			transform: s.transform,
			patternId: `pattern-${s.rfId}`
		});
		function BackgroundComponent({ id, variant = BackgroundVariant.Dots, gap = 20, size, lineWidth = 1, offset = 0, color, bgColor, style, className, patternClassName }) {
			const ref = (0, react.useRef)(null);
			const { transform, patternId } = useStore(selector$3, shallow$1);
			const patternSize = size || defaultSize[variant];
			const isDots = variant === BackgroundVariant.Dots;
			const isCross = variant === BackgroundVariant.Cross;
			const gapXY = Array.isArray(gap) ? gap : [gap, gap];
			const scaledGap = [gapXY[0] * transform[2] || 1, gapXY[1] * transform[2] || 1];
			const scaledSize = patternSize * transform[2];
			const offsetXY = Array.isArray(offset) ? offset : [offset, offset];
			const patternDimensions = isCross ? [scaledSize, scaledSize] : scaledGap;
			const scaledOffset = [offsetXY[0] * transform[2] + patternDimensions[0] / 2, offsetXY[1] * transform[2] + patternDimensions[1] / 2];
			const _patternId = `${patternId}${id ? id : ""}`;
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: cc(["react-flow__background", className]),
				style: {
					...style,
					...containerStyle,
					"--xy-background-color-props": bgColor,
					"--xy-background-pattern-color-props": color
				},
				ref,
				"data-testid": "rf__background",
				children: [(0, react_jsx_runtime.jsx)("pattern", {
					id: _patternId,
					x: transform[0] % scaledGap[0],
					y: transform[1] % scaledGap[1],
					width: scaledGap[0],
					height: scaledGap[1],
					patternUnits: "userSpaceOnUse",
					patternTransform: `translate(-${scaledOffset[0]},-${scaledOffset[1]})`,
					children: isDots ? (0, react_jsx_runtime.jsx)(DotPattern, {
						radius: scaledSize / 2,
						className: patternClassName
					}) : (0, react_jsx_runtime.jsx)(LinePattern, {
						dimensions: patternDimensions,
						lineWidth,
						variant,
						className: patternClassName
					})
				}), (0, react_jsx_runtime.jsx)("rect", {
					x: "0",
					y: "0",
					width: "100%",
					height: "100%",
					fill: `url(#${_patternId})`
				})]
			});
		}
		BackgroundComponent.displayName = "Background";
		(0, react.memo)(BackgroundComponent);
		function PlusIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 32 32",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" })
			});
		}
		function MinusIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 32 5",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M0 0h32v4.2H0z" })
			});
		}
		function FitViewIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 32 30",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" })
			});
		}
		function LockIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 25 32",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" })
			});
		}
		function UnlockIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 25 32",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" })
			});
		}
		/**
		* You can add buttons to the control panel by using the `<ControlButton />` component
		* and pass it as a child to the [`<Controls />`](/api-reference/components/controls) component.
		*
		* @public
		* @example
		*```jsx
		*import { MagicWand } from '@radix-ui/react-icons'
		*import { ReactFlow, Controls, ControlButton } from '@xyflow/react'
		*
		*export default function Flow() {
		*  return (
		*    <ReactFlow nodes={[...]} edges={[...]}>
		*      <Controls>
		*        <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
		*          <MagicWand />
		*        </ControlButton>
		*      </Controls>
		*    </ReactFlow>
		*  )
		*}
		*```
		*/
		function ControlButton({ children, className, ...rest }) {
			return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: cc(["react-flow__controls-button", className]),
				...rest,
				children
			});
		}
		const selector$2 = (s) => ({
			isInteractive: s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
			minZoomReached: s.transform[2] <= s.minZoom,
			maxZoomReached: s.transform[2] >= s.maxZoom,
			ariaLabelConfig: s.ariaLabelConfig
		});
		function ControlsComponent({ style, showZoom = true, showFitView = true, showInteractive = true, fitViewOptions, onZoomIn, onZoomOut, onFitView, onInteractiveChange, className, children, position = "bottom-left", orientation = "vertical", "aria-label": ariaLabel }) {
			const store = useStoreApi();
			const { isInteractive, minZoomReached, maxZoomReached, ariaLabelConfig } = useStore(selector$2, shallow$1);
			const { zoomIn, zoomOut, fitView } = useReactFlow();
			const onZoomInHandler = () => {
				zoomIn();
				onZoomIn?.();
			};
			const onZoomOutHandler = () => {
				zoomOut();
				onZoomOut?.();
			};
			const onFitViewHandler = () => {
				fitView(fitViewOptions);
				onFitView?.();
			};
			const onToggleInteractivity = () => {
				store.setState({
					nodesDraggable: !isInteractive,
					nodesConnectable: !isInteractive,
					elementsSelectable: !isInteractive
				});
				onInteractiveChange?.(!isInteractive);
			};
			return (0, react_jsx_runtime.jsxs)(Panel, {
				className: cc([
					"react-flow__controls",
					orientation === "horizontal" ? "horizontal" : "vertical",
					className
				]),
				position,
				style,
				"data-testid": "rf__controls",
				"aria-label": ariaLabel ?? ariaLabelConfig["controls.ariaLabel"],
				children: [
					showZoom && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(ControlButton, {
						onClick: onZoomInHandler,
						className: "react-flow__controls-zoomin",
						title: ariaLabelConfig["controls.zoomIn.ariaLabel"],
						"aria-label": ariaLabelConfig["controls.zoomIn.ariaLabel"],
						disabled: maxZoomReached,
						children: (0, react_jsx_runtime.jsx)(PlusIcon, {})
					}), (0, react_jsx_runtime.jsx)(ControlButton, {
						onClick: onZoomOutHandler,
						className: "react-flow__controls-zoomout",
						title: ariaLabelConfig["controls.zoomOut.ariaLabel"],
						"aria-label": ariaLabelConfig["controls.zoomOut.ariaLabel"],
						disabled: minZoomReached,
						children: (0, react_jsx_runtime.jsx)(MinusIcon, {})
					})] }),
					showFitView && (0, react_jsx_runtime.jsx)(ControlButton, {
						className: "react-flow__controls-fitview",
						onClick: onFitViewHandler,
						title: ariaLabelConfig["controls.fitView.ariaLabel"],
						"aria-label": ariaLabelConfig["controls.fitView.ariaLabel"],
						children: (0, react_jsx_runtime.jsx)(FitViewIcon, {})
					}),
					showInteractive && (0, react_jsx_runtime.jsx)(ControlButton, {
						className: "react-flow__controls-interactive",
						onClick: onToggleInteractivity,
						title: ariaLabelConfig["controls.interactive.ariaLabel"],
						"aria-label": ariaLabelConfig["controls.interactive.ariaLabel"],
						children: isInteractive ? (0, react_jsx_runtime.jsx)(UnlockIcon, {}) : (0, react_jsx_runtime.jsx)(LockIcon, {})
					}),
					children
				]
			});
		}
		ControlsComponent.displayName = "Controls";
		(0, react.memo)(ControlsComponent);
		function MiniMapNodeComponent({ id, x, y, width, height, style, color, strokeColor, strokeWidth, className, borderRadius, shapeRendering, selected, onClick }) {
			const { background, backgroundColor } = style || {};
			const fill = color || background || backgroundColor;
			return (0, react_jsx_runtime.jsx)("rect", {
				className: cc([
					"react-flow__minimap-node",
					{ selected },
					className
				]),
				x,
				y,
				rx: borderRadius,
				ry: borderRadius,
				width,
				height,
				style: {
					fill,
					stroke: strokeColor,
					strokeWidth
				},
				shapeRendering,
				onClick: onClick ? (event) => onClick(event, id) : void 0
			});
		}
		const MiniMapNode = (0, react.memo)(MiniMapNodeComponent);
		const selectorNodeIds = (s) => s.nodes.map((node) => node.id);
		const getAttrFunction = (func) => func instanceof Function ? func : () => func;
		function MiniMapNodes({ nodeStrokeColor, nodeColor, nodeClassName = "", nodeBorderRadius = 5, nodeStrokeWidth, nodeComponent: NodeComponent = MiniMapNode, onClick }) {
			const nodeIds = useStore(selectorNodeIds, shallow$1);
			const nodeColorFunc = getAttrFunction(nodeColor);
			const nodeStrokeColorFunc = getAttrFunction(nodeStrokeColor);
			const nodeClassNameFunc = getAttrFunction(nodeClassName);
			const shapeRendering = typeof window === "undefined" || !!window.chrome ? "crispEdges" : "geometricPrecision";
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: nodeIds.map((nodeId) => (0, react_jsx_runtime.jsx)(NodeComponentWrapper, {
				id: nodeId,
				nodeColorFunc,
				nodeStrokeColorFunc,
				nodeClassNameFunc,
				nodeBorderRadius,
				nodeStrokeWidth,
				NodeComponent,
				onClick,
				shapeRendering
			}, nodeId)) });
		}
		function NodeComponentWrapperInner({ id, nodeColorFunc, nodeStrokeColorFunc, nodeClassNameFunc, nodeBorderRadius, nodeStrokeWidth, shapeRendering, NodeComponent, onClick }) {
			const { node, x, y, width, height } = useStore((s) => {
				const node = s.nodeLookup.get(id);
				if (!node) return {
					node: void 0,
					x: 0,
					y: 0,
					width: 0,
					height: 0
				};
				const userNode = node.internals.userNode;
				const { x, y } = node.internals.positionAbsolute;
				const { width, height } = getNodeDimensions(userNode);
				return {
					node: userNode,
					x,
					y,
					width,
					height
				};
			}, shallow$1);
			if (!node || node.hidden || !nodeHasDimensions(node)) return null;
			return (0, react_jsx_runtime.jsx)(NodeComponent, {
				x,
				y,
				width,
				height,
				style: node.style,
				selected: !!node.selected,
				className: nodeClassNameFunc(node),
				color: nodeColorFunc(node),
				borderRadius: nodeBorderRadius,
				strokeColor: nodeStrokeColorFunc(node),
				strokeWidth: nodeStrokeWidth,
				shapeRendering,
				onClick,
				id: node.id
			});
		}
		const NodeComponentWrapper = (0, react.memo)(NodeComponentWrapperInner);
		var MiniMapNodes$1 = (0, react.memo)(MiniMapNodes);
		const defaultWidth = 200;
		const defaultHeight = 150;
		const filterHidden = (node) => !node.hidden;
		const selector$1 = (s) => {
			const viewBB = {
				x: -s.transform[0] / s.transform[2],
				y: -s.transform[1] / s.transform[2],
				width: s.width / s.transform[2],
				height: s.height / s.transform[2]
			};
			return {
				viewBB,
				boundingRect: s.nodeLookup.size > 0 ? getBoundsOfRects(getInternalNodesBounds(s.nodeLookup, { filter: filterHidden }), viewBB) : viewBB,
				rfId: s.rfId,
				panZoom: s.panZoom,
				translateExtent: s.translateExtent,
				flowWidth: s.width,
				flowHeight: s.height,
				ariaLabelConfig: s.ariaLabelConfig
			};
		};
		const rectEqual = (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
		const areEqual = (a, b) => rectEqual(a.viewBB, b.viewBB) && rectEqual(a.boundingRect, b.boundingRect) && a.rfId === b.rfId && a.panZoom === b.panZoom && a.translateExtent === b.translateExtent && a.flowWidth === b.flowWidth && a.flowHeight === b.flowHeight && a.ariaLabelConfig === b.ariaLabelConfig;
		const ARIA_LABEL_KEY = "react-flow__minimap-desc";
		function MiniMapComponent({ style, className, nodeStrokeColor, nodeColor, nodeClassName = "", nodeBorderRadius = 5, nodeStrokeWidth, nodeComponent, bgColor, maskColor, maskStrokeColor, maskStrokeWidth, position = "bottom-right", onClick, onNodeClick, pannable = false, zoomable = false, ariaLabel, inversePan, zoomStep = 1, offsetScale = 5 }) {
			const store = useStoreApi();
			const svg = (0, react.useRef)(null);
			const { boundingRect, viewBB, rfId, panZoom, translateExtent, flowWidth, flowHeight, ariaLabelConfig } = useStore(selector$1, areEqual);
			const elementWidth = style?.width ?? defaultWidth;
			const elementHeight = style?.height ?? defaultHeight;
			const scaledWidth = boundingRect.width / elementWidth;
			const scaledHeight = boundingRect.height / elementHeight;
			const viewScale = Math.max(scaledWidth, scaledHeight);
			const viewWidth = viewScale * elementWidth;
			const viewHeight = viewScale * elementHeight;
			const offset = offsetScale * viewScale;
			const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
			const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
			const width = viewWidth + offset * 2;
			const height = viewHeight + offset * 2;
			const labelledBy = `${ARIA_LABEL_KEY}-${rfId}`;
			const viewScaleRef = (0, react.useRef)(0);
			const minimapInstance = (0, react.useRef)();
			viewScaleRef.current = viewScale;
			(0, react.useEffect)(() => {
				if (svg.current && panZoom) {
					minimapInstance.current = XYMinimap({
						domNode: svg.current,
						panZoom,
						getTransform: () => store.getState().transform,
						getViewScale: () => viewScaleRef.current
					});
					return () => {
						minimapInstance.current?.destroy();
					};
				}
			}, [panZoom]);
			(0, react.useEffect)(() => {
				minimapInstance.current?.update({
					translateExtent,
					width: flowWidth,
					height: flowHeight,
					inversePan,
					pannable,
					zoomStep,
					zoomable
				});
			}, [
				pannable,
				zoomable,
				inversePan,
				zoomStep,
				translateExtent,
				flowWidth,
				flowHeight
			]);
			const onSvgClick = onClick ? (event) => {
				const [x, y] = minimapInstance.current?.pointer(event) || [0, 0];
				onClick(event, {
					x,
					y
				});
			} : void 0;
			const onSvgNodeClick = onNodeClick ? (0, react.useCallback)((event, nodeId) => {
				const node = store.getState().nodeLookup.get(nodeId).internals.userNode;
				onNodeClick(event, node);
			}, []) : void 0;
			const _ariaLabel = ariaLabel ?? ariaLabelConfig["minimap.ariaLabel"];
			return (0, react_jsx_runtime.jsx)(Panel, {
				position,
				style: {
					...style,
					"--xy-minimap-background-color-props": typeof bgColor === "string" ? bgColor : void 0,
					"--xy-minimap-mask-background-color-props": typeof maskColor === "string" ? maskColor : void 0,
					"--xy-minimap-mask-stroke-color-props": typeof maskStrokeColor === "string" ? maskStrokeColor : void 0,
					"--xy-minimap-mask-stroke-width-props": typeof maskStrokeWidth === "number" ? maskStrokeWidth * viewScale : void 0,
					"--xy-minimap-node-background-color-props": typeof nodeColor === "string" ? nodeColor : void 0,
					"--xy-minimap-node-stroke-color-props": typeof nodeStrokeColor === "string" ? nodeStrokeColor : void 0,
					"--xy-minimap-node-stroke-width-props": typeof nodeStrokeWidth === "number" ? nodeStrokeWidth : void 0
				},
				className: cc(["react-flow__minimap", className]),
				"data-testid": "rf__minimap",
				children: (0, react_jsx_runtime.jsxs)("svg", {
					width: elementWidth,
					height: elementHeight,
					viewBox: `${x} ${y} ${width} ${height}`,
					className: "react-flow__minimap-svg",
					role: "img",
					"aria-labelledby": labelledBy,
					ref: svg,
					onClick: onSvgClick,
					children: [
						_ariaLabel && (0, react_jsx_runtime.jsx)("title", {
							id: labelledBy,
							children: _ariaLabel
						}),
						(0, react_jsx_runtime.jsx)(MiniMapNodes$1, {
							onClick: onSvgNodeClick,
							nodeColor,
							nodeStrokeColor,
							nodeBorderRadius,
							nodeClassName,
							nodeStrokeWidth,
							nodeComponent
						}),
						(0, react_jsx_runtime.jsx)("path", {
							className: "react-flow__minimap-mask",
							d: `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`,
							fillRule: "evenodd",
							pointerEvents: "none"
						})
					]
				})
			});
		}
		MiniMapComponent.displayName = "MiniMap";
		(0, react.memo)(MiniMapComponent);
		const scaleSelector = (calculateScale) => (store) => calculateScale ? `${Math.max(1 / store.transform[2], 1)}` : void 0;
		const defaultPositions = {
			[ResizeControlVariant.Line]: "right",
			[ResizeControlVariant.Handle]: "bottom-right"
		};
		function ResizeControl({ nodeId, position, variant = ResizeControlVariant.Handle, className, style = void 0, children, color, minWidth = 10, minHeight = 10, maxWidth = Number.MAX_VALUE, maxHeight = Number.MAX_VALUE, keepAspectRatio = false, resizeDirection, autoScale = true, shouldResize, onResizeStart, onResize, onResizeEnd }) {
			const contextNodeId = useNodeId();
			const id = typeof nodeId === "string" ? nodeId : contextNodeId;
			const store = useStoreApi();
			const resizeControlRef = (0, react.useRef)(null);
			const isHandleControl = variant === ResizeControlVariant.Handle;
			const scale = useStore((0, react.useCallback)(scaleSelector(isHandleControl && autoScale), [isHandleControl, autoScale]), shallow$1);
			const resizer = (0, react.useRef)(null);
			const controlPosition = position ?? defaultPositions[variant];
			(0, react.useEffect)(() => {
				if (!resizeControlRef.current || !id) return;
				if (!resizer.current) resizer.current = XYResizer({
					domNode: resizeControlRef.current,
					nodeId: id,
					getStoreItems: () => {
						const { nodeLookup, transform, snapGrid, snapToGrid, nodeOrigin, domNode } = store.getState();
						return {
							nodeLookup,
							transform,
							snapGrid,
							snapToGrid,
							nodeOrigin,
							paneDomNode: domNode
						};
					},
					onChange: (change, childChanges) => {
						const { triggerNodeChanges, nodeLookup, parentLookup, nodeOrigin } = store.getState();
						const changes = [];
						const nextPosition = {
							x: change.x,
							y: change.y
						};
						const node = nodeLookup.get(id);
						if (node && node.expandParent && node.parentId) {
							const origin = node.origin ?? nodeOrigin;
							const width = change.width ?? node.measured.width ?? 0;
							const height = change.height ?? node.measured.height ?? 0;
							const parentExpandChanges = handleExpandParent([{
								id: node.id,
								parentId: node.parentId,
								rect: {
									width,
									height,
									...evaluateAbsolutePosition({
										x: change.x ?? node.position.x,
										y: change.y ?? node.position.y
									}, {
										width,
										height
									}, node.parentId, nodeLookup, origin)
								}
							}], nodeLookup, parentLookup, nodeOrigin);
							changes.push(...parentExpandChanges);
							nextPosition.x = change.x ? Math.max(origin[0] * width, change.x) : void 0;
							nextPosition.y = change.y ? Math.max(origin[1] * height, change.y) : void 0;
						}
						if (nextPosition.x !== void 0 && nextPosition.y !== void 0) {
							const positionChange = {
								id,
								type: "position",
								position: { ...nextPosition }
							};
							changes.push(positionChange);
						}
						if (change.width !== void 0 && change.height !== void 0) {
							const dimensionChange = {
								id,
								type: "dimensions",
								resizing: true,
								setAttributes: !resizeDirection ? true : resizeDirection === "horizontal" ? "width" : "height",
								dimensions: {
									width: change.width,
									height: change.height
								}
							};
							changes.push(dimensionChange);
						}
						for (const childChange of childChanges) {
							const positionChange = {
								...childChange,
								type: "position"
							};
							changes.push(positionChange);
						}
						triggerNodeChanges(changes);
					},
					onEnd: ({ width, height }) => {
						const dimensionChange = {
							id,
							type: "dimensions",
							resizing: false,
							dimensions: {
								width,
								height
							}
						};
						store.getState().triggerNodeChanges([dimensionChange]);
					}
				});
				resizer.current.update({
					controlPosition,
					boundaries: {
						minWidth,
						minHeight,
						maxWidth,
						maxHeight
					},
					keepAspectRatio,
					resizeDirection,
					onResizeStart,
					onResize,
					onResizeEnd,
					shouldResize
				});
				return () => {
					resizer.current?.destroy();
				};
			}, [
				controlPosition,
				minWidth,
				minHeight,
				maxWidth,
				maxHeight,
				keepAspectRatio,
				onResizeStart,
				onResize,
				onResizeEnd,
				shouldResize
			]);
			return (0, react_jsx_runtime.jsx)("div", {
				className: cc([
					"react-flow__resize-control",
					"nodrag",
					...controlPosition.split("-"),
					variant,
					className
				]),
				ref: resizeControlRef,
				style: {
					...style,
					scale,
					...color && { [isHandleControl ? "backgroundColor" : "borderColor"]: color }
				},
				children
			});
		}
		(0, react.memo)(ResizeControl);
		//#endregion
		//#region node_modules/.pnpm/@dagrejs+dagre@3.1.1/node_modules/@dagrejs/dagre/dist/dagre.esm.js
		var Te = Object.defineProperty;
		var In = (e, n, t) => n in e ? Te(e, n, {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: t
		}) : e[n] = t;
		var Sn = (e, n) => {
			for (var t in n) Te(e, t, {
				get: n[t],
				enumerable: !0
			});
		};
		var je = (e, n, t) => In(e, typeof n != "symbol" ? n + "" : n, t);
		var ie = {};
		Sn(ie, {
			Graph: () => T,
			alg: () => H
		});
		var Mn = Object.defineProperty;
		var Se = (e, n) => {
			for (var t in n) Mn(e, t, {
				get: n[t],
				enumerable: !0
			});
		};
		var Q = class {
			constructor(e) {
				this._isDirected = !0, this._isMultigraph = !1, this._isCompound = !1, this._nodes = {}, this._in = {}, this._preds = {}, this._out = {}, this._sucs = {}, this._edgeObjs = {}, this._edgeLabels = {}, this._nodeCount = 0, this._edgeCount = 0, this._defaultNodeLabelFn = () => {}, this._defaultEdgeLabelFn = () => {}, e && (this._isDirected = "directed" in e ? e.directed : !0, this._isMultigraph = "multigraph" in e ? e.multigraph : !1, this._isCompound = "compound" in e ? e.compound : !1), this._isCompound && (this._parent = {}, this._children = {}, this._children["\0"] = {});
			}
			isDirected() {
				return this._isDirected;
			}
			isMultigraph() {
				return this._isMultigraph;
			}
			isCompound() {
				return this._isCompound;
			}
			setGraph(e) {
				return this._label = e, this;
			}
			graph() {
				return this._label;
			}
			setDefaultNodeLabel(e) {
				return typeof e != "function" ? this._defaultNodeLabelFn = () => e : this._defaultNodeLabelFn = e, this;
			}
			nodeCount() {
				return this._nodeCount;
			}
			nodes() {
				return Object.keys(this._nodes);
			}
			sources() {
				return this.nodes().filter((e) => Object.keys(this._in[e]).length === 0);
			}
			sinks() {
				return this.nodes().filter((e) => Object.keys(this._out[e]).length === 0);
			}
			setNodes(e, n) {
				return e.forEach((t) => {
					n !== void 0 ? this.setNode(t, n) : this.setNode(t);
				}), this;
			}
			setNode(e, n) {
				return e in this._nodes ? (arguments.length > 1 && (this._nodes[e] = n), this) : (this._nodes[e] = arguments.length > 1 ? n : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = "\0", this._children[e] = {}, this._children["\0"][e] = !0), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
			}
			node(e) {
				return this._nodes[e];
			}
			hasNode(e) {
				return e in this._nodes;
			}
			removeNode(e) {
				if (e in this._nodes) {
					let n = (t) => this.removeEdge(this._edgeObjs[t]);
					delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], this.children(e).forEach((t) => {
						this.setParent(t);
					}), delete this._children[e]), Object.keys(this._in[e]).forEach(n), delete this._in[e], delete this._preds[e], Object.keys(this._out[e]).forEach(n), delete this._out[e], delete this._sucs[e], --this._nodeCount;
				}
				return this;
			}
			setParent(e, n) {
				if (!this._isCompound) throw new Error("Cannot set parent in a non-compound graph");
				if (n === void 0) n = "\0";
				else {
					n += "";
					for (let t = n; t !== void 0; t = this.parent(t)) if (t === e) throw new Error("Setting " + n + " as parent of " + e + " would create a cycle");
					this.setNode(n);
				}
				return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = n, this._children[n][e] = !0, this;
			}
			parent(e) {
				if (this._isCompound) {
					let n = this._parent[e];
					if (n !== "\0") return n;
				}
			}
			children(e = "\0") {
				if (this._isCompound) {
					let n = this._children[e];
					if (n) return Object.keys(n);
				} else {
					if (e === "\0") return this.nodes();
					if (this.hasNode(e)) return [];
				}
				return [];
			}
			predecessors(e) {
				let n = this._preds[e];
				if (n) return Object.keys(n);
			}
			successors(e) {
				let n = this._sucs[e];
				if (n) return Object.keys(n);
			}
			neighbors(e) {
				let n = this.predecessors(e);
				if (n) {
					let t = new Set(n), r = this.successors(e);
					if (r) for (let o of r) t.add(o);
					return Array.from(t.values());
				}
			}
			isLeaf(e) {
				var n;
				let t;
				return this.isDirected() ? t = this.successors(e) : t = this.neighbors(e), ((n = t == null ? void 0 : t.length) != null ? n : 0) === 0;
			}
			filterNodes(e) {
				let n = new this.constructor({
					directed: this._isDirected,
					multigraph: this._isMultigraph,
					compound: this._isCompound
				});
				n.setGraph(this.graph()), Object.entries(this._nodes).forEach(([o, i]) => {
					e(o) && n.setNode(o, i);
				}), Object.values(this._edgeObjs).forEach((o) => {
					n.hasNode(o.v) && n.hasNode(o.w) && n.setEdge(o, this.edge(o));
				});
				let t = {}, r = (o) => {
					let i = this.parent(o);
					return !i || n.hasNode(i) ? (t[o] = i, i) : i in t ? t[i] : r(i);
				};
				return this._isCompound && n.nodes().forEach((o) => n.setParent(o, r(o))), n;
			}
			setDefaultEdgeLabel(e) {
				return typeof e != "function" ? this._defaultEdgeLabelFn = () => e : this._defaultEdgeLabelFn = e, this;
			}
			edgeCount() {
				return this._edgeCount;
			}
			edges() {
				return Object.values(this._edgeObjs);
			}
			setPath(e, n) {
				return e.reduce((t, r) => (n !== void 0 ? this.setEdge(t, r, n) : this.setEdge(t, r), r)), this;
			}
			setEdge(e, n, t, r) {
				let o, i, s, a, l = !1;
				typeof e == "object" && e !== null && "v" in e ? (o = e.v, i = e.w, s = e.name, arguments.length === 2 && (a = n, l = !0)) : (o = e, i = n, s = r, arguments.length > 2 && (a = t, l = !0)), o = "" + o, i = "" + i, s !== void 0 && (s = "" + s);
				let u = z(this._isDirected, o, i, s);
				if (u in this._edgeLabels) return l && (this._edgeLabels[u] = a), this;
				if (s !== void 0 && !this._isMultigraph) throw new Error("Cannot set a named edge when isMultigraph = false");
				this.setNode(o), this.setNode(i), this._edgeLabels[u] = l ? a : this._defaultEdgeLabelFn(o, i, s);
				let d = Pn(this._isDirected, o, i, s);
				return o = d.v, i = d.w, Object.freeze(d), this._edgeObjs[u] = d, Re(this._preds[i], o), Re(this._sucs[o], i), this._in[i][u] = d, this._out[o][u] = d, this._edgeCount++, this;
			}
			edge(e, n, t) {
				let r = arguments.length === 1 ? oe(this._isDirected, e) : z(this._isDirected, e, n, t);
				return this._edgeLabels[r];
			}
			edgeAsObj(e, n, t) {
				let r = arguments.length === 1 ? this.edge(e) : this.edge(e, n, t);
				return typeof r != "object" || r === null ? { label: r } : r;
			}
			hasEdge(e, n, t) {
				return (arguments.length === 1 ? oe(this._isDirected, e) : z(this._isDirected, e, n, t)) in this._edgeLabels;
			}
			removeEdge(e, n, t) {
				let r = arguments.length === 1 ? oe(this._isDirected, e) : z(this._isDirected, e, n, t), o = this._edgeObjs[r];
				if (o) {
					let i = o.v, s = o.w;
					delete this._edgeLabels[r], delete this._edgeObjs[r], Ie(this._preds[s], i), Ie(this._sucs[i], s), delete this._in[s][r], delete this._out[i][r], this._edgeCount--;
				}
				return this;
			}
			inEdges(e, n) {
				return this.isDirected() ? this.filterEdges(this._in[e], e, n) : this.nodeEdges(e, n);
			}
			outEdges(e, n) {
				return this.isDirected() ? this.filterEdges(this._out[e], e, n) : this.nodeEdges(e, n);
			}
			nodeEdges(e, n) {
				if (e in this._nodes) return this.filterEdges({
					...this._in[e],
					...this._out[e]
				}, e, n);
			}
			_removeFromParentsChildList(e) {
				delete this._children[this._parent[e]][e];
			}
			filterEdges(e, n, t) {
				if (!e) return;
				let r = Object.values(e);
				return t ? r.filter((o) => o.v === n && o.w === t || o.v === t && o.w === n) : r;
			}
		};
		function Re(e, n) {
			e[n] ? e[n]++ : e[n] = 1;
		}
		function Ie(e, n) {
			e[n] !== void 0 && !--e[n] && delete e[n];
		}
		function z(e, n, t, r) {
			let o = "" + n, i = "" + t;
			if (!e && o > i) {
				let s = o;
				o = i, i = s;
			}
			return o + "" + i + "" + (r === void 0 ? "\0" : r);
		}
		function Pn(e, n, t, r) {
			let o = "" + n, i = "" + t;
			if (!e && o > i) {
				let a = o;
				o = i, i = a;
			}
			let s = {
				v: o,
				w: i
			};
			return r && (s.name = r), s;
		}
		function oe(e, n) {
			return z(e, n.v, n.w, n.name);
		}
		Se({}, {
			read: () => Yn,
			write: () => An
		});
		function An(e) {
			let n = {
				options: {
					directed: e.isDirected(),
					multigraph: e.isMultigraph(),
					compound: e.isCompound()
				},
				nodes: Vn(e),
				edges: Dn(e)
			}, t = e.graph();
			return t !== void 0 && (n.value = structuredClone(t)), n;
		}
		function Vn(e) {
			return e.nodes().map((n) => {
				let t = e.node(n), r = e.parent(n), o = { v: n };
				return t !== void 0 && (o.value = t), r !== void 0 && (o.parent = r), o;
			});
		}
		function Dn(e) {
			return e.edges().map((n) => {
				let t = e.edge(n), r = {
					v: n.v,
					w: n.w
				};
				return n.name !== void 0 && (r.name = n.name), t !== void 0 && (r.value = t), r;
			});
		}
		function Yn(e) {
			let n = new Q(e.options);
			return e.value !== void 0 && n.setGraph(e.value), e.nodes.forEach((t) => {
				n.setNode(t.v, t.value), t.parent && n.setParent(t.v, t.parent);
			}), e.edges.forEach((t) => {
				n.setEdge({
					v: t.v,
					w: t.w,
					name: t.name
				}, t.value);
			}), n;
		}
		var H = {};
		Se(H, {
			CycleException: () => K,
			bellmanFord: () => Me,
			components: () => Xn,
			dijkstra: () => J,
			dijkstraAll: () => qn,
			findCycles: () => $n,
			floydWarshall: () => Jn,
			isAcyclic: () => Qn,
			postorder: () => et,
			preorder: () => nt,
			prim: () => tt,
			shortestPaths: () => rt,
			tarjan: () => Fe,
			topsort: () => Ae
		});
		var Wn = () => 1;
		function Me(e, n, t, r) {
			return Bn(e, String(n), t || Wn, r || function(o) {
				var i;
				return (i = e.outEdges(o)) != null ? i : [];
			});
		}
		function Bn(e, n, t, r) {
			let o = {}, i, s = 0, a = e.nodes(), l = function(c) {
				let f = o[c.v], h = o[c.w];
				if (!f || !h) return;
				let p = t(c);
				f.distance + p < h.distance && (o[c.w] = {
					distance: f.distance + p,
					predecessor: c.v
				}, i = !0);
			}, u = function() {
				a.forEach(function(c) {
					r(c).forEach(function(f) {
						let h = f.v === c ? f.v : f.w, p = h === f.v ? f.w : f.v;
						l({
							v: h,
							w: p
						});
					});
				});
			};
			a.forEach(function(c) {
				let f = c === n ? 0 : Number.POSITIVE_INFINITY;
				o[c] = {
					distance: f,
					predecessor: ""
				};
			});
			let d = a.length;
			for (let c = 1; c < d && (i = !1, s++, u(), !!i); c++);
			if (s === d - 1 && (i = !1, u(), i)) throw new Error("The graph contains a negative weight cycle");
			return o;
		}
		function Xn(e) {
			let n = {}, t = [], r;
			function o(i) {
				var s, a;
				i in n || (n[i] = !0, r.push(i), (s = e.successors(i)) == null || s.forEach(o), (a = e.predecessors(i)) == null || a.forEach(o));
			}
			return e.nodes().forEach(function(i) {
				r = [], o(i), r.length && t.push(r);
			}), t;
		}
		var Pe = class {
			constructor() {
				this._arr = [], this._keyIndices = {};
			}
			size() {
				return this._arr.length;
			}
			keys() {
				return this._arr.map((e) => e.key);
			}
			has(e) {
				return e in this._keyIndices;
			}
			priority(e) {
				let n = this._keyIndices[e];
				if (n !== void 0) return this._arr[n].priority;
			}
			min() {
				if (this.size() === 0) throw new Error("Queue underflow");
				return this._arr[0].key;
			}
			add(e, n) {
				let t = this._keyIndices, r = String(e);
				if (!(r in t)) {
					let o = this._arr, i = o.length;
					return t[r] = i, o.push({
						key: r,
						priority: n
					}), this._decrease(i), !0;
				}
				return !1;
			}
			removeMin() {
				if (this.size() === 0) throw new Error("Queue underflow");
				this._swap(0, this._arr.length - 1);
				let e = this._arr.pop();
				return delete this._keyIndices[e.key], this._heapify(0), e.key;
			}
			decrease(e, n) {
				let t = this._keyIndices[e];
				if (t === void 0) throw new Error(`Key not found: ${e}`);
				let r = this._arr[t].priority;
				if (n > r) throw new Error(`New priority is greater than current priority. Key: ${e} Old: ${r} New: ${n}`);
				this._arr[t].priority = n, this._decrease(t);
			}
			_heapify(e) {
				let n = this._arr, t = 2 * e, r = t + 1, o = e;
				t < n.length && (o = n[t].priority < n[o].priority ? t : o, r < n.length && (o = n[r].priority < n[o].priority ? r : o), o !== e && (this._swap(e, o), this._heapify(o)));
			}
			_decrease(e) {
				let n = this._arr, t = n[e].priority, r;
				for (; e !== 0 && (r = e >> 1, !(n[r].priority < t));) this._swap(e, r), e = r;
			}
			_swap(e, n) {
				let t = this._arr, r = this._keyIndices, o = t[e], i = t[n];
				t[e] = i, t[n] = o, r[i.key] = e, r[o.key] = n;
			}
		};
		var zn = () => 1;
		function J(e, n, t, r) {
			let o = function(i) {
				var s;
				return (s = e.outEdges(i)) != null ? s : [];
			};
			return Hn(e, String(n), t || zn, r || o);
		}
		function Hn(e, n, t, r) {
			let o = {}, i = new Pe(), s, a, l = function(u) {
				let d = u.v !== s ? u.v : u.w, c = o[d];
				if (!c) return;
				let f = t(u), h = a.distance + f;
				if (f < 0) throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + u + " Weight: " + f);
				h < c.distance && (c.distance = h, c.predecessor = s, i.decrease(d, h));
			};
			for (e.nodes().forEach(function(u) {
				let d = u === n ? 0 : Number.POSITIVE_INFINITY;
				o[u] = {
					distance: d,
					predecessor: ""
				}, i.add(u, d);
			}); i.size() > 0;) {
				s = i.removeMin();
				let u = o[s];
				if (!u || u.distance === Number.POSITIVE_INFINITY) break;
				a = u, r(s).forEach(l);
			}
			return o;
		}
		function qn(e, n, t) {
			return e.nodes().reduce(function(r, o) {
				return r[o] = J(e, o, n, t), r;
			}, {});
		}
		function Fe(e) {
			let n = 0, t = [], r = {}, o = [];
			function i(s) {
				var a;
				let l = r[s] = {
					onStack: !0,
					lowlink: n,
					index: n++
				};
				if (t.push(s), (a = e.successors(s)) == null || a.forEach(function(u) {
					if (u in r) {
						let d = r[u];
						d != null && d.onStack && (l.lowlink = Math.min(l.lowlink, d.index));
					} else {
						i(u);
						let d = r[u];
						d && (l.lowlink = Math.min(l.lowlink, d.lowlink));
					}
				}), l.lowlink === l.index) {
					let u = [], d;
					do {
						d = t.pop();
						let c = r[d];
						c && (c.onStack = !1), u.push(d);
					} while (s !== d);
					o.push(u);
				}
			}
			return e.nodes().forEach(function(s) {
				s in r || i(s);
			}), o;
		}
		function $n(e) {
			return Fe(e).filter(function(n) {
				var t;
				let r = n[0];
				return r ? n.length > 1 || n.length === 1 && ((t = e.outEdges(r, r)) != null ? t : []).length > 0 : !1;
			});
		}
		var Un = () => 1;
		function Jn(e, n, t) {
			return Kn(e, n || Un, t || function(r) {
				var o;
				return (o = e.outEdges(r)) != null ? o : [];
			});
		}
		function Kn(e, n, t) {
			let r = {}, o = e.nodes();
			return o.forEach(function(i) {
				let s = {};
				r[i] = s, s[i] = {
					distance: 0,
					predecessor: ""
				}, o.forEach(function(a) {
					i !== a && (s[a] = {
						distance: Number.POSITIVE_INFINITY,
						predecessor: ""
					});
				}), t(i).forEach(function(a) {
					let l = a.v === i ? a.w : a.v, u = n(a);
					s[l] = {
						distance: u,
						predecessor: i
					};
				});
			}), o.forEach(function(i) {
				let s = r[i];
				s && o.forEach(function(a) {
					let l = r[a];
					l && o.forEach(function(u) {
						let d = l[i], c = s[u], f = l[u];
						if (d && c && f) {
							let h = d.distance + c.distance;
							h < f.distance && (f.distance = h, f.predecessor = c.predecessor);
						}
					});
				});
			}), r;
		}
		var K = class extends Error {
			constructor(e) {
				super(e), this.name = "CycleException";
			}
		};
		function Ae(e) {
			let n = {}, t = {}, r = [];
			function o(i) {
				var s;
				if (i in t) throw new K();
				i in n || (t[i] = !0, n[i] = !0, (s = e.predecessors(i)) == null || s.forEach(o), delete t[i], r.push(i));
			}
			if (e.sinks().forEach(o), Object.keys(n).length !== e.nodeCount()) throw new K();
			return r;
		}
		function Qn(e) {
			try {
				Ae(e);
			} catch (n) {
				if (n instanceof K) return !1;
				throw n;
			}
			return !0;
		}
		function Zn(e, n, t, r, o) {
			Array.isArray(n) || (n = [n]);
			let i = ((a) => {
				var l;
				return (l = e.isDirected() ? e.successors(a) : e.neighbors(a)) != null ? l : [];
			}), s = {};
			return n.forEach(function(a) {
				if (!e.hasNode(a)) throw new Error("Graph does not have node: " + a);
				o = Ve(e, a, t === "post", s, i, r, o);
			}), o;
		}
		function Ve(e, n, t, r, o, i, s) {
			return n in r || (r[n] = !0, t || (s = i(s, n)), o(n).forEach(function(a) {
				s = Ve(e, a, t, r, o, i, s);
			}), t && (s = i(s, n))), s;
		}
		function De(e, n, t) {
			return Zn(e, n, t, function(r, o) {
				return r.push(o), r;
			}, []);
		}
		function et(e, n) {
			return De(e, n, "post");
		}
		function nt(e, n) {
			return De(e, n, "pre");
		}
		function tt(e, n) {
			var t;
			let r = new Q(), o = {}, i = new Pe(), s;
			function a(d) {
				let c = d.v === s ? d.w : d.v, f = i.priority(c);
				if (f !== void 0) {
					let h = n(d);
					h < f && (o[c] = s, i.decrease(c, h));
				}
			}
			if (e.nodeCount() === 0) return r;
			e.nodes().forEach(function(d) {
				i.add(d, Number.POSITIVE_INFINITY), r.setNode(d);
			});
			let l = e.nodes()[0];
			l !== void 0 && i.decrease(l, 0);
			let u = !1;
			for (; i.size() > 0;) {
				if (s = i.removeMin(), s in o) r.setEdge(s, o[s]);
				else {
					if (u) throw new Error("Input graph is not connected: " + e);
					u = !0;
				}
				(t = e.nodeEdges(s)) == null || t.forEach(a);
			}
			return r;
		}
		function rt(e, n, t, r) {
			return ot(e, n, t, r != null ? r : ((o) => {
				var i;
				return (i = e.outEdges(o)) != null ? i : [];
			}));
		}
		function ot(e, n, t, r) {
			if (t === void 0) return J(e, n, t, r);
			let o = !1, i = e.nodes();
			for (let s = 0; s < i.length; s++) {
				let a = i[s];
				if (a === void 0) continue;
				let l = r(a);
				for (let u = 0; u < l.length; u++) {
					let d = l[u];
					if (!d) continue;
					let c = d.v === a ? d.v : d.w;
					t({
						v: c,
						w: c === d.v ? d.w : d.v
					}) < 0 && (o = !0);
				}
				if (o) return Me(e, n, t, r);
			}
			return J(e, n, t, r);
		}
		var T = Q;
		function M(e, n, t, r) {
			let o = r;
			for (; e.hasNode(o);) o = $(r);
			return t.dummy = n, e.setNode(o, t), o;
		}
		function Ye(e) {
			let n = new T().setGraph(e.graph());
			return e.nodes().forEach((t) => n.setNode(t, e.node(t))), e.edges().forEach((t) => {
				let r = n.edge(t.v, t.w) || {
					weight: 0,
					minlen: 1
				}, o = e.edge(t);
				n.setEdge(t.v, t.w, {
					weight: r.weight + o.weight,
					minlen: Math.max(r.minlen, o.minlen)
				});
			}), n;
		}
		function Z(e) {
			let n = new T({ multigraph: e.isMultigraph() }).setGraph(e.graph());
			return e.nodes().forEach((t) => {
				e.children(t).length || n.setNode(t, e.node(t));
			}), e.edges().forEach((t) => {
				n.setEdge(t, e.edge(t));
			}), n;
		}
		function se(e, n) {
			let t = e.x, r = e.y, o = n.x - t, i = n.y - r, s = e.width / 2, a = e.height / 2;
			if (!o && !i) throw new Error("Not possible to find intersection inside of the rectangle");
			let l, u;
			return Math.abs(i) * s > Math.abs(o) * a ? (i < 0 && (a = -a), l = a * o / i, u = a) : (o < 0 && (s = -s), l = s, u = s * i / o), {
				x: t + l,
				y: r + u
			};
		}
		function P(e) {
			let n = A(de(e) + 1).map(() => []);
			return e.nodes().forEach((t) => {
				let r = e.node(t), o = r.rank;
				o !== void 0 && (n[o] || (n[o] = []), n[o][r.order] = t);
			}), n;
		}
		function We(e) {
			let n = e.nodes().map((r) => {
				let o = e.node(r).rank;
				return o === void 0 ? Number.MAX_VALUE : o;
			}), t = R(Math.min, n);
			e.nodes().forEach((r) => {
				let o = e.node(r);
				Object.hasOwn(o, "rank") && (o.rank -= t);
			});
		}
		function Be(e) {
			let n = e.nodes().map((s) => e.node(s).rank).filter((s) => s !== void 0), t = R(Math.min, n), r = [];
			e.nodes().forEach((s) => {
				let a = e.node(s).rank - t;
				r[a] || (r[a] = []), r[a].push(s);
			});
			let o = 0, i = e.graph().nodeRankFactor;
			Array.from(r).forEach((s, a) => {
				s === void 0 && a % i !== 0 ? --o : s !== void 0 && o && s.forEach((l) => e.node(l).rank += o);
			});
		}
		function ae(e, n, t, r) {
			let o = {
				width: 0,
				height: 0
			};
			return arguments.length >= 4 && (o.rank = t, o.order = r), M(e, "border", o, n);
		}
		function it(e, n = Xe) {
			let t = [];
			for (let r = 0; r < e.length; r += n) {
				let o = e.slice(r, r + n);
				t.push(o);
			}
			return t;
		}
		var Xe = 65535;
		function R(e, n) {
			if (n.length > Xe) return e(...it(n).map((r) => e(...r)));
			else return e(...n);
		}
		function de(e) {
			let t = e.nodes().map((r) => {
				let o = e.node(r).rank;
				return o === void 0 ? Number.MIN_VALUE : o;
			});
			return R(Math.max, t);
		}
		function ze(e, n) {
			let t = {
				lhs: [],
				rhs: []
			};
			return e.forEach((r) => {
				n(r) ? t.lhs.push(r) : t.rhs.push(r);
			}), t;
		}
		function le(e, n) {
			let t = Date.now();
			try {
				return n();
			} finally {
				console.log(e + " time: " + (Date.now() - t) + "ms");
			}
		}
		function q(e, n) {
			return n();
		}
		var st = 0;
		function $(e) {
			return e + ("" + ++st);
		}
		function A(e, n, t = 1) {
			n ?? (n = e, e = 0);
			let r = (i) => i < n;
			t < 0 && (r = (i) => n < i);
			let o = [];
			for (let i = e; r(i); i += t) o.push(i);
			return o;
		}
		function B(e, n) {
			let t = {};
			for (let r of n) e[r] !== void 0 && (t[r] = e[r]);
			return t;
		}
		function X(e, n) {
			let t;
			return typeof n == "string" ? t = (r) => r[n] : t = n, Object.entries(e).reduce((r, [o, i]) => (r[o] = t(i, o), r), {});
		}
		function He(e, n) {
			return e.reduce((t, r, o) => (t[r] = n[o], t), {});
		}
		var D = "\0";
		function ee(e, n, t) {
			var u, d, c, f, h, p;
			if (!(e && n && t && n.dummy === "edge" && t.dummy === "edge" && n.edgeObj && t.edgeObj && e[n.edgeObj.v] && e[t.edgeObj.v] && e[n.edgeObj.w] && e[t.edgeObj.w])) return 0;
			let r = !0;
			n.edgeObj.w === t.edgeObj.w && (r = !1);
			let o = r ? (d = (u = e[n.edgeObj.v]) == null ? void 0 : u.rank) != null ? d : NaN : (f = (c = e[n.edgeObj.w]) == null ? void 0 : c.rank) != null ? f : NaN, i = Object.entries(e).find((E) => {
				var y, L;
				return ((y = E[1].edgeObj) == null ? void 0 : y.v) === n.edgeObj.v && ((L = E[1].edgeObj) == null ? void 0 : L.w) === n.edgeObj.w && E[1].rank === o;
			}), s = Object.entries(e).find((E) => {
				var y, L;
				return ((y = E[1].edgeObj) == null ? void 0 : y.v) === t.edgeObj.v && ((L = E[1].edgeObj) == null ? void 0 : L.w) === t.edgeObj.w && E[1].rank === o;
			});
			if (!i || !s) return 0;
			let a = (h = i[1].order) != null ? h : NaN, l = (p = s[1].order) != null ? p : NaN;
			return isNaN(a - l) ? 0 : a - l;
		}
		var ue = "3.1.1";
		var ce = class {
			constructor() {
				je(this, "_sentinel");
				let n = {};
				n._next = n._prev = n, this._sentinel = n;
			}
			dequeue() {
				let n = this._sentinel, t = n._prev;
				if (t !== n) return qe(t), t;
			}
			enqueue(n) {
				let t = this._sentinel;
				n._prev && n._next && qe(n), n._next = t._next, t._next._prev = n, t._next = n, n._prev = t;
			}
			toString() {
				let n = [], t = this._sentinel, r = t._prev;
				for (; r !== t;) n.push(JSON.stringify(r, at)), r = r._prev;
				return "[" + n.join(", ") + "]";
			}
		};
		function qe(e) {
			e._prev._next = e._next, e._next._prev = e._prev, delete e._next, delete e._prev;
		}
		function at(e, n) {
			if (e !== "_next" && e !== "_prev") return n;
		}
		var $e = ce;
		var dt = () => 1;
		function be(e, n) {
			if (e.nodeCount() <= 1) return [];
			let t = ut(e, n || dt);
			return lt(t.graph, t.buckets, t.zeroIdx).flatMap((o) => e.outEdges(o.v, o.w) || []);
		}
		function lt(e, n, t) {
			var a;
			let r = [], o = n[n.length - 1], i = n[0], s;
			for (; e.nodeCount();) {
				for (; s = i.dequeue();) fe(e, n, t, s);
				for (; s = o.dequeue();) fe(e, n, t, s);
				if (e.nodeCount()) {
					for (let l = n.length - 2; l > 0; --l) if (s = (a = n[l]) == null ? void 0 : a.dequeue(), s) {
						r = r.concat(fe(e, n, t, s, !0) || []);
						break;
					}
				}
			}
			return r;
		}
		function fe(e, n, t, r, o) {
			let i = [], s = o ? i : void 0;
			return (e.inEdges(r.v) || []).forEach((a) => {
				let l = e.edge(a), u = e.node(a.v);
				o && i.push({
					v: a.v,
					w: a.w
				}), u.out -= l, he(n, t, u);
			}), (e.outEdges(r.v) || []).forEach((a) => {
				let l = e.edge(a), u = a.w, d = e.node(u);
				d.in -= l, he(n, t, d);
			}), e.removeNode(r.v), s;
		}
		function ut(e, n) {
			let t = new T(), r = 0, o = 0;
			e.nodes().forEach((a) => {
				t.setNode(a, {
					v: a,
					in: 0,
					out: 0
				});
			}), e.edges().forEach((a) => {
				let l = t.edge(a.v, a.w) || 0, u = n(a), d = l + u;
				t.setEdge(a.v, a.w, d);
				let c = t.node(a.v), f = t.node(a.w);
				o = Math.max(o, c.out += u), r = Math.max(r, f.in += u);
			});
			let i = ct(o + r + 3).map(() => new $e()), s = r + 1;
			return t.nodes().forEach((a) => {
				he(i, s, t.node(a));
			}), {
				graph: t,
				buckets: i,
				zeroIdx: s
			};
		}
		function he(e, n, t) {
			var r, o, i;
			t.out ? t.in ? (i = e[t.out - t.in + n]) == null || i.enqueue(t) : (o = e[e.length - 1]) == null || o.enqueue(t) : (r = e[0]) == null || r.enqueue(t);
		}
		function ct(e) {
			let n = [];
			for (let t = 0; t < e; t++) n.push(t);
			return n;
		}
		function Ue(e, n) {
			(e.graph().acyclicer === "greedy" ? be(e, r(e)) : ft(e, n != null ? n : null)).forEach((o) => {
				let i = e.edge(o);
				e.removeEdge(o), i.forwardName = o.name, i.reversed = !0, e.setEdge(o.w, o.v, i, $("rev"));
			});
			function r(o) {
				return (i) => o.edge(i).weight;
			}
		}
		function ft(e, n) {
			let t = [], r = {}, o = {};
			function i(l) {
				Object.hasOwn(o, l) || (o[l] = !0, r[l] = !0, e.outEdges(l).forEach((u) => {
					Object.hasOwn(r, u.w) ? t.push(u) : i(u.w);
				}), delete r[l]);
			}
			function s(l) {
				var u;
				Object.hasOwn(o, l) || (o[l] = !0, r[l] = !0, (u = e.outEdges(l)) == null || u.forEach((d) => {
					var c, f;
					Object.hasOwn(r, d.w) || ((c = n.node(l)) == null ? void 0 : c.rank) > ((f = n.node(d.w)) == null ? void 0 : f.rank) && ht(e, d.w, d) ? t.push(d) : s(d.w);
				}), delete r[l]);
			}
			let a = i;
			return n && typeof n.node == "function" && (a = s), e.sources().forEach(a), e.nodes().forEach(a), t;
		}
		function Je(e) {
			e.edges().forEach((n) => {
				let t = e.edge(n);
				if (t.reversed) {
					e.removeEdge(n);
					let r = t.forwardName;
					delete t.reversed, delete t.forwardName, e.setEdge(n.w, n.v, t, r);
				}
			});
		}
		function ht(e, n, t) {
			let r = /* @__PURE__ */ new Set();
			function o(i) {
				var s;
				if (e.sources().includes(i)) return !0;
				r.add(i);
				for (let a of (s = e.inEdges(i)) != null ? s : []) if (!(a.v === t.v && a.w === t.w) && !r.has(a.v) && o(a.v)) return !0;
				return !1;
			}
			return o(n);
		}
		function Ke(e) {
			e.graph().dummyChains = [], e.edges().forEach((n) => gt(e, n));
		}
		function gt(e, n) {
			let t = n.v, r = e.node(t).rank, o = n.w, i = e.node(o).rank, s = n.name, a = e.edge(n), l = a.labelRank;
			if (i === r + 1) return;
			e.removeEdge(n);
			let u, d, c;
			for (c = 0, ++r; r < i; ++c, ++r) a.points = [], d = {
				width: 0,
				height: 0,
				edgeLabel: a,
				edgeObj: n,
				rank: r
			}, u = M(e, "edge", d, "_d"), r === l && (d.width = a.width, d.height = a.height, d.dummy = "edge-label", d.labelpos = a.labelpos), e.setEdge(t, u, { weight: a.weight }, s), c === 0 && e.graph().dummyChains.push(u), t = u;
			e.setEdge(t, o, { weight: a.weight }, s);
		}
		function Qe(e) {
			e.graph().dummyChains.forEach((n) => {
				let t = e.node(n), r = t.edgeLabel, o;
				for (e.setEdge(t.edgeObj, r); t.dummy;) o = e.successors(n)[0], e.removeNode(n), r.points.push({
					x: t.x,
					y: t.y
				}), t.dummy === "edge-label" && (r.x = t.x, r.y = t.y, r.width = t.width, r.height = t.height), n = o, t = e.node(n);
			});
		}
		function U(e) {
			let n = {};
			function t(r) {
				let o = e.node(r);
				if (Object.hasOwn(n, r)) return o.rank;
				n[r] = !0;
				let i = e.outEdges(r), s = i ? i.map((l) => l == null ? Number.POSITIVE_INFINITY : t(l.w) - e.edge(l).minlen) : [], a = R(Math.min, s);
				return a === Number.POSITIVE_INFINITY && (a = 0), o.rank = a;
			}
			e.sources().forEach(t);
		}
		function V(e, n) {
			return e.node(n.w).rank - e.node(n.v).rank - e.edge(n).minlen;
		}
		var ne = mt;
		function mt(e) {
			let n = new T({ directed: !1 }), t = e.nodes();
			if (t.length === 0) throw new Error("Graph must have at least one node");
			let r = t[0], o = e.nodeCount();
			n.setNode(r, {});
			let i, s;
			for (; Et(n, e) < o && (i = Lt(n, e), !!i);) s = n.hasNode(i.v) ? V(e, i) : -V(e, i), yt(n, e, s);
			return n;
		}
		function Et(e, n) {
			function t(r) {
				let o = n.nodeEdges(r);
				o && o.forEach((i) => {
					let s = i.v, a = r === s ? i.w : s;
					!e.hasNode(a) && !V(n, i) && (e.setNode(a, {}), e.setEdge(r, a, {}), t(a));
				});
			}
			return e.nodes().forEach(t), e.nodeCount();
		}
		function Lt(e, n) {
			return n.edges().reduce((r, o) => {
				let i = Number.POSITIVE_INFINITY;
				return e.hasNode(o.v) !== e.hasNode(o.w) && (i = V(n, o)), i < r[0] ? [i, o] : r;
			}, [Number.POSITIVE_INFINITY, null])[1];
		}
		function yt(e, n, t) {
			e.nodes().forEach((r) => n.node(r).rank += t);
		}
		var { preorder: wt, postorder: Nt } = H, en = Y;
		Y.initLowLimValues = pe;
		Y.initCutValues = ge;
		Y.calcCutValue = nn;
		Y.leaveEdge = rn;
		Y.enterEdge = on;
		Y.exchangeEdges = sn;
		function Y(e) {
			e = Ye(e), U(e);
			let n = ne(e);
			pe(n), ge(n, e);
			let t, r;
			for (; t = rn(n);) r = on(n, e, t), sn(n, e, t, r);
		}
		function ge(e, n) {
			let t = Nt(e, e.nodes());
			t = t.slice(0, t.length - 1), t.forEach((r) => Gt(e, n, r));
		}
		function Gt(e, n, t) {
			let o = e.node(t).parent, i = e.edge(t, o);
			i.cutvalue = nn(e, n, t);
		}
		function nn(e, n, t) {
			let o = e.node(t).parent, i = !0, s = n.edge(t, o), a = 0;
			s || (i = !1, s = n.edge(o, t)), a = s.weight;
			let l = n.nodeEdges(t);
			return l && l.forEach((u) => {
				let d = u.v === t, c = d ? u.w : u.v;
				if (c !== o) {
					let f = d === i, h = n.edge(u).weight;
					if (a += f ? h : -h, kt(e, t, c)) {
						let E = e.edge(t, c).cutvalue;
						a += f ? -E : E;
					}
				}
			}), a;
		}
		function pe(e, n) {
			arguments.length < 2 && (n = e.nodes()[0]), tn(e, {}, 1, n);
		}
		function tn(e, n, t, r, o) {
			let i = t, s = e.node(r);
			n[r] = !0;
			let a = e.neighbors(r);
			return a && a.forEach((l) => {
				Object.hasOwn(n, l) || (t = tn(e, n, t, l, r));
			}), s.low = i, s.lim = t++, o ? s.parent = o : delete s.parent, t;
		}
		function rn(e) {
			return e.edges().find((n) => e.edge(n).cutvalue < 0);
		}
		function on(e, n, t) {
			let r = t.v, o = t.w;
			n.hasEdge(r, o) || (r = t.w, o = t.v);
			let i = e.node(r), s = e.node(o), a = i, l = !1;
			return i.lim > s.lim && (a = s, l = !0), n.edges().filter((d) => l === Ze(e, e.node(d.v), a) && l !== Ze(e, e.node(d.w), a)).reduce((d, c) => V(n, c) < V(n, d) ? c : d);
		}
		function sn(e, n, t, r) {
			let o = t.v, i = t.w;
			e.removeEdge(o, i), e.setEdge(r.v, r.w, {}), pe(e), ge(e, n), vt(e, n);
		}
		function vt(e, n) {
			let t = e.nodes().find((o) => !e.node(o).parent);
			if (!t) return;
			let r = wt(e, [t]);
			r = r.slice(1), r.forEach((o) => {
				let s = e.node(o).parent, a = n.edge(o, s), l = !1;
				a || (a = n.edge(s, o), l = !0), n.node(o).rank = n.node(s).rank + (l ? a.minlen : -a.minlen);
			});
		}
		function kt(e, n, t) {
			return e.hasEdge(n, t);
		}
		function Ze(e, n, t) {
			return t.low <= n.lim && n.lim <= t.lim;
		}
		var dn = xt;
		function xt(e) {
			let n = e.graph().ranker;
			if (typeof n == "function") return n(e);
			switch (n) {
				case "network-simplex":
					an(e);
					break;
				case "tight-tree":
					Ot(e);
					break;
				case "longest-path":
					_t(e);
					break;
				case "none": break;
				default: an(e);
			}
		}
		var _t = U;
		function Ot(e) {
			U(e), ne(e);
		}
		function an(e) {
			en(e);
		}
		var ln = Ct;
		function Ct(e) {
			let n = jt(e), t = e.graph();
			if (!Array.isArray(t.dummyChains)) return;
			t.dummyChains.forEach((o) => {
				let i = e.node(o), s = i.edgeObj, a = Tt(e, n, s.v, s.w), l = a.path, u = a.lca, d = 0, c = l[d], f = !0;
				for (; o !== s.w;) {
					if (i = e.node(o), f) {
						for (; (c = l[d]) !== u && e.node(c).maxRank < i.rank;) d++;
						c === u && (f = !1);
					}
					if (!f) {
						for (; d < l.length - 1 && e.node(l[d + 1]).minRank <= i.rank;) d++;
						c = l[d];
					}
					c !== void 0 && e.setParent(o, c), o = e.successors(o)[0];
				}
			});
		}
		function Tt(e, n, t, r) {
			let o = [], i = [], s = Math.min(n[t].low, n[r].low), a = Math.max(n[t].lim, n[r].lim), l;
			l = t;
			do
				l = e.parent(l), o.push(l);
			while (l && (n[l].low > s || a > n[l].lim));
			let u = l, d = r;
			for (; (d = e.parent(d)) !== u;) i.push(d);
			return {
				path: o.concat(i.reverse()),
				lca: u
			};
		}
		function jt(e) {
			let n = {}, t = 0;
			function r(o) {
				let i = t;
				e.children(o).forEach(r), n[o] = {
					low: i,
					lim: t++
				};
			}
			return e.children(D).forEach(r), n;
		}
		function un(e) {
			let n = M(e, "root", {}, "_root"), t = Rt(e), r = Object.values(t), o = R(Math.max, r) - 1, i = 2 * o + 1;
			e.graph().nestingRoot = n, e.edges().forEach((a) => e.edge(a).minlen *= i);
			let s = It(e) + 1;
			e.children(D).forEach((a) => {
				cn(e, n, i, s, o, t, a);
			}), e.graph().nodeRankFactor = i;
		}
		function cn(e, n, t, r, o, i, s) {
			var c;
			let a = e.children(s);
			if (!a.length) {
				s !== n && e.setEdge(n, s, {
					weight: 0,
					minlen: t
				});
				return;
			}
			let l = ae(e, "_bt"), u = ae(e, "_bb"), d = e.node(s);
			e.setParent(l, s), d.borderTop = l, e.setParent(u, s), d.borderBottom = u, a.forEach((f) => {
				var b;
				cn(e, n, t, r, o, i, f);
				let h = e.node(f), p = h.borderTop ? h.borderTop : f, E = h.borderBottom ? h.borderBottom : f, y = h.borderTop ? r : 2 * r, L = p !== E ? 1 : o - ((b = i[s]) != null ? b : 0) + 1;
				e.setEdge(l, p, {
					weight: y,
					minlen: L,
					nestingEdge: !0
				}), e.setEdge(E, u, {
					weight: y,
					minlen: L,
					nestingEdge: !0
				});
			}), e.parent(s) || e.setEdge(n, l, {
				weight: 0,
				minlen: o + ((c = i[s]) != null ? c : 0)
			});
		}
		function Rt(e) {
			let n = {};
			function t(r, o) {
				let i = e.children(r);
				i && i.length && i.forEach((s) => t(s, o + 1)), n[r] = o;
			}
			return e.children(D).forEach((r) => t(r, 1)), n;
		}
		function It(e) {
			return e.edges().reduce((n, t) => n + e.edge(t).weight, 0);
		}
		function fn(e) {
			let n = e.graph();
			e.removeNode(n.nestingRoot), delete n.nestingRoot, e.edges().forEach((t) => {
				e.edge(t).nestingEdge && e.removeEdge(t);
			});
		}
		var bn = Mt;
		function Mt(e) {
			function n(t) {
				let r = e.children(t), o = e.node(t);
				if (r.length && r.forEach(n), o && Object.hasOwn(o, "minRank")) {
					o.borderLeft = [], o.borderRight = [];
					for (let i = o.minRank, s = o.maxRank + 1; i < s; ++i) hn(e, "borderLeft", "_bl", t, o, i), hn(e, "borderRight", "_br", t, o, i);
				}
			}
			e.children(D).forEach(n);
		}
		function hn(e, n, t, r, o, i) {
			let s = {
				width: 0,
				height: 0,
				rank: i,
				borderType: n
			}, a = o[n][i - 1], l = M(e, "border", s, t);
			o[n][i] = l, e.setParent(l, r), a && e.setEdge(a, l, { weight: 1 });
		}
		function pn(e) {
			var t;
			let n = (t = e.graph().rankdir) == null ? void 0 : t.toLowerCase();
			(n === "lr" || n === "rl") && En(e);
		}
		function mn(e) {
			var t;
			let n = (t = e.graph().rankdir) == null ? void 0 : t.toLowerCase();
			(n === "bt" || n === "rl") && Pt(e), (n === "lr" || n === "rl") && (Ft(e), En(e));
		}
		function En(e) {
			e.nodes().forEach((n) => gn(e.node(n))), e.edges().forEach((n) => gn(e.edge(n)));
		}
		function gn(e) {
			let n = e.width;
			e.width = e.height, e.height = n;
		}
		function Pt(e) {
			e.nodes().forEach((n) => me(e.node(n))), e.edges().forEach((n) => {
				var r;
				let t = e.edge(n);
				(r = t.points) == null || r.forEach(me), Object.hasOwn(t, "y") && me(t);
			});
		}
		function me(e) {
			e.y = -e.y;
		}
		function Ft(e) {
			e.nodes().forEach((n) => Ee(e.node(n))), e.edges().forEach((n) => {
				var r;
				let t = e.edge(n);
				(r = t.points) == null || r.forEach(Ee), Object.hasOwn(t, "x") && Ee(t);
			});
		}
		function Ee(e) {
			let n = e.x;
			e.x = e.y, e.y = n;
		}
		function Le(e, n = null) {
			let t = {}, r = e.nodes().filter((d) => !e.children(d).length), o = r.map((d) => e.node(d).rank), s = A(R(Math.max, o) + 1).map(() => []);
			function a(d) {
				if (t[d]) return;
				t[d] = !0;
				let c = e.node(d);
				s[c.rank].push(d);
				let f = e.successors(d);
				f && [...f].sort((p, E) => u(p, E)).forEach(a);
			}
			r.sort((d, c) => e.node(d).rank - e.node(c).rank).forEach(a);
			function u(d, c) {
				return ee(n, e.node(d), e.node(c));
			}
			return s;
		}
		function ye(e, n) {
			let t = 0;
			for (let r = 1; r < n.length; ++r) t += Vt(e, n[r - 1], n[r]);
			return t;
		}
		function Vt(e, n, t) {
			let r = He(t, t.map((u, d) => d)), o = n.flatMap((u) => {
				let d = e.outEdges(u);
				return d ? d.map((c) => ({
					pos: r[c.w],
					weight: e.edge(c).weight
				})).sort((c, f) => c.pos - f.pos) : [];
			}), i = 1;
			for (; i < t.length;) i <<= 1;
			let s = 2 * i - 1;
			i -= 1;
			let a = new Array(s).fill(0), l = 0;
			return o.forEach((u) => {
				let d = u.pos + i;
				a[d] += u.weight;
				let c = 0;
				for (; d > 0;) d % 2 && (c += a[d + 1]), d = d - 1 >> 1, a[d] += u.weight;
				l += u.weight * c;
			}), l;
		}
		function we(e, n = []) {
			return n.map((t) => {
				let r = e.inEdges(t);
				if (!r || !r.length) return { v: t };
				{
					let o = r.reduce((i, s) => {
						let a = e.edge(s), l = e.node(s.v);
						return {
							sum: i.sum + a.weight * l.order,
							weight: i.weight + a.weight
						};
					}, {
						sum: 0,
						weight: 0
					});
					return {
						v: t,
						barycenter: o.sum / o.weight,
						weight: o.weight
					};
				}
			});
		}
		function Ne(e, n) {
			let t = {};
			e.forEach((o, i) => {
				let s = {
					indegree: 0,
					in: [],
					out: [],
					vs: [o.v],
					i
				};
				o.barycenter !== void 0 && (s.barycenter = o.barycenter, s.weight = o.weight), t[o.v] = s;
			}), n.edges().forEach((o) => {
				let i = t[o.v], s = t[o.w];
				i !== void 0 && s !== void 0 && (s.indegree++, i.out.push(s));
			});
			return Dt(Object.values(t).filter((o) => !o.indegree));
		}
		function Dt(e) {
			let n = [];
			function t(o) {
				return (i) => {
					i.merged || (i.barycenter === void 0 || o.barycenter === void 0 || i.barycenter >= o.barycenter) && Yt(o, i);
				};
			}
			function r(o) {
				return (i) => {
					i.in.push(o), --i.indegree === 0 && e.push(i);
				};
			}
			for (; e.length;) {
				let o = e.pop();
				n.push(o), o.in.reverse().forEach(t(o)), o.out.forEach(r(o));
			}
			return n.filter((o) => !o.merged).map((o) => B(o, [
				"vs",
				"i",
				"barycenter",
				"weight"
			]));
		}
		function Yt(e, n) {
			let t = 0, r = 0;
			e.weight && (t += e.barycenter * e.weight, r += e.weight), n.weight && (t += n.barycenter * n.weight, r += n.weight), e.vs = n.vs.concat(e.vs), e.barycenter = t / r, e.weight = r, e.i = Math.min(n.i, e.i), n.merged = !0;
		}
		function Ge(e, n, t, r, o) {
			let i = {}, s = null, a = null, l = o;
			typeof n == "boolean" ? (l = n, i = {}) : n && (i = n, s = t != null ? t : null, a = r != null ? r : null);
			let u = ze(e, (L) => Object.hasOwn(L, "barycenter")), d = u.lhs, c = u.rhs.sort((L, b) => b.i - L.i), f = [], h = 0, p = 0, E = 0;
			d.sort(Wt(a, s, !!l));
			for (let [L, b] of Object.entries(i)) {
				let g = d.findIndex((m) => m.vs[0] === L);
				d.splice(g + 1, 0, b);
			}
			E = Ln(f, c, E), d.forEach((L) => {
				E += L.vs.length, f.push(L.vs), h += L.barycenter * L.weight, p += L.weight, E = Ln(f, c, E);
			});
			let y = { vs: f.flat(1) };
			return p && (y.barycenter = h / p, y.weight = p), y;
		}
		function Ln(e, n, t) {
			let r;
			for (; n.length && (r = n[n.length - 1]).i <= t;) n.pop(), e.push(r.vs), t++;
			return t;
		}
		function Wt(e, n, t) {
			return (r, o) => {
				if (r.barycenter < o.barycenter) return -1;
				if (r.barycenter > o.barycenter) return 1;
				if (e && (typeof r.vs[0] == "string" || typeof o.vs[0] == "string")) {
					let a = ee(n, e.node(r.vs[0]), e.node(o.vs[0]));
					if (a !== 0) return a;
				}
				return t ? o.i - r.i : r.i - o.i;
			};
		}
		function te(e, n, t, r, o) {
			var L, b, g, m, w, k, _, C, j, I, S;
			let i = null, s = o;
			typeof r == "boolean" ? (s = r, i = null) : r !== void 0 && (i = r);
			let a = e.children(n), l = e.node(n), u = l ? l.borderLeft : void 0, d = l ? l.borderRight : void 0, c = {};
			u && (a = a.filter((G) => G !== u && G !== d));
			let f = we(e, a);
			f.forEach((G) => {
				if (e.children(G.v).length) {
					let { result: x } = te(e, G.v, t, i, s);
					c[G.v] = x, Object.hasOwn(x, "barycenter") && Xt(G, x);
				}
			});
			let h = Ne(f, t);
			Bt(h, c);
			let p = {}, E = !1;
			for (let G = 0; G < h.length; G++) for (let x = G + 1; x < h.length; x++) if (!(!h[G] || !h[x] || !((L = h[G]) != null && L.barycenter) || !((b = h[x]) != null && b.barycenter)) && ((g = h[G]) == null ? void 0 : g.barycenter) === h[x].barycenter) {
				let v = (w = (m = h[G]) == null ? void 0 : m.vs[0]) != null ? w : "", N = (_ = (k = h[x]) == null ? void 0 : k.vs[0]) != null ? _ : "", O = e.node(v), W = e.node(N);
				if (O.dummy === "edge" && W.dummy === "edge" && ((C = O.edgeObj) == null ? void 0 : C.v) === ((j = W.edgeObj) == null ? void 0 : j.v) && ((I = O.edgeObj) == null ? void 0 : I.w) === ((S = W.edgeObj) == null ? void 0 : S.w)) if (O.edgeLabel.reversed) {
					p[N] = h[G], h.splice(G, 1), G--;
					break;
				} else p[v] = h[x], h.splice(x, 1), x--;
				else E = !0;
			}
			let y = Ge(h, p, i, e, s);
			if (u && d) {
				y.vs = [
					u,
					y.vs,
					d
				].flat(1);
				let G = e.predecessors(u);
				if (G && G.length) {
					let x = e.node(G[0]), v = e.predecessors(d), N = e.node(v[0]);
					Object.hasOwn(y, "barycenter") || (y.barycenter = 0, y.weight = 0), y.barycenter = (y.barycenter * y.weight + x.order + N.order) / (y.weight + 2), y.weight += 2;
				}
			}
			return Object.defineProperty(y, "result", {
				value: y,
				enumerable: !1,
				configurable: !0,
				writable: !0
			}), Object.defineProperty(y, "usedBias", {
				value: E,
				enumerable: !1,
				configurable: !0,
				writable: !0
			}), y;
		}
		function Bt(e, n) {
			e.forEach((t) => {
				t.vs = t.vs.flatMap((r) => n[r] ? n[r].vs : r);
			});
		}
		function Xt(e, n) {
			e.barycenter !== void 0 ? (e.barycenter = (e.barycenter * e.weight + n.barycenter * n.weight) / (e.weight + n.weight), e.weight += n.weight) : (e.barycenter = n.barycenter, e.weight = n.weight);
		}
		function ve(e, n, t, r) {
			r || (r = e.nodes());
			let o = zt(e), i = new T({ compound: !0 }).setGraph({ root: o }).setDefaultNodeLabel((s) => e.node(s));
			return r.forEach((s) => {
				let a = e.node(s), l = e.parent(s);
				if (a.rank === n || a.minRank <= n && n <= a.maxRank) {
					i.setNode(s), i.setParent(s, l || o);
					let u = e[t](s);
					u && u.forEach((d) => {
						let c = d.v === s ? d.w : d.v, f = i.edge(c, s), h = f !== void 0 ? f.weight : 0;
						i.setEdge(c, s, { weight: e.edge(d).weight + h });
					}), Object.hasOwn(a, "minRank") && i.setNode(s, {
						borderLeft: a.borderLeft[n],
						borderRight: a.borderRight[n]
					});
				}
			}), i;
		}
		function zt(e) {
			let n;
			for (; e.hasNode(n = $("_root")););
			return n;
		}
		function ke(e, n, t) {
			let r = {}, o;
			t.forEach((i) => {
				let s = e.parent(i), a, l;
				for (; s;) {
					if (a = e.parent(s), a ? (l = r[a], r[a] = s) : (l = o, o = s), l && l !== s) {
						n.setEdge(l, s);
						return;
					}
					s = a;
				}
			});
		}
		function re(e, n = {}, t = null) {
			if (typeof n.customOrder == "function") {
				n.customOrder(e, re);
				return;
			}
			let r = de(e), o = yn(e, A(1, r + 1), "inEdges"), i = yn(e, A(r - 1, -1, -1), "outEdges"), s = Le(e, t);
			if (wn(e, s), n.disableOptimalOrderHeuristic) return;
			let a = Number.POSITIVE_INFINITY, l, u = n.constraints || [];
			for (let d = 0, c = 0; c < 4; ++d, ++c) {
				Ht(d % 2 ? o : i, d % 4 >= 2, u, t), s = P(e);
				let f = ye(e, s);
				f < a ? (c = 0, l = Object.assign({}, s), a = f) : f === a && (l = structuredClone(s));
			}
			wn(e, l);
		}
		function yn(e, n, t) {
			let r = /* @__PURE__ */ new Map(), o = (i, s) => {
				r.has(i) || r.set(i, []), r.get(i).push(s);
			};
			for (let i of e.nodes()) {
				let s = e.node(i);
				if (typeof s.rank == "number" && o(s.rank, i), typeof s.minRank == "number" && typeof s.maxRank == "number") for (let a = s.minRank; a <= s.maxRank; a++) a !== s.rank && o(a, i);
			}
			return n.map(function(i) {
				return ve(e, i, t, r.get(i) || []);
			});
		}
		function Ht(e, n, t, r) {
			let o = !0, i = new T();
			e.forEach(function(s) {
				t.forEach((d) => i.setEdge(d.left, d.right));
				let a = s.graph().root, { result: l, usedBias: u } = te(s, a, i, r, o);
				n && u && (o = !o), l.vs.forEach((d, c) => s.node(d).order = c), ke(s, i, l.vs);
			});
		}
		function wn(e, n) {
			Object.values(n).forEach((t) => t.forEach((r, o) => e.node(r).order = o));
		}
		function qt(e, n) {
			let t = {};
			function r(o, i) {
				let s = 0, a = 0, l = o.length, u = i[i.length - 1];
				return i.forEach((d, c) => {
					let f = Ut(e, d), h = f ? e.node(f).order : l;
					(f || d === u) && (i.slice(a, c + 1).forEach((p) => {
						let E = e.predecessors(p);
						E && E.forEach((y) => {
							let L = e.node(y), b = L.order;
							(b < s || h < b) && !(L.dummy && e.node(p).dummy) && Gn(t, y, p);
						});
					}), a = c + 1, s = h);
				}), i;
			}
			return n.length && n.reduce(r), t;
		}
		function $t(e, n) {
			let t = {};
			function r(i, s, a, l, u) {
				A(s, a).forEach((d) => {
					let c = i[d];
					if (c !== void 0 && e.node(c).dummy) {
						let f = e.predecessors(c);
						f && f.forEach((h) => {
							if (h === void 0) return;
							let p = e.node(h);
							p.dummy && (p.order < l || p.order > u) && Gn(t, h, c);
						});
					}
				});
			}
			function o(i, s) {
				let a = -1, l = -1, u = 0;
				return s.forEach((d, c) => {
					if (e.node(d).dummy === "border") {
						let f = e.predecessors(d);
						if (f && f.length) {
							let h = f[0];
							if (h === void 0) return;
							l = e.node(h).order, r(s, u, c, a, l), u = c, a = l;
						}
					}
					r(s, u, s.length, l, i.length);
				}), s;
			}
			return n.length && n.reduce(o), t;
		}
		function Ut(e, n) {
			if (e.node(n).dummy) {
				let t = e.predecessors(n);
				if (t) return t.find((r) => e.node(r).dummy);
			}
		}
		function Gn(e, n, t) {
			if (n > t) {
				let o = n;
				n = t, t = o;
			}
			let r = e[n];
			r || (e[n] = r = {}), r[t] = !0;
		}
		function Jt(e, n, t) {
			if (n > t) {
				let o = n;
				n = t, t = o;
			}
			let r = e[n];
			return r !== void 0 && Object.hasOwn(r, t);
		}
		function Kt(e, n, t, r, o) {
			let i = {}, s = {}, a = {};
			return n.forEach((l) => {
				l.forEach((u, d) => {
					i[u] = u, s[u] = u, a[u] = d;
				});
			}), n.forEach((l) => {
				let u = -1, d = -1, c = !1, f = l, h = l.findIndex((p) => (o == null ? void 0 : o.includes(p)) || Nn(p, e, o));
				h > 0 && (f = [
					l[h],
					...l.slice(0, h),
					...l.slice(h + 1)
				], c = !0), f.forEach((p) => {
					var y;
					let E = r(p);
					if (E && E.length) {
						o != null && o.includes(p) && (E = E.filter((g) => Nn(g, e, o)));
						let L = E.sort((g, m) => {
							let w = a[g], k = a[m];
							return (w !== void 0 ? w : 0) - (k !== void 0 ? k : 0);
						}), b = (L.length - 1) / 2;
						for (let g = Math.floor(b), m = Math.ceil(b); g <= m; ++g) {
							let w = L[g];
							if (w === void 0) continue;
							let k = a[w];
							if (k !== void 0 && s[p] === p && u < k && a[w] !== d && !Jt(t, p, w)) {
								let _ = i[w];
								_ !== void 0 && (s[w] = p, s[p] = i[p] = _, u = k, c && (u = -1, d = (y = a[w]) != null ? y : -1, c = !1));
							}
						}
					}
				});
			}), {
				root: i,
				align: s
			};
		}
		function Qt(e, n, t, r, o = !1) {
			let i = {}, s = Zt(e, n, t, o), a = o ? "borderLeft" : "borderRight";
			function l(h, p) {
				let E = s.nodes().slice(), y = {}, L = E.pop();
				for (; L;) {
					if (y[L]) h(L);
					else {
						y[L] = !0, E.push(L);
						for (let b of p(L)) E.push(b);
					}
					L = E.pop();
				}
			}
			function u(h) {
				let p = s.inEdges(h);
				p ? i[h] = p.reduce((E, y) => {
					var g;
					let L = (g = i[y.v]) != null ? g : 0, b = s.edge(y);
					return Math.max(E, L + (b !== void 0 ? b : 0));
				}, 0) : i[h] = 0;
			}
			function d(h) {
				let p = s.outEdges(h), E = Number.POSITIVE_INFINITY;
				p && (E = p.reduce((L, b) => {
					let g = i[b.w], m = s.edge(b);
					return Math.min(L, (g !== void 0 ? g : 0) - (m !== void 0 ? m : 0));
				}, Number.POSITIVE_INFINITY));
				let y = e.node(h);
				E !== Number.POSITIVE_INFINITY && y.borderType !== a && (i[h] = Math.max(i[h] !== void 0 ? i[h] : 0, E));
			}
			function c(h) {
				return s.predecessors(h) || [];
			}
			function f(h) {
				return s.successors(h) || [];
			}
			return l(u, c), l(d, f), Object.keys(r).forEach((h) => {
				var E;
				let p = t[h];
				p !== void 0 && (i[h] = (E = i[p]) != null ? E : 0);
			}), i;
		}
		function Zt(e, n, t, r) {
			let o = new T(), i = e.graph(), s = rr(i.nodesep, i.edgesep, r);
			return n.forEach((a) => {
				let l;
				a.forEach((u) => {
					let d = t[u];
					if (d !== void 0) {
						if (o.setNode(d), l !== void 0) {
							let c = t[l];
							if (c !== void 0) {
								let f = o.edge(c, d);
								o.setEdge(c, d, Math.max(s(e, u, l), f || 0));
							}
						}
						l = u;
					}
				});
			}), o;
		}
		function er(e, n) {
			return Object.values(n).reduce((t, r) => {
				let o = Number.NEGATIVE_INFINITY, i = Number.POSITIVE_INFINITY;
				Object.entries(r).forEach(([a, l]) => {
					let u = or(e, a) / 2;
					o = Math.max(l + u, o), i = Math.min(l - u, i);
				});
				let s = o - i;
				return s < t[0] && (t = [s, r]), t;
			}, [Number.POSITIVE_INFINITY, null])[1];
		}
		function nr(e, n) {
			let t = Object.values(n), r = R(Math.min, t), o = R(Math.max, t);
			["u", "d"].forEach((i) => {
				["l", "r"].forEach((s) => {
					let a = i + s, l = e[a];
					if (!l || l === n) return;
					let u = Object.values(l), d = r - R(Math.min, u);
					s !== "l" && (d = o - R(Math.max, u)), d && (e[a] = X(l, (c) => c + d));
				});
			});
		}
		function tr(e, n = void 0) {
			let t = e.ul;
			return t ? X(t, (r, o) => {
				var s, a;
				if (n) {
					let u = e[n.toLowerCase()];
					if (u && u[o] !== void 0) return u[o];
				}
				let i = Object.values(e).map((l) => {
					let u = l[o];
					return u !== void 0 ? u : 0;
				}).sort((l, u) => l - u);
				return (((s = i[1]) != null ? s : 0) + ((a = i[2]) != null ? a : 0)) / 2;
			}) : {};
		}
		function vn(e, n) {
			let t = P(e), r = Object.assign(qt(e, t), $t(e, t)), o = {}, i;
			["u", "d"].forEach((a) => {
				i = a === "u" ? t : Object.values(t).reverse(), ["l", "r"].forEach((l) => {
					l === "r" && (i = i.map((f) => Object.values(f).reverse()));
					let d = Kt(e, i, r, (f) => (a === "u" ? e.predecessors(f) : e.successors(f)) || [], n), c = Qt(e, i, d.root, d.align, l === "r");
					l === "r" && (c = X(c, (f) => -f)), o[a + l] = c;
				});
			});
			return nr(o, er(e, o)), tr(o, e.graph().align);
		}
		function rr(e, n, t) {
			return (r, o, i) => {
				let s = r.node(o), a = r.node(i), l = 0, u;
				if (l += s.width / 2, Object.hasOwn(s, "labelpos")) switch (s.labelpos.toLowerCase()) {
					case "l":
						u = -s.width / 2;
						break;
					case "r":
						u = s.width / 2;
						break;
				}
				if (u && (l += t ? u : -u), u = void 0, l += (s.dummy ? n : e) / 2, l += (a.dummy ? n : e) / 2, l += a.width / 2, Object.hasOwn(a, "labelpos")) switch (a.labelpos.toLowerCase()) {
					case "l":
						u = a.width / 2;
						break;
					case "r":
						u = -a.width / 2;
						break;
				}
				return u && (l += t ? u : -u), l;
			};
		}
		function or(e, n) {
			return e.node(n).width;
		}
		function Nn(e, n, t) {
			var s;
			if (!t) return !1;
			let r = (s = n.node(e)) == null ? void 0 : s.edgeObj;
			if (!r || n.node(e).edgeLabel.reversed) return !1;
			let o = t.indexOf(r == null ? void 0 : r.v), i = t.indexOf(r == null ? void 0 : r.w);
			return o !== -1 && i !== -1 && o === (i + 1) % t.length || o === (i - 1) % t.length;
		}
		function kn(e, n) {
			e = Z(e), ir(e), Object.entries(vn(e, n)).forEach(([t, r]) => e.node(t).x = r);
		}
		function ir(e) {
			let n = P(e), t = e.graph(), r = t.ranksep, o = t.rankalign, i = 0;
			n.forEach((s) => {
				let a = s.reduce((l, u) => {
					var c;
					let d = (c = e.node(u).height) != null ? c : 0;
					return l > d ? l : d;
				}, 0);
				s.forEach((l) => {
					let u = e.node(l);
					o === "top" ? u.y = i + u.height / 2 : o === "bottom" ? u.y = i + a - u.height / 2 : u.y = i + a / 2;
				}), i += a + r;
			});
		}
		var xn = /* @__PURE__ */ new WeakMap();
		function Oe(e, n = {}) {
			return Rn(e, q, n), e;
		}
		function _n(e, n, t) {
			let r = n;
			for (; r !== void 0;) {
				let o = e.parent(r);
				if (o === t) return r;
				r = o;
			}
		}
		function Rn(e, n, t) {
			var L;
			let r = e.nodes().filter((b) => e.children(b).length), o = {};
			r.forEach((b) => {
				let g = e.node(b);
				if (g && g.rankdir) {
					let m = new T({
						multigraph: !0,
						compound: !0
					});
					m.setGraph({ rankdir: g.rankdir });
					let w = e.children(b);
					w.forEach((v) => {
						let N = { ...e.node(v) };
						m.setNode(v, N);
						let O = e.parent(v);
						O && O !== b && w.includes(O) && m.setParent(v, O);
					});
					let k = /* @__PURE__ */ new Set();
					e.edges().forEach((v) => {
						let N = _n(e, v.v, b), O = _n(e, v.w, b);
						if (N && O && N !== O) {
							let W = `${N}\0${O}`;
							k.has(W) || (k.add(W), m.setEdge(N, O, { ...e.edge(v) }));
						}
					}), Rn(m, n, t);
					let _ = jn(m);
					On(_, n, t, null), Cn(m, _);
					let C = Infinity, j = Infinity, I = -Infinity, S = -Infinity;
					m.nodes().forEach((v) => {
						if (v === b) return;
						let N = m.node(v);
						N && typeof N.x == "number" && typeof N.y == "number" && typeof N.width == "number" && typeof N.height == "number" && (C = Math.min(C, N.x - N.width / 2), I = Math.max(I, N.x + N.width / 2), j = Math.min(j, N.y - N.height / 2), S = Math.max(S, N.y + N.height / 2));
					}), (!isFinite(C) || !isFinite(j) || !isFinite(I) || !isFinite(S)) && (C = j = 0, I = S = 0);
					let G = I - C, x = S - j;
					o[b] = {
						minX: C,
						minY: j,
						maxX: I,
						maxY: S,
						width: G,
						height: x,
						offsetX: C,
						offsetY: j
					}, g._dagreClusterSubgraph = m;
				}
			});
			let i = [], s = (b) => {
				let g = [], m = (e.children(b) || []).filter((w) => w !== b);
				for (; m.length > 0;) {
					let w = m.shift();
					g.push(w), (e.children(w) || []).filter((k) => k !== w).forEach((k) => m.push(k));
				}
				return g;
			}, a = /* @__PURE__ */ new Map();
			r.forEach((b) => {
				let g = e.node(b);
				g && g.rankdir && o[b] && a.set(b, (e.children(b) || []).filter((m) => m !== b));
			});
			let l = new Set([...a.values()].flat()), u = /* @__PURE__ */ new Map();
			a.forEach((b, g) => {
				l.has(g) || u.set(g, s(g));
			});
			let d = new Set([...u.values()].flat()), c = (b) => {
				for (let [g, m] of u) if (m.includes(b)) return g;
				return b;
			}, f = [];
			e.edges().forEach((b) => {
				(d.has(b.v) || d.has(b.w)) && f.push({
					edge: b,
					label: e.edge(b)
				});
			});
			let h = /* @__PURE__ */ new Map();
			d.forEach((b) => {
				let g = e.parent(b);
				h.set(b, typeof g == "string" ? g : void 0);
			}), u.forEach((b, g) => {
				let m = e.node(g), w = [];
				b.forEach((C) => {
					let j = e.node(C);
					j && (w.push({
						id: C,
						node: j,
						parent: h.get(C)
					}), e.removeNode(C));
				});
				let k = f.filter(({ edge: C }) => b.includes(C.v) || b.includes(C.w)), _ = o[g];
				m && (i.push({
					clusterId: g,
					subgraph: m._dagreClusterSubgraph,
					bounds: _,
					children: b,
					removedNodes: w,
					removedEdges: k
				}), m.width = _.width, m.height = _.height);
			});
			let p = /* @__PURE__ */ new Set();
			f.forEach(({ edge: b, label: g }) => {
				let m = c(b.v), w = c(b.w);
				if (m !== w && e.hasNode(m) && e.hasNode(w)) {
					let k = `${m}\0${w}`;
					p.has(k) || (p.add(k), e.setEdge(m, w, {
						...g,
						width: 0,
						height: 0
					}));
				}
			});
			let E = jn(e), y = On(E, n, t, (L = xn.get(e)) != null ? L : null);
			xn.set(e, y), Cn(e, E), p.forEach((b) => {
				let g = b.indexOf("\0"), m = b.slice(0, g), w = b.slice(g + 1);
				e.hasEdge(m, w) && e.removeEdge(m, w);
			}), i.forEach(({ clusterId: b, subgraph: g, bounds: m, removedNodes: w, removedEdges: k }) => {
				var G, x;
				let _ = e.node(b), C = (G = _ == null ? void 0 : _.x) != null ? G : 0, j = (x = _ == null ? void 0 : _.y) != null ? x : 0, I = (m.minX + m.maxX) / 2, S = (m.minY + m.maxY) / 2;
				w.forEach(({ id: v, node: N, parent: O }) => {
					e.setNode(v, N), O !== void 0 && e.setParent(v, O);
				}), k.forEach(({ edge: v, label: N }) => {
					e.setEdge(v, N);
				}), g.nodes().forEach((v) => {
					if (v === b) return;
					let N = g.node(v), O = e.node(v);
					O && N && typeof N.x == "number" && typeof N.y == "number" && (O.x = C + (N.x - I), O.y = j + (N.y - S));
				}), delete _._dagreClusterSubgraph;
			}), r.forEach((b) => {
				var w, k;
				let g = e.node(b), m = o[b];
				if (g && g.rankdir && g._dagreClusterSubgraph && m) {
					let _ = g._dagreClusterSubgraph, C = (w = g.x) != null ? w : 0, j = (k = g.y) != null ? k : 0, I = (m.minX + m.maxX) / 2, S = (m.minY + m.maxY) / 2;
					_.nodes().forEach((G) => {
						if (G === b) return;
						let x = _.node(G), v = e.node(G);
						if (v && x && typeof x.x == "number" && typeof x.y == "number") {
							let N = x.x - I, O = x.y - S;
							v.x = C + N, v.y = j + O;
						}
					}), delete g._dagreClusterSubgraph;
				}
			});
		}
		function On(e, n, t, r = null) {
			var l, u;
			let o = (t == null ? void 0 : t.useDynamic) !== !1, i = o && (l = r == null ? void 0 : r.graph) != null ? l : null, s = o && (u = r == null ? void 0 : r.rawNodes) != null ? u : null;
			n("    makeSpaceForEdgeLabels", () => hr(e)), n("    removeSelfEdges", () => Nr(e)), n("    acyclic", () => Ue(e, i)), n("    nestingGraph.run", () => un(e)), n("    rank", () => dn(Z(e))), n("    injectEdgeLabelProxies", () => br(e)), n("    removeEmptyRanks", () => Be(e)), n("    nestingGraph.cleanup", () => fn(e)), n("    normalizeRanks", () => We(e)), n("    assignRankMinMax", () => gr(e)), n("    removeEdgeLabelProxies", () => pr(e)), n("    normalize.run", () => Ke(e)), n("    parentDummyChains", () => ln(e)), n("    addBorderSegments", () => bn(e)), n("    order", () => re(e, t, s)), n("    insertSelfEdges", () => Gr(e)), n("    adjustCoordinateSystem", () => pn(e)), n("    position", () => kn(e, t.corePath)), n("    positionSelfEdges", () => vr(e));
			let a = JSON.parse(JSON.stringify(e._nodes));
			return n("    removeBorderNodes", () => wr(e)), n("    normalize.undo", () => Qe(e)), n("    fixupEdgeLabelCoords", () => Lr(e)), n("    undoCoordinateSystem", () => mn(e)), n("    translateGraph", () => mr(e)), n("    assignNodeIntersects", () => Er(e)), n("    reversePoints", () => yr(e)), n("    acyclic.undo", () => Je(e)), {
				graph: e,
				rawNodes: a
			};
		}
		function Cn(e, n) {
			e.nodes().forEach((t) => {
				let r = e.node(t), o = n.node(t);
				r && (r.x = o.x, r.y = o.y, r.order = o.order, r.rank = o.rank, n.children(t).length && (r.width = o.width, r.height = o.height));
			}), e.edges().forEach((t) => {
				let r = e.edge(t), o = n.edge(t);
				r.points = o.points, Object.hasOwn(o, "x") && (r.x = o.x, r.y = o.y);
			}), e.graph().width = n.graph().width, e.graph().height = n.graph().height;
		}
		var sr = [
			"nodesep",
			"edgesep",
			"ranksep",
			"marginx",
			"marginy"
		];
		var ar = {
			ranksep: 50,
			edgesep: 20,
			nodesep: 50,
			rankdir: "TB",
			rankalign: "center"
		};
		var dr = [
			"acyclicer",
			"ranker",
			"rankdir",
			"align",
			"rankalign"
		];
		var lr = [
			"width",
			"height",
			"rank"
		];
		var Tn = {
			width: 0,
			height: 0
		};
		var ur = [
			"minlen",
			"weight",
			"width",
			"height",
			"labeloffset"
		];
		var cr = {
			minlen: 1,
			weight: 1,
			width: 0,
			height: 0,
			labeloffset: 10,
			labelpos: "r"
		};
		var fr = ["labelpos"];
		function jn(e) {
			let n = new T({
				multigraph: !0,
				compound: !0
			}), t = _e(e.graph());
			return n.setGraph(Object.assign({}, ar, xe(t, sr), B(t, dr))), e.nodes().forEach((r) => {
				let i = xe(_e(e.node(r)), lr);
				Object.keys(Tn).forEach((a) => {
					i[a] === void 0 && (i[a] = Tn[a]);
				}), n.setNode(r, i);
				let s = e.parent(r);
				s !== void 0 && n.setParent(r, s);
			}), e.edges().forEach((r) => {
				let o = _e(e.edge(r));
				n.setEdge(r, Object.assign({}, cr, xe(o, ur), B(o, fr)));
			}), n;
		}
		function hr(e) {
			let n = e.graph();
			n.ranksep /= 2, e.edges().forEach((t) => {
				var o;
				let r = e.edge(t);
				r.minlen *= 2, ((o = r.labelpos) != null ? o : "r").toLowerCase() !== "c" && (n.rankdir === "TB" || n.rankdir === "BT" ? r.width += r.labeloffset : r.height += r.labeloffset);
			});
		}
		function br(e) {
			e.edges().forEach((n) => {
				let t = e.edge(n);
				if (t.width && t.height) {
					let r = e.node(n.v);
					M(e, "edge-proxy", {
						rank: (e.node(n.w).rank - r.rank) / 2 + r.rank,
						e: n
					}, "_ep");
				}
			});
		}
		function gr(e) {
			let n = 0;
			e.nodes().forEach((t) => {
				let r = e.node(t);
				r.borderTop && (r.minRank = e.node(r.borderTop).rank, r.maxRank = e.node(r.borderBottom).rank, n = Math.max(n, r.maxRank));
			}), e.graph().maxRank = n;
		}
		function pr(e) {
			e.nodes().forEach((n) => {
				let t = e.node(n);
				if (t.dummy === "edge-proxy") {
					let r = t;
					e.edge(r.e).labelRank = t.rank, e.removeNode(n);
				}
			});
		}
		function mr(e) {
			let n = Number.POSITIVE_INFINITY, t = 0, r = Number.POSITIVE_INFINITY, o = 0, i = e.graph(), s = i.marginx || 0, a = i.marginy || 0;
			function l(u) {
				let d = u.x, c = u.y, f = u.width, h = u.height;
				n = Math.min(n, d - f / 2), t = Math.max(t, d + f / 2), r = Math.min(r, c - h / 2), o = Math.max(o, c + h / 2);
			}
			e.nodes().forEach((u) => l(e.node(u))), e.edges().forEach((u) => {
				let d = e.edge(u);
				Object.hasOwn(d, "x") && l(d);
			}), n -= s, r -= a, e.nodes().forEach((u) => {
				let d = e.node(u);
				d.x -= n, d.y -= r;
			}), e.edges().forEach((u) => {
				let d = e.edge(u);
				d.points.forEach((c) => {
					c.x -= n, c.y -= r;
				}), Object.hasOwn(d, "x") && (d.x -= n), Object.hasOwn(d, "y") && (d.y -= r);
			}), i.width = t - n + s, i.height = o - r + a;
		}
		function Er(e) {
			e.edges().forEach((n) => {
				if (n.v === n.w) return;
				let t = e.edge(n), r = e.node(n.v), o = e.node(n.w), i, s;
				t.points ? (i = t.points[0], s = t.points[t.points.length - 1]) : (t.points = [], i = o, s = r), t.points.unshift(se(r, i)), t.points.push(se(o, s));
			});
		}
		function Lr(e) {
			e.edges().forEach((n) => {
				let t = e.edge(n);
				if (Object.hasOwn(t, "x")) switch ((t.labelpos === "l" || t.labelpos === "r") && (t.width -= t.labeloffset), t.labelpos) {
					case "l":
						t.x -= t.width / 2 + t.labeloffset;
						break;
					case "r":
						t.x += t.width / 2 + t.labeloffset;
						break;
				}
			});
		}
		function yr(e) {
			e.edges().forEach((n) => {
				let t = e.edge(n);
				t.reversed && t.points.reverse();
			});
		}
		function wr(e) {
			e.nodes().forEach((n) => {
				if (e.children(n).length) {
					let t = e.node(n), r = e.node(t.borderTop), o = e.node(t.borderBottom), i = e.node(t.borderLeft[t.borderLeft.length - 1]), s = e.node(t.borderRight[t.borderRight.length - 1]);
					t.width = Math.abs(s.x - i.x), t.height = Math.abs(o.y - r.y), t.x = i.x + t.width / 2, t.y = r.y + t.height / 2;
				}
			}), e.nodes().forEach((n) => {
				e.node(n).dummy === "border" && e.removeNode(n);
			});
		}
		function Nr(e) {
			e.edges().forEach((n) => {
				if (n.v === n.w) {
					let t = e.node(n.v);
					t.selfEdges || (t.selfEdges = []), t.selfEdges.push({
						e: n,
						label: e.edge(n)
					}), e.removeEdge(n);
				}
			});
		}
		function Gr(e) {
			P(e).forEach((t) => {
				let r = 0;
				t.forEach((o, i) => {
					let s = e.node(o);
					typeof s.rank != "number" && (s.rank = 0), s.order = i + r, (s.selfEdges || []).forEach((a) => {
						M(e, "selfedge", {
							width: a.label.width,
							height: a.label.height,
							rank: s.rank,
							order: i + ++r,
							e: a.e,
							edgeLabel: a.label
						}, "_se"), (!Array.isArray(a.label.points) || a.label.points.length !== 7) && (a.label.points = [
							{
								x: 0,
								y: -10
							},
							{
								x: 0,
								y: -10
							},
							{
								x: 0,
								y: 0
							},
							{
								x: 0,
								y: 10
							},
							{
								x: 0,
								y: 10
							},
							{
								x: 0,
								y: 0
							},
							{
								x: 0,
								y: 0
							}
						]);
					}), delete s.selfEdges;
				});
			});
		}
		function vr(e) {
			e.nodes().forEach((n) => {
				let t = e.node(n), r = (o) => typeof o == "number" && isFinite(o);
				if (t.dummy === "selfedge") {
					let o = t, i = e.node(o.e.v), s = r(i == null ? void 0 : i.x) ? i.x : 0, a = r(i == null ? void 0 : i.y) ? i.y : 0, l = r(i == null ? void 0 : i.width) ? i.width : 0, u = r(i == null ? void 0 : i.height) ? i.height : 0, d = r(t.x) ? t.x : s, c = r(t.y) ? t.y : a, f = l / 2, h = u / 2;
					o.edgeLabel.points = [
						{
							x: d + f,
							y: c - h
						},
						{
							x: d + f,
							y: c - h
						},
						{
							x: d,
							y: c
						},
						{
							x: d - f,
							y: c + h
						},
						{
							x: d - f,
							y: c + h
						},
						{
							x: d,
							y: c
						},
						{
							x: d,
							y: c
						}
					], o.edgeLabel.x = d, o.edgeLabel.y = c, e.setEdge(o.e, o.edgeLabel), e.removeNode(n);
				} else t && Array.isArray(t.selfEdges) && t.selfEdges.forEach((o) => {
					if (!Array.isArray(o.label.points) || o.label.points.length !== 7) {
						let i = r(t.x) ? t.x : 0, s = r(t.y) ? t.y : 0, a = r(t.width) ? t.width : 0, l = r(t.height) ? t.height : 0, u = a / 2, d = l / 2;
						o.label.points = [
							{
								x: i + u,
								y: s - d
							},
							{
								x: i + u,
								y: s - d
							},
							{
								x: i,
								y: s
							},
							{
								x: i - u,
								y: s + d
							},
							{
								x: i - u,
								y: s + d
							},
							{
								x: i,
								y: s
							},
							{
								x: i,
								y: s
							}
						];
					}
				});
			});
		}
		function xe(e, n) {
			return X(B(e, n), Number);
		}
		function _e(e) {
			let n = {};
			return e && Object.entries(e).forEach(([t, r]) => {
				typeof t == "string" && (t = t.toLowerCase()), n[t] = r;
			}), n;
		}
		function Ce(e) {
			let n = P(e), t = new T({
				compound: !0,
				multigraph: !0
			}).setGraph({});
			return e.nodes().forEach((r) => {
				t.setNode(r, { label: r }), t.setParent(r, "layer" + e.node(r).rank);
			}), e.edges().forEach((r) => t.setEdge(r.v, r.w, {}, r.name)), n.forEach((r, o) => {
				let i = "layer" + o;
				t.setNode(i, { rank: "same" }), r.reduce((s, a) => (t.setEdge(s, a, { style: "invis" }), a));
			}), t;
		}
		var $o = {
			graphlib: ie,
			version: ue,
			layout: Oe,
			debug: Ce,
			util: {
				time: le,
				notime: q
			}
		};
		/*! For license information please see dagre.esm.js.LEGAL.txt */
		//#endregion
		//#region \0dsh-css:/Users/nanmi/workspace/myself_code/dsh-agent-teams/src/client/BoardView.module.css.mjs
		const css = ".HJsC_W_board{flex-direction:column;flex:auto;gap:10px;min-height:0;display:flex}.HJsC_W_boardHead{justify-content:space-between;align-items:center;gap:8px;display:flex}.HJsC_W_teamName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;line-height:18px;overflow:hidden}.HJsC_W_teamStats{color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;gap:10px;font-size:10.5px;line-height:15px;display:inline-flex}.HJsC_W_boardLayout{flex:auto;align-items:stretch;gap:16px;min-height:0;display:flex;position:relative}.HJsC_W_requirementRail{z-index:1;overscroll-behavior:contain;box-sizing:border-box;flex-direction:column;flex:none;gap:14px;width:268px;min-width:0;max-height:100%;padding-right:4px;display:flex;position:relative;overflow-y:auto}.HJsC_W_railGroup{flex-direction:column;gap:4px;display:flex}.HJsC_W_railGroupHead{color:var(--dsw-alias-label-secondary);justify-content:space-between;align-items:center;padding:0 2px 3px;font-size:11px;font-weight:600;line-height:15px;display:flex}.HJsC_W_railCount{box-sizing:border-box;background:var(--dsw-alias-markdown-tag);min-width:18px;height:18px;color:var(--dsw-alias-label-tertiary);border-radius:9px;justify-content:center;align-items:center;padding:0 5px;font-size:10px;font-weight:600;line-height:18px;display:inline-flex}.HJsC_W_railItem{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-1);width:100%;min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:8px;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:6px;padding:5px 8px;transition:opacity .12s,border-color .12s,background-color .12s;display:grid}.HJsC_W_railItem[data-state=running]{border-left-color:var(--dsw-alias-state-business-primary)}.HJsC_W_railItem[data-state=completed]{border-left-color:var(--dsw-alias-state-success-primary)}.HJsC_W_railItem[data-state=failed]{border-left-color:var(--dsw-alias-state-error-primary)}.HJsC_W_railItem[data-state=claimed]{border-left-color:var(--dsw-alias-state-warn-primary)}.HJsC_W_railItem:hover{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 5%, var(--dsw-alias-bg-layer-1))}.HJsC_W_railItem[data-hot=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);border-left-width:3px}.HJsC_W_railItem[data-dimmed=true]{opacity:.35}.HJsC_W_railItemId{color:var(--dsw-alias-label-primary);flex:none;font-size:10.5px;font-weight:700}.HJsC_W_railItemSubject{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:15px;overflow:hidden}.HJsC_W_railItemOwner{color:var(--dsw-alias-label-tertiary);flex:none;font-size:9.5px;line-height:14px}.HJsC_W_flowArea{flex:auto;min-width:0;min-height:0;position:relative}.HJsC_W_flowCanvas{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:12px;width:100%;min-width:0;height:100%}.HJsC_W_nodeWrap{position:relative}.HJsC_W_nodeHandle{opacity:0!important;background:0 0!important;border:none!important;width:0!important;min-width:0!important;height:0!important;min-height:0!important}.HJsC_W_flowSvg{z-index:0;pointer-events:none;width:100%;height:100%;position:absolute;inset:0;overflow:visible}.HJsC_W_edgePath{fill:none;stroke:var(--dsw-alias-border-l3);stroke-width:1.5px;transition:opacity .12s,stroke .12s,stroke-width .12s}.HJsC_W_edgePath[data-hot=true]{stroke:var(--dsw-alias-state-business-primary);stroke-width:2.5px}.HJsC_W_edgePath[data-dimmed=true]{opacity:.12}.HJsC_W_edgeArrow{fill:var(--dsw-alias-label-secondary);opacity:1}.HJsC_W_handlerLink{fill:none;stroke:color-mix(in srgb, var(--dsw-alias-label-secondary) 30%, transparent);stroke-width:1.25px;stroke-dasharray:4 3;transition:opacity .12s,stroke .12s,stroke-width .12s}.HJsC_W_handlerLink[data-hot=true]{stroke:var(--dsw-alias-state-business-primary);stroke-width:2px;stroke-dasharray:none;opacity:1}.HJsC_W_handlerLink[data-dimmed=true]{opacity:.12}.HJsC_W_hoverLinkLayer{z-index:3;pointer-events:none;width:100%;height:100%;position:absolute;inset:0;overflow:visible}.HJsC_W_hoverLink{fill:none;stroke:var(--dsw-alias-state-business-primary);stroke-width:2px;filter:drop-shadow(0 1px 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 35%, transparent))}.HJsC_W_hoverLinkArrow{fill:var(--dsw-alias-state-business-primary)}.HJsC_W_edgeLabel{pointer-events:auto;cursor:pointer;transition:opacity .12s}.HJsC_W_edgeLabelBg{fill:var(--dsw-alias-bg-base);stroke:var(--dsw-alias-border-l2);stroke-width:1px}.HJsC_W_edgeLabelText{fill:var(--dsw-alias-label-secondary);font-size:10px;font-weight:600}.HJsC_W_edgeLabel[data-hot=true] .HJsC_W_edgeLabelBg{fill:var(--dsw-alias-state-business-tertiary);stroke:var(--dsw-alias-state-business-primary)}.HJsC_W_edgeLabel[data-hot=true] .HJsC_W_edgeLabelText{fill:var(--dsw-alias-state-business-primary)}.HJsC_W_edgeLabel[data-dimmed=true]{opacity:.15}.HJsC_W_workerGrid{z-index:1;grid-template-columns:repeat(3,minmax(0,1fr));place-items:start center;gap:26px 40px;padding:10px 0 6px;display:grid;position:relative}.HJsC_W_workerSlot{flex-direction:column;align-items:center;gap:7px;width:100%;min-width:0;display:flex}.HJsC_W_workerOrb{box-sizing:border-box;border:2px solid var(--dsw-alias-border-l3);background:radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 7%, var(--dsw-alias-bg-base)), var(--dsw-alias-bg-layer-1) 58%);width:148px;height:148px;box-shadow:0 2px 8px color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);border-radius:50%;justify-content:center;align-items:center;transition:opacity .12s,border-color .12s,box-shadow .12s;display:flex;position:relative}.HJsC_W_workerOrb[data-activity=working]{border-color:var(--dsw-alias-state-business-primary);animation:2.4s ease-in-out infinite HJsC_W_agentTeamsOrbBreathe}.HJsC_W_workerOrb[data-hot=true]{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent), 0 6px 18px color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent)}.HJsC_W_workerOrb[data-dimmed=true]{opacity:.28}.HJsC_W_orbAvatar{cursor:pointer;background:0 0;border:0;border-radius:50%;justify-content:center;align-items:center;width:56px;height:56px;padding:0;display:inline-flex;position:relative}.HJsC_W_orbArt{box-sizing:border-box;border:2px solid var(--dsw-alias-bg-base);object-fit:cover;background:var(--dsw-alias-bg-layer-1);width:54px;height:54px;box-shadow:0 1px 4px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:50%}.HJsC_W_orbInitial{border:2px solid var(--dsw-alias-bg-base);width:54px;height:54px;color:var(--dsw-alias-label-primary-foreground);box-shadow:0 1px 4px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:50%;justify-content:center;align-items:center;font-size:20px;font-weight:600;display:inline-flex}.HJsC_W_orbTasks{pointer-events:none;position:absolute;inset:0}.HJsC_W_orbTaskSlot{pointer-events:none;width:0;height:0;position:absolute;top:50%;left:50%}.HJsC_W_orbTaskSlot>*{pointer-events:auto}.HJsC_W_taskOrb{box-sizing:border-box;border:2px solid var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-base);width:30px;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:50%;justify-content:center;align-items:center;padding:0;font-size:10px;font-weight:700;line-height:30px;transition:opacity .12s,border-color .12s,background-color .12s,transform .12s;display:inline-flex;position:absolute;top:-15px;left:-15px}.HJsC_W_taskOrb:hover{transform:scale(1.12)}.HJsC_W_taskOrb[data-state=running]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}.HJsC_W_taskOrb[data-state=completed]{border-color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}.HJsC_W_taskOrb[data-state=failed]{border-color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, var(--dsw-alias-bg-base));color:var(--dsw-alias-state-error-primary)}.HJsC_W_taskOrb[data-state=claimed]{border-color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}.HJsC_W_taskOrb[data-hot=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground);box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent)}.HJsC_W_taskOrb[data-active=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground);animation:2.4s ease-in-out infinite HJsC_W_agentTeamsOrbBreathe}.HJsC_W_taskOrb[data-dimmed=true]{opacity:.3}.HJsC_W_orbOverflow{box-sizing:border-box;background:var(--dsw-alias-markdown-tag);min-width:20px;height:20px;color:var(--dsw-alias-label-tertiary);border-radius:10px;justify-content:center;align-items:center;padding:0 5px;font-size:9.5px;font-weight:700;line-height:20px;display:inline-flex;position:absolute;bottom:4px;right:2px}.HJsC_W_orbUnread{box-sizing:border-box;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-state-business-primary);min-width:20px;height:20px;color:var(--dsw-alias-label-primary-foreground);border-radius:10px;justify-content:center;align-items:center;padding:0 5px;font-size:9.5px;font-weight:700;line-height:20px;display:inline-flex;position:absolute;top:0;right:4px}.HJsC_W_workerName{max-width:100%;color:var(--dsw-alias-label-primary);text-align:center;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;line-height:18px;overflow:hidden}.HJsC_W_workerMeta{flex-direction:column;align-items:center;gap:2px;max-width:100%;display:flex}.HJsC_W_workerRole{max-width:100%;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:14px;overflow:hidden}.HJsC_W_workerState{color:var(--dsw-alias-label-tertiary);align-items:center;gap:5px;font-size:10.5px;line-height:15px;display:inline-flex}.HJsC_W_workerState[data-activity=working]{color:var(--dsw-alias-state-business-primary)}.HJsC_W_workerStateDot{background:var(--dsw-alias-label-caption);border-radius:50%;width:7px;height:7px}.HJsC_W_workerStateDot[data-activity=working]{background:var(--dsw-alias-state-business-primary);animation:2.4s ease-in-out infinite HJsC_W_agentTeamsOrbBreathe}@keyframes HJsC_W_agentTeamsOrbBreathe{0%,to{box-shadow:0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 0%, transparent)}50%{box-shadow:0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)}}.HJsC_W_taskEmpty{color:var(--dsw-alias-label-tertiary);padding:4px 2px;font-size:10px}.HJsC_W_unreadPill{box-sizing:border-box;background:var(--dsw-alias-state-business-primary);min-width:16px;height:16px;color:var(--dsw-alias-label-primary-foreground);border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0 4px;font-size:9.5px;font-weight:600;line-height:16px;display:inline-flex}@keyframes HJsC_W_agentTeamsBreathe{0%,to{box-shadow:0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 0%, transparent)}50%{box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 28%, transparent)}}";
		const tagId = "dsh-agent-teams/BoardView.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-agent-teams";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var BoardView_module_css_default = {
			"handlerLink": "HJsC_W_handlerLink",
			"orbTaskSlot": "HJsC_W_orbTaskSlot",
			"orbArt": "HJsC_W_orbArt",
			"workerStateDot": "HJsC_W_workerStateDot",
			"boardHead": "HJsC_W_boardHead",
			"flowCanvas": "HJsC_W_flowCanvas",
			"workerGrid": "HJsC_W_workerGrid",
			"workerMeta": "HJsC_W_workerMeta",
			"taskEmpty": "HJsC_W_taskEmpty",
			"railItemId": "HJsC_W_railItemId",
			"edgePath": "HJsC_W_edgePath",
			"flowArea": "HJsC_W_flowArea",
			"railCount": "HJsC_W_railCount",
			"hoverLink": "HJsC_W_hoverLink",
			"edgeLabel": "HJsC_W_edgeLabel",
			"workerSlot": "HJsC_W_workerSlot",
			"workerName": "HJsC_W_workerName",
			"orbTasks": "HJsC_W_orbTasks",
			"railItem": "HJsC_W_railItem",
			"railItemOwner": "HJsC_W_railItemOwner",
			"edgeLabelText": "HJsC_W_edgeLabelText",
			"hoverLinkLayer": "HJsC_W_hoverLinkLayer",
			"teamName": "HJsC_W_teamName",
			"board": "HJsC_W_board",
			"orbInitial": "HJsC_W_orbInitial",
			"unreadPill": "HJsC_W_unreadPill",
			"workerState": "HJsC_W_workerState",
			"workerOrb": "HJsC_W_workerOrb",
			"agentTeamsBreathe": "HJsC_W_agentTeamsBreathe",
			"requirementRail": "HJsC_W_requirementRail",
			"boardLayout": "HJsC_W_boardLayout",
			"railGroup": "HJsC_W_railGroup",
			"edgeArrow": "HJsC_W_edgeArrow",
			"agentTeamsOrbBreathe": "HJsC_W_agentTeamsOrbBreathe",
			"taskOrb": "HJsC_W_taskOrb",
			"workerRole": "HJsC_W_workerRole",
			"teamStats": "HJsC_W_teamStats",
			"orbAvatar": "HJsC_W_orbAvatar",
			"nodeWrap": "HJsC_W_nodeWrap",
			"orbOverflow": "HJsC_W_orbOverflow",
			"railItemSubject": "HJsC_W_railItemSubject",
			"flowSvg": "HJsC_W_flowSvg",
			"nodeHandle": "HJsC_W_nodeHandle",
			"edgeLabelBg": "HJsC_W_edgeLabelBg",
			"hoverLinkArrow": "HJsC_W_hoverLinkArrow",
			"railGroupHead": "HJsC_W_railGroupHead",
			"orbUnread": "HJsC_W_orbUnread"
		};
		//#endregion
		//#region lib/client/BoardView.js
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
		/** Poll cadence for the host snapshot route. */
		const POLL_MS = 1e3;
		/** Host route serving team snapshots. */
		const STATE_URL = "/plugins/dsh-agent-teams/state";
		/** Class marker for the injected conversation tab. */
		const BOARD_TAB_CLASS = "dsh-agent-teams-board-tab";
		/** Style tag id for the injected tab's global stylesheet. */
		const BOARD_GLOBAL_STYLE_ID = "dsh-agent-teams-board-global-styles";
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
			const p = [
				-dx,
				dx,
				-dy,
				dy
			];
			const q = [
				x1 - box.left,
				box.right - x1,
				y1 - box.top,
				box.bottom - y1
			];
			for (let i = 0; i < 4; i++) {
				const pi = p[i] ?? 0;
				const qi = q[i] ?? 0;
				if (pi === 0) {
					if (qi < 0) return false;
				} else {
					const r = qi / pi;
					if (pi < 0) {
						if (r > t1) return false;
						if (r > t0) t0 = r;
					} else {
						if (r < t0) return false;
						if (r < t1) t1 = r;
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
			if (!obstacles.some((box) => segmentHitsBox(x1, y1, x2, y2, box))) return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
			const channelFree = (cy) => !obstacles.some((box) => segmentHitsBox(x1, y1, x1, cy, box) || segmentHitsBox(x1, cy, x2, cy, box) || segmentHitsBox(x2, cy, x2, y2, box));
			const candidates = [Math.min(y1, y2) - 46, Math.max(y1, y2) + 46];
			for (const box of obstacles) candidates.push(box.top - 20, box.bottom + 20);
			const midY = (y1 + y2) / 2;
			const channel = [...new Set(candidates)].filter((cy) => cy >= 6).sort((a, b) => Math.abs(a - midY) - Math.abs(b - midY)).find((cy) => channelFree(cy));
			if (channel !== void 0) return `M ${x1} ${y1} L ${x1} ${channel} L ${x2} ${channel} L ${x2} ${y2}`;
			return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
		}
		function buildEdges(tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			const edges = [];
			for (const task of tasks) {
				if (task.assignee === "") continue;
				for (const depId of task.dependencies) {
					const dep = byId.get(depId);
					if (dep === void 0 || dep.assignee === "" || dep.assignee === task.assignee) continue;
					edges.push({
						id: `${task.id}:${depId}`,
						task,
						dep,
						from: dep.assignee,
						to: task.assignee
					});
				}
			}
			return edges;
		}
		/** Max requirement orbs rendered inside one worker orb (+N for the rest). */
		const TASK_ORB_COUNT = 6;
		/** One requirement orb: a small ball nested inside its worker orb. The orb
		* is marked active while its worker is actually executing it, so a working
		* node visibly shows the requirement it is handling. */
		function TaskOrb({ task, tasks, dimmed, hot, onFocus, onBlur }) {
			const tone = taskTone(task.state, task.status);
			const active = task.status === "in_progress";
			return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: BoardView_module_css_default.taskOrb,
				"data-state": tone,
				"data-active": active,
				"data-dimmed": dimmed,
				"data-hot": hot,
				title: `${task.id} ${task.subject}${active ? " · 正在执行" : ""}${task.dependencies.length > 0 ? ` · 依赖 ${dependencyLabel(task, tasks)}` : ""}`,
				onMouseEnter: () => {
					onFocus(task.id);
				},
				onMouseLeave: onBlur,
				onFocus: () => {
					onFocus(task.id);
				},
				onBlur,
				children: task.id
			});
		}
		/** One worker orb: the big ball holding its requirement orbs inside. */
		function WorkerNode({ member, tasks, focusedRelated, onFocus, onBlur, onNavigate }) {
			const owned = tasks.filter((task) => task.assignee === member.name);
			const involved = focusedRelated === null || owned.some((task) => focusedRelated.has(task.id));
			const visible = owned.slice(0, TASK_ORB_COUNT);
			const overflow = owned.length - visible.length;
			const angleStep = visible.length <= 1 ? 0 : 360 / visible.length;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: BoardView_module_css_default.workerSlot,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: BoardView_module_css_default.workerOrb,
						"data-worker-node": true,
						"data-worker-name": member.name,
						"data-activity": member.activity,
						"data-dimmed": focusedRelated !== null && !involved,
						"data-hot": focusedRelated !== null && involved,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BoardView_module_css_default.orbAvatar,
								onClick: () => {
									if (member.id !== "") onNavigate(member.id);
								},
								title: `${member.name} · ${memberStatusText(member, tasks)}`,
								children: memberArtUrl(member.name, member.role) !== null ? (0, react_jsx_runtime.jsx)("img", {
									className: BoardView_module_css_default.orbArt,
									src: memberArtUrl(member.name, member.role) ?? "",
									alt: "",
									"aria-hidden": true
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: BoardView_module_css_default.orbInitial,
									style: { background: accentOf(member.id) },
									children: memberInitial(member.name)
								})
							}),
							visible.length > 0 && (0, react_jsx_runtime.jsx)("div", {
								className: BoardView_module_css_default.orbTasks,
								children: visible.map((task, index) => (0, react_jsx_runtime.jsx)("span", {
									className: BoardView_module_css_default.orbTaskSlot,
									style: visible.length > 1 ? { transform: `rotate(${index * angleStep}deg) translate(46px) rotate(${-index * angleStep}deg)` } : void 0,
									children: (0, react_jsx_runtime.jsx)(TaskOrb, {
										task,
										tasks,
										dimmed: focusedRelated !== null && !focusedRelated.has(task.id),
										hot: focusedRelated !== null && focusedRelated.has(task.id),
										onFocus,
										onBlur
									})
								}, task.id))
							}),
							overflow > 0 && (0, react_jsx_runtime.jsxs)("span", {
								className: BoardView_module_css_default.orbOverflow,
								title: owned.slice(TASK_ORB_COUNT).map((task) => `${task.id} ${task.subject}`).join("\n"),
								children: ["+", overflow]
							}),
							member.unread > 0 && (0, react_jsx_runtime.jsx)("span", {
								className: BoardView_module_css_default.orbUnread,
								children: member.unread
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: BoardView_module_css_default.workerName,
						title: member.name,
						children: member.name
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: BoardView_module_css_default.workerMeta,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BoardView_module_css_default.workerRole,
							children: member.role
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: BoardView_module_css_default.workerState,
							"data-activity": member.activity,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: BoardView_module_css_default.workerStateDot,
								"data-activity": member.activity,
								"aria-hidden": true
							}), memberStateLabel(member, tasks)]
						})]
					})
				]
			});
		}
		/** Build requirements from tasks: a requirement is a root task (no
		* dependencies) plus every task that transitively depends on it. Each task
		* belongs to the requirement of its root, so requirements never overlap. */
		function buildRequirements(tasks) {
			const byId = new Map(tasks.map((task) => [task.id, task]));
			const rootOf = /* @__PURE__ */ new Map();
			const findRoot = (task) => {
				const cached = rootOf.get(task.id);
				if (cached !== void 0) return cached;
				const first = task.dependencies[0];
				const dep = first !== void 0 ? byId.get(first) : void 0;
				const root = dep !== void 0 ? findRoot(dep) : task.id;
				rootOf.set(task.id, root);
				return root;
			};
			const byRoot = /* @__PURE__ */ new Map();
			for (const task of tasks) {
				const root = findRoot(task);
				const list = byRoot.get(root) ?? [];
				list.push(task);
				byRoot.set(root, list);
			}
			return [...byRoot.entries()].map(([rootId, stages]) => {
				return {
					id: rootId,
					root: byId.get(rootId) ?? stages[0],
					stages: stages.slice().sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }))
				};
			});
		}
		/** Overall status of one requirement, derived from its stages. */
		function requirementStatus(requirement) {
			if (requirement.stages.some((stage) => stage.status === "failed" || stage.status === "cancelled")) return "failed";
			if (requirement.stages.some((stage) => stage.status === "in_progress")) return "running";
			if (requirement.stages.every((stage) => stage.status === "completed")) return "done";
			return "pending";
		}
		/** The worker holding the requirement right now (working stage, else the
		* first non-completed stage, else the root's assignee). */
		function currentHolderOf(requirement) {
			const working = requirement.stages.find((stage) => stage.status === "in_progress");
			if (working !== void 0) return working.assignee !== "" ? working.assignee : "待认领";
			const next = requirement.stages.find((stage) => stage.status !== "completed");
			if (next !== void 0) return next.assignee !== "" ? next.assignee : "待认领";
			return "已收齐";
		}
		/** The left requirement rail: independent requirements grouped by their
		* overall status. Hovering one highlights its whole flow path. */
		function RequirementRail({ requirements, focusedRequirementId, related, onFocus, onBlur }) {
			return (0, react_jsx_runtime.jsx)("aside", {
				className: BoardView_module_css_default.requirementRail,
				"aria-label": "需求列表",
				children: [
					{
						key: "pending",
						label: "未开始",
						match: (r) => requirementStatus(r) === "pending"
					},
					{
						key: "running",
						label: "进行中",
						match: (r) => requirementStatus(r) === "running"
					},
					{
						key: "done",
						label: "已完成",
						match: (r) => requirementStatus(r) === "done"
					},
					{
						key: "failed",
						label: "异常",
						match: (r) => requirementStatus(r) === "failed"
					}
				].map((group) => {
					const items = requirements.filter(group.match);
					if (items.length === 0) return null;
					return (0, react_jsx_runtime.jsxs)("div", {
						className: BoardView_module_css_default.railGroup,
						children: [(0, react_jsx_runtime.jsxs)("header", {
							className: BoardView_module_css_default.railGroupHead,
							children: [(0, react_jsx_runtime.jsx)("span", { children: group.label }), (0, react_jsx_runtime.jsx)("span", {
								className: BoardView_module_css_default.railCount,
								children: items.length
							})]
						}), items.map((requirement) => {
							const hot = focusedRequirementId !== null && focusedRequirementId === requirement.id;
							const dimmed = focusedRequirementId !== null && !hot;
							const holder = currentHolderOf(requirement);
							return (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BoardView_module_css_default.railItem,
								"data-state": requirementStatus(requirement),
								"data-hot": hot,
								"data-dimmed": dimmed,
								"data-rail-task": requirement.id,
								title: `${requirement.id} ${requirement.root.subject} · ${requirement.stages.length} 个环节`,
								onMouseEnter: () => {
									onFocus(requirement.id);
								},
								onMouseLeave: onBlur,
								onFocus: () => {
									onFocus(requirement.id);
								},
								onBlur,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: BoardView_module_css_default.railItemId,
										children: requirement.id
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: BoardView_module_css_default.railItemSubject,
										children: requirement.root.subject
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: BoardView_module_css_default.railItemOwner,
										children: [requirement.stages.length > 1 ? `${requirement.stages.length} 环节 · ` : "", holder]
									})
								]
							}, requirement.id);
						})]
					}, group.key);
				})
			});
		}
		/** Custom node renderer: the worker orb (big ball with requirement orbs). */
		function WorkerOrbNode({ data }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: BoardView_module_css_default.nodeWrap,
				children: [
					(0, react_jsx_runtime.jsx)(Handle, {
						type: "target",
						position: Position.Left,
						className: BoardView_module_css_default.nodeHandle
					}),
					(0, react_jsx_runtime.jsx)(WorkerNode, {
						member: data.member,
						tasks: data.tasks,
						focusedRelated: data.focusedRelated,
						onFocus: data.onFocus,
						onBlur: data.onBlur,
						onNavigate: data.onNavigate
					}),
					(0, react_jsx_runtime.jsx)(Handle, {
						type: "source",
						position: Position.Right,
						className: BoardView_module_css_default.nodeHandle
					})
				]
			});
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
			const graph = new $o.graphlib.Graph();
			graph.setGraph({
				rankdir: "LR",
				nodesep: 36,
				ranksep: 150,
				marginx: 0,
				marginy: 0
			});
			graph.setDefaultEdgeLabel(() => ({}));
			for (const member of team.members) graph.setNode(member.name, {
				width: ORB_NODE_WIDTH,
				height: ORB_NODE_HEIGHT
			});
			for (const edge of buildEdges(team.tasks)) if (!graph.hasEdge(edge.from, edge.to)) graph.setEdge(edge.from, edge.to);
			$o.layout(graph);
			const positions = /* @__PURE__ */ new Map();
			for (const member of team.members) {
				const node = graph.node(member.name);
				positions.set(member.name, {
					x: node.x - ORB_NODE_WIDTH / 2,
					y: node.y - ORB_NODE_HEIGHT / 2
				});
			}
			return positions;
		}
		/**
		* Board content for one team: worker orbs laid out by dagre and rendered
		* with React Flow; requirement edges run between adjacent columns with
		* arrow markers; hovering a requirement (rail item or nested orb) draws a
		* line from the requirement itself to the node currently handling it, and
		* highlights its whole flow path.
		*/
		function FlowBoard({ team, onNavigate }) {
			const [focusedRequirementId, setFocusedRequirementId] = (0, react.useState)(null);
			const layoutRef = (0, react.useRef)(null);
			/** SVG path (layout coordinates) of the hover link from the focused rail
			* item to its handler orb, routed around every other orb. */
			const [hoverLinkPath, setHoverLinkPath] = (0, react.useState)(null);
			const requirements = (0, react.useMemo)(() => buildRequirements(team.tasks), [team.tasks]);
			const requirementByTask = (0, react.useMemo)(() => {
				const map = /* @__PURE__ */ new Map();
				for (const requirement of requirements) for (const stage of requirement.stages) map.set(stage.id, requirement.id);
				return map;
			}, [requirements]);
			const focusRequirementOf = (taskId) => {
				setFocusedRequirementId(requirementByTask.get(taskId) ?? null);
			};
			const blur = (0, react.useCallback)(() => {
				setFocusedRequirementId(null);
			}, []);
			const related = (0, react.useMemo)(() => {
				if (focusedRequirementId === null) return null;
				const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId);
				return requirement === void 0 ? null : new Set(requirement.stages.map((stage) => stage.id));
			}, [focusedRequirementId, requirements]);
			const completedCount = team.tasks.filter((task) => task.status === "completed").length;
			const positions = (0, react.useMemo)(() => layoutWorkerOrbs(team), [team]);
			(0, react.useEffect)(() => {
				if (focusedRequirementId === null) {
					setHoverLinkPath(null);
					return;
				}
				const layout = layoutRef.current;
				if (layout === null) return;
				const requirement = requirements.find((candidate) => candidate.id === focusedRequirementId);
				if (requirement === void 0) {
					setHoverLinkPath(null);
					return;
				}
				const holder = currentHolderOf(requirement);
				if (holder === "待认领" || holder === "已收齐") {
					setHoverLinkPath(null);
					return;
				}
				const measure = () => {
					const railItem = layout.querySelector(`[data-rail-task="${focusedRequirementId}"]`);
					const orb = layout.querySelector(`[data-worker-node][data-worker-name="${holder}"]`);
					if (railItem === null || orb === null) {
						setHoverLinkPath(null);
						return;
					}
					const layoutRect = layout.getBoundingClientRect();
					const railRect = railItem.getBoundingClientRect();
					const orbRect = orb.getBoundingClientRect();
					const x1 = railRect.right - layoutRect.left;
					const y1 = railRect.top + railRect.height / 2 - layoutRect.top;
					const x2 = orbRect.left - layoutRect.left;
					const y2 = orbRect.top + orbRect.height / 2 - layoutRect.top;
					const obstacles = [...layout.querySelectorAll("[data-worker-node]")].filter((el) => el.dataset.workerName !== holder).map((el) => {
						const rect = el.getBoundingClientRect();
						return {
							left: rect.left - layoutRect.left,
							top: rect.top - layoutRect.top,
							right: rect.right - layoutRect.left,
							bottom: rect.bottom - layoutRect.top
						};
					});
					setHoverLinkPath(routeConnection(x1, y1, x2, y2, obstacles, 42));
				};
				measure();
				const onResize = () => {
					measure();
				};
				window.addEventListener("resize", onResize);
				layout.addEventListener("scroll", onResize, true);
				return () => {
					window.removeEventListener("resize", onResize);
					layout.removeEventListener("scroll", onResize, true);
				};
			}, [focusedRequirementId, requirements]);
			const nodes = (0, react.useMemo)(() => team.members.map((member) => ({
				id: member.name,
				type: "workerOrb",
				position: positions.get(member.name) ?? {
					x: 0,
					y: 0
				},
				data: {
					member,
					tasks: team.tasks,
					focusedRelated: related,
					onFocus: focusRequirementOf,
					onBlur: blur,
					onNavigate
				}
			})), [
				team.members,
				team.tasks,
				positions,
				related,
				blur,
				onNavigate
			]);
			const edges = (0, react.useMemo)(() => buildEdges(team.tasks).map((edge) => {
				const hot = related !== null && related.has(edge.task.id) && related.has(edge.dep.id);
				const dimmed = related !== null && !hot;
				return {
					id: edge.id,
					source: edge.from,
					target: edge.to,
					type: "default",
					label: edge.task.id,
					labelStyle: {
						fill: "var(--dsw-alias-label-secondary)",
						fontWeight: 600,
						fontSize: 10
					},
					labelBgStyle: {
						fill: "var(--dsw-alias-bg-base)",
						stroke: "var(--dsw-alias-border-l2)",
						strokeWidth: 1
					},
					labelBgPadding: [4, 3],
					labelBgBorderRadius: 8,
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 16,
						height: 16,
						color: hot ? "var(--dsw-alias-state-business-primary)" : "var(--dsw-alias-label-secondary)"
					},
					style: {
						stroke: hot ? "var(--dsw-alias-state-business-primary)" : "var(--dsw-alias-label-secondary)",
						strokeWidth: hot ? 2.5 : 1.5,
						opacity: dimmed ? .12 : hot ? 1 : .7
					}
				};
			}), [team.tasks, related]);
			const markerId = `dsh-agent-teams-hover-arrow-${team.teamId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: BoardView_module_css_default.board,
				"data-board": true,
				"data-team-id": team.teamId,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: BoardView_module_css_default.boardHead,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: BoardView_module_css_default.teamName,
						title: team.name,
						children: team.name
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: BoardView_module_css_default.teamStats,
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								"data-stat": "members",
								children: [team.members.length, " 成员"]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								"data-stat": "tasks",
								children: [
									completedCount,
									"/",
									team.tasks.length,
									" 完成"
								]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								"data-stat": "messages",
								children: [team.messageCount, " 消息"]
							})
						]
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: BoardView_module_css_default.boardLayout,
					ref: layoutRef,
					children: [
						(0, react_jsx_runtime.jsx)(RequirementRail, {
							requirements,
							focusedRequirementId,
							related,
							onFocus: setFocusedRequirementId,
							onBlur: blur
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: BoardView_module_css_default.flowArea,
							children: (0, react_jsx_runtime.jsx)(index, {
								nodes,
								edges,
								nodeTypes: workerOrbNodeTypes,
								nodesDraggable: false,
								nodesConnectable: false,
								elementsSelectable: false,
								panOnDrag: false,
								zoomOnScroll: false,
								zoomOnPinch: false,
								zoomOnDoubleClick: false,
								fitView: true,
								fitViewOptions: { padding: .12 },
								minZoom: .5,
								maxZoom: 2,
								proOptions: { hideAttribution: false },
								className: BoardView_module_css_default.flowCanvas
							})
						}),
						hoverLinkPath !== null && (0, react_jsx_runtime.jsxs)("svg", {
							className: BoardView_module_css_default.hoverLinkLayer,
							"aria-hidden": true,
							children: [(0, react_jsx_runtime.jsx)("defs", { children: (0, react_jsx_runtime.jsx)("marker", {
								id: markerId,
								viewBox: "0 0 10 10",
								refX: "8",
								refY: "5",
								markerWidth: "7",
								markerHeight: "7",
								orient: "auto-start-reverse",
								children: (0, react_jsx_runtime.jsx)("path", {
									d: "M 0 0 L 10 5 L 0 10 z",
									className: BoardView_module_css_default.hoverLinkArrow
								})
							}) }), (0, react_jsx_runtime.jsx)("path", {
								className: BoardView_module_css_default.hoverLink,
								d: hoverLinkPath,
								markerEnd: `url(#${markerId})`
							})]
						})
					]
				})]
			});
		}
		function findConversationTabBar() {
			const tabs = document.querySelectorAll("[role=\"tab\"]");
			for (const tab of tabs) {
				const text = (tab.textContent ?? "").trim();
				if (text === "Trajectory" || text === "轨迹") return tab.parentElement;
			}
			return null;
		}
		/** The conversation header (tab bar + title row) hosting the tab bar. */
		function findConversationHeader(tabBar) {
			let el = tabBar.parentElement;
			while (el !== null && el.tagName !== "HEADER") el = el.parentElement;
			return el;
		}
		/** The conversation root: the first ancestor tall enough to span the
		* viewport (the header is the same width, so width cannot distinguish
		* them; height can). */
		function findConversationRoot(tabBar) {
			const viewportHeight = window.innerHeight;
			let root = tabBar.parentElement;
			while (root !== null && root.getBoundingClientRect().height < viewportHeight * .8) root = root.parentElement;
			return root;
		}
		/**
		* The conversation content panel: the root's sibling right after the
		* header's wrapper. Hidden while the board tab is active so the board is a
		* real page switch, not an overlay.
		*/
		function findContentPanel(root, header) {
			const wrapper = header.parentElement;
			if (wrapper === null) return null;
			const content = wrapper.nextElementSibling;
			return content instanceof HTMLElement && root.contains(content) ? content : null;
		}
		/** The shell's active-tab class (hashed prefix, stable `tabActive` local
		* name) on one tab element, if any. */
		function shellActiveTabClass(tab) {
			return [...tab.classList].find((name) => name.endsWith("tabActive"));
		}
		/** The shell-owned tabs of the conversation tab bar (ours excluded). */
		function shellTabsOf(tabBar) {
			return [...tabBar.querySelectorAll("[role=\"tab\"]")].filter((tab) => !tab.classList.contains(BOARD_TAB_CLASS));
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
		function BoardOverlay({ sessionsList, openSession }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [teams, setTeams] = (0, react.useState)([]);
			const [panelEl, setPanelEl] = (0, react.useState)(null);
			const openRef = (0, react.useRef)(false);
			openRef.current = open;
			/** The shell tab that was active before the board opened (restored on
			* close unless the shell already re-activated a tab itself). */
			const savedActiveRef = (0, react.useRef)(null);
			const current = (0, react.useSyncExternalStore)(sessionsList.subscribe, sessionsList.getSnapshot).current;
			(0, react.useEffect)(() => {
				let cancelled = false;
				let inFlight = false;
				const tick = async () => {
					if (inFlight || cancelled) return;
					inFlight = true;
					try {
						const response = await fetch(STATE_URL, { cache: "no-store" });
						if (response.ok) {
							const body = await response.json();
							if (!cancelled && Array.isArray(body.teams)) setTeams(body.teams);
						}
					} catch {} finally {
						inFlight = false;
					}
				};
				tick();
				const timer = setInterval(() => {
					tick();
				}, POLL_MS);
				return () => {
					cancelled = true;
					clearInterval(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				setOpen(false);
			}, [current]);
			(0, react.useEffect)(() => {
				const tabBar = findConversationTabBar();
				if (tabBar === null) return;
				const shellTabs = shellTabsOf(tabBar);
				if (open) {
					savedActiveRef.current = null;
					for (const tab of shellTabs) {
						const activeClass = shellActiveTabClass(tab);
						if (activeClass !== void 0) {
							if (savedActiveRef.current === null) savedActiveRef.current = {
								text: (tab.textContent ?? "").trim(),
								cls: activeClass
							};
							tab.classList.remove(activeClass);
							tab.setAttribute("aria-selected", "false");
						}
					}
				} else {
					const restored = savedActiveRef.current;
					savedActiveRef.current = null;
					if (restored !== null && shellTabs.every((tab) => shellActiveTabClass(tab) === void 0)) {
						const target = shellTabs.find((tab) => (tab.textContent ?? "").trim() === restored.text);
						if (target !== void 0) {
							target.classList.add(restored.cls);
							target.setAttribute("aria-selected", "true");
						}
					}
				}
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const tabBar = findConversationTabBar();
				if (tabBar === null) return;
				const root = findConversationRoot(tabBar);
				const header = findConversationHeader(tabBar);
				if (root === null || header === null) return;
				const content = findContentPanel(root, header);
				const previousDisplay = content?.style.display;
				if (content !== null) content.style.display = "none";
				let panel = root.querySelector("[data-agent-teams-board-panel]");
				if (panel === null) {
					panel = document.createElement("div");
					panel.dataset.agentTeamsBoardPanel = "";
					root.appendChild(panel);
				}
				setPanelEl(panel);
				return () => {
					if (content !== null && previousDisplay !== void 0) content.style.display = previousDisplay;
					const existing = root.querySelector("[data-agent-teams-board-panel]");
					if (existing !== null) existing.remove();
					setPanelEl(null);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				if (document.getElementById(BOARD_GLOBAL_STYLE_ID) === null) {
					const style = document.createElement("style");
					style.id = BOARD_GLOBAL_STYLE_ID;
					style.dataset.plugin = "dsh-agent-teams";
					style.textContent = BOARD_GLOBAL_CSS + "\n/* this gets exported as style.css and can be used for the default theming */\n/* these are the necessary styles for React/Svelte Flow, they get used by base.css and style.css */\n.react-flow {\n  direction: ltr;\n\n  --xy-edge-stroke-default: #b1b1b7;\n  --xy-edge-stroke-width-default: 1;\n  --xy-edge-stroke-selected-default: #555;\n\n  --xy-connectionline-stroke-default: #b1b1b7;\n  --xy-connectionline-stroke-width-default: 1;\n\n  --xy-attribution-background-color-default: rgba(255, 255, 255, 0.5);\n\n  --xy-minimap-background-color-default: #fff;\n  --xy-minimap-mask-background-color-default: rgba(240, 240, 240, 0.6);\n  --xy-minimap-mask-stroke-color-default: transparent;\n  --xy-minimap-mask-stroke-width-default: 1;\n  --xy-minimap-node-background-color-default: #e2e2e2;\n  --xy-minimap-node-stroke-color-default: transparent;\n  --xy-minimap-node-stroke-width-default: 2;\n\n  --xy-background-color-default: transparent;\n  --xy-background-pattern-dots-color-default: #91919a;\n  --xy-background-pattern-lines-color-default: #eee;\n  --xy-background-pattern-cross-color-default: #e2e2e2;\n  background-color: var(--xy-background-color, var(--xy-background-color-default));\n  --xy-node-color-default: inherit;\n  --xy-node-border-default: 1px solid #1a192b;\n  --xy-node-background-color-default: #fff;\n  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);\n  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(0, 0, 0, 0.08);\n  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #1a192b;\n  --xy-node-border-radius-default: 3px;\n\n  --xy-handle-background-color-default: #1a192b;\n  --xy-handle-border-color-default: #fff;\n\n  --xy-selection-background-color-default: rgba(0, 89, 220, 0.08);\n  --xy-selection-border-default: 1px dotted rgba(0, 89, 220, 0.8);\n\n  --xy-controls-button-background-color-default: #fefefe;\n  --xy-controls-button-background-color-hover-default: #f4f4f4;\n  --xy-controls-button-color-default: inherit;\n  --xy-controls-button-color-hover-default: inherit;\n  --xy-controls-button-border-color-default: #eee;\n  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);\n\n  --xy-edge-label-background-color-default: #ffffff;\n  --xy-edge-label-color-default: inherit;\n  --xy-resize-background-color-default: #3367d9;\n}\n.react-flow.dark {\n  --xy-edge-stroke-default: #3e3e3e;\n  --xy-edge-stroke-width-default: 1;\n  --xy-edge-stroke-selected-default: #727272;\n\n  --xy-connectionline-stroke-default: #b1b1b7;\n  --xy-connectionline-stroke-width-default: 1;\n\n  --xy-attribution-background-color-default: rgba(150, 150, 150, 0.25);\n\n  --xy-minimap-background-color-default: #141414;\n  --xy-minimap-mask-background-color-default: rgba(60, 60, 60, 0.6);\n  --xy-minimap-mask-stroke-color-default: transparent;\n  --xy-minimap-mask-stroke-width-default: 1;\n  --xy-minimap-node-background-color-default: #2b2b2b;\n  --xy-minimap-node-stroke-color-default: transparent;\n  --xy-minimap-node-stroke-width-default: 2;\n\n  --xy-background-color-default: #141414;\n  --xy-background-pattern-dots-color-default: #555;\n  --xy-background-pattern-lines-color-default: #333;\n  --xy-background-pattern-cross-color-default: #333;\n  --xy-node-color-default: #f8f8f8;\n  --xy-node-border-default: 1px solid #3c3c3c;\n  --xy-node-background-color-default: #1e1e1e;\n  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);\n  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(255, 255, 255, 0.08);\n  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #999;\n\n  --xy-handle-background-color-default: #bebebe;\n  --xy-handle-border-color-default: #1e1e1e;\n\n  --xy-selection-background-color-default: rgba(200, 200, 220, 0.08);\n  --xy-selection-border-default: 1px dotted rgba(200, 200, 220, 0.8);\n\n  --xy-controls-button-background-color-default: #2b2b2b;\n  --xy-controls-button-background-color-hover-default: #3e3e3e;\n  --xy-controls-button-color-default: #f8f8f8;\n  --xy-controls-button-color-hover-default: #fff;\n  --xy-controls-button-border-color-default: #5b5b5b;\n  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);\n\n  --xy-edge-label-background-color-default: #141414;\n  --xy-edge-label-color-default: #f8f8f8;\n}\n.react-flow__background {\n  background-color: var(--xy-background-color-props, var(--xy-background-color, var(--xy-background-color-default)));\n  pointer-events: none;\n  z-index: -1;\n}\n.react-flow__container {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  top: 0;\n  left: 0;\n}\n.react-flow__pane {\n  z-index: 1;\n  touch-action: none;\n}\n.react-flow__pane.draggable {\n    cursor: grab;\n  }\n.react-flow__pane.dragging {\n    cursor: grabbing;\n  }\n.react-flow__pane.selection {\n    cursor: pointer;\n  }\n.react-flow__viewport {\n  transform-origin: 0 0;\n  z-index: 2;\n  pointer-events: none;\n}\n.react-flow__renderer {\n  z-index: 4;\n}\n.react-flow__selection {\n  z-index: 6;\n}\n.react-flow__nodesselection-rect:focus,\n.react-flow__nodesselection-rect:focus-visible {\n  outline: none;\n}\n.react-flow__edge-path {\n  stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));\n  stroke-width: var(--xy-edge-stroke-width, var(--xy-edge-stroke-width-default));\n  fill: none;\n}\n.react-flow__connection-path {\n  stroke: var(--xy-connectionline-stroke, var(--xy-connectionline-stroke-default));\n  stroke-width: var(--xy-connectionline-stroke-width, var(--xy-connectionline-stroke-width-default));\n  fill: none;\n}\n.react-flow .react-flow__edges {\n  position: absolute;\n}\n.react-flow .react-flow__edges svg {\n    overflow: visible;\n    position: absolute;\n    pointer-events: none;\n  }\n.react-flow__edge {\n  pointer-events: visibleStroke;\n}\n.react-flow__edge.selectable {\n    cursor: pointer;\n  }\n.react-flow__edge.animated path {\n    stroke-dasharray: 5;\n    animation: dashdraw 0.5s linear infinite;\n  }\n.react-flow__edge.animated path.react-flow__edge-interaction {\n    stroke-dasharray: none;\n    animation: none;\n  }\n.react-flow__edge.inactive {\n    pointer-events: none;\n  }\n.react-flow__edge.selected,\n  .react-flow__edge:focus,\n  .react-flow__edge:focus-visible {\n    outline: none;\n  }\n.react-flow__edge.selected .react-flow__edge-path,\n  .react-flow__edge.selectable:focus .react-flow__edge-path,\n  .react-flow__edge.selectable:focus-visible .react-flow__edge-path {\n    stroke: var(--xy-edge-stroke-selected, var(--xy-edge-stroke-selected-default));\n  }\n.react-flow__edge-textwrapper {\n    pointer-events: all;\n  }\n.react-flow__edge .react-flow__edge-text {\n    pointer-events: none;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n            user-select: none;\n  }\n/* Arrowhead marker styles - use CSS custom properties as default */\n.react-flow__arrowhead polyline {\n  stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));\n}\n.react-flow__arrowhead polyline.arrowclosed {\n  fill: var(--xy-edge-stroke, var(--xy-edge-stroke-default));\n}\n.react-flow__connection {\n  pointer-events: none;\n}\n.react-flow__connection .animated {\n    stroke-dasharray: 5;\n    animation: dashdraw 0.5s linear infinite;\n  }\nsvg.react-flow__connectionline {\n  z-index: 1001;\n  overflow: visible;\n  position: absolute;\n}\n.react-flow__nodes {\n  pointer-events: none;\n  transform-origin: 0 0;\n}\n.react-flow__node {\n  position: absolute;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  pointer-events: all;\n  transform-origin: 0 0;\n  box-sizing: border-box;\n  cursor: default;\n}\n.react-flow__node.selectable {\n    cursor: pointer;\n  }\n.react-flow__node.draggable {\n    cursor: grab;\n    pointer-events: all;\n  }\n.react-flow__node.draggable.dragging {\n      cursor: grabbing;\n    }\n.react-flow__nodesselection {\n  z-index: 3;\n  transform-origin: left top;\n  pointer-events: none;\n}\n.react-flow__nodesselection-rect {\n    position: absolute;\n    pointer-events: all;\n    cursor: grab;\n  }\n.react-flow__handle {\n  position: absolute;\n  pointer-events: none;\n  min-width: 5px;\n  min-height: 5px;\n  width: 6px;\n  height: 6px;\n  background-color: var(--xy-handle-background-color, var(--xy-handle-background-color-default));\n  border: 1px solid var(--xy-handle-border-color, var(--xy-handle-border-color-default));\n  border-radius: 100%;\n}\n.react-flow__handle.connectingfrom {\n    pointer-events: all;\n  }\n.react-flow__handle.connectionindicator {\n    pointer-events: all;\n    cursor: crosshair;\n  }\n.react-flow__handle-bottom {\n    top: auto;\n    left: 50%;\n    bottom: 0;\n    transform: translate(-50%, 50%);\n  }\n.react-flow__handle-top {\n    top: 0;\n    left: 50%;\n    transform: translate(-50%, -50%);\n  }\n.react-flow__handle-left {\n    top: 50%;\n    left: 0;\n    transform: translate(-50%, -50%);\n  }\n.react-flow__handle-right {\n    top: 50%;\n    right: 0;\n    transform: translate(50%, -50%);\n  }\n.react-flow__edgeupdater {\n  cursor: move;\n  pointer-events: all;\n}\n.react-flow__pane.selection .react-flow__panel {\n  pointer-events: none;\n}\n.react-flow__panel {\n  position: absolute;\n  z-index: 5;\n  margin: 15px;\n}\n.react-flow__panel.top {\n    top: 0;\n  }\n.react-flow__panel.bottom {\n    bottom: 0;\n  }\n.react-flow__panel.top.center, .react-flow__panel.bottom.center {\n      left: 50%;\n      transform: translateX(-15px) translateX(-50%);\n    }\n.react-flow__panel.left {\n    left: 0;\n  }\n.react-flow__panel.right {\n    right: 0;\n  }\n.react-flow__panel.left.center, .react-flow__panel.right.center {\n      top: 50%;\n      transform: translateY(-15px) translateY(-50%);\n    }\n.react-flow__attribution {\n  font-size: 10px;\n  background: var(--xy-attribution-background-color, var(--xy-attribution-background-color-default));\n  padding: 2px 3px;\n  margin: 0;\n}\n.react-flow__attribution a {\n    text-decoration: none;\n    color: #999;\n  }\n@keyframes dashdraw {\n  from {\n    stroke-dashoffset: 10;\n  }\n}\n.react-flow__edgelabel-renderer {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  left: 0;\n  top: 0;\n}\n.react-flow__viewport-portal {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n}\n.react-flow__minimap {\n  background: var(\n    --xy-minimap-background-color-props,\n    var(--xy-minimap-background-color, var(--xy-minimap-background-color-default))\n  );\n}\n.react-flow__minimap-svg {\n    display: block;\n  }\n.react-flow__minimap-mask {\n    fill: var(\n      --xy-minimap-mask-background-color-props,\n      var(--xy-minimap-mask-background-color, var(--xy-minimap-mask-background-color-default))\n    );\n    stroke: var(\n      --xy-minimap-mask-stroke-color-props,\n      var(--xy-minimap-mask-stroke-color, var(--xy-minimap-mask-stroke-color-default))\n    );\n    stroke-width: var(\n      --xy-minimap-mask-stroke-width-props,\n      var(--xy-minimap-mask-stroke-width, var(--xy-minimap-mask-stroke-width-default))\n    );\n  }\n.react-flow__minimap-node {\n    fill: var(\n      --xy-minimap-node-background-color-props,\n      var(--xy-minimap-node-background-color, var(--xy-minimap-node-background-color-default))\n    );\n    stroke: var(\n      --xy-minimap-node-stroke-color-props,\n      var(--xy-minimap-node-stroke-color, var(--xy-minimap-node-stroke-color-default))\n    );\n    stroke-width: var(\n      --xy-minimap-node-stroke-width-props,\n      var(--xy-minimap-node-stroke-width, var(--xy-minimap-node-stroke-width-default))\n    );\n  }\n.react-flow__background-pattern.dots {\n    fill: var(\n      --xy-background-pattern-color-props,\n      var(--xy-background-pattern-color, var(--xy-background-pattern-dots-color-default))\n    );\n  }\n.react-flow__background-pattern.lines {\n    stroke: var(\n      --xy-background-pattern-color-props,\n      var(--xy-background-pattern-color, var(--xy-background-pattern-lines-color-default))\n    );\n  }\n.react-flow__background-pattern.cross {\n    stroke: var(\n      --xy-background-pattern-color-props,\n      var(--xy-background-pattern-color, var(--xy-background-pattern-cross-color-default))\n    );\n  }\n.react-flow__controls {\n  display: flex;\n  flex-direction: column;\n  box-shadow: var(--xy-controls-box-shadow, var(--xy-controls-box-shadow-default));\n}\n.react-flow__controls.horizontal {\n    flex-direction: row;\n  }\n.react-flow__controls-button {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    height: 26px;\n    width: 26px;\n    padding: 4px;\n    border: none;\n    background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));\n    border-bottom: 1px solid\n      var(\n        --xy-controls-button-border-color-props,\n        var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default))\n      );\n    color: var(\n      --xy-controls-button-color-props,\n      var(--xy-controls-button-color, var(--xy-controls-button-color-default))\n    );\n    cursor: pointer;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n            user-select: none;\n  }\n.react-flow__controls-button svg {\n      width: 100%;\n      max-width: 12px;\n      max-height: 12px;\n      fill: currentColor;\n    }\n.react-flow__edge.updating .react-flow__edge-path {\n      stroke: #777;\n    }\n.react-flow__edge-text {\n    font-size: 10px;\n  }\n.react-flow__node.selectable:focus,\n  .react-flow__node.selectable:focus-visible {\n    outline: none;\n  }\n.react-flow__node-input,\n.react-flow__node-default,\n.react-flow__node-output,\n.react-flow__node-group {\n  padding: 10px;\n  border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));\n  width: 150px;\n  font-size: 12px;\n  color: var(--xy-node-color, var(--xy-node-color-default));\n  text-align: center;\n  border: var(--xy-node-border, var(--xy-node-border-default));\n  background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));\n}\n.react-flow__node-input.selectable:hover, .react-flow__node-default.selectable:hover, .react-flow__node-output.selectable:hover, .react-flow__node-group.selectable:hover {\n      box-shadow: var(--xy-node-boxshadow-hover, var(--xy-node-boxshadow-hover-default));\n    }\n.react-flow__node-input.selectable.selected,\n    .react-flow__node-input.selectable:focus,\n    .react-flow__node-input.selectable:focus-visible,\n    .react-flow__node-default.selectable.selected,\n    .react-flow__node-default.selectable:focus,\n    .react-flow__node-default.selectable:focus-visible,\n    .react-flow__node-output.selectable.selected,\n    .react-flow__node-output.selectable:focus,\n    .react-flow__node-output.selectable:focus-visible,\n    .react-flow__node-group.selectable.selected,\n    .react-flow__node-group.selectable:focus,\n    .react-flow__node-group.selectable:focus-visible {\n      box-shadow: var(--xy-node-boxshadow-selected, var(--xy-node-boxshadow-selected-default));\n    }\n.react-flow__node-group {\n  background-color: var(--xy-node-group-background-color, var(--xy-node-group-background-color-default));\n}\n.react-flow__nodesselection-rect,\n.react-flow__selection {\n  background: var(--xy-selection-background-color, var(--xy-selection-background-color-default));\n  border: var(--xy-selection-border, var(--xy-selection-border-default));\n}\n.react-flow__nodesselection-rect:focus,\n  .react-flow__nodesselection-rect:focus-visible,\n  .react-flow__selection:focus,\n  .react-flow__selection:focus-visible {\n    outline: none;\n  }\n.react-flow__controls-button:hover {\n      background: var(\n        --xy-controls-button-background-color-hover-props,\n        var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default))\n      );\n      color: var(\n        --xy-controls-button-color-hover-props,\n        var(--xy-controls-button-color-hover, var(--xy-controls-button-color-hover-default))\n      );\n    }\n.react-flow__controls-button:disabled {\n      pointer-events: none;\n    }\n.react-flow__controls-button:disabled svg {\n        fill-opacity: 0.4;\n      }\n.react-flow__controls-button:last-child {\n    border-bottom: none;\n  }\n.react-flow__controls.horizontal .react-flow__controls-button {\n    border-bottom: none;\n    border-right: 1px solid\n      var(\n        --xy-controls-button-border-color-props,\n        var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default))\n      );\n  }\n.react-flow__controls.horizontal .react-flow__controls-button:last-child {\n    border-right: none;\n  }\n.react-flow__resize-control {\n  position: absolute;\n}\n.react-flow__resize-control.left,\n.react-flow__resize-control.right {\n  cursor: ew-resize;\n}\n.react-flow__resize-control.top,\n.react-flow__resize-control.bottom {\n  cursor: ns-resize;\n}\n.react-flow__resize-control.top.left,\n.react-flow__resize-control.bottom.right {\n  cursor: nwse-resize;\n}\n.react-flow__resize-control.bottom.left,\n.react-flow__resize-control.top.right {\n  cursor: nesw-resize;\n}\n/* handle styles */\n.react-flow__resize-control.handle {\n  width: 5px;\n  height: 5px;\n  border: 1px solid #fff;\n  border-radius: 1px;\n  background-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));\n  translate: -50% -50%;\n}\n.react-flow__resize-control.handle.left {\n  left: 0;\n  top: 50%;\n}\n.react-flow__resize-control.handle.right {\n  left: 100%;\n  top: 50%;\n}\n.react-flow__resize-control.handle.top {\n  left: 50%;\n  top: 0;\n}\n.react-flow__resize-control.handle.bottom {\n  left: 50%;\n  top: 100%;\n}\n.react-flow__resize-control.handle.top.left {\n  left: 0;\n}\n.react-flow__resize-control.handle.bottom.left {\n  left: 0;\n}\n.react-flow__resize-control.handle.top.right {\n  left: 100%;\n}\n.react-flow__resize-control.handle.bottom.right {\n  left: 100%;\n}\n/* line styles */\n.react-flow__resize-control.line {\n  border-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));\n  border-width: 0;\n  border-style: solid;\n}\n.react-flow__resize-control.line.left,\n.react-flow__resize-control.line.right {\n  width: 1px;\n  transform: translate(-50%, 0);\n  top: 0;\n  height: 100%;\n}\n.react-flow__resize-control.line.left {\n  left: 0;\n  border-left-width: 1px;\n}\n.react-flow__resize-control.line.right {\n  left: 100%;\n  border-right-width: 1px;\n}\n.react-flow__resize-control.line.top,\n.react-flow__resize-control.line.bottom {\n  height: 1px;\n  transform: translate(0, -50%);\n  left: 0;\n  width: 100%;\n}\n.react-flow__resize-control.line.top {\n  top: 0;\n  border-top-width: 1px;\n}\n.react-flow__resize-control.line.bottom {\n  border-bottom-width: 1px;\n  top: 100%;\n}\n.react-flow__edge-textbg {\n  fill: var(--xy-edge-label-background-color, var(--xy-edge-label-background-color-default));\n}\n.react-flow__edge-text {\n  fill: var(--xy-edge-label-color, var(--xy-edge-label-color-default));\n}\n";
					document.head.appendChild(style);
				}
				const ensureTab = () => {
					const tabBar = findConversationTabBar();
					if (tabBar === null) return;
					if (tabBar.querySelector(`button.dsh-agent-teams-board-tab`) !== null) return;
					const tab = document.createElement("button");
					tab.type = "button";
					tab.role = "tab";
					tab.className = BOARD_TAB_CLASS;
					tab.textContent = "任务看板";
					tab.addEventListener("click", () => {
						setOpen(true);
					});
					tabBar.appendChild(tab);
				};
				const onCaptureClick = (event) => {
					const tab = event.target?.closest("[role=\"tab\"]");
					if (tab !== null && tab !== void 0 && !tab.classList.contains("dsh-agent-teams-board-tab")) setOpen(false);
				};
				ensureTab();
				const observer = new MutationObserver(() => {
					ensureTab();
					if (openRef.current) {
						const tabBar = findConversationTabBar();
						if (tabBar !== null) {
							for (const tab of shellTabsOf(tabBar)) {
								const activeClass = shellActiveTabClass(tab);
								if (activeClass !== void 0) tab.classList.remove(activeClass);
							}
							const root = findConversationRoot(tabBar);
							const header = findConversationHeader(tabBar);
							if (root !== null && header !== null) {
								const content = findContentPanel(root, header);
								if (content !== null) content.style.display = "none";
								let panel = root.querySelector("[data-agent-teams-board-panel]");
								if (panel === null) {
									panel = document.createElement("div");
									panel.dataset.agentTeamsBoardPanel = "";
									root.appendChild(panel);
								}
								setPanelEl(panel);
							}
						}
					}
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				document.addEventListener("click", onCaptureClick, true);
				return () => {
					observer.disconnect();
					document.removeEventListener("click", onCaptureClick, true);
				};
			}, []);
			(0, react.useEffect)(() => {
				const tab = findConversationTabBar()?.querySelector(`button.${BOARD_TAB_CLASS}`);
				if (tab === null || tab === void 0) return;
				if (open) tab.setAttribute("aria-selected", "true");
				else tab.removeAttribute("aria-selected");
			}, [open]);
			const visibleTeams = current === void 0 ? [] : teams.filter((team) => teamVisibleTo(team, current));
			if (!open || panelEl === null || visibleTeams.length === 0) return null;
			return (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: visibleTeams.map((team) => (0, react_jsx_runtime.jsx)(FlowBoard, {
				team,
				onNavigate: (id) => {
					openSession(id);
				}
			}, team.teamId)) }), panelEl);
		}
		//#endregion
		//#region lib/client/agent-teams-card-definition.js
		/**
		* AgentTeams conversation card: a lightweight in-conversation summary shown
		* when a team is created — the captain's name, the member roster with whale
		* avatars, and an entry point that re-activates the top-right activity
		* panel (useful after the floater was closed, or when re-opening an old
		* session for review).
		*
		* The fold anchors to the Harness's durable `tool/call` + `tool/result`
		* records for `agent_teams_create`. Those are first-party session events, so
		* the card survives restarts without writing an out-of-repo event type.
		* @module dsh-agent-teams/client/card
		*/
		/** Parse the only create-call fields the historic card owns. */
		function parseAgentTeamsCreateArgs(value) {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || parsed === null || !("name" in parsed) || typeof parsed.name !== "string") return;
				const name = parsed.name.trim();
				if (name === "") return void 0;
				const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
				return {
					teamId: cleaned === "" ? "team" : cleaned,
					name
				};
			} catch {
				return;
			}
		}
		/** Durable first-party tool events folded into one keyed Chat node. */
		const agentTeamsCardDefinition = {
			kind: "agent-teams",
			target: "chat",
			match: (event) => {
				if (event.type === "tool/call" && event.data.name === "agent_teams_create") return parseAgentTeamsCreateArgs(event.data.arguments) === void 0 ? null : {
					id: String(event.data.callId),
					role: "start"
				};
				if (event.type === "tool/result" && event.data.message.source.kind === "tool") return {
					id: String(event.data.message.source.callId),
					role: "update"
				};
				return null;
			},
			start: (_context, match) => {
				if (match.event.type !== "tool/call") throw new Error("agent-teams card start requires agent_teams_create tool/call");
				const parsed = parseAgentTeamsCreateArgs(match.event.data.arguments);
				if (parsed === void 0) throw new Error("agent-teams card start requires valid create arguments");
				return {
					...parsed,
					accepted: false
				};
			},
			update: (context, match) => {
				if (match.event.type !== "tool/result") return context.state;
				if (match.event.data.error !== void 0 || match.event.data.message.content.some((block) => block.type === "tool-result" && block.isError === true)) return context.state;
				return {
					...context.state,
					accepted: true
				};
			},
			buildViewNode: (context) => {
				if (context.start === void 0) return null;
				const state = context.state;
				if (!state.accepted) return null;
				return {
					key: context.key,
					kind: "agent-teams",
					id: context.id,
					target: "chat",
					anchorSeq: context.start.event.seq,
					location: context.start.location,
					visibility: "visible",
					data: {
						teamId: state.teamId,
						captainSessionId: "",
						teamName: state.name,
						members: []
					}
				};
			}
		};
		//#endregion
		//#region lib/client/index.js
		/** Required services: conversation nodes, slots, and sessions navigation. */
		const inject = [
			"conversationEvents",
			"slots",
			"sessions"
		];
		/**
		* Mount the floater through a body portal (the web shell has no top-right
		* slot), register the in-conversation team card, whose "activity panel"
		* button re-activates the floater via a window event — the recovery path
		* for a closed floater or a re-opened session — and mount the main-interface
		* task board (third conversation tab).
		*/
		function apply(ctx) {
			const host = document.createElement("div");
			host.dataset.agentTeamsHost = "";
			document.body.appendChild(host);
			const root = (0, react_dom_client.createRoot)(host);
			root.render((0, react_jsx_runtime.jsx)(ActivityPanel, {
				sessionsList: ctx.sessions.list,
				openSession: (id) => {
					ctx.sessions.open(id);
				}
			}));
			ctx.effect(() => () => {
				root.unmount();
				host.remove();
			}, "agent-teams: activity panel");
			const boardHost = document.createElement("div");
			boardHost.dataset.agentTeamsBoardHost = "";
			document.body.appendChild(boardHost);
			const boardRoot = (0, react_dom_client.createRoot)(boardHost);
			boardRoot.render((0, react_jsx_runtime.jsx)(BoardOverlay, {
				sessionsList: ctx.sessions.list,
				openSession: (id) => {
					ctx.sessions.open(id);
				}
			}));
			ctx.effect(() => () => {
				boardRoot.unmount();
				boardHost.remove();
			}, "agent-teams: task board");
			ctx.conversationEvents.register(agentTeamsCardDefinition);
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "agent-teams",
				inject: () => ({
					openSession: (id) => {
						ctx.sessions.open(id);
					},
					currentSessionId: () => ctx.sessions.list.getSnapshot().current
				})
			}, AgentTeamsCard));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map