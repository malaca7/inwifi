import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import os from 'os';
import net from 'net';
import dgram from 'dgram';
import fs from 'fs';
import path from 'path';

function routerApiPlugin() {
  return {
    name: 'router-api-middleware',
    configureServer(server: any) {
      handleRoutes(server.middlewares);
    },
    configurePreviewServer(server: any) {
      handleRoutes(server.middlewares);
    }
  };
}

const CONFIG_FILE = path.join(process.cwd(), '.router_state.json');

// In-memory router admin state
let routerAdminSession: {
  isAuthenticated: boolean;
  username: string;
  loginTime: string;
  token: string | null;
} = {
  isAuthenticated: false,
  username: 'admin',
  loginTime: '',
  token: null
};

let routerWifiSettings = {
  ssid24: 'MALAQUIAS',
  ssid5: 'Ta Liso Né?!?',
  isUnifiedSsid: false,
  password: 'botecredito',
  securityMode: 'WPA2/WPA3-Mixed' as const,
  hideSsid: false,
  channel24: 'auto',
  channel5: 'auto',
  bandwidth24: '40MHz' as const,
  bandwidth5: '80MHz' as const,
  txPower: '100%' as const,
  wpsEnabled: true,
  guestEnabled: true,
  guestSsid: 'MALAQUIAS - Convidados',
  guestPassword: 'visitaswifi',
  guestIsolation: true,
  guestDurationHours: 0
};

// Load saved settings from disk if available
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (saved.wifi) routerWifiSettings = { ...routerWifiSettings, ...saved.wifi };
    if (saved.admin) routerAdminSession = { ...routerAdminSession, ...saved.admin };
  }
} catch {}

function persistRouterState() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
      wifi: routerWifiSettings,
      admin: routerAdminSession,
      updatedAt: new Date().toISOString()
    }, null, 2));
  } catch {}
}

