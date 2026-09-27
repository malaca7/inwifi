import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { TopologyPage } from './pages/TopologyPage';
import { AlertsPage } from './pages/AlertsPage';
import { TrafficPage } from './pages/TrafficPage';
import { AccessControlPage } from './pages/AccessControlPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { RoutersPage } from './pages/RoutersPage';
import { SettingsPage } from './pages/SettingsPage';
import { RouterConnectionGate } from './components/router/RouterConnectionGate';
import { networkService } from './services/networkService';
import { useAppRouter } from './utils/router';

export const App: React.FC = () => {
  const { currentTab, currentSubTab, queryParams, navigate } = useAppRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  // Router Gateway Connection & Configuration Modal
  const [isRouterConnected, setIsRouterConnected] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('inwifi_gateway_connected');
      return saved ? true : true; // Default true so platform loads immediately without blocking
    } catch {
      return true;
    }
  });
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);

  const handleDisconnectRouter = () => {
    setIsRouterModalOpen(true);
  };

  // Subscribe to live reactive updates from NetworkService
  useEffect(() => {
    const unsubscribe = networkService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Clean up any stale service workers or caches to avoid blank screen caching issues
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(key => caches.delete(key));
        });
      }
    }
  }, []);

  const capabilities = networkService.getCapabilities();
  const unreadAlertsCount = networkService.getUnreadEventsCount();

  const handleSelectTab = (tab: NavTab) => {
    navigate(tab);
    const mainEl = document.getElementById('main-scroll-area');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToDevices={() => handleSelectTab('devices')}
            onNavigateToAlerts={() => handleSelectTab('alerts')}
            onNavigateToTraffic={() => handleSelectTab('traffic')}
            capabilities={capabilities}
          />
        );
      case 'devices':
        return (
          <DevicesPage 
            capabilities={capabilities} 
            queryParams={queryParams}
            onQueryChange={(params) => navigate('devices', undefined, params)}
          />
        );
      case 'topology':
        return <TopologyPage capabilities={capabilities} />;
      case 'alerts':
        return <AlertsPage capabilities={capabilities} />;
      case 'traffic':
        return <TrafficPage capabilities={capabilities} />;
      case 'access':
        return <AccessControlPage capabilities={capabilities} />;
      case 'schedules':
        return <SchedulesPage capabilities={capabilities} />;
      case 'routers':
        return (
          <RoutersPage 
            capabilities={capabilities} 
            initialSubTab={currentSubTab}
            onSubTabChange={(sub) => navigate('routers', sub)}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigateToDevices={() => handleSelectTab('devices')}
            onNavigateToAlerts={() => handleSelectTab('alerts')}
            onNavigateToTraffic={() => handleSelectTab('traffic')}
            capabilities={capabilities}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-black text-neutral-100 flex flex-col overflow-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Top Main Navigation Header - Fixed at Top */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onNavigateToAlerts={() => handleSelectTab('alerts')}
        onNavigateToRouters={() => handleSelectTab('routers')}
        onDisconnectRouter={handleDisconnectRouter}
      />

      <div className="flex-1 flex w-full overflow-hidden">
        {/* Fixed Desktop Sidebar - Stays fixed on left */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          capabilities={capabilities}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Main Content Area - Scrolls independently without moving the sidebar or header, with zero horizontal overflow */}
        <main id="main-scroll-area" className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden pb-24 lg:pb-8 min-w-0">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Navigation Bar & Drawer */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          handleSelectTab(tab);
          setIsMobileMenuOpen(false);
        }}
        unreadCount={unreadAlertsCount}
        isDrawerOpen={isMobileMenuOpen}
        onCloseDrawer={() => setIsMobileMenuOpen(false)}
      />

      {/* Router Connection & Management Overlay Modal */}
      {isRouterModalOpen && (
        <RouterConnectionGate
          onConnected={() => {
            setIsRouterConnected(true);
            setIsRouterModalOpen(false);
          }}
          onClose={() => setIsRouterModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
