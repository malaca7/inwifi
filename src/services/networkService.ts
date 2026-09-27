import { adapterService, RouterAdapter } from '../adapters';
import { Device, DeviceBand, RouterInfo, RouterCapabilities, NetworkEvent, TrafficPoint, NetworkTopologyItem, WifiSettings } from '../types';
import { notificationService } from './notificationService';

class NetworkService {
  private currentAdapter: RouterAdapter;
  private devices: Device[] = [];
  private events: NetworkEvent[] = [];
  private routerInfo: RouterInfo | null = null;
  private trafficStats: TrafficPoint[] = [];
  private isLoading = true;
  private pollInterval: number | null = null;

  private listeners: Array<() => void> = [];

  constructor() {
    this.currentAdapter = adapterService.getActiveAdapter();

    adapterService.subscribe((adapter) => {
      this.currentAdapter = adapter;
      this.refreshData();
    });

    this.init();
  }

  private async init() {
    await this.refreshData();

    // Start background light polling for real-time telemetry
    this.pollInterval = window.setInterval(() => {
      this.pollLightTelemetry();
    }, 4000);

    // Subscribe to adapter events
    this.currentAdapter.subscribeEvents((event) => {
      this.events.unshift(event);
      notificationService.playChime(event.severity === 'error' ? 'error' : event.severity === 'warning' ? 'warning' : 'info');
      notificationService.sendBrowserNotification(event);
      this.notify();
    });
  }

