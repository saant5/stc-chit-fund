// client/src/pages/AdminDashboard.jsx
// Fully wired to real backend APIs
import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

const T = {
  gold:"#C9922A", goldLight:"#E5B253", goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)", goldGlow:"rgba(201,146,42,0.15)",
  ink:"#0f0e0c", ink2:"#2a2823", paper:"#faf8f3", paperDark:"#f2ede3",
  muted:"#6b6557", border:"rgba(201,146,42,0.2)", borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff", green:"#2e7d52", greenBg:"#edf7f1",
  red:"#b03a1a", redBg:"#fff4f0", blue:"#1a5fa8", blueBg:"#eef4fc",
  orange:"#c45c12", orangeBg:"#fff3ea",
  radius:"14px", radiusSm:"9px",
  shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ w="100%", h=20, r=6 }) {
  return <div style={{ width:w,height:h,borderRadius:r,
    background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",
    backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite" }}/>;
}

function Badge({ status }) {
  const map = {
    active:    { bg:T.greenBg,  color:T.green,  label:"Active"    },
    upcoming:  { bg:T.blueBg,   color:T.blue,   label:"Upcoming"  },
    completed: { bg:T.paperDark,color:T.muted,  label:"Completed" },
    closed:    { bg:T.paperDark,color:T.muted,  label:"Closed"    },
    live:      { bg:T.greenBg,  color:T.green,  label:"🔴 Live"   },
    scheduled: { bg:T.blueBg,   color:T.blue,   label:"Scheduled" },
    defaulter: { bg:T.redBg,    color:T.red,    label:"Defaulter" },
    pending:   { bg:T.orangeBg, color:T.orange, label:"Pending"   },
  };
  const s = map[status] || map.upcoming;
  return <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"3px 10px",
    borderRadius:20, letterSpacing:"0.05em", background:s.bg, color:s.color }}>{s.label}</span>;
}

