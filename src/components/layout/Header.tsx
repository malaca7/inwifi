import React, { useState } from 'react';
import { 
  Wifi, Bell, 
  ArrowDownCircle, ArrowUpCircle, Menu, X,
  Radio
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { NetworkEvent } from '../../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onNavigateToAlerts: () => void;
  onNavigateToRouters: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onNavigateToAlerts,
  onNavigateToRouters
}) => {
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const routerInfo = networkService.getRouterInfo();
  const unreadCount = networkService.getUnreadEventsCount();
  const recentEvents = networkService.getEvents().slice(0, 5);
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

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-bg/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 lg:hidden text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
            aria-label="Abrir menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-400 p-[1.5px] shadow-glow-sm">
              <div className="w-full h-full bg-[#06080F] rounded-[14px] flex items-center justify-center">
                <Wifi className="w-5 h-5 text-cyan-400 animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">IN-WIFI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest hidden sm:block">
                Network Intelligence Center
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Real Hardware Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-300 tracking-wide font-sans">
            {routerInfo?.name || 'ZTE ZXHN H199A'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold hidden md:inline">
            LIVE LAN
          </span>
        </div>

        {/* Right: Telemetry, Notifications & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Live Telemetry Pills (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-2xl text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>{formatSpeed(totalDlKbps)}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>{formatSpeed(totalUlKbps)}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Radio className="w-3 h-3 text-brand-400" />
              <span>Ping 8ms</span>
            </div>
          </div>

          {/* Router Quick Switcher Chip */}
          <button
            onClick={onNavigateToRouters}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
            title="Gerenciar Roteadores e Adaptadores"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="truncate max-w-[130px] font-sans">
              {routerInfo?.name || 'Roteador Principal'}
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-800 text-slate-400 uppercase">
              {routerInfo?.protocol || 'api'}
            </span>
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-dark-card border border-slate-800 rounded-2xl shadow-card-dark z-50 p-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Central de Alertas</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-500/20 text-brand-400 rounded-full">
                        {unreadCount} novos
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => networkService.markAllEventsAsRead()}
                      className="text-xs text-brand-400 hover:text-brand-300 transition"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum evento registrado.</p>
                  ) : (
                    recentEvents.map((evt: NetworkEvent) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          networkService.markEventAsRead(evt.id);
                          setShowNotificationsDropdown(false);
                          onNavigateToAlerts();
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          evt.read 
                            ? 'bg-slate-950/40 border-slate-800/60 text-slate-400' 
                            : 'bg-brand-950/20 border-brand-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{evt.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {evt.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      onNavigateToAlerts();
                    }}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                  >
                    Ver todos os alertas e histórico →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Avatar Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-glow-sm">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">Admin Rede</div>
              <div className="text-[10px] text-slate-400">Administrador LAN</div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
