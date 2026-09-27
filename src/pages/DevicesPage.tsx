import React, { useState, useEffect } from 'react';
import { 
  Search, Edit2, ShieldAlert, 
  ShieldCheck, Pause, Play, Eye, ArrowDownCircle, 
  HardDrive, Smartphone, Laptop, Laptop2, Tv, Cpu, Gamepad2, AlertCircle,
  Zap, Server, Radio, Download, CheckSquare, Square,
  Check, RefreshCw, Sparkles, Tag, Shield, Wifi
} from 'lucide-react';
import { Device, RouterCapabilities } from '../types';
import { DeviceIcon, DeviceStatusBadge } from '../components/devices/DeviceIcon';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { networkService } from '../services/networkService';
import { CapabilityNotice } from '../components/common/CapabilityNotice';
import { isRandomizedMac, testDevicePing } from '../utils/deviceIdentifier';

interface DevicesPageProps {
  capabilities: RouterCapabilities;
  queryParams?: Record<string, string>;
  onQueryChange?: (params: Record<string, string>) => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ 
  capabilities,
  queryParams,
  onQueryChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(queryParams?.categoria || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(queryParams?.filtro || 'all');
  const [sortBy, setSortBy] = useState<'speed' | 'consumption' | 'name' | 'lastSeen'>('speed');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Bulk Selection
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  
  // Inline rename quick modal
  const [deviceToRename, setDeviceToRename] = useState<Device | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');

  // Inline Ping status
  const [pingStates, setPingStates] = useState<Record<string, { latency: number | null; alive: boolean; loading: boolean }>>({});

  // Confirm block modal
  const [deviceToBlock, setDeviceToBlock] = useState<Device | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const devices = networkService.getDevices();
  const routerInfo = networkService.getRouterInfo();
  const isAdmin = routerInfo?.isAdminAuthenticated || false;

  const showSuccessFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleInlinePing = async (dev: Device) => {
    setPingStates(prev => ({ ...prev, [dev.id]: { latency: null, alive: false, loading: true } }));
    try {
      const res = await testDevicePing(dev.ip);
      setPingStates(prev => ({ ...prev, [dev.id]: { latency: res.latencyMs, alive: res.alive, loading: false } }));
    } catch {
      setPingStates(prev => ({ ...prev, [dev.id]: { latency: null, alive: false, loading: false } }));
    }
  };

  // Sync state with queryParams from router
  useEffect(() => {
    if (queryParams?.filtro && queryParams.filtro !== statusFilter) {
      setStatusFilter(queryParams.filtro);
    }
    if (queryParams?.categoria && queryParams.categoria !== categoryFilter) {
      setCategoryFilter(queryParams.categoria);
    }
    if (queryParams?.device) {
      const found = devices.find(d => d.id === queryParams.device);
      if (found) setSelectedDevice(found);
    }
  }, [queryParams]);

  const handleSetStatusFilter = (filter: string) => {
    setStatusFilter(filter);
    onQueryChange?.({ ...queryParams, filtro: filter });
  };

  const handleSetCategoryFilter = (cat: string) => {
    setCategoryFilter(cat);
    onQueryChange?.({ ...queryParams, categoria: cat });
  };

  const handleSelectDevice = (dev: Device | null) => {
    setSelectedDevice(dev);
    if (dev) {
      onQueryChange?.({ ...queryParams, device: dev.id });
    } else {
      const next = { ...queryParams };
      delete next.device;
      onQueryChange?.(next);
    }
  };

  // Filtering
  const filteredDevices = devices.filter((d) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (d.customName && d.customName.toLowerCase().includes(search)) ||
      d.originalHostname.toLowerCase().includes(search) ||
      d.ip.includes(search) ||
      d.mac.toLowerCase().includes(search) ||
      d.manufacturer.toLowerCase().includes(search) ||
      (d.ownerName && d.ownerName.toLowerCase().includes(search)) ||
      (d.notes && d.notes.toLowerCase().includes(search));

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'all') matchesStatus = true;
    else if (statusFilter === 'wlan') matchesStatus = d.band === '2.4GHz' || d.band === '5GHz';
    else if (statusFilter === 'lan') matchesStatus = d.band === 'ethernet';
    else if (statusFilter === 'static') matchesStatus = !!d.isStaticIp;
    else if (statusFilter === 'priority_high') matchesStatus = d.priority === 'high';
    else if (statusFilter === 'random_mac') matchesStatus = isRandomizedMac(d.mac);
    else matchesStatus = d.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (sortBy === 'speed') {
      return (b.currentDownloadSpeedKbps + b.currentUploadSpeedKbps) - (a.currentDownloadSpeedKbps + a.currentUploadSpeedKbps);
    }
    if (sortBy === 'consumption') {
      return (b.totalDownloadBytes + b.totalUploadBytes) - (a.totalDownloadBytes + a.totalUploadBytes);
    }
    if (sortBy === 'name') {
      const nameA = a.customName || a.originalHostname;
      const nameB = b.customName || b.originalHostname;
      return nameA.localeCompare(nameB);
    }
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} Kbps`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Selection handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedDeviceIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedDeviceIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedDeviceIds.size === filteredDevices.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
    }
  };

  // Bulk actions
  const handleBulkBlock = async () => {
    const ids = Array.from(selectedDeviceIds);
    const count = await networkService.bulkBlockDevices(ids);
    setSelectedDeviceIds(new Set());
    showSuccessFeedback(`${count} dispositivo(s) bloqueado(s) com sucesso.`);
  };

  const handleBulkUnblock = async () => {
    const ids = Array.from(selectedDeviceIds);
    const count = await networkService.bulkUnblockDevices(ids);
    setSelectedDeviceIds(new Set());
    showSuccessFeedback(`${count} dispositivo(s) desbloqueado(s) com sucesso.`);
  };

  const handleBulkPause = async () => {
    const ids = Array.from(selectedDeviceIds);
    const count = await networkService.bulkPauseDevices(ids);
    setSelectedDeviceIds(new Set());
    showSuccessFeedback(`${count} dispositivo(s) com conexão pausada.`);
  };

  const handleBulkKick = async () => {
    const ids = Array.from(selectedDeviceIds);
    const count = await networkService.bulkKickDevices(ids);
    setSelectedDeviceIds(new Set());
    showSuccessFeedback(`${count} dispositivo(s) desconectado(s) do Wi-Fi.`);
  };

  const handleExportInventory = (format: 'csv' | 'json') => {
    const dataToExport = devices.map(d => ({
      Nome: d.customName || d.originalHostname,
      IP: d.ip,
      MAC: d.mac,
      Fabricante: d.manufacturer,
      Status: d.status,
      Banda: d.band,
      IP_Estatico: d.isStaticIp ? 'Sim' : 'Nao',
      Prioridade_QoS: d.priority || 'normal',
      Proprietario: d.ownerName || '',
      Notas: d.notes || ''
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario-inwifi-${Date.now()}.json`;
      a.click();
    } else {
      const header = Object.keys(dataToExport[0]).join(';');
      const rows = dataToExport.map(row => Object.values(row).join(';'));
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario-inwifi-${Date.now()}.csv`;
      a.click();
    }
    showSuccessFeedback(`Inventário de ${devices.length} aparelhos exportado em ${format.toUpperCase()}!`);
  };

  // Single device quick actions
  const handleOpenRename = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeviceToRename(device);
    setRenameInput(device.customName || device.originalHostname);
    setOwnerInput(device.ownerName || '');
  };

  const handleSaveRename = async () => {
    if (!deviceToRename) return;
    await networkService.renameDevice(deviceToRename.id, renameInput);
    if (ownerInput !== (deviceToRename.ownerName || '')) {
      await networkService.setDeviceNotes(deviceToRename.id, deviceToRename.notes || '', ownerInput);
    }
    setDeviceToRename(null);
    showSuccessFeedback('Identificação do dispositivo atualizada!');
  };

  const handleToggleBlock = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError(null);
    if (device.status === 'blocked') {
      const res = await networkService.unblockDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao desbloquear.');
      else showSuccessFeedback(`Acesso liberado para ${device.customName || device.originalHostname}.`);
    } else {
      setDeviceToBlock(device);
    }
  };

  const confirmBlock = async () => {
    if (!deviceToBlock) return;
    const dev = deviceToBlock;
    setDeviceToBlock(null);
    const res = await networkService.blockDevice(dev.id);
    if (!res.success) setActionError(res.error || 'Falha ao bloquear.');
    else showSuccessFeedback(`Aparelho ${dev.customName || dev.originalHostname} bloqueado no roteador.`);
  };

  const handleTogglePause = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError(null);
    if (device.status === 'paused') {
      const res = await networkService.resumeDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao retomar conexão.');
      else showSuccessFeedback(`Conexão retomada para ${device.customName || device.originalHostname}.`);
    } else {
      const res = await networkService.pauseDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao pausar conexão.');
      else showSuccessFeedback(`Conexão pausada para ${device.customName || device.originalHostname}.`);
    }
  };

  const handleQuickKick = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await networkService.kickDevice(device.id);
    if (res.success) {
      showSuccessFeedback(`Quadro de desconexão enviado. ${device.customName || device.originalHostname} forçado a reconectar.`);
    } else {
      setActionError(res.error || 'Erro ao expulsar aparelho.');
    }
  };

  const handleToggleStaticIp = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !device.isStaticIp;
    const res = await networkService.setStaticIp(device.id, newStatus);
    if (res.success) {
      showSuccessFeedback(newStatus ? `IP ${device.ip} fixado permanentemente no DHCP!` : `Reserva estática de ${device.ip} desfeita.`);
    } else {
      setActionError(res.error || 'Erro ao alterar reserva de IP.');
    }
  };

  const handleTogglePriority = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPriority = device.priority === 'high' ? 'normal' : 'high';
    const res = await networkService.setTrafficPriority(device.id, nextPriority);
    if (res.success) {
      showSuccessFeedback(`Prioridade de ${device.customName || device.originalHostname} definida para: ${nextPriority === 'high' ? 'ALTA (Gamer)' : 'NORMAL'}.`);
    }
  };

  const handleQuickPing = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingStates(prev => ({ ...prev, [device.id]: { latency: null, alive: false, loading: true } }));
    try {
      const res = await testDevicePing(device.ip);
      setPingStates(prev => ({
        ...prev,
        [device.id]: { latency: res.latencyMs, alive: res.alive, loading: false }
      }));
    } catch {
      setPingStates(prev => ({ ...prev, [device.id]: { latency: null, alive: false, loading: false } }));
    }
  };

  const categoryOptions: Array<{ id: string; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'Todos', icon: null },
    { id: 'smartphone', label: 'Smartphones', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'computer', label: 'Computadores', icon: <Laptop className="w-3.5 h-3.5" /> },
    { id: 'tv', label: 'Smart TVs', icon: <Tv className="w-3.5 h-3.5" /> },
    { id: 'iot', label: 'IoT & Smart Home', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'gaming', label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-brand-400" />
            Central de Gerenciamento de Dispositivos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle total, ações em massa, diagnósticos e ferramentas para todos os aparelhos conectados ({devices.length} detectados).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExportInventory('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            title="Exportar inventário de rede em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleExportInventory('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            title="Exportar inventário de rede em JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Network Overview Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div 
          onClick={() => handleSetStatusFilter('wlan')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'wlan' 
              ? 'bg-cyan-950/40 border-cyan-500/50 shadow-glow-sm' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px]">Wi-Fi (WLAN)</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {devices.filter(d => d.band === '2.4GHz' || d.band === '5GHz').length}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Roteador</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wifi className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('lan')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'lan' 
              ? 'bg-brand-950/40 border-brand-500/50' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px]">Rede Cabeada (LAN)</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {devices.filter(d => d.band === 'ethernet').length}
              </span>
              <span className="text-[10px] text-slate-500">Gateway + PC</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('static')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'static' 
              ? 'bg-emerald-950/40 border-emerald-500/50' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px]">IP Estático Fixo</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {devices.filter(d => d.isStaticIp).length}
              </span>
              <span className="text-[10px] text-slate-500">DHCP Bind</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'all' 
              ? 'bg-neutral-900 border-neutral-700' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px]">Total na Rede</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {devices.length}
              </span>
              <span className="text-[10px] text-emerald-400">100% Online</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-800 text-white">
            <Laptop2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <CapabilityNotice featureName="Ação de Controle" reason={actionError} />
      )}

      {/* Search & Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-dark-card border border-slate-800 space-y-4 shadow-card-dark">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por apelido, IP, MAC, fabricante, dono ou notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Status: Todos ({devices.length})</option>
              <option value="wlan">Wi-Fi (WLAN: 7 aparelhos)</option>
              <option value="lan">Cabo de Rede (LAN)</option>
              <option value="online">Online (Navegando)</option>
              <option value="blocked">Bloqueados</option>
              <option value="paused">Pausados</option>
              <option value="static">IP Estático Reservado</option>
              <option value="priority_high">Prioridade Alta (QoS)</option>
              <option value="random_mac">MAC Privado (Apple/Android)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="speed">Maior Vazão Atual</option>
              <option value="consumption">Maior Consumo Total</option>
              <option value="name">Ordem Alfabética</option>
              <option value="lastSeen">Visto Recentemente</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 font-medium mr-1 hidden sm:inline">Categorias:</span>
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                categoryFilter === cat.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BULK ACTIONS TOOLBAR (Appears when items are selected) */}
      {selectedDeviceIds.size > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-brand-950/60 border border-brand-500/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-glow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs font-mono">
              {selectedDeviceIds.size} selecionado(s)
            </span>
            <span className="text-xs text-slate-300">Executar ação em massa:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkBlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bloquear Selecionados</span>
            </button>

            <button
              onClick={handleBulkUnblock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Liberar Selecionados</span>
            </button>

            <button
              onClick={handleBulkPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>

            {capabilities.deviceKick && (
              <button
                onClick={handleBulkKick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Expulsar Wi-Fi</span>
              </button>
            )}

            <button
              onClick={() => setSelectedDeviceIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-medium"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* DEVICES TABLE / LIST */}
      <div className="rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark overflow-hidden">
        
        {sortedDevices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum dispositivo encontrado</h3>
            <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white transition">
                      {selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-brand-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">Dispositivo & Identificação</th>
                  <th className="py-4 px-4">Endereço IP & MAC</th>
                  <th className="py-4 px-4">Fabricante & OUI</th>
                  <th className="py-4 px-4">Banda / Sinal</th>
                  <th className="py-4 px-4">Vazão Instantânea</th>
                  <th className="py-4 px-4">Status & Config</th>
                  <th className="py-4 px-5 text-right">Ações Imediatas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedDevices.map((device) => {
                  const isSelected = selectedDeviceIds.has(device.id);
                  const isRandom = isRandomizedMac(device.mac);
                  const pingInfo = pingStates[device.id];

                  return (
                    <tr 
                      key={device.id} 
                      onClick={() => setSelectedDevice(device)}
                      className={`hover:bg-slate-900/60 transition cursor-pointer group ${
                        isSelected ? 'bg-brand-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => handleToggleSelect(device.id, e)}>
                        <button className="text-slate-500 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Custom Identification */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <DeviceIcon
                            category={device.category}
                            band={device.band}
                            status={device.status}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-brand-300 transition text-sm truncate">
                                {device.customName || device.originalHostname}
                              </span>
                              <button
                                onClick={(e) => handleOpenRename(device, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-400 rounded transition"
                                title="Renomear / Atribuir Dono"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {device.customName && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({device.originalHostname})
                                </span>
                              )}
                              {device.ownerName && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  Dono: {device.ownerName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP & MAC */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-cyan-400 font-semibold">{device.ip}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{device.mac}</span>
                          {isRandom && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-bold">
                              PRIVADO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium block truncate max-w-[140px]">
                          {device.manufacturer}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {device.mac.substring(0, 8)}
                        </span>
                      </td>

                      {/* Band & Signal */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {device.band === 'ethernet' ? 'Cabo LAN' : device.band}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {device.band === 'ethernet' ? 'Gigabit 1000M' : `${device.signalStrength} dBm`}
                        </div>
                      </td>

                      {/* Traffic */}
                      <td className="py-3.5 px-4 font-mono">
                        {device.status === 'online' ? (
                          <>
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {formatBytes(device.totalDownloadBytes)} total
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500 font-mono">0 Kbps</span>
                        )}
                      </td>

                      {/* Status & Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <DeviceStatusBadge status={device.status} />

                          <div className="flex items-center gap-1 flex-wrap">
                            {device.isStaticIp && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                IP FIXO
                              </span>
                            )}
                            {device.priority === 'high' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                GAMER / ALTA
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons Toolbar */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick Ping Button */}
                          <button
                            onClick={(e) => handleQuickPing(device, e)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition"
                            title="Testar Ping / Latência agora"
                          >
                            <Radio className={`w-3.5 h-3.5 ${pingInfo?.loading ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>

                          {/* Ping latency badge inline if tested */}
                          {pingInfo && !pingInfo.loading && (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
                              pingInfo.alive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {pingInfo.alive ? `${pingInfo.latency}ms` : 'Timeout'}
                            </span>
                          )}

                          {/* Quick Kick Wi-Fi Button */}
                          {capabilities.deviceKick && (
                            <button
                              onClick={(e) => handleQuickKick(device, e)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition"
                              title="Expulsar do Wi-Fi (Kick Reconnect)"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Static IP Toggle */}
                          {capabilities.staticIpReservation && (
                            <button
                              onClick={(e) => handleToggleStaticIp(device, e)}
                              className={`p-2 rounded-xl border transition ${
                                device.isStaticIp 
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                              }`}
                              title={device.isStaticIp ? 'IP Estático Ativo (Clique para liberar)' : 'Fixar IP Estático no DHCP'}
                            >
                              <Server className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Pause/Resume */}
                          <button
                            onClick={(e) => handleTogglePause(device, e)}
                            className={`p-2 rounded-xl border transition ${
                              device.status === 'paused'
                                ? 'bg-amber-600 text-white border-amber-500'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                            title={device.status === 'paused' ? 'Retomar Conexão' : 'Pausar Temporariamente'}
                          >
                            {device.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Quick Block/Unblock */}
                          <button
                            onClick={(e) => handleToggleBlock(device, e)}
                            className={`p-2 rounded-xl border transition ${
                              device.status === 'blocked'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/40'
                            }`}
                            title={device.status === 'blocked' ? 'Desbloquear Acesso' : 'Bloquear Dispositivo'}
                          >
                            {device.status === 'blocked' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          </button>

                          {/* View Complete Panel */}
                          <button
                            onClick={() => setSelectedDevice(device)}
                            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
                            title="Abrir Painel Completo de Diagnóstico"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Native App Cards View (md:hidden) */}
          <div className="md:hidden divide-y divide-neutral-800/80">
            {sortedDevices.map((device) => {
              const isSelected = selectedDeviceIds.has(device.id);
              const pingInfo = pingStates[device.id];

              return (
                <div 
                  key={device.id}
                  onClick={() => handleSelectDevice(device)}
                  className={`p-4 transition cursor-pointer active:bg-neutral-900 ${
                    isSelected ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  {/* Top Row: Icon, Names, Band & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <DeviceIcon
                        category={device.category}
                        band={device.band}
                        status={device.status}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm truncate">
                            {device.customName || device.originalHostname}
                          </span>
                          {device.customName && (
                            <span className="text-[10px] text-neutral-400 font-mono truncate">
                              ({device.originalHostname})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                          <span className="text-cyan-400 font-semibold">{device.ip}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400">{device.manufacturer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <DeviceStatusBadge status={device.status} />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300">
                        {device.band}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Traffic & Quick Action Buttons */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-900 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs">
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleInlinePing(device)}
                        disabled={pingInfo?.loading}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <Zap className={`w-3 h-3 text-amber-400 ${pingInfo?.loading ? 'animate-spin' : ''}`} />
                        <span>{pingInfo?.latency !== undefined && pingInfo.latency !== null ? `${pingInfo.latency}ms` : 'Ping'}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleBlock(device, e)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1 ${
                          device.status === 'blocked'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-800 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{device.status === 'blocked' ? 'Liberar' : 'Bloquear'}</span>
                      </button>

                      <button
                        onClick={() => handleSelectDevice(device)}
                        className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 transition"
                        title="Ver detalhes"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>

      {/* Quick Rename & Owner Modal */}
      {deviceToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-dark-card border border-slate-800 rounded-3xl shadow-card-dark space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-400" />
              Editar Identificação do Dispositivo
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nome Amigável / Apelido</label>
                <input
                  type="text"
                  placeholder="Ex: Celular do Pedro, Notebook Trabalho..."
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Proprietário / Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Pedro, Mariana, Escritório, Visitante..."
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeviceToRename(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-glow-sm"
              >
                Salvar Identificação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        capabilities={capabilities}
        onClose={() => handleSelectDevice(null)}
        onUpdated={() => {
          handleSelectDevice(null);
          networkService.refreshData();
        }}
      />

      {/* Confirmation modal before blocking */}
      <ConfirmModal
        isOpen={!!deviceToBlock}
        title="Bloquear Dispositivo na Rede?"
        description={`Você está prestes a bloquear o acesso de "${deviceToBlock?.customName || deviceToBlock?.originalHostname}" (MAC: ${deviceToBlock?.mac}, IP: ${deviceToBlock?.ip}). O aparelho não conseguirá navegar na internet.`}
        confirmLabel="Sim, Bloquear Dispositivo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmBlock}
        onCancel={() => setDeviceToBlock(null)}
      />
    </div>
  );
};
