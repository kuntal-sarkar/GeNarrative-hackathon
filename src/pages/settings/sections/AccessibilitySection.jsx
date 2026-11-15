import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Browser controls",
    "text": "Use browser zoom and operating-system accessibility preferences as needed. Some complex creative interfaces may have limitations."
  },
  {
    "heading": "Report an accessibility problem",
    "text": "Describe the screen, browser, assistive tool (if relevant) and difficulty encountered. We welcome reports and cannot promise a fixed repair date."
  }
];

export default function AccessibilitySection() {
  return <PolicyInfo intro={"TakeGrid aims to support keyboard and assistive-technology users, but full accessibility testing is still in progress."} sections={sections} footer="Questions or concerns? Email" />;
}
