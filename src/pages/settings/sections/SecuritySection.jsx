import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Accounts and authentication",
    "text": "Authentication and account recovery use Supabase. Some forms use Cloudflare Turnstile; API access checks and rate limits are applied to selected backend routes."
  },
  {
    "heading": "Projects and images",
    "text": "Cloud projects are associated with an authenticated account. New locally stored storyboard frames have owner-based access checks; project-level image permissions and durable cloud image storage still need further work."
  },
  {
    "heading": "Device and browser storage",
    "text": "Local account-specific caches may contain creative project data and unsynced changes. Use a trusted device and avoid clearing browser storage while updates are queued."
  },
  {
    "heading": "Incident reporting",
    "text": "If you find a security issue, do not access other users’ data or publish credentials. Send a description and reproduction steps privately to the support email."
  },
  {
    "heading": "Limitations",
    "text": "No online service is completely secure. The MVP has not undergone an independent security certification; production hosting and shared rate limiting require separate review."
  }
];

export default function SecuritySection() {
  return <PolicyInfo intro={"TakeGrid uses account-scoped project access and basic abuse controls. This page describes the MVP’s current protections and remaining limits."} sections={sections} footer="Questions or concerns? Email" />;
}
