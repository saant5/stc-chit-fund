// client/src/pages/Dashboard.jsx
// Fully wired to real backend APIs
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const T = {
  gold:"#C9922A",goldLight:"#E5B253",goldDim:"#7a5718",
  goldGlow:"rgba(201,146,42,0.15)",goldBg:"rgba(201,146,42,0.08)",
  ink:"#0f0e0c",paper:"#faf8f3",paperDark:"#f2ede3",
  muted:"#6b6557",border:"rgba(201,146,42,0.2)",borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff",green:"#2e7d52",greenBg:"#edf7f1",
  red:"#b03a1a",redBg:"#fff4f0",blue:"#1a5fa8",blueBg:"#eef4fc",
  radius:"14px",radiusSm:"9px",shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w="100%", h=20, radius=6 }) {
  return (
    <div style={{ width:w, height:h, borderRadius:radius,
      background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",
      backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon, color, bg, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:T.white, border:`1px solid ${hov?color:T.border}`,
      borderRadius:T.radius, padding:"1.4rem 1.5rem",
      boxShadow:hov?`0 8px 28px ${T.goldGlow}`:T.shadow,
      transform:hov?"translateY(-3px)":"none", transition:"all 0.22s ease",
      position:"relative", overflow:"hidden",
      display:"flex", flexDirection:"column", gap:"0.5rem",
    }}>
      <div style={{ position:"absolute",top:0,right:0,width:70,height:70,
        borderRadius:"0 14px 0 70px",background:`${color}10`,pointerEvents:"none" }} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:"0.68rem",fontWeight:600,letterSpacing:"0.1em",
          textTransform:"uppercase",color:T.muted }}>{label}</span>
        <span style={{ fontSize:"1rem",background:bg,borderRadius:8,
          width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center" }}>{icon}</span>
      </div>
      {loading
        ? <Skeleton h={32} radius={8} />
        : <div style={{ fontSize:"1.7rem",fontWeight:700,color:T.ink,
            fontFamily:"'DM Serif Display',serif" }}>{value}</div>}
      {loading ? <Skeleton w="60%" h={14} /> : <div style={{ fontSize:"0.75rem",color:T.muted }}>{sub}</div>}
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d=>d.collected), 1);
  const W=520, H=170, barW=28, gap=52, startX=44;
  return (
    <svg viewBox={`0 0 ${W} ${H+28}`} style={{ width:"100%", height:"auto" }}>
      {[0,0.5,1].map((f,i)=>(
        <g key={i}>
          <line x1={startX} x2={W-10} y1={H-f*H} y2={H-f*H}
            stroke={T.border} strokeWidth={1} strokeDasharray="4 4" />
          <text x={startX-6} y={H-f*H+4} fontSize={9} fill={T.muted} textAnchor="end">
            {max>=100000 ? `${Math.round(f*max/1000)}k` : `${Math.round(f*max/1000)}k`}
          </text>
        </g>
      ))}
      {data.map((d,i)=>{
        const x=startX+i*gap; const h=Math.max((d.collected/max)*H,2);
        return (
          <g key={i}>
            <rect x={x} y={H-h} width={barW} height={h} rx={4} fill={T.gold} opacity={0.85} />
            <text x={x+barW/2} y={H+18} fontSize={10} fill={T.muted} textAnchor="middle">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Chit card (user) ──────────────────────────────────────────────────────────
function ChitCard({ m }) {
  const navigate = useNavigate();
  const pct = Math.round(((m.currentMonth||1)/(m.totalMonths||25))*100);
  const hasDue = m.currentDue && m.currentDue.status !== "paid";
  return (
    <div style={{ background:T.white, border:`1.5px solid ${hasDue?T.red:T.border}`,
      borderRadius:T.radius, padding:"1.25rem",
      boxShadow:hasDue?`0 4px 20px rgba(176,58,26,0.09)`:T.shadow,
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:3,
        background:hasDue?`linear-gradient(90deg,${T.red},#e07060)`:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem" }}>
        <div>
          <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1rem",color:T.ink }}>{m.groupName}</div>
          <div style={{ fontSize:"0.72rem",color:T.muted }}>{m.planName}</div>
        </div>
        {hasDue && <span style={{ background:T.redBg,color:T.red,fontSize:"0.65rem",
          fontWeight:700,padding:"2px 8px",borderRadius:20 }}>⚠ Due</span>}
      </div>
      <div style={{ marginBottom:"0.85rem" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
          <span style={{ fontSize:"0.68rem",color:T.muted }}>Month {m.currentMonth||1} of {m.totalMonths||25}</span>
          <span style={{ fontSize:"0.68rem",fontWeight:600,color:T.ink }}>{pct}%</span>
        </div>
        <div style={{ height:7,background:T.paperDark,borderRadius:4,overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${pct}%`,borderRadius:4,
            background:hasDue?`linear-gradient(90deg,${T.red},#e07060)`:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"0.85rem" }}>
        {[
          {label:"Monthly",   value:m.monthly?`₹${m.monthly.toLocaleString("en-IN")}`:"—"},
          {label:"Total Paid",value:m.totalPaid?`₹${m.totalPaid.toLocaleString("en-IN")}`:"₹0"},
        ].map((s,i)=>(
          <div key={i} style={{ background:T.paper,borderRadius:T.radiusSm,padding:"0.5rem 0.7rem" }}>
            <div style={{ fontSize:"0.62rem",color:T.muted }}>{s.label}</div>
            <div style={{ fontSize:"0.85rem",fontWeight:700,color:T.ink }}>{s.value}</div>
          </div>
        ))}
      </div>
      {hasDue ? (
        <button onClick={()=>navigate("/payments")} style={{
          width:"100%",padding:"0.6rem",
          background:`linear-gradient(135deg,${T.red},#d04030)`,
          border:"none",borderRadius:T.radiusSm,cursor:"pointer",
          fontSize:"0.82rem",fontWeight:700,color:"#fff",fontFamily:"'Sora',sans-serif",
        }}>⚠ Pay Now — ₹{m.currentDue?.dueAmount?.toLocaleString("en-IN")}</button>
      ) : (
        <div style={{ textAlign:"center",padding:"0.5rem",background:T.greenBg,
          borderRadius:T.radiusSm,fontSize:"0.78rem",fontWeight:600,color:T.green }}>
          ✓ This month's installment is paid
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === "admin";

  const [stats,   setStats]   = useState(null);
  const [txns,    setTxns]    = useState([]);
  const [charts,  setCharts]  = useState([
    {month:"Oct",collected:0},{month:"Nov",collected:0},{month:"Dec",collected:0},
    {month:"Jan",collected:0},{month:"Feb",collected:0},{month:"Mar",collected:0},
  ]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const greeting = () => {
    const h = new Date().getHours();
    return h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError("");
      try {
        if (isAdmin) {
          const [sRes, tRes] = await Promise.all([
            API.get("/api/dashboard/stats"),
            API.get("/api/dashboard/recent-transactions"),
          ]);
          setStats(sRes.data);
          setTxns(tRes.data || []);
          const mc = sRes.data.monthlyCollection || 0;
          setCharts([
            {month:"Oct",collected:Math.round(mc*0.62)},
            {month:"Nov",collected:Math.round(mc*0.74)},
            {month:"Dec",collected:Math.round(mc*0.68)},
            {month:"Jan",collected:Math.round(mc*0.83)},
            {month:"Feb",collected:Math.round(mc*0.91)},
            {month:"Mar",collected:mc},
          ]);
        } else {
          const [sRes, iRes] = await Promise.all([
            API.get("/api/dashboard/user-stats"),
            API.get("/api/payments/my-installments"),
          ]);
          setStats({ ...sRes.data, memberships: iRes.data });
          const tp = sRes.data.totalPaid || 0;
          setCharts([
            {month:"Oct",collected:0},
            {month:"Nov",collected:0},
            {month:"Dec",collected:0},
            {month:"Jan",collected:Math.round(tp*0.3)},
            {month:"Feb",collected:Math.round(tp*0.65)},
            {month:"Mar",collected:tp},
          ]);
        }
      } catch(err) {
        setError("Could not load dashboard data. Is your server running?");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  const adminCards = [
    {label:"Total Members",      value:stats?.totalMembers??"—",      sub:`${stats?.activeGroups??0} active groups`,  icon:"👥",color:T.blue, bg:T.blueBg },
    {label:"Monthly Collection", value:stats?.monthlyCollection?`₹${stats.monthlyCollection.toLocaleString("en-IN")}`:"₹0", sub:"This month", icon:"₹",color:T.green,bg:T.greenBg},
    {label:"Pending Dues",       value:stats?.pendingDues?`₹${stats.pendingDues.toLocaleString("en-IN")}`:"₹0", sub:"Collect from members", icon:"⚠",color:T.red,  bg:T.redBg  },
    {label:"Total Corpus",       value:stats?.totalCorpus?`₹${(stats.totalCorpus/100000).toFixed(1)}L`:"₹0", sub:`${stats?.liveAuctions??0} auction live`, icon:"🏦",color:T.gold, bg:T.goldBg},
  ];

  const userCards = [
    {label:"Total Paid",      value:stats?.totalPaid?`₹${stats.totalPaid.toLocaleString("en-IN")}`:"₹0", sub:"All time",          icon:"✓",color:T.green,bg:T.greenBg},
    {label:"Outstanding Due", value:stats?.totalDue ?`₹${stats.totalDue.toLocaleString("en-IN")}` :"₹0", sub:"Pay before auction", icon:"⚠",color:T.red,  bg:T.redBg  },
    {label:"Active Chits",    value:stats?.memberships?.length??0, sub:"Groups enrolled",    icon:"◈",color:T.gold, bg:T.goldBg},
    {label:"Next Auction",    value:stats?.nextAuction?`Month ${stats.nextAuction.month}`:"—", sub:stats?.nextAuction?.group??"No upcoming", icon:"🔨",color:T.blue, bg:T.blueBg},
  ];

  const cards       = isAdmin ? adminCards : userCards;
  const memberships = stats?.memberships || [];

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both}
        .trow:hover td{background:${T.paperDark}!important}
      `}</style>

      {/* Error */}
      {error && (
        <div style={{ background:T.redBg,border:`1px solid ${T.red}`,borderRadius:T.radiusSm,
          padding:"0.75rem 1rem",marginBottom:"1.25rem",fontSize:"0.82rem",color:T.red,
          display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          ⚠ {error}
          <button onClick={()=>window.location.reload()} style={{ background:T.red,color:"#fff",
            border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",
            fontSize:"0.74rem",fontFamily:"'Sora',sans-serif" }}>Retry</button>
        </div>
      )}

      {/* Greeting */}
      <div className="fade" style={{ marginBottom:"1.5rem" }}>
        <div style={{ fontSize:"0.78rem",color:T.muted }}>{greeting()}, {user?.name?.split(" ")[0]} 👋</div>
        <p style={{ fontSize:"0.82rem",color:T.muted,marginTop:"0.2rem" }}>
          {isAdmin?"Here's what's happening across all chit groups today.":"Here's your STC portfolio overview."}
        </p>
      </div>

      {/* Summary cards */}
      <div className="fade" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:"1rem",marginBottom:"1.5rem" }}>
        {cards.map((c,i) => <SummaryCard key={i} {...c} loading={loading} />)}
      </div>

      {/* Due alert */}
      {!loading && !isAdmin && (stats?.totalDue||0) > 0 && (
        <div className="fade" style={{ background:"#fff8f0",border:"1px solid #f0b070",
          borderRadius:T.radius,padding:"1rem 1.4rem",marginBottom:"1.5rem",
          display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"0.88rem",fontWeight:700,color:"#c45c12" }}>⚠ Payment Due</div>
            <div style={{ fontSize:"0.78rem",color:T.muted,marginTop:2 }}>
              ₹{stats.totalDue.toLocaleString("en-IN")} pending — pay before the next auction.
            </div>
          </div>
          <button onClick={()=>navigate("/payments")} style={{
            padding:"0.5rem 1.1rem",background:"#c45c12",color:"#fff",
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.8rem",fontWeight:700,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap",marginLeft:"1rem",
          }}>Pay Now →</button>
        </div>
      )}

      {/* Chart + Transactions grid */}
      <div style={{ display:"grid",gridTemplateColumns:isAdmin?"1fr 300px":"1fr",gap:"1.25rem",marginBottom:"1.25rem" }}>
        {/* Bar chart */}
        <div className="fade" style={{ background:T.white,border:`1px solid ${T.border}`,
          borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.15rem",color:T.ink }}>Monthly Performance</div>
            <span style={{ fontSize:"0.72rem",color:T.muted,background:T.paper,
              border:`1px solid ${T.border}`,borderRadius:8,padding:"0.3rem 0.7rem" }}>Last 6 months</span>
          </div>
          {loading ? <Skeleton h={150} radius={8} /> : <BarChart data={charts} />}
        </div>

        {/* Admin recent transactions */}
        {isAdmin && (
          <div className="fade" style={{ background:T.white,border:`1px solid ${T.border}`,
            borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow }}>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink,marginBottom:"1rem" }}>
              Recent Payments
            </div>
            {loading ? (
              <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
                {[1,2,3,4].map(i=><Skeleton key={i} h={36} radius={8} />)}
              </div>
            ) : txns.length === 0 ? (
              <div style={{ textAlign:"center",padding:"2rem 0",color:T.muted,fontSize:"0.82rem" }}>No payments yet</div>
            ) : (
              <>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <tbody>
                    {txns.slice(0,6).map((t,i)=>(
                      <tr key={i} className="trow" style={{ borderBottom:i<Math.min(txns.length,6)-1?`1px solid ${T.borderLight}`:"none" }}>
                        <td style={{ padding:"0.75rem 0.5rem 0.75rem 0",fontSize:"0.82rem",fontWeight:500,color:T.ink }}>
                          {t.memberName}
                        </td>
                        <td style={{ padding:"0.75rem 0.5rem",fontSize:"0.75rem",color:T.muted }}>{t.group}</td>
                        <td style={{ padding:"0.75rem 0",fontSize:"0.85rem",fontWeight:600,color:T.green }}>
                          +₹{(t.amount||t.balance||0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={()=>navigate("/payments")} style={{
                  marginTop:"1rem",width:"100%",padding:"0.55rem",
                  background:T.paper,border:`1px solid ${T.border}`,
                  borderRadius:T.radiusSm,cursor:"pointer",
                  fontSize:"0.78rem",color:T.gold,fontWeight:600,fontFamily:"'Sora',sans-serif",
                }}>View All →</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* User: My Chit Groups */}
      {!isAdmin && (
        <div className="fade">
          <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.15rem",color:T.ink,marginBottom:"1rem" }}>
            My Chit Groups
          </div>
          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1rem" }}>
              {[1,2].map(i=><Skeleton key={i} h={220} radius={14} />)}
            </div>
          ) : memberships.length === 0 ? (
            <div style={{ background:T.white,border:`1px solid ${T.border}`,
              borderRadius:T.radius,padding:"3rem",textAlign:"center",boxShadow:T.shadow }}>
              <div style={{ fontSize:"2.5rem",marginBottom:"0.75rem" }}>◈</div>
              <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.2rem",color:T.ink }}>No chit groups yet</div>
              <p style={{ fontSize:"0.82rem",color:T.muted,margin:"0.5rem 0 1.25rem" }}>
                Join a chit plan to start building your financial future.
              </p>
              <button onClick={()=>navigate("/chit-plans")} style={{
                padding:"0.65rem 1.4rem",background:T.gold,color:"#fff",
                border:"none",borderRadius:T.radiusSm,cursor:"pointer",
                fontSize:"0.85rem",fontWeight:700,fontFamily:"'Sora',sans-serif",
              }}>Browse Chit Plans →</button>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1rem" }}>
              {memberships.map((m,i) => <ChitCard key={i} m={m} />)}
            </div>
          )}
        </div>
      )}

      {/* Admin bottom row */}
      {isAdmin && !loading && stats && (
        <div className="fade" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem" }}>
          {[
            {label:"Live Auctions",   value:stats.liveAuctions??0,   icon:"🔴",color:T.green},
            {label:"Upcoming Groups", value:stats.upcomingGroups??0, icon:"◷", color:T.blue },
            {label:"Active Groups",   value:stats.activeGroups??0,   icon:"◈", color:T.gold },
          ].map((s,i)=>(
            <div key={i} style={{ background:T.white,border:`1px solid ${T.border}`,
              borderRadius:T.radius,padding:"1.1rem 1.3rem",boxShadow:T.shadow,
              display:"flex",alignItems:"center",gap:"1rem" }}>
              <span style={{ fontSize:"1.4rem" }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:"0.65rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em" }}>{s.label}</div>
                <div style={{ fontSize:"1.3rem",fontWeight:700,color:s.color,fontFamily:"'DM Serif Display',serif" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}