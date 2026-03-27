-- ============================================================
-- Migration: Enforce bet_max, valor_maximo, max_payout_per_bet
-- Fixes: Limites existiam no DB mas não eram validados
-- ============================================================

-- 1. Atualizar place_bet para validar limites ANTES de aceitar aposta
CREATE OR REPLACE FUNCTION public.place_bet(
  p_tipo text,
  p_modalidade text,
  p_colocacao text,
  p_palpites text[],
  p_horarios text[],
  p_loterias text[],
  p_data_jogo date,
  p_valor_unitario numeric,
  p_multiplicador numeric DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_platform_id UUID;
  v_saldo_real NUMERIC;
  v_saldo_bonus NUMERIC;
  v_saldo_total NUMERIC;
  v_debitar_real NUMERIC;
  v_debitar_bonus NUMERIC;
  v_nova_pule TEXT;
  v_aposta_id UUID;
  v_valor_total NUMERIC;
  v_qtd_combinacoes INTEGER;
  v_horario TEXT;
  v_loteria TEXT;
  v_hora_atual TIME;
  v_data_atual DATE;
  v_user_name TEXT;
  v_loteria_horario TEXT;
  v_loteria_hora TIME;
  -- Novas variáveis para limites
  v_bet_max NUMERIC;
  v_max_payout_per_bet NUMERIC;
  v_modalidade_valor_maximo NUMERIC;
  v_premio_potencial NUMERIC;
BEGIN
  -- Autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  -- Data/hora atual (Brasília)
  v_data_atual := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_hora_atual := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME;

  -- Tipos que usam datas (DD/MM/YYYY) em vez de horários (HH:MM) no campo p_horarios
  -- seninha, quininha, lotinha usam datas de sorteios futuros, não horários
  IF p_tipo NOT IN ('seninha', 'quininha', 'lotinha') THEN
    -- Validação de data passada
    IF p_data_jogo < v_data_atual THEN
      RAISE EXCEPTION 'Nao e possivel apostar em datas passadas';
    END IF;

    -- Validação de horários (se for hoje)
    IF p_data_jogo = v_data_atual THEN

      -- Validação especial para fazendinha (usa p_loterias com horários embutidos)
      IF p_tipo = 'fazendinha' THEN
        IF array_length(p_loterias, 1) IS NOT NULL AND array_length(p_loterias, 1) > 0 THEN
          FOREACH v_loteria IN ARRAY p_loterias
          LOOP
            -- Mapear loteria IDs para horários
            v_loteria_horario := CASE v_loteria
              WHEN 'lt_look_23hs' THEN '23:19'
              WHEN 'lt_nacional_23hs' THEN '22:59'
              ELSE NULL
            END;

            IF v_loteria_horario IS NOT NULL THEN
              v_loteria_hora := v_loteria_horario::TIME;

              -- Bloquear 5 minutos ANTES do sorteio
              IF v_hora_atual >= (v_loteria_hora - INTERVAL '5 minutes') THEN
                RAISE EXCEPTION 'Loteria % ja encerrou as apostas. Aposte em outra loteria.', v_loteria;
              END IF;
            END IF;
          END LOOP;
        END IF;

      -- Validação para tipos que usam horários normais (loterias, etc)
      ELSIF array_length(p_horarios, 1) IS NULL OR array_length(p_horarios, 1) = 0 THEN
        IF v_hora_atual > '21:30'::TIME THEN
          RAISE EXCEPTION 'Todos os sorteios de hoje ja encerraram. Aposte para amanha.';
        END IF;
      ELSE
        FOREACH v_horario IN ARRAY p_horarios
        LOOP
          -- Bloquear 5 minutos ANTES do sorteio
          IF v_hora_atual >= (v_horario::TIME - INTERVAL '5 minutes') THEN
            RAISE EXCEPTION 'Horario % ja encerrou as apostas. Aposte em horarios futuros.', v_horario;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF;

  -- Calcular valor total
  v_qtd_combinacoes := array_length(p_palpites, 1) *
                       GREATEST(array_length(p_horarios, 1), 1) *
                       GREATEST(array_length(p_loterias, 1), 1);
  v_valor_total := p_valor_unitario * v_qtd_combinacoes;

  -- LOCK: Buscar saldos E platform_id com FOR UPDATE
  SELECT COALESCE(saldo, 0), COALESCE(saldo_bonus, 0), nome, platform_id
  INTO v_saldo_real, v_saldo_bonus, v_user_name, v_platform_id
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_saldo_real IS NULL THEN
    RAISE EXCEPTION 'Perfil nao encontrado';
  END IF;

  IF v_platform_id IS NULL THEN
    RAISE EXCEPTION 'Usuario sem plataforma associada';
  END IF;

  -- ============================================================
  -- VALIDAÇÃO DE LIMITES (novo)
  -- ============================================================

  -- Buscar limites da plataforma
  SELECT COALESCE(bet_max, 10000), COALESCE(max_payout_per_bet, 50000)
  INTO v_bet_max, v_max_payout_per_bet
  FROM platforms
  WHERE id = v_platform_id;

  -- 1. Validar valor_unitario contra bet_max da plataforma
  IF p_valor_unitario > v_bet_max THEN
    RAISE EXCEPTION 'Valor unitario R$ % excede o limite maximo de R$ % por aposta.',
      p_valor_unitario, v_bet_max;
  END IF;

  -- 2. Validar valor_unitario contra valor_maximo da modalidade
  SELECT valor_maximo INTO v_modalidade_valor_maximo
  FROM platform_modalidades
  WHERE platform_id = v_platform_id
    AND codigo = p_modalidade
    AND ativo = true
  LIMIT 1;

  IF v_modalidade_valor_maximo IS NOT NULL AND p_valor_unitario > v_modalidade_valor_maximo THEN
    RAISE EXCEPTION 'Valor unitario R$ % excede o limite de R$ % para esta modalidade.',
      p_valor_unitario, v_modalidade_valor_maximo;
  END IF;

  -- 3. Validar premio potencial contra max_payout_per_bet
  v_premio_potencial := p_valor_unitario * p_multiplicador;
  IF v_premio_potencial > v_max_payout_per_bet THEN
    RAISE EXCEPTION 'Premio potencial R$ % excede o limite maximo de R$ % por aposta. Reduza o valor.',
      v_premio_potencial, v_max_payout_per_bet;
  END IF;

  -- ============================================================
  -- FIM VALIDAÇÃO DE LIMITES
  -- ============================================================

  -- Calcular saldo total disponível
  v_saldo_total := v_saldo_real + v_saldo_bonus;

  -- Validar saldo total
  IF v_saldo_total < v_valor_total THEN
    RAISE EXCEPTION 'Saldo insuficiente. Necessario: R$ %, Disponivel: R$ %',
      v_valor_total, v_saldo_total;
  END IF;

  -- LÓGICA DE DÉBITO: Primeiro do real, depois do bônus
  IF v_saldo_real >= v_valor_total THEN
    v_debitar_real := v_valor_total;
    v_debitar_bonus := 0;
  ELSE
    v_debitar_real := v_saldo_real;
    v_debitar_bonus := v_valor_total - v_saldo_real;
  END IF;

  -- Gerar código da Pule
  v_nova_pule := LPAD(floor(random() * 900000000 + 100000000)::TEXT, 9, '0');

  -- DÉBITO: Atualizar ambos os saldos
  UPDATE public.profiles
  SET
    saldo = saldo - v_debitar_real,
    saldo_bonus = saldo_bonus - v_debitar_bonus
  WHERE id = v_user_id;

  -- Inserir aposta COM platform_id
  INSERT INTO public.apostas (
    user_id, platform_id, pule, tipo, modalidade, colocacao, palpites, horarios,
    loterias, data_jogo, valor_unitario, valor_total, multiplicador,
    status, created_at
  ) VALUES (
    v_user_id, v_platform_id, v_nova_pule, p_tipo, p_modalidade, p_colocacao, p_palpites,
    p_horarios, p_loterias, p_data_jogo, p_valor_unitario, v_valor_total,
    p_multiplicador, 'pendente', NOW()
  ) RETURNING id INTO v_aposta_id;

  -- Inserir log de auditoria BET_PLACED
  INSERT INTO public.audit_logs (actor_id, action, entity, details, ip_address, location, created_at)
  VALUES (
    v_user_id,
    'BET_PLACED',
    'bet:' || v_aposta_id,
    jsonb_build_object(
      'pule', v_nova_pule,
      'valor_total', v_valor_total,
      'valor_unitario', p_valor_unitario,
      'modalidade', p_modalidade,
      'tipo', p_tipo,
      'colocacao', p_colocacao,
      'data_jogo', p_data_jogo,
      'horarios', p_horarios,
      'loterias', p_loterias,
      'palpites_count', array_length(p_palpites, 1),
      'debitado_real', v_debitar_real,
      'debitado_bonus', v_debitar_bonus,
      'user_name', v_user_name,
      'platform_id', v_platform_id,
      'bet_max', v_bet_max,
      'max_payout_per_bet', v_max_payout_per_bet,
      'premio_potencial', v_premio_potencial,
      'timestamp', NOW()
    ),
    'rpc',
    jsonb_build_object('city', 'RPC', 'region', 'Supabase', 'country', 'BR'),
    NOW()
  );

  -- Retornar sucesso com ambos os saldos
  RETURN jsonb_build_object(
    'success', true,
    'pule', v_nova_pule,
    'aposta_id', v_aposta_id,
    'valor_total', v_valor_total,
    'saldo_restante', v_saldo_real - v_debitar_real,
    'saldo_bonus_restante', v_saldo_bonus - v_debitar_bonus,
    'debitado_real', v_debitar_real,
    'debitado_bonus', v_debitar_bonus
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- 2. Atualizar verificar_apostas para aplicar cap de max_payout_per_bet
CREATE OR REPLACE FUNCTION public.verificar_apostas(
  p_data date DEFAULT CURRENT_DATE,
  p_horario character varying DEFAULT NULL::character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  aposta RECORD;
  resultado RECORD;
  palpite VARCHAR;
  premio VARCHAR;
  premios VARCHAR[];
  posicoes INT[];
  i INT;
  j INT;
  ganhou BOOLEAN;
  posicao_match INT;
  premio_numero VARCHAR;
  premio_calculado NUMERIC;
  total_verificadas INT := 0;
  total_premiadas INT := 0;
  total_perderam INT := 0;
  total_creditos NUMERIC := 0;
  palpite_grupo INT;
  premio_grupo INT;
  horario_aposta VARCHAR;
  modalidade_upper VARCHAR;
  subloteria_id VARCHAR;
  aposta_banca VARCHAR;
  aposta_loteria VARCHAR;
  -- Nova variável para cap
  v_max_payout NUMERIC;
BEGIN
  FOR aposta IN
    SELECT a.*, p.saldo as user_saldo
    FROM apostas a
    JOIN profiles p ON p.id = a.user_id
    WHERE a.data_jogo = p_data
      AND a.status IN ('pendente', 'confirmada')
  LOOP
    IF aposta.loterias IS NOT NULL AND array_length(aposta.loterias, 1) > 0 THEN
      subloteria_id := aposta.loterias[1];
      aposta_banca := map_subloteria_to_banca(subloteria_id);
      aposta_loteria := map_subloteria_to_loteria(subloteria_id);
    ELSE
      subloteria_id := NULL;
      aposta_banca := NULL;
      aposta_loteria := NULL;
    END IF;

    -- Buscar max_payout_per_bet da plataforma da aposta
    SELECT COALESCE(plt.max_payout_per_bet, 50000)
    INTO v_max_payout
    FROM platforms plt
    WHERE plt.id = aposta.platform_id;

    IF v_max_payout IS NULL THEN
      v_max_payout := 50000;
    END IF;

    FOREACH horario_aposta IN ARRAY aposta.horarios
    LOOP
      IF p_horario IS NOT NULL AND horario_aposta != p_horario THEN
        CONTINUE;
      END IF;

      SELECT * INTO resultado
      FROM resultados r
      WHERE r.data = p_data
        AND r.horario = horario_aposta
        AND (aposta_banca IS NULL OR r.banca = aposta_banca)
        AND (aposta_loteria IS NULL OR r.loteria = aposta_loteria)
      LIMIT 1;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      premios := ARRAY[
        resultado.premio_1,
        resultado.premio_2,
        resultado.premio_3,
        resultado.premio_4,
        resultado.premio_5,
        resultado.premio_6,
        resultado.premio_7
      ];

      CASE aposta.colocacao
        WHEN '1', '1_premio' THEN posicoes := ARRAY[1];
        WHEN '2', '2_premio' THEN posicoes := ARRAY[2];
        WHEN '3', '3_premio' THEN posicoes := ARRAY[3];
        WHEN '4', '4_premio' THEN posicoes := ARRAY[4];
        WHEN '5', '5_premio' THEN posicoes := ARRAY[5];
        WHEN '6', '6_premio' THEN posicoes := ARRAY[6];
        WHEN '7', '7_premio' THEN posicoes := ARRAY[7];
        WHEN '1_5_premio', '1-5', '1_ao_5' THEN posicoes := ARRAY[1,2,3,4,5];
        WHEN '1_6_premio' THEN posicoes := ARRAY[1,2,3,4,5,6];
        WHEN '1_7_premio' THEN posicoes := ARRAY[1,2,3,4,5,6,7];
        WHEN '1_10_premio' THEN posicoes := ARRAY[1,2,3,4,5,6,7];
        WHEN '1_e_1_5_premio' THEN posicoes := ARRAY[1,2,3,4,5];
        WHEN '1_3_premio', '1-3' THEN posicoes := ARRAY[1,2,3];
        WHEN '2_5_premio' THEN posicoes := ARRAY[2,3,4,5];
        WHEN '2_6_premio' THEN posicoes := ARRAY[2,3,4,5,6];
        WHEN '2_7_premio' THEN posicoes := ARRAY[2,3,4,5,6,7];
        WHEN '2_10_premio' THEN posicoes := ARRAY[2,3,4,5,6,7];
        WHEN '3_5_premio' THEN posicoes := ARRAY[3,4,5];
        WHEN '3_6_premio' THEN posicoes := ARRAY[3,4,5,6];
        WHEN '3_7_premio' THEN posicoes := ARRAY[3,4,5,6,7];
        WHEN '4_5_premio' THEN posicoes := ARRAY[4,5];
        WHEN '4_6_premio' THEN posicoes := ARRAY[4,5,6];
        WHEN '4_7_premio' THEN posicoes := ARRAY[4,5,6,7];
        WHEN '5_6_premio' THEN posicoes := ARRAY[5,6];
        WHEN '5_7_premio' THEN posicoes := ARRAY[5,6,7];
        WHEN '6_7_premio' THEN posicoes := ARRAY[6,7];
        WHEN '8_10_premio' THEN posicoes := ARRAY[1,2,3,4,5,6,7];
        WHEN '9_10_premio' THEN posicoes := ARRAY[1,2,3,4,5,6,7];
        WHEN '10_premio' THEN posicoes := ARRAY[1,2,3,4,5,6,7];
        ELSE posicoes := ARRAY[1,2,3,4,5];
      END CASE;

      ganhou := FALSE;
      modalidade_upper := UPPER(aposta.modalidade);

      FOREACH palpite IN ARRAY aposta.palpites
      LOOP
        FOREACH i IN ARRAY posicoes
        LOOP
          premio := premios[i];

          IF premio IS NULL OR premio = '' THEN
            CONTINUE;
          END IF;

          CASE
            WHEN modalidade_upper IN ('MILHAR', 'M', 'MILHAR_CT', 'MILHAR_INV', 'MILHAR_INV_5D', 'MILHAR_INV_6D', 'MILHAR_INV_7D', 'MILHAR_INV_8D', 'MILHAR_INV_9D', 'MILHAR_INV_10D') THEN
              IF RIGHT(premio, 4) = RIGHT(palpite, 4) THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;

            WHEN modalidade_upper IN ('CENTENA', 'C', 'CENTENA_INV', 'CENTENA_ESQUERDA', 'CENTENA_3X', 'CENTENA_INV_4D', 'CENTENA_INV_5D', 'CENTENA_INV_6D', 'CENTENA_INV_7D', 'CENTENA_INV_8D', 'CENTENA_INV_ESQ') THEN
              IF RIGHT(premio, 3) = RIGHT(palpite, 3) THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;

            WHEN modalidade_upper IN ('DEZENA', 'D', 'DEZENA_ESQ', 'DEZENA_MEIO') THEN
              IF RIGHT(premio, 2) = RIGHT(palpite, 2) THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;

            WHEN modalidade_upper IN ('GRUPO', 'G', 'GRUPO_ESQ', 'GRUPO_MEIO') THEN
              premio_grupo := numero_to_grupo(premio);
              IF LENGTH(palpite) <= 2 AND palpite ~ '^\d+$' THEN
                palpite_grupo := palpite::INT;
              ELSE
                palpite_grupo := numero_to_grupo(palpite);
              END IF;

              IF premio_grupo = palpite_grupo THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;

            WHEN modalidade_upper IN ('UNIDADE', 'U') THEN
              IF RIGHT(premio, 1) = RIGHT(palpite, 1) THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;

            ELSE
              IF premio = palpite THEN
                ganhou := TRUE;
                posicao_match := i;
                premio_numero := premio;
              END IF;
          END CASE;

          EXIT WHEN ganhou;
        END LOOP;

        EXIT WHEN ganhou;
      END LOOP;

      IF ganhou THEN
        premio_calculado := aposta.valor_unitario * aposta.multiplicador;

        -- CAP: Limitar premio ao max_payout_per_bet da plataforma
        IF premio_calculado > v_max_payout THEN
          premio_calculado := v_max_payout;
        END IF;

        UPDATE apostas
        SET status = 'premiada',
            premio_valor = premio_calculado
        WHERE id = aposta.id;

        -- FIX: Lock row + GUC flag antes de creditar saldo
        PERFORM saldo FROM profiles WHERE id = aposta.user_id FOR UPDATE;
        PERFORM set_config('app.allow_balance_update', 'on', true);

        UPDATE profiles
        SET saldo = saldo + premio_calculado
        WHERE id = aposta.user_id;

        PERFORM set_config('app.allow_balance_update', 'off', true);

        UPDATE ultimo_ganhador
        SET valor = premio_calculado,
            data_hora = NOW()
        WHERE platform_id = aposta.platform_id;

        INSERT INTO verificacao_apostas (
          aposta_id, resultado_id, palpite, premio_posicao,
          premio_numero, ganhou, premio_calculado
        ) VALUES (
          aposta.id, resultado.id, palpite, posicao_match,
          premio_numero, TRUE, premio_calculado
        );

        total_premiadas := total_premiadas + 1;
        total_creditos := total_creditos + premio_calculado;
      ELSE
        IF (
          SELECT COUNT(DISTINCT r.horario) = array_length(aposta.horarios, 1)
          FROM resultados r
          WHERE r.data = p_data
            AND r.horario = ANY(aposta.horarios)
            AND (aposta_banca IS NULL OR r.banca = aposta_banca)
            AND (aposta_loteria IS NULL OR r.loteria = aposta_loteria)
        ) THEN
          UPDATE apostas
          SET status = 'perdeu'
          WHERE id = aposta.id;

          total_perderam := total_perderam + 1;
        END IF;
      END IF;

      total_verificadas := total_verificadas + 1;

      EXIT WHEN ganhou;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'data', p_data,
    'horario', p_horario,
    'total_verificadas', total_verificadas,
    'total_premiadas', total_premiadas,
    'total_perderam', total_perderam,
    'total_creditos', total_creditos,
    'executado_em', NOW()
  );
END;
$function$;
