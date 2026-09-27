import React from 'react';
import { LayoutDashboard, Laptop2, Share2, Bell, MoreHorizontal, Activity, ShieldAlert, Calendar, Router, Settings, X } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount: number;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  unreadCount,
  isDrawerOpen,
  onCloseDrawer
}) => {
  const mainTabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'devices', label: 'Aparelhos', icon: <Laptop2 className="w-5 h-5" /> },
    { id: 'routers', label: 'Roteador', icon: <Router className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
  ];

  const drawerTabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'topology', label: 'Topologia da Rede', icon: <Share2 className="w-5 h-5" /> },
    { id: 'traffic', label: 'Consumo & Tráfego', icon: <Activity className="w-5 h-5" /> },
    { id: 'access', label: 'Controle de Acesso', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações do Sistema', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Fixed Bottom Bar on Mobile (Native App Shell) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-neutral-800 lg:hidden px-3 pt-2 pb-2.5 pb-safe flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
        {mainTabs.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive ? 'text-cyan-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-sm" />
              )}
            </button>
          );
        })}

        {/* More Options Tab (Drawer) */}
        <button
          onClick={() => {
            if (isDrawerOpen) onCloseDrawer();
            else onSelectTab('topology');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
            ['topology', 'traffic', 'access', 'schedules', 'settings'].includes(currentTab)
              ? 'text-cyan-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Mais</span>
          {['topology', 'traffic', 'access', 'schedules', 'settings'].includes(currentTab) && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-sm" />
          )}
        </button>
      </nav>

      {/* Mobile Drawer Modal for Secondary Tabs */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-fade-in">
          <div className="bg-neutral-950 border-t border-neutral-800 rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Módulos do Sistema
              </span>
              <button
                onClick={onCloseDrawer}
                className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {drawerTabs.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseDrawer();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-neutral-800 text-white border border-neutral-700 shadow-md'
                        : 'text-neutral-300 hover:bg-neutral-900'
                    }`}
                  >
                    <span className={isActive ? 'text-cyan-400' : 'text-neutral-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
