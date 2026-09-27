import React, { useState } from 'react';
import { 
  Wifi, Users, ShieldAlert, 
  ArrowDownCircle, Activity, Cpu, HardDrive, Radio, Clock, ChevronRight, Zap
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { Device, RouterCapabilities, TrafficPoint } from '../types';
import { DeviceIcon, DeviceStatusBadge } from '../components/devices/DeviceIcon';
import { NetworkActivityChart } from '../components/dashboard/NetworkActivityChart';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';
import { getBrandBadge } from '../utils/deviceIdentifier';

interface DashboardPageProps {
  onNavigateToDevices: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToTraffic: () => void;
  capabilities: RouterCapabilities;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToDevices,
  onNavigateToAlerts,
  onNavigateToTraffic,
  capabilities
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'realtime' | 'day' | 'week' | 'month'>('realtime');
  const [chartData, setChartData] = useState<TrafficPoint[]>(networkService.getTrafficStats());

  const devices = networkService.getDevices();
  const events = networkService.getEvents();
  const routerInfo = networkService.getRouterInfo();

  // Metrics
  const onlineDevices = devices.filter(d => d.status === 'online');
  const blockedDevices = devices.filter(d => d.status === 'blocked');
  const pausedDevices = devices.filter(d => d.status === 'paused');
  
  // Sort preview so online devices appear first, followed by highest traffic
  const sortedPreviewDevices = [...devices].sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return (b.currentDownloadSpeedKbps + b.currentUploadSpeedKbps) - (a.currentDownloadSpeedKbps + a.currentUploadSpeedKbps);
  });
  
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const newDevicesCount = devices.filter(d => d.firstSeen >= oneDayAgo).length;

  const totalDlKbps = onlineDevices.reduce((sum, d) => sum + d.currentDownloadSpeedKbps, 0);
  const totalUlKbps = onlineDevices.reduce((sum, d) => sum + d.currentUploadSpeedKbps, 0);

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} Kbps`;
  };

  const handlePeriodChange = async (p: 'realtime' | 'day' | 'week' | 'month') => {
    setChartPeriod(p);
    const data = await networkService.getTrafficHistory(p);
    setChartData(data);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome & Quick Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/30 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Monitoramento da Rede LAN
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centro de controle em tempo real • Roteador <strong className="text-slate-200">{routerInfo?.name || 'ZTE ZXHN H199A'}</strong> ({routerInfo?.ipAddress || '192.168.1.1'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Sincronização em Tempo Real</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Conectados Online */}
        <div 
          onClick={onNavigateToDevices}
          className="p-5 rounded-3xl bg-dark-card border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer group shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Online no Roteador</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {onlineDevices.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {devices.length} no total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-medium">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineDevices.length} associados agora</span>
            </span>
            <span className="text-slate-500">
              {devices.length - onlineDevices.length} offline
            </span>
          </div>
        </div>

        {/* KPI 2: Wi-Fi (WLAN) Roteador */}
        <div 
          onClick={onNavigateToDevices}
          className="p-5 rounded-3xl bg-dark-card border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer group shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Wi-Fi (WLAN) Ativo</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
              {onlineDevices.filter(d => d.band === '2.4GHz' || d.band === '5GHz').length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {devices.filter(d => d.band === '2.4GHz' || d.band === '5GHz').length} cadastrados
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{onlineDevices.filter(d => d.band === '2.4GHz').length} em 2.4G</span>
            <span>•</span>
            <span>{onlineDevices.filter(d => d.band === '5GHz').length} em 5G</span>
          </div>
        </div>

        {/* KPI 3: Bloqueados / Pausados */}
        <div 
          onClick={onNavigateToDevices}
          className="p-5 rounded-3xl bg-dark-card border border-slate-800/80 hover:border-rose-500/40 transition cursor-pointer group shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Acesso Restrito</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
              {blockedDevices.length + pausedDevices.length}
            </span>
            <span className="text-xs text-slate-500">aparelhos</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-rose-400 font-medium">{blockedDevices.length} bloqueados</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{pausedDevices.length} pausados</span>
          </div>
        </div>

        {/* KPI 4: Tráfego Atual Agregado */}
        <div 
          onClick={onNavigateToTraffic}
          className="p-5 rounded-3xl bg-dark-card border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer group shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Vazão Total Atual</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {formatSpeed(totalDlKbps)}
            </span>
            <span className="text-xs text-cyan-400 font-mono">DL</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
            <span className="text-cyan-400 font-bold">{formatSpeed(totalUlKbps)} UL</span>
            <span>•</span>
            <span className="text-slate-400">Fibra Óptica</span>
          </div>
        </div>

      </div>

      {/* Router Hardware Health Row */}
      {routerInfo && (
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <div>
              <span className="font-semibold text-white">{routerInfo.brand} {routerInfo.model}</span>
              <span className="text-slate-500 ml-2 font-mono">({routerInfo.firmwareVersion})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span>CPU: <strong className="text-slate-200 font-mono">{routerInfo.cpuUsagePercent}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>RAM: <strong className="text-slate-200 font-mono">{routerInfo.ramUsagePercent}% ({routerInfo.totalRamMb} MB)</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Temp: <strong className="text-slate-200 font-mono">{routerInfo.temperatureCelsius}°C</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Uptime: <strong className="text-slate-200 font-mono">4d 12h</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Network Activity Chart */}
      <NetworkActivityChart
        data={chartData}
        period={chartPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Dual Column: Connected Devices Overview & Live Events Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Connected Devices List preview */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Dispositivos na Rede</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                  {onlineDevices.length} Online
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Top aparelhos ativos e histórico recente no roteador ZTE
              </p>
            </div>
            <button
              onClick={onNavigateToDevices}
              className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              <span>Ver todos ({devices.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {sortedPreviewDevices.slice(0, 7).map((device) => {
              const brandBadge = getBrandBadge(device.brand || device.manufacturer);
              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`py-3 px-2 rounded-2xl hover:bg-slate-900/60 transition cursor-pointer flex items-center justify-between gap-4 group ${
                    device.status === 'offline' ? 'opacity-70 hover:opacity-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <DeviceIcon
                      category={device.category}
                      band={device.band}
                      status={device.status}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition truncate">
                          {device.customName || device.model || device.originalHostname}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${brandBadge.bg} ${brandBadge.text} ${brandBadge.border}`}>
                          {device.brand || brandBadge.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono flex-wrap">
                        <span className="text-cyan-400">{device.ip}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-sans truncate">{device.model || device.manufacturer}</span>
                        {device.ssid && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline text-slate-500 font-sans">{device.ssid}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {device.status === 'online' ? (
                      <div className="text-right font-mono text-xs">
                        <div className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          <span>{formatSpeed(device.currentDownloadSpeedKbps)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                          <span>{device.band}</span>
                          <span className="text-emerald-400">• {device.linkSpeedMbps || (device.band === '5GHz' ? 866 : 144)}M</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right flex flex-col items-end">
                        <DeviceStatusBadge status={device.status} />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">0 Kbps</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Event Feed */}
        <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Eventos Operacionais</h3>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              Central completa
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-2xl border text-xs transition ${
                  evt.severity === 'error' ? 'bg-rose-950/20 border-rose-500/30' :
                  evt.severity === 'warning' ? 'bg-amber-950/20 border-amber-500/30' :
                  evt.severity === 'success' ? 'bg-emerald-950/20 border-emerald-500/30' :
                  'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{evt.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {evt.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

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
