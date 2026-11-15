import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CircleUserRound, LogOut, Settings, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../pages/Login.css";
import { APP_CONFIG } from "../../config/app.config";
import GlobalSearch from "../search/GlobalSearch";
import "./Header.css";

function displayName(user) {
  const meta = user?.user_metadata || {};
  const name = meta.full_name || meta.name || meta.display_name || "";
  return typeof name === "string" && name.trim() ? name.trim() : (user?.email?.split("@")[0] || "TakeGrid creator");
}

function avatarUrl(user) {
  const meta = user?.user_metadata || {};
  const photo = meta.avatar_url || meta.picture || "";
  if (typeof photo !== "string") return "";
  try {
    const url = new URL(photo);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const menuRef = useRef(null);
  const avatar = avatarUrl(user);
  const name = displayName(user);
  const initial = (name[0] || "?").toUpperCase();

  useEffect(() => { setMenuOpen(false); setConfirmOpen(false); setImageFailed(false); }, [user?.id]);
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event) { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); }
    function onKey(event) { if (event.key === "Escape") setMenuOpen(false); }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);
  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(event) { if (event.key === "Escape" && !signingOut) setConfirmOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen, signingOut]);

  async function confirmSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
      setConfirmOpen(false);
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      setSignOutError(err?.message || "Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  function profileAvatar(extraClass = "") {
    return <span className={`tg-profile-avatar ${extraClass}`} aria-hidden="true">
      {avatar && !imageFailed ? <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <span>{initial}</span>}
    </span>;
  }

  return <>
    {/* TAKEGRID_HEADER_CREATOR_NAME_V1 — replaces TAKE / 01 with signed-in user name. */}
    {!loading && <span className="tg-header-creator-name" title={user ? name : "Guest"}>{user ? name : "Guest"}</span>}
    <header className="app-header">
      <Link to="/" className="app-brand">
        <img className="app-brand-logo" src="/takegrid-logo.png" alt="TAKEGRID logo" width={42} height={42} />
        <span className="app-brand-name">{APP_CONFIG.shortName}</span>
      </Link>
      <div className="app-header-actions">
        <GlobalSearch />
        {!loading && (user ? (
          <div className="tg-profile-wrap" ref={menuRef}>
            <button type="button" className={`tg-profile-trigger ${menuOpen ? "is-active" : ""}`} onClick={() => setMenuOpen(v => !v)} aria-label="Account menu" aria-expanded={menuOpen} aria-haspopup="menu">
              {profileAvatar()}
              <ChevronDown size={15} className="tg-profile-chevron" />
            </button>
            {menuOpen && <div className="tg-profile-menu" role="menu" aria-label="Account details">
              <div className="tg-profile-menu-user">
                {profileAvatar("tg-profile-avatar-large")}
                <div className="tg-profile-menu-identity"><strong title={name}>{name}</strong><span title={user.email || ""}>{user.email || "Signed in"}</span></div>
              </div>
              <div className="tg-profile-menu-separator" />
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/settings"); }}><Settings size={17} /> Account settings</button>
              <button type="button" role="menuitem" className="tg-profile-logout-action" onClick={() => { setMenuOpen(false); setSignOutError(""); setConfirmOpen(true); }}><LogOut size={17} /> Log out</button>
            </div>}
          </div>
        ) : <Link className="tg-header-signin" to="/login" aria-label="Sign in to TakeGrid"><CircleUserRound size={17} /><span>Sign In</span></Link>)}
      </div>
    </header>
    {confirmOpen && createPortal(
      <div className="tg-signout-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !signingOut) setConfirmOpen(false); }}>
        <section className="tg-signout-dialog" role="dialog" aria-modal="true" aria-labelledby="tg-signout-title" aria-describedby="tg-signout-description">
          <button type="button" className="tg-signout-close" aria-label="Cancel logout" disabled={signingOut} onClick={() => setConfirmOpen(false)}><X size={19}/></button>
          <span className="tg-signout-icon"><LogOut size={22}/></span>
          <h2 id="tg-signout-title">Log out of TakeGrid?</h2>
          <p id="tg-signout-description">You'll return to the home page. Sign in again whenever you're ready to create.</p>
          {signOutError && <p className="tg-signout-error" role="alert">{signOutError}</p>}
          <div className="tg-signout-actions">
            <button type="button" className="tg-signout-cancel" disabled={signingOut} onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button type="button" className="tg-signout-confirm" disabled={signingOut} onClick={confirmSignOut}>{signingOut ? "Signing out…" : "Yes, log out"}</button>
          </div>
        </section>
      </div>, document.body
    )}
  </>;
}
