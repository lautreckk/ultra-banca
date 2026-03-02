import { CasinoLobby } from '@/components/casino/casino-lobby';

export default function CassinoPage() {
  return (
    <div className="px-4 py-4">
      <h1
        className="text-2xl font-bold mb-4"
        style={{ color: 'var(--color-text)' }}
      >
        Cassino
      </h1>
      <CasinoLobby />
    </div>
  );
}
