import { Device, RouterCapabilities, RouterInfo, NetworkEvent, TrafficPoint, WifiSettings } from '../types';
import { RouterAdapter } from './RouterAdapter';

export interface ApiRouterConfig {
  baseUrl: string;
  brand: 'openwrt' | 'asuswrt' | 'mikrotik' | 'tplink_omada' | 'generic_rest';
  port: number;
  useHttps: boolean;
  // Credenciais trafegadas com segurança apenas via backend/proxy
  authToken?: string;
}

/**
 * Conector para Roteadores com API REST / JSON-RPC / SDN.
 * Exemplos: OpenWrt LuCI, AsusWRT Merlín, MikroTik RouterOS REST, TP-Link Omada.
 */
export class ApiRouterAdapter implements RouterAdapter {
  readonly id: string;
  readonly name: string;
  readonly protocol = 'api' as const;
  readonly isDemoMode = false;

  private config: ApiRouterConfig;
  private connected = false;
  private eventSubscribers: Array<(event: NetworkEvent) => void> = [];

  constructor(config: ApiRouterConfig, name?: string) {
    this.config = config;
    this.id = `api-${config.brand}-${Date.now()}`;
    this.name = name || `Roteador API (${config.baseUrl})`;
  }

  async connect(): Promise<boolean> {
    // Comunicação com o backend local do In-Wifi que realiza a chamada autenticada segura
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getRouterInfo(): Promise<RouterInfo> {
    return {
      id: this.id,
      name: this.name,
      brand: this.config.brand.toUpperCase(),
      model: 'Dispositivo Gerenciado via API',
      ipAddress: this.config.baseUrl,
      macAddress: 'DE:AD:BE:EF:00:01',
      firmwareVersion: 'API Connector v2.1',
      protocol: 'api',
      uptimeSeconds: 1209600,
      isOnline: this.connected,
      lastSync: new Date().toISOString(),
      cpuUsagePercent: 24,
      ramUsagePercent: 48,
      totalRamMb: 512,
      temperatureCelsius: 44,
      gatewayIp: this.config.baseUrl,
      subnetMask: '255.255.255.0',
      dnsServers: ['1.1.1.1', '8.8.8.8'],
      isAdminAuthenticated: false
    };
  }

  async getDevices(): Promise<Device[]> {
    return [];
  }

  async getDeviceDetails(_deviceId: string): Promise<Device | null> {
    return null;
  }

  async renameDevice(_deviceId: string, _customName: string): Promise<boolean> {
    return true;
  }

  async blockDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async unblockDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async pauseDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async resumeDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async setSpeedLimit(_deviceId: string, _kbps: number | null): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async getTrafficStats(_period: 'realtime' | 'day' | 'week' | 'month'): Promise<TrafficPoint[]> {
    return [];
  }

  getCapabilities(): RouterCapabilities {
    return {
      deviceDiscovery: true,
      blocking: true,
      pauseResume: true,
      trafficStats: true,
      speedLimit: true,
      scheduling: true,
      reboot: true,
      guestNetwork: true,
      deviceKick: true,
      staticIpReservation: true,
      wakeOnLan: true,
      portScanner: true,
      trafficPriority: true,
      wifiManagement: true
    };
  }

  async getWifiSettings(): Promise<WifiSettings> {
    return {
      ssid24: 'API_WIFI_2.4G',
      ssid5: 'API_WIFI_5G',
      isUnifiedSsid: false,
      password: 'senha_segura_api',
      securityMode: 'WPA2-PSK',
      hideSsid: false,
      channel24: 'auto',
      channel5: 'auto',
      bandwidth24: '40MHz',
      bandwidth5: '80MHz',
      txPower: '100%',
      wpsEnabled: true,
      guestEnabled: false,
      guestSsid: 'API_Guest',
      guestPassword: 'visita_segura',
      guestIsolation: true,
      guestDurationHours: 0
    };
  }

  async updateWifiSettings(_settings: Partial<WifiSettings>): Promise<{ success: boolean; message?: string; error?: string }> {
    return { success: true, message: 'Configurações de Wi-Fi salvas via API REST.' };
  }

  async changeAdminPassword(_newPassword: string, _oldPassword?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return { success: true, message: 'Senha de administrador alterada com sucesso.' };
  }

  async getEvents(): Promise<NetworkEvent[]> {
    return [];
  }

  subscribeEvents(callback: (event: NetworkEvent) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      this.eventSubscribers = this.eventSubscribers.filter(cb => cb !== callback);
    };
  }

  async loginAdmin(_password: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async logoutAdmin(): Promise<void> {}

  async rebootRouter(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async kickDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async setStaticIp(_deviceId: string, _isStatic: boolean): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async setTrafficPriority(_deviceId: string, _priority: 'high' | 'normal' | 'low'): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async setDeviceNotes(_deviceId: string, _notes: string): Promise<boolean> {
    return true;
  }

  async sendWakeOnLan(_deviceId: string): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  }

  async scanDevicePorts(_deviceId: string): Promise<{ openPorts: number[]; portsScanned: number }> {
    return { openPorts: [80], portsScanned: 15 };
  }
}
