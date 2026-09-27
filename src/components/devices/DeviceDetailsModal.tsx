import React, { useState, useEffect } from 'react';
import { Device, RouterCapabilities } from '../../types';
import { DeviceIcon, DeviceStatusBadge } from './DeviceIcon';
import { 
  X, Copy, Check, Edit2, ShieldAlert, ShieldCheck, 
  Pause, Play, Gauge, Clock, Wifi, HardDrive, 
  ArrowDownCircle, ArrowUpCircle, Info, Activity,
  Search, Cpu, Smartphone, Laptop, Tv, HelpCircle,
  Radio, Zap, Terminal, Sparkles, AlertCircle
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { ConfirmModal } from '../common/ConfirmModal';
import { CapabilityNotice } from '../common/CapabilityNotice';
import { copyTextSafe } from '../../utils/clipboard';
import { 
  isRandomizedMac, 
  getVendorDetails, 
  getQuickNamingSuggestions, 
  getIdentificationGuide,
  testDevicePing,
  PingResult
} from '../../utils/deviceIdentifier';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'identify' | 'history' | 'qos'>('identify');
  const [speedLimitValue, setSpeedLimitValue] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Live Ping state
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      setPingResult(null);
      // Auto run ping diagnostic once modal opens
      handleRunPing(device.ip);
    }
  }, [device?.id, isOpen]);

  if (!isOpen || !device) return null;

  const vendorInfo = getVendorDetails(device.mac);
  const isRandomMac = isRandomizedMac(device.mac);
  const quickSuggestions = getQuickNamingSuggestions(device);
  const identGuide = getIdentificationGuide(device);

  const copyToClipboard = (text: string, field: string) => {
    copyTextSafe(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStartRename = () => {
    setCustomNameInput(device.customName || device.originalHostname);
    setIsEditingName(true);
  };

  const handleSaveRename = async (nameToSave?: string) => {
    const finalName = nameToSave !== undefined ? nameToSave : customNameInput;
    await networkService.renameDevice(device.id, finalName);
    setIsEditingName(false);
    onUpdated();
  };

  const handleApplySuggestion = async (suggestion: string) => {
    await handleSaveRename(suggestion);
  };

  const handleRunPing = async (ipToPing: string) => {
    setPingRunning(true);
    try {
      const res = await testDevicePing(ipToPing);
      setPingResult(res);
    } catch {
      // ignore
    } finally {
      setPingRunning(false);
    }
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
            <div className="flex items-start gap-4 min-w-0">
              <DeviceIcon
                category={device.category}
                band={device.band}
                status={device.status}
                size="lg"
              />
              <div className="min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <input
                      type="text"
                      value={customNameInput}
                      onChange={(e) => setCustomNameInput(e.target.value)}
                      placeholder="Nome amigável..."
                      className="px-3 py-1.5 bg-slate-950 border border-brand-500 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename()}
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
                    <h2 className="text-xl font-bold text-white tracking-tight truncate">
                      {device.customName || device.originalHostname}
                    </h2>
                    <button
                      onClick={handleStartRename}
                      className="p-1 text-slate-400 hover:text-brand-400 rounded-lg transition flex-shrink-0"
                      title="Renomear dispositivo com nome amigável"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <DeviceStatusBadge status={device.status} />
                  
                  {isRandomMac && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      MAC PRIVADO (Apple / Android)
                    </span>
                  )}

                  <span className="font-mono text-cyan-400 font-semibold">{device.ip}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-400">{device.mac}</span>
                </div>

                {/* 1-Click Name Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-400" />
                    Apelido rápido:
                  </span>
                  {quickSuggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleApplySuggestion(sug)}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 hover:bg-brand-600 border border-slate-700 hover:border-brand-500 text-[11px] font-medium text-slate-200 hover:text-white transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition flex-shrink-0"
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
          <div className="flex border-b border-slate-800/80 px-6 bg-slate-950/40 overflow-x-auto">
            <button
              onClick={() => setActiveTab('identify')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
                activeTab === 'identify'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4 text-brand-400" />
              Identificação & Fabricante
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
                activeTab === 'overview'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Vazão & Rede
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
                activeTab === 'history'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Histórico ({device.ipHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('qos')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
                activeTab === 'qos'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Controle de Banda
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">

            {/* TAB: IDENTIFY (CORE FEATURE) */}
            {activeTab === 'identify' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* 1. Manufacturer & Hardware Profile Card */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Fabricante & Dados OUI (IEEE)</h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Prefixo MAC: {device.mac.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {vendorInfo.country}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5">Empresa / Fabricante Registrado:</span>
                      <strong className="text-white text-sm block">{vendorInfo.vendor}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5">Tipo de Dispositivo Provável:</span>
                      <span className="text-brand-300 font-semibold block">{vendorInfo.deviceTypes}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 sm:col-span-2">
                      <span className="text-slate-400 block mb-0.5">Tipo de Endereço MAC:</span>
                      <div className="flex items-start gap-2 mt-1">
                        {isRandomMac ? (
                          <div className="space-y-1">
                            <span className="text-amber-300 font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              Endereço MAC Privado / Aleatório (Locally Administered)
                            </span>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Este aparelho está utilizando a proteção de privacidade de Wi-Fi nativa (padrão em iPhones com iOS 14+, iPads e celulares Android 10+). O endereço MAC é gerado por software para impedir rastreamento por redes comerciais.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              Endereço MAC Físico Global (Universally Administered)
                            </span>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Identificador de hardware gravado de fábrica no chip de rede do dispositivo.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Live Ping Diagnostic & Presence Tool */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Teste de Presença & Ping LAN</h3>
                        <p className="text-[11px] text-slate-400">Dispara pacote ICMP para verificar se o aparelho está acordado na rede</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRunPing(device.ip)}
                      disabled={pingRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow-sm disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${pingRunning ? 'animate-spin' : ''}`} />
                      <span>{pingRunning ? 'Testando...' : 'Testar Ping Agora'}</span>
                    </button>
                  </div>

                  {pingResult && (
                    <div className={`p-3.5 rounded-2xl border text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 ${
                      pingResult.alive 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Status no Ping:</span>
                        <strong className={`font-mono text-sm ${pingResult.alive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pingResult.alive ? 'Online & Respondendo' : 'Sem resposta (Standby)'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Latência Instantânea:</span>
                        <strong className="font-mono text-sm text-white">
                          {pingResult.latencyMs !== null ? `${pingResult.latencyMs} ms` : 'N/A'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">TTL (Fingerprint):</span>
                        <strong className="font-mono text-sm text-cyan-400">
                          {pingResult.ttl ? `TTL ${pingResult.ttl}` : 'N/A'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Sistema Operacional:</span>
                        <strong className="text-xs text-white block truncate">
                          {pingResult.osEstimate}
                        </strong>
                      </div>

                      {pingResult.hostname && (
                        <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-slate-400">Nome de Rede (Hostname NetBIOS):</span>
                          <strong className="font-mono text-white text-xs">{pingResult.hostname}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Step-by-step physical identification guide */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">{identGuide.title}</h3>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    {identGuide.steps.map((st, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{st}</p>
                      </div>
                    ))}
                  </div>

                  {identGuide.tip && (
                    <div className="p-3 rounded-xl bg-brand-950/20 border border-brand-500/30 text-xs text-brand-300 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 text-brand-400 mt-0.5" />
                      <span className="leading-relaxed">{identGuide.tip}</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: OVERVIEW */}
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
                      {device.band === 'ethernet' ? 'Cabeado (Gigabit)' : `${device.signalStrength} dBm (${device.band})`}
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
                          title="Copiar IP"
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
                          title="Copiar MAC"
                        >
                          {copiedField === 'mac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Gateway Padrão:</span>
                      <span className="font-mono text-slate-200">192.168.1.1 (ZTE)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Máscara de Sub-rede:</span>
                      <span className="font-mono text-slate-200">255.255.255.0</span>
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

            {/* TAB: HISTORY */}
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

            {/* TAB: QOS */}
            {activeTab === 'qos' && (
              <div className="space-y-4">
                {!capabilities.speedLimit ? (
                  <CapabilityNotice
                    featureName="Controle de Banda / QoS"
                    reason="O roteador ZTE ZXHN H199A opera com controle QoS por filas no firmware do gateway."
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
