import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Respect others",
    "text": "Do not harass, threaten, impersonate or share another person’s private information without permission."
  },
  {
    "heading": "Respect creators",
    "text": "Upload content you own or are authorized to use. Credit collaborators and respect applicable copyright and licensing requirements."
  },
  {
    "heading": "Report problems",
    "text": "Send relevant details of harmful behavior, misuse or suspected abuse to the support email. Include only information needed to investigate."
  }
];

export default function CommunitySection() {
  return <PolicyInfo intro={"Use TakeGrid to create responsibly and respect the people whose ideas, privacy and work are involved."} sections={sections} footer="Questions or concerns? Email" />;
}
