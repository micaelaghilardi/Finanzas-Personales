import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthScreen } from "./AuthScreen";
import { HouseholdOnboarding } from "./HouseholdOnboarding";
import { Dashboard } from "./Dashboard";
import { Placeholder } from "./Placeholder";

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
      <Route
        path="/movimientos"
        element={<Placeholder title="Movimientos" />}
      />
      <Route
        path="/presupuestos"
        element={<Placeholder title="Presupuestos" />}
      />
      <Route path="/objetivos" element={<Placeholder title="Objetivos" />} />
      <Route
        path="/agregar"
        element={<Placeholder title="Nuevo movimiento" />}
      />
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
