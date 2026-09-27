import React, { useState } from 'react';
import { 
  Settings, Database, Shield, Check, Copy, 
  Trash2, Lock, Key
} from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { copyTextSafe } from '../utils/clipboard';

export const SettingsPage: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [pollingRate, setPollingRate] = useState('4');

  const supabaseSqlSnippet = `-- TABELAS DO IN-WIFI NO SUPABASE
CREATE TABLE public.routers (...);
CREATE TABLE public.devices (...);
CREATE TABLE public.device_aliases (...);
CREATE TABLE public.network_events (...);
CREATE TABLE public.traffic_stats (...);
CREATE TABLE public.access_rules (...);
CREATE TABLE public.schedules (...);
-- RLS HABILITADO EM TODAS AS ENTIDADES
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;`;

  const copySqlSchema = () => {
    copyTextSafe(supabaseSqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handlePurgeCache = () => {
    localStorage.removeItem('inwifi_device_aliases');
    localStorage.removeItem('inwifi_device_states');
    localStorage.removeItem('inwifi_access_schedules');
    setShowPurgeModal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-400" />
          Configurações & Banco de Dados
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ajustes operacionais do sistema, telemetria, persistência e auditoria de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Supabase Persistence Card */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Banco de Dados Supabase (Etapa 11)</h3>
                <span className="text-[11px] text-slate-400">Pronto para PostgreSQL com RLS</span>
              </div>
            </div>
            <button
              onClick={copySqlSchema}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            O script SQL completo está estruturado em <code className="text-brand-300 font-mono">supabase/schema.sql</code>, incluindo suporte a relacionamentos, índices de alto desempenho para MAC/IP e políticas Row Level Security (RLS).
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-950 font-mono text-[11px] text-slate-400 border border-slate-800 overflow-x-auto space-y-1">
            <div className="text-emerald-400 font-bold">✓ Entidades Criadas no Arquivo de Migração:</div>
            <div>• public.routers (catálogo de hardware)</div>
            <div>• public.devices (inventário com MAC indexado)</div>
            <div>• public.device_aliases (nomes persistentes)</div>
            <div>• public.network_events (auditoria de eventos)</div>
            <div>• public.traffic_stats (métricas agregadas)</div>
            <div>• public.schedules (controle de horários)</div>
          </div>
        </div>

        {/* Security & Access Policies Card */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Arquitetura de Segurança (Etapa 12)</h3>
              <span className="text-[11px] text-slate-400">Políticas de mitigação e proteção</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span><strong>Proteção de Credenciais:</strong> Nenhuma senha de roteador é persistida no cliente ou exportada na interface.</span>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span><strong>Confirmação de Destruição:</strong> Toda ação crítica de bloqueio de rede exige diálogo de confirmação explícito.</span>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Key className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span><strong>Identificadores Persistentes:</strong> Aparelhos são identificados de forma única por MAC ou ID sintetizado.</span>
            </div>
          </div>
        </div>

        {/* System Settings & Telemetry Polling */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <h3 className="text-sm font-bold text-white">Preferências do Sistema</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Taxa de Atualização da Telemetria (Polling)</label>
              <select
                value={pollingRate}
                onChange={(e) => setPollingRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              >
                <option value="2">2 segundos (Alta frequência)</option>
                <option value="4">4 segundos (Padrão recomendado)</option>
                <option value="10">10 segundos (Modo economia)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Idioma da Interface</label>
              <input
                type="text"
                disabled
                value="Português do Brasil (pt-BR)"
                className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Maintenance & Reset */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <h3 className="text-sm font-bold text-white text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Zona de Manutenção & Cache Local
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Redefinir as preferências armazenadas localmente no navegador (nomes de dispositivos renomeados, agendamentos locais e estados de bloqueio).
          </p>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition"
          >
            Limpar Dados de Simulação Locais
          </button>
        </div>

      </div>

      {/* Confirm Purge Modal */}
      <ConfirmModal
        isOpen={showPurgeModal}
        title="Redefinir Dados Locais?"
        description="Esta ação apagará todos os apelidos renomeados, estados de bloqueio e agendamentos guardados no seu navegador e recarregará os dados padrões de demonstração."
        confirmLabel="Sim, Redefinir Tudo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handlePurgeCache}
        onCancel={() => setShowPurgeModal(false)}
      />
    </div>
  );
};
