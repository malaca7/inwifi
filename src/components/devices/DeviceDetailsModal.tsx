import React, { useState } from 'react';
import { Device, RouterCapabilities } from '../../types';
import { DeviceIcon, DeviceStatusBadge } from './DeviceIcon';
import { 
  X, Copy, Check, Edit2, ShieldAlert, ShieldCheck, 
  Pause, Play, Gauge, Clock, Wifi, HardDrive, 
  ArrowDownCircle, ArrowUpCircle, Info, Activity, Calendar
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { ConfirmModal } from '../common/ConfirmModal';
import { CapabilityNotice } from '../common/CapabilityNotice';
import { copyTextSafe } from '../../utils/clipboard';

interface DeviceDetailsModalProps {
  device: Device | null;
  isOpen: boolean;
  capabilities: RouterCapabilities;
  onClose: () => void;
  onUpdated: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  isOpen,
  capabilities,
  onClose,
  onUpdated
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'qos'>('overview');
  const [speedLimitValue, setSpeedLimitValue] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const copyToClipboard = (text: string, field: string) => {
    copyTextSafe(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStartRename = () => {
    setCustomNameInput(device.customName || device.originalHostname);
    setIsEditingName(true);
  };

  const handleSaveRename = async () => {
    await networkService.renameDevice(device.id, customNameInput);
    setIsEditingName(false);
    onUpdated();
  };

  const handleToggleBlock = async () => {
    setActionError(null);
    if (device.status === 'blocked') {
      const res = await networkService.unblockDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao desbloquear');
      onUpdated();
    } else {
      setShowConfirmBlock(true);
    }
  };

  const confirmBlockDevice = async () => {
    setShowConfirmBlock(false);
    const res = await networkService.blockDevice(device.id);
    if (!res.success) setActionError(res.error || 'Erro ao bloquear');
    onUpdated();
  };

  const handleTogglePause = async () => {
    setActionError(null);
    if (device.status === 'paused') {
      const res = await networkService.resumeDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao retomar conexão');
    } else {
      const res = await networkService.pauseDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao pausar conexão');
    }
    onUpdated();
  };

  const handleSaveSpeedLimit = async () => {
    setActionError(null);
    const num = speedLimitValue ? parseInt(speedLimitValue, 10) : null;
    const res = await networkService.setSpeedLimit(device.id, num);
    if (!res.success) setActionError(res.error || 'Erro ao configurar limite');
    onUpdated();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} Kbps`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-dark-surface border border-slate-800 rounded-3xl shadow-card-dark overflow-hidden flex flex-col my-auto max-h-[92vh]">
          
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <DeviceIcon
                category={device.category}
                band={device.band}
                status={device.status}
                size="lg"
              />
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={customNameInput}
                      onChange={(e) => setCustomNameInput(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-brand-500 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveRename}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {device.customName || device.originalHostname}
                    </h2>
                    <button
                      onClick={handleStartRename}
                      className="p-1 text-slate-400 hover:text-brand-400 rounded-lg transition"
                      title="Renomear dispositivo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <DeviceStatusBadge status={device.status} />
                  <span className="text-xs text-slate-400">
                    Hostname: <span className="font-mono text-slate-300">{device.originalHostname}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">
                    Fabricante: <span className="text-slate-300">{device.manufacturer}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Error alert if any */}
          {actionError && (
            <div className="p-4 mx-6 mt-4">
              <CapabilityNotice featureName="Operação de Rede" reason={actionError} />
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 px-6 bg-slate-950/40">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Visão Geral & Métricas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Histórico de Conexão ({device.ipHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('qos')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'qos'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Limite de Banda (QoS)
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Real-time traffic stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                      <span>Download Atual</span>
                    </div>
                    <div className="mt-2 text-base font-bold font-mono text-emerald-400">
                      {formatSpeed(device.currentDownloadSpeedKbps)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                      <span>Upload Atual</span>
                    </div>
                    <div className="mt-2 text-base font-bold font-mono text-cyan-400">
                      {formatSpeed(device.currentUploadSpeedKbps)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <HardDrive className="w-4 h-4 text-brand-400" />
                      <span>Total Transferido</span>
                    </div>
                    <div className="mt-2 text-base font-bold font-mono text-slate-200">
                      {formatBytes(device.totalDownloadBytes + device.totalUploadBytes)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Wifi className="w-4 h-4 text-amber-400" />
                      <span>Sinal / Banda</span>
                    </div>
                    <div className="mt-2 text-base font-bold font-mono text-slate-200">
                      {device.band === 'ethernet' ? 'Cabeado' : `${device.signalStrength} dBm`}
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Informações Técnicas de Rede
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Endereço IP:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-white">{device.ip}</span>
                        <button
                          onClick={() => copyToClipboard(device.ip, 'ip')}
                          className="text-slate-400 hover:text-white transition"
                        >
                          {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Endereço MAC:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-white">{device.mac}</span>
                        <button
                          onClick={() => copyToClipboard(device.mac, 'mac')}
                          className="text-slate-400 hover:text-white transition"
                        >
                          {copiedField === 'mac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Primeira vez visto:</span>
                      <span className="text-slate-300">
                        {new Date(device.firstSeen).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Última atividade:</span>
                      <span className="text-slate-300">
                        {new Date(device.lastSeen).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Access Control Section */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Controle de Acesso Rápido
                  </h4>

                  {!capabilities.blocking && (
                    <CapabilityNotice
                      featureName="Bloqueio de Dispositivos"
                      reason="O roteador ou adaptador atual não oferece suporte a bloqueio por endereço MAC."
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleToggleBlock}
                      disabled={!capabilities.blocking}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-md ${
                        !capabilities.blocking
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                          : device.status === 'blocked'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                      }`}
                    >
                      {device.status === 'blocked' ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Desbloquear Acesso
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          Bloquear Acesso
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleTogglePause}
                      disabled={!capabilities.pauseResume}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                        !capabilities.pauseResume
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                          : device.status === 'paused'
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {device.status === 'paused' ? (
                        <>
                          <Play className="w-4 h-4" />
                          Retomar Conexão
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pausar Temporariamente
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Histórico de IPs Atribuídos (DHCP)
                  </h4>
                  <div className="space-y-2">
                    {device.ipHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <span className="font-mono text-brand-400 font-semibold">{h.ip}</span>
                        <span className="text-slate-400">
                          {new Date(h.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Histórico de Sessões de Conexão
                  </h4>
                  <div className="space-y-2">
                    {device.connectionHistory.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                        <span className={`font-semibold ${c.type === 'connect' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {c.type === 'connect' ? '• Conexão estabelecida' : '• Desconectado da rede'}
                        </span>
                        <span className="text-slate-400">
                          {new Date(c.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qos' && (
              <div className="space-y-4">
                {!capabilities.speedLimit ? (
                  <CapabilityNotice
                    featureName="Controle de Banda / QoS"
                    reason="Este recurso não é suportado pelo roteador atual ou conector ativo."
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Configurar Limite de Download (Kbps)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Limite a taxa máxima que este dispositivo pode consumir na rede. Deixe em branco para ilimitado.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Ex: 5000 (para 5 Mbps)"
                        value={speedLimitValue}
                        onChange={(e) => setSpeedLimitValue(e.target.value)}
                        className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 w-64"
                      />
                      <button
                        onClick={handleSaveSpeedLimit}
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Aplicar Limite
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-slate-400">Atalhos rápidos:</span>
                      <button
                        onClick={() => setSpeedLimitValue('2000')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        2 Mbps
                      </button>
                      <button
                        onClick={() => setSpeedLimitValue('5000')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        5 Mbps
                      </button>
                      <button
                        onClick={() => setSpeedLimitValue('10000')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        10 Mbps
                      </button>
                      <button
                        onClick={() => setSpeedLimitValue('')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Ilimitado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">ID: {device.id}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal before blocking */}
      <ConfirmModal
        isOpen={showConfirmBlock}
        title="Bloquear Dispositivo na Rede?"
        description={`Você está prestes a cortar o acesso do aparelho "${device.customName || device.originalHostname}" (MAC: ${device.mac}, IP: ${device.ip}). O dispositivo não conseguirá navegar na internet até ser desbloqueado.`}
        confirmLabel="Sim, Bloquear Dispositivo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmBlockDevice}
        onCancel={() => setShowConfirmBlock(false)}
      />
    </>
  );
};
