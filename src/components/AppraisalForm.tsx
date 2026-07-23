"use client";

import { useState } from "react";

export function AppraisalForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setStatus("loading");
    setError(null);
    const form = new FormData(formEl);
    try {
      const res = await fetch("/api/appraisal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          message: form.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send request");
      formEl.reset();
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-paper p-6 md:p-8">
      <div className="grid gap-4">
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
          <span className="mb-1.5 block font-medium">Property address</span>
          <input
            name="address"
            required
            placeholder="Street, suburb"
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Anything we should know?</span>
          <textarea
            name="message"
            rows={4}
            className="w-full border border-line px-3 py-3 outline-none ring-sea focus:ring-2"
          />
        </label>
      </div>
      <button
        type="submit"
        className="btn btn-primary mt-6 w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending…" : "Request appraisal"}
      </button>
      {status === "done" && (
        <p className="mt-3 text-sm text-sea-deep">
          Thanks — your appraisal request has been sent to Drew. He’ll be in
          touch soon.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </form>
  );
}
