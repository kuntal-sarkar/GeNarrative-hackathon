
import { Settings as SettingsIcon } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";

export default function Settings() {
  return (
    <section style={{ maxWidth: 700 }}>
      <p style={{
        fontSize: 12,
        fontWeight: 700,
        color: "var(--color-coral)",
        letterSpacing: 1.5
      }}>
        PREFERENCES
      </p>

      <h1 style={{
        fontSize: "clamp(30px, 4vw, 46px)",
        marginTop: 12
      }}>
        Settings
      </h1>

      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--color-navy)",
        borderRadius: 20,
        padding: 24,
        marginTop: 30
      }}>
        <SettingsIcon size={26} />

        <h2 style={{ marginTop: 15, fontSize: 21 }}>
          Workspace Preferences
        </h2>

        <p style={{ marginTop: 10, lineHeight: 1.7 }}>
          Language preferences, account settings and
          project defaults will be available here.
        </p>

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.65 }}>
          {APP_CONFIG.shortName} — Frontend preview
        </p>
      </div>
    </section>
  );
}
