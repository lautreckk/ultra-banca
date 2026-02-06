'use client';

import { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteLinkProps {
  code: string;
  className?: string;
}

export function InviteLink({ code, className }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `https://bancaforte.com/convite/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-700/40 bg-[#1A1F2B] p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <Users className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="font-bold text-white">Convide Amigos</p>
          <p className="text-xs text-zinc-500">Ganhe bonus por indicacao</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-400 truncate">{inviteUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            copied
              ? 'bg-[var(--color-accent-green)] text-white'
              : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] active:bg-[var(--color-primary-dark)]'
          )}
        >
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
