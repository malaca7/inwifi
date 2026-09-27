-- ======================================================================
-- IN-WIFI — ESQUEMA COMPLETO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ======================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Roteadores cadastrados
CREATE TABLE IF NOT EXISTS public.routers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(60) NOT NULL,
    model VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    mac_address MACADDR,
    firmware_version VARCHAR(80),
    protocol VARCHAR(30) NOT NULL CHECK (protocol IN ('mock', 'api', 'snmp', 'ssh', 'tr069')),
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conexões / Configurações seguras de Roteadores (Credenciais criptografadas via vault ou backend)
CREATE TABLE IF NOT EXISTS public.router_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    router_id UUID NOT NULL REFERENCES public.routers(id) ON DELETE CASCADE,
    port INTEGER DEFAULT 80,
    use_https BOOLEAN DEFAULT false,
    auth_type VARCHAR(40) DEFAULT 'token', -- 'token', 'basic', 'snmp_v2c', 'snmp_v3'
    credential_vault_key VARCHAR(255), -- Referência ao secret seguro no backend
    snmp_community VARCHAR(100),
    snmp_version VARCHAR(10),
    timeout_ms INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Dispositivos Detectados na Rede
-- Identificador persistente baseado em MAC (quando disponível) ou UUID/Fingerprint
CREATE TABLE IF NOT EXISTS public.devices (
    id VARCHAR(120) PRIMARY KEY, -- ex: 'dev_e4_5f_01_a9_84_cd' ou UUID
    router_id UUID REFERENCES public.routers(id) ON DELETE SET NULL,
    mac_address MACADDR,
    current_ip INET NOT NULL,
    original_hostname VARCHAR(150),
    manufacturer VARCHAR(120) DEFAULT 'Desconhecido',
    category VARCHAR(40) DEFAULT 'unknown' CHECK (category IN ('smartphone', 'computer', 'tv', 'iot', 'gaming', 'network', 'unknown')),
    status VARCHAR(30) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'blocked', 'paused')),
    connection_band VARCHAR(20) DEFAULT '2.4GHz' CHECK (connection_band IN ('2.4GHz', '5GHz', '6GHz', 'ethernet')),
    signal_strength INTEGER DEFAULT -60, -- dBm
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    speed_limit_kbps INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Apelidos Personalizados de Dispositivos (Device Aliases)
CREATE TABLE IF NOT EXISTS public.device_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(120) NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    custom_name VARCHAR(120) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_device_alias UNIQUE (device_id)
);

-- 6. Histórico de IPs e Conexões do Dispositivo (Device Events)
CREATE TABLE IF NOT EXISTS public.device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(120) NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    event_type VARCHAR(40) NOT NULL, -- 'connect', 'disconnect', 'ip_change', 'rssi_drop', 'blocked'
    assigned_ip INET,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Eventos Gerais da Rede (Network Events)
CREATE TABLE IF NOT EXISTS public.network_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    router_id UUID REFERENCES public.routers(id) ON DELETE CASCADE,
    device_id VARCHAR(120) REFERENCES public.devices(id) ON DELETE SET NULL,
    event_type VARCHAR(60) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Estatísticas de Tráfego Agregado (Traffic Stats)
CREATE TABLE IF NOT EXISTS public.traffic_stats (
    id BIGSERIAL PRIMARY KEY,
    router_id UUID REFERENCES public.routers(id) ON DELETE CASCADE,
    device_id VARCHAR(120) REFERENCES public.devices(id) ON DELETE CASCADE,
    download_bytes BIGINT DEFAULT 0,
    upload_bytes BIGINT DEFAULT 0,
    download_speed_kbps INTEGER DEFAULT 0,
    upload_speed_kbps INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Regras de Controle de Acesso (Access Rules)
CREATE TABLE IF NOT EXISTS public.access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    router_id UUID REFERENCES public.routers(id) ON DELETE CASCADE,
    device_id VARCHAR(120) NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('block', 'pause', 'whitelist', 'speed_limit')),
    is_active BOOLEAN DEFAULT true,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Agendamentos de Acesso / Horários (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(120) NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- Array de dias [0,1,2,3,4,5,6] (0 = Domingo)
    start_time TIME NOT NULL, -- ex: '22:00:00'
    end_time TIME NOT NULL,   -- ex: '07:00:00'
    action VARCHAR(30) DEFAULT 'block' CHECK (action IN ('block', 'pause', 'speed_limit')),
    speed_limit_kbps INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Central de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(30) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'pwa_push', 'email', 'webhook')),
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Logs de Auditoria do Administrador (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID, -- Referência a auth.users(id)
    action VARCHAR(80) NOT NULL, -- 'DEVICE_BLOCK', 'DEVICE_RENAME', 'SCHEDULE_CREATE', etc.
    target_resource VARCHAR(80) NOT NULL,
    target_id VARCHAR(120),
    ip_address INET,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================================
-- ÍNDICES PARA CONSULTAS FREQUENTES E ALTA PERFORMANCE
-- ======================================================================
CREATE INDEX IF NOT EXISTS idx_devices_mac ON public.devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_current_ip ON public.devices(current_ip);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON public.devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_device_events_device_id ON public.device_events(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_events_created_at ON public.network_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_events_unread ON public.network_events(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_traffic_stats_device_time ON public.traffic_stats(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_stats_recorded_at ON public.traffic_stats(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_device_id ON public.schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ======================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================================
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de leitura/gravação restrita a administradores autenticados
CREATE POLICY "Admins have full access to routers" ON public.routers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to devices" ON public.devices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to device_aliases" ON public.device_aliases
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to network_events" ON public.network_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to traffic_stats" ON public.traffic_stats
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to access_rules" ON public.access_rules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to schedules" ON public.schedules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to notifications" ON public.notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to audit_logs" ON public.audit_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
