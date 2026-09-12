import { useEffect, useState } from "react";
import { Screen } from "./Screen";
import { Card } from "./Card";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type CategoryRow = { id: string; name: string; color: string };
type BudgetRow = { id: string; category_id: string | null; amount: number };

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function parseInputAmount(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return isNaN(value) || value <= 0 ? null : value;
}

export function Presupuestos() {
  const { household } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Map<string, number>>(
    new Map(),
  );
  const [totalSpent, setTotalSpent] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    if (!household) return;
    setLoading(true);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const [catRes, budgetRes, txRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, color")
        .eq("household_id", household.id)
        .order("name"),
      supabase
        .from("budgets")
        .select("id, category_id, amount")
        .eq("household_id", household.id),
      supabase
        .from("transactions")
        .select("amount, category_id")
        .eq("household_id", household.id)
        .eq("type", "gasto")
        .eq("currency", "ARS")
        .gte("date", firstDay),
    ]);

    setCategories((catRes.data as CategoryRow[]) ?? []);
    setBudgets((budgetRes.data as BudgetRow[]) ?? []);

    const spent = new Map<string, number>();
    let total = 0;
    ((txRes.data ?? []) as { amount: number; category_id: string | null }[]).forEach(
      (t) => {
        total += Number(t.amount);
        if (t.category_id) {
          spent.set(
            t.category_id,
            (spent.get(t.category_id) ?? 0) + Number(t.amount),
          );
        }
      },
    );
    setSpentByCategory(spent);
    setTotalSpent(total);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  function budgetFor(categoryId: string | null) {
    return budgets.find((b) => b.category_id === categoryId);
  }

  async function handleSave(categoryId: string | null) {
    if (!household) return;
    const key = categoryId ?? "general";
    const value = parseInputAmount(inputs[key] ?? "");
    if (value === null) return;

    setSavingKey(key);
    const existing = budgetFor(categoryId);

    if (existing) {
      await supabase
        .from("budgets")
        .update({ amount: value })
        .eq("id", existing.id);
    } else if (categoryId === null) {
      await supabase.from("budgets").insert({
        household_id: household.id,
        category_id: null,
        amount: value,
        currency: "ARS",
      });
    } else {
      await supabase.from("budgets").upsert(
        {
          household_id: household.id,
          category_id: categoryId,
          amount: value,
          currency: "ARS",
        },
        { onConflict: "household_id,category_id" },
      );
    }

    setSavingKey(null);
    setInputs((current) => ({ ...current, [key]: "" }));
    await load();
  }

  function progressColor(pct: number) {
    if (pct >= 100) return "bg-[color:var(--expense)]";
    if (pct >= 80) return "bg-gold";
    return "bg-sage";
  }

  if (loading) {
    return (
      <Screen>
        <div className="text-ink-soft text-[14px]">Cargando...</div>
      </Screen>
    );
  }

  const generalBudget = budgetFor(null);
  const generalPct = generalBudget
    ? Math.round((totalSpent / generalBudget.amount) * 100)
    : 0;

  return (
    <Screen>
      <div className="font-serif text-[22px] font-semibold">Presupuestos</div>
      <div className="text-[13px] text-ink-soft mt-1">
        Definí un límite mensual (en ARS) y te avisamos cuando te estés por
        pasar
      </div>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-semibold">General</div>
          {generalBudget && (
            <div className="text-[13px] text-ink-soft">
              ${formatMoney(totalSpent)} de ${formatMoney(generalBudget.amount)}
            </div>
          )}
        </div>

        {generalBudget ? (
          <>
            <div className="h-2 bg-border rounded mt-3">
              <div
                className={`h-2 rounded ${progressColor(generalPct)}`}
                style={{ width: `${Math.min(100, generalPct)}%` }}
              />
            </div>
            {generalPct >= 100 ? (
              <div className="text-[12px] mt-2 text-[color:var(--expense)]">
                Te pasaste del presupuesto general este mes
              </div>
            ) : generalPct >= 80 ? (
              <div className="text-[12px] mt-2 text-ink-soft">
                Ya usaste el {generalPct}% del presupuesto general
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-[13px] text-ink-soft mt-1">
            Todavía no definiste un presupuesto general
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <input
            value={inputs["general"] ?? ""}
            onChange={(e) =>
              setInputs((current) => ({ ...current, general: e.target.value }))
            }
            placeholder="Ej: 900.000"
            className="flex-1 border border-border rounded-xl px-3 py-2 text-[14px] bg-surface outline-none focus:border-sage"
          />
          <button
            type="button"
            onClick={() => handleSave(null)}
            disabled={savingKey === "general"}
            className="bg-sage text-white rounded-xl px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
          >
            {generalBudget ? "Actualizar" : "Definir"}
          </button>
        </div>
      </Card>

      <div className="mt-6 text-[15px] font-semibold">Por categoría</div>
      <div className="mt-3 flex flex-col gap-3">
        {categories.map((cat) => {
          const budget = budgetFor(cat.id);
          const spent = spentByCategory.get(cat.id) ?? 0;
          const pct = budget ? Math.round((spent / budget.amount) * 100) : 0;
          const key = cat.id;
          return (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="text-[14px] font-medium">{cat.name}</div>
                </div>
                {budget && (
                  <div className="text-[12px] text-ink-soft">
                    ${formatMoney(spent)} de ${formatMoney(budget.amount)}
                  </div>
                )}
              </div>

              {budget && (
                <div className="h-1.5 bg-border rounded mt-2.5">
                  <div
                    className={`h-1.5 rounded ${progressColor(pct)}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <input
                  value={inputs[key] ?? ""}
                  onChange={(e) =>
                    setInputs((current) => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={budget ? String(budget.amount) : "Sin límite"}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-[13px] bg-surface outline-none focus:border-sage"
                />
                <button
                  type="button"
                  onClick={() => handleSave(cat.id)}
                  disabled={savingKey === key}
                  className="bg-surface border border-sage text-sage rounded-xl px-3 py-2 text-[12px] font-semibold disabled:opacity-50"
                >
                  {budget ? "Actualizar" : "Definir"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
