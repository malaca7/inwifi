import { Device, RouterCapabilities, RouterInfo, NetworkEvent, TrafficPoint } from '../types';
import { RouterAdapter } from './RouterAdapter';

const STORAGE_KEY_ALIASES = 'inwifi_device_aliases';
const STORAGE_KEY_STATES = 'inwifi_device_states';
const STORAGE_KEY_LIMITS = 'inwifi_speed_limits';

export class MockRouterAdapter implements RouterAdapter {
  readonly id = 'mock-tplink-ax55';
  readonly name = 'Roteador Principal (Demo TP-Link)';
  readonly protocol = 'mock' as const;
  readonly isDemoMode = true;

  private connected = true;
  private eventSubscribers: Array<(event: NetworkEvent) => void> = [];
  private devices: Device[] = [];
  private events: NetworkEvent[] = [];

  constructor() {
    this.initMockData();
  }

  private loadAliases(): Record<string, string> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ALIASES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveAliases(aliases: Record<string, string>) {
    try {
      localStorage.setItem(STORAGE_KEY_ALIASES, JSON.stringify(aliases));
    } catch {
      // fallback
    }
  }

  private loadStates(): Record<string, Device['status']> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveStates(states: Record<string, Device['status']>) {
    try {
      localStorage.setItem(STORAGE_KEY_STATES, JSON.stringify(states));
    } catch {
      // fallback
    }
  }

  private loadSpeedLimits(): Record<string, number | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LIMITS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveSpeedLimits(limits: Record<string, number | null>) {
    try {
      localStorage.setItem(STORAGE_KEY_LIMITS, JSON.stringify(limits));
    } catch {
      // fallback
    }
  }

