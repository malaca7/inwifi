import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Edit2, ShieldAlert, 
  ShieldCheck, Pause, Play, Eye, ArrowDownCircle, 
  HardDrive, Smartphone, Laptop, Laptop2, Tv, Cpu, Gamepad2, AlertCircle,
  Zap, Server, Radio, Download, CheckSquare, Square,
  Check, RefreshCw, Sparkles, Tag, Shield, Wifi, Lock, Cable,
  LayoutGrid, List, Copy
} from 'lucide-react';
import { Device, RouterCapabilities } from '../types';
import { DeviceIcon, DeviceStatusBadge } from '../components/devices/DeviceIcon';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { networkService } from '../services/networkService';
import { CapabilityNotice } from '../components/common/CapabilityNotice';
import { isRandomizedMac, testDevicePing, getBrandBadge } from '../utils/deviceIdentifier';

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

  // Stable device positions (order only refreshes on page refresh, tab switch, filter change, or manual refresh)
  const [stableOrderIds, setStableOrderIds] = useState<string[]>([]);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  // View mode: 'cards' (Grid de cards sem overflow) or 'table' (Tabela compacta)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('inwifi_devices_view_mode') as 'cards' | 'table') || 'cards';
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
  const [isSyncing, setIsSyncing] = useState(false);

  const devices = networkService.getDevices();
  const routerInfo = networkService.getRouterInfo();
  const isAdmin = routerInfo?.isAdminAuthenticated || false;

  const showSuccessFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSyncWithRouter = async () => {
    setIsSyncing(true);
    try {
      await networkService.refreshData();
      setManualRefreshCount(c => c + 1);
      showSuccessFeedback('Sincronização com o roteador concluída! Dispositivos e status atualizados.');
    } catch {
      //
    } finally {
      setIsSyncing(false);
    }
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
      (d.brand && d.brand.toLowerCase().includes(search)) ||
      (d.model && d.model.toLowerCase().includes(search)) ||
      (d.os && d.os.toLowerCase().includes(search)) ||
      (d.ssid && d.ssid.toLowerCase().includes(search)) ||
      d.ip.includes(search) ||
      d.mac.toLowerCase().includes(search) ||
      d.manufacturer.toLowerCase().includes(search) ||
      (d.ownerName && d.ownerName.toLowerCase().includes(search)) ||
      (d.notes && d.notes.toLowerCase().includes(search));

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'all') matchesStatus = true;
    else if (statusFilter === 'online') matchesStatus = d.status === 'online';
    else if (statusFilter === 'offline') matchesStatus = d.status === 'offline';
    else if (statusFilter === 'wlan') matchesStatus = d.band === '2.4GHz' || d.band === '5GHz';
    else if (statusFilter === 'lan') matchesStatus = d.band === 'ethernet';
    else if (statusFilter === 'static') matchesStatus = !!d.isStaticIp;
    else if (statusFilter === 'priority_high') matchesStatus = d.priority === 'high';
    else if (statusFilter === 'random_mac') matchesStatus = isRandomizedMac(d.mac);
    else matchesStatus = d.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Re-calculate stable order IDs ONLY on mount, sort criteria change, filter change, or explicit manual refresh
  useEffect(() => {
    const list = [...filteredDevices].sort((a, b) => {
      // Prioritize online active devices over offline history
      if (sortBy === 'speed' || sortBy === 'lastSeen') {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
      }
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

    setStableOrderIds(list.map(d => d.id));
  }, [sortBy, categoryFilter, statusFilter, manualRefreshCount]);

  // Keep devices in stable, fixed slots during real-time telemetry fluctuations (avoids positions jumping)
  const sortedDevices = useMemo(() => {
    if (stableOrderIds.length === 0) return filteredDevices;

    const deviceMap = new Map(filteredDevices.map(d => [d.id, d]));
    const result: Device[] = [];

    // Place existing devices in their locked positions
    for (const id of stableOrderIds) {
      const dev = deviceMap.get(id);
      if (dev) {
        result.push(dev);
        deviceMap.delete(id);
      }
    }

    // Any new device detected after page load is appended at the end
    for (const remaining of deviceMap.values()) {
      result.push(remaining);
    }

    return result;
  }, [filteredDevices, stableOrderIds]);

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
    <div className="space-y-6 animate-fade-in w-full min-w-0 max-w-full">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-brand-400" />
            Central de Gerenciamento de Dispositivos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sincronizado com roteador • <strong className="text-emerald-400 font-mono">{devices.filter(d => d.status === 'online').length} online</strong> agora • {devices.length} aparelhos registrados no histórico de rede.
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
        {/* Tile 1: Online no Roteador */}
        <div 
          onClick={() => handleSetStatusFilter('online')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'online' 
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-glow-sm' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Online no Roteador</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {devices.filter(d => d.status === 'online').length}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativos agora
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Wifi className="w-4 h-4" />
          </div>
        </div>

        {/* Tile 2: Offline / Histórico */}
        <div 
          onClick={() => handleSetStatusFilter('offline')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'offline' 
              ? 'bg-slate-900 border-slate-600 shadow-sm' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Offline / Histórico</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-300 font-mono">
                {devices.filter(d => d.status === 'offline').length}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Desconectados</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 text-slate-500">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        {/* Tile 3: Wi-Fi (WLAN) Ativo */}
        <div 
          onClick={() => handleSetStatusFilter('wlan')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'wlan' 
              ? 'bg-cyan-950/40 border-cyan-500/50 shadow-glow-sm' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/40'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Wi-Fi (WLAN) Ativo</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {devices.filter(d => d.status === 'online' && (d.band === '2.4GHz' || d.band === '5GHz')).length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                de {devices.filter(d => d.band === '2.4GHz' || d.band === '5GHz').length} cadastrados
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        {/* Tile 4: Total Cadastrado */}
        <div 
          onClick={() => handleSetStatusFilter('all')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === 'all' 
              ? 'bg-neutral-900 border-neutral-600' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Total na Rede</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {devices.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {devices.filter(d => d.status === 'online').length} on • {devices.filter(d => d.status === 'offline').length} off
              </span>
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

          {/* Controls: Status, Sort, Reorder, View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Status: Todos ({devices.length})</option>
              <option value="online">🟢 Online no Roteador ({devices.filter(d => d.status === 'online').length})</option>
              <option value="offline">⚪ Offline / Desconectados ({devices.filter(d => d.status === 'offline').length})</option>
              <option value="wlan">Wi-Fi (WLAN: {devices.filter(d => d.band === '2.4GHz' || d.band === '5GHz').length})</option>
              <option value="lan">Cabo de Rede (LAN: {devices.filter(d => d.band === 'ethernet').length})</option>
              <option value="blocked">Bloqueados ({devices.filter(d => d.status === 'blocked').length})</option>
              <option value="paused">Pausados ({devices.filter(d => d.status === 'paused').length})</option>
              <option value="static">IP Estático Reservado</option>
              <option value="priority_high">Prioridade Alta (QoS)</option>
              <option value="random_mac">MAC Privado (Apple/Android)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:flex-initial px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="speed">Maior Vazão (Kbps)</option>
              <option value="consumption">Maior Consumo</option>
              <option value="name">Ordem Alfabética</option>
              <option value="lastSeen">Visto Recentemente</option>
            </select>

            {/* Sync with Router Button */}
            <button
              type="button"
              onClick={handleSyncWithRouter}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 hover:border-brand-500 text-brand-300 hover:text-white rounded-2xl text-xs font-semibold transition cursor-pointer"
              title="Consultar roteador físico agora e sincronizar status de conexões online/offline"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar Roteador'}</span>
            </button>

            {/* View Mode Toggle: Cards / Tabela */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setViewMode('cards');
                  localStorage.setItem('inwifi_devices_view_mode', 'cards');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Grade de Cards (Sem barra de rolagem)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('table');
                  localStorage.setItem('inwifi_devices_view_mode', 'table');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Tabela Compacta"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status notice showing positions are fixed */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-500/80" />
            <span>Posições fixadas (a lista não oscila sozinha; só reordena ao atualizar a página ou mudar de aba).</span>
          </div>
          <span className="font-mono text-neutral-400">Total: {sortedDevices.length} aparelhos</span>
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
           {/* DEVICES PRESENTATION (CARDS OR COMPACT TABLE) */}
      {sortedDevices.length === 0 ? (
        <div className="rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark p-12 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum dispositivo encontrado</h3>
          <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou filtros.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* MODERN CARD GRID (100% Responsive, Zero Horizontal Scroll) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
          {sortedDevices.map((device) => {
            const isSelected = selectedDeviceIds.has(device.id);
            const isRandom = isRandomizedMac(device.mac);
            const pingInfo = pingStates[device.id];
            const isCopied = copiedText === device.ip;
            const brandBadge = getBrandBadge(device.brand || device.manufacturer);

            return (
              <div
                key={device.id}
                onClick={() => handleSelectDevice(device)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 cursor-pointer group hover:border-cyan-500/50 relative overflow-hidden flex flex-col justify-between shadow-card-dark min-w-0 ${
                  isSelected 
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-glow-sm' 
                    : device.status === 'offline'
                      ? 'bg-neutral-950/50 border-neutral-900/90 opacity-75 hover:opacity-100 hover:bg-neutral-900/40'
                      : 'bg-neutral-950/80 border-neutral-800/80 hover:bg-neutral-900/60'
                }`}
              >
                {/* Card Top: Checkbox, Icon, Name, Model, Brand Badge, Status */}
                <div>
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Selection Checkbox */}
                      <button
                        onClick={(e) => handleToggleSelect(device.id, e)}
                        className="text-neutral-500 hover:text-white transition flex-shrink-0 mt-0.5"
                        title={isSelected ? 'Desmarcar' : 'Selecionar'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* Device Icon */}
                      <DeviceIcon
                        category={device.category}
                        band={device.band}
                        status={device.status}
                        size="md"
                      />

                      {/* Name, Model & Brand */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-bold text-white group-hover:text-cyan-300 transition text-sm truncate">
                            {device.customName || device.model || device.originalHostname}
                          </span>
                          <button
                            onClick={(e) => handleOpenRename(device, e)}
                            className="opacity-70 group-hover:opacity-100 p-1 text-neutral-400 hover:text-cyan-400 rounded transition flex-shrink-0"
                            title="Editar apelido ou proprietário"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Model / Subtitle */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                            {device.brand || brandBadge.name}
                          </span>
                          {device.model && (device.customName || device.model !== device.originalHostname) && (
                            <span className="text-[11px] text-cyan-300 font-medium truncate max-w-[200px]">
                              {device.model}
                            </span>
                          )}
                          {device.ownerName && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-medium truncate">
                              Dono: {device.ownerName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <DeviceStatusBadge status={device.status} />
                      <div className="flex items-center gap-1">
                        {device.isStaticIp && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            IP FIXO
                          </span>
                        )}
                        {device.priority === 'high' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            GAMER
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4-Box Technical Info Grid */}
                  <div className="mt-3.5 pt-3 border-t border-neutral-900 grid grid-cols-2 gap-2 text-xs">
                    {/* Aparelho & Sistema Operacional */}
                    <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/60 min-w-0">
                      <span className="text-[10px] text-neutral-400 block font-medium">Aparelho & Sistema</span>
                      <div className="text-white font-semibold text-[11px] truncate mt-0.5" title={device.model || device.manufacturer}>
                        {device.model || device.originalHostname}
                      </div>
                      <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5 truncate flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5 flex-shrink-0 text-cyan-400" />
                        <span className="truncate">{device.os || 'Linux / Android'}</span>
                      </div>
                    </div>

                    {/* Rede Wi-Fi & Velocidade de Link */}
                    <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/60 min-w-0">
                      <span className="text-[10px] text-neutral-400 block font-medium">Rede Wi-Fi & Link</span>
                      <div className="flex items-center gap-1 mt-0.5 truncate">
                        {device.band === 'ethernet' ? (
                          <>
                            <Cable className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span className="text-neutral-300 font-semibold text-[11px] truncate">Cabo LAN</span>
                          </>
                        ) : (
                          <>
                            <Wifi className={`w-3 h-3 flex-shrink-0 ${device.band === '5GHz' ? 'text-blue-400' : 'text-cyan-400'}`} />
                            <span className={`font-semibold text-[11px] truncate ${device.band === '5GHz' ? 'text-blue-300' : 'text-cyan-300'}`}>
                              {device.ssid || (device.band === '5GHz' ? 'Ta Liso Né?!?' : 'MALAQUIAS')}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-mono mt-0.5 truncate flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                        <span>{device.linkSpeedMbps || (device.band === '5GHz' ? 866 : device.band === '2.4GHz' ? 144 : 1000)} Mbps</span>
                        {device.channel && device.channel !== '-' && (
                          <span className="text-neutral-500">• Ch.{device.channel}</span>
                        )}
                      </div>
                    </div>

                    {/* Endereço IP & Sinal */}
                    <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/60 min-w-0">
                      <span className="text-[10px] text-neutral-400 block font-medium">Endereço IP & Sinal</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5 min-w-0">
                        <span className="text-cyan-400 font-mono font-semibold truncate text-[11px] sm:text-xs">
                          {device.ip}
                        </span>
                        <button
                          onClick={(e) => handleCopy(device.ip, e)}
                          className="text-neutral-400 hover:text-cyan-400 p-0.5 rounded transition flex-shrink-0"
                          title="Copiar IP"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-[9px] text-neutral-400 font-mono mt-0.5 truncate">
                        {device.band === 'ethernet' ? '1000M Full-Duplex' : `${device.signalStrength} dBm (${device.signalQuality ? device.signalQuality.split(' ')[0] : 'Bom'})`}
                      </div>
                    </div>

                    {/* Endereço MAC & Fabricante */}
                    <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/60 min-w-0">
                      <span className="text-[10px] text-neutral-400 block font-medium">Endereço MAC & OUI</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5 min-w-0">
                        <span className="text-neutral-300 font-mono text-[10px] truncate">
                          {device.mac}
                        </span>
                        {isRandom ? (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold flex-shrink-0" title="MAC Privado / Aleatório (Privacidade Ativa)">
                            PRIV
                          </span>
                        ) : (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono flex-shrink-0" title="MAC Físico IEEE">
                            FÍS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate mt-0.5" title={device.manufacturer}>
                        {device.brand || device.manufacturer}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry / Traffic */}
                  <div className={`mt-2.5 px-3 py-2 rounded-xl border flex items-center justify-between text-xs min-w-0 ${
                    device.status === 'offline'
                      ? 'bg-neutral-950/40 border-neutral-900/60'
                      : 'bg-neutral-900/40 border-neutral-800/40'
                  }`}>
                    {device.status === 'offline' ? (
                      <div className="flex items-center gap-1.5 font-mono text-neutral-500 text-xs truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                        <span>0 Kbps • Desconectado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs font-semibold truncate">
                        <ArrowDownCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-neutral-400 font-mono flex-shrink-0">
                      {formatBytes(device.totalDownloadBytes)} total
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div 
                  className="mt-3.5 pt-3 border-t border-neutral-900 flex items-center justify-between gap-1.5 flex-wrap min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {/* Ping Latency Test */}
                    <button
                      onClick={(e) => handleQuickPing(device, e)}
                      disabled={pingInfo?.loading}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-cyan-300 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                      title="Testar Ping / Latência agora"
                    >
                      <Radio className={`w-3 h-3 text-cyan-400 ${pingInfo?.loading ? 'animate-spin' : ''}`} />
                      <span>{pingInfo && !pingInfo.loading && pingInfo.latency !== null ? `${pingInfo.latency}ms` : 'Ping'}</span>
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={(e) => handleTogglePause(device, e)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                        device.status === 'paused'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                      title={device.status === 'paused' ? 'Retomar Conexão' : 'Pausar Conexão'}
                    >
                      {device.status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      <span>{device.status === 'paused' ? 'Retomar' : 'Pausar'}</span>
                    </button>

                    {/* Block / Unblock */}
                    <button
                      onClick={(e) => handleToggleBlock(device, e)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                        device.status === 'blocked'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-neutral-900 hover:bg-rose-950/30 text-rose-400 hover:border-rose-500/40 border-neutral-800'
                      }`}
                      title={device.status === 'blocked' ? 'Liberar Dispositivo' : 'Bloquear Dispositivo'}
                    >
                      {device.status === 'blocked' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      <span>{device.status === 'blocked' ? 'Liberar' : 'Bloquear'}</span>
                    </button>
                  </div>

                  {/* View Full Details Button */}
                  <button
                    onClick={() => handleSelectDevice(device)}
                    className="p-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ml-auto flex-shrink-0"
                    title="Ver detalhes completos do dispositivo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW (No Horizontal Scrollbar, Auto-fitted on Desktop, Cards on Mobile) */
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark overflow-hidden w-full">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white transition">
                      {selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Aparelho & Marca</th>
                  <th className="py-3.5 px-3">Sistema & Padrão</th>
                  <th className="py-3.5 px-3">Rede Wi-Fi & Link</th>
                  <th className="py-3.5 px-3">Endereço IP & MAC</th>
                  <th className="py-3.5 px-3">Vazão Instantânea</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedDevices.map((device) => {
                  const isSelected = selectedDeviceIds.has(device.id);
                  const isRandom = isRandomizedMac(device.mac);
                  const pingInfo = pingStates[device.id];
                  const isCopied = copiedText === device.ip;
                  const brandBadge = getBrandBadge(device.brand || device.manufacturer);

                  return (
                    <tr 
                      key={device.id} 
                      onClick={() => handleSelectDevice(device)}
                      className={`hover:bg-slate-900/60 transition cursor-pointer group ${
                        isSelected 
                          ? 'bg-cyan-950/20' 
                          : device.status === 'offline' 
                            ? 'opacity-70 hover:opacity-100 bg-slate-950/30' 
                            : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => handleToggleSelect(device.id, e)}>
                        <button className="text-slate-500 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Aparelho & Marca */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <DeviceIcon
                            category={device.category}
                            band={device.band}
                            status={device.status}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <span className="font-bold text-white group-hover:text-cyan-300 transition text-xs truncate">
                                {device.customName || device.model || device.originalHostname}
                              </span>
                              <button
                                onClick={(e) => handleOpenRename(device, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-cyan-400 rounded transition"
                                title="Renomear"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 truncate">
                              <span className={`px-1 py-0.2 rounded font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                                {device.brand || brandBadge.name}
                              </span>
                              <span className="text-cyan-300 font-medium truncate">{device.model || device.manufacturer}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sistema Operacional & Padrão */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200 text-xs truncate flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{device.os || 'Linux / Android'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          {device.wifiStandard || (device.band === '5GHz' ? 'Wi-Fi 5 (802.11ac)' : device.band === '2.4GHz' ? 'Wi-Fi 4 (802.11n)' : 'Gigabit LAN')}
                        </div>
                      </td>

                      {/* Rede Wi-Fi, Canal & Velocidade de Link */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200 flex items-center gap-1 text-xs">
                          {device.band === '5GHz' ? (
                            <>
                              <Wifi className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="text-blue-300 font-bold">{device.ssid || 'Ta Liso Né?!?'}</span>
                            </>
                          ) : device.band === '2.4GHz' ? (
                            <>
                              <Wifi className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                              <span className="text-cyan-300 font-bold">{device.ssid || 'MALAQUIAS'}</span>
                            </>
                          ) : (
                            <>
                              <Cable className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                              <span>Cabo LAN</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5 font-mono flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          <span>{device.linkSpeedMbps || (device.band === '5GHz' ? 866 : 144)} Mbps</span>
                          {device.channel && device.channel !== '-' && (
                            <span className="text-slate-500">• Ch.{device.channel}</span>
                          )}
                          <span className="text-slate-500 font-sans">• {device.signalStrength} dBm</span>
                        </div>
                      </td>

                      {/* Endereço IP & MAC */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400 font-semibold">{device.ip}</span>
                          <button
                            onClick={(e) => handleCopy(device.ip, e)}
                            className="text-slate-500 hover:text-cyan-400 transition"
                            title="Copiar IP"
                          >
                            {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>{device.mac}</span>
                          {isRandom ? (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-bold" title="MAC Privado">
                              PRIV
                            </span>
                          ) : (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-sans font-medium" title="MAC Físico IEEE">
                              FÍS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Traffic */}
                      <td className="py-3 px-3 font-mono">
                        {device.status === 'offline' ? (
                          <div className="text-slate-500 font-medium flex items-center gap-1 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                            <span>0 Kbps</span>
                          </div>
                        ) : (
                          <div className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                            <ArrowDownCircle className="w-3 h-3" />
                            <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {formatBytes(device.totalDownloadBytes)} total
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <DeviceStatusBadge status={device.status} />
                          {device.isStaticIp && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              IP FIXO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Ping */}
                          <button
                            onClick={(e) => handleQuickPing(device, e)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
                            title="Testar Ping"
                          >
                            <Radio className={`w-3.5 h-3.5 ${pingInfo?.loading ? 'animate-spin text-cyan-400' : ''}`} />
                          </button>

                          {/* Pause */}
                          <button
                            onClick={(e) => handleTogglePause(device, e)}
                            className={`p-1.5 rounded-lg border transition ${
                              device.status === 'paused'
                                ? 'bg-amber-600 text-white border-amber-500'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                            title={device.status === 'paused' ? 'Retomar Conexão' : 'Pausar'}
                          >
                            {device.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Block */}
                          <button
                            onClick={(e) => handleToggleBlock(device, e)}
                            className={`p-1.5 rounded-lg border transition ${
                              device.status === 'blocked'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/40'
                            }`}
                            title={device.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                          >
                            {device.status === 'blocked' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          </button>

                          {/* Details */}
                          <button
                            onClick={() => setSelectedDevice(device)}
                            className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                            title="Abrir Detalhes"
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

          {/* On mobile, fallback to cards so it NEVER creates a horizontal scrollbar */}
          <div className="md:hidden grid grid-cols-1 gap-3.5 w-full min-w-0">
            {sortedDevices.map((device) => {
              const isSelected = selectedDeviceIds.has(device.id);
              const isRandom = isRandomizedMac(device.mac);
              const pingInfo = pingStates[device.id];
              const isCopied = copiedText === device.ip;
              const brandBadge = getBrandBadge(device.brand || device.manufacturer);

              return (
                <div
                  key={device.id}
                  onClick={() => handleSelectDevice(device)}
                  className={`p-4 rounded-3xl bg-neutral-950/80 border transition cursor-pointer active:bg-neutral-900 min-w-0 ${
                    isSelected ? 'border-cyan-500 bg-cyan-950/20' : 'border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <DeviceIcon
                        category={device.category}
                        band={device.band}
                        status={device.status}
                        size="md"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white text-sm truncate block">
                          {device.customName || device.model || device.originalHostname}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono text-cyan-400 flex-wrap">
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                            {device.brand || brandBadge.name}
                          </span>
                          <span>{device.ip}</span>
                          {device.model && (
                            <span className="text-slate-300 font-sans truncate text-[11px]">• {device.model}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <DeviceStatusBadge status={device.status} />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-300 flex items-center gap-1 border border-neutral-800">
                        {device.band === '5GHz' ? <Wifi className="w-2.5 h-2.5 text-blue-400" /> : device.band === '2.4GHz' ? <Wifi className="w-2.5 h-2.5 text-cyan-400" /> : <Cable className="w-2.5 h-2.5 text-neutral-400" />}
                        <span>{device.band === '5GHz' ? '5GHz' : device.band === '2.4GHz' ? '2.4GHz' : 'Cabo'}</span>
                        <span className="text-emerald-400 font-bold">• {device.linkSpeedMbps || (device.band === '5GHz' ? 866 : 144)}M</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-900 text-xs min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs font-semibold">
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleInlinePing(device)}
                        disabled={pingInfo?.loading}
                        className="px-2 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-semibold border border-neutral-800 flex items-center gap-1"
                      >
                        <Zap className={`w-3 h-3 text-cyan-400 ${pingInfo?.loading ? 'animate-spin' : ''}`} />
                        <span>{pingInfo && !pingInfo.loading && pingInfo.latency !== null ? `${pingInfo.latency}ms` : 'Ping'}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleBlock(device, e)}
                        className={`px-2 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1 ${
                          device.status === 'blocked'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-neutral-900 text-rose-400 border-neutral-800'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{device.status === 'blocked' ? 'Liberar' : 'Bloquear'}</span>
                      </button>

                      <button
                        onClick={() => handleSelectDevice(device)}
                        className="p-1 px-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
