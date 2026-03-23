import { useState } from "react";

export default function LoginForm({ onLogin }) {
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
        />
        <input
          className="mb-3 w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
        />
        <button className="w-full rounded bg-blue-600 p-2 text-white">Sign in</button>
      </form>
    </main>
  );
}
