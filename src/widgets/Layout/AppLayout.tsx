import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1480px] px-7 py-7">{children}</div>
      </main>
    </div>
  );
}
