import { useEffect, useState } from "react";
import { Screen } from "./Screen";
import { SegmentedControl } from "./SegmentedControl";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type CategoryRow = { id: string; name: string; color: string };
type TxRow = {
  id: string;
  type: "ingreso" | "gasto" | "ahorro";
  amount: number;
  currency: "ARS" | "USD";
  category_id: string | null;
  description: string;
  is_shared: boolean;
  date: string;
};

type RecurringRow = {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  currency: "ARS" | "USD";
  description: string;
  day_of_month: number;
};

type Filter = "Todos" | "Gastos" | "Ingresos";

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function Movimientos() {
  const { household } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [recurring, setRecurring] = useState<RecurringRow[]>([]);

  async function load() {
    if (!household) return;
    const [txRes, catRes, recRes] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, type, amount, currency, category_id, description, is_shared, date",
        )
        .eq("household_id", household.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("id, name, color")
        .eq("household_id", household.id),
      supabase
        .from("recurring_rules")
        .select("id, type, amount, currency, description, day_of_month")
        .eq("household_id", household.id)
        .eq("active", true),
    ]);
    setTransactions((txRes.data as TxRow[]) ?? []);
    setCategories((catRes.data as CategoryRow[]) ?? []);
    setRecurring((recRes.data as RecurringRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  async function handleDeactivateRecurring(id: string) {
    if (!household) return;
    const ok = window.confirm(
      "¿Dejar de repetir este movimiento? Lo que ya se cargó no se borra.",
    );
    if (!ok) return;
    await supabase
      .from("recurring_rules")
      .update({ active: false })
      .eq("id", id)
      .eq("household_id", household.id);
    setRecurring((current) => current.filter((r) => r.id !== id));
  }

  async function handleDelete(id: string) {
    if (!household) return;
    const ok = window.confirm("¿Borrar este movimiento?");
    if (!ok) return;
    await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("household_id", household.id);
    setTransactions((current) => current.filter((t) => t.id !== id));
  }

  const filtered = transactions.filter((t) => {
    if (filter === "Gastos") return t.type === "gasto";
    if (filter === "Ingresos") return t.type === "ingreso";
    return true;
  });

  if (loading) {
    return (
      <Screen>
        <div className="text-ink-soft text-[14px]">Cargando...</div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="font-serif text-[22px] font-semibold">Movimientos</div>

      {recurring.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] text-ink-soft mb-2">
            Recurrentes activos
          </div>
          <div className="flex flex-col gap-2">
            {recurring.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-lavender-tint rounded-2xl px-4 py-2.5"
              >
                <div className="flex-1 min-w-0 text-[13px] truncate">
                  {r.description || "Sin descripción"}
                  <span className="text-ink-soft">
                    {" "}
                    · día {r.day_of_month} de cada mes
                  </span>
                </div>
                <div className="text-[13px] font-semibold flex-none">
                  {r.type === "ingreso" ? "+" : "-"}
                  {r.currency === "USD" ? "USD " : "$"}
                  {formatMoney(r.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeactivateRecurring(r.id)}
                  aria-label="Desactivar"
                  className="text-ink-soft text-[16px] leading-none px-1 flex-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <SegmentedControl
          options={["Todos", "Gastos", "Ingresos"]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-[14px] text-ink-soft mt-8 text-center">
          Todavía no hay movimientos acá. Tocá el + de abajo para cargar el
          primero.
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-1">
          {filtered.map((tx) => {
            const category = categories.find((c) => c.id === tx.category_id);
            const isIncome = tx.type === "ingreso";
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-3 border-b border-border"
              >
                <div
                  className="w-[10px] h-[10px] rounded-full flex-none"
                  style={{ backgroundColor: category?.color ?? "var(--border)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] truncate">
                    {tx.description || "Sin descripción"}
                  </div>
                  <div className="text-[12px] text-ink-soft mt-0.5">
                    {formatDate(tx.date)}
                    {category ? ` · ${category.name}` : ""}
                    {tx.is_shared ? " · Compartido" : " · Individual"}
                  </div>
                </div>
                <div
                  className={`text-[14px] font-semibold flex-none ${
                    isIncome ? "text-[color:var(--income)]" : "text-ink"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {tx.currency === "USD" ? "USD " : "$"}
                  {formatMoney(tx.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  aria-label="Borrar"
                  className="text-ink-soft text-[18px] leading-none px-1 flex-none"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
