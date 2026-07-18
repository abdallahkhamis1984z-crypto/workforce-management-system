import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={menuOpen} />
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMenuOpen(false)} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
