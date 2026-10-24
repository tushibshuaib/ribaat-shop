import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

export default function RequireAdmin({ children }) {
  const { loading, user, isAdmin, signOut } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/admin/login" replace />;

  if (!isAdmin) {
    return (
      <div className="login-wrap">
        <div className="card">
          <h2>No admin access</h2>
          <p className="muted">This account is not an administrator.</p>
          <button type="button" className="btn btn-block" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return children;
}
