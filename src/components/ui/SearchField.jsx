import { Search, X } from "lucide-react";
import "./SearchField.css";

export default function SearchField({ id, className = "", label = "Search", placeholder = "Search...", value = "", onChange, disabled = false }) {
  const text = String(value ?? "");
  return (
    <div className={`ff-modern-search ${className}`.trim()} role="search">
      <Search className="ff-modern-search__icon" aria-hidden="true" size={19} />
      <input id={id} className="ff-modern-search__input" type="search" aria-label={label}
        autoComplete="off" placeholder={placeholder} value={text} disabled={disabled}
        onChange={e => onChange(e.target.value)} />
      {text && !disabled ? <button type="button" className="ff-modern-search__clear"
        aria-label={`Clear ${label.toLowerCase()}`} onClick={() => onChange("")}><X size={15}/></button> : null}
    </div>
  );
}
