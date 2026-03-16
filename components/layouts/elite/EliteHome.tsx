'use client';

import {
  ElitePixButton,
  ElitePromoBanner,
  EliteAnimaisSection,
  EliteCassinoSection,
  EliteWinnersTicker,
  EliteQuickActions,
} from './components/EliteHomeSections';

export function EliteHome() {
  return (
    <div className="space-y-0">
      <ElitePixButton />
      <EliteWinnersTicker />
      <ElitePromoBanner />
      <EliteAnimaisSection />
      <EliteQuickActions />
      <EliteCassinoSection />
      {/* Bottom spacing */}
      <div className="h-6" />
    </div>
  );
}
