"use client";

/** Themed dropdown (ARIA select-only combobox): same card look as the nav panels, keyboard + typeahead. */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type Option = { value: string; label: string };

/** Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); `name` submits it with a form. */
export function Select({ label, options, name, ...props }: { label: string; options: Option[]; name?: string; value?: string; defaultValue?: string; onChange?: (value: string) => void }) {
  const id = useId();
  const [own, setOwn] = useState(props.defaultValue ?? options[0]?.value ?? "");
  const value = props.value ?? own;
  const onChange = (v: string) => (setOwn(v), props.onChange?.(v));
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(selected);
    setOpen(true);
  };
  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  const key = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const move = (i: number) => (e.preventDefault(), open ? setActive(Math.min(last, Math.max(0, i))) : show());
    switch (e.key) {
      case "ArrowDown":
        return move(active + 1);
      case "ArrowUp":
        return move(active - 1);
      case "Home":
        return open && move(0);
      case "End":
        return open && move(last);
      case "Enter":
      case " ":
        e.preventDefault();
        return open ? pick(active) : show();
      case "Escape":
        return open && (e.preventDefault(), setOpen(false));
      case "Tab":
        return setOpen(false);
      default:
        if (e.key.length === 1) {
          const from = open ? active : selected;
          const hit = [...options.slice(from + 1), ...options.slice(0, from + 1)].find((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
          if (hit) {
            const i = options.indexOf(hit);
            if (open) setActive(i);
            else onChange(hit.value);
          }
        }
    }
  };

  return (
    <div className={`select${open ? " open" : ""}`} ref={root}>
      <span className="select-label" id={`${id}-l`}>
        {label}
      </span>
      <button
        type="button"
        className="select-btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-o`}
        aria-labelledby={`${id}-l ${id}-b`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        id={`${id}-b`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={key}
      >
        {options[selected]?.label}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <ul className="select-list" role="listbox" id={`${id}-o`} aria-labelledby={`${id}-l`} ref={list} hidden={!open}>
        {options.map((o, i) => (
          <li
            key={o.value}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === selected}
            className={i === active ? "active" : undefined}
            onPointerEnter={() => setActive(i)}
            onClick={() => pick(i)}
          >
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
