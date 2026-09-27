import React from 'react';
import { 
  LayoutDashboard, Laptop2, Share2, Bell, 
  Activity, ShieldAlert, Calendar, Router, 
  Settings, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';
import { RouterCapabilities } from '../../types';

export type NavTab = 
  | 'dashboard'
  | 'devices'
  | 'topology'
  | 'alerts'
  | 'traffic'
  | 'access'
  | 'schedules'
  | 'routers'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  capabilities: RouterCapabilities;
  unreadAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  capabilities,
  unreadAlertsCount
}) => {
  const menuItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'devices', label: 'Dispositivos', icon: <Laptop2 className="w-5 h-5" /> },
    { id: 'topology', label: 'Topologia da Rede', icon: <Share2 className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alertas & Eventos', icon: <Bell className="w-5 h-5" />, badge: unreadAlertsCount },
    { id: 'traffic', label: 'Consumo & Tráfego', icon: <Activity className="w-5 h-5" /> },
    { id: 'access', label: 'Controle de Acesso', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="w-5 h-5" /> },
    { id: 'routers', label: 'Roteadores', icon: <Router className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-dark-surface border-r border-slate-800/80 flex flex-col justify-between p-4 hidden lg:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        
        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Centro de Controle LAN
          </div>
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-200" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Adapter Capabilities Mini Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300">Capacidades Ativas</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Router Adapter
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.deviceDiscovery ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Descoberta</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.blocking ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Bloqueio</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.trafficStats ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Telemetria</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.speedLimit ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Limite Banda</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>In-Wifi Enterprise</span>
          <span className="font-mono text-slate-400">v1.2.0</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Baseada em Router Adapter Layer
        </p>
      </div>
    </aside>
  );
};
