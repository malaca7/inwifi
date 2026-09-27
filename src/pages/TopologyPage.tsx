import React, { useState } from 'react';
import { 
  Globe, Router, Wifi, Share2, ChevronRight, Cable
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { Device, RouterCapabilities } from '../types';
import { DeviceIcon } from '../components/devices/DeviceIcon';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';

interface TopologyPageProps {
  capabilities: RouterCapabilities;
}

export const TopologyPage: React.FC<TopologyPageProps> = ({ capabilities }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const devices = networkService.getDevices();
  const routerInfo = networkService.getRouterInfo();

  // Group devices by segment
  const ethernetDevices = devices.filter(d => d.band === 'ethernet');
  const wifi5GDevices = devices.filter(d => d.band === '5GHz');
  const wifi24GDevices = devices.filter(d => d.band === '2.4GHz');

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-brand-400" />
            Topologia Gráfica da Rede
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mapeamento estrutural hierárquico de gateways, pontos de distribuição e nós clientes conectados.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Link Ativo</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Cable className="w-3.5 h-3.5" />
            <span>Gigabit LAN</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi 6 Mesh</span>
          </div>
        </div>
      </div>

      {/* Network Tree Visualizer Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark flex flex-col items-center">
        
        {/* LEVEL 1: INTERNET WAN */}
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-glow-sm flex items-center gap-3 max-w-xs sm:max-w-md w-full justify-center">
            <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400">
              <Globe className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Internet Pública (WAN)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                IP: 177.136.24.89 • Link Fibra 600M
              </div>
            </div>
          </div>

          {/* Connector Line */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-brand-500 to-cyan-400 relative">
            <div className="w-2 h-2 rounded-full bg-cyan-400 absolute left-1/2 -translate-x-1/2 bottom-0 shadow-[0_0_8px_#00d2ff]" />
          </div>
        </div>

        {/* LEVEL 2: MAIN ROUTER */}
        <div className="flex flex-col items-center text-center w-full max-w-xl">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-brand-500/40 shadow-glow-md w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 rounded-2xl bg-brand-600/30 text-cyan-400 border border-brand-500/40">
                <Router className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {routerInfo?.name || 'Roteador Principal'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GATEWAY
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  IP: {routerInfo?.ipAddress || '192.168.1.1'} • {routerInfo?.brand} {routerInfo?.model}
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right text-xs font-mono">
              <div className="text-emerald-400 font-bold">Status: Online</div>
              <div className="text-slate-500">Wi-Fi 6 AX3000</div>
            </div>
          </div>

          {/* Connector branching down */}
          <div className="w-0.5 h-8 bg-slate-700 relative">
            <div className="w-2 h-2 rounded-full bg-slate-400 absolute left-1/2 -translate-x-1/2 bottom-0" />
          </div>
        </div>

        {/* LEVEL 3: ACCESS NODES (Switch Gigabit, AP 5GHz, AP 2.4GHz) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* BRANCH 1: Switch Ethernet */}
          <div className="flex flex-col items-center">
            <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cable className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Switch Gigabit LAN</h4>
                  <p className="text-[10px] text-slate-400">Portas 1-8 • Cabo Cat6</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {ethernetDevices.length} nós
              </span>
            </div>

            <div className="w-0.5 h-4 bg-slate-800" />

            {/* Devices on Ethernet */}
            <div className="w-full space-y-2">
              {ethernetDevices.map(dev => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DeviceIcon category={dev.category} band={dev.band} status={dev.status} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">
                        {dev.customName || dev.originalHostname}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{dev.ip}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* BRANCH 2: Wi-Fi 5GHz (High Speed) */}
          <div className="flex flex-col items-center">
            <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Wi-Fi 5GHz (Alta Velocidade)</h4>
                  <p className="text-[10px] text-slate-400">Canal 36 • 80MHz (1200M)</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {wifi5GDevices.length} nós
              </span>
            </div>

            <div className="w-0.5 h-4 bg-slate-800" />

            {/* Devices on 5GHz */}
            <div className="w-full space-y-2">
              {wifi5GDevices.map(dev => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-brand-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DeviceIcon category={dev.category} band={dev.band} status={dev.status} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">
                        {dev.customName || dev.originalHostname}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{dev.ip}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* BRANCH 3: Wi-Fi 2.4GHz (Longo Alcance / IoT) */}
          <div className="flex flex-col items-center">
            <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Wi-Fi 2.4GHz & IoT</h4>
                  <p className="text-[10px] text-slate-400">Canal 6 • Dispositivos Smart</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {wifi24GDevices.length} nós
              </span>
            </div>

            <div className="w-0.5 h-4 bg-slate-800" />

            {/* Devices on 2.4GHz */}
            <div className="w-full space-y-2">
              {wifi24GDevices.map(dev => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DeviceIcon category={dev.category} band={dev.band} status={dev.status} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">
                        {dev.customName || dev.originalHostname}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{dev.ip}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Device Details Modal on Node Click */}
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
