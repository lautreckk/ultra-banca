'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BetSummaryCard } from '@/components/loterias';
import { EmptyState } from '@/components/shared';
import { useBetStore } from '@/stores/bet-store';
import { formatCurrency } from '@/lib/utils/format-currency';

export default function ApostasPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, getTotal } = useBetStore();
  const total = getTotal();

  const handleConfirmar = async () => {
    // TODO: Submit bets to backend
    alert('Apostas confirmadas com sucesso!');
    clearCart();
    router.push('/');
  };

  if (items.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Carrinho vazio"
          description="Adicione apostas para continuar"
          action={
            <Button onClick={() => router.push('/loterias')}>
              Fazer Aposta
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Suas Apostas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {items.length} {items.length === 1 ? 'aposta' : 'apostas'} no carrinho
        </p>
      </div>

      {/* Bet Cards */}
      <div className="space-y-4 px-4">
        {items.map((item) => (
          <BetSummaryCard
            key={item.id}
            item={item}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 border-t border-dashed border-[var(--color-border)] pt-4 mx-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-[var(--color-primary)]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 px-4 space-y-3">
        <Button fullWidth onClick={handleConfirmar}>
          VALENDO - {formatCurrency(total)}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            fullWidth
            onClick={() => router.push('/loterias')}
          >
            + Apostas
          </Button>
          <Button
            variant="dark"
            fullWidth
            onClick={clearCart}
          >
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
}
