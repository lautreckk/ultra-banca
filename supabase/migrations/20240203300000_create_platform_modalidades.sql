-- Migration: Create platform_modalidades table for multi-tenant odds configuration
-- Each banca can configure their own multiplicadores (odds) per modalidade

-- 1. Create the platform_modalidades table
CREATE TABLE IF NOT EXISTS platform_modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  codigo VARCHAR(100) NOT NULL,
  multiplicador NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_minimo NUMERIC(10,2) DEFAULT 1.00,
  valor_maximo NUMERIC(10,2) DEFAULT 1000.00,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique codigo per platform
  CONSTRAINT platform_modalidades_unique UNIQUE(platform_id, codigo)
);

-- 2. Add comment
COMMENT ON TABLE platform_modalidades IS 'Per-platform configuration of modalidades odds (multi-tenant). Falls back to modalidades_config for defaults.';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_modalidades_platform ON platform_modalidades(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_modalidades_codigo ON platform_modalidades(codigo);
CREATE INDEX IF NOT EXISTS idx_platform_modalidades_ativo ON platform_modalidades(platform_id, ativo) WHERE ativo = true;

-- 4. Enable RLS
ALTER TABLE platform_modalidades ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Super admins can do everything
CREATE POLICY "Super admins can manage all platform_modalidades" ON platform_modalidades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role = 'super_admin'
    )
  );

-- Platform admins can manage their platform's modalidades
CREATE POLICY "Platform admins can manage own platform_modalidades" ON platform_modalidades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.user_id = auth.uid()
      AND platform_admins.platform_id = platform_modalidades.platform_id
    )
  );

-- Authenticated users can read active modalidades for their platform
CREATE POLICY "Users can read active modalidades for their platform" ON platform_modalidades
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND ativo = true
    AND platform_id IN (
      SELECT p.platform_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- 6. Seed existing platforms with modalidades from modalidades_config
INSERT INTO platform_modalidades (platform_id, codigo, multiplicador, valor_minimo, valor_maximo, ativo, ordem)
SELECT
  p.id as platform_id,
  mc.codigo,
  mc.multiplicador,
  mc.valor_minimo,
  mc.valor_maximo,
  mc.ativo,
  mc.ordem
FROM platforms p
CROSS JOIN modalidades_config mc
WHERE mc.ativo = true
ON CONFLICT (platform_id, codigo) DO NOTHING;

-- 7. Create function to get multiplicador with fallback
CREATE OR REPLACE FUNCTION fn_get_multiplicador(
  p_platform_id UUID,
  p_codigo VARCHAR
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_multiplicador NUMERIC;
BEGIN
  -- First try platform-specific config
  SELECT multiplicador INTO v_multiplicador
  FROM platform_modalidades
  WHERE platform_id = p_platform_id
    AND codigo = p_codigo
    AND ativo = true;

  IF FOUND AND v_multiplicador > 0 THEN
    RETURN v_multiplicador;
  END IF;

  -- Fallback to global modalidades_config
  SELECT multiplicador INTO v_multiplicador
  FROM modalidades_config
  WHERE codigo = p_codigo
    AND ativo = true;

  IF FOUND THEN
    RETURN COALESCE(v_multiplicador, 0);
  END IF;

  -- Not found
  RETURN 0;
END;
$$;

-- 8. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_platform_modalidades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_modalidades_updated_at
  BEFORE UPDATE ON platform_modalidades
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_modalidades_updated_at();

-- 9. Create function to seed modalidades for new platform
CREATE OR REPLACE FUNCTION fn_seed_platform_modalidades(p_platform_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO platform_modalidades (platform_id, codigo, multiplicador, valor_minimo, valor_maximo, ativo, ordem)
  SELECT
    p_platform_id,
    mc.codigo,
    mc.multiplicador,
    mc.valor_minimo,
    mc.valor_maximo,
    mc.ativo,
    mc.ordem
  FROM modalidades_config mc
  WHERE mc.ativo = true
  ON CONFLICT (platform_id, codigo) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
