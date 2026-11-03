import { Search, X } from "lucide-react";
import "./SearchField.css";
import "./SearchReset.css";
export default function SearchField({value="",onChange,placeholder="Search...",className="",id,label}){
 return <div className={`ff-modern-search ff-google-search ${className}`} role="search" aria-label={label||"Search"}>
  <Search className="ff-modern-search__icon" size={19} aria-hidden="true"/>
  <input className="ff-modern-search__input" id={id} type="search" autoComplete="off" aria-label={label||placeholder} placeholder={placeholder} value={value} onChange={e=>onChange?.(e.target.value)}/>
  {Boolean(value) && <button className="ff-modern-search__clear" type="button" onClick={()=>onChange?.("")} aria-label="Clear search"><X size={15}/></button>}
 </div>;
}
