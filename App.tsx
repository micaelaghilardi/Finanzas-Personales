import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthScreen } from "./AuthScreen";
import { HouseholdOnboarding } from "./HouseholdOnboarding";
import { Dashboard } from "./Dashboard";
import { AddTransaction } from "./AddTransaction";
import { Movimientos } from "./Movimientos";
import { Presupuestos } from "./Presupuestos";
import { Objetivos } from "./Objetivos";

function Gate() {
  const { session, loading, household } = useAuth();

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
