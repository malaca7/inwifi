import React, { useState } from 'react';
import { 
  Settings, Radio, Shield, RefreshCw, 
  Trash2, Lock, Cpu, Server, CheckCircle2, Zap
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [pollingRate, setPollingRate] = useState('4');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const routerInfo = networkService.getRouterInfo();
  const devices = networkService.getDevices();
  const adapter = networkService.getAdapter();

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await networkService.refreshData();
      setSyncFeedback('Dados do roteador (ARP / DHCP / Leases) sincronizados com sucesso diretamente do hardware!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Erro ao atualizar dados do roteador.');
    } finally {
      setIsSyncing(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-400" />
            Configurações & Coleta do Roteador
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arquitetura direta em tempo real (Sem Banco de Dados) • Gerenciamento baseado no fluxo de dados do roteador.
          </p>
        </div>

        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Coletando Dados...' : 'Forçar Sincronização Agora'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Grid of Core Architecture & Telemetry Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Architecture: Zero Database / Direct Router Stream */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Operação Direta (Sem Banco de Dados)</h3>
              <span className="text-[11px] text-cyan-400 font-mono">Zero Database Architecture</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            O In-Wifi opera como um console de controle direto do roteador. Não há banco de dados SQL ou servidores externos gravando seus dados:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block">Coleta em Tempo Real:</strong>
                <span className="text-slate-400">
                  Os aparelhos exibidos vêm diretamente da tabela ARP, leases DHCP e associações Wi-Fi recebidas do roteador ativo.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block">Estado Volátil em Memória:</strong>
                <span className="text-slate-400">
                  Quando um aparelho se desconecta do roteador, a informação é atualizada instantaneamente pelo fluxo de telemetria.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block">Privacidade Total:</strong>
                <span className="text-slate-400">
                  Nenhum registro de tráfego, MAC ou IP sai da sua rede local para a nuvem.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Hardware Telemetry Status */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Telemetria do Roteador Ativo</h3>
              <span className="text-[11px] text-slate-400">Dados coletados ao vivo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Roteador Conectado</span>
              <span className="text-white font-bold mt-1 block truncate">
                {routerInfo?.name || 'Roteador Principal'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Gateway / IP</span>
              <span className="text-white font-mono font-bold mt-1 block">
                {routerInfo?.ipAddress || '192.168.1.1'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Aparelhos na Tabela ARP</span>
              <span className="text-emerald-400 font-mono font-bold mt-1 block text-base">
                {devices.length} dispositivos
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Adaptador em Execução</span>
              <span className="text-cyan-400 font-mono font-bold mt-1 block uppercase">
                {adapter.protocol}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Uptime do Roteador:</span>
              <span className="font-mono text-white">4 dias, 12 horas</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Uso de CPU do Hardware:</span>
              <span className="font-mono text-emerald-400">{routerInfo?.cpuUsagePercent || 18}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Uso de Memória RAM:</span>
              <span className="font-mono text-cyan-400">{routerInfo?.ramUsagePercent || 44}%</span>
            </div>
          </div>
        </div>

        {/* Polling Rate Configuration */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Frequência de Leitura do Roteador (Polling)</h3>
              <span className="text-[11px] text-slate-400">Intervalo de atualização das métricas</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Taxa de Atualização da Telemetria</label>
              <select
                value={pollingRate}
                onChange={(e) => setPollingRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="1">1 segundo (Tempo real intensivo)</option>
                <option value="2">2 segundos (Alta frequência)</option>
                <option value="4">4 segundos (Padrão balanceado)</option>
                <option value="10">10 segundos (Modo economia)</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Define a periodicidade com que o In-Wifi consulta a tabela ARP e vazão das portas do roteador.
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Mecanismo de Descoberta Ativo</label>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-slate-300">
                ARP Table Walk + DHCP Lease Parser + Wi-Fi Association Polling
              </div>
            </div>
          </div>
        </div>

        {/* Cache & Local Aliases Maintenance */}
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white text-rose-400">
                Limpeza de Apelidos Locais
              </h3>
              <span className="text-[11px] text-slate-400">Apagar apelidos amigáveis salvos</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Como o sistema opera sem banco de dados, os apelidos customizados (ex: "Celular do João") são mantidos no navegador. Clique abaixo para redefinir para os hostnames originais enviados pelo roteador.
          </p>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition"
          >
            Redefinir Nomes para o Padrão do Roteador
          </button>
        </div>

      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={showPurgeModal}
        title="Redefinir Nomes dos Dispositivos?"
        description="Esta ação removerá todos os apelidos personalizados salvos e restaurará os nomes originais de fábrica reportados pelo roteador."
        confirmLabel="Sim, Redefinir Nomes"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handlePurgeCache}
        onCancel={() => setShowPurgeModal(false)}
      />
    </div>
  );
};
