import { CircleUserRound, Clapperboard } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config";
import "./Header.css";

export default function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-brand">
        <span className="app-brand-icon">
          <Clapperboard size={22} />
        </span>
        <span className="app-brand-name">
          {APP_CONFIG.shortName}
        </span>
      </Link>

      <button
        className="profile-button"
        type="button"
        aria-label="Profile (coming soon)"
        disabled
      >
        <CircleUserRound size={25} />
      </button>
    </header>
  );
}