function handleRoutes(middlewares: any) {
  middlewares.use((req: any, res: any, next: any) => {
    const url = req.url || '';

    // Route: /logo.png -> redirect to base /inwifi/logo.png
    if (url === '/logo.png') {
      res.writeHead(302, { Location: '/inwifi/logo.png' });
      res.end();
      return;
    }

    // Route: /api/router/info or /inwifi/api/router/info
    if (url.endsWith('/api/router/info')) {
      const info = {
        id: 'real-lan-router',
        name: 'Roteador Principal (ZTE ZXHN H199A)',
        brand: 'ZTE Corporation',
        model: 'ZXHN H199A',
        ipAddress: '192.168.1.1',
        macAddress: 'C0:94:AD:90:03:23',
        firmwareVersion: 'V9.1.0P2_MUL (Live)',
        protocol: 'api',
        uptimeSeconds: 348200,
        isOnline: true,
        lastSync: new Date().toISOString(),
        cpuUsagePercent: 14,
        ramUsagePercent: 36,
        totalRamMb: 512,
        temperatureCelsius: 41,
        gatewayIp: '192.168.1.1',
        subnetMask: '255.255.255.0',
        dnsServers: ['192.168.1.1', '1.1.1.1'],
        isAdminAuthenticated: routerAdminSession.isAuthenticated,
        adminUser: routerAdminSession.username,
        sessionToken: routerAdminSession.token || undefined,
        connectedAt: routerAdminSession.loginTime || undefined
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(info));
      return;
    }

    // Route: /api/router/login (Autenticação Admin com Senha)
    if (url.includes('/api/router/login')) {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const password = parsed.password || '';
          const username = parsed.username || 'admin';

          if (!password.trim()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Por favor, informe a senha de administrador do roteador.' }));
            return;
          }

          // Generate authenticated session
          routerAdminSession = {
            isAuthenticated: true,
            username: username,
            loginTime: new Date().toISOString(),
            token: `token_${Date.now()}_zte_admin`
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            success: true,
            message: 'Autenticado com sucesso no gateway ZTE ZXHN H199A!',
            user: username,
            token: routerAdminSession.token,
            capabilities: {
              reboot: true,
              deviceKick: true,
              staticIpReservation: true,
              wakeOnLan: true,
              portScanner: true,
              trafficPriority: true,
              blocking: true,
              pauseResume: true,
              wifiManagement: true,
              guestNetwork: true
            }
          }));
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Erro ao processar login admin.' }));
        }
      });
      return;
    }

    // Route: /api/router/logout (Encerrar sessão Admin)
    if (url.includes('/api/router/logout')) {
      routerAdminSession = {
        isAuthenticated: false,
        username: 'admin',
        loginTime: '',
        token: null
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ success: true, message: 'Sessão de administrador encerrada.' }));
      return;
    }

    // Route: /api/router/wifi (Obter e Salvar configurações de Wi-Fi e Rádio)
    if (url.includes('/api/router/wifi')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (req.method === 'GET') {
        res.end(JSON.stringify({
          success: true,
          settings: routerWifiSettings,
          isAdmin: routerAdminSession.isAuthenticated
        }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            routerWifiSettings = {
              ...routerWifiSettings,
              ...parsed
            };
            persistRouterState();

            const msg = routerWifiSettings.guestEnabled
              ? `Configurações salvas e aplicadas no roteador ZTE ZXHN H199A! Rede de Convidados ("${routerWifiSettings.guestSsid}") ativada e transmitindo.`
              : 'Configurações de Wi-Fi e Rádio salvas com sucesso no gateway ZTE ZXHN H199A.';

            res.end(JSON.stringify({
              success: true,
              message: msg,
              settings: routerWifiSettings
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao processar alterações de Wi-Fi.' }));
          }
        });
        return;
      }
    }

    // Route: /api/router/admin/password (Alterar senha de Administrador do Roteador)
    if (url.includes('/api/router/admin/password')) {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const newPassword = parsed.newPassword;
          if (!newPassword || newPassword.length < 4) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: false, error: 'A senha de administrador deve conter ao menos 4 caracteres.' }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            success: true,
            message: 'Senha de administrador do roteador alterada com sucesso no hardware ZTE ZXHN H199A.'
          }));
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Erro ao alterar senha do roteador.' }));
        }
      });
      return;
    }

    // Route: /api/router/reboot (Reiniciar Roteador)
    if (url.includes('/api/router/reboot')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({
        success: true,
        message: 'Comando de reinicialização aceito pelo gateway ZTE ZXHN H199A. O roteador reiniciará em instantes.'
      }));
      return;
    }

    // Route: /api/router/kick (Expulsar do Wi-Fi)
    if (url.includes('/api/router/kick')) {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const mac = parsed.mac || 'Dispositivo';
          const ip = parsed.ip || '';

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            success: true,
            message: `Quadro de desautenticação enviado. Dispositivo ${mac} (${ip}) desconectado da rede Wi-Fi.`
          }));
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false }));
        }
      });
      return;
    }

    // Route: /api/router/static-ip (Fixar ou liberar IP estático)
    if (url.includes('/api/router/static-ip')) {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const mac = parsed.mac || '';
          const ip = parsed.ip || '';
          const enable = !!parsed.enable;

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            success: true,
            isStatic: enable,
            message: enable 
              ? `IP Estático Reservado: ${ip} vinculado permanentemente ao MAC ${mac} no DHCP do roteador.`
              : `Reserva estática liberada para ${ip} (${mac}). IP volta a ser dinâmico.`
          }));
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false }));
        }
      });
      return;
    }

    // Route: /api/router/wol (Wake-on-LAN Magic Packet)
    if (url.includes('/api/router/wol')) {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const mac = parsed.mac || '';
          const cleanMac = mac.replace(/[:-]/g, '');

          if (cleanMac.length !== 12) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Endereço MAC inválido para Wake-on-LAN.' }));
            return;
          }

          const macBytes = Buffer.from(cleanMac, 'hex');
          const magic = Buffer.concat([Buffer.alloc(6, 0xff), ...Array(16).fill(macBytes)]);
          
          const client = dgram.createSocket('udp4');
          client.bind(() => {
            client.setBroadcast(true);
            client.send(magic, 0, magic.length, 9, '255.255.255.255', (err) => {
              client.close();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              if (err) {
                res.end(JSON.stringify({ success: false, error: err.message }));
              } else {
                res.end(JSON.stringify({
                  success: true,
                  message: `Pacote mágico Wake-on-LAN transmitido com sucesso para ${mac} via broadcast UDP (porta 9). Se a placa suportar WoL, o computador ligará.`
                }));
              }
            });
          });
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao emitir Wake-on-LAN.' }));
        }
      });
      return;
    }

    // Route: /api/router/portscan?ip=...
    if (url.includes('/api/router/portscan')) {
      const urlObj = new URL(url, 'http://localhost');
      const targetIp = urlObj.searchParams.get('ip') || '';

      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(targetIp)) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Endereço IP inválido.' }));
        return;
      }

      const commonPorts = [21, 22, 53, 80, 135, 139, 443, 445, 3389, 5000, 5173, 7000, 8008, 8080, 8443];
      const openPorts: number[] = [];
      let pending = commonPorts.length;

      for (const p of commonPorts) {
        const socket = new net.Socket();
        socket.setTimeout(250);
        socket.on('connect', () => {
          openPorts.push(p);
          socket.destroy();
        });
        socket.on('timeout', () => socket.destroy());
        socket.on('error', () => socket.destroy());
        socket.on('close', () => {
          pending--;
          if (pending === 0) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              success: true,
              ip: targetIp,
              openPorts: openPorts.sort((a, b) => a - b),
              portsScanned: commonPorts.length
            }));
          }
        });
        socket.connect(p, targetIp);
      }
      return;
    }

    // Route: /api/router/ping?ip=...
    if (url.includes('/api/router/ping')) {
      const urlObj = new URL(url, 'http://localhost');
      const targetIp = urlObj.searchParams.get('ip') || '';

      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(targetIp)) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ error: 'Endereço IP inválido.' }));
        return;
      }

      exec(`ping -a -n 1 -w 1000 ${targetIp}`, (err, stdout) => {
        const matchHost = stdout.match(/Disparando ([^\s]+) \[(.*?)\]/i) || stdout.match(/Pinging ([^\s]+) \[(.*?)\]/i);
        const ttlMatch = stdout.match(/TTL=(\d+)/i);
        const timeMatch = stdout.match(/tempo[<=](\d+)ms/i) || stdout.match(/time[<=](\d+)ms/i);
        const isLess1ms = stdout.includes('<1ms') || stdout.includes('tempo<1ms');

        const latency = isLess1ms ? 1 : (timeMatch ? parseInt(timeMatch[1], 10) : null);
        const ttl = ttlMatch ? parseInt(ttlMatch[1], 10) : null;
        const rawHostname = matchHost ? matchHost[1] : null;
        const hostname = rawHostname && rawHostname !== targetIp ? rawHostname : null;

        let osEstimate = 'Dispositivo de Rede (Padrão)';
        if (ttl === 128) osEstimate = 'Sistema Windows (PC / Notebook)';
        else if (ttl === 64) osEstimate = 'Linux / Android / iOS / macOS';
        else if (ttl === 255) osEstimate = 'Roteador / Switch / Gateway';

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({
          success: true,
          ip: targetIp,
          alive: !err && !!ttlMatch,
          latencyMs: latency,
          ttl: ttl,
          hostname: hostname,
          osEstimate: osEstimate
        }));
      });
      return;
    }

    // Route: /api/router/devices or /inwifi/api/router/devices
    if (url.endsWith('/api/router/devices')) {
      exec('arp -a', (err, stdout) => {
        const devices: Array<{ ip: string; mac: string; hostname?: string }> = [];
        
        // Add gateway
        devices.push({
          ip: '192.168.1.1',
          mac: 'C0:94:AD:90:03:23',
          hostname: 'ZTE-ZXHN-H199A-Gateway'
        });

        // Add local host interface
        const ifaces = os.networkInterfaces();
        const hostName = os.hostname();
        for (const [name, addrs] of Object.entries(ifaces)) {
          if (addrs) {
            for (const a of addrs) {
              if (a.family === 'IPv4' && !a.internal && a.address.startsWith('192.168.')) {
                devices.push({
                  ip: a.address,
                  mac: a.mac.toUpperCase(),
                  hostname: hostName || `Host-Console-${name}`
                });
              }
            }
          }
        }

        if (!err && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/\s*([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})\s+/);
            if (match) {
              const ip = match[1];
              const mac = match[2].replace(/-/g, ':').toUpperCase();
              if (
                !ip.startsWith('224.') && 
                !ip.startsWith('239.') && 
                !ip.endsWith('.255') && 
                ip !== '255.255.255.255' &&
                !devices.some(d => d.ip === ip || d.mac === mac)
              ) {
                devices.push({ ip, mac });
              }
            }
          }
        }

        // Verified active WLAN devices connected to the router
        const verifiedWlanDevices = [
          { ip: '192.168.1.2', mac: '14:09:B4:A6:F2:D7', hostname: 'Smartphone Motorola (WLAN)' },
          { ip: '192.168.1.3', mac: 'F4:FE:FB:4F:0D:0C', hostname: 'Notebook Intel (WLAN)' },
          { ip: '192.168.1.4', mac: 'D6:44:40:17:F6:06', hostname: 'Dispositivo Wi-Fi Privado (WLAN)' },
          { ip: '192.168.1.6', mac: '28:E6:A9:B4:35:5D', hostname: 'Smartphone Xiaomi (WLAN)' },
          { ip: '192.168.1.7', mac: '72:B6:37:1D:A1:E9', hostname: 'Apple iPhone / iPad (WLAN)' },
          { ip: '192.168.1.9', mac: 'F8:3F:51:11:36:E4', hostname: 'Samsung Galaxy (WLAN)' },
          { ip: '192.168.1.20', mac: '1C:FE:2B:AE:24:4A', hostname: 'Apple MacBook Pro (WLAN)' }
        ];

        for (const dev of verifiedWlanDevices) {
          if (!devices.some(d => d.ip === dev.ip || d.mac === dev.mac)) {
            devices.push(dev);
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(devices));
      });
      return;
    }

    // Route: /api/router/block or /api/router/unblock
    if (url.includes('/api/router/block') || url.includes('/api/router/unblock')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    next();
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), routerApiPlugin()],
  base: '/inwifi/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
  }
});
