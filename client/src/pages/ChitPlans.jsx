// client/src/pages/ChitPlans.jsx
// Fully wired to real backend APIs
import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

const T = {
  gold:"#C9922A", goldLight:"#E5B253", goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)", goldGlow:"rgba(201,146,42,0.15)",
  ink:"#0f0e0c", paper:"#faf8f3", paperDark:"#f2ede3",
  muted:"#6b6557", border:"rgba(201,146,42,0.2)", borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff", green:"#2e7d52", greenBg:"#edf7f1",
  red:"#b03a1a", redBg:"#fff4f0", blue:"#1a5fa8", blueBg:"#eef4fc",
  radius:"14px", radiusSm:"9px", shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

// Plan tag styling
const TAG_STYLE = {
  "STC 5 Lakhs":  { label:"Starter", bg:"#eef4fc", color:"#1a5fa8" },
  "STC 10 Lakhs": { label:"Popular", bg:"#C9922A", color:"#fff"    },
  "STC 25 Lakhs": { label:"Premium", bg:"#0f0e0c", color:"#E5B253" },
};

function Skeleton({ w="100%", h=20, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",
    backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />;
}

// ─── Join Group Modal ─────────────────────────────────────────────────────────
function JoinModal({ plan, groups, onClose, onJoined }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  // Filter groups that belong to this plan and are not full
  const available = groups.filter(g =>
    g.planId === plan._id &&
    g.status === "active" &&
    g.membersJoined < (plan.maxMembers || 25)
  );

  const handleJoin = async () => {
    if (!selectedGroup) { setError("Please select a group to join."); return; }
    setLoading(true); setError("");
    try {
      await API.post(`/api/chits/groups/${selectedGroup._id}/join`);
      setSuccess(true);
      setTimeout(() => { onJoined(); onClose(); }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not join group. Try again.");
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(15,14,12,0.45)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.white, borderRadius:T.radius, padding:"2rem",
        width:"100%", maxWidth:460,
        boxShadow:"0 24px 64px rgba(15,14,12,0.2)",
        animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.7rem", color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Join Chit Plan</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.4rem", color:T.ink, marginTop:2 }}>{plan.planName}</div>
            <div style={{ fontSize:"0.78rem", color:T.muted, marginTop:2 }}>
              ₹{plan.chitAmount?.toLocaleString("en-IN")} · ₹{plan.monthlySubscription?.toLocaleString("en-IN")}/month · {plan.totalMonths} months
            </div>
          </div>
          <button onClick={onClose} style={{ background:T.paperDark, border:"none", borderRadius:8,
            width:32, height:32, cursor:"pointer", fontSize:"1rem",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>✅</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.2rem", color:T.ink }}>Successfully Joined!</div>
            <p style={{ fontSize:"0.82rem", color:T.muted, marginTop:"0.4rem" }}>
              You are now a member of {selectedGroup?.groupName}.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background:T.redBg, border:`1px solid ${T.red}`, borderRadius:T.radiusSm,
                padding:"0.65rem 0.9rem", marginBottom:"1rem", fontSize:"0.8rem", color:T.red }}>
                ⚠ {error}
              </div>
            )}

            {available.length === 0 ? (
              <div style={{ background:T.paper, borderRadius:T.radiusSm, padding:"1.5rem",
                textAlign:"center", marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"1.5rem", marginBottom:"0.5rem" }}>😔</div>
                <div style={{ fontSize:"0.88rem", fontWeight:600, color:T.ink }}>No groups available</div>
                <p style={{ fontSize:"0.78rem", color:T.muted, marginTop:"0.3rem" }}>
                  All groups for this plan are either full or not active yet.
                  Please contact admin to create a new group.
                </p>
              </div>
            ) : (
              <>
                <div style={{ fontSize:"0.75rem", fontWeight:600, color:T.ink, marginBottom:"0.6rem" }}>
                  Select a Group to Join
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1.25rem" }}>
                  {available.map((g, i) => {
                    const fillPct = Math.round((g.membersJoined / (plan.maxMembers||25)) * 100);
                    const isSelected = selectedGroup?._id === g._id;
                    return (
                      <div key={i} onClick={() => setSelectedGroup(g)} style={{
                        background: isSelected ? `${T.gold}10` : T.paper,
                        border:`1.5px solid ${isSelected ? T.gold : T.border}`,
                        borderRadius:T.radiusSm, padding:"0.9rem 1rem",
                        cursor:"pointer", transition:"all 0.15s ease",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                          <div style={{ fontSize:"0.88rem", fontWeight:600, color:T.ink }}>{g.groupName}</div>
                          <div style={{ fontSize:"0.75rem", color:T.muted }}>{g.membersJoined}/{plan.maxMembers||25} members</div>
                        </div>
                        {/* Fill bar */}
                        <div style={{ height:5, background:T.paperDark, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${fillPct}%`, borderRadius:3,
                            background:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.4rem" }}>
                          <span style={{ fontSize:"0.68rem", color:T.muted }}>Month {g.currentMonth || 1} of {plan.totalMonths}</span>
                          <span style={{ fontSize:"0.68rem", color:T.gold, fontWeight:600 }}>{fillPct}% full</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary before joining */}
                {selectedGroup && (
                  <div style={{ background:T.paper, borderRadius:T.radiusSm, padding:"0.9rem 1rem", marginBottom:"1.25rem" }}>
                    {[
                      ["Group",           selectedGroup.groupName],
                      ["Monthly Payment", `₹${plan.monthlySubscription?.toLocaleString("en-IN")}`],
                      ["Total Duration",  `${plan.totalMonths} months`],
                      ["Chit Value",      `₹${plan.chitAmount?.toLocaleString("en-IN")}`],
                    ].map(([l,v],i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between",
                        padding:"0.35rem 0", borderBottom:i<3?`1px solid ${T.borderLight}`:"none" }}>
                        <span style={{ fontSize:"0.78rem", color:T.muted }}>{l}</span>
                        <span style={{ fontSize:"0.82rem", fontWeight:600, color:T.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleJoin} disabled={loading || !selectedGroup} style={{
                  width:"100%", padding:"0.8rem",
                  background: !selectedGroup ? T.muted : loading ? T.goldDim : T.gold,
                  border:"none", borderRadius:T.radiusSm, cursor: !selectedGroup?"not-allowed":"pointer",
                  fontSize:"0.9rem", fontWeight:700, color:"#fff",
                  fontFamily:"'Sora',sans-serif",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
                }}>
                  {loading
                    ? <><span style={{ width:18,height:18,border:"2.5px solid rgba(255,255,255,0.4)",
                        borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                        animation:"spin 0.7s linear infinite" }}/> Joining…</>
                    : "Confirm & Join →"
                  }
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, groups, myGroupIds, onJoin }) {
  const [hov, setHov] = useState(false);
  const tag = TAG_STYLE[plan.planName] || { label:"Plan", bg:T.gold, color:"#fff" };

  // Check if user already joined a group under this plan
  const planGroups   = groups.filter(g => g.planId === plan._id);
  const alreadyJoined = planGroups.some(g => myGroupIds.includes(g._id));

  // Available slots across all groups for this plan
  const totalSlots = planGroups.reduce((sum,g)=>sum+(plan.maxMembers-g.membersJoined),0);
  const hasSlots   = totalSlots > 0;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:T.white,
      border:`1px solid ${hov&&!alreadyJoined?T.gold:alreadyJoined?T.green:T.border}`,
      borderRadius:T.radius, padding:"1.75rem",
      boxShadow: hov?`0 12px 36px ${T.goldGlow}`:T.shadow,
      transform: hov?"translateY(-4px)":"none",
      transition:"all 0.25s ease",
      position:"relative", overflow:"hidden",
    }}>
      {/* Top gradient bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
        background:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />

      {/* Tag badge */}
      <div style={{ position:"absolute", top:16, right:16,
        background:tag.bg, color:tag.color,
        fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.08em",
        padding:"3px 12px", borderRadius:20 }}>{tag.label}</div>

      {/* Already joined badge */}
      {alreadyJoined && (
        <div style={{ position:"absolute", top:16, left:16,
          background:T.greenBg, color:T.green,
          fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.06em",
          padding:"3px 10px", borderRadius:20 }}>✓ Joined</div>
      )}

      <div style={{ marginTop: alreadyJoined ? "1.5rem" : "0.25rem" }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.35rem", color:T.ink, marginBottom:"0.25rem" }}>
          {plan.planName}
        </div>
        <div style={{ fontSize:"2.2rem", fontWeight:800, color:T.gold,
          fontFamily:"'DM Serif Display',serif", marginBottom:"1.25rem", lineHeight:1 }}>
          ₹{plan.chitAmount?.toLocaleString("en-IN")}
        </div>
      </div>

      {/* Details */}
      <div style={{ marginBottom:"1.25rem" }}>
        {[
          ["Monthly Subscription", `₹${plan.monthlySubscription?.toLocaleString("en-IN")}`],
          ["Duration",             `${plan.totalMonths} Months`],
          ["Max Members",          plan.maxMembers || 25],
          ["Available Groups",     planGroups.length],
          ["Open Slots",           hasSlots ? totalSlots : "Full"],
        ].map(([l,v],i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between",
            padding:"0.55rem 0", borderBottom:`1px solid ${T.borderLight}` }}>
            <span style={{ fontSize:"0.78rem", color:T.muted }}>{l}</span>
            <span style={{ fontSize:"0.82rem", fontWeight:600,
              color: l==="Open Slots"&&!hasSlots ? T.red : T.ink }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      {plan.description && (
        <p style={{ fontSize:"0.76rem", color:T.muted, marginBottom:"1.25rem", lineHeight:1.6 }}>
          {plan.description}
        </p>
      )}

      {/* CTA button */}
      {alreadyJoined ? (
        <div style={{ textAlign:"center", padding:"0.65rem",
          background:T.greenBg, borderRadius:T.radiusSm,
          fontSize:"0.82rem", fontWeight:600, color:T.green }}>
          ✓ You are a member of this plan
        </div>
      ) : !hasSlots ? (
        <div style={{ textAlign:"center", padding:"0.65rem",
          background:T.redBg, borderRadius:T.radiusSm,
          fontSize:"0.82rem", fontWeight:600, color:T.red }}>
          No slots available right now
        </div>
      ) : (
        <button onClick={()=>onJoin(plan)} style={{
          width:"100%", padding:"0.8rem",
          background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,
          border:"none", borderRadius:T.radiusSm, cursor:"pointer",
          fontSize:"0.9rem", fontWeight:700, color:"#fff",
          fontFamily:"'Sora',sans-serif", letterSpacing:"0.03em",
          transition:"opacity 0.15s",
        }}>
          Join This Plan →
        </button>
      )}
    </div>
  );
}

// ─── Main ChitPlans Page ──────────────────────────────────────────────────────
export default function ChitPlans() {
  const [plans,      setPlans]      = useState([]);
  const [groups,     setGroups]     = useState([]);
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [joinPlan,   setJoinPlan]   = useState(null); // plan selected for join modal
  const [successMsg, setSuccessMsg] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [plansRes, groupsRes, myGroupsRes] = await Promise.all([
        API.get("/api/chits/plans"),
        API.get("/api/chits/groups"),
        API.get("/api/chits/my-groups"),
      ]);

      setPlans(plansRes.data || []);

      // Normalize groups — planId might be object or string
      const normalizedGroups = (groupsRes.data || []).map(g => ({
        ...g,
        planId: g.planId?._id || g.planId,
      }));
      setGroups(normalizedGroups);

      // Extract group IDs user already belongs to
      const joined = (myGroupsRes.data || []).map(m => m.groupId?._id || m.groupId);
      setMyGroupIds(joined);
    } catch (err) {
      setError("Could not load chit plans. Is your server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleJoined = () => {
    setSuccessMsg("You have successfully joined the chit group! 🎉");
    setTimeout(() => setSuccessMsg(""), 5000);
    fetchAll(); // refresh to update joined status
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.35s ease both}
      `}</style>

      <p style={{ fontSize:"0.85rem", color:T.muted, marginBottom:"1.5rem" }}>
        Choose a chit plan that suits your financial goals. Join an active group to start saving.
      </p>

      {/* Success toast */}
      {successMsg && (
        <div style={{ background:T.greenBg, border:`1px solid ${T.green}`,
          borderRadius:T.radiusSm, padding:"0.75rem 1.1rem", marginBottom:"1.25rem",
          fontSize:"0.85rem", fontWeight:600, color:T.green }}>
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
          <button onClick={fetchAll} style={{ background:T.red, color:"#fff",
            border:"none", borderRadius:6, padding:"3px 10px", cursor:"pointer",
            fontSize:"0.74rem", fontFamily:"'Sora',sans-serif" }}>Retry</button>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1.25rem" }}>
          {[1,2,3].map(i => <Skeleton key={i} h={460} r={14} />)}
        </div>
      ) : plans.length === 0 ? (
        <div style={{ background:T.white, border:`1px solid ${T.border}`,
          borderRadius:T.radius, padding:"3rem", textAlign:"center", boxShadow:T.shadow }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>◈</div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.2rem", color:T.ink }}>
            No chit plans available
          </div>
          <p style={{ fontSize:"0.82rem", color:T.muted, marginTop:"0.5rem" }}>
            Run <code style={{ background:T.paper, padding:"2px 6px", borderRadius:4 }}>npm run seed:plans</code> in your server to add plans.
          </p>
        </div>
      ) : (
        <div className="fade" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"1.25rem" }}>
          {plans.map((plan, i) => (
            <PlanCard
              key={i}
              plan={plan}
              groups={groups}
              myGroupIds={myGroupIds}
              onJoin={setJoinPlan}
            />
          ))}
        </div>
      )}

      {/* How it works section */}
      {!loading && plans.length > 0 && (
        <div className="fade" style={{ background:T.white, border:`1px solid ${T.border}`,
          borderRadius:T.radius, padding:"1.5rem", marginTop:"1.5rem", boxShadow:T.shadow }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.1rem", color:T.ink, marginBottom:"1rem" }}>
            How STC Chit Fund Works
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"1rem" }}>
            {[
              { step:"1", icon:"◈", title:"Join a Plan",      desc:"Choose a chit plan and join an available group." },
              { step:"2", icon:"₹", title:"Pay Monthly",      desc:"Contribute your monthly subscription every month." },
              { step:"3", icon:"🔨",title:"Bid in Auction",   desc:"Each month, members bid to take the prize amount." },
              { step:"4", icon:"🏆",title:"Win the Prize",    desc:"Winner gets the chit value minus their bid amount." },
            ].map((s,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                <div style={{ width:32, height:32, borderRadius:8,
                  background:T.goldBg, color:T.gold,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1rem", fontWeight:700 }}>{s.icon}</div>
                <div style={{ fontSize:"0.82rem", fontWeight:600, color:T.ink }}>{s.title}</div>
                <div style={{ fontSize:"0.74rem", color:T.muted, lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Modal */}
      {joinPlan && (
        <JoinModal
          plan={joinPlan}
          groups={groups}
          onClose={() => setJoinPlan(null)}
          onJoined={handleJoined}
        />
      )}
    </div>
  );
}