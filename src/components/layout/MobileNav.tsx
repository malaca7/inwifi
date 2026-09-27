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
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'devices', label: 'Aparelhos', icon: <Laptop2 className="w-5 h-5" /> },
    { id: 'topology', label: 'Rede', icon: <Share2 className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
  ];

  const drawerTabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'traffic', label: 'Consumo & Tráfego', icon: <Activity className="w-5 h-5" /> },
    { id: 'access', label: 'Controle de Acesso', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="w-5 h-5" /> },
    { id: 'routers', label: 'Roteadores & Conectores', icon: <Router className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações do Sistema', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Fixed Bottom Bar on Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-bg/95 backdrop-blur-xl border-t border-slate-800 lg:hidden px-2 py-2 flex items-center justify-around shadow-2xl">
        {mainTabs.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
                isActive ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* More Options Tab */}
        <button
          onClick={() => {
            if (isDrawerOpen) onCloseDrawer();
            else onSelectTab(currentTab === 'traffic' || currentTab === 'access' || currentTab === 'schedules' || currentTab === 'routers' || currentTab === 'settings' ? currentTab : 'traffic');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            ['traffic', 'access', 'schedules', 'routers', 'settings'].includes(currentTab)
              ? 'text-brand-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </nav>

      {/* Mobile Drawer Modal for Secondary Tabs */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-fade-in">
          <div className="bg-dark-surface border-t border-slate-800 rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Módulos do Sistema
              </span>
              <button
                onClick={onCloseDrawer}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-glow-sm'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{item.icon}</span>
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
