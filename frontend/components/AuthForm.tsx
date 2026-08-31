"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { loginAccount, registerAccount } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const auth =
        mode === "login"
          ? await loginAccount({ username, password })
          : await registerAccount({ username, password, email: email || undefined });

      localStorage.setItem("auth_token", auth.token);
      localStorage.setItem("auth_user_id", String(auth.user.id));

      // Not every user has (or wants) a store - registering doesn't create
      // one automatically, so we can't assume /store/{id} exists yet.
      // Land on the homepage; "Toko" in the navbar covers store setup.
      router.push("/materials");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const Icon = mode === "login" ? LogIn : UserPlus;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft/40 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {mode === "login" ? "Masuk" : "Daftar Akun"}
      </h1>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email (opsional)</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
      >
        {isSubmitting ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
      </button>

      <p className="text-center text-xs text-gray-500">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar
            </Link>
          </>
        ) : (
          <>
            Udah punya akun?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