  async refreshData() {
    this.isLoading = true;
    this.notify();
    try {
      const [info, devs, evts, traffic] = await Promise.all([
        this.currentAdapter.getRouterInfo(),
        this.currentAdapter.getDevices(),
        this.currentAdapter.getEvents(),
        this.currentAdapter.getTrafficStats('realtime')
      ]);

      this.routerInfo = info;
      this.devices = devs;
      this.events = evts;
      this.trafficStats = traffic;
    } catch (err) {
      console.error('Erro ao carregar dados da rede:', err);
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  private async pollLightTelemetry() {
    try {
      const [devs, traffic, info] = await Promise.all([
        this.currentAdapter.getDevices(),
        this.currentAdapter.getTrafficStats('realtime'),
        this.currentAdapter.getRouterInfo()
      ]);
      this.devices = devs;
      this.trafficStats = traffic;
      this.routerInfo = info;
      this.notify();
    } catch {
      // ignore transient poll error
    }
  }

  getAdapter(): RouterAdapter {
    return this.currentAdapter;
  }

  getCapabilities(): RouterCapabilities {
    return this.currentAdapter.getCapabilities();
  }

  isDemoMode(): boolean {
    return this.currentAdapter.isDemoMode;
  }

  getRouterInfo(): RouterInfo | null {
    return this.routerInfo;
  }

  getDevices(): Device[] {
    return [...this.devices];
  }

  getDeviceById(id: string): Device | undefined {
    return this.devices.find(d => d.id === id);
  }

  getEvents(): NetworkEvent[] {
    return [...this.events];
  }

  getUnreadEventsCount(): number {
    return this.events.filter(e => !e.read).length;
  }

  markEventAsRead(id: string) {
    const evt = this.events.find(e => e.id === id);
    if (evt) {
      evt.read = true;
      this.notify();
    }
  }

  markAllEventsAsRead() {
    this.events.forEach(e => { e.read = true; });
    this.notify();
  }

  getTrafficStats(): TrafficPoint[] {
    return [...this.trafficStats];
  }

  async getTrafficHistory(period: 'realtime' | 'day' | 'week' | 'month'): Promise<TrafficPoint[]> {
    return await this.currentAdapter.getTrafficStats(period);
  }

  async renameDevice(deviceId: string, newName: string): Promise<boolean> {
    const success = await this.currentAdapter.renameDevice(deviceId, newName);
    if (success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.customName = newName.trim() || null;
      }
      this.notify();
    }
    return success;
  }

  async blockDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const caps = this.getCapabilities();
    if (!caps.blocking) {
      return {
        success: false,
        error: 'Este recurso não é suportado pelo roteador atual ou adaptador ativo.'
      };
    }
    const res = await this.currentAdapter.blockDevice(deviceId);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) dev.status = 'blocked';
      this.notify();
    }
    return res;
  }

  async unblockDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const caps = this.getCapabilities();
    if (!caps.blocking) {
      return {
        success: false,
        error: 'Este recurso não é suportado pelo roteador atual ou adaptador ativo.'
      };
    }
    const res = await this.currentAdapter.unblockDevice(deviceId);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) dev.status = 'online';
      this.notify();
    }
    return res;
  }

  async pauseDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const caps = this.getCapabilities();
    if (!caps.pauseResume) {
      return {
        success: false,
        error: 'O recurso de pausar conexão não é suportado pelo roteador atual.'
      };
    }
    const res = await this.currentAdapter.pauseDevice(deviceId);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) dev.status = 'paused';
      this.notify();
    }
    return res;
  }

  async resumeDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const caps = this.getCapabilities();
    if (!caps.pauseResume) {
      return {
        success: false,
        error: 'O recurso de retomar conexão não é suportado pelo roteador atual.'
      };
    }
    const res = await this.currentAdapter.resumeDevice(deviceId);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) dev.status = 'online';
      this.notify();
    }
    return res;
  }

  async setSpeedLimit(deviceId: string, kbps: number | null): Promise<{ success: boolean; error?: string }> {
    const caps = this.getCapabilities();
    if (!caps.speedLimit) {
      return {
        success: false,
        error: 'Este recurso não é suportado pelo roteador atual.'
      };
    }
    const res = await this.currentAdapter.setSpeedLimit(deviceId, kbps);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) dev.speedLimitKbps = kbps;
      this.notify();
    }
    return res;
  }

  /** Autenticação Admin no roteador */
  async loginAdmin(password: string, username = 'admin'): Promise<{ success: boolean; error?: string }> {
    const res = await this.currentAdapter.loginAdmin(password, username);
    if (res.success) {
      await this.refreshData();
    }
    return res;
  }

  /** Encerrar sessão de Admin */
  async logoutAdmin(): Promise<void> {
    await this.currentAdapter.logoutAdmin();
    await this.refreshData();
  }

  /** Reiniciar o roteador fisicamente */
  async rebootRouter(): Promise<{ success: boolean; error?: string }> {
    return await this.currentAdapter.rebootRouter();
  }

  /** Expulsar aparelho do sinal Wi-Fi (Kick) */
  async kickDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.currentAdapter.kickDevice(deviceId);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.kickCount = (dev.kickCount || 0) + 1;
        this.notify();
      }
    }
    return res;
  }

  /** Fixar ou liberar endereço IP estático no roteador */
  async setStaticIp(deviceId: string, isStatic: boolean): Promise<{ success: boolean; error?: string }> {
    const res = await this.currentAdapter.setStaticIp(deviceId, isStatic);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.isStaticIp = isStatic;
        this.notify();
      }
    }
    return res;
  }

  /** Definir prioridade de tráfego QoS */
  async setTrafficPriority(deviceId: string, priority: 'high' | 'normal' | 'low'): Promise<{ success: boolean; error?: string }> {
    const res = await this.currentAdapter.setTrafficPriority(deviceId, priority);
    if (res.success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.priority = priority;
        this.notify();
      }
    }
    return res;
  }

  /** Salvar anotações e proprietário do dispositivo */
  async setDeviceNotes(deviceId: string, notes: string, ownerName?: string): Promise<boolean> {
    const success = await this.currentAdapter.setDeviceNotes(deviceId, notes, ownerName);
    if (success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.notes = notes;
        if (ownerName !== undefined) dev.ownerName = ownerName;
        this.notify();
      }
    }
    return success;
  }

  /** Definir tipo de conexão/banda do dispositivo (Wi-Fi 5GHz, 2.4GHz ou Cabo LAN) */
  async setDeviceBand(deviceId: string, band: DeviceBand): Promise<boolean> {
    const success = await (this.currentAdapter as any).setDeviceBand?.(deviceId, band);
    if (success) {
      const dev = this.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.band = band;
        this.notify();
      }
    }
    return !!success;
  }

  /** Enviar pacote mágico Wake-on-LAN para ligar o PC */
  async sendWakeOnLan(deviceId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return await this.currentAdapter.sendWakeOnLan(deviceId);
  }

  /** Escanear portas abertas no dispositivo */
  async scanDevicePorts(deviceId: string): Promise<{ openPorts: number[]; portsScanned: number }> {
    return await this.currentAdapter.scanDevicePorts(deviceId);
  }

  /** Obter configurações atuais de Wi-Fi */
  async getWifiSettings(): Promise<WifiSettings> {
    return await this.currentAdapter.getWifiSettings();
  }

  /** Atualizar configurações de Wi-Fi e Rádio (SSID, senha, canais, etc.) */
  async updateWifiSettings(settings: Partial<WifiSettings>): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await this.currentAdapter.updateWifiSettings(settings);
    if (res.success) {
      await this.refreshData();
    }
    return res;
  }

  /** Alternar Modo Smart Connect (Rede Única Inteligente) / WLAN Band Steering no roteador */
  async toggleBandSteering(enabled: boolean): Promise<{ success: boolean; message?: string; error?: string }> {
    if (this.currentAdapter.toggleBandSteering) {
      const res = await this.currentAdapter.toggleBandSteering(enabled);
      if (res.success) {
        await this.refreshData();
      }
      return res;
    }
    return await this.updateWifiSettings({ isUnifiedSsid: enabled, bandSteeringEnabled: enabled });
  }

  /** Alterar senha de administrador do roteador */
  async changeAdminPassword(newPassword: string, oldPassword?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await this.currentAdapter.changeAdminPassword(newPassword, oldPassword);
    if (res.success) {
      await this.refreshData();
    }
    return res;
  }

  /** Ação em massa: Bloquear múltiplos */
  async bulkBlockDevices(deviceIds: string[]): Promise<number> {
    let count = 0;
    for (const id of deviceIds) {
      const res = await this.blockDevice(id);
      if (res.success) count++;
    }
    return count;
  }

  /** Ação em massa: Liberar múltiplos */
  async bulkUnblockDevices(deviceIds: string[]): Promise<number> {
    let count = 0;
    for (const id of deviceIds) {
      const res = await this.unblockDevice(id);
      if (res.success) count++;
    }
    return count;
  }

  /** Ação em massa: Pausar múltiplos */
  async bulkPauseDevices(deviceIds: string[]): Promise<number> {
    let count = 0;
    for (const id of deviceIds) {
      const res = await this.pauseDevice(id);
      if (res.success) count++;
    }
    return count;
  }

  /** Ação em massa: Expulsar múltiplos */
  async bulkKickDevices(deviceIds: string[]): Promise<number> {
    let count = 0;
    for (const id of deviceIds) {
      const res = await this.kickDevice(id);
      if (res.success) count++;
    }
    return count;
  }

  /** Recarrega telemetria da rede */
  refreshTelemetry() {
    this.refreshData();
  }

  /** Gera a topologia visual da rede */
  getNetworkTopology(): NetworkTopologyItem[] {
    const nodes: NetworkTopologyItem[] = [
      {
        id: 'node_internet',
        label: 'Internet Pública (WAN)',
        sublabel: 'Gateway WAN • Link de Fibra Ativo',
        type: 'internet',
        status: 'online'
      },
      {
        id: 'node_router',
        label: this.routerInfo?.name || 'Roteador Principal ZTE',
        sublabel: `${this.routerInfo?.ipAddress || '192.168.1.1'} (${this.routerInfo?.brand || 'ZTE'} ${this.routerInfo?.model || 'ZXHN H199A'})`,
        type: 'router',
        status: this.routerInfo?.isOnline ? 'online' : 'offline',
        connectedToId: 'node_internet'
      }
    ];

    // Conecta dispositivos reais diretamente ao roteador/gateway
    this.devices.forEach(dev => {
      nodes.push({
        id: dev.id,
        label: dev.customName || dev.originalHostname,
        sublabel: `${dev.ip} • ${dev.band}`,
        type: 'device',
        category: dev.category,
        ip: dev.ip,
        mac: dev.mac,
        status: dev.status === 'online' ? 'online' : dev.status === 'blocked' ? 'warning' : 'offline',
        connectedToId: 'node_router',
        signalStrength: dev.signalStrength,
        band: dev.band
      });
    });

    return nodes;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error(err);
      }
    });
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

export const networkService = new NetworkService();
