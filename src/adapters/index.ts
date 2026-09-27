import { RouterAdapter } from './RouterAdapter';
import { RealRouterAdapter } from './RealRouterAdapter';
import { SnmpRouterAdapter, SnmpConfig } from './SnmpRouterAdapter';
import { ApiRouterAdapter, ApiRouterConfig } from './ApiRouterAdapter';

export * from './RouterAdapter';
export * from './RealRouterAdapter';
export * from './SnmpRouterAdapter';
export * from './ApiRouterAdapter';

class AdapterService {
  private currentAdapter: RouterAdapter;
  private registeredAdapters: Map<string, RouterAdapter> = new Map();
  private listeners: Array<(adapter: RouterAdapter) => void> = [];

  constructor() {
    // Adaptador de Produção: Roteador Real ZTE ZXHN H199A (192.168.1.1)
    const realRouter = new RealRouterAdapter();
    this.currentAdapter = realRouter;
    this.registeredAdapters.set(realRouter.id, realRouter);

    // Conector SNMP opcional para roteadores e switches adicionais
    const snmpAdapter = new SnmpRouterAdapter({
      host: '192.168.1.254',
      port: 161,
      version: '2c',
      community: 'public'
    });
    this.registeredAdapters.set('snmp-generic-adapter', snmpAdapter);
  }

  getActiveAdapter(): RouterAdapter {
    return this.currentAdapter;
  }

  getAllAdapters(): RouterAdapter[] {
    return Array.from(this.registeredAdapters.values());
  }

  setActiveAdapter(adapterId: string): boolean {
    const adapter = this.registeredAdapters.get(adapterId);
    if (!adapter) return false;
    this.currentAdapter = adapter;
    this.notifyListeners();
    return true;
  }

  registerCustomAdapter(adapter: RouterAdapter) {
    this.registeredAdapters.set(adapter.id, adapter);
    this.notifyListeners();
  }

  removeAdapter(adapterId: string): boolean {
    if (adapterId === this.currentAdapter.id) return false;
    const deleted = this.registeredAdapters.delete(adapterId);
    if (deleted) this.notifyListeners();
    return deleted;
  }

  subscribe(callback: (adapter: RouterAdapter) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentAdapter);
      } catch (err) {
        console.error('Erro no listener de troca de adaptador:', err);
      }
    });
  }
}

export const adapterService = new AdapterService();
