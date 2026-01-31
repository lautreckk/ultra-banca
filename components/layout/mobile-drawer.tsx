'use client';

import { useRouter } from 'next/navigation';
import {
  Download,
  Bell,
  Dices,
  Moon,
  Calculator,
  Clock,
  Beef,
  Trophy,
  LogOut,
  Printer,
  FileText,
  HelpCircle,
  Gamepad2,
} from 'lucide-react';
import { Drawer, DrawerItem } from '@/components/ui/drawer';
import { createClient } from '@/lib/supabase/client';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="divide-y divide-[var(--color-border)]">
        {/* Highlighted items */}
        <div>
          <DrawerItem
            icon={<Download className="h-5 w-5" />}
            label="Baixar APP"
            highlighted
            onClick={() => handleNavigate('/baixar')}
          />
          <DrawerItem
            icon={<Bell className="h-5 w-5" />}
            label="Notificacoes"
            highlighted
            onClick={() => handleNavigate('/notificacoes')}
          />
          <DrawerItem
            icon={<Dices className="h-5 w-5" />}
            label="Recarga PIX"
            highlighted
            onClick={() => handleNavigate('/recarga-pix')}
          />
          <DrawerItem
            icon={<Dices className="h-5 w-5" />}
            label="Solicitar Saque"
            highlighted
            onClick={() => handleNavigate('/saques')}
          />
        </div>

        {/* Normal items */}
        <div>
          <DrawerItem
            icon={<Dices className="h-5 w-5" />}
            label="Loterias"
            onClick={() => handleNavigate('/loterias')}
          />
          <DrawerItem
            icon={<Beef className="h-5 w-5" />}
            label="Fazendinha"
            onClick={() => handleNavigate('/fazendinha')}
          />
          <DrawerItem
            icon={<Calculator className="h-5 w-5" />}
            label="Quininha"
            onClick={() => handleNavigate('/loterias?tipo=quininha')}
          />
          <DrawerItem
            icon={<Moon className="h-5 w-5" />}
            label="Seninha"
            onClick={() => handleNavigate('/loterias?tipo=seninha')}
          />
          <DrawerItem
            icon={<Dices className="h-5 w-5" />}
            label="Lotinha"
            onClick={() => handleNavigate('/loterias?tipo=lotinha')}
          />
        </div>

        <div>
          <DrawerItem
            icon={<Clock className="h-5 w-5" />}
            label="Resultados"
            onClick={() => handleNavigate('/resultados')}
          />
          <DrawerItem
            icon={<Trophy className="h-5 w-5" />}
            label="Premiadas"
            onClick={() => handleNavigate('/premiadas')}
          />
          <DrawerItem
            icon={<FileText className="h-5 w-5" />}
            label="Relatorios"
            onClick={() => handleNavigate('/relatorios')}
          />
          <DrawerItem
            icon={<Printer className="h-5 w-5" />}
            label="Imprimir Apostas"
            onClick={() => handleNavigate('/apostas')}
          />
        </div>

        <div>
          <DrawerItem
            icon={<Gamepad2 className="h-5 w-5" />}
            label="Como Jogar"
            onClick={() => handleNavigate('/como-jogar')}
          />
          <DrawerItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Duvidas & Regras"
            onClick={() => handleNavigate('/regras')}
          />
        </div>

        <div>
          <DrawerItem
            icon={<LogOut className="h-5 w-5" />}
            label="Sair"
            onClick={handleLogout}
          />
        </div>
      </div>
    </Drawer>
  );
}
