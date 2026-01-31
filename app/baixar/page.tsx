'use client';

import { Download, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export default function BaixarAppPage() {
  const { canInstall, isInstalled, promptInstall, isIOS, showManualInstructions } = usePWAInstall();

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall();
    }
  };

  return (
    <PageLayout title="COMO INSTALAR">
      <div className="p-4 space-y-6">
        {isInstalled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-center font-medium">
              O aplicativo ja esta instalado no seu dispositivo!
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-700 text-center">
                Para instalar o aplicativo, clique no botao abaixo e siga as instrucoes na tela.
              </p>
            </div>

            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 bg-[#E5A220] hover:bg-[#d4931d] text-white font-bold py-4 px-6 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                Clique aqui para baixar o APP!
              </button>
            )}

            {showManualInstructions && (
              <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                <h2 className="font-bold text-gray-800 text-center">
                  Instrucoes de Instalacao Manual
                </h2>

                {isIOS ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      No Safari (iPhone/iPad):
                    </p>
                    <ol className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Toque no icone</span>
                          <Share className="h-5 w-5 text-blue-500" />
                          <span>(Compartilhar)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Role e toque em</span>
                          <PlusSquare className="h-5 w-5 text-gray-600" />
                          <span>&quot;Adicionar a Tela de Inicio&quot;</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </span>
                        <span>Confirme tocando em &quot;Adicionar&quot;</span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      No Chrome (Android):
                    </p>
                    <ol className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Toque no menu</span>
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                          <span>(tres pontos)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        <span>Selecione &quot;Instalar aplicativo&quot; ou &quot;Adicionar a tela inicial&quot;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#E5A220] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </span>
                        <span>Confirme a instalacao</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
