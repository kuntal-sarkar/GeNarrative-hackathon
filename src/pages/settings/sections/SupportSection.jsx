import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Bug reports",
    "text": "Include the browser, relevant steps and the error text without exposing authentication tokens or private project content unnecessarily."
  },
  {
    "heading": "Feature feedback",
    "text": "Tell us which workspace feature you used and how it could be improved. We cannot guarantee that requests will be implemented in the MVP."
  },
  {
    "heading": "Privacy and security",
    "text": "For privacy-related or security-sensitive issues, use the same contact email and clearly identify the request as private."
  }
];

export default function SupportSection() {
  return <PolicyInfo intro={"Contact Team Runtime Error for technical help, bug reports and feature feedback."} sections={sections} footer="Questions or concerns? Email" />;
}
