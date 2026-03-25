-- Adiciona flag casino_only para plataformas dedicadas a cassino
-- Plataformas com casino_only=true permitem acesso publico a /home e /cassino
-- e bloqueiam rotas de loteria

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS casino_only boolean DEFAULT false;

-- Marca 44X Casino como casino_only
UPDATE platforms SET casino_only = true WHERE id = '478aa7d1-d804-42b2-aa7f-5ef976d5dfe6';
