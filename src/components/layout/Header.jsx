import { CircleUserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config";
import GlobalSearch from "../search/GlobalSearch";
import "./Header.css";

export default function Header() {
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
        <button
        className="profile-button"
        type="button"
        aria-label="Profile (coming soon)"
        disabled
      >
        <CircleUserRound size={25} />
        </button>
      </div>
    </header>
  );
}