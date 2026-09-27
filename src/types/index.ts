export type DeviceCategory = 
  | 'smartphone' 
  | 'computer' 
  | 'tv' 
  | 'iot' 
  | 'gaming' 
  | 'network' 
  | 'unknown';

export type DeviceStatus = 'online' | 'offline' | 'blocked' | 'paused';

export type DeviceBand = '2.4GHz' | '5GHz' | '6GHz' | 'ethernet';

export interface Device {
  id: string; // Persistent unique ID (usually normalized MAC or UUID)
  mac: string;
  ip: string;
  originalHostname: string;
  customName: string | null;
  manufacturer: string;
  category: DeviceCategory;
  status: DeviceStatus;
  band: DeviceBand;
  signalStrength: number; // dBm (-30 excelente a -90 fraco) ou porcentagem
  firstSeen: string; // ISO string
  lastSeen: string; // ISO string
  currentDownloadSpeedKbps: number;
  currentUploadSpeedKbps: number;
  totalDownloadBytes: number;
  totalUploadBytes: number;
  speedLimitKbps: number | null;
  priority?: 'high' | 'normal' | 'low'; // Prioridade QoS
  isStaticIp?: boolean; // Reserva de IP DHCP Estático
  ownerName?: string; // Nome do dono (ex: João, Pedro)
  notes?: string; // Anotações do administrador
  lastPingMs?: number | null; // Última latência medida em ms
  kickCount?: number; // Vezes que foi desconectado
  ipHistory: { ip: string; timestamp: string }[];
  connectionHistory: { type: 'connect' | 'disconnect'; timestamp: string }[];
}

export interface RouterCapabilities {
  deviceDiscovery: boolean;
  blocking: boolean;
  pauseResume: boolean;
  trafficStats: boolean;
  speedLimit: boolean;
  scheduling: boolean;
  reboot: boolean;
  guestNetwork: boolean;
  deviceKick: boolean; // Expulsar do Wi-Fi
  staticIpReservation: boolean; // Fixação de IP
  wakeOnLan: boolean; // Magic Packet WoL
  portScanner: boolean; // Scanner de portas abertas
  trafficPriority: boolean; // QoS prioritário
  wifiManagement: boolean; // Alterar SSID, senha e opções Wi-Fi
}

export interface WifiSettings {
  ssid24: string;
  ssid5: string;
  isUnifiedSsid: boolean;
  password: string;
  securityMode: 'WPA2-PSK' | 'WPA3-SAE' | 'WPA2/WPA3-Mixed';
  hideSsid: boolean;
  channel24: string;
  channel5: string;
  bandwidth24: '20MHz' | '40MHz' | 'auto';
  bandwidth5: '20MHz' | '40MHz' | '80MHz' | 'auto';
  txPower: '100%' | '75%' | '50%' | '25%';
  wpsEnabled: boolean;
  
  // Rede de Convidados
  guestEnabled: boolean;
  guestSsid: string;
  guestPassword: string;
  guestIsolation: boolean;
  guestDurationHours?: number;
}

export type RouterProtocol = 'api' | 'snmp' | 'ssh';

export interface RouterInfo {
  id: string;
  name: string;
  brand: string;
  model: string;
  ipAddress: string;
  macAddress: string;
  firmwareVersion: string;
  protocol: RouterProtocol;
  uptimeSeconds: number;
  isOnline: boolean;
  lastSync: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  totalRamMb: number;
  temperatureCelsius: number;
  gatewayIp: string;
  subnetMask: string;
  dnsServers: string[];
  isAdminAuthenticated: boolean;
  adminUser?: string;
  sessionToken?: string;
  connectedAt?: string;
}

export type EventSeverity = 'info' | 'success' | 'warning' | 'error';

export type EventType = 
  | 'device_connected' 
  | 'device_disconnected' 
  | 'device_blocked' 
  | 'device_unblocked' 
  | 'device_paused'
  | 'device_resumed'
  | 'router_offline' 
  | 'router_online' 
  | 'ip_changed' 
  | 'high_traffic' 
  | 'schedule_applied'
  | 'device_renamed';

export interface NetworkEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  severity: EventSeverity;
  deviceId?: string;
  read: boolean;
}

export interface AccessSchedule {
  id: string;
  deviceId: string;
  deviceName: string;
  name: string;
  days: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string; // '22:00'
  endTime: string; // '07:00'
  action: 'block' | 'pause';
  isActive: boolean;
  createdDate: string;
}

export interface TrafficPoint {
  timestamp: string; // label e.g. "14:00"
  timeIso: string;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  activeDevicesCount: number;
}

export interface NetworkTopologyItem {
  id: string;
  label: string;
  sublabel?: string;
  type: 'internet' | 'router' | 'switch' | 'ap' | 'device';
  category?: DeviceCategory;
  ip?: string;
  mac?: string;
  status: 'online' | 'offline' | 'warning';
  connectedToId?: string;
  signalStrength?: number;
  band?: DeviceBand;
}

export interface NotificationSettings {
  newDeviceAlert: boolean;
  deviceLeftAlert: boolean;
  highTrafficAlert: boolean;
  securityAlert: boolean;
  routerStatusAlert: boolean;
  soundEnabled: boolean;
}
