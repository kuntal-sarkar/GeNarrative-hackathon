import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Authentication storage",
    "text": "Supabase authentication can store tokens and session data in browser storage. Signing out clears the active session; cached data may remain in the browser."
  },
  {
    "heading": "Project cache and sync",
    "text": "TakeGrid caches account-specific project data and pending cloud changes locally so the interface can remain responsive. Clearing site data before pending changes sync can lose local unsynced edits."
  },
  {
    "heading": "Security checks",
    "text": "Cloudflare Turnstile may collect browser and interaction signals to detect automated access. Blocking required scripts or storage can prevent login and verification."
  },
  {
    "heading": "Your choices",
    "text": "Use your browser controls to remove site data or restrict storage. Some features may not work after blocking essential storage. We have not implemented a separate marketing-cookie preference manager in this MVP."
  },
  {
    "heading": "Changes and contact",
    "text": "We may update this disclosure if hosting, analytics or browser storage practices change."
  }
];

export default function CookiesSection() {
  return <PolicyInfo intro={"TakeGrid uses browser storage and related technologies necessary for authentication, project continuity and abuse prevention."} sections={sections} footer="Questions or concerns? Email" />;
}
