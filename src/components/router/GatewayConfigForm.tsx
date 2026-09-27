import React, { useState, useEffect } from 'react';
import { 
  Router, Server, Globe, Shield, Save, CheckCircle2, 
  AlertCircle, RefreshCw, Cpu, HardDrive, Wifi, Activity
} from 'lucide-react';
import { networkService } from '../../services/networkService';
import { RouterInfo } from '../../types';

interface GatewayConfigFormProps {
  onSaved?: () => void;
}

export const GatewayConfigForm: React.FC<GatewayConfigFormProps> = ({ onSaved }) => {
  const [routerInfo, setRouterInfo] = useState<RouterInfo | null>(networkService.getRouterInfo());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [dns1, setDns1] = useState('');
  const [dns2, setDns2] = useState('');
  const [dhcpStart, setDhcpStart] = useState('');
  const [dhcpEnd, setDhcpEnd] = useState('');
  const [dhcpLease, setDhcpLease] = useState('24');
  const [mtu, setMtu] = useState('1500');

  // Populate form with current router info
  const populateFields = (info: RouterInfo | null) => {
    if (!info) return;
    setName(info.name || 'Roteador Principal (ZTE ZXHN H199A)');
    setIpAddress(info.ipAddress || '192.168.1.1');
    setSubnetMask(info.subnetMask || '255.255.255.0');
    setDns1(info.dnsServers?.[0] || '192.168.1.1');
    setDns2(info.dnsServers?.[1] || '1.1.1.1');
    setDhcpStart(info.dhcpRangeStart || '192.168.1.2');
    setDhcpEnd(info.dhcpRangeEnd || '192.168.1.254');
    setDhcpLease(String(info.dhcpLeaseHours || 24));
    setMtu(String(info.mtu || 1500));
  };

  useEffect(() => {
    populateFields(routerInfo);
  }, []);

  useEffect(() => {
    const unsubscribe = networkService.subscribe(() => {
      const current = networkService.getRouterInfo();
      setRouterInfo(current);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) {
      setFeedback({ success: false, message: 'O endereço IP do Gateway é obrigatório.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const dnsServers = [dns1.trim(), dns2.trim()].filter(Boolean);
      const res = await networkService.updateRouterInfo({
        name: name.trim() || undefined,
        ipAddress: ipAddress.trim(),
        gatewayIp: ipAddress.trim(),
        subnetMask: subnetMask.trim() || '255.255.255.0',
        dnsServers: dnsServers.length > 0 ? dnsServers : ['192.168.1.1', '1.1.1.1'],
        dhcpRangeStart: dhcpStart.trim() || undefined,
        dhcpRangeEnd: dhcpEnd.trim() || undefined,
        dhcpLeaseHours: parseInt(dhcpLease, 10) || 24,
        mtu: parseInt(mtu, 10) || 1500
      });

      if (res.success) {
        setFeedback({
          success: true,
          message: res.message || 'Configurações de rede e Gateway salvas com sucesso no roteador! Auto-sincronizado em tempo real.'
        });
        onSaved?.();
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          success: false,
          message: res.error || 'Erro ao aplicar configurações no roteador.'
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Erro de comunicação ao salvar parâmetros do gateway.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    setName('Roteador Principal (ZTE ZXHN H199A)');
    setIpAddress('192.168.1.1');
    setSubnetMask('255.255.255.0');
    setDns1('192.168.1.1');
    setDns2('1.1.1.1');
    setDhcpStart('192.168.1.2');
    setDhcpEnd('192.168.1.254');
    setDhcpLease('24');
    setMtu('1500');
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-6">
      
      {/* Header with live auto-sync badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Router className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Configurações do Gateway & Rede Local (LAN)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUTO-SINCRONIZAÇÃO EM TEMPO REAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Altere os parâmetros de rede do roteador. As modificações são gravadas diretamente no hardware e refletidas instantaneamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
          >
            Preencher Padrões
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-2.5 animate-fade-in ${
          feedback.success 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          {feedback.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Gateway & Subnet */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Gateway / Roteador
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Roteador Principal"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Identificador amigável do gateway na rede</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Endereço IP do Gateway (IP Local)
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Endereço padrão de acesso ao roteador</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Máscara de Sub-rede (Subnet Mask)
            </label>
            <input
              type="text"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              placeholder="255.255.255.0"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Padrão da rede classe C (máx 254 nós)</span>
          </div>
        </div>

        {/* DNS Servers */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Globe className="w-4 h-4 text-brand-400" />
            <span>Servidores de Nomes DNS (Domain Name System)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Servidor DNS Primário
              </label>
              <input
                type="text"
                value={dns1}
                onChange={(e) => setDns1(e.target.value)}
                placeholder="192.168.1.1 ou 8.8.8.8"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Servidor DNS Secundário
              </label>
              <input
                type="text"
                value={dns2}
                onChange={(e) => setDns2(e.target.value)}
                placeholder="1.1.1.1 ou 8.8.4.4"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* DHCP Server Pool & Lease */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Pool do Servidor DHCP & Parâmetros LAN</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                IP Inicial do DHCP
              </label>
              <input
                type="text"
                value={dhcpStart}
                onChange={(e) => setDhcpStart(e.target.value)}
                placeholder="192.168.1.2"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                IP Final do DHCP
              </label>
              <input
                type="text"
                value={dhcpEnd}
                onChange={(e) => setDhcpEnd(e.target.value)}
                placeholder="192.168.1.254"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Tempo de Lease (Horas)
              </label>
              <select
                value={dhcpLease}
                onChange={(e) => setDhcpLease(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="1">1 hora</option>
                <option value="6">6 horas</option>
                <option value="12">12 horas</option>
                <option value="24">24 horas (Padrão)</option>
                <option value="72">72 horas (3 dias)</option>
                <option value="168">168 horas (1 semana)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                MTU da Interface
              </label>
              <input
                type="number"
                value={mtu}
                onChange={(e) => setMtu(e.target.value)}
                placeholder="1500"
                min="576"
                max="1500"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Read-only Hardware Specs Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px]">Endereço MAC Físico</span>
            <span className="text-slate-300 font-mono font-bold mt-0.5 block truncate">
              {routerInfo?.macAddress || 'C0:94:AD:90:03:23'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px]">Modelo / Fabricante</span>
            <span className="text-slate-300 font-bold mt-0.5 block truncate">
              {routerInfo?.brand || 'ZTE'} {routerInfo?.model || 'ZXHN H199A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px]">Versão do Firmware</span>
            <span className="text-slate-300 font-mono mt-0.5 block truncate">
              {routerInfo?.firmwareVersion || 'V9.1.0P2_MUL'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px]">Protocolo Ativo</span>
            <span className="text-emerald-400 font-mono font-bold mt-0.5 block uppercase">
              {routerInfo?.protocol || 'api'} (LIVE)
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>As configurações são salvas diretamente no gateway e propagadas em tempo real para toda a rede.</span>
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-bold transition shadow-glow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando no Roteador...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações do Gateway</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
