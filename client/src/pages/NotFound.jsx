import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:"Sora, sans-serif" }}>
      <h1 style={{ fontSize:"4rem", color:"#C9922A" }}>404</h1>
      <p style={{ color:"#6b6557", margin:"0.5rem 0 1.5rem" }}>Page not found.</p>
      <Link to="/dashboard" style={{ color:"#C9922A", fontWeight:500 }}>Go to Dashboard</Link>
    </div>
  );
}