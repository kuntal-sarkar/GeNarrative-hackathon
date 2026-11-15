import { useMemo } from "react";
import packageInfo from "../../../../package.json";
import "../LegalContent.css";

export default function VersionSection() {
  const version = import.meta.env.VITE_APP_VERSION || packageInfo.version;
  const display = version && version !== "0.0.0" ? `v${version.replace(/^v/, "")}` : "MVP development build";
  const built = useMemo(() => import.meta.env.MODE === "production" ? "Production build" : "Development build", []);
  return <article className="tg-legal-content">
    <p className="tg-legal-date">TakeGrid · Release information</p>
    <section><h2>Application version</h2><p><strong>{display}</strong> · {built}</p><p>Package version: {packageInfo.version}. Set VITE_APP_VERSION at build time if a separate release label is used.</p></section>
    <section><h2>Current release</h2><p>TakeGrid MVP includes cloud-synced projects, creative planning features, account login and recovery, project chat, AI assistance, and storyboard tools. Availability may vary with external AI services and server configuration.</p></section>
    <section><h2>Release notes and support</h2><p>Version history is tracked through the project repository and team release process. For bugs, use the Support & Feedback section or <a href="mailto:takegridai@gmail.com">takegridai@gmail.com</a>.</p></section>
  </article>;
}
