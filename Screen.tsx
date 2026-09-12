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
    <div className="min-h-screen bg-bg flex justify-center font-sans text-ink">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-bg relative">
        <main className="flex-1 overflow-y-auto px-5 pt-7 pb-6">
          {children}
        </main>
        {footer === false ? null : footer ?? <BottomNav />}
      </div>
    </div>
  );
}
