// client/src/pages/Profile.jsx
// Fully wired to real backend APIs
import { useState, useEffect } from "react";
import API from "../services/api";

const T = {
  gold:"#C9922A", goldLight:"#E5B253", goldDim:"#7a5718",
  goldBg:"rgba(201,146,42,0.08)", goldGlow:"rgba(201,146,42,0.15)",
  ink:"#0f0e0c", paper:"#faf8f3", paperDark:"#f2ede3",
  muted:"#6b6557", border:"rgba(201,146,42,0.2)", borderLight:"rgba(201,146,42,0.1)",
  white:"#ffffff", green:"#2e7d52", greenBg:"#edf7f1",
  red:"#b03a1a", redBg:"#fff4f0",
  radius:"14px", radiusSm:"9px", shadow:"0 4px 24px rgba(15,14,12,0.07)",
};

function Field({ label, name, type="text", value, onChange, placeholder, disabled, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
      <label style={{ fontSize:"0.75rem", fontWeight:600, color:T.ink, letterSpacing:"0.03em" }}>
        {label}
      </label>
      <input
        name={name} type={type} value={value}
        onChange={onChange} placeholder={placeholder}
        disabled={disabled}
        style={{
          width:"100%", padding:"0.72rem 0.9rem",
          border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm,
          fontFamily:"'Sora',sans-serif", fontSize:"0.88rem", color:T.ink,
          background: disabled ? T.paperDark : T.paper, outline:"none",
          transition:"border-color 0.2s, box-shadow 0.2s",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e => { if(!disabled) e.target.style.borderColor=T.gold; e.target.style.boxShadow=`0 0 0 3px rgba(201,146,42,0.12)`; }}
        onBlur={e  => { e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
      />
      {hint && <span style={{ fontSize:"0.7rem", color:T.muted }}>{hint}</span>}
    </div>
  );
}

function Toast({ msg, type="success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      background: type==="success" ? T.greenBg : T.redBg,
      border:`1px solid ${type==="success" ? T.green : T.red}`,
      borderRadius:T.radiusSm, padding:"0.85rem 1.25rem",
      fontSize:"0.85rem", fontWeight:600,
      color: type==="success" ? T.green : T.red,
      boxShadow:"0 8px 24px rgba(15,14,12,0.12)",
      display:"flex", alignItems:"center", gap:"0.6rem",
      animation:"slideUp 0.3s ease",
      maxWidth:320,
    }}>
      <span>{type==="success"?"✅":"⚠"}</span>
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none",
        cursor:"pointer", fontSize:"1rem", color:"inherit", opacity:0.7 }}>✕</button>
    </div>
  );
}

