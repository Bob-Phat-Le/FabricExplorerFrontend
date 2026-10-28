import type { ReactNode } from 'react';

export function PrevButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-2"
    >
      <i className="fa-solid fa-arrow-left text-xs" />
      <span>Previous</span>
    </button>
  );
}

export function NextButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
    >
      <span>{children}</span>
      <i className="fa-solid fa-arrow-right text-xs" />
    </button>
  );
}

export function WizardFooter({ onPrev, children }: { onPrev?: () => void; children: ReactNode }) {
  return (
    <div className={`flex ${onPrev ? 'justify-between' : 'justify-end'} pt-4 border-t border-slate-100`}>
      {onPrev && <PrevButton onClick={onPrev} />}
      {children}
    </div>
  );
}

export function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div>
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
      <i className="fa-solid fa-circle-info mr-1 text-indigo-500" /> {children}
    </div>
  );
}
