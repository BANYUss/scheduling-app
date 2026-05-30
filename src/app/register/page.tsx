"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal mendaftar");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Daftar</h1>

        {error && (
          <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>
        )}

        <input name="name" type="text" placeholder="Nama" required
          className="w-full rounded border p-2" />
        <input name="username" type="text" placeholder="Username" required
          className="w-full rounded border p-2" />
        <input name="email" type="email" placeholder="Email" required
          className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Password" required
          className="w-full rounded border p-2" />

        <button type="submit" disabled={loading}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </div>
  );
}