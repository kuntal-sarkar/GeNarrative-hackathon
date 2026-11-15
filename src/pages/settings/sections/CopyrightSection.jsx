import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Your work",
    "text": "You retain whatever rights you already hold in stories, characters, scripts and other material you submit. You are responsible for ensuring you have permission to upload or process it."
  },
  {
    "heading": "AI-assisted outputs",
    "text": "AI-generated content may resemble existing work; TakeGrid cannot guarantee originality or that a generated output qualifies for copyright protection. Review before publishing or commercial use."
  },
  {
    "heading": "Platform materials",
    "text": "TakeGrid branding, interface and original application code belong to their respective creators or licensors. Open-source and third-party software retain their own license terms."
  },
  {
    "heading": "Report a concern",
    "text": "For an infringement or attribution concern, contact us with the affected material, why you believe rights are infringed and a way to reach you. We will review reports; we do not promise a fixed resolution time."
  }
];

export default function CopyrightSection() {
  return <PolicyInfo intro={"TakeGrid is a creative workspace; these terms distinguish your submitted material from the platform and its third-party tools."} sections={sections} footer="Questions or concerns? Email" />;
}
