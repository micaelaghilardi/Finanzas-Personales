import { useEffect, useState, type FormEvent } from "react";
import { Screen } from "./Screen";
import { Card } from "./Card";
import { SegmentedControl } from "./SegmentedControl";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  currency: "ARS" | "USD";
  target_date: string | null;
};

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function parseInputAmount(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return isNaN(value) || value <= 0 ? null : value;
}

function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}

export function Objetivos() {
  const { household, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savedByGoal, setSavedByGoal] = useState<Map<string, number>>(
    new Map(),
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmountInput, setTargetAmountInput] = useState("");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [contributing, setContributing] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  async function load() {
    if (!household) return;
    setLoading(true);
    const [goalsRes, txRes] = await Promise.all([
      supabase
        .from("goals")
        .select("id, name, target_amount, currency, target_date")
        .eq("household_id", household.id)
        .order("created_at"),
      supabase
        .from("transactions")
        .select("amount, goal_id")
        .eq("household_id", household.id)
        .not("goal_id", "is", null),
    ]);

    setGoals((goalsRes.data as Goal[]) ?? []);

    const saved = new Map<string, number>();
    ((txRes.data ?? []) as { amount: number; goal_id: string | null }[]).forEach(
      (t) => {
        if (!t.goal_id) return;
        saved.set(t.goal_id, (saved.get(t.goal_id) ?? 0) + Number(t.amount));
      },
    );
    setSavedByGoal(saved);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!household) return;
    const amount = parseInputAmount(targetAmountInput);
    if (!name || amount === null) return;

    setSaving(true);
    await supabase.from("goals").insert({
      household_id: household.id,
      name,
      target_amount: amount,
      currency,
      target_date: targetDate || null,
    });
    setSaving(false);
    setName("");
    setTargetAmountInput("");
    setTargetDate("");
    setCurrency("ARS");
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!household) return;
    const ok = window.confirm("¿Borrar este objetivo?");
    if (!ok) return;
    await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("household_id", household.id);
    await load();
  }

  async function handleContribute(goal: Goal) {
    if (!household || !session?.user) return;
    const amount = parseInputAmount(contributionAmount);
    if (amount === null) return;

    await supabase.from("transactions").insert({
      household_id: household.id,
      user_id: session.user.id,
      type: "ahorro",
      amount,
      currency: goal.currency,
      goal_id: goal.id,
      description: `Aporte a ${goal.name}`,
      is_shared: true,
    });

    setContributionAmount("");
    setContributing(null);
    await load();
  }

  if (loading) {
    return (
      <Screen>
        <div className="text-ink-soft text-[14px]">Cargando...</div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div className="font-serif text-[22px] font-semibold">Objetivos</div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sage text-[13px] font-semibold"
        >
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {showForm && (
        <Card className="mt-4 p-4">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viaje a Bariloche"
              required
              className="border border-border rounded-xl px-3 py-2.5 text-[14px] bg-surface outline-none focus:border-sage"
            />
            <input
              value={targetAmountInput}
              onChange={(e) => setTargetAmountInput(e.target.value)}
              placeholder="Monto objetivo, ej: 500.000"
              required
              className="border border-border rounded-xl px-3 py-2.5 text-[14px] bg-surface outline-none focus:border-sage"
            />
            <SegmentedControl
              options={["ARS", "USD"]}
              value={currency}
              onChange={(v) => setCurrency(v as "ARS" | "USD")}
            />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="border border-border rounded-xl px-3 py-2.5 text-[14px] bg-surface outline-none focus:border-sage"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-sage text-white rounded-xl py-2.5 text-[14px] font-semibold disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear objetivo"}
            </button>
          </form>
        </Card>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="text-[14px] text-ink-soft mt-8 text-center">
          Todavía no tenés objetivos de ahorro. Creá el primero con "+ Nuevo".
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {goals.map((goal) => {
            const target = Number(goal.target_amount);
            const saved = savedByGoal.get(goal.id) ?? 0;
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
            const remaining = Math.max(0, target - saved);
            const suggestion = goal.target_date
              ? Math.ceil(remaining / monthsUntil(goal.target_date))
              : null;
            const symbol = goal.currency === "USD" ? "USD " : "$";

            return (
              <Card key={goal.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-semibold">{goal.name}</div>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    aria-label="Borrar"
                    className="text-ink-soft text-[16px] leading-none px-1"
                  >
                    ×
                  </button>
                </div>

                <div className="text-[13px] text-ink-soft mt-1">
                  {symbol}
                  {formatMoney(saved)} de {symbol}
                  {formatMoney(target)}
                  {goal.target_date &&
                    ` · antes del ${new Date(
                      goal.target_date + "T00:00:00",
                    ).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`}
                </div>

                <div className="h-2 bg-border rounded mt-3">
                  <div
                    className="h-2 rounded bg-savings"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {remaining === 0 ? (
                  <div className="text-[12px] mt-2 text-[color:var(--income)]">
                    ¡Objetivo alcanzado!
                  </div>
                ) : (
                  suggestion !== null && (
                    <div className="text-[12px] text-ink-soft mt-2">
                      Para llegar a tiempo, conviene aportar {symbol}
                      {formatMoney(suggestion)} por mes
                    </div>
                  )
                )}

                {contributing === goal.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      autoFocus
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="Monto a aportar"
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-[13px] bg-surface outline-none focus:border-sage"
                    />
                    <button
                      type="button"
                      onClick={() => handleContribute(goal)}
                      className="bg-sage text-white rounded-xl px-3 py-2 text-[12px] font-semibold"
                    >
                      Aportar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setContributing(goal.id);
                      setContributionAmount("");
                    }}
                    className="mt-3 border border-sage text-sage rounded-xl py-2 text-[13px] font-semibold w-full"
                  >
                    + Aportar
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
