import { MessageCircle, LockKeyhole } from "lucide-react";
import "./HomeAssistant.css";

export default function HomeAssistant() {
  return <section className="home-assistant-section">
    <div className="assistant-panel">
      <div className="assistant-panel-header"><div className="assistant-title-group"><span className="assistant-icon"><MessageCircle size={24}/></span><div><span className="assistant-kicker">PROJECT ASSISTANT</span><h2>Discuss your projects.</h2></div></div></div>
      <p className="assistant-intro">Ask about project progress, scene details, and next steps after connecting the Flask and Gemini backend.</p>
      <div className="assistant-input-form" aria-label="Assistant unavailable until backend integration">
        <input disabled type="text" placeholder="Chat available after AI integration" aria-label="Project assistant (not connected)" />
        <span className="assistant-unavailable-icon" aria-hidden="true"><LockKeyhole size={18}/></span>
      </div>
      <p className="assistant-connection-status">Backend not connected · No messages are generated or sent.</p>
    </div>
  </section>;
}
