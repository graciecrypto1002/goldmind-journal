import { useState, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOTIONS = [
  { label: "Focused", icon: "🎯" }, { label: "Calm", icon: "🧘" },
  { label: "Confident", icon: "💪" }, { label: "Patient", icon: "⏳" },
  { label: "Anxious", icon: "😰" }, { label: "Fearful", icon: "😨" },
  { label: "Greedy", icon: "🤑" }, { label: "FOMO", icon: "🏃" },
  { label: "Frustrated", icon: "😤" }, { label: "Overconfident", icon: "🦁" },
];

const SETUPS = ["Break & Retest", "Trend Continuation", "Reversal", "Support / Resistance", "Fair Value Gap", "Liquidity Sweep", "News Reaction", "Range Scalp", "Other"];
const SESSIONS = ["London Open", "New York Open", "London–NY Overlap", "Asian Session"];
const MISTAKES = ["Moved Stop Loss", "No Stop Loss", "Oversized Position", "Revenge Trade", "Deviated from Plan", "Chased Entry", "Ignored News", "Early Exit", "None"];
const RULES = [
  "Only trade setups rated A or B quality",
  "Risk no more than 1% of account per trade",
  "Confirm direction on H4 before entry",
  "Avoid trading 30 min around major news",
  "Do not trade if mentally unwell or distracted",
  "Record every trade — no exceptions",
];

const PSYCH_INSIGHTS = [
  {
    title: "Your Edge Only Works If You Let It",
    tag: "Consistency",
    body: "A trading strategy only proves itself across hundreds of executions. Skipping a setup because of gut feel, or exiting early because of fear, breaks the statistical sample your edge needs to breathe. Trust the process — execute the plan, then let the market decide.",
  },
  {
    title: "The Trade After the Loss",
    tag: "Emotional Reset",
    body: "The most dangerous trade you'll ever take is the one immediately after a loss. Your brain shifts into recovery mode — it wants the money back, not another good trade. Pause. Journal the loss. Walk away for 20 minutes. Come back only when the chart, not your ego, is telling you to trade.",
  },
  {
    title: "Position Size Is Emotional Management",
    tag: "Risk Control",
    body: "When your position is too large, every tick becomes personal. Your decision-making narrows. You move stops. You exit early. You revenge trade. Sizing down isn't weakness — it's how professionals stay rational while amateurs spiral. The goal is longevity, not lottery.",
  },
  {
    title: "Grade the Process, Not the Outcome",
    tag: "Self-Assessment",
    body: "A trade that hits stop loss can still be an A+ trade. A trade that hits target can still be a failure. What matters is whether you followed your rules, entered at the right moment, sized correctly, and managed the trade according to your plan. Outcomes are random in the short term. Process is in your control.",
  },
  {
    title: "Patience Is the Most Profitable Skill",
    tag: "Discipline",
    body: "Most retail traders lose money not because their analysis is wrong, but because they trade too often. The professionals who consistently profit spend most of their time doing nothing — watching, waiting, and only acting when the market hands them exactly what they planned for. Doing nothing IS a position.",
  },
  {
    title: "What Your Journal Is Really Tracking",
    tag: "Self-Awareness",
    body: "Your journal isn't a record of trades — it's a mirror of your mind. Patterns emerge over weeks: which emotions lead to losses, which sessions you perform worst in, which setups you abandon too early. The trader who studies themselves as rigorously as they study charts is the one who lasts.",
  },
];

const todayStr = () => new Date().toISOString().split("T")[0];

const blankForm = () => ({
  id: null, date: todayStr(), session: "", setup: "", direction: "",
  entry: "", exit: "", sl: "", tp: "", lots: "", pnl: "",
  preEmotion: "", duringEmotion: "", postEmotion: "",
  followedPlan: null, mistakes: [], grade: "", lesson: "", mentalNote: "",
});

// ─── AI Feedback ──────────────────────────────────────────────────────────────

async function getAIFeedback(trade) {
  const prompt = `You are a professional trading coach specializing in gold (XAUUSD) and trader psychology.

A trader just logged this trade:
- Date: ${trade.date}
- Direction: ${trade.direction?.toUpperCase()}
- Session: ${trade.session}
- Setup: ${trade.setup}
- Entry: ${trade.entry} | Exit: ${trade.exit}
- Stop Loss: ${trade.sl} | Take Profit: ${trade.tp}
- Lot Size: ${trade.lots}
- P&L: $${trade.pnl}
- Pre-trade emotion: ${trade.preEmotion}
- During-trade emotion: ${trade.duringEmotion}
- Post-trade emotion: ${trade.postEmotion}
- Followed plan: ${trade.followedPlan === true ? "Yes" : trade.followedPlan === false ? "No" : "Not recorded"}
- Mistakes: ${trade.mistakes?.join(", ") || "None"}
- Self-grade: ${trade.grade || "Not graded"}
- Lesson noted: ${trade.lesson || "None"}
- Mental state: ${trade.mentalNote || "Not noted"}

Provide concise, direct coaching feedback in 3 short sections:
1. **What went well** (1-2 sentences, be specific)
2. **What to improve** (1-2 sentences, actionable)
3. **Psychological focus for next trade** (1 sentence, practical)

Be direct, warm, and specific. Do not be generic. Max 120 words total.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "Unable to generate feedback.";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmotionPicker({ value, onChange }) {
  return (
    <div className="emotion-grid">
      {EMOTIONS.map(e => (
        <button key={e.label} type="button"
          className={`emotion-chip ${value === e.label ? "selected" : ""}`}
          onClick={() => onChange(value === e.label ? "" : e.label)}>
          <span className="emotion-icon">{e.icon}</span>
          <span>{e.label}</span>
        </button>
      ))}
    </div>
  );
}

function GradePicker({ value, onChange }) {
  const grades = [
    { g: "A+", color: "#16a34a" }, { g: "A", color: "#22c55e" },
    { g: "B", color: "#ca8a04" }, { g: "C", color: "#ea580c" },
    { g: "D", color: "#dc2626" }, { g: "F", color: "#991b1b" },
  ];
  return (
    <div className="grade-row">
      {grades.map(({ g, color }) => (
        <button key={g} type="button"
          className={`grade-chip ${value === g ? "active" : ""}`}
          style={value === g ? { background: color, color: "#fff", borderColor: color } : {}}
          onClick={() => onChange(value === g ? "" : g)}>{g}</button>
      ))}
    </div>
  );
}

function MistakePicker({ value, onChange }) {
  const toggle = (m) => {
    if (m === "None") { onChange(["None"]); return; }
    const without = value.filter(x => x !== "None");
    onChange(without.includes(m) ? without.filter(x => x !== m) : [...without, m]);
  };
  return (
    <div className="tag-row">
      {MISTAKES.map(m => (
        <button key={m} type="button"
          className={`tag-chip ${value.includes(m) ? "selected-mistake" : ""}`}
          onClick={() => toggle(m)}>{m}</button>
      ))}
    </div>
  );
}

function RulesChecklist({ checked, onChange }) {
  return (
    <div className="rules-list">
      {RULES.map((r, i) => (
        <label key={i} className={`rule-row ${checked[i] ? "checked" : ""}`}>
          <span className={`rule-box ${checked[i] ? "checked" : ""}`}>
            {checked[i] && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          <input type="checkbox" checked={!!checked[i]} onChange={() => onChange(i)} style={{ display: "none" }} />
          <span>{r}</span>
        </label>
      ))}
    </div>
  );
}

function StatCard({ value, label, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-val" style={{ color: color || "#111" }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TradeCard({ trade, onDelete, onFeedback }) {
  const pnl = parseFloat(trade.pnl) || 0;
  const isWin = pnl > 0;
  const isLoss = pnl < 0;
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(trade.aiFeedback || "");
  const [loading, setLoading] = useState(false);

  const handleFeedback = async () => {
    setLoading(true);
    const fb = await getAIFeedback(trade);
    setFeedback(fb);
    onFeedback(trade.id, fb);
    setLoading(false);
  };

  return (
    <div className={`tcard ${isWin ? "tcard-win" : isLoss ? "tcard-loss" : ""}`}>
      <div className="tcard-top" onClick={() => setExpanded(e => !e)}>
        <div className="tcard-left">
          <span className="tcard-date">{trade.date}</span>
          <span className={`dir-badge ${trade.direction}`}>{trade.direction?.toUpperCase()}</span>
          <span className="session-badge">{trade.session}</span>
          {trade.setup && <span className="setup-badge">{trade.setup}</span>}
        </div>
        <div className="tcard-right">
          {trade.grade && <span className="grade-badge">{trade.grade}</span>}
          <span className={`pnl-badge ${isWin ? "pos" : isLoss ? "neg" : ""}`}>
            {pnl > 0 ? "+" : ""}{pnl.toFixed(2)} USD
          </span>
          <span className="expand-icon">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="tcard-body">
          <div className="tcard-grid">
            <div className="tcard-field"><span>Entry</span><strong>{trade.entry}</strong></div>
            <div className="tcard-field"><span>Exit</span><strong>{trade.exit}</strong></div>
            <div className="tcard-field"><span>Stop Loss</span><strong>{trade.sl}</strong></div>
            <div className="tcard-field"><span>Take Profit</span><strong>{trade.tp}</strong></div>
            <div className="tcard-field"><span>Lot Size</span><strong>{trade.lots}</strong></div>
            <div className="tcard-field"><span>Followed Plan</span><strong>{trade.followedPlan === true ? "✓ Yes" : trade.followedPlan === false ? "✗ No" : "—"}</strong></div>
          </div>

          <div className="emotion-summary">
            <div className="es-item"><span>Before</span><strong>{trade.preEmotion || "—"}</strong></div>
            <div className="es-sep">→</div>
            <div className="es-item"><span>During</span><strong>{trade.duringEmotion || "—"}</strong></div>
            <div className="es-sep">→</div>
            <div className="es-item"><span>After</span><strong>{trade.postEmotion || "—"}</strong></div>
          </div>

          {trade.mistakes?.length > 0 && trade.mistakes[0] !== "None" && (
            <div className="mistake-row">
              {trade.mistakes.map(m => <span key={m} className="mistake-pill">{m}</span>)}
            </div>
          )}

          {trade.lesson && <div className="note-box"><span>💡</span><p>{trade.lesson}</p></div>}
          {trade.mentalNote && <div className="note-box mental"><span>🧘</span><p>{trade.mentalNote}</p></div>}

          {feedback && (
            <div className="ai-feedback">
              <div className="ai-feedback-header">
                <span className="ai-badge">AI Coach</span>
                <span>Personalized Feedback</span>
              </div>
              <div className="ai-feedback-body">
                {feedback.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="tcard-actions">
            <button className="ai-btn" onClick={handleFeedback} disabled={loading}>
              {loading ? "Analyzing…" : feedback ? "Refresh AI Feedback" : "✦ Get AI Coaching Feedback"}
            </button>
            <button className="del-btn" onClick={() => onDelete(trade.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function GoldMindJournal() {
  const [tab, setTab] = useState("log");
  const [form, setForm] = useState(blankForm());
  const [trades, setTrades] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gm_trades") || "[]"); } catch { return []; }
  });
  const [rules, setRules] = useState(Array(RULES.length).fill(false));
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReview, setAiReview] = useState("");

  useEffect(() => {
    try { localStorage.setItem("gm_trades", JSON.stringify(trades)); } catch {}
  }, [trades]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMistake = (m) => {
    const cur = form.mistakes;
    if (m === "None") { set("mistakes", ["None"]); return; }
    const without = cur.filter(x => x !== "None");
    set("mistakes", without.includes(m) ? without.filter(x => x !== m) : [...without, m]);
  };

  const handleSave = () => {
    if (!form.direction || !form.entry) return;
    const t = { ...form, id: Date.now(), aiFeedback: "" };
    setTrades(prev => [t, ...prev]);
    setForm(blankForm());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTab("journal");
  };

  const handleDelete = (id) => setTrades(t => t.filter(x => x.id !== id));

  const handleFeedbackSave = (id, fb) => {
    setTrades(t => t.map(x => x.id === id ? { ...x, aiFeedback: fb } : x));
  };

  const handleDayReview = async () => {
    const today = trades.filter(t => t.date === todayStr());
    if (!today.length) return;
    setAiLoading(true);
    const summary = today.map(t =>
      `${t.direction?.toUpperCase()} ${t.setup} P&L:$${t.pnl} Grade:${t.grade} Emotions:${t.preEmotion}→${t.duringEmotion}→${t.postEmotion} Mistakes:${t.mistakes?.join(",")||"none"}`
    ).join(" | ");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are a trading psychology coach. A gold (XAUUSD) trader had these trades today: ${summary}. Give a concise end-of-day review in 3 parts: 1) Overall performance summary (2 sentences), 2) Key psychological pattern observed today (2 sentences), 3) One specific focus for tomorrow (1 sentence). Be direct and specific. Max 100 words.`
        }],
      }),
    });
    const data = await res.json();
    setAiReview(data.content?.find(b => b.type === "text")?.text || "No review available.");
    setAiLoading(false);
  };

  // Stats
  const wins = trades.filter(t => parseFloat(t.pnl) > 0);
  const losses = trades.filter(t => parseFloat(t.pnl) < 0);
  const totalPnl = trades.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
  const winRate = trades.length ? ((wins.length / trades.length) * 100).toFixed(1) : "0.0";
  const avgWin = wins.length ? (wins.reduce((a, t) => a + parseFloat(t.pnl), 0) / wins.length).toFixed(2) : "0";
  const avgLoss = losses.length ? (losses.reduce((a, t) => a + parseFloat(t.pnl), 0) / losses.length).toFixed(2) : "0";
  const rr = avgLoss < 0 ? Math.abs(parseFloat(avgWin) / parseFloat(avgLoss)).toFixed(2) : "∞";

  const emotionMap = {};
  trades.forEach(t => {
    [t.preEmotion, t.duringEmotion, t.postEmotion].forEach(e => {
      if (e) emotionMap[e] = (emotionMap[e] || 0) + 1;
    });
  });
  const topEmotion = Object.entries(emotionMap).sort((a, b) => b[1] - a[1])[0];

  const unplanned = trades.filter(t => t.followedPlan === false);
  const unplannedWinRate = unplanned.length
    ? ((unplanned.filter(t => parseFloat(t.pnl) > 0).length / unplanned.length) * 100).toFixed(0)
    : null;

  const filtered = {
    all: trades,
    wins: wins,
    losses: losses,
    unplanned,
  }[filter] || trades;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #fafaf8;
          --surface: #ffffff;
          --surface2: #f5f4f0;
          --border: #e8e4dc;
          --border2: #d4cfc6;
          --text: #1a1916;
          --text2: #6b6760;
          --text3: #a8a49e;
          --gold: #b8933a;
          --gold-light: #f0e4c4;
          --gold-soft: #fdf6e8;
          --green: #16a34a;
          --green-bg: #f0fdf4;
          --red: #dc2626;
          --red-bg: #fef2f2;
          --shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          --shadow-md: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Lato', sans-serif;
          font-weight: 300;
          min-height: 100vh;
        }

        .app { max-width: 860px; margin: 0 auto; padding: 0 20px 80px; }

        /* Header */
        .header {
          padding: 48px 0 32px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 32px;
        }

        .header-eyebrow {
          font-size: 0.65rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 700;
          margin-bottom: 10px;
        }

        .header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2.6rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .header h1 span { color: var(--gold); }

        .header-sub {
          margin-top: 10px;
          font-size: 0.82rem;
          color: var(--text3);
          letter-spacing: 0.3px;
          font-weight: 400;
        }

        .header-rule {
          width: 40px;
          height: 2px;
          background: var(--gold);
          margin-top: 20px;
        }

        /* Nav */
        .nav {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 36px;
        }

        .nav-btn {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          color: var(--text3);
          font-family: 'Lato', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover { color: var(--text2); }
        .nav-btn.active { color: var(--gold); border-bottom-color: var(--gold); }

        /* Form */
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text);
          margin: 28px 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .field-label {
          font-size: 0.65rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text3);
          font-weight: 700;
          margin-bottom: 6px;
        }

        .field-group { display: flex; flex-direction: column; }

        input, select, textarea {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-family: 'Lato', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          padding: 10px 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }

        input:focus, select:focus, textarea:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(184,147,58,0.1);
        }

        input::placeholder { color: var(--text3); }
        textarea { resize: vertical; min-height: 72px; line-height: 1.6; }
        select option { background: #fff; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-grid.three { grid-template-columns: 1fr 1fr 1fr; }
        .full { grid-column: 1 / -1; }

        /* Direction */
        .dir-row { display: flex; gap: 10px; }
        .dir-btn {
          flex: 1;
          padding: 12px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Lato', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dir-btn.buy.active { background: var(--green-bg); border-color: var(--green); color: var(--green); }
        .dir-btn.sell.active { background: var(--red-bg); border-color: var(--red); color: var(--red); }

        /* Emotions */
        .emotion-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .emotion-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Lato', sans-serif;
          font-size: 0.76rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.15s;
        }
        .emotion-chip:hover { border-color: var(--gold); }
        .emotion-chip.selected { background: var(--gold-soft); border-color: var(--gold); color: var(--gold); font-weight: 700; }
        .emotion-icon { font-size: 0.9rem; }

        /* Tags */
        .tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag-chip {
          padding: 5px 11px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Lato', sans-serif;
          font-size: 0.74rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tag-chip.selected-mistake { background: var(--red-bg); border-color: var(--red); color: var(--red); }

        /* Plan */
        .plan-row { display: flex; gap: 10px; }
        .plan-btn {
          flex: 1;
          padding: 10px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Lato', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .plan-btn.yes.active { background: var(--green-bg); border-color: var(--green); color: var(--green); }
        .plan-btn.no.active { background: var(--red-bg); border-color: var(--red); color: var(--red); }

        /* Grade */
        .grade-row { display: flex; gap: 6px; }
        .grade-chip {
          flex: 1;
          padding: 8px 4px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .grade-chip:hover { border-color: var(--border2); }

        /* Rules */
        .rules-list { display: flex; flex-direction: column; gap: 8px; }
        .rule-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--text2);
          background: var(--surface);
          transition: all 0.15s;
          font-weight: 400;
        }
        .rule-row.checked { background: var(--gold-soft); border-color: var(--gold-light); color: var(--text); }
        .rule-box {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--border2);
          border-radius: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .rule-box.checked { background: var(--gold); border-color: var(--gold); color: #fff; }

        /* Save button */
        .save-btn {
          width: 100%;
          padding: 15px;
          background: var(--gold);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'Lato', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 28px;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(184,147,58,0.3);
        }
        .save-btn:hover { background: #a07e30; }
        .save-btn.saved { background: var(--green); box-shadow: 0 2px 8px rgba(22,163,74,0.3); }

        /* Trade cards */
        .filter-row { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
        .filter-btn {
          padding: 7px 16px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--surface);
          color: var(--text2);
          font-family: 'Lato', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-btn.active { background: var(--gold); border-color: var(--gold); color: #fff; }

        .tcard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 10px;
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: box-shadow 0.2s;
        }
        .tcard:hover { box-shadow: var(--shadow-md); }
        .tcard-win { border-left: 3px solid var(--green); }
        .tcard-loss { border-left: 3px solid var(--red); }

        .tcard-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          cursor: pointer;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tcard-left, .tcard-right { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }

        .tcard-date { font-size: 0.72rem; color: var(--text3); font-weight: 400; }

        .dir-badge {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .dir-badge.buy { background: var(--green-bg); color: var(--green); }
        .dir-badge.sell { background: var(--red-bg); color: var(--red); }

        .session-badge, .setup-badge {
          font-size: 0.66rem;
          color: var(--text3);
          border: 1px solid var(--border);
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 400;
        }

        .grade-badge {
          font-family: 'Playfair Display', serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gold);
          border: 1px solid var(--gold-light);
          padding: 1px 7px;
          border-radius: 4px;
          background: var(--gold-soft);
        }

        .pnl-badge {
          font-size: 0.85rem;
          font-weight: 700;
        }
        .pnl-badge.pos { color: var(--green); }
        .pnl-badge.neg { color: var(--red); }

        .expand-icon { font-size: 0.6rem; color: var(--text3); }

        .tcard-body {
          padding: 0 18px 16px;
          border-top: 1px solid var(--border);
        }

        .tcard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2px;
          margin-top: 12px;
        }

        .tcard-field {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--bg);
          font-size: 0.74rem;
        }
        .tcard-field span { color: var(--text3); }
        .tcard-field strong { color: var(--text); font-weight: 400; }

        .emotion-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          padding: 10px 14px;
          background: var(--surface2);
          border-radius: 8px;
          flex-wrap: wrap;
        }
        .es-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .es-item span { font-size: 0.6rem; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
        .es-item strong { font-size: 0.78rem; color: var(--text); font-weight: 700; }
        .es-sep { color: var(--text3); font-size: 0.8rem; }

        .mistake-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
        .mistake-pill { background: var(--red-bg); color: var(--red); font-size: 0.68rem; padding: 3px 9px; border-radius: 4px; }

        .note-box {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          padding: 10px 12px;
          background: var(--gold-soft);
          border-radius: 8px;
          font-size: 0.78rem;
          color: var(--text2);
          line-height: 1.6;
        }
        .note-box.mental { background: var(--surface2); }
        .note-box span { flex-shrink: 0; }

        .ai-feedback {
          margin-top: 14px;
          border: 1px solid var(--gold-light);
          border-radius: 10px;
          overflow: hidden;
        }
        .ai-feedback-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--gold-soft);
          border-bottom: 1px solid var(--gold-light);
          font-size: 0.72rem;
          color: var(--text2);
          font-weight: 400;
        }
        .ai-badge {
          background: var(--gold);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 3px;
        }
        .ai-feedback-body {
          padding: 12px 14px;
          font-size: 0.8rem;
          color: var(--text2);
          line-height: 1.7;
        }
        .ai-feedback-body p { margin-bottom: 6px; }
        .ai-feedback-body p:last-child { margin-bottom: 0; }

        .tcard-actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .ai-btn {
          flex: 1;
          padding: 9px 14px;
          background: var(--gold);
          border: none;
          border-radius: 7px;
          color: #fff;
          font-family: 'Lato', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-btn:hover { background: #a07e30; }
        .ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .del-btn {
          padding: 9px 14px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 7px;
          color: var(--text3);
          font-family: 'Lato', sans-serif;
          font-size: 0.74rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .del-btn:hover { border-color: var(--red); color: var(--red); }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px 16px;
          box-shadow: var(--shadow);
        }

        .stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.64rem;
          color: var(--text3);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 6px;
          font-weight: 700;
        }

        .stat-sub {
          font-size: 0.72rem;
          color: var(--text3);
          margin-top: 3px;
        }

        .day-review-btn {
          width: 100%;
          padding: 13px;
          background: var(--surface);
          border: 1.5px solid var(--gold);
          border-radius: 10px;
          color: var(--gold);
          font-family: 'Lato', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          margin-bottom: 24px;
          transition: all 0.2s;
        }
        .day-review-btn:hover { background: var(--gold-soft); }
        .day-review-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .day-review-box {
          padding: 16px 18px;
          background: var(--gold-soft);
          border: 1px solid var(--gold-light);
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 0.8rem;
          color: var(--text2);
          line-height: 1.8;
        }

        .day-review-box p { margin-bottom: 6px; }

        /* Psychology */
        .insight-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 22px 24px;
          margin-bottom: 12px;
          box-shadow: var(--shadow);
        }

        .insight-tag {
          display: inline-block;
          font-size: 0.62rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 700;
          margin-bottom: 8px;
          background: var(--gold-soft);
          padding: 3px 9px;
          border-radius: 4px;
        }

        .insight-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .insight-body {
          font-size: 0.82rem;
          color: var(--text2);
          line-height: 1.8;
          font-weight: 400;
        }

        /* Empty */
        .empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text3);
          font-size: 0.8rem;
        }

        .empty-icon { font-size: 2.4rem; display: block; margin-bottom: 12px; }

        /* Responsive */
        @media (max-width: 600px) {
          .form-grid, .form-grid.three { grid-template-columns: 1fr 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .tcard-grid { grid-template-columns: 1fr 1fr; }
          .header h1 { font-size: 2rem; }
          .nav-btn { padding: 10px 12px; font-size: 0.7rem; }
        }

        .divider { height: 1px; background: var(--border); margin: 28px 0; }
      `}</style>

      <div className="app">
        <div className="header">
          <div className="header-eyebrow">XAUUSD · Gold Trading</div>
          <h1>GoldMind <span>Journal</span></h1>
          <div className="header-sub">Performance tracking built around trader psychology</div>
          <div className="header-rule" />
        </div>

        <div className="nav">
          {[["log", "Log Trade"], ["journal", "Journal"], ["stats", "Analytics"], ["psych", "Mindset"]].map(([k, l]) => (
            <button key={k} className={`nav-btn ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ── LOG TRADE ── */}
        {tab === "log" && (
          <div>
            <div className="section-title">Trade Details</div>
            <div className="form-grid three">
              <div className="field-group">
                <div className="field-label">Date</div>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
              </div>
              <div className="field-group">
                <div className="field-label">Session</div>
                <select value={form.session} onChange={e => set("session", e.target.value)}>
                  <option value="">Select session…</option>
                  {SESSIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">Setup Type</div>
                <select value={form.setup} onChange={e => set("setup", e.target.value)}>
                  <option value="">Select setup…</option>
                  {SETUPS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="section-title">Direction</div>
            <div className="dir-row">
              <button type="button" className={`dir-btn buy ${form.direction === "buy" ? "active" : ""}`} onClick={() => set("direction", "buy")}>▲ Buy / Long</button>
              <button type="button" className={`dir-btn sell ${form.direction === "sell" ? "active" : ""}`} onClick={() => set("direction", "sell")}>▼ Sell / Short</button>
            </div>

            <div className="section-title">Price Levels</div>
            <div className="form-grid three">
              {[["entry","Entry Price"],["exit","Exit Price"],["sl","Stop Loss"],["tp","Take Profit"],["lots","Lot Size"],["pnl","P&L (USD)"]].map(([k,l]) => (
                <div className="field-group" key={k}>
                  <div className="field-label">{l}</div>
                  <input type="number" step="0.01" placeholder="0.00" value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="section-title">Emotional State</div>
            <div className="field-label" style={{marginBottom:8}}>Before the trade</div>
            <EmotionPicker value={form.preEmotion} onChange={v => set("preEmotion", v)} />
            <div className="field-label" style={{marginTop:14, marginBottom:8}}>During the trade</div>
            <EmotionPicker value={form.duringEmotion} onChange={v => set("duringEmotion", v)} />
            <div className="field-label" style={{marginTop:14, marginBottom:8}}>After the trade</div>
            <EmotionPicker value={form.postEmotion} onChange={v => set("postEmotion", v)} />

            <div className="section-title">Execution Review</div>
            <div className="field-label" style={{marginBottom:8}}>Did you follow your trading plan?</div>
            <div className="plan-row">
              <button type="button" className={`plan-btn yes ${form.followedPlan === true ? "active" : ""}`} onClick={() => set("followedPlan", true)}>✓ Yes, fully</button>
              <button type="button" className={`plan-btn no ${form.followedPlan === false ? "active" : ""}`} onClick={() => set("followedPlan", false)}>✗ No, I deviated</button>
            </div>

            <div className="field-label" style={{marginTop:16, marginBottom:8}}>Execution mistakes (select all that apply)</div>
            <MistakePicker value={form.mistakes} onChange={v => set("mistakes", v)} />

            <div className="section-title">Trade Grade</div>
            <GradePicker value={form.grade} onChange={v => set("grade", v)} />

            <div className="section-title">Reflection</div>
            <div className="form-grid">
              <div className="field-group full">
                <div className="field-label">What did this trade teach you?</div>
                <textarea placeholder="Write one specific, actionable lesson from this trade…" value={form.lesson} onChange={e => set("lesson", e.target.value)} />
              </div>
              <div className="field-group full">
                <div className="field-label">Mental & physical state today</div>
                <textarea placeholder="Sleep quality, stress level, focus, mood — anything relevant…" value={form.mentalNote} onChange={e => set("mentalNote", e.target.value)} />
              </div>
            </div>

            <div className="section-title">Pre-Session Checklist</div>
            <RulesChecklist checked={rules} onChange={i => setRules(r => r.map((v, idx) => idx === i ? !v : v))} />

            <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
              {saved ? "✓ Trade Saved" : "Save Trade"}
            </button>
          </div>
        )}

        {/* ── JOURNAL ── */}
        {tab === "journal" && (
          <div>
            <div className="filter-row">
              {[["all","All Trades"],["wins","Wins"],["losses","Losses"],["unplanned","Unplanned"]].map(([k,l]) => (
                <button key={k} className={`filter-btn ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">📖</span>
                No trades here yet. Log your first trade to get started.
              </div>
            ) : filtered.map(t => (
              <TradeCard key={t.id} trade={t} onDelete={handleDelete} onFeedback={handleFeedbackSave} />
            ))}
          </div>
        )}

        {/* ── STATS ── */}
        {tab === "stats" && (
          <div>
            {trades.length === 0 ? (
              <div className="empty"><span className="empty-icon">📊</span>Log some trades to see your analytics.</div>
            ) : (
              <>
                <button className="day-review-btn" onClick={handleDayReview} disabled={aiLoading}>
                  {aiLoading ? "Generating review…" : "✦ Generate Today's AI End-of-Day Review"}
                </button>

                {aiReview && (
                  <div className="day-review-box">
                    {aiReview.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                )}

                <div className="stats-grid">
                  <StatCard value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`} label="Total P&L (USD)" color={totalPnl >= 0 ? "var(--green)" : "var(--red)"} />
                  <StatCard value={`${winRate}%`} label="Win Rate" sub={`${wins.length}W / ${losses.length}L`} />
                  <StatCard value={trades.length} label="Total Trades" />
                  <StatCard value={`${rr}:1`} label="Avg Risk/Reward" />
                  <StatCard value={`+${avgWin}`} label="Average Win" color="var(--green)" />
                  <StatCard value={avgLoss} label="Average Loss" color="var(--red)" />
                  {topEmotion && <StatCard value={topEmotion[0]} label={`Most Frequent Emotion (${topEmotion[1]}×)`} />}
                  {unplannedWinRate !== null && (
                    <StatCard value={`${unplannedWinRate}%`} label="Win Rate When Unplanned" color="var(--red)" sub="Compare to your overall rate" />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PSYCH ── */}
        {tab === "psych" && (
          <div>
            {PSYCH_INSIGHTS.map((p, i) => (
              <div key={i} className="insight-card">
                <div className="insight-tag">{p.tag}</div>
                <div className="insight-title">{p.title}</div>
                <div className="insight-body">{p.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
