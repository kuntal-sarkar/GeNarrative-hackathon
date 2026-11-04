import { ArrowUpRight, House, MoveUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

function LostFramesIllustration() {
  return (
    <svg className="ff404-art" viewBox="0 0 650 560" fill="none" role="img" aria-labelledby="ff404-art-title">
      <title id="ff404-art-title">An imaginative illustration of a lost story frame finding its way home</title>
      <defs>
        <linearGradient id="ff404-screen" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFFFF"/><stop offset="1" stopColor="#F2F7FF"/></linearGradient>
        <linearGradient id="ff404-coral" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FF8D75"/><stop offset="1" stopColor="#FF6B5B"/></linearGradient>
        <filter id="ff404-shadow" x="-30%" y="-35%" width="170%" height="190%"><feDropShadow dx="0" dy="20" stdDeviation="19" floodColor="#172A46" floodOpacity=".12"/></filter>
      </defs>
      <path d="M102 164C143 89 250 65 336 94c87 29 137 4 202 70 83 84 55 234-38 302-87 63-256 61-342-6C67 387 45 270 102 164Z" fill="#FCE9DC"/>
      <circle cx="503" cy="107" r="49" fill="#E6F1FF"/><circle cx="91" cy="393" r="35" fill="#DDEAFF"/>
      <path className="ff404-dash" d="M86 323c68 17 81 89 160 93 82 5 90-96 174-104 65-7 90 39 140-5" stroke="#98A9C4" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 14"/>
      <g className="ff404-float-a" transform="translate(86 122) rotate(-13 64 55)">
        <rect width="130" height="110" rx="20" fill="#FFF" stroke="#E1EAF4" strokeWidth="3"/>
        <rect x="14" y="14" width="102" height="66" rx="11" fill="#D9E9FF"/>
        <circle cx="89" cy="34" r="9" fill="#FFBC9F"/>
        <path d="m25 71 27-30 21 18 15-13 23 25H25Z" fill="#83AEDF"/>
        <rect x="17" y="92" width="54" height="5" rx="2.5" fill="#CAD9E8"/>
      </g>
      <g className="ff404-float-b" transform="translate(427 68) rotate(13 54 47)">
        <rect width="111" height="95" rx="19" fill="#FFF" stroke="#E1EAF4" strokeWidth="3"/>
        <rect x="13" y="13" width="85" height="53" rx="9" fill="#FFF0E8"/>
        <path d="m27 53 19-23 16 17 13-11 13 17" stroke="#FF957B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="17" y="78" width="40" height="5" rx="2.5" fill="#E2D7D0"/>
      </g>
      <g filter="url(#ff404-shadow)" transform="rotate(-7 328 276)">
        <rect x="174" y="146" width="312" height="264" rx="29" fill="url(#ff404-screen)" stroke="#172A46" strokeWidth="8"/>
        <path d="M174 176c0-17 13-30 30-30h252c17 0 30 13 30 30v27H174v-27Z" fill="#172A46"/>
        <path d="m213 147-22 56m96-56-22 56m96-56-22 56m96-56-22 56" stroke="#FFF4DC" strokeWidth="18" opacity=".92"/>
        <rect x="204" y="228" width="251" height="152" rx="19" fill="#EAF3FE"/>
        <circle cx="400" cy="263" r="17" fill="#FFD8C6"/>
        <path d="m221 355 63-78 47 50 45-39 62 67H221Z" fill="#98BBE3"/>
        <path d="m221 355 63-78 47 50 33-29 74 57H221Z" fill="#6A9CD7" opacity=".55"/>
        <g transform="translate(314 291)"><circle r="46" fill="#FFF"/><circle r="33" fill="#FF6B5B"/><path d="M0-13v16" stroke="#FFF" strokeWidth="7" strokeLinecap="round"/><circle cy="17" r="4" fill="#FFF"/></g>
      </g>
      <g className="ff404-float-c" transform="translate(452 383) rotate(9 58 51)">
        <rect width="117" height="103" rx="20" fill="#172A46"/>
        <rect x="13" y="13" width="91" height="77" rx="12" stroke="#90B7E7" strokeWidth="2" strokeDasharray="6 7"/>
        <path d="m38 55 15 15 28-31" stroke="#FFF4DC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g className="ff404-float-d" transform="translate(76 400) rotate(-15 59 47)">
        <rect width="117" height="94" rx="19" fill="#FFF" stroke="#E3EBF2" strokeWidth="3"/>
        <path d="m27 36 27-14 35 27-29 23-33-36Z" fill="#FF6B5B"/>
        <path d="m54 22 6 50 29-23" fill="#FFAB92"/>
        <path d="m27 36 33 36" stroke="#FFF" strokeOpacity=".65" strokeWidth="3"/>
      </g>
      <g className="ff404-spark"><path d="m542 227 19-17m-1 40 27 2m-65-49 1-27" stroke="#FF6B5B" strokeWidth="7" strokeLinecap="round"/></g>
      <g opacity=".9"><path d="m124 89 9-18m12 27 20-6" stroke="#1B93F5" strokeWidth="6" strokeLinecap="round"/><circle cx="564" cy="368" r="6" fill="#1B93F5"/><circle cx="110" cy="255" r="5" fill="#FF6B5B"/></g>
    </svg>
  );
}

export default function NotFound() {
  const navigate = useNavigate();


  return (
    <section className="ff404" aria-labelledby="ff404-title">
      <div className="ff404-glow ff404-glow--top" aria-hidden="true" />
      <div className="ff404-glow ff404-glow--bottom" aria-hidden="true" />
      <div className="ff404-inner">
        <div className="ff404-copy">
          <span className="ff404-eyebrow"><span className="ff404-dot" /> LOST IN THE STORY?</span>
          <div className="ff404-number" aria-label="Error 404">4<span>0</span>4<span className="ff404-number-period">.</span></div>
          <h1 id="ff404-title">A little detour <em>off-script.</em></h1>
          <p>That scene isn’t in this story. Your projects are safe — let’s head back to the creative side.</p>
          <div className="ff404-actions">
            <button type="button" className="ff404-home" onClick={() => navigate("/")}><House size={18} strokeWidth={2.2}/> Back to Home <ArrowUpRight size={17}/></button>
          </div>
          <div className="ff404-footer"><span className="ff404-footer-line"/> ERROR 404 <span className="ff404-footer-divider">/</span> FRAME NOT FOUND <MoveUpRight size={14}/></div>
        </div>
        <div className="ff404-visual"><LostFramesIllustration/><span className="ff404-visual-label">YOUR STORY IS STILL HERE</span></div>
      </div>
    </section>
  );
}
