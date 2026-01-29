'use client';

import { X } from 'lucide-react';

interface AdPopupProps {
  ad: {
    id: string;
    titulo: string;
    imagem_url: string;
    link_url?: string | null;
  };
  onClose: () => void;
}

export function AdPopup({ ad, onClose }: AdPopupProps) {
  const handleImageClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-md w-full animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {/* Image container */}
        <div
          className={`relative overflow-hidden rounded-xl shadow-2xl ${
            ad.link_url ? 'cursor-pointer' : ''
          }`}
          onClick={handleImageClick}
        >
          <img
            src={ad.imagem_url}
            alt={ad.titulo}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>

        {/* Close button below */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-white/90 backdrop-blur rounded-lg font-medium text-gray-800 hover:bg-white transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
