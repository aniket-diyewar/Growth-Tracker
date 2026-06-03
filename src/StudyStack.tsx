import { useState, useEffect, useRef } from "react";
import useLocalStorage from "./useLocalStorage";
import { requestNotificationPermission, sendNotification, playBeep } from "./notify";

type TaskId = string;
interface Task { id: TaskId; label: string; duration: number; section: Section }
type Section = "aptitude" | "dsa" | "semester";
type Screen = "dashboard" | "session" | "manage" | "progress" | "weekly";
type TimerState = "idle" | "running" | "paused" | "done";

const DEFAULT_TASKS: Task[] = [
  { id: "a1", label: "Quant Practice", duration: 30, section: "aptitude" },
  { id: "a2", label: "Logical Reasoning", duration: 20, section: "aptitude" },
  { id: "a3", label: "Verbal Practice", duration: 10, section: "aptitude" },
  { id: "d1", label: "Beginner Problems", duration: 20, section: "dsa" },
  { id: "d2", label: "Medium Problems", duration: 40, section: "dsa" },
  { id: "s1", label: "Notes Making", duration: 20, section: "semester" },
  { id: "s2", label: "Theory / YouTube", duration: 20, section: "semester" },
  { id: "s3", label: "Concept Practice", duration: 20, section: "semester" },
];

interface WeeklyDay { day: string; quant: string; dsa: string; sem: string }

const DEFAULT_WEEKLY: WeeklyDay[] = [
  { day: "Mon", quant: "Percentages", dsa: "Arrays + Sliding Window", sem: "ML for Healthcare" },
  { day: "Tue", quant: "Ratio & Proportion", dsa: "Strings + Two Pointer", sem: "RTOS" },
  { day: "Wed", quant: "Time & Work", dsa: "Recursion + Binary Search", sem: "Biomedical Imaging" },
  { day: "Thu", quant: "Profit & Loss", dsa: "Linked List", sem: "Biomedical Microsystems" },
  { day: "Fri", quant: "Probability", dsa: "Stack & Queue", sem: "OOP" },
  { day: "Sat", quant: "Mixed Aptitude Test", dsa: "HashMap + Greedy", sem: "Revision + PYQs" },
  { day: "Sun", quant: "Rest", dsa: "GitHub / Projects", sem: "Light Revision" },
];

const MOTTOS = [
  "Stay consistent — the results compound.",
  "Small progress every single day.",
  "Discipline beats motivation, always.",
  "One problem at a time. You've got this.",
  "Placement season is built in silent hours.",
  "Show up today. Future you will thank you.",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayObj = new Date();
const todayDayIdx = todayObj.getDay();
const todayWeeklyIdx = todayDayIdx === 0 ? 6 : todayDayIdx - 1;
const todayStr = todayObj.toISOString().split("T")[0];

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const pct = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;

const META: Record<Section, { label: string; color: string; icon: string }> = {
  aptitude: { label: "Aptitude", color: "#f59e0b", icon: "⚡" },
  dsa:      { label: "DSA Practice", color: "#22d3ee", icon: "⌨" },
  semester: { label: "Semester Study", color: "#a78bfa", icon: "📖" },
};

function ProgressBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: height, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, borderRadius: height,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width 0.5s ease", boxShadow: `0 0 8px ${color}44` }} />
    </div>
  );
}

