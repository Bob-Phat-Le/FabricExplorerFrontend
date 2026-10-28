import type { ReactNode } from 'react';

/** Panel trượt từ phải, phủ overlay mờ. */
export function Drawer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}
