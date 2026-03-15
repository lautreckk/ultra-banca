import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getLiveMetrics, getActiveUsers, getHourlyChartData, getRecentActivities } from '@/lib/admin/actions/live';
import { getPlatformId } from '@/lib/utils/platform';
import { ALL_PLATFORMS_ID } from '@/lib/utils/platform-constants';
import { LiveDashboardContent } from '@/components/admin/live/live-dashboard-content';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      <p className="mt-2 text-zinc-500">Carregando painel Live...</p>
    </div>
  );
}

async function LiveContent() {
  const [metrics, activeUsers, chartData, activities, platformId] = await Promise.all([
    getLiveMetrics(),
    getActiveUsers(1, 20),
    getHourlyChartData(),
    getRecentActivities(15),
    getPlatformId(),
  ]);

  return (
    <LiveDashboardContent
      initialMetrics={metrics}
      initialUsers={activeUsers.users}
      initialUsersTotal={activeUsers.total}
      initialChartData={chartData}
      initialActivities={activities}
      platformId={platformId === ALL_PLATFORMS_ID ? 'all' : platformId}
    />
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LiveContent />
    </Suspense>
  );
}