function TaskRow({ task, checked, onToggle, color }: {
  task: Task; checked: boolean; onToggle: () => void; color: string;
}) {
  return (
    <button onClick={onToggle} style={{
      background: checked ? `${color}0d` : "rgba(255,255,255,0.02)",
      border: `1px solid ${checked ? color + "33" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12,
      textAlign: "left", width: "100%", transition: "all 0.2s",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        border: `2px solid ${checked ? color : "rgba(255,255,255,0.2)"}`,
        background: checked ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.2s",
        boxShadow: checked ? `0 0 10px ${color}66` : "none",
      }}>
        {checked && <span style={{ color: "#0a0e1a", fontSize: 12, fontWeight: 800 }}>✓</span>}
      </div>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: checked ? "#475569" : "#c4cdd9",
        textDecoration: checked ? "line-through" : "none",
      }}>{task.label}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, color: checked ? "#334155" : color,
        background: `${color}11`, padding: "2px 8px", borderRadius: 6,
      }}>{task.duration}m</span>
    </button>
  );
}

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px", color: "#e2e8f0",
  fontSize: 13, outline: "none", width: "100%",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "18px 20px", marginBottom: 14,
};

export default function StudyStack() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", DEFAULT_TASKS);
  const [doneIds, setDoneIds] = useLocalStorage<TaskId[]>("doneIds", []);
  const [weeklyPlan, setWeeklyPlan] = useLocalStorage<WeeklyDay[]>("weeklyPlan", DEFAULT_WEEKLY);
  const [completedSessions, setCompletedSessions] = useLocalStorage("completedSessions", 0);
  const [studyMins, setStudyMins] = useLocalStorage("studyMins", 0);
  const [consistency, setConsistency] = useLocalStorage<boolean[]>("consistency", []);
  const [lastActiveDate, setLastActiveDate] = useLocalStorage("lastActiveDate", "");
  const [lastSessionDate, setLastSessionDate] = useLocalStorage("lastSessionDate", "");

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [timerSecs, setTimerSecs] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [timerLabel, setTimerLabel] = useState("Focus");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalSecs = useRef(25 * 60);
  const justCompletedRef = useRef(false);
  const [mottoIdx] = useState(() => Math.floor(Math.random() * MOTTOS.length));

  const completedDsaTasks = tasks.filter(t => t.section === "dsa" && doneIds.includes(t.id)).length;
  const dsaSolved = completedDsaTasks * 2;
  const studiedToday = doneIds.length > 0 || lastSessionDate === todayStr;
  const allConsistency = [...consistency, studiedToday];
  const streak = (() => {
    let s = 0;
    for (let i = allConsistency.length - 1; i >= 0; i--) {
      if (allConsistency[i]) s++;
      else break;
    }
    return s;
  })();

  // Daily reset: runs once on mount
  useEffect(() => {
    if (lastActiveDate && lastActiveDate !== todayStr) {
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);

      const studiedLastActive = doneIds.length > 0 || lastSessionDate === lastActiveDate;
      const updates = [studiedLastActive];
      for (let i = 1; i < diffDays; i++) updates.push(false);

      setConsistency(prev => [...prev, ...updates]);
      setDoneIds([]);
    }
    setLastActiveDate(todayStr);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer interval
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setTimerSecs(s => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  // Detect timer reaching 0
  useEffect(() => {
    if (timerState === "running" && timerSecs === 0) {
      setTimerState("done");
    }
  }, [timerSecs, timerState]);

  // Handle completion side effects
  useEffect(() => {
    if (timerState === "done" && !justCompletedRef.current) {
      justCompletedRef.current = true;
      playBeep();
      sendNotification("StudyStack", "Session complete! 🎉");
      const dur = Math.round(originalSecs.current / 60);
      setCompletedSessions(s => s + 1);
      setStudyMins(m => m + dur);
      setLastSessionDate(todayStr);
      requestNotificationPermission();
    }
  }, [timerState]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: TaskId) => {
    setDoneIds(prev => {
      if (prev.includes(id)) {
        const task = tasks.find(t => t.id === id);
        if (task) setStudyMins(m => Math.max(0, m - task.duration));
        return prev.filter(tid => tid !== id);
      } else {
        const task = tasks.find(t => t.id === id);
        if (task) setStudyMins(m => m + task.duration);
        return [...prev, id];
      }
    });
  };

  const setPreset = (mins: number, label: string) => {
    setTimerState("idle");
    setTimerSecs(mins * 60);
    originalSecs.current = mins * 60;
    setTimerLabel(label);
    justCompletedRef.current = false;
  };

  const handleReset = () => {
    setTimerState("idle");
    setTimerSecs(originalSecs.current);
    justCompletedRef.current = false;
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    display: "flex", flexDirection: "column", maxWidth: 430,
    margin: "0 auto", position: "relative",
  };

  const px: React.CSSProperties = { padding: "0 20px" };

  const NavBar = () => (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(10,14,26,0.97)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", zIndex: 100,
    }}>
      {([
        ["dashboard","⊞","HOME"],
        ["session","◎","FOCUS"],
        ["manage","⚙","TASKS"],
        ["progress","▤","STATS"],
        ["weekly","⊟","WEEKLY"],
      ] as [Screen,string,string][]).map(([sc, icon, label]) => (
        <button key={sc} onClick={() => setScreen(sc)} style={{
          flex: 1, padding: "12px 4px 10px", background: "none", border: "none",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, fontSize: 10,
          fontWeight: screen === sc ? 700 : 400,
          color: screen === sc ? "#22d3ee" : "#475569",
          letterSpacing: "0.05em",
        }}>
          <span style={{ fontSize: 20, filter: screen === sc ? "drop-shadow(0 0 6px #22d3ee88)" : "none" }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  const Dashboard = () => {
    const hour = todayObj.getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    return (
      <div style={px}>
        <div style={{ paddingTop: 52, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 4 }}>
            {greeting.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            Today's <span style={{ color: "#22d3ee" }}>Mission</span> 🎯
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
            {todayObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>

        <div style={{ ...card, background: "linear-gradient(135deg,#1e3a5f33,#0f2a4422)", borderColor: "#22d3ee22", padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#22d3ee", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 6 }}>— DAILY MOTTO</div>
          <div style={{ fontSize: 14, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 }}>"{MOTTOS[mottoIdx]}"</div>
        </div>

        <div style={{ ...card, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>DAILY PROGRESS</span>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{doneIds.length}<span style={{ fontSize: 13, color: "#475569" }}>/{tasks.length}</span></span>
          </div>
          <ProgressBar value={pct(doneIds.length, tasks.length)} color="#22d3ee" />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {(["aptitude","dsa","semester"] as Section[]).map(sec => {
              const cnt = tasks.filter(t => t.section === sec).length;
              const d = tasks.filter(t => t.section === sec && doneIds.includes(t.id)).length;
              const m = META[sec];
              return (
                <div key={sec} style={{ flex: 1, background: `${m.color}11`, border: `1px solid ${m.color}22`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{m.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1.2 }}>{pct(d, cnt)}%</div>
                  <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, letterSpacing: "0.06em" }}>{m.label.split(" ")[0].toUpperCase()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {(["aptitude","dsa","semester"] as Section[]).map(sec => {
          const m = META[sec];
          const secTasks = tasks.filter(t => t.section === sec);
          const secDone = secTasks.filter(t => doneIds.includes(t.id)).length;
          return (
            <div key={sec} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{secDone}/{secTasks.length} completed</div>
                </div>
                <span style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
                  {pct(secDone, secTasks.length)}%
                </span>
              </div>
              <ProgressBar value={pct(secDone, secTasks.length)} color={m.color} height={4} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {secTasks.map(t => (
                  <TaskRow key={t.id} task={t} checked={doneIds.includes(t.id)} onToggle={() => toggle(t.id)} color={m.color} />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg,#fbbf2411,#f59e0b08)" }}>
          <div style={{ fontSize: 36 }}>🔥</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{streak} Day Streak</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Keep going. Don't break the chain.</div>
        </div>
      </div>
    );
  };

  const Session = () => {
    const [customMins, setCustomMins] = useState("");
    const presets = [{ mins: 10, label: "Verbal" }, { mins: 20, label: "Focus" }, { mins: 30, label: "Quant" }, { mins: 40, label: "Deep" }];
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progress = originalSecs.current > 0 ? (originalSecs.current - timerSecs) / originalSecs.current : 0;

    const ringColor = timerState === "done" ? "#34d399" : timerState === "running" ? "#22d3ee" : "#334155";
    const glowColor = timerState === "done" ? "#34d39966" : "#22d3ee66";
    const displayColor = timerState === "done" ? "#34d399" : timerState === "running" ? "#22d3ee" : "#e2e8f0";

    return (
      <div style={{ ...px, paddingTop: 52 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 600 }}>FOCUS</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Study <span style={{ color: "#22d3ee" }}>Timer</span></div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ position: "relative", width: 220, height: 220 }}>
            <svg width={220} height={220} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
              <circle cx={110} cy={110} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={8} />
              <circle cx={110} cy={110} r={radius} fill="none"
                stroke={ringColor} strokeWidth={8} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: timerState === "done" ? "#34d399" : "#475569", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 4 }}>
                {timerState === "done" ? "COMPLETE" : timerLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: displayColor, letterSpacing: "-0.03em", lineHeight: 1, filter: timerState !== "idle" ? `drop-shadow(0 0 20px ${glowColor})` : "none" }}>
                {timerState === "done" ? "✓" : fmt(timerSecs)}
              </div>
              <div style={{ fontSize: 11, color: timerState === "done" ? "#34d399" : "#475569", marginTop: 4 }}>
                {timerState === "done" ? "SESSION COMPLETE" : timerState === "running" ? "● RUNNING" : timerState === "paused" ? "○ PAUSED" : "○ READY"}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "center" }}>
          <button onClick={handleReset}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ↺ Reset
          </button>
          {timerState !== "done" && (
            <button onClick={() => setTimerState(s => s === "running" ? "paused" : "running")}
              style={{ background: timerState === "running" ? "rgba(239,68,68,0.15)" : "rgba(34,211,238,0.15)", border: `1px solid ${timerState === "running" ? "rgba(239,68,68,0.3)" : "rgba(34,211,238,0.3)"}`, borderRadius: 12, padding: "12px 32px", color: timerState === "running" ? "#ef4444" : "#22d3ee", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              {timerState === "running" ? "⏸ Pause" : timerState === "paused" ? "▶ Resume" : "▶ Start"}
            </button>
          )}
        </div>

        {/* Custom timer input */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10 }}>CUSTOM TIMER</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" min={1} max={999} placeholder="Minutes" value={customMins}
              onChange={e => setCustomMins(e.target.value)}
              style={{ ...inputBase, flex: 1 }} />
            <button onClick={() => {
              const m = parseInt(customMins);
              if (!isNaN(m) && m > 0) { setPreset(m, "Custom"); setCustomMins(""); }
            }} style={{
              background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)",
              borderRadius: 10, padding: "10px 18px", color: "#22d3ee", fontSize: 13,
              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              Set
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>QUICK PRESETS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {presets.map(p => (
              <button key={p.mins} onClick={() => setPreset(p.mins, p.label)}
                style={{ background: timerLabel === p.label && timerState !== "done" ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${timerLabel === p.label && timerState !== "done" ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "12px 6px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: timerLabel === p.label && timerState !== "done" ? "#22d3ee" : "#e2e8f0" }}>{p.mins}</div>
                <div style={{ fontSize: 9, color: "#475569", fontWeight: 600 }}>MIN</div>
                <div style={{ fontSize: 10, color: timerLabel === p.label && timerState !== "done" ? "#22d3ee" : "#64748b", marginTop: 2 }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>START A TASK</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map(t => {
              const m = META[t.section];
              return (
                <button key={t.id} onClick={() => setPreset(t.duration, t.label)}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#c4cdd9", fontWeight: 500 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>{t.duration}m</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Progress = () => {
    const stats = [
      { label: "Total Sessions", value: String(completedSessions), icon: "◎", color: "#22d3ee" },
      { label: "DSA Solved", value: String(dsaSolved), icon: "⌨", color: "#a78bfa" },
      { label: "Study Hours", value: `${(studyMins / 60).toFixed(1)}h`, icon: "⏱", color: "#fbbf24" },
      { label: "Day Streak", value: `${streak}🔥`, icon: "🔥", color: "#f87171" },
    ];

    const displayConsistency = (() => {
      const last7 = allConsistency.slice(-7);
      while (last7.length < 7) last7.unshift(false);
      return last7;
    })();
    const dayLabels = (() => {
      const labels: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(DAY_NAMES[d.getDay()]);
      }
      return labels;
    })();

    return (
      <div style={{ ...px, paddingTop: 52 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 600 }}>STATS</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Progress <span style={{ color: "#a78bfa" }}>Tracker</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {stats.map(st => (
            <div key={st.label} style={{ ...card, marginBottom: 0, textAlign: "center", padding: "18px 12px" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{st.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginTop: 4 }}>{st.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>TODAY'S COMPLETION</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Overall</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee" }}>{pct(doneIds.length, tasks.length)}%</span>
          </div>
          <ProgressBar value={pct(doneIds.length, tasks.length)} color="#22d3ee" />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {(["aptitude","dsa","semester"] as Section[]).map(sec => {
              const m = META[sec];
              const secTasks = tasks.filter(t => t.section === sec);
              const d = secTasks.filter(t => doneIds.includes(t.id)).length;
              return (
                <div key={sec}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{m.icon} {m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{d}/{secTasks.length}</span>
                  </div>
                  <ProgressBar value={pct(d, secTasks.length)} color={m.color} height={6} />
                </div>
              );
            })}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>WEEKLY CONSISTENCY</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {displayConsistency.map((studied, i) => {
              const d = dayLabels[i];
              const isToday = i === displayConsistency.length - 1;
              return (
                <div key={d} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: isToday ? "#22d3ee" : "#475569", fontWeight: 600, marginBottom: 6 }}>{d}</div>
                  <div style={{ aspectRatio: "1", borderRadius: 8, background: studied ? "#22d3ee22" : "rgba(255,255,255,0.03)", border: `1.5px solid ${isToday ? "#22d3ee" : studied ? "#22d3ee44" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {studied && <span style={{ fontSize: 12, color: "#22d3ee" }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: "#475569", textAlign: "center" }}>
            {displayConsistency.filter(Boolean).length}/7 days
          </div>
        </div>
      </div>
    );
  };

  const Weekly = () => {
    const [activeDay, setActiveDay] = useState(todayWeeklyIdx);
    const [editing, setEditing] = useState<{ dayIdx: number; field: "quant" | "dsa" | "sem" } | null>(null);
    const [editValue, setEditValue] = useState("");
    const day = weeklyPlan[activeDay];

    const startEdit = (dayIdx: number, field: "quant" | "dsa" | "sem", value: string) => {
      setEditing({ dayIdx, field });
      setEditValue(value);
    };

    const saveEdit = () => {
      if (editing) {
        setWeeklyPlan(prev => prev.map((d, i) =>
          i === editing.dayIdx ? { ...d, [editing.field]: editValue } : d
        ));
        setEditing(null);
      }
    };

    const isEditing = (dayIdx: number, field: "quant" | "dsa" | "sem") =>
      editing?.dayIdx === dayIdx && editing?.field === field;

    const EditableText = ({ dayIdx, field, value }: { dayIdx: number; field: "quant" | "dsa" | "sem"; value: string }) => {
      if (isEditing(dayIdx, field)) {
        return (
          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit} onKeyDown={e => { if (e.key === "Enter") saveEdit(); }}
            style={{ ...inputBase, padding: "4px 8px", fontSize: 13, width: "100%" }} />
        );
      }
      return (
        <span onClick={() => startEdit(dayIdx, field, value)}
          style={{ cursor: "pointer", fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
          {value}
          <span style={{ fontSize: 10, color: "#475569", opacity: 0.5 }}>✎</span>
        </span>
      );
    };

    return (
      <div style={{ paddingTop: 52 }}>
        <div style={{ ...px, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 600 }}>SCHEDULE</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Weekly <span style={{ color: "#fbbf24" }}>Plan</span></div>
        </div>
        <div style={{ overflowX: "auto", paddingLeft: 20, paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" as const }}>
          <div style={{ display: "flex", gap: 8, width: "max-content" }}>
            {weeklyPlan.map((d, i) => (
              <button key={d.day} onClick={() => { setActiveDay(i); setEditing(null); }} style={{
                padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" as const,
                border: `1px solid ${i === activeDay ? "#fbbf24" : "rgba(255,255,255,0.08)"}`,
                background: i === activeDay ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                color: i === activeDay ? "#fbbf24" : i === todayWeeklyIdx ? "#e2e8f0" : "#64748b",
              }}>
                {d.day}{i === todayWeeklyIdx && " •"}
              </button>
            ))}
          </div>
        </div>
        <div style={px}>
          {activeDay === 6 ? (
            <div style={{ ...card, textAlign: "center", padding: "36px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>Light Sunday</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
                GitHub projects, review progress, or rest. Consistency is built over time.
              </div>
            </div>
          ) : (
            <>
              {([
                { icon: "⚡", color: "#fbbf24", label: "APTITUDE — QUANT", field: "quant" as const, items: ["30 min Quant Practice","20 min Logical Reasoning","10 min Verbal"] },
                { icon: "⌨", color: "#22d3ee", label: "DSA PRACTICE", field: "dsa" as const, items: ["20 min Beginner Problems","40 min Medium Problems"] },
                { icon: "📖", color: "#a78bfa", label: "SEMESTER STUDY", field: "sem" as const, items: ["20 min Notes Making","20 min Theory / YouTube","20 min Practice"] },
              ]).map(sec => (
                <div key={sec.label} style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 22 }}>{sec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "0.06em" }}>{sec.label}</div>
                      <div style={{ marginTop: 2 }}>
                        <EditableText dayIdx={activeDay} field={sec.field} value={day[sec.field]} />
                      </div>
                    </div>
                  </div>
                  {sec.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sec.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.15)" }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Total Study Time</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>3h 0min</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const Manage = () => {
    const [newName, setNewName] = useState("");
    const [newDuration, setNewDuration] = useState("25");
    const [newSection, setNewSection] = useState<Section>("aptitude");

    const addTask = () => {
      if (!newName.trim()) return;
      const dur = parseInt(newDuration);
      if (isNaN(dur) || dur < 1) return;
      setTasks(prev => [...prev, {
        id: crypto.randomUUID(),
        label: newName.trim(),
        duration: dur,
        section: newSection,
      }]);
      setNewName("");
      setNewDuration("25");
    };

    const deleteTask = (id: TaskId) => {
      setTasks(prev => prev.filter(t => t.id !== id));
      setDoneIds(prev => prev.filter(tid => tid !== id));
    };

    return (
      <div style={px}>
        <div style={{ paddingTop: 52, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 600 }}>TASKS</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Manage <span style={{ color: "#22d3ee" }}>Tasks</span></div>
        </div>

        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#22d3ee", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 14 }}>+ ADD NEW TASK</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Task name" value={newName} onChange={e => setNewName(e.target.value)}
              style={inputBase} />
            <div style={{ display: "flex", gap: 10 }}>
              <input type="number" min={1} placeholder="Minutes" value={newDuration}
                onChange={e => setNewDuration(e.target.value)} style={{ ...inputBase, width: 100, flexShrink: 0 }} />
              <select value={newSection} onChange={e => setNewSection(e.target.value as Section)}
                style={{ ...inputBase, cursor: "pointer", width: "auto", flex: 1 }}>
                <option value="aptitude" style={{ background: "#0a0e1a" }}>Aptitude</option>
                <option value="dsa" style={{ background: "#0a0e1a" }}>DSA</option>
                <option value="semester" style={{ background: "#0a0e1a" }}>Semester</option>
              </select>
            </div>
            <button onClick={addTask}
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 10, padding: "10px", color: "#22d3ee", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add Task
            </button>
          </div>
        </div>

        {(["aptitude","dsa","semester"] as Section[]).map(sec => {
          const m = META[sec];
          const secTasks = tasks.filter(t => t.section === sec);
          if (secTasks.length === 0) return null;
          return (
            <div key={sec} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{secTasks.length} task{secTasks.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {secTasks.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontSize: 13, color: "#c4cdd9", fontWeight: 500 }}>{t.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: `${m.color}11`, padding: "2px 8px", borderRadius: 6 }}>
                      {t.duration}m
                    </span>
                    <button onClick={() => deleteTask(t.id)}
                      style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: "36px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14, color: "#64748b" }}>No tasks yet. Add one above!</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        body { background: #0a0e1a; }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        select option { background: #0a0e1a; }
      `}</style>
      <div style={containerStyle}>
        <div style={{ position: "fixed", inset: 0, maxWidth: 430, margin: "0 auto", background: "radial-gradient(ellipse 80% 50% at 50% -10%, #1e2d5a44 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 88, position: "relative", zIndex: 1 }}>
          {screen === "dashboard" && <Dashboard />}
          {screen === "session"   && <Session />}
          {screen === "manage"    && <Manage />}
          {screen === "progress"  && <Progress />}
          {screen === "weekly"    && <Weekly />}
        </div>
        <NavBar />
      </div>
    </>
  );
}
