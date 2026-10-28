'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/auth.api';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useToast } from '@/providers/ToastProvider';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const { showToast, showApiError } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useClickOutside(menuRef, closeMenu, menuOpen);

  const signOut = async () => {
    setMenuOpen(false);
    try {
      await authApi.logout();
      showToast('Signed out of Entra ID session', 'warning');
    } catch (err) {
      showApiError(err, 'Sign out failed');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 shadow-sm shrink-0">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
        >
          <i className="fa-solid fa-bars text-lg" />
        </button>
        <Link href="/connection" className="flex items-center space-x-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <i className="fa-solid fa-cubes text-base" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-none">Fabric Explorer</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Enterprise Data Management
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Action Icons & Account Menu */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => showToast('No new alert notifications', 'info')}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors relative"
          title="Notifications"
        >
          <i className="fa-regular fa-bell text-base" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        <button
          type="button"
          onClick={() => showToast('Fabric Explorer documentation and help guides', 'info')}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
          title="Help & Guides"
        >
          <i className="fa-regular fa-circle-question text-base" />
        </button>

        <div className="h-5 w-px bg-slate-200 my-auto" />

        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Production
        </span>

        {/* User Account Profile */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              JD
            </div>
            <span className="hidden md:block text-xs font-semibold text-slate-700">John Doe</span>
            <i className="fa-solid fa-chevron-down text-[10px] text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">John Doe</p>
                <p className="text-[11px] text-slate-500 truncate">john.doe@company.com</p>
                <span className="mt-1 inline-block text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                  Entra ID Authenticated
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/settings');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <i className="fa-solid fa-gear text-slate-400 w-4" />
                <span>Account Settings</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                type="button"
                onClick={signOut}
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
              >
                <i className="fa-solid fa-arrow-right-from-bracket w-4" />
                <span>Sign Out Entra ID</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
