-- Migration: Create atomic payout function
-- Description: Handles bet payout atomically: verifies status, updates bet, increments balance, logs transaction.

CREATE OR REPLACE FUNCTION fn_process_payout(
  p_bet_id UUID,
  p_amount DECIMAL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to ensure permission to update balances
AS $$
DECLARE
  v_user_id UUID;
  v_platform_id UUID;
  v_current_status TEXT;
  v_new_balance DECIMAL;
  v_bet_val DECIMAL;
BEGIN
  -- 1. Lock bet row and check status
  SELECT user_id, platform_id, status, valor_total
  INTO v_user_id, v_platform_id, v_current_status, v_bet_val
  FROM apostas
  WHERE id = p_bet_id
  FOR UPDATE; -- Lock to prevent race conditions

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bet not found');
  END IF;

  IF v_current_status != 'pendente' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bet already processed', 'status', v_current_status);
  END IF;

  -- 2. Update Bet Status
  UPDATE apostas
  SET 
    status = 'ganhou',
    premio_valor = p_amount,
    updated_at = NOW()
  WHERE id = p_bet_id;

  -- 3. Increment User Balance (Atomic Update)
  UPDATE profiles
  SET saldo = COALESCE(saldo, 0) + p_amount
  WHERE id = v_user_id
  RETURNING saldo INTO v_new_balance;

  -- 4. Log Transaction (Adjusted to schema)
  INSERT INTO transactions (
    user_id,
    platform_id,
    tipo,
    amount,
    status,
    external_id,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    v_platform_id,
    'prize',
    p_amount,
    'completed',
    'payout_' || p_bet_id,
    p_metadata || jsonb_build_object('description', 'Premio de aposta: ' || p_bet_id),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'payout', p_amount
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
