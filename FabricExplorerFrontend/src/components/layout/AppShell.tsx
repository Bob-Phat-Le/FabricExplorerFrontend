'use client';

import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header onToggleSidebar={toggle} />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
