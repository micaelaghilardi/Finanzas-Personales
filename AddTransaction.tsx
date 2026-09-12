import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "./Screen";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { SegmentedControl } from "./SegmentedControl";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type Category = {
  id: string;
  name: string;
  color: string;
  kind: "necesario" | "discrecional" | null;
};

type Rule = { keyword: string; category_id: string };

// Interpreta el primer número que encuentra en el texto, soportando
// el formato argentino ("12.000" = doce mil, "12.000,50" = doce mil con 50).
function parseAmount(raw: string): { value: number; token: string } | null {
  const match = raw.match(/\d[\d.,]*/);
  if (!match) return null;
  let num = match[0];
  const hasComma = num.includes(",");
  const hasDot = num.includes(".");

  if (hasComma && hasDot) {
    num = num.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    num = num.replace(",", ".");
  } else if (hasDot) {
    const parts = num.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      num = parts.join(""); // "12.000" -> separador de miles
    }
  }

  const value = parseFloat(num);
  if (isNaN(value) || value <= 0) return null;
  return { value, token: match[0] };
}

function parseDescription(raw: string, token: string): string {
  return raw
    .replace(token, "")
    .replace(/\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function AddTransaction() {
  const { household, session } = useAuth();
  const navigate = useNavigate();

  const [rawText, setRawText] = useState("");
  const [type, setType] = useState<"Gasto" | "Ingreso">("Gasto");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [isShared, setIsShared] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!household) return;
    supabase
      .from("categories")
      .select("id, name, color, kind")
      .eq("household_id", household.id)
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) ?? []));
    supabase
      .from("category_rules")
      .select("keyword, category_id")
      .eq("household_id", household.id)
      .then(({ data }) => setRules((data as Rule[]) ?? []));
  }, [household]);

  const parsed = useMemo(() => parseAmount(rawText), [rawText]);
  const description = useMemo(
    () => (parsed ? parseDescription(rawText, parsed.token) : rawText.trim()),
    [rawText, parsed],
  );

  useEffect(() => {
    if (!description) {
      setSuggestedCategoryId(null);
      return;
    }
    const lower = description.toLowerCase();
    const match = rules.find((r) => lower.includes(r.keyword.toLowerCase()));
    setSuggestedCategoryId(match?.category_id ?? null);
    setSelectedCategoryId((current) => current ?? match?.category_id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, rules]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!household || !session?.user || !parsed) {
      setError('No pude reconocer un monto. Probá algo como "Almuerzo $12.000".');
      return;
    }

    setSaving(true);

    // Si marcó "repetir todos los meses", primero creamos la regla
    // recurrente para poder enlazar el movimiento con ella.
    let recurringRuleId: string | null = null;
    if (isRecurring) {
      const today = new Date();
      const { data: rule, error: ruleError } = await supabase
        .from("recurring_rules")
        .insert({
          household_id: household.id,
          user_id: session.user.id,
          type: type === "Gasto" ? "gasto" : "ingreso",
          amount: parsed.value,
          currency,
          category_id: selectedCategoryId,
          description: description || "Sin descripción",
          is_shared: isShared,
          day_of_month: Math.min(today.getDate(), 28),
        })
        .select("id")
        .single();

      if (ruleError) {
        setSaving(false);
        setError(ruleError.message);
        return;
      }
      recurringRuleId = (rule as { id: string }).id;
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      household_id: household.id,
      user_id: session.user.id,
      type: type === "Gasto" ? "gasto" : "ingreso",
      amount: parsed.value,
      currency,
      category_id: selectedCategoryId,
      description: description || "Sin descripción",
      is_shared: isShared,
      recurring_rule_id: recurringRuleId,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Si corrigió la categoría sugerida, la app "aprende" guardando
    // una palabra clave nueva para reconocerla sola la próxima vez.
    if (selectedCategoryId && selectedCategoryId !== suggestedCategoryId && description) {
      const keyword = description.toLowerCase().split(" ")[0];
      if (keyword && keyword.length >= 3) {
        supabase
          .from("category_rules")
          .insert({
            household_id: household.id,
            category_id: selectedCategoryId,
            keyword,
          })
          .then(() => {});
      }
    }

    setSuccess(true);
    setTimeout(() => navigate("/"), 900);
  }

  return (
    <Screen footer={false}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-[22px] font-semibold">
            Nuevo movimiento
          </div>
          <div className="text-[13px] text-ink-soft mt-1 max-w-[260px]">
            Escribí como se lo dirías a alguien: "Almuerzo $12.000"
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Cerrar"
          className="text-ink-soft text-[24px] leading-none px-2 -mt-1"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          autoFocus
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Ej: Almuerzo $12.000"
          className="border border-border rounded-2xl px-4 py-3.5 text-[16px] bg-surface outline-none focus:border-sage"
        />

        {parsed && (
          <Card className="p-4 flex items-center justify-between">
            <div className="text-[14px]">{description || "Sin descripción"}</div>
            <div className="text-[17px] font-semibold">
              {currency === "USD" ? "USD " : "$"}
              {parsed.value.toLocaleString("es-AR")}
            </div>
          </Card>
        )}

        <SegmentedControl
          options={["Gasto", "Ingreso"]}
          value={type}
          onChange={(v) => setType(v as "Gasto" | "Ingreso")}
        />

        <SegmentedControl
          options={["ARS", "USD"]}
          value={currency}
          onChange={(v) => setCurrency(v as "ARS" | "USD")}
        />

        {categories.length > 0 && (
          <div>
            <div className="text-[13px] text-ink-soft mb-2">Categoría</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={selectedCategoryId === cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsShared((v) => !v)}
          className={`flex items-center justify-between border rounded-2xl px-4 py-3 text-[14px] transition-colors ${
            isShared
              ? "border-sage bg-sage-tint text-sage font-semibold"
              : "border-border bg-surface text-ink-soft"
          }`}
        >
          <span>Gasto compartido del hogar</span>
          <span>{isShared ? "Sí" : "No, es individual"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsRecurring((v) => !v)}
          className={`flex items-center justify-between border rounded-2xl px-4 py-3 text-[14px] transition-colors ${
            isRecurring
              ? "border-sage bg-sage-tint text-sage font-semibold"
              : "border-border bg-surface text-ink-soft"
          }`}
        >
          <span>Repetir todos los meses</span>
          <span>{isRecurring ? "Sí" : "No"}</span>
        </button>

        {error && (
          <div className="text-[13px] text-[color:var(--expense)]">{error}</div>
        )}
        {success && (
          <div className="text-[13px] text-[color:var(--income)]">
            ¡Guardado!
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !parsed}
          className="bg-sage text-white rounded-2xl py-3.5 text-[15px] font-semibold disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar movimiento"}
        </button>
      </form>
    </Screen>
  );
}
