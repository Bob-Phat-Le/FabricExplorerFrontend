'use client';

import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { NotificationSidebar } from './NotificationSidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((c) => !c);

  const [notificationSidebarCollapsed, setNotificationSidebarCollapse] = useState(true);
  const toggleNotificationSidebar = () => setNotificationSidebarCollapse((c) => !c);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header onToggleSidebar={toggleSidebar} onToggleNotificationSidebar={toggleNotificationSidebar}/>
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">{children}</main>
        <NotificationSidebar onToggle={toggleNotificationSidebar} collapsed={notificationSidebarCollapsed}/>
      </div>
      <Footer />
    </div>
  );
}
