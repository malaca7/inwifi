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
import { networkService } from './services/networkService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to live reactive updates from NetworkService
  useEffect(() => {
    const unsubscribe = networkService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Register PWA service worker if supported
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('SW registration error:', err);
        });
      });
    }
  }, []);

  const capabilities = networkService.getCapabilities();
  const unreadAlertsCount = networkService.getUnreadEventsCount();

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToDevices={() => setCurrentTab('devices')}
            onNavigateToAlerts={() => setCurrentTab('alerts')}
            onNavigateToTraffic={() => setCurrentTab('traffic')}
            capabilities={capabilities}
          />
        );
      case 'devices':
        return <DevicesPage capabilities={capabilities} />;
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
        return <RoutersPage capabilities={capabilities} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigateToDevices={() => setCurrentTab('devices')}
            onNavigateToAlerts={() => setCurrentTab('alerts')}
            onNavigateToTraffic={() => setCurrentTab('traffic')}
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
        onNavigateToAlerts={() => setCurrentTab('alerts')}
        onNavigateToRouters={() => setCurrentTab('routers')}
      />

      <div className="flex-1 flex w-full overflow-hidden">
        {/* Fixed Desktop Sidebar - Stays fixed on left */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            const mainEl = document.getElementById('main-scroll-area');
            if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          capabilities={capabilities}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Main Content Area - Scrolls independently without moving the sidebar or header */}
        <main id="main-scroll-area" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24 lg:pb-8">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Navigation Bar & Drawer */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
          const mainEl = document.getElementById('main-scroll-area');
          if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadCount={unreadAlertsCount}
        isDrawerOpen={isMobileMenuOpen}
        onCloseDrawer={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
};

export default App;
