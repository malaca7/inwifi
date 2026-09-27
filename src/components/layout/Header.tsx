import React, { useState } from 'react';
import { 
  Wifi, Bell, 
  ArrowDownCircle, ArrowUpCircle, Menu, X,
  Radio, LogOut
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { NetworkEvent } from '../../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onNavigateToAlerts: () => void;
  onNavigateToRouters: () => void;
  onDisconnectRouter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onNavigateToAlerts,
  onNavigateToRouters,
  onDisconnectRouter
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
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-xl border-b border-neutral-800/90 px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 transition-all select-none">
      <div className="flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left: Mobile Toggle & Official Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 sm:p-2 lg:hidden text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition cursor-pointer"
            aria-label="Abrir menu de navegação"
            title="Abrir menu completo"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-1.5 group transition-transform duration-200 hover:scale-[1.02]"
            title="In-Wifi — Central de Inteligência de Rede"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="IN-WIFI"
              className="h-7 sm:h-11 w-auto max-w-[110px] sm:max-w-[260px] object-contain drop-shadow-[0_2px_12px_rgba(0,180,255,0.25)] select-none"
            />
          </a>
        </div>

        {/* Center: Live Real Hardware Status Badge & Admin Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <button
            onClick={onNavigateToRouters}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition animate-fade-in group cursor-pointer max-w-[100px] sm:max-w-none min-w-0"
            title="Clique para gerenciar o Roteador Gateway"
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300 tracking-wide font-sans group-hover:text-emerald-200 truncate">
              {routerInfo?.name || 'ZTE ZXHN H199A'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold hidden md:inline">
              {routerInfo?.ipAddress || '192.168.1.1'}
            </span>
          </button>

          {/* Admin Status Pill (Desktop & Mobile) */}
          <button
            onClick={onNavigateToRouters}
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
              routerInfo?.isAdminAuthenticated
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-glow-sm'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 animate-pulse'
            }`}
            title={routerInfo?.isAdminAuthenticated ? 'Sessão Admin Ativa: Todas as ferramentas desbloqueadas' : 'Clique para conectar como Administrador com senha'}
          >
            <span>{routerInfo?.isAdminAuthenticated ? '🔒' : '🔑'}</span>
            <span className="hidden sm:inline">
              {routerInfo?.isAdminAuthenticated ? 'Admin Desbloqueado' : 'Conectar Senha'}
            </span>
          </button>

          {onDisconnectRouter && (
            <button
              type="button"
              onClick={onDisconnectRouter}
              className="p-1.5 rounded-xl border border-neutral-800 hover:border-cyan-500/40 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition cursor-pointer hidden md:flex"
              title="Configurações do Gateway"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Telemetry, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Compact Speed Pill for Mobile / Tablet */}
          <div className="flex xl:hidden items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-xl text-[10px] font-mono text-emerald-400">
            <ArrowDownCircle className="w-3 h-3 text-emerald-400" />
            <span>{formatSpeed(totalDlKbps)}</span>
          </div>

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
              <span>Ping LAN</span>
            </div>
          </div>

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
