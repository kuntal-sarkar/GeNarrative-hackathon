import { FilePenLine, Info } from "lucide-react";

export default function SectionPlaceholder({ title, description }) {
  return <div className="ff-settings-placeholder">
    <span className="ff-settings-placeholder-icon"><FilePenLine size={25}/></span>
    <h2>{title}</h2>
    <p>{description}</p>
    <div className="ff-settings-pending"><Info size={17}/><span>This section is reserved for the final verified content. Nothing here is published as legal advice or an official policy yet.</span></div>
  </div>;
}
