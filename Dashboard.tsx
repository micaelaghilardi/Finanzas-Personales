import { useEffect, useState } from "react";
import { Screen } from "./Screen";
import { Card } from "./Card";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type Profile = { id: string; name: string };
type CategoryRow = { id: string; name: string };
type TxRow = {
  type: "ingreso" | "gasto" | "ahorro";
  amount: number;
  currency: "ARS" | "USD";
  category_id: string | null;
};

const CATEGORY_COLORS = ["bg-peach", "bg-sky", "bg-gold", "bg-lavender", "bg-sage"];

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function Dashboard() {
  const { household, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    if (!household || !session?.user) return;

    async function load() {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      const [profileRes, membersRes, txRes, catRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("name")
          .eq("id", session!.user.id)
          .single(),
        supabase
          .from("household_members")
          .select("user_id")
          .eq("household_id", household!.id),
        supabase
          .from("transactions")
          .select("type, amount, currency, category_id")
          .eq("household_id", household!.id)
          .gte("date", firstDay),
        supabase
          .from("categories")
          .select("id, name")
          .eq("household_id", household!.id),
      ]);

      setPersonName(profileRes.data?.name ?? "");

      const memberIds = ((membersRes.data ?? []) as { user_id: string }[]).map(
        (m) => m.user_id,
      );
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", memberIds);
        setMembers((profiles as Profile[]) ?? []);
      }

      setTransactions((txRes.data as TxRow[]) ?? []);
      setCategories((catRes.data as CategoryRow[]) ?? []);
      setLoading(false);
    }

    load();
  }, [household, session]);

  const month = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const sum = (type: TxRow["type"], currency: "ARS" | "USD") =>
    transactions
      .filter((t) => t.type === type && t.currency === currency)
      .reduce((acc, t) => acc + Number(t.amount), 0);

  const incomeARS = sum("ingreso", "ARS");
  const expenseARS = sum("gasto", "ARS");
  const savedARS = incomeARS - expenseARS;
  const savedUSD = sum("ingreso", "USD") - sum("gasto", "USD");
  const savedPct = incomeARS > 0 ? Math.round((savedARS / incomeARS) * 100) : 0;

  const categoryTotals = new Map<string, number>();
  transactions
    .filter((t) => t.type === "gasto" && t.currency === "ARS" && t.category_id)
    .forEach((t) => {
      const current = categoryTotals.get(t.category_id!) ?? 0;
      categoryTotals.set(t.category_id!, current + Number(t.amount));
    });

  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId, amount], index) => ({
      name: categories.find((c) => c.id === categoryId)?.name ?? "Otros",
      amount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

  const maxCategoryAmount = topCategories[0]?.amount ?? 1;

  const insight =
    topCategories.length > 0 && expenseARS > 0
      ? `El ${Math.round(
          (topCategories[0].amount / expenseARS) * 100,
        )}% de tus gastos este mes fue en ${topCategories[0].name}.`
      : "Todavía no cargaste gastos este mes.";

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
        <div>
          <div className="font-serif text-[22px] font-semibold">
            Hola, {personName || "vos"}
          </div>
          <div className="text-[13px] text-ink-soft mt-0.5 capitalize">
            {month}
          </div>
        </div>
        <div className="flex items-center">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`w-[34px] h-[34px] rounded-full bg-sage flex items-center justify-center text-white text-[13px] font-semibold border-2 border-bg ${
                i > 0 ? "-ml-2.5" : ""
              }`}
            >
              {m.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          ))}
        </div>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-[13px] text-ink-soft">Disponible</div>
        <div className="font-serif text-[34px] font-semibold mt-1 leading-none">
          ${formatMoney(savedARS)}
        </div>
        {savedUSD !== 0 && (
          <div className="text-[13px] text-ink-soft mt-1">
            + USD {formatMoney(savedUSD)} disponibles
          </div>
        )}

        <div className="h-px bg-border my-4" />

        <div className="flex gap-3.5">
          <Stat label="Ingresos" value={`$${formatMoney(incomeARS)}`} />
          <Stat label="Gastos" value={`$${formatMoney(expenseARS)}`} />
          <Stat label="Ahorrado" value={`$${formatMoney(savedARS)}`} highlight />
        </div>
      </Card>

      <Card className="mt-4 p-5 flex items-center gap-4">
        <SavingsRing pct={Math.max(0, Math.min(100, savedPct))} />
        <div className="flex-1">
          <div className="text-[14px] leading-snug">
            {incomeARS > 0 ? (
              <>
                Ahorraste el <strong>{savedPct}%</strong> de tus ingresos este
                mes
              </>
            ) : (
              "Todavía no cargaste ingresos este mes"
            )}
          </div>
        </div>
      </Card>

      {topCategories.length > 0 && (
        <>
          <div className="mt-6 text-[15px] font-semibold">Gastaste más en</div>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {topCategories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-[30px] h-[30px] rounded-[9px] ${cat.color} flex-none`}
                  />
                  <div className="flex-1 text-[14px]">{cat.name}</div>
                  <div className="text-[14px] font-semibold">
                    ${formatMoney(cat.amount)}
                  </div>
                </div>
                <div className="h-1.5 bg-border rounded ml-10 mt-2">
                  <div
                    className={`h-1.5 rounded ${cat.color}`}
                    style={{
                      width: `${Math.round(
                        (cat.amount / maxCategoryAmount) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 bg-lavender-tint rounded-2xl p-4">
        <div className="text-[13px] text-ink-soft font-medium">
          Insight automático
        </div>
        <div className="text-[14px] mt-1 leading-snug">{insight}</div>
      </div>
    </Screen>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex-1">
      <div className="text-[12px] text-ink-soft">{label}</div>
      <div
        className={`text-[16px] font-semibold mt-0.5 ${
          highlight ? "text-[color:var(--sage)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SavingsRing({ pct }: { pct: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="flex-none">
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={7}
      />
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke="var(--sage)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}
