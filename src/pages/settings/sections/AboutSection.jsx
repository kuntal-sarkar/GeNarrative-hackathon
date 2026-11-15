import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Creative workflow",
    "text": "Bring stories, characters, scenes, shots, storyboards and project intentions into one workspace."
  },
  {
    "heading": "Human-led AI",
    "text": "Creative Critics, continuity checks and AI writing tools help creators explore options while keeping editorial decisions in human hands."
  },
  {
    "heading": "Current stage",
    "text": "TakeGrid is an MVP undergoing ongoing testing, deployment and reliability improvements."
  }
];

export default function AboutSection() {
  return <PolicyInfo intro={"TakeGrid is an AI-assisted creative workspace built by Team Runtime Error for the GeNarrative hackathon."} sections={sections} footer="Questions or concerns? Email" />;
}
