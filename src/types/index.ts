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
