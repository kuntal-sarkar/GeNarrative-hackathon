import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "What to include",
    "text": "Describe the problem, the affected feature or project, when it occurred and how to contact you. Never include passwords, OTPs, access tokens or private credentials."
  },
  {
    "heading": "What happens next",
    "text": "The team will review reports and may ask for more information. We do not currently publish a guaranteed response or resolution time."
  },
  {
    "heading": "Account and data requests",
    "text": "For deletion or data access requests, specify the email associated with your TakeGrid account. We may verify ownership before taking action."
  }
];

export default function GrievanceSection() {
  return <PolicyInfo intro={"Use the contact address below to report privacy, intellectual-property, safety or service concerns."} sections={sections} footer="Questions or concerns? Email" />;
}
