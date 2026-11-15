import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "AI accuracy",
    "text": "AI responses can be inaccurate, incomplete, biased, inconsistent or unsuitable for a given project. Creative Critics, scene breakdowns, continuity suggestions and image results are not professional advice."
  },
  {
    "heading": "Creator decisions",
    "text": "You decide whether to apply, edit or reject generated material. Verify facts, rights, sensitive details and practical suitability before sharing or producing content."
  },
  {
    "heading": "Service availability",
    "text": "Network connectivity, external AI quotas, authentication providers and hosting resources can interrupt features. Changes may not persist until cloud sync completes."
  },
  {
    "heading": "Storyboard limitations",
    "text": "In this MVP, some storyboard images rely on server-local storage and may not survive server replacement. Project JSON exports do not include those binary image files."
  },
  {
    "heading": "No warranty of outcome",
    "text": "We do not guarantee project success, commercial suitability, uninterrupted service or permanent access to every asset. Applicable statutory rights remain unaffected."
  }
];

export default function DisclaimerSection() {
  return <PolicyInfo intro={"TakeGrid is an evolving MVP for creative planning and AI-assisted storytelling; AI-generated suggestions require human review."} sections={sections} footer="Questions or concerns? Email" />;
}
