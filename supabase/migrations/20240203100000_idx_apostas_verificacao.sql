-- Índices de performance para o scraper de premiação (filtros por data_jogo, status, platform_id)
CREATE INDEX IF NOT EXISTS idx_apostas_data_jogo_status ON apostas(data_jogo, status);
CREATE INDEX IF NOT EXISTS idx_apostas_data_status_platform ON apostas(data_jogo, status, platform_id);
