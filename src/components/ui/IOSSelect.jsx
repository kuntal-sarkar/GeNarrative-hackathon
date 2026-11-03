import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import "./IOSSelect.css";

function flatten(children) {
  return Children.toArray(children)
    .flatMap((child) => {
      if (!isValidElement(child)) return [];
      if (child.type === "option") return [child];
      return Children.toArray(child.props?.children).filter(
        (node) => isValidElement(node) && node.type === "option",
      );
    })
    .map((el) => ({
      value: String(el.props.value ?? el.props.children ?? ""),
      label: String(el.props.children ?? el.props.value ?? ""),
      disabled: Boolean(el.props.disabled),
    }));
}

export default function IOSSelect({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
  placeholder = "Choose an option",
}) {
  const options = useMemo(() => flatten(children), [children]);
  const selected = options.find((option) => option.value === String(value ?? ""));
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const dialogRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      setMobile(media.matches);
      setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      const node = rootRef.current;
      if (node?.contains(event.target) || panelRef.current?.contains(event.target) || dialogRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mobile) return undefined;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.body.style.overflow = before;
      cancelAnimationFrame(raf);
    };
  }, [mobile, open]);

  function update(next) {
    onChange?.({ target: { value: next } });
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      className={`ff-ios-select__trigger${open ? " is-open" : ""}`}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      onClick={() => setOpen((state) => !state)}
    >
      <span className={`ff-ios-select__value${selected ? "" : " is-placeholder"}`}>
        {selected?.label || placeholder}
      </span>
      <ChevronDown size={16} className="ff-ios-select__chevron" />
    </button>
  );

  return (
    <span ref={rootRef} className={`ff-ios-select ${className}`.trim()}>
      {trigger}
      {!mobile && open && (
        <div ref={panelRef} id={listboxId} className="ff-ios-select__menu" role="listbox" aria-label={ariaLabel || placeholder}>
          {options.map((option) => {
            const active = String(value ?? "") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                disabled={option.disabled}
                aria-selected={active}
                className={`ff-ios-select__option${active ? " is-selected" : ""}`}
                onClick={() => update(option.value)}
              >
                <span>{option.label}</span>
                {active && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
      {mobile && open && createPortal(
        <div className="ff-ios-sheet" role="presentation">
          <button type="button" className="ff-ios-sheet__backdrop" aria-label="Close selection" onClick={() => setOpen(false)} />
          <div
            ref={dialogRef}
            className="ff-ios-sheet__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || placeholder}
            tabIndex={-1}
          >
            <header className="ff-ios-sheet__header">
              <strong>{ariaLabel || placeholder}</strong>
              <button type="button" className="ff-ios-sheet__close" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </header>
            <div className="ff-ios-sheet__options" role="listbox" aria-label={ariaLabel || placeholder}>
              {options.map((option) => {
                const active = String(value ?? "") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    disabled={option.disabled}
                    aria-selected={active}
                    className={`ff-ios-select__option ff-ios-sheet__option${active ? " is-selected" : ""}`}
                    onClick={() => update(option.value)}
                  >
                    <span>{option.label}</span>
                    {active && <Check size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
