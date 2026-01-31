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
      <div className="bg-white min-h-screen">
        {/* Accordion Groups */}
        <div className="border border-gray-200 rounded-lg mx-4 mt-4 overflow-hidden">
          {BANCAS.map((banca, index) => {
            const isExpanded = expandedGroups.includes(banca.id);
            const selectedCount = getSelectedCountForGroup(banca.id);

            return (
              <div key={banca.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(banca.id)}
                  className={`w-full flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50 ${
                    index > 0 ? 'border-t border-gray-200' : ''
                  }`}
                >
                  <span className="font-semibold text-gray-900">{banca.nome}</span>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {selectedCount}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Sub-loterias */}
                {isExpanded && (
                  <div className="bg-white">
                    {banca.subLoterias.map((sub) => {
                      const isSelected = selectedLoterias.includes(sub.id);
                      const hour = sub.horario.split(':')[0];
                      const displayName = `LT ${sub.nome} ${hour}HS`;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleLoteria(sub.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 hover:bg-gray-50"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-dashed border-gray-300 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleAvancar}
              disabled={selectedLoterias.length === 0}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                selectedLoterias.length > 0
                  ? 'bg-[#E5A220]'
                  : 'bg-gray-300 cursor-not-allowed'
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
