'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { BANCAS } from '@/lib/constants';

export default function SelecionarLoteriaPage() {
  const params = useParams();
  const router = useRouter();
  const data = params.data as string;

  const [expandedGroups, setExpandedGroups] = useState<string[]>(['rio_federal']);
  const [selectedLoterias, setSelectedLoterias] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleLoteria = (loteriaId: string) => {
    setSelectedLoterias((prev) =>
      prev.includes(loteriaId)
        ? prev.filter((id) => id !== loteriaId)
        : [...prev, loteriaId]
    );
  };

  const getSelectedCountForGroup = (groupId: string) => {
    const banca = BANCAS.find((b) => b.id === groupId);
    if (!banca) return 0;
    return banca.subLoterias.filter((sub) => selectedLoterias.includes(sub.id)).length;
  };

  const handleAvancar = () => {
    if (selectedLoterias.length === 0) return;
    const loteriasParam = selectedLoterias.join(',');
    router.push(`/resultados/${data}/ver?loterias=${loteriasParam}`);
  };

  return (
    <PageLayout title="SELECIONE A LOTERIA" showBack>
      <div className="bg-[#1A1F2B] min-h-screen">
        {/* Accordion Groups */}
        <div className="border border-zinc-700/40 rounded-lg mx-4 mt-4 overflow-hidden">
          {BANCAS.map((banca, index) => {
            const isExpanded = expandedGroups.includes(banca.id);
            const selectedCount = getSelectedCountForGroup(banca.id);

            return (
              <div key={banca.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(banca.id)}
                  className={`w-full flex items-center justify-between px-4 py-4 bg-[#1A1F2B] hover:bg-zinc-700/50 ${
                    index > 0 ? 'border-t border-zinc-700/40' : ''
                  }`}
                >
                  <span className="font-semibold text-white">{banca.nome}</span>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <span className="bg-zinc-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {selectedCount}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Sub-loterias */}
                {isExpanded && (
                  <div className="bg-[#1A1F2B]">
                    {banca.subLoterias.map((sub) => {
                      const isSelected = selectedLoterias.includes(sub.id);
                      const hour = sub.horario.split(':')[0];
                      const displayName = `LT ${sub.nome} ${hour}HS`;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleLoteria(sub.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-t border-zinc-700/40 hover:bg-zinc-700/50"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-zinc-700/40 bg-zinc-800/30'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-200'}`}>
                            {displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1F2B] border-t border-dashed border-zinc-700/40 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleAvancar}
              disabled={selectedLoterias.length === 0}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                selectedLoterias.length > 0
                  ? 'bg-[#E5A220]'
                  : 'bg-zinc-700 cursor-not-allowed'
              }`}
            >
              AVANÇAR
            </button>
          </div>
        </div>

        {/* Spacer for fixed button */}
        <div className="h-24" />
      </div>
    </PageLayout>
  );
}
