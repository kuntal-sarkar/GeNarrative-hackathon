import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Service stage",
    "text": "Features, quotas and availability may change as the team improves or deploys the product. Some capabilities rely on third-party services."
  },
  {
    "heading": "No purchases at present",
    "text": "This settings page does not offer subscriptions or payment processing. Any future pricing or commercial terms must be described separately before launch."
  },
  {
    "heading": "Contact",
    "text": "For operational or policy questions, use the published support mailbox."
  }
];

export default function CompanyPolicySection() {
  return <PolicyInfo intro={"TakeGrid is a hackathon-era MVP developed by Team Runtime Error, not a guarantee of uninterrupted commercial service."} sections={sections} footer="Questions or concerns? Email" />;
}
