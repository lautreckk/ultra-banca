import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/format-currency';

export default async function BingoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let balance = 0;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();
    balance = profile?.balance ?? 0;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0421] text-white relative overflow-hidden">
      {/* Background blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-5 py-4 flex justify-between items-center bingo-glass-panel border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Voltar" className="p-1 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link
            href="/bingo/historico"
            className="p-1 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Historico"
          >
            <History className="w-4 h-4" />
          </Link>
        </div>
        <h1 className="text-xl font-black tracking-wider text-yellow-400 bingo-gaming-font">BINGO</h1>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-sm font-bold tabular-nums text-emerald-400">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
