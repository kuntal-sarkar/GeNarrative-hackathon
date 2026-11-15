import { Link } from "react-router-dom";
import PrivacySection from "./settings/sections/PrivacySection";
import TermsSection from "./settings/sections/TermsSection";
import "./settings/LegalContent.css";

/** Public routes reuse exactly the same content as the existing Settings sections. */
export default function PublicLegalPage({ kind }) {
  const privacy = kind === "privacy";
  return <main className="tg-legal-public">
    <div className="tg-legal-public-inner">
      <header className="tg-legal-public-head">
        <Link to="/">← TakeGrid Home</Link>
        <h1>{privacy ? "Privacy Policy" : "Terms & Conditions"}</h1>
      </header>
      {privacy ? <PrivacySection /> : <TermsSection />}
      <nav aria-label="Legal pages" className="tg-public-legal-footer">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms & Conditions</Link>
      </nav>
    </div>
  </main>;
}
