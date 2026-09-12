import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

export function HouseholdOnboarding() {
  const { refreshHousehold } = useAuth();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.from("households").insert({ name });
    setLoading(false);
    if (error) return setError(error.message);
    await refreshHousehold();
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.rpc("join_household_by_code", { code });
    setLoading(false);
    if (error) return setError(error.message);
    await refreshHousehold();
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 font-sans text-ink">
      <div className="w-full max-w-sm">
        <div className="font-serif text-[24px] font-semibold text-center">
          Un último paso
        </div>
        <div className="text-[13px] text-ink-soft text-center mt-1">
          Creá tu hogar compartido o unite a uno existente
        </div>

        <div className="flex bg-surface border border-border rounded-2xl p-1 mt-6">
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] transition-colors ${
              tab === "create"
                ? "bg-sage text-white font-semibold"
                : "text-ink-soft"
            }`}
          >
            Crear hogar
          </button>
          <button
            type="button"
            onClick={() => setTab("join")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] transition-colors ${
              tab === "join"
                ? "bg-sage text-white font-semibold"
                : "text-ink-soft"
            }`}
          >
            Unirme con código
          </button>
        </div>

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del hogar (ej. Mica & Facu)"
              required
              className="border border-border rounded-2xl px-4 py-3 text-[14px] bg-surface outline-none focus:border-sage"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-sage text-white rounded-2xl py-3 text-[15px] font-semibold disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear hogar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="mt-6 flex flex-col gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de invitación"
              required
              className="border border-border rounded-2xl px-4 py-3 text-[14px] bg-surface outline-none focus:border-sage uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-sage text-white rounded-2xl py-3 text-[15px] font-semibold disabled:opacity-60"
            >
              {loading ? "Uniendo..." : "Unirme"}
            </button>
          </form>
        )}

        {error && (
          <div className="text-[13px] text-[color:var(--expense)] mt-3 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