  private initMockData() {
    const savedAliases = this.loadAliases();
    const savedStates = this.loadStates();
    const savedLimits = this.loadSpeedLimits();

    const now = new Date();
    const isoNow = now.toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

    const baseDevices: Array<Omit<Device, 'customName' | 'status' | 'speedLimitKbps'> & { defaultStatus: Device['status']; defaultCustomName?: string }> = [
      {
        id: 'dev_e4_5f_01_a9_84_cd',
        mac: 'E4:5F:01:A9:84:CD',
        ip: '192.168.1.101',
        originalHostname: 'MacBook-Pro-de-Carlos',
        defaultCustomName: 'MacBook Pro Trabalho',
        manufacturer: 'Apple Inc.',
        category: 'computer',
        defaultStatus: 'online',
        band: '5GHz',
        signalStrength: -48,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 3450,
        currentUploadSpeedKbps: 820,
        totalDownloadBytes: 4284920000,
        totalUploadBytes: 894000000,
        ipHistory: [
          { ip: '192.168.1.101', timestamp: threeDaysAgo },
          { ip: '192.168.1.145', timestamp: oneDayAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_f2_1c_48_d3_11_aa',
        mac: 'F2:1C:48:D3:11:AA',
        ip: '192.168.1.102',
        originalHostname: 'iPhone-15-Pro-Carlos',
        defaultCustomName: 'iPhone 15 Pro Pessoal',
        manufacturer: 'Apple Inc.',
        category: 'smartphone',
        defaultStatus: 'online',
        band: '5GHz',
        signalStrength: -52,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 1200,
        currentUploadSpeedKbps: 240,
        totalDownloadBytes: 2150000000,
        totalUploadBytes: 420000000,
        ipHistory: [
          { ip: '192.168.1.102', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_84_25_3f_66_8b_90',
        mac: '84:25:3F:66:8B:90',
        ip: '192.168.1.103',
        originalHostname: 'Galaxy-S24-Ultra',
        defaultCustomName: 'Samsung Galaxy Mariana',
        manufacturer: 'Samsung Electronics',
        category: 'smartphone',
        defaultStatus: 'online',
        band: '5GHz',
        signalStrength: -58,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 850,
        currentUploadSpeedKbps: 110,
        totalDownloadBytes: 980000000,
        totalUploadBytes: 150000000,
        ipHistory: [
          { ip: '192.168.1.103', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_00_e0_4c_88_12_99',
        mac: '00:E0:4C:88:12:99',
        ip: '192.168.1.104',
        originalHostname: 'LG-webOSTV-C3-65',
        defaultCustomName: 'Smart TV LG Sala',
        manufacturer: 'LG Electronics',
        category: 'tv',
        defaultStatus: 'online',
        band: 'ethernet',
        signalStrength: -30,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 18500,
        currentUploadSpeedKbps: 450,
        totalDownloadBytes: 18450000000,
        totalUploadBytes: 850000000,
        ipHistory: [
          { ip: '192.168.1.104', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_70_9e_29_bb_cc_01',
        mac: '70:9E:29:BB:CC:01',
        ip: '192.168.1.105',
        originalHostname: 'PS5-Console-Games',
        defaultCustomName: 'PlayStation 5 Sala',
        manufacturer: 'Sony Interactive Entertainment',
        category: 'gaming',
        defaultStatus: 'online',
        band: 'ethernet',
        signalStrength: -30,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 42000,
        currentUploadSpeedKbps: 3400,
        totalDownloadBytes: 42800000000,
        totalUploadBytes: 4100000000,
        ipHistory: [
          { ip: '192.168.1.105', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_44_65_0d_22_33_44',
        mac: '44:65:0D:22:33:44',
        ip: '192.168.1.106',
        originalHostname: 'Echo-Dot-5-Cozinha',
        defaultCustomName: 'Alexa Echo Dot Cozinha',
        manufacturer: 'Amazon Technologies',
        category: 'iot',
        defaultStatus: 'online',
        band: '2.4GHz',
        signalStrength: -62,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 320,
        currentUploadSpeedKbps: 40,
        totalDownloadBytes: 450000000,
        totalUploadBytes: 60000000,
        ipHistory: [
          { ip: '192.168.1.106', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_ec_b5_fa_99_10_22',
        mac: 'EC:B5:FA:99:10:22',
        ip: '192.168.1.107',
        originalHostname: 'Hue-Bridge-V2',
        defaultCustomName: 'Central Iluminação Hue',
        manufacturer: 'Signify Netherlands B.V.',
        category: 'iot',
        defaultStatus: 'online',
        band: 'ethernet',
        signalStrength: -30,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 12,
        currentUploadSpeedKbps: 8,
        totalDownloadBytes: 45000000,
        totalUploadBytes: 25000000,
        ipHistory: [
          { ip: '192.168.1.107', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_b0_95_75_e4_33_12',
        mac: 'B0:95:75:E4:33:12',
        ip: '192.168.1.108',
        originalHostname: 'Tapo-C310-Garagem',
        defaultCustomName: 'Câmera Segurança Garagem',
        manufacturer: 'TP-Link Corporation',
        category: 'iot',
        defaultStatus: 'online',
        band: '2.4GHz',
        signalStrength: -67,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 80,
        currentUploadSpeedKbps: 2150,
        totalDownloadBytes: 85000000,
        totalUploadBytes: 6850000000,
        ipHistory: [
          { ip: '192.168.1.108', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_50_bc_96_aa_20_41',
        mac: '50:BC:96:AA:20:41',
        ip: '192.168.1.109',
        originalHostname: 'iPad-Air-Mariana',
        defaultCustomName: 'iPad Air Estudos',
        manufacturer: 'Apple Inc.',
        category: 'computer',
        defaultStatus: 'online',
        band: '5GHz',
        signalStrength: -54,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 1800,
        currentUploadSpeedKbps: 150,
        totalDownloadBytes: 3100000000,
        totalUploadBytes: 240000000,
        ipHistory: [
          { ip: '192.168.1.109', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_3c_52_a1_55_77_88',
        mac: '3C:52:A1:55:77:88',
        ip: '192.168.1.110',
        originalHostname: 'DESKTOP-8K39NQL',
        defaultCustomName: 'Notebook Dell Mariana',
        manufacturer: 'Dell Inc.',
        category: 'computer',
        defaultStatus: 'online',
        band: '5GHz',
        signalStrength: -60,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 2400,
        currentUploadSpeedKbps: 600,
        totalDownloadBytes: 5400000000,
        totalUploadBytes: 980000000,
        ipHistory: [
          { ip: '192.168.1.110', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_ac_d1_b8_40_55_19',
        mac: 'AC:D1:B8:40:55:19',
        ip: '192.168.1.112',
        originalHostname: 'Kindle-Paperwhite',
        defaultCustomName: 'Kindle Quarto',
        manufacturer: 'Amazon Technologies',
        category: 'iot',
        defaultStatus: 'offline',
        band: '2.4GHz',
        signalStrength: 0,
        firstSeen: threeDaysAgo,
        lastSeen: twoHoursAgo,
        currentDownloadSpeedKbps: 0,
        currentUploadSpeedKbps: 0,
        totalDownloadBytes: 120000000,
        totalUploadBytes: 15000000,
        ipHistory: [
          { ip: '192.168.1.112', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'disconnect', timestamp: twoHoursAgo }
        ]
      },
      {
        id: 'dev_68_db_f5_10_22_33',
        mac: '68:DB:F5:10:22:33',
        ip: '192.168.1.115',
        originalHostname: 'roborock-vacuum-s7',
        defaultCustomName: 'Robô Aspirador Sala',
        manufacturer: 'Xiaomi Communications',
        category: 'iot',
        defaultStatus: 'online',
        band: '2.4GHz',
        signalStrength: -65,
        firstSeen: threeDaysAgo,
        lastSeen: isoNow,
        currentDownloadSpeedKbps: 25,
        currentUploadSpeedKbps: 15,
        totalDownloadBytes: 310000000,
        totalUploadBytes: 90000000,
        ipHistory: [
          { ip: '192.168.1.115', timestamp: threeDaysAgo }
        ],
        connectionHistory: [
          { type: 'connect', timestamp: isoNow }
        ]
      },
      {
        id: 'dev_24_6f_28_9a_3b_12',
        mac: '24:6F:28:9A:3B:12',
        ip: '192.168.1.140',
        originalHostname: 'ESP_9A3B12',
        defaultCustomName: undefined,
        manufacturer: 'Espressif Inc.',
        category: 'unknown',
        defaultStatus: 'blocked',
        band: '2.4GHz',
        signalStrength: -78,
        firstSeen: oneDayAgo,
        lastSeen: oneDayAgo,
        currentDownloadSpeedKbps: 0,
        currentUploadSpeedKbps: 0,
        totalDownloadBytes: 1200000,
        totalUploadBytes: 400000,
        ipHistory: [
          { ip: '192.168.1.140', timestamp: oneDayAgo }
        ],
        connectionHistory: [
          { type: 'disconnect', timestamp: oneDayAgo }
        ]
      }
    ];

    this.devices = baseDevices.map(d => ({
      ...d,
      customName: savedAliases[d.id] ?? d.defaultCustomName ?? null,
      status: savedStates[d.id] ?? d.defaultStatus,
      speedLimitKbps: savedLimits[d.id] ?? null
    }));

    this.events = [
      {
        id: 'evt_01',
        type: 'device_connected',
        title: 'Novo dispositivo detectado',
        description: 'iPhone 15 Pro de Carlos conectou-se na banda 5GHz (192.168.1.102).',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        severity: 'info',
        deviceId: 'dev_f2_1c_48_d3_11_aa',
        read: false
      },
      {
        id: 'evt_02',
        type: 'high_traffic',
        title: 'Alto consumo de banda',
        description: 'PlayStation 5 consumindo mais de 40 Mbps via conexão cabeada.',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        severity: 'warning',
        deviceId: 'dev_70_9e_29_bb_cc_01',
        read: false
      },
      {
        id: 'evt_03',
        type: 'device_blocked',
        title: 'Dispositivo desconhecido bloqueado',
        description: 'Aparelho ESP32 (MAC: 24:6F:28:9A:3B:12) bloqueado por política de segurança.',
        timestamp: oneDayAgo,
        severity: 'error',
        deviceId: 'dev_24_6f_28_9a_3b_12',
        read: true
      },
      {
        id: 'evt_04',
        type: 'router_online',
        title: 'Roteador sincronizado',
        description: 'TP-Link Archer AX55 inicializado com sucesso e conectado ao gateway WAN.',
        timestamp: threeDaysAgo,
        severity: 'success',
        read: true
      }
    ];
  }

  async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getRouterInfo(): Promise<RouterInfo> {
    return {
      id: this.id,
      name: 'Roteador Principal (Archer AX55)',
      brand: 'TP-Link',
      model: 'Archer AX55 V1.0 (Wi-Fi 6 AX3000)',
      ipAddress: '192.168.1.1',
      macAddress: '60:32:B1:C0:EE:21',
      firmwareVersion: '1.2.4 Build 20240815 rel.61902',
      protocol: 'mock',
      uptimeSeconds: 345600, // 4 dias
      isOnline: this.connected,
      lastSync: new Date().toISOString(),
      cpuUsagePercent: 18,
      ramUsagePercent: 44,
      totalRamMb: 512,
      temperatureCelsius: 41,
      gatewayIp: '192.168.1.1',
      subnetMask: '255.255.255.0',
      dnsServers: ['1.1.1.1', '8.8.8.8']
    };
  }

  async getDevices(): Promise<Device[]> {
    // Add micro variations to simulate live data
    return this.devices.map(dev => {
      if (dev.status === 'online') {
        const jitter = (Math.random() - 0.5) * 0.15;
        const newDl = Math.max(10, Math.round(dev.currentDownloadSpeedKbps * (1 + jitter)));
        const newUl = Math.max(5, Math.round(dev.currentUploadSpeedKbps * (1 + jitter)));
        return {
          ...dev,
          currentDownloadSpeedKbps: newDl,
          currentUploadSpeedKbps: newUl
        };
      }
      return dev;
    });
  }

  async getDeviceDetails(deviceId: string): Promise<Device | null> {
    const dev = this.devices.find(d => d.id === deviceId);
    return dev ? { ...dev } : null;
  }

  async renameDevice(deviceId: string, customName: string): Promise<boolean> {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index === -1) return false;

    const trimmed = customName.trim();
    this.devices[index].customName = trimmed.length > 0 ? trimmed : null;

    const aliases = this.loadAliases();
    if (trimmed.length > 0) {
      aliases[deviceId] = trimmed;
    } else {
      delete aliases[deviceId];
    }
    this.saveAliases(aliases);

    // Emit event
    const event: NetworkEvent = {
      id: `evt_${Date.now()}`,
      type: 'device_renamed',
      title: 'Dispositivo renomeado',
      description: `Dispositivo ${this.devices[index].mac} renomeado para "${trimmed || this.devices[index].originalHostname}".`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      deviceId,
      read: false
    };
    this.emitEvent(event);

    return true;
  }

  async blockDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, error: 'Dispositivo não encontrado.' };

    dev.status = 'blocked';
    dev.currentDownloadSpeedKbps = 0;
    dev.currentUploadSpeedKbps = 0;

    const states = this.loadStates();
    states[deviceId] = 'blocked';
    this.saveStates(states);

    const event: NetworkEvent = {
      id: `evt_${Date.now()}`,
      type: 'device_blocked',
      title: 'Dispositivo bloqueado',
      description: `${dev.customName || dev.originalHostname} (${dev.ip}) teve seu acesso bloqueado.`,
      timestamp: new Date().toISOString(),
      severity: 'warning',
      deviceId,
      read: false
    };
    this.emitEvent(event);

    return { success: true };
  }

  async unblockDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, error: 'Dispositivo não encontrado.' };

    dev.status = 'online';
    const states = this.loadStates();
    states[deviceId] = 'online';
    this.saveStates(states);

    const event: NetworkEvent = {
      id: `evt_${Date.now()}`,
      type: 'device_unblocked',
      title: 'Dispositivo desbloqueado',
      description: `${dev.customName || dev.originalHostname} teve seu acesso restaurado com sucesso.`,
      timestamp: new Date().toISOString(),
      severity: 'success',
      deviceId,
      read: false
    };
    this.emitEvent(event);

    return { success: true };
  }

  async pauseDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, error: 'Dispositivo não encontrado.' };

    dev.status = 'paused';
    dev.currentDownloadSpeedKbps = 0;
    dev.currentUploadSpeedKbps = 0;

    const states = this.loadStates();
    states[deviceId] = 'paused';
    this.saveStates(states);

    const event: NetworkEvent = {
      id: `evt_${Date.now()}`,
      type: 'device_paused',
      title: 'Conexão pausada',
      description: `Acesso pausado temporariamente para ${dev.customName || dev.originalHostname}.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      deviceId,
      read: false
    };
    this.emitEvent(event);

    return { success: true };
  }

  async resumeDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, error: 'Dispositivo não encontrado.' };

    dev.status = 'online';
    const states = this.loadStates();
    states[deviceId] = 'online';
    this.saveStates(states);

    const event: NetworkEvent = {
      id: `evt_${Date.now()}`,
      type: 'device_resumed',
      title: 'Conexão retomada',
      description: `Acesso liberado novamente para ${dev.customName || dev.originalHostname}.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      deviceId,
      read: false
    };
    this.emitEvent(event);

    return { success: true };
  }

  async setSpeedLimit(deviceId: string, kbps: number | null): Promise<{ success: boolean; error?: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, error: 'Dispositivo não encontrado.' };

    dev.speedLimitKbps = kbps;
    const limits = this.loadSpeedLimits();
    if (kbps) {
      limits[deviceId] = kbps;
    } else {
      delete limits[deviceId];
    }
    this.saveSpeedLimits(limits);

    return { success: true };
  }

  async getTrafficStats(period: 'realtime' | 'day' | 'week' | 'month'): Promise<TrafficPoint[]> {
    const points: TrafficPoint[] = [];
    const count = period === 'realtime' ? 12 : period === 'day' ? 24 : period === 'week' ? 7 : 30;
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      let label = '';
      let date = new Date();

      if (period === 'realtime') {
        date = new Date(now.getTime() - i * 5 * 1000);
        label = `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}s`;
      } else if (period === 'day') {
        date = new Date(now.getTime() - i * 3600 * 1000);
        label = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else if (period === 'week') {
        date = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        label = days[date.getDay()];
      } else {
        date = new Date(now.getTime() - i * 24 * 3600 * 1000);
        label = `${date.getDate()}/${date.getMonth() + 1}`;
      }

      // Generate harmonic realistic curve
      const baseHour = date.getHours();
      const peakFactor = (baseHour >= 18 && baseHour <= 23) ? 1.8 : (baseHour >= 1 && baseHour <= 6) ? 0.3 : 1.0;
      const dl = Number((Math.max(12, (25 + Math.sin(i * 0.7) * 15 + Math.random() * 8) * peakFactor)).toFixed(1));
      const ul = Number((Math.max(3, (6 + Math.cos(i * 0.7) * 4 + Math.random() * 2) * peakFactor)).toFixed(1));

      points.push({
        timestamp: label,
        timeIso: date.toISOString(),
        downloadSpeedMbps: dl,
        uploadSpeedMbps: ul,
        activeDevicesCount: Math.round(9 + Math.random() * 3)
      });
    }

    return points;
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
      guestNetwork: true
    };
  }

  async getEvents(): Promise<NetworkEvent[]> {
    return [...this.events];
  }

  subscribeEvents(callback: (event: NetworkEvent) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      this.eventSubscribers = this.eventSubscribers.filter(cb => cb !== callback);
    };
  }

  private emitEvent(event: NetworkEvent) {
    this.events.unshift(event);
    if (this.events.length > 50) {
      this.events.pop();
    }
    this.eventSubscribers.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Erro no callback de evento:', err);
      }
    });
  }

  /** Método auxiliar para simular novo dispositivo ingressando na rede */
  simulateNewDevice(): Device {
    const rand = Math.floor(100 + Math.random() * 899);
    const newMac = `A4:C3:F0:${rand.toString(16).padStart(2, '0').toUpperCase()}:19:8A`;
    const newIp = `192.168.1.${Math.floor(150 + Math.random() * 50)}`;
    const nowIso = new Date().toISOString();

    const newDev: Device = {
      id: `dev_${newMac.toLowerCase().replace(/:/g, '_')}`,
      mac: newMac,
      ip: newIp,
      originalHostname: `Smart-Device-${rand}`,
      customName: null,
      manufacturer: 'Intelbras / Realtek',
      category: 'iot',
      status: 'online',
      band: '2.4GHz',
      signalStrength: -55,
      firstSeen: nowIso,
      lastSeen: nowIso,
      currentDownloadSpeedKbps: 450,
      currentUploadSpeedKbps: 60,
      totalDownloadBytes: 5000000,
      totalUploadBytes: 1200000,
      speedLimitKbps: null,
      ipHistory: [{ ip: newIp, timestamp: nowIso }],
      connectionHistory: [{ type: 'connect', timestamp: nowIso }]
    };

    this.devices.unshift(newDev);

    this.emitEvent({
      id: `evt_${Date.now()}`,
      type: 'device_connected',
      title: 'Novo dispositivo detectado',
      description: `Novo aparelho "${newDev.originalHostname}" (${newDev.ip}) conectou-se à rede Wi-Fi.`,
      timestamp: nowIso,
      severity: 'info',
      deviceId: newDev.id,
      read: false
    });

    return newDev;
  }
}
