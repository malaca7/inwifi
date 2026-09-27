import React from 'react';
import { 
  LayoutDashboard, Laptop2, Share2, Bell, 
  Activity, ShieldAlert, Calendar, Router, 
  Settings, ChevronRight, CheckCircle2, XCircle, Lock, KeyRound
} from 'lucide-react';
import { RouterCapabilities } from '../../types';
import { networkService } from '../../services/networkService';

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
  const routerInfo = networkService.getRouterInfo();
  const isAdmin = routerInfo?.isAdminAuthenticated;

  const menuItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number; extraBadge?: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'devices', label: 'Dispositivos', icon: <Laptop2 className="w-5 h-5" /> },
    { id: 'topology', label: 'Topologia da Rede', icon: <Share2 className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alertas & Eventos', icon: <Bell className="w-5 h-5" />, badge: unreadAlertsCount },
    { id: 'traffic', label: 'Consumo & Tráfego', icon: <Activity className="w-5 h-5" /> },
    { id: 'access', label: 'Controle de Acesso', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="w-5 h-5" /> },
    { 
      id: 'routers', 
      label: 'Roteador Gateway', 
      icon: <Router className="w-5 h-5" />,
      extraBadge: isAdmin ? (
        <span className="p-1 rounded bg-emerald-500/20 text-emerald-400" title="Admin Autenticado">
          <Lock className="w-3 h-3" />
        </span>
      ) : (
        <span className="p-1 rounded bg-amber-500/20 text-amber-400 animate-pulse" title="Admin Desconectado">
          <KeyRound className="w-3 h-3" />
        </span>
      )
    },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-dark-surface border-r border-slate-800/80 flex flex-col justify-between p-4 hidden lg:flex h-full overflow-y-auto select-none">
      <div className="space-y-6">
        
        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Centro de Controle LAN</span>
            <span className="text-[9px] font-mono text-cyan-400">1 Roteador</span>
          </div>
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-800/90 text-white border border-neutral-700 shadow-[0_2px_12px_rgba(0,0,0,0.6)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.extraBadge}
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
            <span className="text-[11px] font-bold text-slate-300">Ferramentas Hardware</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
              isAdmin 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isAdmin ? 'Admin Ativo' : 'Somente Leitura'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Descoberta</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Bloqueio MAC</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.deviceKick ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Kick Wi-Fi</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.staticIpReservation ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>IP Estático</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.portScanner ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Scanner Portas</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {capabilities.wakeOnLan ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-slate-600" />
              )}
              <span>Wake-on-LAN</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>In-Wifi LAN Console</span>
          <span className="font-mono text-emerald-400 text-[10px]">Zero DB Mode</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Coleta direta do fluxo do roteador
        </p>
      </div>
    </aside>
  );
};
