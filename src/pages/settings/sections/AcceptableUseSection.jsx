import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Prohibited conduct",
    "text": "Do not attempt unauthorized account access, scrape other users’ content, distribute malware, exploit vulnerabilities, circumvent rate limits or disrupt the service."
  },
  {
    "heading": "Content responsibilities",
    "text": "Do not upload unlawful material, material that infringes third-party rights or sensitive personal information you are not authorized to process."
  },
  {
    "heading": "Abuse response",
    "text": "We may limit requests, restrict access or investigate reports to protect accounts and the platform, subject to applicable law."
  }
];

export default function AcceptableUseSection() {
  return <PolicyInfo intro={"TakeGrid is intended for legitimate creative collaboration, planning and AI assistance."} sections={sections} footer="Questions or concerns? Email" />;
}
