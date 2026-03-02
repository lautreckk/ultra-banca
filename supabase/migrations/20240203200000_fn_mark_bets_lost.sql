-- Marcar apostas como perdeu em lote (evita N updates no verificar_premios)
CREATE OR REPLACE FUNCTION fn_mark_bets_lost(p_bet_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_bet_ids IS NULL OR array_length(p_bet_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'updated', 0);
  END IF;
  UPDATE apostas
  SET status = 'perdeu', updated_at = NOW()
  WHERE id = ANY(p_bet_ids)
    AND status = 'pendente';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'updated', v_updated);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
