import { useState, useEffect, useCallback } from 'react';
import { NavTab } from '../components/layout/Sidebar';

export interface RouteState {
  tab: NavTab;
  subTab?: string;
  params: Record<string, string>;
}

// Friendly URL map
const TAB_TO_SLUG: Record<NavTab, string> = {
  dashboard: 'dashboard',
  devices: 'dispositivos',
  topology: 'topologia',
  alerts: 'alertas',
  traffic: 'trafego',
  access: 'controle-acesso',
  schedules: 'agendamentos',
  routers: 'roteador',
  settings: 'configuracoes'
};

const SLUG_TO_TAB: Record<string, NavTab> = {
  dashboard: 'dashboard',
  inicio: 'dashboard',
  home: 'dashboard',
  dispositivos: 'devices',
  devices: 'devices',
  aparelhos: 'devices',
  topologia: 'topology',
  topology: 'topology',
  rede: 'topology',
  alertas: 'alerts',
  alerts: 'alerts',
  eventos: 'alerts',
  trafego: 'traffic',
  traffic: 'traffic',
  consumo: 'traffic',
  'controle-acesso': 'access',
  access: 'access',
  bloqueios: 'access',
  agendamentos: 'schedules',
  schedules: 'schedules',
  roteador: 'routers',
  routers: 'routers',
  gateway: 'routers',
  wifi: 'routers',
  configuracoes: 'settings',
  settings: 'settings',
  ajustes: 'settings'
};

// Sub-tab slug mappings for Router Gateway
export const ROUTER_SUBTAB_TO_SLUG: Record<string, string> = {
  main: 'wifi',
  guest: 'convidados',
  radio: 'radio',
  admin: 'seguranca'
};

export const ROUTER_SLUG_TO_SUBTAB: Record<string, string> = {
  wifi: 'main',
  'wi-fi': 'main',
  principal: 'main',
  convidados: 'guest',
  guest: 'guest',
  visitas: 'guest',
  radio: 'radio',
  canais: 'radio',
  seguranca: 'admin',
  admin: 'admin',
  senha: 'admin'
};

/**
 * Parse current URL hash / path into structured RouteState
 */
export function parseCurrentRoute(): RouteState {
  let raw = window.location.hash.replace(/^#\/?/, '').trim();
  
  // If hash is empty, check pathname if it has a trailing slug
  if (!raw) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && SLUG_TO_TAB[lastPart]) {
      raw = lastPart;
    }
  }

  if (!raw) {
    return { tab: 'dashboard', params: {} };
  }

  // Extract query string if present: path?key=val
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);

  const primarySlug = (segments[0] || 'dashboard').toLowerCase();
  const tab: NavTab = SLUG_TO_TAB[primarySlug] || 'dashboard';

  let subTab: string | undefined = undefined;
  if (segments[1]) {
    const subSlug = segments[1].toLowerCase();
    if (tab === 'routers') {
      subTab = ROUTER_SLUG_TO_SUBTAB[subSlug] || subSlug;
    } else {
      subTab = subSlug;
    }
  }

  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { tab, subTab, params };
}

/**
 * Build a friendly URL hash for the target tab & sub-tab
 */
export function buildRouteHash(tab: NavTab, subTab?: string, params?: Record<string, string>): string {
  const tabSlug = TAB_TO_SLUG[tab] || tab;
  let path = `/${tabSlug}`;

  if (tab === 'routers' && subTab) {
    const subSlug = ROUTER_SUBTAB_TO_SLUG[subTab] || subTab;
    path += `/${subSlug}`;
  } else if (subTab) {
    path += `/${subTab}`;
  }

  if (params && Object.keys(params).length > 0) {
    const q = new URLSearchParams(params).toString();
    if (q) path += `?${q}`;
  }

  return `#${path}`;
}

/**
 * Custom React hook for synchronized, friendly URL navigation
 */
export function useAppRouter() {
  const [route, setRoute] = useState<RouteState>(() => parseCurrentRoute());

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseCurrentRoute();
      setRoute(parsed);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // If initial URL has no hash, normalize to #/dashboard
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/dashboard');
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = useCallback((tab: NavTab, subTab?: string, params?: Record<string, string>) => {
    const newHash = buildRouteHash(tab, subTab, params);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
      setRoute({ tab, subTab, params: params || {} });
    }
  }, []);

  const replace = useCallback((tab: NavTab, subTab?: string, params?: Record<string, string>) => {
    const newHash = buildRouteHash(tab, subTab, params);
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
      setRoute({ tab, subTab, params: params || {} });
    }
  }, []);

  return {
    currentTab: route.tab,
    currentSubTab: route.subTab,
    queryParams: route.params,
    navigate,
    replace
  };
}