export default function Profile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [activeTab,setActiveTab]= useState("info");
  const [toast,    setToast]    = useState(null); // { msg, type }
  const [stats,    setStats]    = useState(null);

  // Edit form state
  const [form, setForm] = useState({ name:"", email:"", phone:"" });

  // Password form state
  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [pwError,setPwError]= useState("");

  // ── Fetch profile + user stats ────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.all([
          API.get("/api/user/profile"),
          API.get("/api/dashboard/user-stats"),
        ]);
        setProfile(profileRes.data);
        setForm({
          name:  profileRes.data.name  || "",
          email: profileRes.data.email || "",
          phone: profileRes.data.phone || "",
        });
        setStats(statsRes.data);
      } catch (err) {
        setToast({ msg: "Could not load profile.", type:"error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Update profile ────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setToast({ msg:"Name cannot be empty.", type:"error" }); return; }
    if (!form.email.includes("@")) { setToast({ msg:"Enter a valid email.", type:"error" }); return; }

    setSaving(true);
    try {
      const res = await API.put("/api/user/profile", {
        name:  form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setProfile(res.data.user);
      // Update localStorage so sidebar name updates instantly
      localStorage.setItem("stc_user", JSON.stringify(res.data.user));
      setToast({ msg:"Profile updated successfully!", type:"success" });
    } catch (err) {
      setToast({ msg: err.response?.data?.msg || "Update failed.", type:"error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.currentPassword) { setPwError("Enter your current password."); return; }
    if (pwForm.newPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("New passwords do not match."); return; }

    setPwSaving(true);
    try {
      await API.put("/api/user/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
      setToast({ msg:"Password changed successfully!", type:"success" });
    } catch (err) {
      setPwError(err.response?.data?.msg || "Password change failed.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleField   = e => setForm({ ...form,   [e.target.name]: e.target.value });
  const handlePwField = e => { setPwError(""); setPwForm({ ...pwForm, [e.target.name]: e.target.value }); };

  // initials from name
  const initials = profile?.name
    ? profile.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
    : "?";

  const tabs = [
    { id:"info",     label:"Personal Info"    },
    { id:"password", label:"Change Password"  },
    { id:"stats",    label:"My Stats"         },
  ];

  return (
    <div style={{ maxWidth:680, margin:"0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.35s ease both}
      `}</style>

      {/* ── Profile header card ── */}
      <div style={{ background:T.white, border:`1px solid ${T.border}`,
        borderRadius:T.radius, padding:"1.75rem", boxShadow:T.shadow,
        marginBottom:"1.25rem", position:"relative", overflow:"hidden" }}>
        {/* Top gold bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
          background:`linear-gradient(90deg,${T.gold},${T.goldLight})` }} />

        <div style={{ display:"flex", alignItems:"center", gap:"1.25rem" }}>
          {/* Avatar */}
          <div style={{
            width:72, height:72, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontSize:"1.5rem", fontWeight:700,
            fontFamily:"'DM Serif Display',serif",
            boxShadow:`0 4px 16px ${T.goldGlow}`,
          }}>
            {loading ? "?" : initials}
          </div>

          <div style={{ flex:1 }}>
            {loading ? (
              <>
                <div style={{ height:24, width:180, borderRadius:6, background:T.paperDark, marginBottom:8 }} />
                <div style={{ height:16, width:220, borderRadius:6, background:T.paperDark }} />
              </>
            ) : (
              <>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.4rem", color:T.ink }}>
                  {profile?.name}
                </div>
                <div style={{ fontSize:"0.8rem", color:T.muted, marginTop:"0.2rem" }}>{profile?.email}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginTop:"0.5rem" }}>
                  <span style={{
                    background: profile?.role==="admin" ? T.ink : T.goldBg,
                    color:      profile?.role==="admin" ? T.goldLight : T.gold,
                    fontSize:"0.68rem", fontWeight:700,
                    padding:"3px 10px", borderRadius:20, letterSpacing:"0.08em",
                    textTransform:"uppercase",
                  }}>
                    {profile?.role==="admin" ? "⬡ Admin" : "◈ Member"}
                  </span>
                  <span style={{ fontSize:"0.72rem", color:T.muted }}>
                    Joined {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("en-IN",{month:"long",year:"numeric"})
                      : "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:"0.25rem", marginBottom:"1.25rem" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:"0.4rem 1rem", fontFamily:"'Sora',sans-serif",
            background: activeTab===t.id ? `${T.gold}15` : "transparent",
            color: activeTab===t.id ? T.gold : T.muted,
            border:`1px solid ${activeTab===t.id ? T.border : "transparent"}`,
            borderRadius:8, fontSize:"0.8rem",
            fontWeight: activeTab===t.id ? 600 : 400, cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── PERSONAL INFO TAB ── */}
      {activeTab === "info" && (
        <div className="fade" style={{ background:T.white, border:`1px solid ${T.border}`,
          borderRadius:T.radius, padding:"1.75rem", boxShadow:T.shadow }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.15rem",
            color:T.ink, marginBottom:"1.5rem" }}>Edit Profile</div>

          <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
            <Field label="Full Name"     name="name"  value={form.name}
              onChange={handleField} placeholder="Ravi Kumar" disabled={loading||saving} />
            <Field label="Email Address" name="email" type="email" value={form.email}
              onChange={handleField} placeholder="ravi@gmail.com" disabled={loading||saving} />
            <Field label="Mobile Number" name="phone" type="tel" value={form.phone}
              onChange={handleField} placeholder="9876543210"
              disabled={loading||saving} hint="10-digit Indian mobile number" />

            {/* Read-only fields */}
            <Field label="Role" name="role" value={profile?.role || "—"}
              onChange={()=>{}} disabled={true} hint="Role can only be changed by admin via MongoDB." />

            <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:"0.5rem" }}>
              <button type="submit" disabled={saving||loading} style={{
                padding:"0.72rem 1.75rem",
                background: saving ? T.muted : T.gold,
                border:"none", borderRadius:T.radiusSm, cursor:"pointer",
                fontSize:"0.88rem", fontWeight:700, color:"#fff",
                fontFamily:"'Sora',sans-serif",
                display:"flex", alignItems:"center", gap:"0.5rem",
              }}>
                {saving
                  ? <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",
                      borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                      animation:"spin 0.7s linear infinite" }}/> Saving…</>
                  : "Save Changes →"
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CHANGE PASSWORD TAB ── */}
      {activeTab === "password" && (
        <div className="fade" style={{ background:T.white, border:`1px solid ${T.border}`,
          borderRadius:T.radius, padding:"1.75rem", boxShadow:T.shadow }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.15rem",
            color:T.ink, marginBottom:"0.5rem" }}>Change Password</div>
          <p style={{ fontSize:"0.78rem", color:T.muted, marginBottom:"1.5rem" }}>
            Choose a strong password with at least 6 characters.
          </p>

          {pwError && (
            <div style={{ background:T.redBg, border:`1px solid ${T.red}`,
              borderRadius:T.radiusSm, padding:"0.65rem 0.9rem",
              marginBottom:"1.25rem", fontSize:"0.8rem", color:T.red }}>
              ⚠ {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
            <Field label="Current Password"    name="currentPassword" type="password"
              value={pwForm.currentPassword} onChange={handlePwField}
              placeholder="Your current password" disabled={pwSaving} />
            <Field label="New Password"        name="newPassword"     type="password"
              value={pwForm.newPassword}     onChange={handlePwField}
              placeholder="Min. 6 characters" disabled={pwSaving} />
            <Field label="Confirm New Password" name="confirmPassword" type="password"
              value={pwForm.confirmPassword} onChange={handlePwField}
              placeholder="Repeat new password" disabled={pwSaving} />

            {/* Password strength */}
            {pwForm.newPassword && (
              <div>
                <div style={{ height:4, borderRadius:2, background:"#e5e0d6", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:2, transition:"width 0.3s ease",
                    width: pwForm.newPassword.length>=10?"100%":pwForm.newPassword.length>=6?"60%":"30%",
                    background: pwForm.newPassword.length>=10?T.green:pwForm.newPassword.length>=6?T.gold:T.red,
                  }} />
                </div>
                <div style={{ fontSize:"0.7rem", marginTop:3,
                  color: pwForm.newPassword.length>=10?T.green:pwForm.newPassword.length>=6?T.gold:T.red }}>
                  {pwForm.newPassword.length>=10?"Strong password"
                  :pwForm.newPassword.length>=6?"Add more characters for stronger security"
                  :"Too short"}
                </div>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:"0.5rem" }}>
              <button type="submit" disabled={pwSaving} style={{
                padding:"0.72rem 1.75rem",
                background: pwSaving ? T.muted : T.gold,
                border:"none", borderRadius:T.radiusSm, cursor:"pointer",
                fontSize:"0.88rem", fontWeight:700, color:"#fff",
                fontFamily:"'Sora',sans-serif",
                display:"flex", alignItems:"center", gap:"0.5rem",
              }}>
                {pwSaving
                  ? <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",
                      borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                      animation:"spin 0.7s linear infinite" }}/> Updating…</>
                  : "Update Password →"
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MY STATS TAB ── */}
      {activeTab === "stats" && (
        <div className="fade" style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }}>
            {[
              { label:"Active Chit Groups",  value: stats?.activeGroups??stats?.memberships?.length??0, icon:"◈", color:T.gold   },
              { label:"Total Paid",          value: stats?.totalPaid?`₹${stats.totalPaid.toLocaleString("en-IN")}`:"₹0", icon:"✓", color:T.green },
              { label:"Outstanding Due",     value: stats?.totalDue?`₹${stats.totalDue.toLocaleString("en-IN")}`:"₹0",  icon:"⚠", color:T.red   },
              { label:"Next Auction",        value: stats?.nextAuction?`Month ${stats.nextAuction.month}`:"—",           icon:"🔨",color:T.gold   },
            ].map((s,i)=>(
              <div key={i} style={{ background:T.white, border:`1px solid ${T.border}`,
                borderRadius:T.radius, padding:"1.25rem", boxShadow:T.shadow,
                display:"flex", alignItems:"center", gap:"1rem" }}>
                <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                  background:`${s.color}15`, color:s.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1.1rem", fontWeight:700 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:"0.68rem", color:T.muted, textTransform:"uppercase",
                    letterSpacing:"0.09em", marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:"1.25rem", fontWeight:700, color:s.color,
                    fontFamily:"'DM Serif Display',serif" }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Account info */}
          <div style={{ background:T.white, border:`1px solid ${T.border}`,
            borderRadius:T.radius, padding:"1.5rem", boxShadow:T.shadow }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.1rem",
              color:T.ink, marginBottom:"1rem" }}>Account Details</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
              {[
                ["Member ID",   profile?._id?.slice(-8).toUpperCase() || "—"],
                ["Name",        profile?.name  || "—"],
                ["Email",       profile?.email || "—"],
                ["Phone",       profile?.phone || "—"],
                ["Role",        profile?.role  || "—"],
                ["Member Since",profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—"],
              ].map(([l,v],i,arr)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  padding:"0.65rem 0",
                  borderBottom: i<arr.length-1 ? `1px solid ${T.borderLight}` : "none" }}>
                  <span style={{ fontSize:"0.78rem", color:T.muted }}>{l}</span>
                  <span style={{ fontSize:"0.82rem", fontWeight:500, color:T.ink,
                    fontFamily: l==="Member ID" ? "monospace" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}