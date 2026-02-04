'use client';

import Link from 'next/link';
import { Crown, MessageCircle, LogIn, Shield, Zap, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-900/50 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 backdrop-blur-sm border border-purple-500/20 flex items-center justify-center mb-6">
            <Crown className="h-12 w-12 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent tracking-tight text-center">
            Cupula Barao
          </h1>
          <p className="text-zinc-500 mt-3 text-lg">
            Plataforma de Elite
          </p>
        </div>

        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Entre para a{' '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Cupula Barao
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
            A plataforma exclusiva para quem busca excelencia.
            Acesse agora e faca parte do seleto grupo.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mb-12 max-w-lg mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Seguro</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Rapido</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Confiavel</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          {/* Telegram Button */}
          <a
            href="https://t.me/cupulabarao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 hover:border-[#0088cc]/50 text-[#0088cc] font-semibold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Telegram</span>
          </a>

          {/* Login Button */}
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/10 to-amber-500/10 hover:from-purple-500/20 hover:to-amber-500/20 border border-purple-500/30 hover:border-purple-500/50 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="h-5 w-5" />
            <span>Entrar</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-zinc-600 text-sm">
            Acesso exclusivo para membros autorizados
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </div>
  );
}
