export function Footer() {
  return (
    <footer className="h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-500 shrink-0 z-20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-700">Connected</span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="flex items-center space-x-1">
          <i className="fa-brands fa-microsoft text-msblue" />
          <span className="text-slate-600 font-medium">Microsoft Fabric</span>
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-slate-400 text-[11px]">Last refresh: Just now</span>
      </div>
    </footer>
  );
}
