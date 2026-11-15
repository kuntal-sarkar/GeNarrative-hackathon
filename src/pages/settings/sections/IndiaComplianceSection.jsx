import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Privacy and consent",
    "text": "The Privacy Policy describes account data, creative content, AI services and contact options. We will review applicable Indian privacy requirements as the service expands."
  },
  {
    "heading": "Requests and concerns",
    "text": "You can ask about access, correction, deletion or security issues by contacting the published support address. Requests may need identity verification and may be subject to technical or legal limits."
  },
  {
    "heading": "Policy updates",
    "text": "Regulatory requirements and their commencement dates may change. We will revise these disclosures as features, jurisdictions and legal obligations develop."
  }
];

export default function IndiaComplianceSection() {
  return <PolicyInfo intro={"TakeGrid is developed by Team Runtime Error. This page summarizes our approach to applicable requirements; it is not a claim of formal regulatory certification."} sections={sections} footer="Questions or concerns? Email" />;
}
