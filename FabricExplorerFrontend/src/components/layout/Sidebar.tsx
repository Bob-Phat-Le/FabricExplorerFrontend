'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, NavItem } from './nav-items';
import { useState } from 'react';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const renderNavItem = (item: NavItem) => {
    const active =
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-xs font-medium group",
          active
            ? "bg-indigo-50 text-indigo-600 border-r-[3px] border-indigo-600 font-semibold"
            : "text-slate-600 hover:bg-slate-100",
        )}
      >
        <i
          className={cn(
            "fa-solid text-base w-5",
            item.icon,
            active
              ? "text-indigo-600"
              : "text-slate-400 group-hover:text-indigo-600",
          )}
        />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-200 z-10',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <nav className="py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          if ("groupLabel" in item) {
            const isOpen = openGroups[item.groupLabel] ?? false;

            const hasActiveItem = item.group.some(
              (navItem) =>
                pathname === navItem.href ||
                pathname.startsWith(`${navItem.href}/`),
            );

            return (
              <div key={item.groupLabel}>
                {/* Parent button */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((prev) => ({
                      ...prev,
                      [item.groupLabel]: !isOpen,
                    }))
                  }
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-xs font-medium group",
                    hasActiveItem
                      ? "bg-indigo-50 text-indigo-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <i
                      className={cn(
                        "fa-solid text-base w-5",
                        item.icon,
                        hasActiveItem
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-indigo-600",
                      )}
                    />

                    {!collapsed && <span>{item.groupLabel}</span>}
                  </div>

                  {!collapsed && (
                    <i
                      className={cn(
                        "fa-solid fa-chevron-down text-[10px] transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {/* Children */}
                {!collapsed && isOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.group.map((navItem) => renderNavItem(navItem))}
                  </div>
                )}
              </div>
            );
          }

          return renderNavItem(item);
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