function Toast({ msg, type="success", onClose }) {
  useEffect(() => { const t=setTimeout(onClose,4000); return()=>clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,
      background:type==="success"?T.greenBg:T.redBg,
      border:`1px solid ${type==="success"?T.green:T.red}`,
      borderRadius:T.radiusSm,padding:"0.85rem 1.25rem",
      fontSize:"0.85rem",fontWeight:600,
      color:type==="success"?T.green:T.red,
      boxShadow:"0 8px 24px rgba(15,14,12,0.12)",
      display:"flex",alignItems:"center",gap:"0.6rem",
      animation:"slideUp 0.3s ease",maxWidth:320 }}>
      {type==="success"?"✅":"⚠"} {msg}
      <button onClick={onClose} style={{ background:"none",border:"none",
        cursor:"pointer",fontSize:"1rem",color:"inherit",marginLeft:"auto" }}>✕</button>
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ plans, onClose, onCreated }) {
  const [form,    setForm]    = useState({ groupName:"", planId:"", startDate:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handle = e => { setError(""); setForm({...form,[e.target.name]:e.target.value}); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.groupName.trim()) { setError("Group name is required."); return; }
    if (!form.planId)           { setError("Please select a plan."); return; }
    if (!form.startDate)        { setError("Start date is required."); return; }
    setLoading(true);
    try {
      const res = await API.post("/api/chits/groups", form);
      onCreated(res.data.group);
      onClose();
    } catch(err) {
      setError(err.response?.data?.msg || "Could not create group.");
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:999,
      background:"rgba(15,14,12,0.45)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.white,
        borderRadius:T.radius,padding:"2rem",width:"100%",maxWidth:460,
        boxShadow:"0 24px 64px rgba(15,14,12,0.2)",
        animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.7rem",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>Admin Action</div>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:T.ink }}>Create Chit Group</div>
          </div>
          <button onClick={onClose} style={{ background:T.paperDark,border:"none",borderRadius:8,
            width:32,height:32,cursor:"pointer",fontSize:"1rem",
            display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {error && <div style={{ background:T.redBg,border:`1px solid ${T.red}`,
          borderRadius:T.radiusSm,padding:"0.65rem 0.9rem",marginBottom:"1rem",
          fontSize:"0.8rem",color:T.red }}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
          {/* Group Name */}
          <div>
            <label style={{ fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem" }}>Group Name</label>
            <input name="groupName" value={form.groupName} onChange={handle}
              placeholder="e.g. STC-Gold-20L-GroupA"
              style={{ width:"100%",padding:"0.72rem 0.9rem",border:`1.5px solid ${T.border}`,
                borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.88rem",
                color:T.ink,background:T.paper,outline:"none" }} />
          </div>

          {/* Plan Select */}
          <div>
            <label style={{ fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem" }}>Chit Plan</label>
            <select name="planId" value={form.planId} onChange={handle}
              style={{ width:"100%",padding:"0.72rem 0.9rem",border:`1.5px solid ${T.border}`,
                borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.88rem",
                color:T.ink,background:T.paper,outline:"none",cursor:"pointer" }}>
              <option value="">Select a plan…</option>
              {plans.map((p,i)=>(
                <option key={i} value={p._id}>
                  {p.planName} — ₹{p.chitAmount?.toLocaleString("en-IN")} ({p.totalMonths} months)
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{ fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem" }}>Start Date</label>
            <input name="startDate" type="date" value={form.startDate} onChange={handle}
              style={{ width:"100%",padding:"0.72rem 0.9rem",border:`1.5px solid ${T.border}`,
                borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.88rem",
                color:T.ink,background:T.paper,outline:"none" }} />
          </div>

          {/* Plan preview */}
          {form.planId && (() => {
            const plan = plans.find(p=>p._id===form.planId);
            if (!plan) return null;
            return (
              <div style={{ background:T.paper,borderRadius:T.radiusSm,padding:"0.9rem 1rem" }}>
                {[
                  ["Monthly Subscription", `₹${plan.monthlySubscription?.toLocaleString("en-IN")}`],
                  ["Duration",             `${plan.totalMonths} months`],
                  ["Max Members",          plan.maxMembers],
                  ["Total Chit Value",     `₹${plan.chitAmount?.toLocaleString("en-IN")}`],
                ].map(([l,v],i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",
                    padding:"0.35rem 0",borderBottom:i<3?`1px solid ${T.borderLight}`:"none" }}>
                    <span style={{ fontSize:"0.76rem",color:T.muted }}>{l}</span>
                    <span style={{ fontSize:"0.8rem",fontWeight:600,color:T.ink }}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <button type="submit" disabled={loading} style={{
            padding:"0.8rem",background:loading?T.muted:T.gold,
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.9rem",fontWeight:700,color:"#fff",
            fontFamily:"'Sora',sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
            {loading
              ?<><span style={{ width:18,height:18,border:"2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                  animation:"spin 0.7s linear infinite" }}/> Creating…</>
              :"Create Group →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Create Auction Modal ─────────────────────────────────────────────────────
function CreateAuctionModal({ groups, onClose, onCreated }) {
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const activeGroups = groups.filter(g => g.status === "active");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!groupId) { setError("Please select a group."); return; }
    setLoading(true);
    try {
      const res = await API.post("/api/auctions/create", { groupId });
      onCreated(res.data.auction);
      onClose();
    } catch(err) {
      setError(err.response?.data?.msg || "Could not create auction.");
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:999,
      background:"rgba(15,14,12,0.45)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.white,
        borderRadius:T.radius,padding:"2rem",width:"100%",maxWidth:420,
        boxShadow:"0 24px 64px rgba(15,14,12,0.2)",
        animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.7rem",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>Admin Action</div>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:T.ink }}>Create Auction</div>
          </div>
          <button onClick={onClose} style={{ background:T.paperDark,border:"none",borderRadius:8,
            width:32,height:32,cursor:"pointer",fontSize:"1rem",
            display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {error && <div style={{ background:T.redBg,border:`1px solid ${T.red}`,
          borderRadius:T.radiusSm,padding:"0.65rem 0.9rem",marginBottom:"1rem",
          fontSize:"0.8rem",color:T.red }}>⚠ {error}</div>}

        <div style={{ background:T.goldBg,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,
          padding:"0.75rem 0.9rem",marginBottom:"1.25rem",fontSize:"0.76rem",color:T.goldDim,lineHeight:1.6 }}>
          💡 An auction is created for the <strong>current month</strong> of the selected group.
          After creating, you can start it to go live.
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
          <div>
            <label style={{ fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem" }}>
              Select Active Group
            </label>
            {activeGroups.length === 0 ? (
              <div style={{ padding:"0.75rem",background:T.paper,borderRadius:T.radiusSm,
                fontSize:"0.8rem",color:T.muted }}>No active groups found. Create a group first.</div>
            ) : (
              <select value={groupId} onChange={e=>{setError("");setGroupId(e.target.value);}}
                style={{ width:"100%",padding:"0.72rem 0.9rem",border:`1.5px solid ${T.border}`,
                  borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.88rem",
                  color:T.ink,background:T.paper,outline:"none",cursor:"pointer" }}>
                <option value="">Choose group…</option>
                {activeGroups.map((g,i)=>(
                  <option key={i} value={g._id}>
                    {g.groupName} — Month {g.currentMonth||1}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button type="submit" disabled={loading||activeGroups.length===0} style={{
            padding:"0.8rem",background:loading||activeGroups.length===0?T.muted:T.orange,
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.9rem",fontWeight:700,color:"#fff",
            fontFamily:"'Sora',sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
            {loading
              ?<><span style={{ width:18,height:18,border:"2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                  animation:"spin 0.7s linear infinite" }}/> Creating…</>
              :"🔨 Create Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Close Auction Modal ──────────────────────────────────────────────────────
function CloseAuctionModal({ auction, members, onClose, onClosed }) {
  const [winnerId, setWinnerId] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleClose = async () => {
    if (!winnerId) { setError("Please select a winner."); return; }
    setLoading(true);
    try {
      const res = await API.post(`/api/auctions/${auction.id}/close`, { winnerMemberId: winnerId });
      onClosed(res.data);
      onClose();
    } catch(err) {
      setError(err.response?.data?.msg || "Could not close auction.");
      setLoading(false);
    }
  };

  const currentBid = auction.bidAmount || 0;
  const dividend   = currentBid > 0 && members.length > 0
    ? Math.floor((auction.chitAmount - currentBid) / members.length) : 0;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:999,
      background:"rgba(15,14,12,0.45)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.white,
        borderRadius:T.radius,padding:"2rem",width:"100%",maxWidth:440,
        boxShadow:"0 24px 64px rgba(15,14,12,0.2)",
        animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.7rem",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>Close Auction</div>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:T.ink }}>{auction.groupName}</div>
          </div>
          <button onClick={onClose} style={{ background:T.paperDark,border:"none",borderRadius:8,
            width:32,height:32,cursor:"pointer",fontSize:"1rem",
            display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {error && <div style={{ background:T.redBg,border:`1px solid ${T.red}`,
          borderRadius:T.radiusSm,padding:"0.65rem 0.9rem",marginBottom:"1rem",
          fontSize:"0.8rem",color:T.red }}>⚠ {error}</div>}

        {/* Summary */}
        <div style={{ background:T.paper,borderRadius:T.radiusSm,padding:"1rem",marginBottom:"1.25rem" }}>
          {[
            ["Winning Bid",     currentBid>0?`₹${currentBid.toLocaleString("en-IN")}`:"No bids placed"],
            ["Chit Value",      `₹${(auction.chitAmount||0).toLocaleString("en-IN")}`],
            ["Est. Dividend",   currentBid>0?`₹${dividend.toLocaleString("en-IN")}/member`:"—"],
            ["Prize to Winner", currentBid>0?`₹${currentBid.toLocaleString("en-IN")}`:"—"],
          ].map(([l,v],i)=>(
            <div key={i} style={{ display:"flex",justifyContent:"space-between",
              padding:"0.4rem 0",borderBottom:i<3?`1px solid ${T.borderLight}`:"none" }}>
              <span style={{ fontSize:"0.78rem",color:T.muted }}>{l}</span>
              <span style={{ fontSize:"0.85rem",fontWeight:i===0?700:500,
                color:i===0?T.gold:T.ink }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Winner select */}
        <div style={{ marginBottom:"1.25rem" }}>
          <label style={{ fontSize:"0.75rem",fontWeight:600,color:T.ink,display:"block",marginBottom:"0.4rem" }}>
            Select Winner (Lowest Bidder)
          </label>
          <select value={winnerId} onChange={e=>{setError("");setWinnerId(e.target.value);}}
            style={{ width:"100%",padding:"0.72rem 0.9rem",border:`1.5px solid ${T.border}`,
              borderRadius:T.radiusSm,fontFamily:"'Sora',sans-serif",fontSize:"0.88rem",
              color:T.ink,background:T.paper,outline:"none",cursor:"pointer" }}>
            <option value="">Choose winner…</option>
            {members.map((m,i)=>(
              <option key={i} value={m._id}>
                #{m.memberNumber} — {m.userId?.name || "Member"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display:"flex",gap:"0.75rem" }}>
          <button onClick={onClose} style={{ flex:1,padding:"0.75rem",background:T.paperDark,
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.85rem",fontWeight:600,color:T.muted,fontFamily:"'Sora',sans-serif" }}>Cancel</button>
          <button onClick={handleClose} disabled={loading||!winnerId} style={{
            flex:2,padding:"0.75rem",
            background:loading||!winnerId?T.muted:T.green,
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.88rem",fontWeight:700,color:"#fff",
            fontFamily:"'Sora',sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
            {loading
              ?<><span style={{ width:18,height:18,border:"2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                  animation:"spin 0.7s linear infinite" }}/> Closing…</>
              :"✓ Declare Winner & Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  // Data
  const [stats,    setStats]    = useState(null);
  const [members,  setMembers]  = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [txns,     setTxns]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  // Modal states
  const [showCreateGroup,   setShowCreateGroup]   = useState(false);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [closeAuctionData,  setCloseAuctionData]  = useState(null); // { auction, members }
  const [actionLoading,     setActionLoading]     = useState({});

  const showToast = (msg, type="success") => setToast({ msg, type });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, groupsRes, aucRes, plansRes, txnsRes, membersRes] = await Promise.all([
        API.get("/api/dashboard/stats"),
        API.get("/api/chits/groups"),
        API.get("/api/auctions/live"),
        API.get("/api/chits/plans"),
        API.get("/api/dashboard/recent-transactions"),
        API.get("/api/admin/members").catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setGroups(groupsRes.data   || []);
      setAuctions(aucRes.data    || []);
      setPlans(plansRes.data     || []);
      setTxns(txnsRes.data       || []);
      setMembers(membersRes.data || []);
    } catch(err) {
      showToast("Could not load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Start auction ──────────────────────────────────────────────────────────
  const handleStartAuction = async (auctionId) => {
    setActionLoading(p=>({...p,[auctionId]:true}));
    try {
      await API.post(`/api/auctions/${auctionId}/start`);
      showToast("Auction started! It's now live 🔥");
      fetchAll();
    } catch(err) {
      showToast(err.response?.data?.msg || "Could not start auction.", "error");
    } finally {
      setActionLoading(p=>({...p,[auctionId]:false}));
    }
  };

  // ── Open close auction modal + fetch members of that group ─────────────────
  const handleOpenCloseModal = async (auction) => {
    try {
      const membRes = await API.get("/api/admin/members");
      const groupMembers = (membRes.data || []).filter(m => m.groupId?.toString() === auction.groupId?.toString());
      setCloseAuctionData({ auction, members: groupMembers });
    } catch {
      setCloseAuctionData({ auction, members: [] });
    }
  };

  // ── Record cash payment for a member ──────────────────────────────────────
  const handleRecordPayment = async (member) => {
    const confirmed = window.confirm(
      `Record cash payment of \u20b9${member.dueAmount.toLocaleString("en-IN")} for ${member.name}?\n\nThis will mark their installment as paid.`
    );
    if (!confirmed) return;
    try {
      await API.post("/api/admin/record-payment", {
        installmentId: member.installmentId,
        paymentMode:   "Cash",
      });
      showToast(`Payment recorded for ${member.name}`);
      fetchAll();
    } catch(err) {
      showToast(err.response?.data?.msg || "Could not record payment.", "error");
    }
  };

  // ── Advance group to next month ────────────────────────────────────────────
  const handleAdvanceMonth = async (groupId, groupName) => {
    const confirmed = window.confirm(`Advance "${groupName}" to the next month?\nThis will create new installments for all members.`);
    if (!confirmed) return;
    try {
      const res = await API.post(`/api/admin/advance-month/${groupId}`);
      showToast(res.data.msg);
      fetchAll();
    } catch(err) {
      showToast(err.response?.data?.msg || "Could not advance month.", "error");
    }
  };

  const statCards = [
    { label:"Total Members",     value:stats?.totalMembers??"—",    sub:`${stats?.activeGroups??0} active groups`, icon:"👥",color:T.blue,  bg:T.blueBg  },
    { label:"Monthly Collection",value:stats?.monthlyCollection?`₹${(stats.monthlyCollection/1000).toFixed(0)}K`:"₹0", sub:"This month",icon:"₹",color:T.green,bg:T.greenBg},
    { label:"Pending Dues",      value:stats?.pendingDues?`₹${(stats.pendingDues/1000).toFixed(0)}K`:"₹0", sub:"To collect",icon:"⚠",color:T.red,  bg:T.redBg  },
    { label:"Total Corpus",      value:stats?.totalCorpus?`₹${(stats.totalCorpus/100000).toFixed(1)}L`:"₹0", sub:`${stats?.liveAuctions??0} live`,icon:"🏦",color:T.gold, bg:T.goldBg },
  ];

  const tabs = [
    { id:"overview", label:"Overview"    },
    { id:"groups",   label:"Chit Groups" },
    { id:"auctions", label:"Auctions"    },
    { id:"members",  label:"Members"     },
  ];

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.35s ease both}
        .trow:hover td{background:${T.paperDark}!important}
        .act-btn:hover{opacity:0.85;transform:scale(0.97)}
        .act-btn{transition:all 0.15s ease}
      `}</style>

      {/* Tabs */}
      <div style={{ display:"flex",gap:"0.25rem",marginBottom:"1.5rem",flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"0.4rem 1rem",fontFamily:"'Sora',sans-serif",
            background:tab===t.id?`${T.gold}15`:"transparent",
            color:tab===t.id?T.gold:T.muted,
            border:`1px solid ${tab===t.id?T.border:"transparent"}`,
            borderRadius:8,fontSize:"0.8rem",fontWeight:tab===t.id?600:400,cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {tab === "overview" && (
        <div className="fade">
          {/* Stat cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem",marginBottom:"1.5rem" }}>
            {loading
              ? [1,2,3,4].map(i=><Skeleton key={i} h={100} r={14}/>)
              : statCards.map((s,i)=>(
                <div key={i} style={{ background:T.white,border:`1px solid ${T.border}`,
                  borderRadius:T.radius,padding:"1.25rem 1.4rem",boxShadow:T.shadow,
                  display:"flex",flexDirection:"column",gap:"0.4rem",
                  position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,right:0,width:60,height:60,
                    borderRadius:"0 14px 0 60px",background:`${s.color}10`,pointerEvents:"none" }} />
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted }}>{s.label}</span>
                    <span style={{ fontSize:"1rem",background:s.bg,borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center" }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize:"1.55rem",fontWeight:700,color:T.ink,fontFamily:"'DM Serif Display',serif" }}>{s.value}</div>
                  <div style={{ fontSize:"0.72rem",color:T.muted }}>{s.sub}</div>
                </div>
              ))
            }
          </div>

          {/* Quick Actions */}
          <div style={{ background:T.white,border:`1px solid ${T.border}`,
            borderRadius:T.radius,padding:"1.25rem 1.5rem",marginBottom:"1.25rem",boxShadow:T.shadow }}>
            <div style={{ fontSize:"0.68rem",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.9rem" }}>Quick Actions</div>
            <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap" }}>
              {[
                { label:"➕ Create Group",   bg:T.gold,   action:()=>setShowCreateGroup(true)   },
                { label:"🔨 Create Auction", bg:T.orange, action:()=>setShowCreateAuction(true) },
                { label:"📋 View Groups",    bg:T.blue,   action:()=>setTab("groups")           },
                { label:"👥 View Members",   bg:T.muted,  action:()=>setTab("members")          },
              ].map((a,i)=>(
                <button key={i} className="act-btn" onClick={a.action} style={{
                  padding:"0.55rem 1.1rem",background:a.bg,color:"#fff",
                  border:"none",borderRadius:T.radiusSm,fontSize:"0.8rem",
                  fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ background:T.white,border:`1px solid ${T.border}`,
            borderRadius:T.radius,padding:"1.5rem",boxShadow:T.shadow }}>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:T.ink,marginBottom:"1rem" }}>
              Recent Payments
            </div>
            {loading
              ? <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>{[1,2,3,4].map(i=><Skeleton key={i} h={36} r={8}/>)}</div>
              : txns.length === 0
                ? <div style={{ textAlign:"center",padding:"1.5rem",color:T.muted,fontSize:"0.82rem" }}>No transactions yet.</div>
                : <table style={{ width:"100%",borderCollapse:"collapse" }}>
                    <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
                      {["Member","Group","Month","Amount","Date"].map(h=>(
                        <th key={h} style={{ textAlign:"left",paddingBottom:"0.6rem",fontSize:"0.65rem",
                          fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {txns.slice(0,8).map((t,i)=>(
                        <tr key={i} className="trow" style={{ borderBottom:i<Math.min(txns.length,8)-1?`1px solid ${T.borderLight}`:"none" }}>
                          <td style={{ padding:"0.72rem 0.5rem 0.72rem 0",fontSize:"0.82rem",fontWeight:500,color:T.ink }}>{t.memberName}</td>
                          <td style={{ padding:"0.72rem 0.5rem",fontSize:"0.76rem",color:T.muted }}>{t.group}</td>
                          <td style={{ padding:"0.72rem 0.5rem",fontSize:"0.76rem",color:T.muted }}>Month {t.month}</td>
                          <td style={{ padding:"0.72rem 0.5rem",fontSize:"0.88rem",fontWeight:600,color:T.green }}>+₹{(t.amount||t.balance||0).toLocaleString("en-IN")}</td>
                          <td style={{ padding:"0.72rem 0",fontSize:"0.74rem",color:T.muted }}>
                            {t.paidAt?new Date(t.paidAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        </div>
      )}

      {/* ══ GROUPS TAB ══ */}
      {tab === "groups" && (
        <div className="fade">
          <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:"1.25rem" }}>
            <button onClick={()=>setShowCreateGroup(true)} style={{
              padding:"0.55rem 1.1rem",background:T.gold,color:"#fff",
              border:"none",borderRadius:T.radiusSm,fontSize:"0.82rem",
              fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
              ➕ Create New Group
            </button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
            {loading
              ? [1,2,3].map(i=><Skeleton key={i} h={90} r={14}/>)
              : groups.length === 0
                ? <div style={{ background:T.white,border:`1px solid ${T.border}`,
                    borderRadius:T.radius,padding:"3rem",textAlign:"center",boxShadow:T.shadow,
                    color:T.muted,fontSize:"0.85rem" }}>No groups yet. Create one above.</div>
                : groups.map((g,i)=>{
                    const plan = g.planId;
                    const filled = g.membersJoined || 0;
                    const max   = plan?.maxMembers || 25;
                    const pct   = Math.round((filled/max)*100);
                    return (
                      <div key={i} style={{ background:T.white,border:`1px solid ${T.border}`,
                        borderRadius:T.radius,padding:"1.1rem 1.4rem",boxShadow:T.shadow,
                        display:"flex",alignItems:"center",gap:"1.25rem",flexWrap:"wrap" }}>
                        <div style={{ flex:2,minWidth:140 }}>
                          <div style={{ fontSize:"0.92rem",fontWeight:600,color:T.ink }}>{g.groupName}</div>
                          <div style={{ fontSize:"0.72rem",color:T.muted }}>{plan?.planName} · Month {g.currentMonth||1}/{plan?.totalMonths||25}</div>
                        </div>
                        <div style={{ flex:2,minWidth:140 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                            <span style={{ fontSize:"0.7rem",color:T.muted }}>{filled}/{max} members</span>
                            <span style={{ fontSize:"0.7rem",fontWeight:600,color:T.gold }}>{pct}%</span>
                          </div>
                          <div style={{ height:6,background:T.paperDark,borderRadius:3,overflow:"hidden" }}>
                            <div style={{ height:"100%",width:`${pct}%`,borderRadius:3,
                              background:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />
                          </div>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:"0.65rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>Monthly</div>
                          <div style={{ fontSize:"0.88rem",fontWeight:600,color:T.ink }}>₹{(plan?.monthlySubscription||0).toLocaleString("en-IN")}</div>
                        </div>
                        <Badge status={g.status} />
                        <div style={{display:"flex",gap:"0.4rem"}}>
                          <button className="act-btn" onClick={()=>setShowCreateAuction(true)} style={{
                            padding:"5px 12px",fontSize:"0.75rem",background:T.orangeBg,color:T.orange,
                            border:`1px solid ${T.border}`,borderRadius:7,cursor:"pointer",
                            fontFamily:"'Sora',sans-serif",fontWeight:600 }}>
                            🔨 Create Auction
                          </button>
                          <button className="act-btn" onClick={()=>handleAdvanceMonth(g._id, g.groupName)} style={{
                            padding:"5px 12px",fontSize:"0.75rem",background:T.blueBg,color:T.blue,
                            border:`1px solid rgba(26,95,168,0.2)`,borderRadius:7,cursor:"pointer",
                            fontFamily:"'Sora',sans-serif",fontWeight:600 }}>
                            ▶ Next Month
                          </button>
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>
      )}

      {/* ══ AUCTIONS TAB ══ */}
      {tab === "auctions" && (
        <div className="fade">
          <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:"1.25rem" }}>
            <button onClick={()=>setShowCreateAuction(true)} style={{
              padding:"0.55rem 1.1rem",background:T.orange,color:"#fff",
              border:"none",borderRadius:T.radiusSm,fontSize:"0.82rem",
              fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif" }}>
              🔨 Create New Auction
            </button>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
            {loading
              ? [1,2].map(i=><Skeleton key={i} h={90} r={14}/>)
              : auctions.length === 0
                ? <div style={{ background:T.white,border:`1px solid ${T.border}`,
                    borderRadius:T.radius,padding:"3rem",textAlign:"center",boxShadow:T.shadow,
                    color:T.muted,fontSize:"0.85rem" }}>No live or upcoming auctions. Create one above.</div>
                : auctions.map((a,i)=>{
                    const isLive     = a.status === "live";
                    const isUpcoming = a.status === "upcoming";
                    const busy = actionLoading[a.id];
                    return (
                      <div key={i} style={{ background:T.white,
                        border:`1.5px solid ${isLive?T.green:T.border}`,
                        borderRadius:T.radius,padding:"1.2rem 1.5rem",
                        boxShadow:isLive?`0 4px 20px ${T.goldGlow}`:T.shadow,
                        display:"flex",alignItems:"center",gap:"1.25rem",flexWrap:"wrap" }}>
                        <div style={{ flex:2,minWidth:140 }}>
                          <div style={{ fontSize:"0.92rem",fontWeight:600,color:T.ink }}>{a.groupName}</div>
                          <div style={{ fontSize:"0.72rem",color:T.muted }}>Month {a.monthNumber} · {a.planName}</div>
                        </div>
                        <div style={{ flex:1,minWidth:110 }}>
                          <div style={{ fontSize:"0.65rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>Chit Value</div>
                          <div style={{ fontSize:"0.92rem",fontWeight:700,color:T.ink,fontFamily:"'DM Serif Display',serif" }}>₹{(a.chitAmount||0).toLocaleString("en-IN")}</div>
                        </div>
                        <div style={{ flex:1,minWidth:120 }}>
                          <div style={{ fontSize:"0.65rem",color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>Current Bid</div>
                          <div style={{ fontSize:"0.92rem",fontWeight:700,
                            color:a.bidAmount>0?T.red:T.muted,fontFamily:"'DM Serif Display',serif" }}>
                            {a.bidAmount>0?`₹${a.bidAmount.toLocaleString("en-IN")}`:"No bids"}
                          </div>
                        </div>
                        <Badge status={a.status} />
                        {/* Action buttons */}
                        {isUpcoming && (
                          <button className="act-btn" onClick={()=>handleStartAuction(a.id)}
                            disabled={busy} style={{
                              padding:"6px 14px",fontSize:"0.78rem",
                              background:busy?T.muted:T.green,color:"#fff",
                              border:"none",borderRadius:7,cursor:"pointer",
                              fontFamily:"'Sora',sans-serif",fontWeight:600,
                              display:"flex",alignItems:"center",gap:"0.3rem" }}>
                            {busy
                              ?<><span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/> Starting…</>
                              :"▶ Start Auction"}
                          </button>
                        )}
                        {isLive && (
                          <button className="act-btn" onClick={()=>handleOpenCloseModal(a)}
                            style={{ padding:"6px 14px",fontSize:"0.78rem",
                              background:T.red,color:"#fff",
                              border:"none",borderRadius:7,cursor:"pointer",
                              fontFamily:"'Sora',sans-serif",fontWeight:600 }}>
                            ✓ Close & Declare Winner
                          </button>
                        )}
                      </div>
                    );
                  })
            }
          </div>
        </div>
      )}

      {/* ══ MEMBERS TAB ══ */}
      {tab === "members" && (
        <div className="fade">
          <div style={{ background:T.white,border:`1px solid ${T.border}`,
            borderRadius:T.radius,boxShadow:T.shadow,overflow:"hidden" }}>
            {loading
              ? <div style={{ padding:"1.5rem",display:"flex",flexDirection:"column",gap:"0.75rem" }}>
                  {[1,2,3,4,5].map(i=><Skeleton key={i} h={48} r={8}/>)}
                </div>
              : members.length === 0
                ? <div style={{ padding:"3rem",textAlign:"center",color:T.muted,fontSize:"0.85rem" }}>
                    No members yet. Members appear here after they join a chit group.
                  </div>
                : <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
                      <thead style={{ background:T.paper }}>
                        <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                          {["#","Member","Contact","Group","Total Paid","Due","Status","Action"].map(h=>(
                            <th key={h} style={{ textAlign:"left",padding:"0.85rem 1rem",
                              fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.08em",
                              textTransform:"uppercase",color:T.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m,i)=>{
                          const initials=(m.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                          const hasDue = m.dueAmount > 0;
                          return(
                            <tr key={i} className="trow" style={{ borderBottom:i<members.length-1?`1px solid ${T.borderLight}`:"none" }}>
                              <td style={{ padding:"0.82rem 1rem",fontSize:"0.78rem",color:T.muted,fontWeight:600 }}>#{m.memberNumber}</td>
                              <td style={{ padding:"0.82rem 1rem" }}>
                                <div style={{ display:"flex",alignItems:"center",gap:"0.55rem" }}>
                                  <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,
                                    background:`${T.gold}20`,border:`1px solid ${T.border}`,
                                    display:"flex",alignItems:"center",justifyContent:"center",
                                    fontSize:"0.62rem",fontWeight:700,color:T.goldDim }}>{initials}</div>
                                  <span style={{ fontSize:"0.82rem",fontWeight:500,color:T.ink }}>{m.name}</span>
                                </div>
                              </td>
                              <td style={{ padding:"0.82rem 1rem" }}>
                                <div style={{ fontSize:"0.76rem",color:T.ink }}>{m.email}</div>
                                <div style={{ fontSize:"0.72rem",color:T.muted }}>{m.phone}</div>
                              </td>
                              <td style={{ padding:"0.82rem 1rem" }}>
                                <div style={{ fontSize:"0.78rem",fontWeight:500,color:T.ink }}>{m.groupName}</div>
                                <div style={{ fontSize:"0.68rem",color:T.muted }}>{m.planName}</div>
                              </td>
                              <td style={{ padding:"0.82rem 1rem",fontSize:"0.85rem",fontWeight:600,color:T.green }}>₹{(m.totalPaid||0).toLocaleString("en-IN")}</td>
                              <td style={{ padding:"0.82rem 1rem",fontSize:"0.85rem",fontWeight:600,color:hasDue?T.red:T.muted }}>
                                {hasDue?`₹${m.dueAmount.toLocaleString("en-IN")}`:"—"}
                              </td>
                              <td style={{ padding:"0.82rem 1rem" }}>
                                <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"3px 10px",borderRadius:20,
                                  background:hasDue?T.redBg:T.greenBg,color:hasDue?T.red:T.green }}>
                                  {hasDue?"⚠ Due":"✓ Paid"}
                                </span>
                              </td>
                              <td style={{ padding:"0.82rem 1rem" }}>
                                {hasDue&&m.installmentId&&(
                                  <button className="act-btn" onClick={()=>handleRecordPayment(m)} style={{
                                    padding:"3px 10px",fontSize:"0.72rem",background:T.greenBg,color:T.green,
                                    border:"none",borderRadius:6,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:600 }}>
                                    Record Pay
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
            }
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateGroup && (
        <CreateGroupModal plans={plans} onClose={()=>setShowCreateGroup(false)}
          onCreated={g=>{ showToast(`Group "${g.groupName}" created!`); fetchAll(); }} />
      )}
      {showCreateAuction && (
        <CreateAuctionModal groups={groups} onClose={()=>setShowCreateAuction(false)}
          onCreated={()=>{ showToast("Auction created! Start it to go live."); fetchAll(); setTab("auctions"); }} />
      )}
      {closeAuctionData && (
        <CloseAuctionModal
          auction={closeAuctionData.auction}
          members={closeAuctionData.members}
          onClose={()=>setCloseAuctionData(null)}
          onClosed={data=>{ showToast(`Auction closed! Dividend: ₹${data.dividend?.toLocaleString("en-IN")}/member`); fetchAll(); }} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}