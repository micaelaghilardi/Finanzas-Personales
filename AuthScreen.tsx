import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Te mandamos un mail para confirmar tu cuenta.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 font-sans text-ink">
      <div className="w-full max-w-sm">
        <div className="font-serif text-[26px] font-semibold text-center">
          Finanzas
        </div>
        <div className="text-[13px] text-ink-soft text-center mt-1">
          {mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="border border-border rounded-2xl px-4 py-3 text-[14px] bg-surface outline-none focus:border-sage"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="border border-border rounded-2xl px-4 py-3 text-[14px] bg-surface outline-none focus:border-sage"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            minLength={6}
            className="border border-border rounded-2xl px-4 py-3 text-[14px] bg-surface outline-none focus:border-sage"
          />

          {error && (
            <div className="text-[13px] text-[color:var(--expense)]">
              {error}
            </div>
          )}
          {notice && (
            <div className="text-[13px] text-[color:var(--income)]">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-sage text-white rounded-2xl py-3 text-[15px] font-semibold mt-2 disabled:opacity-60"
          >
            {loading
              ? "Un momento..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setNotice(null);
          }}
          className="text-[13px] text-ink-soft text-center w-full mt-5"
        >
          {mode === "login"
            ? "¿No tenés cuenta? Creá una"
            : "¿Ya tenés cuenta? Iniciá sesión"}
        </button>
      </div>
    </div>
  );
}
