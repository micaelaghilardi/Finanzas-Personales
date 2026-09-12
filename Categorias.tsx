import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "./Screen";
import { Card } from "./Card";
import { SegmentedControl } from "./SegmentedControl";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

type Category = {
  id: string;
  name: string;
  color: string;
  kind: "necesario" | "discrecional" | null;
  parent_category_id: string | null;
};

const PALETTE = [
  "oklch(0.82 0.07 45)",
  "oklch(0.8 0.06 230)",
  "oklch(0.8 0.05 275)",
  "oklch(0.83 0.07 95)",
  "oklch(0.8 0.06 320)",
  "oklch(0.75 0.06 150)",
  "oklch(0.8 0.07 15)",
  "oklch(0.85 0.01 90)",
];

export function Categorias() {
  const { household } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"Necesario" | "Discrecional">(
    "Discrecional",
  );
  const [parentId, setParentId] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    if (!household) return;
    const { data } = await supabase
      .from("categories")
      .select("id, name, color, kind, parent_category_id")
      .eq("household_id", household.id)
      .order("name");
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!household || !name.trim()) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("categories").insert({
      household_id: household.id,
      name: name.trim(),
      color,
      kind: kind === "Necesario" ? "necesario" : "discrecional",
      parent_category_id: parentId || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setParentId("");
    setColor(PALETTE[0]);
    setShowForm(false);
    await load();
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    await supabase
      .from("categories")
      .update({ name: editingName.trim() })
      .eq("id", id);
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Borrar esta categoría?");
    if (!ok) return;
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);
    if (deleteError) {
      window.alert(
        "No se puede borrar: todavía tiene movimientos o presupuestos asociados.",
      );
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <Screen footer={false}>
        <div className="text-ink-soft text-[14px]">Cargando...</div>
      </Screen>
    );
  }

  return (
    <Screen footer={false}>
      <div className="flex items-start justify-between">
        <div className="font-serif text-[22px] font-semibold">Categorías</div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Cerrar"
          className="text-ink-soft text-[24px] leading-none px-2 -mt-1"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mt-4 text-sage text-[13px] font-semibold"
      >
        {showForm ? "Cancelar" : "+ Nueva categoría"}
      </button>

      {showForm && (
        <Card className="mt-3 p-4">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre, ej: Gimnasio"
              required
              className="border border-border rounded-xl px-3 py-2.5 text-[14px] bg-surface outline-none focus:border-sage"
            />
            <SegmentedControl
              options={["Necesario", "Discrecional"]}
              value={kind}
              onChange={(v) => setKind(v as "Necesario" | "Discrecional")}
            />
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="border border-border rounded-xl px-3 py-2.5 text-[14px] bg-surface outline-none focus:border-sage"
            >
              <option value="">Categoría principal (sin padre)</option>
              {categories
                .filter((c) => !c.parent_category_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Subcategoría de {c.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    color === c ? "border-ink" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label="Elegir color"
                />
              ))}
            </div>
            {error && (
              <div className="text-[13px] text-[color:var(--expense)]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-sage text-white rounded-xl py-2.5 text-[14px] font-semibold disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear categoría"}
            </button>
          </form>
        </Card>
      )}

      <div className="mt-5 flex flex-col gap-1">
        {categories.map((cat) => {
          const parent = categories.find(
            (c) => c.id === cat.parent_category_id,
          );
          return (
            <div
              key={cat.id}
              className="flex items-center gap-3 py-2.5 border-b border-border"
            >
              <div
                className="w-[10px] h-[10px] rounded-full flex-none"
                style={{ backgroundColor: cat.color }}
              />
              {editingId === cat.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(cat.id);
                  }}
                  className="flex-1 border border-border rounded-lg px-2 py-1 text-[14px] bg-surface outline-none focus:border-sage"
                />
              ) : (
                <div className="flex-1 min-w-0 text-[14px] truncate">
                  {cat.name}
                  {parent && (
                    <span className="text-ink-soft text-[12px]">
                      {" "}
                      · subcategoría de {parent.name}
                    </span>
                  )}
                </div>
              )}

              {editingId === cat.id ? (
                <button
                  type="button"
                  onClick={() => handleRename(cat.id)}
                  className="text-sage text-[12px] font-semibold flex-none"
                >
                  Guardar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditingName(cat.name);
                  }}
                  className="text-ink-soft text-[12px] flex-none"
                >
                  Editar
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                aria-label="Borrar"
                className="text-ink-soft text-[16px] leading-none px-1 flex-none"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
