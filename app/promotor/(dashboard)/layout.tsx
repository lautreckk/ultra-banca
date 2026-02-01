'use client';

import { useState, useEffect } from 'react';
import { PromotorSidebar, PromotorHeader } from '@/components/promotor/layout';
import { getPromotorDashboard } from '@/lib/promotor/actions/dashboard';

export default function PromotorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [promotorNome, setPromotorNome] = useState<string>('');

  useEffect(() => {
    const fetchPromotor = async () => {
      const data = await getPromotorDashboard();
      if (data) {
        setPromotorNome(data.promotor.nome);
      }
    };
    fetchPromotor();
  }, []);

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <PromotorSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        promotorNome={promotorNome}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PromotorHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
