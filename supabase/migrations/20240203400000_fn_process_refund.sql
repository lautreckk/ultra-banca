-- Migration: Create atomic refund function
-- Description: Handles bet refund atomically: verifies status, updates bet, increments balance, logs transaction.
-- This prevents race conditions when multiple refunds are processed simultaneously.

CREATE OR REPLACE FUNCTION fn_process_refund(
  p_bet_id UUID,
  p_reason TEXT DEFAULT 'Resultado não disponível'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_platform_id UUID;
  v_current_status TEXT;
  v_valor_total DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- 1. Lock bet row and check status
  SELECT user_id, platform_id, status, valor_total
  INTO v_user_id, v_platform_id, v_current_status, v_valor_total
  FROM apostas
  WHERE id = p_bet_id
  FOR UPDATE; -- Lock to prevent race conditions

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bet not found');
  END IF;

  IF v_current_status != 'pendente' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bet already processed', 'status', v_current_status);
  END IF;

  IF v_valor_total IS NULL OR v_valor_total <= 0 THEN
    -- Still mark as refunded even if no value
    UPDATE apostas
    SET
      status = 'reembolsado',
      updated_at = NOW()
    WHERE id = p_bet_id;

    RETURN jsonb_build_object(
      'success', true,
      'new_balance', NULL,
      'refund', 0,
      'message', 'Bet marked as refunded (no value)'
    );
  END IF;

  -- 2. Update Bet Status
  UPDATE apostas
  SET
    status = 'reembolsado',
    updated_at = NOW()
  WHERE id = p_bet_id;

  -- 3. Increment User Balance (Atomic Update)
  UPDATE profiles
  SET saldo = COALESCE(saldo, 0) + v_valor_total
  WHERE id = v_user_id
  RETURNING saldo INTO v_new_balance;

  -- 4. Log Transaction
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
    'refund',
    v_valor_total,
    'completed',
    'refund_' || p_bet_id,
    jsonb_build_object('reason', p_reason, 'bet_id', p_bet_id),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'refund', v_valor_total
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION fn_process_refund IS 'Atomic refund processing: locks bet, updates status to reembolsado, increments user balance, logs transaction. Prevents race conditions.';
