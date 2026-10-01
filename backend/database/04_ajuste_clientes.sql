-- =====================================================
-- RICCATI PROJECT HUB
-- SPRINT 1
-- AJUSTE M02 - CLIENTES
-- =====================================================

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS observaciones TEXT;