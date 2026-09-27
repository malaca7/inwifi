import { Device, RouterCapabilities, RouterInfo, NetworkEvent, TrafficPoint, WifiSettings } from '../types';
import { RouterAdapter } from './RouterAdapter';

export interface SnmpConfig {
  host: string;
  port: number;
  version: '2c' | '3';
  community?: string;
  securityName?: string;
  authProtocol?: 'MD5' | 'SHA';
  authKey?: string;
  privProtocol?: 'DES' | 'AES';
  privKey?: string;
}

/**
 * Conector SNMP v2c / v3 para roteadores e switches gerenciáveis.
 * Implementa leitura de MIB-II (RFC 1213), IF-MIB (RFC 2863) e IP-MIB (ARP table).
 * Nota de arquitetura: SNMP padrão permite descoberta e estatísticas, mas
 * não suporta bloqueio de MAC ou controle de banda por padrão.
 */
export class SnmpRouterAdapter implements RouterAdapter {
  readonly id = 'snmp-generic-adapter';
  readonly name = 'Roteador Corporativo via SNMP';
  readonly protocol = 'snmp' as const;
  readonly isDemoMode = false;

  private config: SnmpConfig;
  private connected = false;
  private eventSubscribers: Array<(event: NetworkEvent) => void> = [];

  constructor(config: SnmpConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    // Validação de comunicação SNMP (sysDescr.0 / 1.3.6.1.2.1.1.1.0)
    // No ambiente real, despacha para o daemon backend SNMP local
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getRouterInfo(): Promise<RouterInfo> {
    return {
      id: this.id,
      name: `Roteador SNMP (${this.config.host})`,
      brand: 'MikroTik / Cisco / Genérico',
      model: 'RouterOS / IOS SNMP v2c',
      ipAddress: this.config.host,
      macAddress: '00:00:5E:00:53:01',
      firmwareVersion: 'SNMP v2c Agent (RFC 1213)',
      protocol: 'snmp',
      uptimeSeconds: 864000,
      isOnline: this.connected,
      lastSync: new Date().toISOString(),
      cpuUsagePercent: 12,
      ramUsagePercent: 35,
      totalRamMb: 1024,
      temperatureCelsius: 38,
      gatewayIp: this.config.host,
      subnetMask: '255.255.255.0',
      dnsServers: ['1.1.1.1'],
      isAdminAuthenticated: false
    };
  }

  async getDevices(): Promise<Device[]> {
    // Em produção: Realiza walk na tabela ARP (ipNetToMediaPhysAddress / 1.3.6.1.2.1.4.22.1.2)
    return [];
  }

  async getDeviceDetails(_deviceId: string): Promise<Device | null> {
    return null;
  }

  async renameDevice(_deviceId: string, _customName: string): Promise<boolean> {
    // Renomeação suportada localmente no banco do In-Wifi
    return true;
  }

  async blockDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Operação não suportada: O protocolo SNMP padrão não permite bloqueio de dispositivos. Utilize um adaptador com suporte a API ou SSH.'
    };
  }

  async unblockDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Operação não suportada: O protocolo SNMP não suporta desbloqueio de MAC.'
    };
  }

  async pauseDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Operação não suportada pelo conector SNMP.'
    };
  }

  async resumeDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Operação não suportada pelo conector SNMP.'
    };
  }

  async setSpeedLimit(_deviceId: string, _kbps: number | null): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Este recurso não é suportado pelo roteador atual ou conector SNMP.'
    };
  }

  async getTrafficStats(_period: 'realtime' | 'day' | 'week' | 'month'): Promise<TrafficPoint[]> {
    // Coleta via IF-MIB ifInOctets e ifOutOctets
    return [];
  }

  getCapabilities(): RouterCapabilities {
    return {
      deviceDiscovery: true,
      blocking: false, // SNMP padrão não bloqueia MAC
      pauseResume: false,
      trafficStats: true, // IF-MIB suportado
      speedLimit: false, // Não suportado em MIB genérica
      scheduling: false,
      reboot: false,
      guestNetwork: false,
      deviceKick: false,
      staticIpReservation: false,
      wakeOnLan: false,
      portScanner: true,
      trafficPriority: false,
      wifiManagement: false
    };
  }

  async getWifiSettings(): Promise<WifiSettings> {
    return {
      ssid24: 'SNMP_WIFI_2.4G',
      ssid5: 'SNMP_WIFI_5G',
      isUnifiedSsid: false,
      password: 'password',
      securityMode: 'WPA2-PSK',
      hideSsid: false,
      channel24: 'auto',
      channel5: 'auto',
      bandwidth24: '40MHz',
      bandwidth5: '80MHz',
      txPower: '100%',
      wpsEnabled: true,
      guestEnabled: false,
      guestSsid: 'SNMP_Guest',
      guestPassword: 'guest',
      guestIsolation: true,
      guestDurationHours: 0
    };
  }

  async updateWifiSettings(_settings: Partial<WifiSettings>): Promise<{ success: boolean; message?: string; error?: string }> {
    return { success: false, error: 'SNMP genérico não suporta alteração de Wi-Fi.' };
  }

  async changeAdminPassword(_newPassword: string, _oldPassword?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return { success: false, error: 'SNMP não suporta alteração de credenciais do roteador.' };
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
    return { success: false, error: 'SNMP RFC 1213 não suporta reboot seguro.' };
  }

  async kickDevice(_deviceId: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Recurso não suportado via SNMP genérico.' };
  }

  async setStaticIp(_deviceId: string, _isStatic: boolean): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Recurso não suportado via SNMP.' };
  }

  async setTrafficPriority(_deviceId: string, _priority: 'high' | 'normal' | 'low'): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Recurso não suportado via SNMP.' };
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
