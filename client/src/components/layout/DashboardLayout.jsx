// client/src/components/layout/DashboardLayout.jsx
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const T = {
  gold: "#C9922A", goldLight: "#E5B253", goldDim: "#7a5718",
  goldBg: "rgba(201,146,42,0.10)",
  ink: "#0f0e0c", ink2: "#2a2823", paper: "#faf8f3",
  muted: "#6b6557", border: "rgba(201,146,42,0.18)",
  white: "#ffffff", red: "#b03a1a", green: "#2e7d52",
  sidebarW: 240, sidebarCollapsed: 68,
};

// ── Nav items ─────────────────────────────────────────────────────────────────
const USER_NAV = [
  { path: "/dashboard",     label: "Dashboard",    icon: "⊞" },
  { path: "/chit-plans",    label: "Chit Plans",   icon: "◈" },
  { path: "/payments",      label: "Payments",     icon: "₹" },
  { path: "/auctions",      label: "Auctions",     icon: "🔨" },
  { path: "/profile", label: "My Profile", icon: "👤" },
  { path: "/notifications", label: "Notifications",icon: "🔔", badge: 3 },
  { path: "/reports", label: "Reports", icon: "📊" },
];

const ADMIN_NAV = [
  { path: "/admin",         label: "Admin Panel",  icon: "⬡" },
];

