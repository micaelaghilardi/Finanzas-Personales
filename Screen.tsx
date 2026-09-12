import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function Screen({
  children,
  footer,
}: {
  children: ReactNode;
  /** Pass `false` to hide the bottom nav (e.g. on the Add-movement flow). */
  footer?: ReactNode | false;
}) {
  return (
    <div className="h-dvh bg-bg flex justify-center font-sans text-ink overflow-hidden">
      <div className="w-full max-w-md h-dvh flex flex-col bg-bg relative overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-5 pt-7 pb-6">
          {children}
        </main>
        {footer === false ? null : footer ?? <BottomNav />}
      </div>
    </div>
  );
}
