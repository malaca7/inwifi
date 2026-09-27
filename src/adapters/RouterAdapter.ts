import { Device, RouterCapabilities, RouterInfo, NetworkEvent, TrafficPoint } from '../types';

export interface RouterAdapter {
  readonly id: string;
  readonly name: string;
  readonly protocol: 'mock' | 'api' | 'snmp' | 'ssh';
  readonly isDemoMode: boolean;

  /** Conectar ao roteador e verificar credenciais/comunicação */
  connect(): Promise<boolean>;

  /** Encerrar conexão */
  disconnect(): Promise<void>;

  /** Obter informações de hardware, firmware e status do roteador */
  getRouterInfo(): Promise<RouterInfo>;

  /** Listar todos os dispositivos detectados na rede */
  getDevices(): Promise<Device[]>;

  /** Obter detalhes e telemetria de um dispositivo específico */
  getDeviceDetails(deviceId: string): Promise<Device | null>;

  /** Salvar apelido amigável para o dispositivo */
  renameDevice(deviceId: string, customName: string): Promise<boolean>;

  /** Bloquear acesso do dispositivo à rede */
  blockDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;

  /** Desbloquear acesso do dispositivo */
  unblockDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;

  /** Pausar temporariamente a conexão do dispositivo */
  pauseDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;

  /** Retomar conexão pausada */
  resumeDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;

  /** Configurar limite de banda (download/upload) se suportado */
  setSpeedLimit(deviceId: string, kbps: number | null): Promise<{ success: boolean; error?: string }>;

  /** Obter histórico de tráfego agregado da rede */
  getTrafficStats(period: 'realtime' | 'day' | 'week' | 'month'): Promise<TrafficPoint[]>;

  /** Obter capacidades suportadas por este roteador/adaptador */
  getCapabilities(): RouterCapabilities;

  /** Obter lista de eventos recentes */
  getEvents(): Promise<NetworkEvent[]>;

  /** Escutar eventos gerados pelo adaptador em tempo real */
  subscribeEvents(callback: (event: NetworkEvent) => void): () => void;
}
