import React, { useState } from 'react';
import { 
  Activity, ArrowDownCircle, ArrowUpCircle, HardDrive, 
  BarChart3
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { Device, RouterCapabilities, TrafficPoint } from '../types';
import { NetworkActivityChart } from '../components/dashboard/NetworkActivityChart';
import { DeviceIcon } from '../components/devices/DeviceIcon';
import { CapabilityNotice } from '../components/common/CapabilityNotice';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';

interface TrafficPageProps {
  capabilities: RouterCapabilities;
}

export const TrafficPage: React.FC<TrafficPageProps> = ({ capabilities }) => {
  const [period, setPeriod] = useState<'realtime' | 'day' | 'week' | 'month'>('day');
  const [chartData, setChartData] = useState<TrafficPoint[]>(networkService.getTrafficStats());
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const devices = networkService.getDevices();

  const handlePeriodChange = async (p: 'realtime' | 'day' | 'week' | 'month') => {
    setPeriod(p);
    const data = await networkService.getTrafficHistory(p);
    setChartData(data);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} Kbps`;
  };

  // Calculate totals
  const totalDownloadBytes = devices.reduce((sum, d) => sum + d.totalDownloadBytes, 0);
  const totalUploadBytes = devices.reduce((sum, d) => sum + d.totalUploadBytes, 0);
  const grandTotalBytes = totalDownloadBytes + totalUploadBytes;

  // Sort devices by total consumption
  const topConsumers = [...devices].sort((a, b) => {
    return (b.totalDownloadBytes + b.totalUploadBytes) - (a.totalDownloadBytes + a.totalUploadBytes);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-brand-400" />
            Consumo de Tráfego & Limites de Banda
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Estatísticas detalhadas de transferência de dados, histórico de vazão e políticas de QoS.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Download Total (Acumulado)</span>
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {formatBytes(totalDownloadBytes)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">82% do volume total da rede</p>
        </div>

        <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Upload Total (Acumulado)</span>
            <ArrowUpCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {formatBytes(totalUploadBytes)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">18% do volume total da rede</p>
        </div>

        <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Volume Total Trafegado</span>
            <HardDrive className="w-5 h-5 text-brand-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-white">
            {formatBytes(grandTotalBytes)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sessão iniciada há 4 dias</p>
        </div>
      </div>

      {/* Main Interactive Chart */}
      <NetworkActivityChart
        data={chartData}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* QoS Capabilities Notice if not supported */}
      {!capabilities.speedLimit && (
        <CapabilityNotice
          featureName="Controle de Velocidade / Bandwidth Limiting"
          reason="Este recurso não é suportado pelo roteador atual ou conector ativo."
        />
      )}

      {/* Top Bandwidth Consuming Devices Ranking */}
      <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-400" />
              Consumo por Dispositivo (Ranking)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Aparelhos que mais demandam capacidade da conexão de internet.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {topConsumers.map((dev) => {
            const devTotal = dev.totalDownloadBytes + dev.totalUploadBytes;
            const percentage = grandTotalBytes > 0 ? (devTotal / grandTotalBytes) * 100 : 0;

            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDevice(dev)}
                className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-brand-500/30 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <DeviceIcon
                      category={dev.category}
                      band={dev.band}
                      status={dev.status}
                      size="sm"
                    />
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-white group-hover:text-brand-300 transition truncate">
                        {dev.customName || dev.originalHostname}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {dev.ip} • {dev.manufacturer}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono text-xs">
                    <div className="text-white font-bold">{formatBytes(devTotal)}</div>
                    <div className="text-[11px] text-brand-400">{percentage.toFixed(1)}% do tráfego</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  <span className="text-emerald-400">Download: {formatBytes(dev.totalDownloadBytes)}</span>
                  <span className="text-cyan-400">Upload: {formatBytes(dev.totalUploadBytes)}</span>
                  {dev.speedLimitKbps ? (
                    <span className="text-amber-400 font-bold">Limite: {formatSpeed(dev.speedLimitKbps)}</span>
                  ) : (
                    <span className="text-slate-500">Sem limite</span>
                  )}
                </div>
              </div>
            );
          })}
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
