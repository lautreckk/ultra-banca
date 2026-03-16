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
        className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        style={{ background: 'linear-gradient(135deg, #FFD700, #DAA520)', boxShadow: '0 4px 15px rgba(255,215,0,0.3)' }}
      >
        <Headphones className="h-5 w-5 text-black" />
      </button>

      <CommunityChat open={communityOpen} onClose={() => setCommunityOpen(false)} />
      <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
