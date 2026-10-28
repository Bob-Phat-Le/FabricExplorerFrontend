import { Fragment } from 'react';

export interface StepDef {
  title: string;
  subtitle: string;
}

interface StepperProps {
  steps: StepDef[];
  current: number;
  onSelect: (step: number) => void;
  /** Các class dưới đây phải là chuỗi literal ở nơi gọi để Tailwind quét được. */
  minWidthClass: string;
  gapClass: string;
  lineClass: string;
}

const BADGE_BASE = 'w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs transition-all';

/** Thanh tiến trình cho wizard nhiều bước: đã qua = xanh lá + dấu check, hiện tại = indigo, chưa tới = xám. */
export function Stepper({ steps, current, onSelect, minWidthClass, gapClass, lineClass }: StepperProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
      <div className={`flex items-center justify-between ${minWidthClass} text-xs font-medium`}>
        {steps.map((step, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <Fragment key={step.title}>
              <button type="button" onClick={() => onSelect(n)} className={`flex items-center ${gapClass} cursor-pointer group`}>
                <div
                  className={
                    done
                      ? `${BADGE_BASE} bg-emerald-600 text-white shadow-sm`
                      : active
                        ? `${BADGE_BASE} bg-indigo-600 text-white shadow-sm`
                        : `${BADGE_BASE} bg-slate-100 border border-slate-300 text-slate-500`
                  }
                >
                  {done ? <i className="fa-solid fa-check" /> : n}
                </div>
                <div className="flex flex-col text-left">
                  <span
                    className={done ? 'font-semibold text-slate-700' : active ? 'font-bold text-indigo-600' : 'font-semibold text-slate-400'}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{step.subtitle}</span>
                </div>
              </button>
              {n < steps.length && <div className={`h-0.5 bg-slate-200 ${lineClass}`} />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
