"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Scene 4 contact form. Reached only via the top-right "Contact me" link
 * (which dispatches `scene:goto` with `{ scene: 4 }`); NOT reachable by
 * wheel/scroll advance from scene 3. The scene still regresses normally
 * (wheel-up / ArrowUp / PageUp → scene 3).
 *
 * Submission strategy: opens the user's default mail client via a
 * `mailto:` URL. No network call, no backend dependency — keeps the
 * static portfolio fully self-contained. The tradeoff is that the
 * submit path depends on the OS having a configured mail handler;
 * switch to a real backend (Resend / Formspree / custom API route) if
 * conversion-rate or UX becomes a concern.
 *
 * Inputs share a single `INPUT_CLASS` constant so the border + padding
 * + placeholder treatment stays consistent across the three fields.
 * Textarea adds `resize-none min-h-[9rem]` on top of the shared shape.
 */

const INPUT_CLASS =
  "w-full border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-[length:var(--text-click)] text-[color:var(--color-accent)] placeholder:text-[color:var(--color-accent)]/40 focus:outline-none focus:border-[color:var(--color-accent-bright)]";

const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none min-h-[9rem]`;

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = `From: ${email}\n\n${content}`;
    const mailtoUrl = `mailto:mateushr23@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div
      className="reveal flex w-full max-w-lg flex-col gap-6"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      <h2 className="text-balance font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)">
        Get in touch
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-email"
            className="label text-message uppercase tracking-[0.08em] text-(--color-accent)"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-subject"
            className="label text-message uppercase tracking-[0.08em] text-(--color-accent)"
          >
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-content"
            className="label text-message uppercase tracking-[0.08em] text-(--color-accent)"
          >
            Content
          </label>
          <textarea
            id="contact-content"
            name="content"
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </div>
        <button
          type="submit"
          className="label inline-flex items-center gap-4 self-start text-corner uppercase tracking-[0.08em] text-(--color-accent) transition-colors hover:text-accent-bright"
        >
          <span>Send message</span>
          <Image
            src="/assets/space/arrow-glyph.svg"
            alt=""
            width={53}
            height={105}
            aria-hidden="true"
            className="h-6 w-auto shrink-0 rotate-180 md:h-7"
          />
        </button>
      </form>
    </div>
  );
}
