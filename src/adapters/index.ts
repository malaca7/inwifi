import { RouterAdapter } from './RouterAdapter';
import { MockRouterAdapter } from './MockRouterAdapter';
import { SnmpRouterAdapter, SnmpConfig } from './SnmpRouterAdapter';
import { ApiRouterAdapter, ApiRouterConfig } from './ApiRouterAdapter';

export * from './RouterAdapter';
export * from './MockRouterAdapter';
export * from './SnmpRouterAdapter';
export * from './ApiRouterAdapter';

class AdapterService {
  private currentAdapter: RouterAdapter;
  private registeredAdapters: Map<string, RouterAdapter> = new Map();
  private listeners: Array<(adapter: RouterAdapter) => void> = [];

  constructor() {
    // Adapter padrão inicial: MockRouterAdapter (Modo Demo)
    const mock = new MockRouterAdapter();
    this.currentAdapter = mock;
    this.registeredAdapters.set(mock.id, mock);

    // Pré-registra exemplo de SNMP para demonstração de troca de capacidades
    const snmpDemo = new SnmpRouterAdapter({
      host: '192.168.1.254',
      port: 161,
      version: '2c',
      community: 'public'
    });
    this.registeredAdapters.set('snmp-generic-adapter', snmpDemo);
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
