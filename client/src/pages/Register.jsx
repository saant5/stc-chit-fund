// client/src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "",
    email: "", phone: "",
    password: "", confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handle = (e) => { setError(""); setForm({ ...form, [e.target.name]: e.target.value }); };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return "First and last name are required.";
    if (!form.email.includes("@"))                        return "Enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(form.phone))                return "Enter a valid 10-digit Indian mobile number.";
    if (form.password.length < 6)                         return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword)           return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const result = await register({
        name:     `${form.firstName.trim()} ${form.lastName.trim()}`,
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        password: form.password,
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      } else {
        setError(result.message || "Registration failed.");
      }
    } catch {
      setError("Cannot connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-root">
      <div className="auth-bg"><div className="bg-circle c1"/><div className="bg-circle c2"/><div className="bg-circle c3"/></div>
      <div className="auth-card" style={{ textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>✅</div>
        <div className="auth-title" style={{ fontSize:"1.5rem" }}>Welcome to STC!</div>
        <p className="auth-hint" style={{ marginTop:"0.5rem" }}>Account created. Taking you to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="auth-root">
      <div className="auth-bg"><div className="bg-circle c1"/><div className="bg-circle c2"/><div className="bg-circle c3"/></div>
      <div className="auth-card wide">
        <div className="brand">
          <div className="brand-emblem">STC</div>
          <div><div className="brand-name">SAI TULASI</div><div className="brand-sub">Chit Fund · Member Registration</div></div>
        </div>
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-hint">Join STC and start building your financial future.</p>
        {error && <div className="auth-error">⚠ {error}</div>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-row">
            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" type="text" placeholder="Ravi"
                value={form.firstName} onChange={handle} disabled={loading} required />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" type="text" placeholder="Kumar"
                value={form.lastName} onChange={handle} disabled={loading} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" placeholder="ravi@gmail.com"
                value={form.email} onChange={handle} disabled={loading} required />
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile Number</label>
              <input id="phone" name="phone" type="tel" placeholder="9876543210"
                maxLength={10} value={form.phone} onChange={handle} disabled={loading} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={handle} disabled={loading} required />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handle} disabled={loading} required />
            </div>
          </div>
          {/* Password strength */}
          {form.password && (
            <div style={{ marginTop:"-0.5rem" }}>
              <div style={{ height:4, borderRadius:2, background:"#e5e0d6", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:2, transition:"width 0.3s ease",
                  width: form.password.length>=10?"100%":form.password.length>=6?"60%":"30%",
                  background: form.password.length>=10?"#2e7d52":form.password.length>=6?"#C9922A":"#b03a1a" }} />
              </div>
              <div style={{ fontSize:"0.7rem", marginTop:3,
                color: form.password.length>=10?"#2e7d52":form.password.length>=6?"#C9922A":"#b03a1a" }}>
                {form.password.length>=10?"Strong":form.password.length>=6?"Good — add more characters":"Too short"}
              </div>
            </div>
          )}
          {/* Terms */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:"0.6rem", marginTop:"0.25rem" }}>
            <input type="checkbox" id="terms" required disabled={loading}
              style={{ width:16, height:16, marginTop:2, accentColor:"#C9922A", cursor:"pointer", flexShrink:0 }} />
            <label htmlFor="terms" style={{ fontSize:"0.78rem", color:"#6b6557", cursor:"pointer", lineHeight:1.5 }}>
              I agree to the{" "}
              <a href="#" style={{ color:"#C9922A", textDecoration:"none" }}>Terms & Conditions</a>
              {" "}and{" "}
              <a href="#" style={{ color:"#C9922A", textDecoration:"none" }}>Privacy Policy</a>
              {" "}of SAI TULASI Chit Fund.
            </label>
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-loader" /> : "Create Account →"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}