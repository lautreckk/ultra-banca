'use server';

import { createClient } from '@/lib/supabase/server';

export async function transferBalance(
  amount: number,
  fromWallet: 'tradicional' | 'cassino',
  toWallet: 'tradicional' | 'cassino'
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) {
    return { success: false, error: 'Valor deve ser positivo' };
  }

  if (fromWallet === toWallet) {
    return { success: false, error: 'Carteiras devem ser diferentes' };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: result, error } = await supabase.rpc('transfer_balance', {
    p_user_id: user.id,
    p_amount: amount,
    p_from_wallet: fromWallet,
    p_to_wallet: toWallet,
  });

  if (error) {
    console.error('Transfer RPC error:', error);
    return { success: false, error: error.message };
  }

  if (result && !result.success) {
    return { success: false, error: result.error || 'Erro na transferência' };
  }

  return { success: true };
}
