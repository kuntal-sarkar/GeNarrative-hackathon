import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Where are projects saved?",
    "text": "Signed-in project records sync to Supabase and may be temporarily cached in your browser. An unsynced change can remain local until retried."
  },
  {
    "heading": "Does the export include storyboard images?",
    "text": "No. The project JSON export covers project records and metadata, not binary storyboard images stored on the Flask server."
  },
  {
    "heading": "Can I delete my account from Settings?",
    "text": "Self-service account deletion is not verified in the current MVP. Email the support address with a deletion request; identity verification may be required."
  },
  {
    "heading": "Does Google Login give access to my Gmail?",
    "text": "TakeGrid’s Google sign-in uses basic authentication profile information. It does not request Gmail or Drive scopes for sign-in."
  },
  {
    "heading": "Why might CAPTCHA fail?",
    "text": "Some browser extensions or privacy blockers interfere with Turnstile. Try allowing the TakeGrid site while keeping your browser security settings otherwise intact."
  }
];

export default function FaqSection() {
  return <PolicyInfo intro={"Quick answers about TakeGrid accounts, creative data and AI tools."} sections={sections} footer="Questions or concerns? Email" />;
}
