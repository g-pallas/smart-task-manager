import { useState } from "react";

export default function LoginForm({
  onLogin,
  onSwitchToRegister,
  loading = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onLogin({ email, password });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <form onSubmit={submit} className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">Login</h1>
        <input
          className="mb-3 w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
        />
        <input
          className="mb-3 w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={loading}
        />
        <button
          disabled={loading}
          className="w-full rounded bg-blue-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={loading}
          className="mt-3 w-full text-sm text-slate-600 underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Need an account? Create one
        </button>
      </form>
    </main>
  );
}
