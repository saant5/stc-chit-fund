// client/src/pages/Payments.jsx
// Fully wired to real backend APIs
import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  gold:"#C9922A", goldLight:"#E5B253", goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)", goldGlow:"rgba(201,146,42,0.15)",
  ink:"#0f0e0c", paper:"#faf8f3", paperDark:"#f2ede3",
  muted:"#6b6557", border:"rgba(201,146,42,0.2)", borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff", green:"#2e7d52", greenBg:"#edf7f1",
  red:"#b03a1a", redBg:"#fff4f0", blue:"#1a5fa8", blueBg:"#eef4fc",
  orange:"#c45c12", orangeBg:"#fff3ea",
  radius:"14px", radiusSm:"9px", shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

const PAYMENT_MODES = ["UPI", "NEFT / IMPS", "Cash", "Cheque"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w="100%", h=20, radius=6 }) {
  return (
    <div style={{ width:w, height:h, borderRadius:radius,
      background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",
      backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    paid:    { bg:T.greenBg, color:T.green,  label:"✓ Paid"     },
    due:     { bg:T.redBg,   color:T.red,    label:"⚠ Due"      },
    partial: { bg:T.orangeBg,color:T.orange, label:"◑ Partial"  },
    pending: { bg:T.redBg,   color:T.red,    label:"⚠ Due"      },
    overdue: { bg:T.redBg,   color:T.red,    label:"✕ Overdue"  },
    upcoming:{ bg:T.blueBg,  color:T.blue,   label:"◷ Upcoming" },
  };
  const s = map[status] || map.upcoming;
  return (
    <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"3px 11px",
      borderRadius:20, letterSpacing:"0.05em", background:s.bg, color:s.color }}>
      {s.label}
    </span>
  );
}

