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

export function EliteHome() {
  const [communityOpen, setCommunityOpen] = useState(false);

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

      <CommunityChat open={communityOpen} onClose={() => setCommunityOpen(false)} />
    </>
  );
}
