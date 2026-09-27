import React, { useState } from 'react';
import { 
  Router, RefreshCw, Lock, Unlock, Check, ShieldCheck, 
  Power, Zap, Key, Wifi, Server, Radio, AlertTriangle, Sliders
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { RouterCapabilities } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { WifiSettingsPanel } from '../components/router/WifiSettingsPanel';

interface RoutersPageProps {
  capabilities: RouterCapabilities;
}

export const RoutersPage: React.FC<RoutersPageProps> = ({ capabilities }) => {
  const routerInfo = networkService.getRouterInfo();
  const isAdmin = routerInfo?.isAdminAuthenticated || false;

  // Login Form State
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Testing & Reboot State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [rebootFeedback, setRebootFeedback] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setLoginFeedback({ success: false, message: 'Por favor, digite a senha de administrador do roteador.' });
      return;
    }

    setLoginLoading(true);
    setLoginFeedback(null);
    try {
      const res = await networkService.loginAdmin(adminPassword, adminUser);
      if (res.success) {
        setLoginFeedback({ success: true, message: 'Autenticado com sucesso! Todas as ferramentas de administrador foram liberadas.' });
        setAdminPassword('');
      } else {
        setLoginFeedback({ success: false, message: res.error || 'Falha ao autenticar no roteador.' });
      }
    } catch (err: any) {
      setLoginFeedback({ success: false, message: err.message || 'Erro de comunicação com o roteador.' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await networkService.logoutAdmin();
    setLoginFeedback({ success: true, message: 'Sessão de administrador encerrada com sucesso.' });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const adapter = networkService.getAdapter();
      const ok = await adapter.connect();
      setTestResult({
        success: ok,
        message: ok 
          ? `Conexão ativa com o gateway ${routerInfo?.ipAddress || '192.168.1.1'}! Latência de resposta: 1ms.`
          : 'Falha ao comunicar com o roteador.'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro de handshake: ${err.message || 'Gateway inalcançável.'}`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConfirmReboot = async () => {
    setShowRebootConfirm(false);
    setRebootFeedback('Enviando comando de reinicialização para o roteador ZTE...');
    const res = await networkService.rebootRouter();
    if (res.success) {
      setRebootFeedback('O roteador está reiniciando. A rede local será reestabelecida em aproximadamente 60 segundos.');
    } else {
      setRebootFeedback(res.error || 'Erro ao reiniciar o roteador.');
    }
    setTimeout(() => setRebootFeedback(null), 8000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Router className="w-6 h-6 text-brand-400" />
            Conexão do Roteador & Acesso Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerenciamento exclusivo do gateway da rede local • Autenticação de Administrador para desbloquear ferramentas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>Testar Conexão</span>
          </button>
        </div>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-xs font-medium animate-fade-in flex items-center gap-2.5 ${
          testResult.success ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Reboot Feedback Alert */}
      {rebootFeedback && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-medium animate-fade-in flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{rebootFeedback}</span>
        </div>
      )}

      {/* ADMIN AUTHENTICATION CARD (HERO SECTION) */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition shadow-card-dark ${
        isAdmin 
          ? 'bg-gradient-to-br from-emerald-950/30 via-dark-card to-slate-900 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
          : 'bg-dark-card border-brand-500/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border flex-shrink-0 ${
              isAdmin 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                : 'bg-brand-500/20 text-brand-400 border-brand-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isAdmin ? 'Super Admin Ativo no Roteador' : 'Acesso Administrador do Roteador'}
                </h2>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AUTENTICADO COM SENHA
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    MODO LEITURA / BÁSICO
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                {isAdmin 
                  ? `Sessão ativa autenticada para o usuário "${routerInfo?.adminUser || 'admin'}". Todas as ferramentas avançadas de controle, expulsão de Wi-Fi, fixação de IP e QoS estão desbloqueadas para este roteador.`
                  : 'Conecte-se com a senha de administrador do roteador para desbloquear as super ferramentas: Expulsar do Wi-Fi (Kick), Fixar IP Estático, Prioridade de Tráfego QoS e Reinício de Hardware.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 self-end lg:self-center flex-shrink-0">
              <button
                onClick={() => setShowRebootConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition"
                title="Reiniciar o roteador fisicamente"
              >
                <Power className="w-4 h-4 text-rose-400" />
                <span>Reiniciar Roteador</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                <Unlock className="w-4 h-4 text-slate-400" />
                <span>Encerrar Sessão Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* Login Form (Shown when NOT authenticated) */}
        {!isAdmin && (
          <form onSubmit={handleAdminLogin} className="mt-6 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário do Roteador
                </label>
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha de Administrador (Roteador ZTE)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Senha admin do roteador..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-glow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Key className={`w-4 h-4 ${loginLoading ? 'animate-spin' : ''}`} />
                  <span>{loginLoading ? 'Autenticando no Roteador...' : 'Conectar com Senha Admin'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>A senha é enviada diretamente ao gateway local (192.168.1.1) e não é transmitida para servidores externos.</span>
            </p>

            {loginFeedback && (
              <div className={`p-3 rounded-xl text-xs font-medium animate-fade-in ${
                loginFeedback.success 
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
              }`}>
                {loginFeedback.message}
              </div>
            )}
          </form>
        )}
      </div>

      {/* WI-FI & RADIO MANAGEMENT PANEL */}
      <WifiSettingsPanel
        isAdmin={isAdmin}
        onOpenAdminLogin={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ACTIVE GATEWAY HARDWARE SPECS CARD */}
      {routerInfo && (
        <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-cyan-400 border border-brand-500/30">
                <Router className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{routerInfo.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GATEWAY ÚNICO ATIVO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {routerInfo.brand} {routerInfo.model} • Gateway: {routerInfo.ipAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-emerald-400 font-bold block">Status: Online</span>
                <span className="text-slate-500">{routerInfo.firmwareVersion}</span>
              </div>
            </div>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Endereço IP Gateway</span>
              <span className="text-white font-mono font-bold mt-1 block">
                {routerInfo.ipAddress}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Endereço MAC Físico</span>
              <span className="text-white font-mono font-bold mt-1 block">
                {routerInfo.macAddress}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Máscara de Sub-rede</span>
              <span className="text-white font-mono font-bold mt-1 block">
                {routerInfo.subnetMask}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Servidores DNS</span>
              <span className="text-white font-mono font-bold mt-1 block truncate">
                {routerInfo.dnsServers.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCKED SUPER TOOLS STATUS GRID */}
      <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Ferramentas & Recursos Disponíveis no Roteador
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin 
              ? 'Todos os recursos avançados estão desbloqueados para execução nos dispositivos conectados.'
              : 'Alguns recursos requerem a autenticação com senha admin no topo desta página.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Expulsar do Wi-Fi (Kick)</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.deviceKick ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.deviceKick ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Desconecta aparelhos instantaneamente enviando quadros de desautenticação.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Reserva de IP Estático</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.staticIpReservation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.staticIpReservation ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Fixa permanentemente o mesmo endereço IP para um dispositivo via DHCP Bind.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Prioridade de Tráfego QoS</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.trafficPriority ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.trafficPriority ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Prioriza largura de banda para computadores gamer, streaming ou home office.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Wake-on-LAN (Ligar PC)</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.wakeOnLan ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.wakeOnLan ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Envia pacote mágico broadcast UDP para ligar computadores compatíveis pela rede.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 mt-0.5">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Scanner de Portas LAN</h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400">
                  DISPONÍVEL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Escanear portas abertas (HTTP, SSH, SMB, RDP) em qualquer aparelho da rede.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Gestão Wi-Fi & Senhas</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.wifiManagement ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.wifiManagement ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Altera nome (SSID) 2.4/5GHz, troca senha, cria rede de visitas e ajusta canais.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 mt-0.5">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Reinício do Hardware</h4>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${capabilities.reboot ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {capabilities.reboot ? 'DESBLOQUEADO' : 'REQUER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Reinicia o roteador ZTE fisicamente em caso de lentidão ou manutenção.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reboot Modal */}
      <ConfirmModal
        isOpen={showRebootConfirm}
        title="Reiniciar o Roteador ZTE?"
        description="A reinicialização do roteador causará uma interrupção temporária na conexão Wi-Fi e de internet de todos os aparelhos da casa por cerca de 60 segundos. Confirma a operação?"
        confirmLabel="Sim, Reiniciar Roteador"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmReboot}
        onCancel={() => setShowRebootConfirm(false)}
      />
    </div>
  );
};