// ─── Pay Modal — calls real API ───────────────────────────────────────────────
function PayModal({ chit, onClose, onSuccess }) {
  const [mode,    setMode]    = useState("UPI");
  const [ref,     setRef]     = useState("");
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);  // 1=form 2=confirm 3=success
  const [apiErr,  setApiErr]  = useState("");

  const due = chit.currentDue;
  const balanceDue = due?.dueAmount || 0;
  const modeKey = mode === "NEFT / IMPS" ? "NEFT" : mode;

  const handlePay = async () => {
    setLoading(true); setApiErr("");
    try {
      await API.post("/api/payments/pay", {
        installmentId: due.installmentId,
        paymentMode:   modeKey,
        referenceNumber: ref,
      });
      setStep(3);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch(err) {
      setApiErr(err.response?.data?.msg || "Payment failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(15,14,12,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1rem", backdropFilter:"blur(4px)",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.white, borderRadius:T.radius,
        padding:"2rem", width:"100%", maxWidth:440,
        boxShadow:"0 24px 64px rgba(15,14,12,0.2)",
        animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.7rem", color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Pay Installment</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.4rem", color:T.ink, marginTop:2 }}>{chit.groupName}</div>
          </div>
          <button onClick={onClose} style={{ background:T.paperDark, border:"none", borderRadius:8,
            width:32, height:32, cursor:"pointer", fontSize:"1rem",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* API error */}
        {apiErr && (
          <div style={{ background:T.redBg, border:`1px solid ${T.red}`, borderRadius:T.radiusSm,
            padding:"0.6rem 0.9rem", marginBottom:"1rem", fontSize:"0.8rem", color:T.red }}>
            ⚠ {apiErr}
          </div>
        )}

        {/* Step 3 — success */}
        {step === 3 && (
          <div style={{ textAlign:"center", padding:"1rem 0" }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>✅</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.3rem", color:T.ink }}>Payment Successful!</div>
            <div style={{ fontSize:"0.82rem", color:T.muted, marginTop:"0.4rem" }}>
              ₹{balanceDue.toLocaleString("en-IN")} paid via {mode}
            </div>
          </div>
        )}

        {/* Step 2 — confirm */}
        {step === 2 && (
          <>
            <div style={{ background:T.paper, borderRadius:T.radiusSm, padding:"1.1rem", marginBottom:"1.25rem" }}>
              {[
                ["Chit Group",   chit.groupName],
                ["Month",        `Month ${due?.monthNumber}`],
                ["Subscription", `₹${(due?.subscription||0).toLocaleString("en-IN")}`],
                ["Dividend",     `− ₹${(due?.dividend||0).toLocaleString("en-IN")}`],
                ["Balance Due",  `₹${balanceDue.toLocaleString("en-IN")}`],
                ["Mode",         mode],
                ...(ref ? [["Reference", ref]] : []),
              ].map(([label, val], i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  padding:"0.45rem 0", borderBottom:i<5?`1px solid ${T.borderLight}`:"none" }}>
                  <span style={{ fontSize:"0.8rem", color:T.muted }}>{label}</span>
                  <span style={{ fontSize:"0.85rem", fontWeight:label==="Balance Due"?700:500,
                    color:label==="Balance Due"?T.gold:T.ink }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, padding:"0.75rem", background:T.paperDark,
                border:"none", borderRadius:T.radiusSm, cursor:"pointer",
                fontSize:"0.85rem", fontWeight:600, color:T.muted, fontFamily:"'Sora',sans-serif" }}>← Back</button>
              <button onClick={handlePay} disabled={loading} style={{
                flex:2, padding:"0.75rem",
                background:loading?T.muted:T.gold,
                border:"none", borderRadius:T.radiusSm, cursor:"pointer",
                fontSize:"0.88rem", fontWeight:700, color:"#fff",
                fontFamily:"'Sora',sans-serif",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
              }}>
                {loading
                  ? <><span style={{ width:18,height:18,border:"2.5px solid rgba(255,255,255,0.4)",
                      borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                      animation:"spin 0.7s linear infinite" }}/> Processing…</>
                  : `Confirm Pay ₹${balanceDue.toLocaleString("en-IN")}`}
              </button>
            </div>
          </>
        )}

        {/* Step 1 — form */}
        {step === 1 && (
          <>
            {/* Breakdown */}
            <div style={{ background:T.paper, borderRadius:T.radiusSm, padding:"1rem", marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.6rem" }}>
                <span style={{ fontSize:"0.78rem", color:T.muted }}>Monthly Subscription</span>
                <span style={{ fontSize:"0.85rem", fontWeight:600, color:T.ink }}>₹{(due?.subscription||0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.6rem",
                paddingBottom:"0.6rem", borderBottom:`1px solid ${T.borderLight}` }}>
                <span style={{ fontSize:"0.78rem", color:T.muted }}>Dividend Deduction</span>
                <span style={{ fontSize:"0.85rem", fontWeight:600, color:T.green }}>− ₹{(due?.dividend||0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.82rem", fontWeight:700, color:T.ink }}>Balance to Pay</span>
                <span style={{ fontSize:"1.1rem", fontWeight:800, color:T.gold, fontFamily:"'DM Serif Display',serif" }}>
                  ₹{balanceDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Mode select */}
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"0.75rem", fontWeight:600, color:T.ink, marginBottom:"0.5rem" }}>Payment Mode</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
                {PAYMENT_MODES.map(m => (
                  <button key={m} onClick={()=>setMode(m)} style={{
                    padding:"0.6rem 0.75rem", textAlign:"left",
                    background:mode===m?`${T.gold}12`:T.paper,
                    border:`1.5px solid ${mode===m?T.gold:T.border}`,
                    borderRadius:T.radiusSm, cursor:"pointer",
                    fontSize:"0.8rem", fontWeight:mode===m?600:400,
                    color:mode===m?T.gold:T.muted,
                    fontFamily:"'Sora',sans-serif", transition:"all 0.15s ease",
                  }}>
                    {m==="UPI"&&"📱 "}{m==="NEFT / IMPS"&&"🏦 "}{m==="Cash"&&"💵 "}{m==="Cheque"&&"📄 "}{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference input */}
            {(mode==="UPI"||mode==="NEFT / IMPS") && (
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ fontSize:"0.75rem", fontWeight:600, color:T.ink, marginBottom:"0.4rem" }}>
                  {mode==="UPI"?"UPI Transaction ID":"NEFT / IMPS Reference No."}
                </div>
                <input value={ref} onChange={e=>setRef(e.target.value)}
                  placeholder={mode==="UPI"?"e.g. 316200123456":"e.g. NEFT123456"}
                  style={{ width:"100%", padding:"0.65rem 0.9rem",
                    border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm,
                    fontFamily:"'Sora',sans-serif", fontSize:"0.85rem", color:T.ink,
                    background:T.paper, outline:"none" }} />
              </div>
            )}

            {mode==="Cash" && (
              <div style={{ background:"#fff3ea", border:"1px solid #f5c89a",
                borderRadius:T.radiusSm, padding:"0.7rem 0.9rem", marginBottom:"1rem",
                fontSize:"0.78rem", color:T.orange }}>
                💡 Cash payment will be recorded by the admin. Please collect your receipt.
              </div>
            )}

            <button onClick={()=>setStep(2)} style={{ width:"100%", padding:"0.8rem",
              background:T.gold, border:"none", borderRadius:T.radiusSm,
              cursor:"pointer", fontSize:"0.9rem", fontWeight:700,
              color:"#fff", fontFamily:"'Sora',sans-serif", letterSpacing:"0.03em" }}>
              Review Payment →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chit Card ────────────────────────────────────────────────────────────────
function ChitCard({ chit, onPay }) {
  const pct      = Math.round(((chit.currentMonth||1)/(chit.totalMonths||25))*100);
  const hasDue   = !!chit.currentDue;
  const balanceDue = chit.currentDue?.dueAmount || 0;

  return (
    <div style={{ background:T.white, border:`1.5px solid ${hasDue?T.red:T.border}`,
      borderRadius:T.radius, padding:"1.4rem",
      boxShadow:hasDue?`0 4px 20px rgba(176,58,26,0.1)`:T.shadow,
      position:"relative", overflow:"hidden" }}>
      {/* top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
        background:hasDue?`linear-gradient(90deg,${T.red},#e07060)`:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
        <div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.15rem", color:T.ink }}>{chit.groupName}</div>
          <div style={{ fontSize:"0.72rem", color:T.muted, marginTop:2 }}>{chit.planName}</div>
        </div>
        <Badge status={hasDue ? (chit.currentDue.status==="overdue"?"overdue":"due") : "paid"} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom:"1rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:"0.7rem", color:T.muted }}>Month {chit.currentMonth||1} of {chit.totalMonths||25}</span>
          <span style={{ fontSize:"0.7rem", fontWeight:600, color:T.ink }}>{pct}%</span>
        </div>
        <div style={{ height:8, background:T.paperDark, borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:4,
            background:hasDue?`linear-gradient(90deg,${T.red},#e07060)`:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.5rem", marginBottom:"1rem" }}>
        {[
          {label:"Monthly",  value:`₹${(chit.subscription||0).toLocaleString("en-IN")}`},
          {label:"Dividend", value:`₹${(chit.currentDue?.dividend||0).toLocaleString("en-IN")}`, color:T.green},
          {label:"Balance",  value:`₹${(chit.currentDue?.dueAmount||chit.subscription||0).toLocaleString("en-IN")}`, color:T.gold},
        ].map((s,i)=>(
          <div key={i} style={{ background:T.paper, borderRadius:T.radiusSm, padding:"0.6rem 0.75rem" }}>
            <div style={{ fontSize:"0.65rem", color:T.muted, marginBottom:2 }}>{s.label}</div>
            <div style={{ fontSize:"0.88rem", fontWeight:700, color:s.color||T.ink }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Total paid */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        background:T.paper, borderRadius:T.radiusSm, padding:"0.6rem 0.9rem", marginBottom:"1rem" }}>
        <span style={{ fontSize:"0.78rem", color:T.muted }}>Total Paid So Far</span>
        <span style={{ fontSize:"0.92rem", fontWeight:700, color:T.green }}>₹{(chit.totalPaid||0).toLocaleString("en-IN")}</span>
      </div>

      {hasDue ? (
        <button onClick={()=>onPay(chit)} style={{ width:"100%", padding:"0.72rem",
          background:`linear-gradient(135deg,${T.red},#d04030)`,
          border:"none", borderRadius:T.radiusSm, cursor:"pointer",
          fontSize:"0.88rem", fontWeight:700, color:"#fff", fontFamily:"'Sora',sans-serif" }}>
          ⚠ Pay Now — ₹{balanceDue.toLocaleString("en-IN")}
        </button>
      ) : (
        <div style={{ textAlign:"center", padding:"0.6rem", background:T.greenBg,
          borderRadius:T.radiusSm, fontSize:"0.82rem", fontWeight:600, color:T.green }}>
          ✓ This month's installment is paid
        </div>
      )}
    </div>
  );
}

// ─── Installment Schedule Table ───────────────────────────────────────────────
function ScheduleTable({ installments, groupName }) {
  if (!installments?.length) return null;
  return (
    <div style={{ background:T.white, border:`1px solid ${T.border}`,
      borderRadius:T.radius, padding:"1.5rem", boxShadow:T.shadow, marginTop:"1.5rem" }}>
      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.15rem", color:T.ink, marginBottom:"1.25rem" }}>
        Payment Schedule — {groupName}
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:500 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Month","Subscription","Dividend","Balance Due","Date Paid","Status"].map(h=>(
                <th key={h} style={{ textAlign:"left", paddingBottom:"0.75rem",
                  fontSize:"0.68rem", fontWeight:600, letterSpacing:"0.08em",
                  textTransform:"uppercase", color:T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, i) => (
              <tr key={i} className="trow" style={{ borderBottom:i<installments.length-1?`1px solid ${T.borderLight}`:"none" }}>
                <td style={{ padding:"0.8rem 0.5rem 0.8rem 0", fontSize:"0.85rem", fontWeight:500, color:T.ink }}>Month {inst.monthNumber}</td>
                <td style={{ padding:"0.8rem 0.5rem", fontSize:"0.82rem", color:T.ink }}>₹{(inst.subscription||0).toLocaleString("en-IN")}</td>
                <td style={{ padding:"0.8rem 0.5rem", fontSize:"0.82rem", color:T.green }}>₹{(inst.dividend||0).toLocaleString("en-IN")}</td>
                <td style={{ padding:"0.8rem 0.5rem", fontSize:"0.88rem", fontWeight:700,
                  color:["pending","overdue"].includes(inst.status)?T.red:T.ink }}>
                  ₹{(inst.balance||inst.dueAmount||0).toLocaleString("en-IN")}
                </td>
                <td style={{ padding:"0.8rem 0.5rem", fontSize:"0.76rem", color:T.muted }}>
                  {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                </td>
                <td style={{ padding:"0.8rem 0" }}><Badge status={inst.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Payments Page ───────────────────────────────────────────────────────
export default function Payments() {
  const [activeTab,   setActiveTab]   = useState("installments");
  const [payModal,    setPayModal]    = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [successMsg,  setSuccessMsg]  = useState("");
  const [myChits,     setMyChits]     = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(true);
  const [error,       setError]       = useState("");

  // ── Fetch my installments ──────────────────────────────────────────────────
  const fetchInstallments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await API.get("/api/payments/my-installments");
      setMyChits(res.data || []);
    } catch(err) {
      setError("Could not load your installments. Is your server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch payment history ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await API.get("/api/payments/history");
      setHistory(res.data || []);
    } catch(err) {
      console.error("History fetch error:", err.message);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstallments(); }, [fetchInstallments]);
  useEffect(() => { if(activeTab==="history") fetchHistory(); }, [activeTab, fetchHistory]);

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalPaid = myChits.reduce((sum, c) => sum + (c.totalPaid||0), 0);
  const totalDue  = myChits.reduce((sum, c) => sum + (c.currentDue?.dueAmount||0), 0);

  const filtered = filter === "all"
    ? history
    : history.filter(p => {
        if (filter === "due") return ["pending","overdue"].includes(p.status);
        return p.status === filter;
      });

  // ── After successful payment — refresh both lists ──────────────────────────
  const handlePaySuccess = (chit) => {
    setSuccessMsg(`₹${chit.currentDue?.dueAmount?.toLocaleString("en-IN")} paid for ${chit.groupName}!`);
    setTimeout(() => setSuccessMsg(""), 5000);
    fetchInstallments();
    fetchHistory();
  };

  const tabs = [
    { id:"installments", label:"My Installments" },
    { id:"history",      label:"Payment History"  },
  ];

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .fade{animation:fadeIn 0.3s ease both}
        .trow:hover td{background:${T.paperDark}!important}
      `}</style>

      {/* Success toast */}
      {successMsg && (
        <div style={{ background:T.greenBg, border:`1px solid ${T.green}`,
          borderRadius:T.radiusSm, padding:"0.75rem 1.1rem", marginBottom:"1.25rem",
          fontSize:"0.85rem", fontWeight:600, color:T.green,
          display:"flex", alignItems:"center", gap:"0.5rem" }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{ background:T.redBg, border:`1px solid ${T.red}`,
          borderRadius:T.radiusSm, padding:"0.75rem 1rem", marginBottom:"1.25rem",
          fontSize:"0.82rem", color:T.red,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          ⚠ {error}
          <button onClick={fetchInstallments} style={{ background:T.red, color:"#fff",
            border:"none", borderRadius:6, padding:"3px 10px", cursor:"pointer",
            fontSize:"0.74rem", fontFamily:"'Sora',sans-serif" }}>Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", marginBottom:"1.5rem" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:"0.4rem 1rem", fontFamily:"'Sora',sans-serif",
            background:activeTab===t.id?`${T.gold}15`:"transparent",
            color:activeTab===t.id?T.gold:T.muted,
            border:`1px solid ${activeTab===t.id?T.border:"transparent"}`,
            borderRadius:8, fontSize:"0.8rem",
            fontWeight:activeTab===t.id?600:400, cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Summary strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.75rem" }}>
        {loading ? (
          [1,2,3].map(i=><Skeleton key={i} h={80} radius={14} />)
        ) : [
          {label:"Total Paid",       value:`₹${totalPaid.toLocaleString("en-IN")}`, color:T.green,  bg:T.greenBg,  icon:"✓"},
          {label:"Outstanding Due",  value:`₹${totalDue.toLocaleString("en-IN")}`,  color:T.red,    bg:T.redBg,    icon:"⚠"},
          {label:"Active Chit Groups",value:myChits.length,                         color:T.gold,   bg:T.goldBg,   icon:"◈"},
        ].map((s,i)=>(
          <div key={i} style={{ background:T.white, border:`1px solid ${T.border}`,
            borderRadius:T.radius, padding:"1.2rem 1.4rem",
            boxShadow:T.shadow, display:"flex", alignItems:"center", gap:"1rem" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.bg, color:s.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.1rem", fontWeight:700, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"0.68rem", color:T.muted, textTransform:"uppercase",
                letterSpacing:"0.09em", marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:"1.35rem", fontWeight:700, color:s.color,
                fontFamily:"'DM Serif Display',serif" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── INSTALLMENTS TAB ── */}
      {activeTab === "installments" && (
        <div className="fade">
          {/* Due alert */}
          {!loading && totalDue > 0 && (
            <div style={{ background:"#fff8f0", border:"1px solid #f0b070",
              borderRadius:T.radius, padding:"1rem 1.4rem", marginBottom:"1.5rem",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"0.88rem", fontWeight:700, color:T.orange }}>⚠ Payment Due This Month</div>
                <div style={{ fontSize:"0.78rem", color:T.muted, marginTop:2 }}>
                  ₹{totalDue.toLocaleString("en-IN")} pending. Pay before auction date to avoid penalties.
                </div>
              </div>
              <button onClick={()=>setPayModal(myChits.find(c=>c.currentDue))} style={{
                padding:"0.55rem 1.2rem", background:T.orange, color:"#fff",
                border:"none", borderRadius:T.radiusSm, cursor:"pointer",
                fontSize:"0.82rem", fontWeight:700, fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap",
              }}>Pay Now →</button>
            </div>
          )}

          {/* Chit cards */}
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>
              {[1,2].map(i=><Skeleton key={i} h={280} radius={14} />)}
            </div>
          ) : myChits.length === 0 ? (
            <div style={{ background:T.white, border:`1px solid ${T.border}`,
              borderRadius:T.radius, padding:"3rem", textAlign:"center", boxShadow:T.shadow }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>₹</div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.2rem", color:T.ink }}>No active installments</div>
              <p style={{ fontSize:"0.82rem", color:T.muted, marginTop:"0.4rem" }}>
                Join a chit group to see your payment schedule here.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>
                {myChits.map((chit,i) => (
                  <ChitCard key={i} chit={chit} onPay={setPayModal} />
                ))}
              </div>
              {/* Schedule table for first group */}
              {myChits[0]?.installments?.length > 0 && (
                <ScheduleTable
                  installments={myChits[0].installments}
                  groupName={myChits[0].groupName}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "history" && (
        <div className="fade">
          {/* Filter row */}
          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
            {["all","paid","due","upcoming"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{
                padding:"0.4rem 1rem", fontFamily:"'Sora',sans-serif",
                background:filter===f?T.gold:T.white,
                color:filter===f?"#fff":T.muted,
                border:`1px solid ${filter===f?T.gold:T.border}`,
                borderRadius:20, fontSize:"0.78rem",
                fontWeight:filter===f?600:400, cursor:"pointer", textTransform:"capitalize",
              }}>{f}</button>
            ))}
            <div style={{ marginLeft:"auto", fontSize:"0.78rem", color:T.muted }}>
              {filtered.length} records
            </div>
          </div>

          <div style={{ background:T.white, border:`1px solid ${T.border}`,
            borderRadius:T.radius, boxShadow:T.shadow, overflow:"hidden" }}>
            {histLoading ? (
              <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {[1,2,3,4,5].map(i=><Skeleton key={i} h={44} radius={8} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center", color:T.muted, fontSize:"0.85rem" }}>
                {filter==="all" ? "No payment history yet." : `No ${filter} records found.`}
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
                  <thead style={{ background:T.paper }}>
                    <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                      {["Chit Group","Month","Subscription","Dividend","Paid","Date","Mode","Status"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"0.85rem 1rem",
                          fontSize:"0.65rem", fontWeight:600, letterSpacing:"0.08em",
                          textTransform:"uppercase", color:T.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p,i)=>(
                      <tr key={i} className="trow" style={{ borderBottom:i<filtered.length-1?`1px solid ${T.borderLight}`:"none" }}>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.82rem", fontWeight:500, color:T.ink }}>{p.group}</td>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.78rem", color:T.muted }}>Month {p.monthNumber}</td>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.82rem", color:T.ink }}>₹{(p.subscription||0).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.82rem", color:T.green }}>₹{(p.dividend||0).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.88rem", fontWeight:700,
                          color:p.status==="paid"?T.ink:T.muted }}>
                          {p.status==="paid"?`₹${(p.paidAmount||p.balance||0).toLocaleString("en-IN")}`:"—"}
                        </td>
                        <td style={{ padding:"0.85rem 1rem", fontSize:"0.76rem", color:T.muted }}>
                          {p.paidAt?new Date(p.paidAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}
                        </td>
                        <td style={{ padding:"0.85rem 1rem" }}>
                          {p.paymentMode&&p.paymentMode!=="—"
                            ? <span style={{ fontSize:"0.72rem", background:T.paperDark, color:T.muted,
                                padding:"2px 8px", borderRadius:6, fontWeight:500 }}>{p.paymentMode}</span>
                            : <span style={{ color:T.muted }}>—</span>}
                        </td>
                        <td style={{ padding:"0.85rem 1rem" }}><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <PayModal
          chit={payModal}
          onClose={()=>setPayModal(null)}
          onSuccess={()=>handlePaySuccess(payModal)}
        />
      )}
    </div>
  );
}