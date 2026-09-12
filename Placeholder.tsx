import { Screen } from "./Screen";

export function Placeholder({ title }: { title: string }) {
  return (
    <Screen>
      <div className="font-serif text-[22px] font-semibold">{title}</div>
      <div className="text-[14px] text-ink-soft mt-3">
        Esta pantalla la construimos en una próxima etapa.
      </div>
    </Screen>
  );
}
