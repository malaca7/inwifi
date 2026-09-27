import React from 'react';
import { 
  LayoutDashboard, Laptop2, Share2, Bell, 
  Activity, ShieldAlert, Calendar, Router, 
  Settings, X, ChevronRight, CheckCircle2, 
  XCircle, Lock, KeyRound, ArrowDownCircle, 
  ArrowUpCircle, Radio, Sliders, Menu
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { RouterCapabilities } from '../../types';
import { networkService } from '../../services/networkService';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount: number;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
  capabilities: RouterCapabilities;
  onOpenRouterModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  unreadCount,
  isDrawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  capabilities,
  onOpenRouterModal
}) => {
  const routerInfo = networkService.getRouterInfo();
  const isAdmin = routerInfo?.isAdminAuthenticated;
  const devices = networkService.getDevices();

  // Aggregate current live speeds
  const totalDlKbps = devices.reduce((sum, d) => sum + (d.status === 'online' ? d.currentDownloadSpeedKbps : 0), 0);
  const totalUlKbps = devices.reduce((sum, d) => sum + (d.status === 'online' ? d.currentUploadSpeedKbps : 0), 0);

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} Kbps`;
  };

  // Bottom quick tabs (Native app experience)
  const bottomTabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'devices', label: 'Aparelhos', icon: <Laptop2 className="w-5 h-5" />, badge: devices.length },
    { id: 'routers', label: 'Roteador', icon: <Router className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
  ];

  // ALL 9 platform modules (identic to Desktop Sidebar)
  const allModules: Array<{
    id: NavTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
    extraBadge?: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Visão geral, KPIs e consumo em tempo real',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'devices',
      label: 'Dispositivos',
      description: `${devices.length} aparelhos conectados na rede LAN`,
      icon: <Laptop2 className="w-5 h-5" />,
      badge: devices.length
    },
    {
      id: 'topology',
      label: 'Topologia da Rede',
      description: 'Mapa interativo e hierarquia da rede',
      icon: <Share2 className="w-5 h-5" />
    },
    {
      id: 'alerts',
      label: 'Alertas & Eventos',
      description: 'Auditoria de conexão e logs operacionais',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount
    },
    {
      id: 'traffic',
      label: 'Consumo & Tráfego',
      description: 'Análise detalhada de vazão e histórico',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'access',
      label: 'Controle de Acesso',
      description: 'Regras de segurança e bloqueio MAC',
      icon: <ShieldAlert className="w-5 h-5" />
    },
    {
      id: 'schedules',
      label: 'Agendamentos',
      description: 'Controle parental e pausas de internet',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      id: 'routers',
      label: 'Roteador Gateway',
      description: 'ZTE ZXHN H199A, Wi-Fi 2.4/5GHz e Convidados',
      icon: <Router className="w-5 h-5" />,
      extraBadge: isAdmin ? (
        <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
          <Lock className="w-3 h-3" /> Admin
        </span>
      ) : (
        <span className="p-1 rounded bg-amber-500/20 text-amber-400 text-[10px] flex items-center gap-1 font-bold animate-pulse">
          <KeyRound className="w-3 h-3" /> Conectar
        </span>
      )
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Parâmetros do sistema e persistência local',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const isCurrentInSecondary = ['topology', 'traffic', 'access', 'schedules', 'settings'].includes(currentTab);

  return (
    <>
      {/* Fixed Bottom Bar on Mobile (Native App Shell) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-neutral-800 lg:hidden px-1 py-1.5 pb-safe grid grid-cols-5 gap-0.5 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] select-none">
        {bottomTabs.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all relative cursor-pointer active:scale-95 ${
                isActive ? 'text-cyan-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-sm" />
              )}
            </button>
          );
        })}

        {/* Menu Completo / Mais (Opens the full slide-in drawer) */}
        <button
          onClick={onToggleDrawer}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all relative cursor-pointer active:scale-95 ${
            isCurrentInSecondary || isDrawerOpen
              ? 'text-cyan-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Abrir menu completo com todas as opções"
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight">Menu Total</span>
          {(isCurrentInSecondary || isDrawerOpen) && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-sm" />
          )}
        </button>
      </nav>

      {/* FULL-FEATURED MOBILE DRAWER (Complete Mirror of Desktop Sidebar + Tools) */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden flex justify-start animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseDrawer();
          }}
        >
          <div className="w-[85vw] max-w-sm bg-neutral-950 border-r border-neutral-800 h-full flex flex-col justify-between overflow-hidden shadow-2xl animate-slide-right">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-800/90 flex items-center justify-between gap-3 bg-neutral-900/50">
              <div className="flex items-center gap-2">
                <img 
                  src={`${import.meta.env.BASE_URL}logo.png`} 
                  alt="In-Wifi" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-sm font-black tracking-tight text-white">In-Wifi</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  PRO
                </span>
              </div>

              <button
                onClick={onCloseDrawer}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Quick Live Telemetry Strip on Mobile */}
              <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {routerInfo?.name || 'ZTE ZXHN H199A'}
                  </span>
                  <span className="font-mono text-cyan-400 text-[10px]">
                    {routerInfo?.ipAddress || '192.168.1.1'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800 text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <ArrowDownCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{formatSpeed(totalDlKbps)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <ArrowUpCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{formatSpeed(totalUlKbps)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-300 justify-end">
                    <Radio className="w-3 h-3 text-brand-400 flex-shrink-0" />
                    <span>1ms LAN</span>
                  </div>
                </div>

                {/* Quick Admin Auth Button inside Drawer */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('routers');
                      onCloseDrawer();
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition cursor-pointer ${
                      isAdmin
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isAdmin ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <KeyRound className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{isAdmin ? 'Super Admin Autenticado' : 'Conectar Senha do Roteador'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              </div>

              {/* Complete List of ALL 9 Navigation Modules */}
              <div className="space-y-1">
                <div className="px-2 pb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Todas as Opções (9 Módulos)</span>
                  <span className="text-cyan-400 font-mono text-[9px]">Centro Total</span>
                </div>

                {allModules.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseDrawer();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800 text-white border border-neutral-700 shadow-md'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-900/90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`p-2 rounded-xl flex-shrink-0 ${
                          isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-900 text-neutral-400'
                        }`}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                        {item.extraBadge}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-neutral-600'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hardware Capabilities (Identical to Desktop Sidebar) */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-300">Ferramentas Hardware</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isAdmin 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {isAdmin ? 'Admin Ativo' : 'Somente Leitura'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>Descoberta</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>Bloqueio MAC</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-400">
                    {capabilities.deviceKick ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                    )}
                    <span>Kick Wi-Fi</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-400">
                    {capabilities.staticIpReservation ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                    )}
                    <span>IP Estático</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-400">
                    {capabilities.portScanner ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                    )}
                    <span>Scanner Portas</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-400">
                    {capabilities.wakeOnLan ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                    )}
                    <span>Wake-on-LAN</span>
                  </div>
                </div>
              </div>

              {/* Gateway Connection Trigger */}
              {onOpenRouterModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenRouterModal();
                    onCloseDrawer();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Configurar Conexão Gateway</span>
                </button>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-800/90 text-[11px] text-neutral-400 space-y-1 bg-neutral-950">
              <div className="flex items-center justify-between">
                <span>In-Wifi LAN Console</span>
                <span className="font-mono text-emerald-400 text-[10px]">Zero DB Mode</span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Coleta direta do fluxo do roteador ZTE ZXHN H199A
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
