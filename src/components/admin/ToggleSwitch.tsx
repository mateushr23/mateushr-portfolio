"use client";

import { useId, useState, useTransition } from "react";

export type ToggleVariant = "featured" | "hidden";

interface ToggleSwitchProps {
  name: string;
  defaultChecked: boolean;
  label: string;
  labelHidden?: boolean;
  variant: ToggleVariant;
  onToggle: (next: boolean) => Promise<unknown>;
  disabled?: boolean;
  /** sr-only messages for 3-state announcements (on / off / loading). */
  srOn: string;
  srOff: string;
  srLoading: string;
}

/**
 * ToggleSwitch — accessible hand-rolled toggle from a native checkbox +
 * label-as-track. CSS in globals.css draws the track/thumb and handles
 * focus, hover, disabled, and loading visuals.
 *
 * Space toggles (native). On change we optimistically flip the local
 * checked state, call the bound server action, and fall back on error.
 * The visually-hidden aria-live region announces the post-toggle state.
 *
 * Variant affects only color (amber vs sage) via the CSS data-variant
 * attribute on the label.
 */
export function ToggleSwitch({
  name,
  defaultChecked,
  label,
  labelHidden = false,
  variant,
  onToggle,
  disabled = false,
  srOn,
  srOff,
  srLoading,
}: ToggleSwitchProps) {
  const inputId = useId();
  const [checked, setChecked] = useState(defaultChecked);
  const [pending, startTransition] = useTransition();
  const [liveMessage, setLiveMessage] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.checked;
    const prev = checked;
    setChecked(next);
    setLiveMessage(srLoading);
    startTransition(async () => {
      try {
        await onToggle(next);
        setLiveMessage(next ? srOn : srOff);
      } catch (err) {
        console.error("[ToggleSwitch] onToggle failed", err);
        setChecked(prev);
        setLiveMessage(prev ? srOn : srOff);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-3">
      <label
        htmlFor={inputId}
        className="toggle-switch"
        data-variant={variant}
        data-pending={pending ? "true" : "false"}
        aria-busy={pending || undefined}
      >
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled || pending}
          onChange={handleChange}
        />
        <span className="toggle-track" aria-hidden="true" />
        <span className={labelHidden ? "sr-only" : "ml-3 font-mono text-sm text-text-muted"}>
          {label}
        </span>
      </label>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </span>
    </span>
  );
}
