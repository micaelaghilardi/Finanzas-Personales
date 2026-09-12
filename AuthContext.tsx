import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type Household = {
  id: string;
  name: string;
  invite_code: string;
  role: string;
};

type AuthState = {
  session: Session | null;
  loading: boolean;
  household: Household | null;
  refreshHousehold: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadHousehold(userId: string) {
    const { data } = await supabase
      .from("household_members")
      .select("role, households(id, name, invite_code)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const h = data?.households as unknown as
      | { id: string; name: string; invite_code: string }
      | undefined;

    setHousehold(h ? { ...h, role: data!.role as string } : null);
  }

  async function refreshHousehold() {
    if (session?.user) await loadHousehold(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadHousehold(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          loadHousehold(newSession.user.id);
        } else {
          setHousehold(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, household, refreshHousehold }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
