import { BookOpen, FileText, PenLine, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./QuickStart.css";

const options = [
 {id:"ai",title:"Create with AI",description:"Write your idea now; AI generation unlocks when the backend is ready.",icon:BookOpen,color:"blue",tag:"STORY IDEA"},
 {id:"script",title:"Use My Script",description:"Paste or import your own story and organize its scenes.",icon:FileText,color:"orange",tag:"EXISTING WORK"},
 {id:"blank",title:"Start from Scratch",description:"A clean editor for a story only you can tell.",icon:PenLine,color:"coral",tag:"WRITE YOURSELF"}
];
export default function QuickStart() {
 const navigate = useNavigate();
 function start(mode) { navigate("/studio", { state: { newMode: mode } }); }
 return <section className="quick-start-section">
  <div className="home-section-heading"><div><span className="section-eyebrow">LET'S BEGIN</span><h2>How would you like to start?</h2></div></div>
  <div className="quick-start-grid">{options.map(({id,title,description,icon:Icon,color,tag}) =>
    <button type="button" key={id} className={`quick-start-card quick-${color}`} onClick={() => start(id)}>
      <div className="quick-start-card-top"><span className="quick-start-icon"><Icon size={25}/></span><ArrowUpRight size={20}/></div>
      <div><span className="quick-start-tag">{tag}</span><h3>{title}</h3><p>{description}</p></div>
    </button>
  )}</div>
 </section>;
}
