// client/src/pages/Notifications.jsx
// Fully wired — real API + real-time Socket.IO push notifications
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const T = {
  gold:"#C9922A", goldLight:"#E5B253", goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)",
  ink:"#0f0e0c", paper:"#faf8f3", paperDark:"#f2ede3",
  muted:"#6b6557", border:"rgba(201,146,42,0.2)", borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff", green:"#2e7d52", greenBg:"#edf7f1",
  red:"#b03a1a", redBg:"#fff4f0", blue:"#1a5fa8", blueBg:"#eef4fc",
  orange:"#c45c12", orangeBg:"#fff3ea",
  radius:"14px", radiusSm:"9px", shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_MAP = {
  payment: { icon:"💰", color:T.green,  bg:T.greenBg,  label:"Payment"  },
  auction: { icon:"🔨", color:T.orange, bg:T.orangeBg, label:"Auction"  },
  group:   { icon:"◈",  color:T.gold,   bg:T.goldBg,   label:"Group"    },
  alert:   { icon:"⚠",  color:T.red,    bg:T.redBg,    label:"Alert"    },
  system:  { icon:"📢", color:T.blue,   bg:T.blueBg,   label:"System"   },
};

function Skeleton({ w="100%", h=20, r=6 }) {
  return <div style={{ width:w,height:h,borderRadius:r,
    background:"linear-gradient(90deg,#f0ebe0 25%,#e8e2d6 50%,#f0ebe0 75%)",
    backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite" }}/>;
}

// ── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)} hr ago`;
  if (diff < 604800)return `${Math.floor(diff/86400)} days ago`;
  return new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ notif, onRead, onDelete, isNew }) {
  const t = TYPE_MAP[notif.type] || TYPE_MAP.system;
  const [hov, setHov] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={()=>{ if(!notif.read) onRead(notif._id); }}
      style={{
        background: isNew ? "#fffef5" : notif.read ? T.paper : T.white,
        border:`1px solid ${notif.read ? T.borderLight : T.border}`,
        borderLeft:`3px solid ${notif.read ? "transparent" : t.color}`,
        borderRadius:T.radiusSm,
        padding:"1rem 1.1rem",
        display:"flex", alignItems:"flex-start", gap:"0.9rem",
        cursor: notif.read ? "default" : "pointer",
        transition:"all 0.18s ease",
        boxShadow: hov&&!notif.read ? `0 4px 16px rgba(15,14,12,0.06)` : "none",
        animation: isNew ? "popIn 0.4s cubic-bezier(0.22,1,0.36,1) both" : "none",
        position:"relative",
      }}
    >
      {/* Icon */}
      <div style={{ width:40,height:40,borderRadius:10,flexShrink:0,
        background:t.bg,display:"flex",alignItems:"center",
        justifyContent:"center",fontSize:"1.1rem" }}>
        {t.icon}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem" }}>
          <div style={{ fontSize:"0.88rem",fontWeight:notif.read?500:700,color:T.ink,lineHeight:1.3 }}>
            {notif.title}
          </div>
          <span style={{ fontSize:"0.68rem",color:T.muted,flexShrink:0,marginTop:2 }}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p style={{ fontSize:"0.8rem",color:T.muted,marginTop:"0.25rem",lineHeight:1.5 }}>
          {notif.message}
        </p>
        <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginTop:"0.4rem" }}>
          <span style={{ fontSize:"0.65rem",fontWeight:600,padding:"2px 8px",borderRadius:20,
            background:t.bg,color:t.color,letterSpacing:"0.05em" }}>{t.label}</span>
          {!notif.read && (
            <span style={{ width:6,height:6,borderRadius:"50%",background:t.color }} />
          )}
        </div>
      </div>

      {/* Delete button — shows on hover */}
      {hov && (
        <button
          onClick={async e => {
            e.stopPropagation();
            setDeleting(true);
            await onDelete(notif._id);
          }}
          disabled={deleting}
          style={{ position:"absolute",top:8,right:8,
            background:"none",border:"none",cursor:"pointer",
            color:T.muted,fontSize:"0.85rem",opacity:0.6,
            padding:"2px 4px",borderRadius:4,
            transition:"opacity 0.15s" }}
        >✕</button>
      )}
    </div>
  );
}

