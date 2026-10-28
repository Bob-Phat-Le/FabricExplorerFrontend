'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-200 z-10',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <nav className="py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-xs font-medium group',
                active
                  ? 'bg-indigo-50 text-indigo-600 border-r-[3px] border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <i
                className={cn(
                  'fa-solid text-base w-5',
                  item.icon,
                  active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600',
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-100 hidden md:block">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-xs"
        >
          {!collapsed && <span className="font-medium">Collapse Sidebar</span>}
          <i className={cn('fa-solid', collapsed ? 'fa-angles-right' : 'fa-angles-left')} />
        </button>
      </div>
    </aside>
  );
}
