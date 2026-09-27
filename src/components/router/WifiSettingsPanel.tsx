import React, { useState, useEffect } from 'react';
import { 
  Wifi, Shield, Radio, Key, Lock, Eye, EyeOff, 
  Sparkles, Check, AlertCircle, Save, RefreshCw, 
  Users, ShieldAlert, Sliders, ChevronRight,
  Share2, Copy, QrCode
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { WifiSettings } from '../../types';

interface WifiSettingsPanelProps {
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const WifiSettingsPanel: React.FC<WifiSettingsPanelProps> = ({ 
  isAdmin, 
  onOpenAdminLogin,
  initialSubTab,
  onSubTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'guest' | 'radio' | 'admin'>(() => {
    if (initialSubTab === 'guest' || initialSubTab === 'radio' || initialSubTab === 'admin' || initialSubTab === 'main') {
      return initialSubTab;
    }
    return 'main';
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedGuestWifi, setCopiedGuestWifi] = useState(false);
  const [togglingBandSteering, setTogglingBandSteering] = useState(false);

  useEffect(() => {
    if (initialSubTab && (initialSubTab === 'guest' || initialSubTab === 'radio' || initialSubTab === 'admin' || initialSubTab === 'main')) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabSwitch = (tab: 'main' | 'guest' | 'radio' | 'admin') => {
    setActiveTab(tab);
    onSubTabChange?.(tab);
  };

  const handleCopyGuestCredentials = () => {
    const text = `📶 Wi-Fi de Visitas: ${settings.guestSsid}\n🔑 Senha: ${settings.guestPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedGuestWifi(true);
    setTimeout(() => setCopiedGuestWifi(false), 2500);
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(`Olá! Seguem os dados para conectar ao Wi-Fi de visitas:\n📶 Rede: ${settings.guestSsid}\n🔑 Senha: ${settings.guestPassword}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Alterar WLAN Band Steering / Smart Connect diretamente no hardware do roteador ZTE ZXHN H199A
  const handleToggleBandSteering = async (enable: boolean) => {
    if (!isAdmin) {
      onOpenAdminLogin();
      return;
    }

    setTogglingBandSteering(true);
    setFeedback(null);
    try {
      const res = await networkService.toggleBandSteering(enable);
      if (res.success) {
        setSettings(prev => ({
          ...prev,
          isUnifiedSsid: enable,
          bandSteeringEnabled: enable,
          ssid5: enable ? prev.ssid24 : prev.ssid5
        }));
        setFeedback({
          success: true,
          message: res.message || (enable
            ? 'Modo Smart Connect / WLAN Band Steering LIGADO no roteador ZTE ZXHN H199A! As redes 2.4 GHz e 5 GHz foram unificadas no mesmo nome.'
            : 'Modo Smart Connect / WLAN Band Steering DESLIGADO no roteador ZTE ZXHN H199A. As frequências 2.4 GHz e 5 GHz agora operam de forma independente.')
        });
      } else {
        setFeedback({
          success: false,
          message: res.error || 'Falha ao alterar Band Steering no roteador.'
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Erro de comunicação ao sincronizar Band Steering com o roteador.'
      });
    } finally {
      setTogglingBandSteering(false);
    }
  };

  // Form State for Wi-Fi - Sincronizado com os dados reais do Roteador ZTE ZXHN H199A
  const [settings, setSettings] = useState<WifiSettings>({
    ssid24: 'MALAQUIAS',
    ssid5: 'Ta Liso Né?!?',
    isUnifiedSsid: false,
    password: 'botecredito',
    securityMode: 'WPA2/WPA3-Mixed',
    hideSsid: false,
    channel24: 'auto',
    channel5: 'auto',
    bandwidth24: '40MHz',
    bandwidth5: '80MHz',
    txPower: '100%',
    wpsEnabled: true,
    guestEnabled: true,
    guestSsid: 'MALAQUIAS - Convidados',
    guestPassword: 'visitaswifi',
    guestIsolation: true,
    guestDurationHours: 0
  });

  // Password visibility states
  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showGuestPassword, setShowGuestPassword] = useState(false);

  // Admin Password Change state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);
  const [adminPwFeedback, setAdminPwFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Load current Wi-Fi settings from adapter/service
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await networkService.getWifiSettings();
        if (isMounted && data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de Wi-Fi:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();
    return () => { isMounted = false; };
  }, [isAdmin]);


  // Generate high-entropy safe random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateMainPassword = () => {
    const strongPw = generateStrongPassword();
    setSettings(prev => ({ ...prev, password: strongPw }));
    setShowMainPassword(true);
  };

  const handleGenerateGuestPassword = () => {
    const strongPw = generateStrongPassword();
    setSettings(prev => ({ ...prev, guestPassword: strongPw }));
    setShowGuestPassword(true);
  };

  // Calculate password strength score (0 to 100)
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'Vazio', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (pw.length >= 12) score += 20;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[a-z]/.test(pw)) score += 15;
    if (/[0-9]/.test(pw)) score += 15;
    if (/[^A-Za-z0-9]/.test(pw)) score += 10;

    if (score < 40) return { score, label: 'Fraca', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score < 75) return { score, label: 'Média', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score: 100, label: 'Forte & Segura', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(settings.password);

  // Save Wi-Fi settings
  const handleSaveWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onOpenAdminLogin();
      return;
    }

    if (settings.password.length < 8) {
      setFeedback({ success: false, message: 'A senha do Wi-Fi deve ter no mínimo 8 caracteres (padrão WPA/WPA2/WPA3).' });
      return;
    }

    if (!settings.ssid24.trim()) {
      setFeedback({ success: false, message: 'O nome do Wi-Fi (SSID) 2.4 GHz não pode ficar em branco.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await networkService.updateWifiSettings(settings);
      if (res.success) {
        setFeedback({
          success: true,
          message: 'Configurações de Wi-Fi e Rádio aplicadas com sucesso no roteador ZTE ZXHN H199A! Se o nome ou senha foram alterados, reconecte seus aparelhos.'
        });
      } else {
        setFeedback({ success: false, message: res.error || 'Falha ao atualizar parâmetros de Wi-Fi.' });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erro de comunicação ao salvar Wi-Fi.' });
    } finally {
      setSaving(false);
    }
  };

  // Change Admin Router Password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onOpenAdminLogin();
      return;
    }

    if (newAdminPassword.length < 4) {
      setAdminPwFeedback({ success: false, message: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setAdminPwFeedback({ success: false, message: 'As senhas digitadas não coincidem.' });
      return;
    }

    setSavingAdminPassword(true);
    setAdminPwFeedback(null);
    try {
      const res = await networkService.changeAdminPassword(newAdminPassword);
      if (res.success) {
        setAdminPwFeedback({
          success: true,
          message: 'Senha de administrador do roteador alterada com sucesso! Guarde-a em um local seguro.'
        });
        setNewAdminPassword('');
        setConfirmAdminPassword('');
      } else {
        setAdminPwFeedback({ success: false, message: res.error || 'Erro ao alterar senha do admin.' });
      }
    } catch (err: any) {
      setAdminPwFeedback({ success: false, message: err.message || 'Falha na requisição.' });
    } finally {
      setSavingAdminPassword(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-6">
      
      {/* Top Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Gerenciador de Redes Wi-Fi & Rádio
              </h2>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  ADMIN DESBLOQUEADO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  REQUER SENHA ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Altere o nome (SSID) e a senha das redes 2.4 GHz, 5 GHz e de Convidados diretamente no hardware do roteador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold font-mono"
            title="As configurações de Wi-Fi e rádio são sincronizadas automaticamente em tempo real com o roteador"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Sincronizado</span>
          </div>

          {!isAdmin && (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-bold transition shadow-glow-sm cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Autenticar Admin para Mudar</span>
            </button>
          )}
        </div>
      </div>

      {/* Lock Warning Overlay if not authenticated */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block mb-0.5">
              Configurações de Wi-Fi e Rádio Bloqueadas para Edição
            </span>
            <span className="text-amber-200/80 leading-relaxed">
              Para alterar o nome do Wi-Fi, mudar a senha da rede sem fio ou criar rede de visitas, digite a senha de administrador do roteador no topo desta página. Você está visualizando em modo somente leitura.
            </span>
          </div>
        </div>
      )}

      {/* Tabs Bar - Sleek Pure Black Buttons & Mobile Friendly */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabSwitch('main')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'main'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span>Wi-Fi Principal (2.4G & 5G)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('guest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'guest'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Rede de Convidados</span>
          {settings.guestEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('radio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'radio'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Rádio, Canais & Frequências</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Segurança Admin</span>
        </button>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-medium animate-fade-in flex items-center gap-2.5 ${
          feedback.success 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          {feedback.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: REDE WI-FI PRINCIPAL */}
      {activeTab === 'main' && (
        <form onSubmit={handleSaveWifi} className="space-y-6 animate-fade-in">
          
          {/* Smart Connect / WLAN Band Steering Toggle - Sincronizado 1:1 com o Hardware do Roteador ZTE ZXHN H199A */}
          <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  Modo Smart Connect (Rede Única Inteligente) / WLAN Band Steering
                </span>
                {settings.isUnifiedSsid ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ligado no Roteador (Band Steering Enable: Ligado)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-1">
                    Desligado no Roteador (Band Steering Enable: Desligado)
                  </span>
                )}
              </div>
              
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Opção correspondente à aba <span className="text-neutral-200 font-semibold">Rede local &rarr; WLAN &rarr; WLAN Band Steering</span> do seu roteador ZTE ZXHN H199A. 
                Quando ligado (<span className="text-emerald-400 font-mono font-semibold">Band Steering Enable: Ligado</span>), unifica as frequências 2.4 GHz e 5 GHz sob o mesmo nome e o roteador direciona automaticamente cada dispositivo para a frequência ideal.
              </p>

              {/* Exact ZTE radio buttons representation */}
              <div className="flex items-center gap-4 pt-1 text-xs">
                <label 
                  onClick={() => !togglingBandSteering && handleToggleBandSteering(true)}
                  className={`inline-flex items-center gap-1.5 cursor-pointer font-medium transition ${
                    settings.isUnifiedSsid ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="bandSteeringRadio"
                    checked={settings.isUnifiedSsid}
                    onChange={() => handleToggleBandSteering(true)}
                    disabled={togglingBandSteering}
                    className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Ligado</span>
                </label>

                <label 
                  onClick={() => !togglingBandSteering && handleToggleBandSteering(false)}
                  className={`inline-flex items-center gap-1.5 cursor-pointer font-medium transition ${
                    !settings.isUnifiedSsid ? 'text-cyan-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="bandSteeringRadio"
                    checked={!settings.isUnifiedSsid}
                    onChange={() => handleToggleBandSteering(false)}
                    disabled={togglingBandSteering}
                    className="accent-cyan-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Desligado</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
              {togglingBandSteering && (
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Gravando no hardware...
                </span>
              )}

              <label 
                className="relative inline-flex items-center cursor-pointer flex-shrink-0"
                title={isAdmin ? "Clique para alternar Band Steering no roteador" : "Autentique com a senha admin para alterar"}
              >
                <input
                  type="checkbox"
                  disabled={togglingBandSteering}
                  checked={settings.isUnifiedSsid}
                  onChange={(e) => handleToggleBandSteering(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* SSIDs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* SSID 2.4 GHz */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nome do Wi-Fi (SSID) 2.4 GHz</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Maior alcance</span>
              </div>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.ssid24}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings(prev => ({
                    ...prev,
                    ssid24: val,
                    ssid5: prev.isUnifiedSsid ? val : prev.ssid5
                  }));
                }}
                placeholder="Ex: IN-WIFI_2.4G"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500 block">
                Compatível com todos os celulares antigos, TVs e dispositivos Smart Home.
              </span>
            </div>

            {/* SSID 5 GHz */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              settings.isUnifiedSsid 
                ? 'bg-slate-950/30 border-slate-800/40 opacity-70' 
                : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-brand-400" />
                  <span>Nome do Wi-Fi (SSID) 5 GHz</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400">Ultra velocidade</span>
              </div>
              <input
                type="text"
                disabled={!isAdmin || settings.isUnifiedSsid}
                value={settings.isUnifiedSsid ? settings.ssid24 : settings.ssid5}
                onChange={(e) => setSettings(prev => ({ ...prev, ssid5: e.target.value }))}
                placeholder="Ex: IN-WIFI_5G"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500 block">
                {settings.isUnifiedSsid ? 'Gerenciado automaticamente via Smart Connect.' : 'Ideal para streaming em 4K e jogos sem lag.'}
              </span>
            </div>

          </div>

          {/* Wi-Fi Password Section */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Senha Principal do Wi-Fi (WPA Key)</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  A mesma senha será utilizada para autenticação segura nas redes 2.4 GHz e 5 GHz.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleGenerateMainPassword}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[11px] font-bold transition self-start sm:self-auto cursor-pointer"
                  title="Gerar automaticamente uma senha forte e segura"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Gerar Senha Segura</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showMainPassword ? 'text' : 'password'}
                disabled={!isAdmin}
                value={settings.password}
                onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Digite a nova senha do Wi-Fi..."
                className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowMainPassword(!showMainPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                aria-label="Alternar visualização da senha"
              >
                {showMainPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Força da Senha:</span>
                <span className={`font-bold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strength.color}`} 
                  style={{ width: `${strength.score}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Security & Broadcast Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Security Mode */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Modo de Criptografia & Segurança
              </label>
              <select
                disabled={!isAdmin}
                value={settings.securityMode}
                onChange={(e: any) => setSettings(prev => ({ ...prev, securityMode: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500 disabled:opacity-60"
              >
                <option value="WPA2-PSK">WPA2-PSK (AES) — Máxima Compatibilidade</option>
                <option value="WPA3-SAE">WPA3-SAE — Segurança Máxima de Última Geração</option>
                <option value="WPA2/WPA3-Mixed">WPA2/WPA3 Mixed — Recomendado</option>
              </select>
            </div>

            {/* Hide SSID */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Ocultar Nome da Rede (Rede Invisível)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Desativa o anúncio público do SSID (Stealth Mode).
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.hideSsid}
                  onChange={(e) => setSettings(prev => ({ ...prev, hideSsid: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

          </div>

          {/* Action Button */}
          {isAdmin && (
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                <span>{saving ? 'Aplicando ao Roteador ZTE...' : 'Salvar Alterações de Wi-Fi'}</span>
              </button>
            </div>
          )}

        </form>
      )}

      {/* TAB 2: REDE DE CONVIDADOS COMPLETA COM QR CODE E ACESSO RÁPIDO */}
      {activeTab === 'guest' && (
        <form onSubmit={handleSaveWifi} className="space-y-6 animate-fade-in">
          
          {/* Guest Enable Switch Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Rede Wi-Fi de Convidados (Guest Network)</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.guestEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                }`}>
                  {settings.guestEnabled ? 'HABILITADA & ATIVA' : 'DESATIVADA'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Cria uma rede Wi-Fi isolada para visitas e clientes. Eles navegam na internet com total velocidade, mas ficam isolados de seus computadores pessoais, câmeras ou painéis da casa.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={settings.guestEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, guestEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-12 h-6.5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {settings.guestEnabled && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Live Signal Status Pill */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      Sinal Transmitindo no Roteador ZTE ZXHN H199A
                    </span>
                    <span className="text-[11px] text-emerald-200/80">
                      Aparelhos de visitas já podem localizar a rede e conectar.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SSID: {settings.guestSsid || 'MALAQUIAS - Convidados'}
                  </span>
                </div>
              </div>

              {/* Instant QR Code & Connection Card for Mobile Phones */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  
                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-2xl flex-shrink-0 shadow-lg flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=WIFI:T:WPA;S:${encodeURIComponent(settings.guestSsid)};P:${encodeURIComponent(settings.guestPassword)};;`}
                      alt={`QR Code Conexão ${settings.guestSsid}`}
                      className="w-28 h-28 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Instructions & Share Buttons */}
                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Acesso Instantâneo via Celular</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">Sem Digitar Senha</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Aponte a câmera de qualquer celular iPhone ou Android no QR Code para conectar direto ao Wi-Fi sem precisar soletrar a senha.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyGuestCredentials}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition border border-neutral-700 cursor-pointer"
                      >
                        {copiedGuestWifi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedGuestWifi ? 'Copiado para Área de Transferência!' : 'Copiar Dados de Conexão'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareWhatsapp}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Guest SSID */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Nome do Wi-Fi de Convidados (SSID)
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.guestSsid}
                    onChange={(e) => setSettings(prev => ({ ...prev, guestSsid: e.target.value }))}
                    placeholder="Ex: MALAQUIAS - Convidados"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Nome exibido na busca de redes Wi-Fi dos celulares.
                  </span>
                </div>

                {/* Guest Password */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      Senha dos Convidados
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleGenerateGuestPassword}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                      >
                        Gerar Senha Fácil
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showGuestPassword ? 'text' : 'password'}
                      disabled={!isAdmin}
                      value={settings.guestPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, guestPassword: e.target.value }))}
                      placeholder="Senha para os visitantes..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono font-semibold focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGuestPassword(!showGuestPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer"
                    >
                      {showGuestPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">
                    Mínimo de 8 caracteres.
                  </span>
                </div>

              </div>

              {/* AP Isolation Card */}
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Isolamento de Clientes (AP Isolation) — Ativo
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Bloqueia a comunicação entre os dispositivos de convidados e impede acesso a pastas locais, roteador ou impressoras.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={settings.guestIsolation}
                    onChange={(e) => setSettings(prev => ({ ...prev, guestIsolation: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                <span>{saving ? 'Gravando no Roteador...' : 'Salvar Rede de Convidados'}</span>
              </button>
            </div>
          )}

        </form>
      )}

      {/* TAB 3: RÁDIO, CANAIS & FREQUÊNCIAS */}
      {activeTab === 'radio' && (
        <form onSubmit={handleSaveWifi} className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Canal 2.4 GHz */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Canal Wi-Fi 2.4 GHz
              </label>
              <select
                disabled={!isAdmin}
                value={settings.channel24}
                onChange={(e) => setSettings(prev => ({ ...prev, channel24: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
              >
                <option value="auto">Automático (Recomendado — Evita Interferência)</option>
                <option value="1">Canal 1 (2.412 GHz)</option>
                <option value="6">Canal 6 (2.437 GHz)</option>
                <option value="11">Canal 11 (2.462 GHz)</option>
              </select>
              <span className="text-[10px] text-slate-500 block">
                Os canais 1, 6 e 11 são os únicos sem sobreposição na banda 2.4 GHz.
              </span>
            </div>

            {/* Largura de Banda 2.4 GHz */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Largura de Banda 2.4 GHz
              </label>
              <select
                disabled={!isAdmin}
                value={settings.bandwidth24}
                onChange={(e: any) => setSettings(prev => ({ ...prev, bandwidth24: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
              >
                <option value="20MHz">20 MHz (Mais estável em ambientes com muitos vizinhos)</option>
                <option value="40MHz">40 MHz (Maior velocidade de transmissão)</option>
                <option value="auto">Automático 20/40 MHz</option>
              </select>
            </div>

            {/* Canal 5 GHz */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Canal Wi-Fi 5 GHz
              </label>
              <select
                disabled={!isAdmin}
                value={settings.channel5}
                onChange={(e) => setSettings(prev => ({ ...prev, channel5: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
              >
                <option value="auto">Automático (Seleção Dinâmica DFS)</option>
                <option value="36">Canal 36 (5.180 GHz)</option>
                <option value="40">Canal 40 (5.200 GHz)</option>
                <option value="44">Canal 44 (5.220 GHz)</option>
                <option value="48">Canal 48 (5.240 GHz)</option>
                <option value="149">Canal 149 (5.745 GHz)</option>
                <option value="153">Canal 153 (5.765 GHz)</option>
                <option value="157">Canal 157 (5.785 GHz)</option>
                <option value="161">Canal 161 (5.805 GHz)</option>
              </select>
            </div>

            {/* Largura de Banda 5 GHz */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Largura de Banda 5 GHz
              </label>
              <select
                disabled={!isAdmin}
                value={settings.bandwidth5}
                onChange={(e: any) => setSettings(prev => ({ ...prev, bandwidth5: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
              >
                <option value="80MHz">80 MHz (Alta performance gigabit — Recomendado)</option>
                <option value="40MHz">40 MHz (Equilibrado)</option>
                <option value="20MHz">20 MHz (Compatibilidade básica)</option>
                <option value="auto">Automático 20/40/80 MHz</option>
              </select>
            </div>

            {/* Potência de Transmissão */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Potência de Transmissão (Tx Power)
              </label>
              <select
                disabled={!isAdmin}
                value={settings.txPower}
                onChange={(e: any) => setSettings(prev => ({ ...prev, txPower: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-brand-500"
              >
                <option value="100%">100% — Cobertura Máxima (Casas grandes e com paredes)</option>
                <option value="75%">75% — Cobertura Média-Alta</option>
                <option value="50%">50% — Cobertura Média (Apartamentos)</option>
                <option value="25%">25% — Baixa Emissão (Ambiente pequeno)</option>
              </select>
            </div>

            {/* WPS Switch */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  WPS (Wi-Fi Protected Setup)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Permite conexão rápida por botão físico ou PIN.
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.wpsEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, wpsEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

          </div>

          {isAdmin && (
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                <span>{saving ? 'Gravando no Roteador...' : 'Salvar Parâmetros de Rádio'}</span>
              </button>
            </div>
          )}

        </form>
      )}

      {/* TAB 4: SEGURANÇA ADMIN DO ROTEADOR */}
      {activeTab === 'admin' && (
        <form onSubmit={handleChangeAdminPassword} className="space-y-5 animate-fade-in max-w-2xl">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <h3 className="text-xs font-bold text-white">Alterar Senha do Roteador Gateway (ZTE ZXHN H199A)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Muda a senha principal utilizada para logar no painel do roteador (`192.168.1.1`). Esta senha é exigida para autorizar ações críticas neste console.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1.5">
                Nova Senha de Administrador
              </label>
              <input
                type="password"
                disabled={!isAdmin}
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1.5">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                disabled={!isAdmin}
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
                placeholder="Repita a nova senha..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
            </div>
          </div>

          {adminPwFeedback && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium animate-fade-in flex items-center gap-2 ${
              adminPwFeedback.success 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {adminPwFeedback.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{adminPwFeedback.message}</span>
            </div>
          )}

          {isAdmin && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingAdminPassword || !newAdminPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-sm cursor-pointer disabled:opacity-50"
              >
                <Lock className={`w-3.5 h-3.5 ${savingAdminPassword ? 'animate-spin' : ''}`} />
                <span>{savingAdminPassword ? 'Atualizando Senha...' : 'Atualizar Senha de Administrador'}</span>
              </button>
            </div>
          )}
        </form>
      )}

    </div>
  );
};
