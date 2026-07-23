"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send message");
      setStatus("done");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-line bg-paper p-6 md:p-8"
    >
      <p className="eyebrow">Message</p>
      <h2 className="display mt-2 text-3xl">Send Drew a note</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Goes straight to Drew Miller at drew.miller@raywhite.com.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Name</span>
          <input
            name="name"
            required
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Phone</span>
          <input
            name="phone"
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-6 w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>

      {status === "done" ? (
        <p className="mt-3 text-sm text-sea-deep">
          Thanks — your message is with Drew. He’ll be in touch soon.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
