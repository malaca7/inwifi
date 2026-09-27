import React, { useState, useEffect } from 'react';
import { Device, DeviceBand, RouterCapabilities } from '../../types';
import { DeviceIcon, DeviceStatusBadge } from './DeviceIcon';
import { 
  X, Check, Edit2, ShieldAlert, ShieldCheck, 
  Pause, Play, Wifi, HardDrive, 
  ArrowDownCircle, ArrowUpCircle, Info, Activity,
  Search, Cpu, HelpCircle,
  Radio, Zap, Terminal, Sparkles,
  Power, Server, FileText, CheckCircle2, Cable, Copy
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
  PingResult,
  getBrandBadge
} from '../../utils/deviceIdentifier';

interface DeviceDetailsModalProps {
  device: Device | null;
  isOpen: boolean;
  capabilities: RouterCapabilities;
  onClose: () => void;
  onUpdated: () => void;
}

const COMMON_PORT_DESCRIPTIONS: Record<number, string> = {
  21: 'FTP (Transferência de Arquivos)',
  22: 'SSH (Terminal Remoto Seguro)',
  23: 'Telnet',
  53: 'DNS (Servidor de Nomes)',
  80: 'HTTP (Servidor Web / Interface)',
  135: 'RPC (Microsoft Remote Procedure)',
  139: 'NetBIOS (Rede Windows)',
  443: 'HTTPS (Web Criptografado)',
  445: 'SMB (Compartilhamento de Pastas Windows)',
  3389: 'RDP (Área de Trabalho Remota)',
  5000: 'UPnP / Synology / Docker',
  5173: 'Vite Dev Server',
  7000: 'AirPlay (Apple Cast)',
  8008: 'Google Cast / Chromecast',
  8080: 'HTTP Proxy / Web Alternativo',
  8443: 'HTTPS Alternativo'
};

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
  const [activeTab, setActiveTab] = useState<'identify' | 'tools' | 'config' | 'access' | 'traffic'>('identify');
  
  // Admin Notes & Owner state
  const [ownerInput, setOwnerInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Live Ping state
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  // Port Scan state
  const [portScanRunning, setPortScanRunning] = useState(false);
  const [portScanResults, setPortScanResults] = useState<{ openPorts: number[]; portsScanned: number } | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  useEffect(() => {
    if (device && isOpen) {
      setPingResult(null);
      setPortScanResults(null);
      setActionSuccess(null);
      setActionError(null);
      setOwnerInput(device.ownerName || '');
      setNotesInput(device.notes || '');
      // Auto run ping diagnostic once modal opens
      handleRunPing(device.ip);
    }
  }, [device?.id, isOpen]);

  if (!isOpen || !device) return null;

  const vendorInfo = getVendorDetails(device.mac);
  const isRandomMac = isRandomizedMac(device.mac);
  const brandBadge = getBrandBadge(device.brand || device.manufacturer);
  const quickSuggestions = getQuickNamingSuggestions(device);
  const identGuide = getIdentificationGuide(device);

  const showSuccessFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

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
    showSuccessFeedback('Identificação atualizada!');
  };

  const handleApplySuggestion = async (suggestion: string) => {
    await handleSaveRename(suggestion);
  };

  const handleRunPortScan = async () => {
    setPortScanRunning(true);
    setPortScanResults(null);
    try {
      const res = await networkService.scanDevicePorts(device.id);
      setPortScanResults(res);
      showSuccessFeedback(`Varredura concluída: ${res.openPorts.length} porta(s) aberta(s) encontrada(s).`);
    } catch {
      setActionError('Falha ao escanear portas do dispositivo.');
    } finally {
      setPortScanRunning(false);
    }
  };

  const handleSendWakeOnLan = async () => {
    const res = await networkService.sendWakeOnLan(device.id);
    if (res.success) {
      showSuccessFeedback(res.message || 'Pacote mágico Wake-on-LAN enviado!');
    } else {
      setActionError(res.error || 'Erro ao enviar Wake-on-LAN.');
    }
  };

  const handleKickDevice = async () => {
    if (device.isGateway) {
      setActionError('O Roteador Gateway Principal não pode ser desconectado da própria rede.');
      return;
    }
    const res = await networkService.kickDevice(device.id);
    if (res.success) {
      showSuccessFeedback(`Quadro de desconexão enviado. ${device.customName || device.originalHostname} forçado a reconectar.`);
      onUpdated();
    } else {
      setActionError(res.error || 'Erro ao expulsar aparelho do Wi-Fi.');
    }
  };

  const handleToggleStaticIp = async () => {
    const newStatus = !device.isStaticIp;
    const res = await networkService.setStaticIp(device.id, newStatus);
    if (res.success) {
      showSuccessFeedback(newStatus ? `IP ${device.ip} fixado permanentemente no DHCP!` : `Reserva estática liberada.`);
      onUpdated();
    } else {
      setActionError(res.error || 'Erro ao alterar IP estático.');
    }
  };

  const handleSetPriority = async (p: 'high' | 'normal' | 'low') => {
    const res = await networkService.setTrafficPriority(device.id, p);
    if (res.success) {
      showSuccessFeedback(`Prioridade QoS atualizada para: ${p === 'high' ? 'ALTA (Gamer/Streaming)' : p === 'normal' ? 'NORMAL' : 'BAIXA'}.`);
      onUpdated();
    }
  };

  const handleSetBand = async (b: DeviceBand) => {
    const success = await networkService.setDeviceBand(device.id, b);
    if (success) {
      showSuccessFeedback(`Tipo de conexão atualizado para: ${b === 'ethernet' ? 'Cabo LAN' : `Wi-Fi ${b}`}.`);
      onUpdated();
    }
  };

  const handleSaveNotes = async () => {
    await networkService.setDeviceNotes(device.id, notesInput, ownerInput);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
    onUpdated();
    showSuccessFeedback('Notas e proprietário salvos no sistema!');
  };

  const handleToggleBlock = async () => {
    setActionError(null);
    if (device.isGateway) {
      setActionError('O Roteador Gateway Principal não pode ser bloqueado.');
      return;
    }
    if (device.status === 'blocked') {
      const res = await networkService.unblockDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao desbloquear');
      else showSuccessFeedback('Dispositivo liberado no roteador.');
      onUpdated();
    } else {
      setShowConfirmBlock(true);
    }
  };

  const confirmBlockDevice = async () => {
    setShowConfirmBlock(false);
    if (device.isGateway) {
      setActionError('O Roteador Gateway Principal não pode ser bloqueado.');
      return;
    }
    const res = await networkService.blockDevice(device.id);
    if (!res.success) setActionError(res.error || 'Erro ao bloquear');
    else showSuccessFeedback('Dispositivo bloqueado no roteador.');
    onUpdated();
  };

  const handleTogglePause = async () => {
    setActionError(null);
    if (device.isGateway) {
      setActionError('A conexão do Roteador Gateway Principal não pode ser pausada.');
      return;
    }
    if (device.status === 'paused') {
      const res = await networkService.resumeDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao retomar conexão');
      else showSuccessFeedback('Conexão retomada.');
    } else {
      const res = await networkService.pauseDevice(device.id);
      if (!res.success) setActionError(res.error || 'Erro ao pausar conexão');
      else showSuccessFeedback('Conexão temporariamente pausada.');
    }
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-dark-surface border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-card-dark overflow-hidden flex flex-col my-0 sm:my-auto max-h-[92vh]">
          
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
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white tracking-tight truncate">
                        {device.customName || device.model || device.originalHostname}
                      </h2>
                      <button
                        onClick={handleStartRename}
                        className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg transition flex-shrink-0"
                        title="Renomear dispositivo com nome amigável"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                        {device.brand || brandBadge.name}
                      </span>
                      {device.model && (
                        <span className="text-cyan-300 font-semibold text-xs sm:text-sm">
                          {device.model}
                        </span>
                      )}
                      {device.customName && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({device.originalHostname})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <DeviceStatusBadge status={device.status} />
                  
                  {device.isGateway && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      GATEWAY HOST • ROTEADOR CENTRAL
                    </span>
                  )}

                  {isRandomMac && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      MAC PRIVADO (Apple / Android)
                    </span>
                  )}

                  {device.isStaticIp && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      IP FIXO DHCP
                    </span>
                  )}

                  {device.priority === 'high' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      GAMER / ALTA PRIORIDADE
                    </span>
                  )}

                  {/* Connection Band Badge */}
                  {device.band === '5GHz' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-blue-400" />
                      Wi-Fi 5 GHz (SSID5)
                    </span>
                  ) : device.band === '2.4GHz' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-cyan-400" />
                      Wi-Fi 2.4 GHz
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                      <Cable className="w-3 h-3 text-cyan-400" />
                      Cabo LAN Gigabit
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

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className="p-3 mx-6 mt-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-4 mx-6 mt-4">
              <CapabilityNotice featureName="Operação de Rede" reason={actionError} />
            </div>
          )}

          {/* Navigation Tabs (5 Rich Tabs - No Scrollbar Cutoff) */}
          <div className="flex items-center gap-1.5 border-b border-neutral-800 px-4 sm:px-6 py-2.5 bg-neutral-950/80 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('identify')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'identify'
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Identificação & OUI</span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Super Ferramentas</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Rede & Proprietário</span>
            </button>

            <button
              onClick={() => setActiveTab('access')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'access'
                  ? 'bg-neutral-800 text-rose-400 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Controle de Acesso</span>
            </button>

            <button
              onClick={() => setActiveTab('traffic')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'traffic'
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Vazão & Histórico</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">

            {/* TAB 1: IDENTIFICATION */}
            {activeTab === 'identify' && (
              <div className="space-y-5 animate-fade-in">
                {/* 1. Complete Commercial Hardware Specs Sheet */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/40 space-y-4 shadow-glow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Ficha Técnica do Aparelho</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                            {device.brand || brandBadge.name}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Identificação de hardware, sistema operacional e parâmetros de rádio Wi-Fi
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-700/50">
                      {device.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {/* Marca Comercial */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Marca do Fabricante</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                          {device.brand || brandBadge.name}
                        </span>
                        <strong className="text-white text-xs truncate">{device.manufacturer}</strong>
                      </div>
                    </div>

                    {/* Modelo do Aparelho */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Modelo Comercial</span>
                      <strong className="text-cyan-300 text-sm block mt-1 truncate" title={device.model || device.originalHostname}>
                        {device.model || device.originalHostname}
                      </strong>
                    </div>

                    {/* Sistema Operacional */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Sistema Operacional</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <strong className="text-white text-xs truncate">{device.os || 'Linux / Android'}</strong>
                      </div>
                    </div>

                    {/* Padrão Wi-Fi / Conexão */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Padrão de Rede</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Wifi className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <strong className="text-slate-200 text-xs truncate">{device.wifiStandard || (device.band === '5GHz' ? 'Wi-Fi 5 (802.11ac)' : 'Wi-Fi 4')}</strong>
                      </div>
                    </div>

                    {/* Rede Wi-Fi (SSID) & Canal */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Rede Wi-Fi Conectada</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <strong className="text-white text-xs truncate">
                          {device.ssid || (device.band === '5GHz' ? 'Ta Liso Né?!?' : device.band === '2.4GHz' ? 'MALAQUIAS' : 'Cabo LAN')}
                        </strong>
                        {device.channel && device.channel !== '-' && (
                          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] text-cyan-400 font-mono">
                            Ch.{device.channel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Velocidade de Link */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Velocidade de Link (PHY)</span>
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-mono font-bold text-xs">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{device.linkSpeedMbps || (device.band === '5GHz' ? 866 : 144)} Mbps</span>
                        <span className="text-slate-500 font-sans font-normal text-[10px]">({device.band})</span>
                      </div>
                    </div>

                    {/* Sinal e Qualidade */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Nível de Sinal</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <strong className="text-white font-mono text-xs">{device.signalStrength} dBm</strong>
                        <span className="text-cyan-400 text-[11px] truncate">
                          • {device.signalQuality || 'Estável'}
                        </span>
                      </div>
                    </div>

                    {/* Endereço IPv4 */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Endereço IPv4</span>
                      <div className="flex items-center justify-between mt-1">
                        <strong className="text-cyan-400 font-mono text-xs">{device.ip}</strong>
                        <button
                          onClick={() => copyToClipboard(device.ip, 'ip')}
                          className="text-slate-500 hover:text-white transition"
                          title="Copiar IPv4"
                        >
                          {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Endereço IPv6 Local */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Endereço IPv6 Link-Local</span>
                      <div className="flex items-center justify-between mt-1">
                        <strong className="text-slate-300 font-mono text-[10px] truncate" title={device.ipv6 || 'fe80::1'}>
                          {device.ipv6 || 'fe80::1'}
                        </strong>
                        <button
                          onClick={() => copyToClipboard(device.ipv6 || 'fe80::1', 'ipv6')}
                          className="text-slate-500 hover:text-white transition flex-shrink-0"
                          title="Copiar IPv6"
                        >
                          {copiedField === 'ipv6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Manufacturer & Hardware Profile Card */}
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

                {/* Step-by-step physical identification guide */}
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

            {/* TAB 2: SUPER TOOLS & DIAGNOSTICS */}
            {activeTab === 'tools' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* 1. Live Ping Diagnostic */}
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow-sm disabled:opacity-50"
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

                {/* 2. Open Port Scanner */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Scanner de Portas Abertas (LAN Port Scanner)</h3>
                        <p className="text-[11px] text-slate-400">Varredura de portas comuns (HTTP, SSH, SMB, RDP, DNS, Cast)</p>
                      </div>
                    </div>

                    <button
                      onClick={handleRunPortScan}
                      disabled={portScanRunning}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      <Search className={`w-3.5 h-3.5 ${portScanRunning ? 'animate-spin' : ''}`} />
                      <span>{portScanRunning ? 'Escaneando...' : 'Escanear Portas'}</span>
                    </button>
                  </div>

                  {portScanResults && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Varredura em {device.ip} ({portScanResults.portsScanned} portas verificadas):
                        </span>
                        <span className="font-mono font-bold text-cyan-400">
                          {portScanResults.openPorts.length} porta(s) aberta(s)
                        </span>
                      </div>

                      {portScanResults.openPorts.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">
                          Nenhuma porta pública padrão aberta no momento. O dispositivo está com firewall ativo ou operando silenciosamente.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {portScanResults.openPorts.map((p) => (
                            <div key={p} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="font-mono font-bold text-white">Porta {p}</span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {COMMON_PORT_DESCRIPTIONS[p] || 'Serviço Ativo'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Action Buttons: Kick & Wake-on-LAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Kick Wi-Fi */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">Expulsar do Wi-Fi (Kick)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Envia quadros de desautenticação pelo roteador para derrubar o aparelho da rede Wi-Fi e forçá-lo a restabelecer a conexão.
                    </p>
                    <button
                      onClick={handleKickDevice}
                      disabled={!capabilities.deviceKick || device.isGateway}
                      className="w-full px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-200 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{device.isGateway ? 'Protegido (Gateway Host)' : capabilities.deviceKick ? 'Expulsar Aparelho do Wi-Fi' : 'Requer Login Admin'}</span>
                    </button>
                  </div>

                  {/* Wake-on-LAN */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Power className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white">Ligar Computador (Wake-on-LAN)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Dispara um pacote mágico via broadcast UDP para ligar a placa de rede de PCs desktop ou servidores desligados.
                    </p>
                    <button
                      onClick={handleSendWakeOnLan}
                      disabled={!capabilities.wakeOnLan}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-200 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{capabilities.wakeOnLan ? 'Enviar Pacote WoL' : 'Requer Login Admin'}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 3: NETWORK CONFIG & OWNER */}
            {activeTab === 'config' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Static IP DHCP Reservation Card */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Reserva de IP Estático (DHCP Bind)</h3>
                        <p className="text-[11px] text-slate-400">Fixar permanentemente o endereço {device.ip} para este dispositivo</p>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleStaticIp}
                      disabled={!capabilities.staticIpReservation}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        device.isStaticIp
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-500/30 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {device.isStaticIp ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{device.isStaticIp ? 'IP Estático Ativo' : 'Ativar IP Estático'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    Com a reserva ativada, o roteador ZTE vinculará o endereço MAC <span className="font-mono text-slate-200">{device.mac}</span> ao IP <span className="font-mono text-cyan-400 font-bold">{device.ip}</span>. O dispositivo nunca mais mudará de IP.
                  </p>
                </div>

                {/* Connection Band Selector Card */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Tipo de Conexão na Rede (Banda)</h3>
                      <p className="text-[11px] text-slate-400">Interface de comunicação no roteador ZTE (Wi-Fi 5GHz, Wi-Fi 2.4GHz ou Cabo LAN)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSetBand('5GHz')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        device.band === '5GHz'
                          ? 'bg-blue-950/40 border-blue-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-blue-300 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Wi-Fi 5 GHz
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">SSID5 • Ultra Rápido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetBand('2.4GHz')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        device.band === '2.4GHz'
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-cyan-300 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Wi-Fi 2.4 GHz
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Maior Alcance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetBand('ethernet')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        device.band === 'ethernet'
                          ? 'bg-slate-800 border-slate-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-slate-300 flex items-center gap-1">
                        <Cable className="w-3.5 h-3.5" /> Cabo LAN
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Ethernet Gigabit</span>
                    </button>
                  </div>
                </div>

                {/* QoS Traffic Priority Card */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Prioridade de Tráfego QoS</h3>
                      <p className="text-[11px] text-slate-400">Defina o nível de prioridade de largura de banda na rede</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <button
                      onClick={() => handleSetPriority('high')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        device.priority === 'high'
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-purple-300">Alta Prioridade</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Gamer / Streaming 4K</span>
                    </button>

                    <button
                      onClick={() => handleSetPriority('normal')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        device.priority === 'normal' || !device.priority
                          ? 'bg-brand-950/40 border-brand-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-brand-300">Normal (Padrão)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Navegação e uso geral</span>
                    </button>

                    <button
                      onClick={() => handleSetPriority('low')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        device.priority === 'low'
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-glow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs text-amber-300">Baixa Prioridade</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Dispositivos secundários</span>
                    </button>
                  </div>
                </div>

                {/* Owner & Administrator Private Notes */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-bold text-white">Proprietário & Anotações do Administrador</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Nome do Dono / Setor</label>
                      <input
                        type="text"
                        value={ownerInput}
                        onChange={(e) => setOwnerInput(e.target.value)}
                        placeholder="Ex: Pedro, Mariana, Quarto Casal, Visitante..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Anotações Privadas</label>
                      <textarea
                        rows={3}
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="Ex: Notebook corporativo, liberado para acesso até domingo..."
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {notesSaved && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Anotações salvas com sucesso!
                        </span>
                      )}
                      <div className="ml-auto">
                        <button
                          onClick={handleSaveNotes}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                        >
                          Salvar Anotações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: ACCESS CONTROL */}
            {activeTab === 'access' && (
              <div className="space-y-5 animate-fade-in">
                {device.isGateway ? (
                  <div className="p-5 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      <span>Equipamento Gateway Protegido</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Este dispositivo é o <strong>Roteador Gateway Central ZTE ZXHN H199A</strong> que gerencia a rede LAN/Wi-Fi. Ele não pode ser bloqueado ou pausado pelo sistema de controle de acesso de clientes.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Controle de Conexão Imediato</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Interrompa ou restabeleça o tráfego de dados deste aparelho instantaneamente
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleToggleBlock}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition shadow-md ${
                          device.status === 'blocked'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                        }`}
                      >
                        {device.status === 'blocked' ? (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Desbloquear Acesso à Internet</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4" />
                            <span>Bloquear Acesso à Internet</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleTogglePause}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition ${
                          device.status === 'paused'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {device.status === 'paused' ? (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Retomar Conexão Pausada</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Pausar Conexão Temporariamente</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 block mb-0.5">Como funciona o bloqueio:</strong>
                      O endereço MAC <span className="font-mono text-slate-200">{device.mac}</span> é inserido na lista negra de controle de acesso (Access Control List) do roteador ZTE. O aparelho não conseguirá trocar pacotes com a internet até ser liberado.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: TRAFFIC & HISTORY */}
            {activeTab === 'traffic' && (
              <div className="space-y-5 animate-fade-in">
                {/* Traffic Stats Grid */}
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

                {/* History Lists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Histórico de IPs (DHCP)
                    </h4>
                    <div className="space-y-2">
                      {device.ipHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="font-mono text-brand-400 font-semibold">{h.ip}</span>
                          <span className="text-slate-400">
                            {new Date(h.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Sessões de Conexão
                    </h4>
                    <div className="space-y-2">
                      {device.connectionHistory.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <span className={`font-semibold ${c.type === 'connect' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {c.type === 'connect' ? '• Conectado' : '• Desconectado'}
                          </span>
                          <span className="text-slate-400">
                            {new Date(c.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
        description={`Você está prestes a bloquear o acesso de "${device.customName || device.originalHostname}" (MAC: ${device.mac}, IP: ${device.ip}). O aparelho não conseguirá navegar na internet até ser desbloqueado.`}
        confirmLabel="Sim, Bloquear Dispositivo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmBlockDevice}
        onCancel={() => setShowConfirmBlock(false)}
      />
    </>
  );
};