// ── Main Notifications Page ───────────────────────────────────────────────────
export default function Notifications() {
  const navigate       = useNavigate();
  const socketRef      = useRef(null);
  const [notifs,       setNotifs]      = useState([]);
  const [unread,       setUnread]      = useState(0);
  const [loading,      setLoading]     = useState(true);
  const [filter,       setFilter]      = useState("all");
  const [newNotifIds,  setNewNotifIds] = useState(new Set());
  const [toast,        setToast]       = useState("");
  const [clearing,     setClearing]    = useState(false);

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/notifications");
      setNotifs(res.data.notifications || []);
      setUnread(res.data.unreadCount   || 0);
    } catch {
      // silently fail — notifications are not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Socket.IO — real-time push ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("stc_token");
    const raw   = localStorage.getItem("stc_user");
    if (!token || !raw) return;

    const user   = JSON.parse(raw);
    const socket = io("http://localhost:5000", { transports:["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // join personal room so admin can push to specific users
      socket.emit("user:join", { userId: user._id });
    });

    socket.on("notification:new", (data) => {
      // add to top of list
      const newNotif = {
        _id:       Date.now().toString(),
        title:     data.title,
        message:   data.message,
        type:      data.type || "system",
        read:      false,
        createdAt: new Date().toISOString(),
      };
      setNotifs(prev => [newNotif, ...prev]);
      setUnread(prev => prev + 1);
      setNewNotifIds(prev => new Set([...prev, newNotif._id]));
      // clear "new" highlight after 5s
      setTimeout(() => setNewNotifIds(prev => {
        const next = new Set(prev); next.delete(newNotif._id); return next;
      }), 5000);
    });

    return () => socket.disconnect();
  }, []);

  // ── Mark one as read ───────────────────────────────────────────────────────
  const handleRead = async (id) => {
    setNotifs(prev => prev.map(n => n._id===id ? {...n,read:true} : n));
    setUnread(prev => Math.max(0, prev-1));
    try { await API.put(`/api/notifications/${id}/read`); } catch {}
  };

  // ── Mark all as read ───────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setNotifs(prev => prev.map(n => ({...n,read:true})));
    setUnread(0);
    try {
      await API.put("/api/notifications/mark-all-read");
      showToast("All notifications marked as read");
    } catch {}
  };

  // ── Delete one ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const notif = notifs.find(n=>n._id===id);
    setNotifs(prev => prev.filter(n => n._id !== id));
    if (notif && !notif.read) setUnread(prev => Math.max(0,prev-1));
    try { await API.delete(`/api/notifications/${id}`); } catch {}
  };

  // ── Clear all ──────────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    setClearing(true);
    try {
      await API.delete("/api/notifications");
      setNotifs([]);
      setUnread(0);
      showToast("All notifications cleared");
    } catch {} finally { setClearing(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = notifs.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read")   return  n.read;
    if (["payment","auction","group","alert","system"].includes(filter)) return n.type === filter;
    return true;
  });

  const filterBtns = [
    { id:"all",     label:"All"      },
    { id:"unread",  label:"Unread"   },
    { id:"payment", label:"💰 Payments" },
    { id:"auction", label:"🔨 Auctions" },
    { id:"alert",   label:"⚠ Alerts"   },
  ];

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes popIn{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.35s ease both}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,
          background:T.greenBg,border:`1px solid ${T.green}`,
          borderRadius:T.radiusSm,padding:"0.85rem 1.25rem",
          fontSize:"0.85rem",fontWeight:600,color:T.green,
          boxShadow:"0 8px 24px rgba(15,14,12,0.12)",
          animation:"fadeUp 0.3s ease" }}>
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",
        alignItems:"flex-start",marginBottom:"1.5rem" }}>
        <div>
          <p style={{ fontSize:"0.85rem",color:T.muted }}>
            {unread > 0
              ? <><strong style={{ color:T.red }}>{unread} unread</strong> notification{unread>1?"s":""}</>
              : "You're all caught up!"}
          </p>
        </div>
        <div style={{ display:"flex",gap:"0.5rem" }}>
          {unread > 0 && (
            <button onClick={handleMarkAllRead} style={{
              padding:"0.4rem 0.9rem",background:T.white,
              border:`1px solid ${T.border}`,borderRadius:T.radiusSm,
              cursor:"pointer",fontSize:"0.78rem",fontWeight:600,
              color:T.ink,fontFamily:"'Sora',sans-serif" }}>
              ✓ Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={handleClearAll} disabled={clearing} style={{
              padding:"0.4rem 0.9rem",background:T.white,
              border:`1px solid ${T.border}`,borderRadius:T.radiusSm,
              cursor:"pointer",fontSize:"0.78rem",fontWeight:600,
              color:T.red,fontFamily:"'Sora',sans-serif" }}>
              {clearing?"Clearing…":"🗑 Clear all"}
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",flexWrap:"wrap" }}>
        {filterBtns.map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            padding:"0.35rem 0.9rem",fontFamily:"'Sora',sans-serif",
            background:filter===f.id?T.gold:T.white,
            color:filter===f.id?"#fff":T.muted,
            border:`1px solid ${filter===f.id?T.gold:T.border}`,
            borderRadius:20,fontSize:"0.76rem",
            fontWeight:filter===f.id?600:400,cursor:"pointer",
          }}>{f.label}{f.id==="unread"&&unread>0?` (${unread})`:""}</button>
        ))}
        <div style={{ marginLeft:"auto",fontSize:"0.75rem",color:T.muted,
          display:"flex",alignItems:"center" }}>
          {filtered.length} notification{filtered.length!==1?"s":""}
        </div>
      </div>

      {/* Notification list */}
      {loading ? (
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          {[1,2,3,4].map(i=><Skeleton key={i} h={90} r={8}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:T.white,border:`1px solid ${T.border}`,
          borderRadius:T.radius,padding:"4rem",textAlign:"center",boxShadow:T.shadow }}>
          <div style={{ fontSize:"3rem",marginBottom:"0.75rem" }}>🔔</div>
          <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.2rem",color:T.ink }}>
            {filter==="unread"?"No unread notifications":"No notifications yet"}
          </div>
          <p style={{ fontSize:"0.82rem",color:T.muted,marginTop:"0.5rem" }}>
            {filter==="unread"
              ?"You're all caught up! Great job."
              :"Notifications about payments, auctions, and group updates will appear here."}
          </p>
        </div>
      ) : (
        <div className="fade" style={{ display:"flex",flexDirection:"column",gap:"0.6rem" }}>
          {filtered.map((n,i)=>(
            <NotifRow
              key={n._id}
              notif={n}
              onRead={handleRead}
              onDelete={handleDelete}
              isNew={newNotifIds.has(n._id)}
            />
          ))}
        </div>
      )}

      {/* Seed button — helps admin create test notifications */}
      {notifs.length === 0 && !loading && (
        <div style={{ background:T.paper,border:`1px solid ${T.border}`,
          borderRadius:T.radius,padding:"1.25rem",marginTop:"1.25rem",
          textAlign:"center" }}>
          <p style={{ fontSize:"0.78rem",color:T.muted,marginBottom:"0.75rem" }}>
            No notifications yet. Ask your admin to broadcast one, or trigger one by making a payment.
          </p>
          <button onClick={async()=>{
            try {
              // create a welcome notification for self
              await API.post("/api/notifications/broadcast",{
                title:"Welcome to SAI TULASI Chit Fund!",
                message:"Your account is active. Browse chit plans and join a group to get started.",
                type:"system",
              }).catch(()=>{});
              fetchNotifs();
            } catch{}
          }} style={{
            padding:"0.5rem 1.1rem",background:T.gold,color:"#fff",
            border:"none",borderRadius:T.radiusSm,cursor:"pointer",
            fontSize:"0.8rem",fontWeight:600,fontFamily:"'Sora',sans-serif" }}>
            Send Welcome Notification
          </button>
        </div>
      )}
    </div>
  );
}