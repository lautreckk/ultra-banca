'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'cadastro';
  initialCodigoConvite?: string;
}

export function AuthModal({ open, onClose, defaultTab = 'login', initialCodigoConvite }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'cadastro'>(defaultTab);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, defaultTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
        style={{ backgroundColor: '#0C0E14' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3" style={{ backgroundColor: '#0C0E14' }}>
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setTab('login')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'login'
                  ? 'text-black'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={tab === 'login' ? { background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' } : undefined}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab('cadastro')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'cadastro'
                  ? 'text-black'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={tab === 'cadastro' ? { background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' } : undefined}
            >
              Cadastrar
            </button>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6">
          {tab === 'login' ? (
            <LoginForm />
          ) : (
            <RegisterForm initialCodigoConvite={initialCodigoConvite} />
          )}
        </div>
      </div>
    </div>
  );
}
