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

  useEffect(() => {
    if (!household) return;

    async function load() {
      const [txRes, catRes] = await Promise.all([
        supabase
          .from("transactions")
          .select(
            "id, type, amount, currency, category_id, description, is_shared, date",
          )
          .eq("household_id", household!.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("id, name, color")
          .eq("household_id", household!.id),
      ]);
      setTransactions((txRes.data as TxRow[]) ?? []);
      setCategories((catRes.data as CategoryRow[]) ?? []);
      setLoading(false);
    }

    load();
  }, [household]);

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
