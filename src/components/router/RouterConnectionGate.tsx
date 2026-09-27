import React, { useState, useEffect } from 'react';
import { 
  Router, Shield, Check, AlertCircle, Wifi, 
  ArrowRight, Key, Server, Cpu, Globe, Lock, RefreshCw, Zap, X
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { testDevicePing } from '../../utils/deviceIdentifier';

interface RouterConnectionGateProps {
  onConnected: () => void;
  onClose?: () => void;
}

export const RouterConnectionGate: React.FC<RouterConnectionGateProps> = ({ onConnected, onClose }) => {
  const [gatewayIp, setGatewayIp] = useState('192.168.1.1');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ alive: boolean; latency: number | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-test gateway reachability on mount
  useEffect(() => {
    checkGatewayLive();
  }, []);

  const checkGatewayLive = async () => {
    setTesting(true);
    setErrorMsg(null);
    try {
      const res = await testDevicePing(gatewayIp);
      setPingStatus({ alive: res.alive, latency: res.latencyMs });
      if (res.alive) {
        setSuccessMsg(`Gateway ${gatewayIp} detectado com sucesso na rede local!`);
      }
    } catch {
      setPingStatus({ alive: false, latency: null });
    } finally {
      setTesting(false);
    }
  };

  const handleConnectRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setErrorMsg(null);

    try {
      // 1. If password was provided, attempt admin authentication
      if (password.trim()) {
        const loginRes = await networkService.loginAdmin(password, username);
        if (!loginRes.success) {
          // If login failed, warn the user
          setErrorMsg(loginRes.error || 'Falha na autenticação do roteador. Verifique a senha informada.');
          setConnecting(false);
          return;
        }
      }

      // 2. Mark router gateway as connected in localStorage
      localStorage.setItem('inwifi_gateway_connected', JSON.stringify({
        connected: true,
        ip: gatewayIp,
        model: 'ZTE ZXHN H199A',
        connectedAt: new Date().toISOString()
      }));

      // 3. Trigger refresh and unlock
      await networkService.refreshData();
      onConnected();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar ao roteador gateway.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-cyan-500 selection:text-black">
      
      {/* Background ambient neon glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-2 right-0 p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition shadow-lg z-20 cursor-pointer"
            title="Fechar e voltar à plataforma"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-2">
            <img 
              src={`${import.meta.env.BASE_URL}logo.png`} 
              alt="inWiFi" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback to text brand if image not loaded
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
            <div className="flex items-center gap-2 pl-2">
              <span className="text-xl font-black tracking-tight text-white">inWiFi</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gerenciamento do Roteador Gateway
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Conecte diretamente ao gateway da sua rede local para sincronizar configurações em tempo real.
          </p>
        </div>

        {/* Connection Form Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-5">
          
          {/* Hardware Detection Badge */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Router className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Roteador Gateway ZTE ZXHN H199A
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {gatewayIp} • C0:94:AD:90:03:23
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {testing ? (
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-semibold animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Testando...
                </span>
              ) : pingStatus?.alive ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE {pingStatus.latency ? `(${pingStatus.latency}ms)` : ''}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={checkGatewayLive}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  Testar IP
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleConnectRouter} className="space-y-4">
            
            {/* Gateway IP Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                <span>Endereço IP do Gateway (Roteador)</span>
                <button
                  type="button"
                  onClick={checkGatewayLive}
                  disabled={testing}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </button>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={gatewayIp}
                  onChange={(e) => setGatewayIp(e.target.value)}
                  placeholder="192.168.1.1"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  Usuário do Roteador
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin ou multipro"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>Senha do Roteador</span>
                  <span className="text-[10px] text-neutral-500 font-normal">Opcional</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Error or Success Notice */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && !errorMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Connect & Access Button */}
            <button
              type="submit"
              disabled={connecting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-glow-sm cursor-pointer disabled:opacity-60"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando ao Roteador Gateway...</span>
                </>
              ) : (
                <>
                  <span>Conectar e Sincronizar Roteador</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-800 transition cursor-pointer"
              >
                <span>Continuar na Plataforma In-Wifi</span>
              </button>
            )}
          </form>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> Conexão direta local segura
            </span>
            <span>ZTE Corporation ZXHN H199A</span>
          </div>
        </div>

      </div>
    </div>
  );
};