// ── Single nav link ───────────────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : "0.75rem",
        padding: collapsed ? "0.75rem" : "0.7rem 1rem",
        borderRadius: 10,
        textDecoration: "none",
        fontFamily: "'Sora', sans-serif",
        fontSize: "0.85rem",
        fontWeight: isActive ? 600 : 400,
        color: isActive ? T.gold : T.muted,
        background: isActive ? T.goldBg : "transparent",
        border: `1px solid ${isActive ? T.border : "transparent"}`,
        transition: "all 0.18s ease",
        position: "relative",
        justifyContent: collapsed ? "center" : "flex-start",
        overflow: "hidden",
        whiteSpace: "nowrap",
      })}
      title={collapsed ? item.label : ""}
    >
      <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && item.badge && (
        <span style={{
          background: T.red, color: "#fff",
          fontSize: "0.6rem", fontWeight: 700,
          padding: "2px 6px", borderRadius: 10,
        }}>{item.badge}</span>
      )}
      {collapsed && item.badge && (
        <span style={{
          position: "absolute", top: 6, right: 6,
          width: 8, height: 8, borderRadius: "50%",
          background: T.red,
        }} />
      )}
    </NavLink>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const sidebarWidth = collapsed ? T.sidebarCollapsed : T.sidebarW;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Page title from path
  const pageTitle = () => {
    const map = {
      "/dashboard":     "Dashboard",
      "/chit-plans":    "Chit Plans",
      "/payments":      "Payments",
      "/auctions":      "Live Auctions",
      "/notifications": "Notifications",
      "/admin":         "Admin Panel",
    };
    return map[location.pathname] || "STC";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f0e8",
      fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        .nav-item:hover { color: ${T.gold} !important; background: ${T.goldBg} !important; }
        .collapse-btn:hover { background: ${T.goldBg} !important; }
        .logout-btn:hover { background: #fff4f0 !important; color: ${T.red} !important; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-overlay { display: flex !important; }
          .topbar-menu-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .topbar-menu-btn { display: none !important; }
        }
      `}</style>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar-desktop" style={{
        width: sidebarWidth,
        minHeight: "100vh",
        background: T.white,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 200,
        transition: "width 0.25s cubic-bezier(0.22,1,0.36,1)",
        overflow: "hidden",
        boxShadow: "2px 0 20px rgba(15,14,12,0.06)",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "1.2rem 0" : "1.25rem 1.25rem",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : "0.75rem",
          justifyContent: collapsed ? "center" : "flex-start",
          minHeight: 64,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Serif Display', serif",
            color: "#fff", fontSize: "0.8rem", letterSpacing: "0.05em",
          }}>STC</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: T.ink, whiteSpace: "nowrap" }}>SAI TULASI</div>
              <div style={{ fontSize: "0.62rem", color: T.muted, letterSpacing: "0.05em" }}>Chit Fund</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex",
          flexDirection: "column", gap: "0.25rem", overflowY: "auto" }}>

          {!collapsed && (
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: T.muted, padding: "0 0.5rem",
              marginBottom: "0.4rem" }}>Menu</div>
          )}

          {USER_NAV.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}

          {isAdmin && (
            <>
              {!collapsed && (
                <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: T.muted, padding: "0.75rem 0.5rem 0.4rem",
                  borderTop: `1px solid ${T.border}`, marginTop: "0.5rem" }}>Admin</div>
              )}
              {isAdmin && collapsed && <div style={{ height: 1, background: T.border, margin: "0.5rem 0" }} />}
              {ADMIN_NAV.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
            </>
          )}
        </nav>

        {/* User profile + logout */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.75rem" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.6rem 0.5rem", marginBottom: "0.5rem" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.72rem", fontWeight: 700,
              }}>{initials}</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: T.ink,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 130 }}>{user?.name}</div>
                <div style={{ fontSize: "0.65rem", color: T.muted, textTransform: "capitalize" }}>
                  {user?.role || "member"}
                </div>
              </div>
            </div>
          )}

          <button className="logout-btn" onClick={handleLogout} style={{
            width: "100%", padding: collapsed ? "0.7rem" : "0.6rem 0.75rem",
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 9, cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "0.6rem", fontSize: "0.82rem", color: T.muted,
            fontFamily: "'Sora', sans-serif", transition: "all 0.18s ease",
          }}>
            <span>⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{
          position: "absolute", top: "50%", right: -12,
          transform: "translateY(-50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: T.white, border: `1px solid ${T.border}`,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "0.65rem", color: T.muted,
          boxShadow: "0 2px 8px rgba(15,14,12,0.1)",
          transition: "all 0.18s ease", zIndex: 10,
        }}>
          {collapsed ? "›" : "‹"}
        </button>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(15,14,12,0.5)",
          zIndex: 300, display: "none",
        }} className="mobile-overlay">
          <aside onClick={e => e.stopPropagation()} style={{
            width: T.sidebarW, height: "100%",
            background: T.white, display: "flex", flexDirection: "column",
            animation: "slideIn 0.25s ease",
            borderRight: `1px solid ${T.border}`,
          }}>
            {/* same content as desktop sidebar */}
            <div style={{ padding: "1.25rem", borderBottom: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", gap: "0.75rem", minHeight: 64 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Serif Display', serif", color: "#fff", fontSize: "0.8rem" }}>STC</div>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: T.ink }}>SAI TULASI</div>
                <div style={{ fontSize: "0.62rem", color: T.muted }}>Chit Fund</div>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{
                marginLeft: "auto", background: "none", border: "none",
                fontSize: "1.2rem", cursor: "pointer", color: T.muted,
              }}>✕</button>
            </div>
            <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex",
              flexDirection: "column", gap: "0.25rem" }}>
              {USER_NAV.map(item => (
                <div key={item.path} onClick={() => setMobileOpen(false)}>
                  <NavItem item={item} collapsed={false} />
                </div>
              ))}
              {isAdmin && ADMIN_NAV.map(item => (
                <div key={item.path} onClick={() => setMobileOpen(false)}>
                  <NavItem item={item} collapsed={false} />
                </div>
              ))}
            </nav>
            <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.75rem" }}>
              <button className="logout-btn" onClick={handleLogout} style={{
                width: "100%", padding: "0.6rem 0.75rem",
                background: "transparent", border: `1px solid ${T.border}`,
                borderRadius: 9, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.6rem",
                fontSize: "0.82rem", color: T.muted, fontFamily: "'Sora', sans-serif",
              }}>
                <span>⏻</span><span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="main-content" style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "margin-left 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* ── TOP BAR ── */}
        <header style={{
          height: 64, background: T.white,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center",
          padding: "0 1.5rem", gap: "1rem",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 12px rgba(15,14,12,0.05)",
        }}>
          {/* Mobile hamburger */}
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "1.3rem", color: T.muted, padding: "0.25rem",
            display: "none",
          }}>☰</button>

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif",
              fontSize: "1.25rem", color: T.ink, fontWeight: 400 }}>
              {pageTitle()}
            </div>
            <div style={{ fontSize: "0.68rem", color: T.muted, marginTop: 1 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Notification bell */}
            <div style={{ position: "relative", cursor: "pointer" }}
              onClick={() => navigate("/notifications")}>
              <span style={{ fontSize: "1.15rem" }}>🔔</span>
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: "50%",
                background: T.red, color: "#fff",
                fontSize: "0.58rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>3</span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: T.border }} />

            {/* User chip */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.72rem", fontWeight: 700,
              }}>{initials}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: T.ink }}>{user?.name}</span>
                <span style={{ fontSize: "0.62rem", color: T.muted, textTransform: "capitalize" }}>
                  {user?.role || "member"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto" }}>
          {children}
        </main>

        {/* ── FOOTER ── */}
        <footer style={{
          borderTop: `1px solid ${T.border}`,
          padding: "0.85rem 1.5rem",
          background: T.white,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.7rem", color: T.muted }}>
            © 2026 SAI TULASI Chit Fund · All rights reserved
          </span>
          <span style={{ fontSize: "0.7rem", color: T.muted }}>
            Secured · Real-time · Trusted
          </span>
        </footer>
      </div>
    </div>
  );
}