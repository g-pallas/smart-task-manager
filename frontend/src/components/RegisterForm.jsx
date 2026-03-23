import { useState } from "react";

export default function RegisterForm({
  onRegister,
  formErrors = {},
  onSwitchToLogin,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onRegister({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <form
        onSubmit={submit}
        className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow"
      >
        <h1 className="mb-4 text-xl font-bold">Create Account</h1>
        <input
          className="mb-2 w-full rounded border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoComplete="name"
          disabled={loading}
        />
        {formErrors.name?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}

        <input
          className="mb-2 w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
        />
        {formErrors.email?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.email[0]}</p>
        )}

        <input
          className="mb-2 w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          disabled={loading}
        />
        {formErrors.password?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.password[0]}</p>
        )}

        <input
          className="mb-4 w-full rounded border p-2"
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          disabled={loading}
        />

        <button
          disabled={loading}
          className="w-full rounded bg-emerald-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={loading}
          className="mt-3 w-full text-sm text-slate-600 underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Already have an account? Sign in
        </button>
      </form>
    </main>
  );
}
