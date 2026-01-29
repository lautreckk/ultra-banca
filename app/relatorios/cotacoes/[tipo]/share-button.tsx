'use client';

import { Share2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';

interface CotacoesShareButtonProps {
  titulo: string;
  groupedData: Array<{
    nome: string;
    items: Array<{ nome: string; multiplicador: number }>;
  }>;
  showCategories: boolean;
}

export function CotacoesShareButton({ titulo, groupedData, showCategories }: CotacoesShareButtonProps) {
  const handleShare = async () => {
    let text = `TABELA DE COTACOES - ${titulo}\n\n`;

    groupedData.forEach(group => {
      if (showCategories) {
        text += `${group.nome.toUpperCase()}\n`;
      }
      group.items.forEach(m => {
        text += `${m.nome}: ${formatCurrency(m.multiplicador)}\n`;
      });
      text += '\n';
    });

    if (navigator.share) {
      try {
        await navigator.share({ text: text.trim() });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(text.trim());
      alert('Copiado para a area de transferencia!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-4 text-white active:bg-zinc-700"
    >
      <Share2 className="h-5 w-5" />
      <span className="font-semibold">Compartilhar</span>
    </button>
  );
}
