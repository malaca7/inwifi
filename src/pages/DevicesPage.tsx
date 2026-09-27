import React, { useState } from 'react';
import { 
  Search, Edit2, ShieldAlert, 
  ShieldCheck, Pause, Play, Eye, ArrowDownCircle, 
  HardDrive, Smartphone, Laptop, Tv, Cpu, Gamepad2, AlertCircle
} from 'lucide-react';
import { Device, RouterCapabilities } from '../types';
import { DeviceIcon, DeviceStatusBadge } from '../components/devices/DeviceIcon';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { networkService } from '../services/networkService';
import { CapabilityNotice } from '../components/common/CapabilityNotice';

interface DevicesPageProps {
  capabilities: RouterCapabilities;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ capabilities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'speed' | 'consumption' | 'name' | 'lastSeen'>('speed');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Inline rename quick modal
  const [deviceToRename, setDeviceToRename] = useState<Device | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Confirm block modal
  const [deviceToBlock, setDeviceToBlock] = useState<Device | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const devices = networkService.getDevices();

  // Filtering
  const filteredDevices = devices.filter((d) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (d.customName && d.customName.toLowerCase().includes(search)) ||
      d.originalHostname.toLowerCase().includes(search) ||
      d.ip.includes(search) ||
      d.mac.toLowerCase().includes(search) ||
      d.manufacturer.toLowerCase().includes(search);

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

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

  const handleOpenRename = (device: Device) => {
    setDeviceToRename(device);
    setRenameInput(device.customName || device.originalHostname);
  };

  const handleSaveRename = async () => {
    if (!deviceToRename) return;
    await networkService.renameDevice(deviceToRename.id, renameInput);
    setDeviceToRename(null);
  };

  const handleToggleBlock = async (device: Device) => {
    setActionError(null);
    if (device.status === 'blocked') {
      const res = await networkService.unblockDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao desbloquear.');
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
  };

  const handleTogglePause = async (device: Device) => {
    setActionError(null);
    if (device.status === 'paused') {
      const res = await networkService.resumeDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao retomar conexão.');
    } else {
      const res = await networkService.pauseDevice(device.id);
      if (!res.success) setActionError(res.error || 'Falha ao pausar conexão.');
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
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Gerenciamento de Dispositivos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle de inventário, identificação amigável e restrições de rede ({devices.length} aparelhos catalogados).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total ativos: <strong className="text-emerald-400 font-mono">{devices.filter(d => d.status === 'online').length}</strong>
          </span>
        </div>
      </div>

      {actionError && (
        <CapabilityNotice featureName="Ação de Controle" reason={actionError} />
      )}

      {/* Search & Filters Toolbar */}
      <div className="p-4 rounded-3xl bg-dark-card border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, IP, MAC ou fabricante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Status: Todos</option>
              <option value="online">Online (Conectados)</option>
              <option value="offline">Offline (Desconectados)</option>
              <option value="blocked">Bloqueados</option>
              <option value="paused">Pausados</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="speed">Ordenar: Maior Vazão Atual</option>
              <option value="consumption">Ordenar: Maior Consumo Total</option>
              <option value="name">Ordenar: Nome Alfabético</option>
              <option value="lastSeen">Ordenar: Visto Recentemente</option>
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

      {/* Responsive Devices Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark overflow-hidden">
        
        {sortedDevices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum dispositivo encontrado</h3>
            <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Dispositivo & Apelido</th>
                    <th className="py-4 px-4">Endereço IP & MAC</th>
                    <th className="py-4 px-4">Fabricante</th>
                    <th className="py-4 px-4">Banda / Sinal</th>
                    <th className="py-4 px-4">Consumo Instantâneo</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedDevices.map((device) => (
                    <tr 
                      key={device.id} 
                      className="hover:bg-slate-900/50 transition group"
                    >
                      {/* Name & Icon */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <DeviceIcon
                            category={device.category}
                            band={device.band}
                            status={device.status}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-brand-300 transition">
                              <span>{device.customName || device.originalHostname}</span>
                              <button
                                onClick={() => handleOpenRename(device)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-400 transition"
                                title="Renomear dispositivo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Hostname: {device.originalHostname}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* IP & MAC */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200 font-medium">{device.ip}</div>
                        <div className="text-[10px] text-slate-400">{device.mac}</div>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {device.manufacturer}
                      </td>

                      {/* Band & Signal */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">
                          {device.band === 'ethernet' ? 'Cabo LAN' : device.band}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {device.band === 'ethernet' ? '1 Gbps' : `${device.signalStrength} dBm`}
                        </div>
                      </td>

                      {/* Speed & Total */}
                      <td className="py-3.5 px-4 font-mono">
                        {device.status === 'online' ? (
                          <>
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <ArrowDownCircle className="w-3 h-3" />
                              <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              <span>Total: {formatBytes(device.totalDownloadBytes + device.totalUploadBytes)}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Inativo</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <DeviceStatusBadge status={device.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Pause / Resume Button */}
                          <button
                            onClick={() => handleTogglePause(device)}
                            disabled={!capabilities.pauseResume}
                            className={`p-2 rounded-xl transition ${
                              !capabilities.pauseResume
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : device.status === 'paused'
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title={device.status === 'paused' ? 'Retomar conexão' : 'Pausar conexão'}
                          >
                            {device.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>

                          {/* Block / Unblock Button */}
                          <button
                            onClick={() => handleToggleBlock(device)}
                            disabled={!capabilities.blocking}
                            className={`p-2 rounded-xl transition ${
                              !capabilities.blocking
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : device.status === 'blocked'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                            }`}
                            title={device.status === 'blocked' ? 'Desbloquear aparelho' : 'Bloquear aparelho'}
                          >
                            {device.status === 'blocked' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedDevice(device)}
                            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition"
                            title="Ver detalhes completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden divide-y divide-slate-800">
              {sortedDevices.map((device) => (
                <div key={device.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <DeviceIcon
                        category={device.category}
                        band={device.band}
                        status={device.status}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{device.customName || device.originalHostname}</span>
                          <button
                            onClick={() => handleOpenRename(device)}
                            className="p-1 text-slate-400 hover:text-brand-400"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {device.ip} • {device.manufacturer}
                        </div>
                      </div>
                    </div>
                    <DeviceStatusBadge status={device.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 font-mono">
                    <span className="text-slate-400">MAC: {device.mac}</span>
                    {device.status === 'online' && (
                      <span className="text-emerald-400 font-bold">
                        ↓ {formatSpeed(device.currentDownloadSpeedKbps)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleTogglePause(device)}
                      disabled={!capabilities.pauseResume}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {device.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{device.status === 'paused' ? 'Retomar' : 'Pausar'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleBlock(device)}
                      disabled={!capabilities.blocking}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                        device.status === 'blocked'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {device.status === 'blocked' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      <span>{device.status === 'blocked' ? 'Liberar' : 'Bloquear'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rename Quick Dialog */}
      {deviceToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white">Renomear Aparelho</h3>
            <p className="text-xs text-slate-400">
              Defina um apelido amigável para este dispositivo. O nome permanecerá vinculado ao identificador e endereço MAC:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-400">
              MAC: <span className="text-white font-bold">{deviceToRename.mac}</span> | Original: <span className="text-slate-300">{deviceToRename.originalHostname}</span>
            </div>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Ex: Celular João, TV Quarto..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-brand-500/60 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
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
                Salvar Apelido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Block Dialog */}
      <ConfirmModal
        isOpen={!!deviceToBlock}
        title="Bloquear Acesso do Aparelho?"
        description={`Confirma o bloqueio do aparelho "${deviceToBlock?.customName || deviceToBlock?.originalHostname}" (MAC: ${deviceToBlock?.mac})? Esta ação impedirá totalmente a navegação do dispositivo na rede.`}
        confirmLabel="Sim, Bloquear Dispositivo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmBlock}
        onCancel={() => setDeviceToBlock(null)}
      />

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        capabilities={capabilities}
        onClose={() => setSelectedDevice(null)}
        onUpdated={() => {
          setSelectedDevice(null);
          networkService.refreshData();
        }}
      />
    </div>
  );
};
