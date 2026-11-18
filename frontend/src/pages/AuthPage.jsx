import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ initialMode = "login" }) {
  const [mode,setMode] = useState(initialMode);
  const [role,setRole] = useState("customer");
  const [fullName,setFullName] = useState("");
  const [email,setEmail] = useState("");
  const [phone,setPhone] = useState("");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = mode === "register"
        ? await register({ full_name:fullName, email, phone, password, role })
        : await login(email,password);
      const intended = location.state?.from?.pathname;
      const destination = intended || (user.role === "customer" ? "/home" : user.role === "provider" ? "/provider/bookings" : "/admin");
      navigate(destination,{replace:true});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-story">
        <div className="eyebrow">Welcome to Khidma</div>
        <h1>Everyday help,<br/>closer to home.</h1>
        <p>Discover trusted local services or manage your service business across Cairo.</p>
        <div className="auth-photo" role="img" aria-label="Bright, welcoming home interior" />
        <div className="auth-highlights"><span>✓ Local providers</span><span>✓ Simple booking</span><span>✓ Clear updates</span></div>
      </section>
      <form className="panel auth-card" onSubmit={submit}>
        <div className="mode-switch">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={()=>{setMode("login");setError("");}}>Sign in</button>
          <button type="button" className={mode === "register" ? "selected" : ""} onClick={()=>{setMode("register");setError("");}}>Create account</button>
        </div>
        <div className="eyebrow">{mode === "login" ? "Welcome back" : "Get started"}</div>
        <h2>{mode === "login" ? "Sign in to Khidma" : "Create your account"}</h2>
        <p className="muted">{mode === "login" ? "Enter your details to continue." : "Choose how you will use Khidma."}</p>
        {mode === "register" && <>
          <div className="role-selector">
            <button type="button" className={role==="customer"?"role-option chosen": "role-option"} onClick={()=>setRole("customer")}><b>Book services</b><small>I'm looking for help</small></button>
            <button type="button" className={role==="provider"?"role-option chosen": "role-option"} onClick={()=>setRole("provider")}><b>Offer services</b><small>I provide local services</small></button>
          </div>
          <div className="field"><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" minLength="2" maxLength="150" required /></div>
          <div className="field"><label>Phone (optional)</label><input value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" maxLength="30" /></div>
        </>}
        <div className="field"><label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength="255" required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="register"?10:1} maxLength="128" required />{mode==="register" && <small>Use at least 10 characters.</small>}</div>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button className="btn full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        {mode === "login" && <p className="form-foot">New to Khidma? <button type="button" className="text-button" onClick={()=>setMode("register")}>Create an account</button></p>}
        <p className="tiny-note">Admin access is provisioned separately. Public sign-up is for customers and providers.</p>
        <Link to="/about" className="back-link">Learn about Khidma</Link>
      </form>
    </div>
  );
}