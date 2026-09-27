import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import os from 'os';

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

function handleRoutes(middlewares: any) {
  middlewares.use((req: any, res: any, next: any) => {
    const url = req.url || '';

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
        dnsServers: ['192.168.1.1', '1.1.1.1']
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(info));
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
