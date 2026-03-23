import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getLocationData, getInsightsData } from '@/lib/admin/actions/live';
import { GloboDashboard } from '@/components/admin/live/globo-dashboard';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="mt-2 text-zinc-500">Carregando Globo...</p>
    </div>
  );
}

async function GloboContent() {
  const [locationData, insightsData] = await Promise.all([
    getLocationData(),
    getInsightsData(),
  ]);

  return (
    <GloboDashboard
      initialLocationData={locationData}
      initialInsights={insightsData}
    />
  );
}

export default function GloboPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GloboContent />
    </Suspense>
  );
}
