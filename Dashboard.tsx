import { Screen } from "./Screen";
import { Card } from "./Card";

// Datos de ejemplo — se van a reemplazar por datos reales de Supabase
// en la próxima etapa.
const mock = {
  personName: "Mica",
  month: "Septiembre 2026",
  available: "$780.000",
  availableUsd: "USD 1.000",
  income: "$1.700.000",
  expenses: "$920.000",
  saved: "$780.000",
  savedPct: 42,
  topCategories: [
    { name: "Alimentación", amount: "$250.000", pct: 100, color: "bg-peach" },
    { name: "Vivienda", amount: "$200.000", pct: 80, color: "bg-sky" },
    { name: "Transporte", amount: "$120.000", pct: 48, color: "bg-gold" },
  ],
  insight: "Este mes gastaste 18% menos en restaurantes que en agosto.",
};

export function Dashboard() {
  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-[22px] font-semibold">
            Hola, {mock.personName}
          </div>
          <div className="text-[13px] text-ink-soft mt-0.5">{mock.month}</div>
        </div>
        <div className="flex items-center">
          <div className="w-[34px] h-[34px] rounded-full bg-sage flex items-center justify-center text-white text-[13px] font-semibold border-2 border-bg">
            M
          </div>
          <div className="w-[34px] h-[34px] rounded-full bg-sky flex items-center justify-center text-white text-[13px] font-semibold border-2 border-bg -ml-2.5">
            F
          </div>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-[13px] text-ink-soft">Disponible</div>
        <div className="font-serif text-[34px] font-semibold mt-1 leading-none">
          {mock.available}
        </div>
        <div className="text-[13px] text-ink-soft mt-1">
          + {mock.availableUsd} disponibles
        </div>

        <div className="h-px bg-border my-4" />

        <div className="flex gap-3.5">
          <Stat label="Ingresos" value={mock.income} />
          <Stat label="Gastos" value={mock.expenses} />
          <Stat label="Ahorrado" value={mock.saved} highlight />
        </div>
      </Card>

      <Card className="mt-4 p-5 flex items-center gap-4">
        <SavingsRing pct={mock.savedPct} />
        <div className="flex-1">
          <div className="text-[14px] leading-snug">
            Ahorraste el <strong>{mock.savedPct}%</strong> de tus ingresos
            este mes
          </div>
          <div className="text-[12px] text-ink-soft mt-1">
            Tu mejor mes del año
          </div>
        </div>
      </Card>

      <div className="mt-6 text-[15px] font-semibold">Gastaste más en</div>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {mock.topCategories.map((cat) => (
          <div key={cat.name}>
            <div className="flex items-center gap-2.5">
              <div className={`w-[30px] h-[30px] rounded-[9px] ${cat.color} flex-none`} />
              <div className="flex-1 text-[14px]">{cat.name}</div>
              <div className="text-[14px] font-semibold">{cat.amount}</div>
            </div>
            <div className="h-1.5 bg-border rounded ml-10 mt-2">
              <div
                className={`h-1.5 rounded ${cat.color}`}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-lavender-tint rounded-2xl p-4">
        <div className="text-[13px] text-ink-soft font-medium">
          Insight automático
        </div>
        <div className="text-[14px] mt-1 leading-snug">{mock.insight}</div>
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
