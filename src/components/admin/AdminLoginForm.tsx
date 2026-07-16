"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-line bg-paper p-5">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        defaultValue="admin@drewmiller.co.nz"
        className="w-full border border-line px-3 py-3 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        className="w-full border border-line px-3 py-3 text-sm"
      />
      <button className="btn btn-primary w-full" type="submit">
        Sign in
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
