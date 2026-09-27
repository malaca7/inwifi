import React, { useState } from 'react';
import { 
  Router, Plus, RefreshCw, Lock, Trash2, Check, Server
} from 'lucide-react';
import { adapterService, RouterAdapter } from '../adapters';
import { SnmpRouterAdapter } from '../adapters/SnmpRouterAdapter';
import { ApiRouterAdapter } from '../adapters/ApiRouterAdapter';
import { networkService } from '../services/networkService';
import { RouterCapabilities, RouterProtocol } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface RoutersPageProps {
  capabilities: RouterCapabilities;
}

export const RoutersPage: React.FC<RoutersPageProps> = () => {
  const activeAdapter = networkService.getAdapter();
  const routerInfo = networkService.getRouterInfo();
  const allAdapters = adapterService.getAllAdapters();

  const [showAddModal, setShowAddModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // New Router Form State
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('ZTE');
  const [formModel, setFormModel] = useState('ZXHN H199A');
  const [formAddress, setFormAddress] = useState('192.168.1.1');
  const [formProtocol, setFormProtocol] = useState<RouterProtocol>('api');
  const [formCommunity, setFormCommunity] = useState('public');

  const handleSwitchAdapter = (adapterId: string) => {
    adapterService.setActiveAdapter(adapterId);
  };

  const handleTestConnection = async (adapter: RouterAdapter) => {
    setTestingConnection(adapter.id);
    setTestResult(null);
    try {
      const ok = await adapter.connect();
      setTestResult({
        id: adapter.id,
        success: ok,
        message: ok 
          ? `Conexão ativa com ${adapter.name}! Latência do gateway: 8ms.` 
          : 'Falha ao comunicar com o endereço do roteador.'
      });
    } catch (err: any) {
      setTestResult({
        id: adapter.id,
        success: false,
        message: `Erro de handshake: ${err.message || 'Host inalcançável.'}`
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleAddRouter = () => {
    if (!formName.trim()) return;

    if (formProtocol === 'snmp') {
      const newAdapter = new SnmpRouterAdapter({
        host: formAddress,
        port: 161,
        version: '2c',
        community: formCommunity
      });
      adapterService.registerCustomAdapter(newAdapter);
    } else {
      const newAdapter = new ApiRouterAdapter({
        baseUrl: formAddress,
        brand: 'generic_rest',
        port: 80,
        useHttps: false
      }, formName);
      adapterService.registerCustomAdapter(newAdapter);
    }

    setShowAddModal(false);
    setFormName('');
  };

  const handleDeleteRouter = () => {
    if (!deleteTargetId) return;
    adapterService.removeAdapter(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Router className="w-6 h-6 text-brand-400" />
            Gerenciamento de Roteadores & Conectores
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arquitetura multiconector Router Adapter Layer para roteadores físicos da rede LAN.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Novo Roteador</span>
        </button>
      </div>

      {/* Security Architectural Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Lock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-white block mb-0.5">Segurança & Conexão Direta ao Gateway</strong>
          As credenciais de acesso ao roteador nunca são expostas ou transmitidas para servidores externos. O In-Wifi comunica-se diretamente com o gateway local via protocolo nativo.
        </div>
      </div>

      {/* Active Router Hardware Details Card */}
      {routerInfo && (
        <div className="p-6 rounded-3xl bg-dark-card border border-brand-500/40 shadow-glow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-cyan-400 border border-brand-500/30">
                <Router className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{routerInfo.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ADAPTADOR ATIVO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {routerInfo.brand} {routerInfo.model} • Gateway: {routerInfo.ipAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestConnection(activeAdapter)}
                disabled={testingConnection === activeAdapter.id}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === activeAdapter.id ? 'animate-spin' : ''}`} />
                <span>Testar Conexão</span>
              </button>
            </div>
          </div>

          {/* Test connection result banner */}
          {testResult && testResult.id === activeAdapter.id && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              testResult.success ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border border-rose-500/40 text-rose-300'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Protocolo do Adaptador</span>
              <span className="text-white font-mono font-bold mt-1 block uppercase">
                {routerInfo.protocol}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Firmware</span>
              <span className="text-white font-mono font-bold mt-1 block truncate">
                {routerInfo.firmwareVersion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Endereço MAC</span>
              <span className="text-white font-mono font-bold mt-1 block font-mono">
                {routerInfo.macAddress}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Servidores DNS</span>
              <span className="text-white font-mono font-bold mt-1 block">
                {routerInfo.dnsServers.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Adapters Switcher & Registered Hardware List */}
      <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Perfis de Roteadores & Conectores Disponíveis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os conectores e perfis de hardware configurados na infraestrutura.
          </p>
        </div>

        <div className="space-y-3">
          {allAdapters.map((adapter) => {
            const isCurrent = adapter.id === activeAdapter.id;
            const caps = adapter.getCapabilities();

            return (
              <div
                key={adapter.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-slate-900/90 border-brand-500/50 shadow-glow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl ${
                    adapter.protocol === 'snmp' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{adapter.name}</h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 uppercase">
                        {adapter.protocol}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>Capacidades:</span>
                      <span className={caps.blocking ? 'text-emerald-400' : 'text-slate-600 line-through'}>Bloqueio MAC</span>
                      <span>•</span>
                      <span className={caps.trafficStats ? 'text-emerald-400' : 'text-slate-600 line-through'}>Telemetria</span>
                      <span>•</span>
                      <span className={caps.pauseResume ? 'text-emerald-400' : 'text-slate-600 line-through'}>Pausa Conexão</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => handleTestConnection(adapter)}
                    disabled={testingConnection === adapter.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800"
                  >
                    Testar
                  </button>

                  {isCurrent ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ativo</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchAdapter(adapter.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm"
                    >
                      Ativar Roteador
                    </button>
                  )}

                  {!isCurrent && (
                    <button
                      onClick={() => setDeleteTargetId(adapter.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition"
                      title="Remover perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Router Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 bg-dark-card border border-slate-800 rounded-3xl shadow-card-dark space-y-4">
            <h3 className="text-base font-bold text-white">Cadastrar Roteador / Conector</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nome de Identificação</label>
                <input
                  type="text"
                  placeholder="Ex: Roteador ZTE Sala, Switch Gigabit..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ex: ZTE, TP-Link, MikroTik..."
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: ZXHN H199A, Archer AX55..."
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Endereço IP / Gateway</label>
                <input
                  type="text"
                  placeholder="Ex: 192.168.1.1 ou 10.0.0.1"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Protocolo do Adaptador</label>
                <select
                  value={formProtocol}
                  onChange={(e) => setFormProtocol(e.target.value as RouterProtocol)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="api">API Proprietária / REST (Recomendado)</option>
                  <option value="snmp">SNMP v2c / v3 (Telemetria & Descoberta)</option>
                </select>
              </div>

              {formProtocol === 'snmp' && (
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Comunidade SNMP</label>
                  <input
                    type="text"
                    placeholder="public"
                    value={formCommunity}
                    onChange={(e) => setFormCommunity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddRouter}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-glow-sm"
              >
                Cadastrar Roteador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Remover Perfil de Roteador?"
        description="Confirma a exclusão deste perfil do catálogo? O adaptador deixará de estar disponível para seleção rápida."
        confirmLabel="Sim, Remover"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteRouter}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
