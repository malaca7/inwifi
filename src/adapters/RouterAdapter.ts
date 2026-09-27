import { Device, DeviceBand, RouterCapabilities, RouterInfo, NetworkEvent, TrafficPoint, WifiSettings } from '../types';

export interface RouterAdapter {
  readonly id: string;
  readonly name: string;
  readonly protocol: 'api' | 'snmp' | 'ssh';
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

  /** Autenticar com credenciais de Administrador no roteador */
  loginAdmin(password: string, username?: string): Promise<{ success: boolean; error?: string }>;

  /** Encerrar sessão de Administrador */
  logoutAdmin(): Promise<void>;

  /** Reiniciar o hardware do roteador */
  rebootRouter(): Promise<{ success: boolean; error?: string }>;

  /** Expulsar/desconectar dispositivo da rede Wi-Fi */
  kickDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;

  /** Fixar ou liberar endereço IP estático para o dispositivo */
  setStaticIp(deviceId: string, isStatic: boolean): Promise<{ success: boolean; error?: string }>;

  /** Definir prioridade de tráfego QoS para o dispositivo */
  setTrafficPriority(deviceId: string, priority: 'high' | 'normal' | 'low'): Promise<{ success: boolean; error?: string }>;

  /** Salvar anotações do administrador e proprietário do dispositivo */
  setDeviceNotes(deviceId: string, notes: string, ownerName?: string): Promise<boolean>;

  /** Definir tipo de conexão da banda (Wi-Fi 2.4GHz, 5GHz ou Cabo LAN) */
  setDeviceBand?(deviceId: string, band: DeviceBand): Promise<boolean>;

  /** Enviar pacote mágico Wake-on-LAN para ligar o computador */
  sendWakeOnLan(deviceId: string): Promise<{ success: boolean; message?: string; error?: string }>;

  /** Escanear portas de rede abertas no dispositivo */
  scanDevicePorts(deviceId: string): Promise<{ openPorts: number[]; portsScanned: number }>;

  /** Obter configurações atuais de Wi-Fi e Rádio */
  getWifiSettings(): Promise<WifiSettings>;

  /** Atualizar nome do Wi-Fi (SSID), senha e parâmetros de rádio */
  updateWifiSettings(settings: Partial<WifiSettings>): Promise<{ success: boolean; message?: string; error?: string }>;

  /** Alternar Modo Smart Connect (Rede Única Inteligente) / WLAN Band Steering */
  toggleBandSteering?(enabled: boolean): Promise<{ success: boolean; message?: string; error?: string }>;

  /** Alterar senha de administrador do roteador */
  changeAdminPassword(newPassword: string, oldPassword?: string): Promise<{ success: boolean; message?: string; error?: string }>;

  /** Atualizar informações e parâmetros do Gateway / Roteador (IP, DNS, Subnet Mask, etc.) */
  updateRouterInfo?(info: Partial<RouterInfo>): Promise<{ success: boolean; message?: string; error?: string }>;
}
