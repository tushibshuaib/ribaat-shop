import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function Login() {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && user && !isAdmin) {
    return (
      <div className="login-wrap">
        <div className="card">
          <h2>No admin access</h2>
          <p className="muted">You are signed in, but this account is not an administrator.</p>
          <button type="button" className="btn btn-block" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="card" onSubmit={submit}>
        <h2>{settings.store_name} Admin</h2>
        <label className="field"><span>Email</span>
          <input className="input" type="email" value={email} autoComplete="username"
            onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field"><span>Password</span>
          <input className="input" type="password" value={password} autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ textAlign: "center", marginTop: 14 }}><Link to="/">← Back to store</Link></p>
      </form>
    </div>
  );
}
