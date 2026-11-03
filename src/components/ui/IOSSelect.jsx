import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import "./IOSSelect.css";

// Controlled select with the same value/onChange shape as a native <select>.
// Responsive listbox: popover on desktop, bottom sheet on phones.
export default function IOSSelect({ value, onChange, children, className = "", disabled = false, "aria-label": ariaLabel }) {
  const labelText = value => Array.isArray(value) ? value.map(labelText).join("") : (value == null || typeof value === "boolean") ? "" : String(value);
  const options = Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return [];
    if (child.type === "option") return [child];
    return Children.toArray(child.props.children).filter(el => isValidElement(el) && el.type === "option");
  }).map(el => ({value: String(el.props.value ?? el.props.children ?? ""), label: labelText(el.props.children ?? el.props.value ?? ""), disabled: !!el.props.disabled}));
  const selected = options.find(o => o.value === String(value ?? "")) || options[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) { if (!rootRef.current?.contains(e.target)) setOpen(false); }
    function onEscape(e) { if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {document.removeEventListener("pointerdown",onPointerDown);document.removeEventListener("keydown",onEscape);};
  }, [open]);
  function choose(option) {if (option.disabled) return; onChange?.({target:{value:option.value}});setOpen(false);triggerRef.current?.focus();}
  function keyboard(e) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {e.preventDefault();setOpen(v=>!v);return;}
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (!open) {setOpen(true);return;}
      const enabled = options.filter(o=>!o.disabled);
      const current = enabled.findIndex(o=>o.value===String(value));
      const next = e.key === "Home" ? 0 : e.key === "End" ? enabled.length-1 : (current+(e.key === "ArrowDown" ? 1 : -1)+enabled.length)%enabled.length;
      if(enabled[next]) choose(enabled[next]);
    }
  }
  return <span ref={rootRef} className={`ios-select ${className}`}>
    <button ref={triggerRef} type="button" className="ios-select-trigger" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?id:undefined} aria-label={ariaLabel || undefined} onKeyDown={keyboard} onClick={(e)=>{e.preventDefault();e.stopPropagation();setOpen(v=>!v);}}>
      <span>{selected?.label || "Choose option"}</span><ChevronDown size={17} className={open?"rotated":""}/>
    </button>
    {open && <><span className="ios-select-scrim" onClick={()=>setOpen(false)} aria-hidden="true"/><span className="ios-select-panel"><span className="ios-select-mobile-head"><b>Choose an option</b><button type="button" aria-label="Close options" onClick={()=>setOpen(false)}><X size={20}/></button></span><span role="listbox" id={id} aria-label={ariaLabel || "Options"} ref={listRef} className="ios-select-options">{options.map(option=><button type="button" key={option.value} role="option" aria-selected={option.value===String(value)} disabled={option.disabled} onClick={()=>choose(option)} className={option.value===String(value)?"selected":""}>{option.label}{option.value===String(value)&&<Check size={17}/>}</button>)}</span></span></>}
  </span>;
}
