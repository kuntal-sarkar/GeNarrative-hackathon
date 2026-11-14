import { CircleUserRound, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../pages/Login.css";
import { APP_CONFIG } from "../../config/app.config";
import GlobalSearch from "../search/GlobalSearch";
import "./Header.css";

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  async function handleSignOut() {
    try { await signOut(); navigate("/", { replace: true }); }
    catch (err) { window.alert(err?.message || "Could not sign out."); }
  }
  return (
    <header className="app-header">
      <Link to="/" className="app-brand">
        <img className="app-brand-logo" src="/takegrid-logo.png" alt="TAKEGRID logo" width={42} height={42} />
        <span className="app-brand-name">
          {APP_CONFIG.shortName}
        </span>
      </Link>

      <div className="app-header-actions">
        <GlobalSearch />
        {!loading && (user ? (
          <div className="tg-header-auth">
            <span className="tg-header-user" title={user.email || "Signed in"}>{user.email || "Signed in"}</span>
            <button type="button" className="tg-header-logout" onClick={handleSignOut} aria-label="Sign out"><LogOut size={17}/> <span>Logout</span></button>
          </div>
        ) : <Link className="tg-header-signin" to="/login" aria-label="Sign in to TAKEGRID"><CircleUserRound size={17}/> <span>Sign in</span></Link>)}
      </div>
    </header>
  );
}