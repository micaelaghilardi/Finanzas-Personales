import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthScreen } from "./AuthScreen";
import { HouseholdOnboarding } from "./HouseholdOnboarding";
import { Dashboard } from "./Dashboard";
import { AddTransaction } from "./AddTransaction";
import { Movimientos } from "./Movimientos";
import { Presupuestos } from "./Presupuestos";
import { Objetivos } from "./Objetivos";
import { Categorias } from "./Categorias";
import { supabase } from "./supabase";

type RecurringRule = {
  id: string;
  user_id: string;
  type: "ingreso" | "gasto";
  amount: number;
  currency: "ARS" | "USD";
  category_id: string | null;
  description: string;
  is_shared: boolean;
  day_of_month: number;
};

// Revisa los ingresos/gastos recurrentes del hogar y, si todavía no se
// cargó el de este mes, lo crea solo. Se ejecuta cada vez que se abre
// la app (no hay un "reloj" en el servidor, así que esta es la forma
// de que se cargue sin que nadie tenga que acordarse de hacerlo).
async function applyRecurringRules(householdId: string) {
  const { data: rules } = await supabase
    .from("recurring_rules")
    .select(
      "id, user_id, type, amount, currency, category_id, description, is_shared, day_of_month",
    )
    .eq("household_id", householdId)
    .eq("active", true);

  if (!rules || rules.length === 0) return;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  for (const rule of rules as RecurringRule[]) {
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("recurring_rule_id", rule.id)
      .gte("date", firstDay)
      .limit(1)
      .maybeSingle();

    if (existing) continue;

    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(rule.day_of_month, 28),
    )
      .toISOString()
      .slice(0, 10);

    await supabase.from("transactions").insert({
      household_id: householdId,
      user_id: rule.user_id,
      type: rule.type,
      amount: rule.amount,
      currency: rule.currency,
      category_id: rule.category_id,
      description: rule.description,
      is_shared: rule.is_shared,
      recurring_rule_id: rule.id,
      date,
    });
  }
}

function Gate() {
  const { session, loading, household } = useAuth();

  useEffect(() => {
    if (household) applyRecurringRules(household.id);
  }, [household]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-ink-soft text-[14px]">
        Cargando...
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  if (!household) return <HouseholdOnboarding />;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/movimientos" element={<Movimientos />} />
      <Route path="/presupuestos" element={<Presupuestos />} />
      <Route path="/objetivos" element={<Objetivos />} />
      <Route path="/agregar" element={<AddTransaction />} />
      <Route path="/categorias" element={<Categorias />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
