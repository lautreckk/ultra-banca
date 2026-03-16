'use client';

import { useState } from 'react';
import {
  ElitePixButton,
  ElitePromoCarousel,
  EliteJogosSection,
  EliteWinnersTicker,
  EliteQuickActions,
  EliteGrupoPalpites,
} from './components/EliteHomeSections';
import { CommunityChat } from '@/components/shared/community-chat';
import { SupportChat } from '@/components/shared/support-chat';
import { Headphones } from 'lucide-react';

export function EliteHome() {
  const [communityOpen, setCommunityOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div className="space-y-0">
        <ElitePixButton />
        <EliteWinnersTicker />
        <ElitePromoCarousel />
        <EliteJogosSection />
        <EliteGrupoPalpites onOpen={() => setCommunityOpen(true)} />
        <EliteQuickActions />
        <div className="h-6" />
      </div>

      {/* Floating Support Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Headphones className="h-5 w-5 text-white" />
      </button>

      <CommunityChat open={communityOpen} onClose={() => setCommunityOpen(false)} />
      <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
