import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Pause, Play, 
  HelpCircle, CheckCircle, Eye
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { Device, RouterCapabilities } from '../types';
import { DeviceIcon, DeviceStatusBadge } from '../components/devices/DeviceIcon';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CapabilityNotice } from '../components/common/CapabilityNotice';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';

interface AccessControlPageProps {
  capabilities: RouterCapabilities;
}

export const AccessControlPage: React.FC<AccessControlPageProps> = ({ capabilities }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceToBlock, setDeviceToBlock] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'blocked' | 'paused' | 'allowed' | 'unknown'>('blocked');

  const [devices, setDevices] = useState<Device[]>(() => networkService.getDevices());

  // Real-time synchronization subscription
  useEffect(() => {
    const unsubscribe = networkService.subscribe(() => {
      setDevices(networkService.getDevices());
    });
    return unsubscribe;
  }, []);

  const blockedDevices = devices.filter(d => d.status === 'blocked');
  const pausedDevices = devices.filter(d => d.status === 'paused');
  const allowedDevices = devices.filter(d => d.status === 'online' || d.status === 'offline');
  const unknownDevices = devices.filter(d => d.category === 'unknown');

  const handleUnblock = async (device: Device) => {
    await networkService.unblockDevice(device.id);
  };

  const handleResume = async (device: Device) => {
    await networkService.resumeDevice(device.id);
  };

  const handleBlockConfirm = async () => {
    if (!deviceToBlock) return;
    await networkService.blockDevice(deviceToBlock.id);
    setDeviceToBlock(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Controle de Acesso & Segurança
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Políticas de restrição, listas de bloqueio por MAC e isolamento de dispositivos suspeitos.
          </p>
        </div>
      </div>

      {/* Capability Warning if router does not support MAC blocking */}
      {!capabilities.blocking && (
        <CapabilityNotice
          featureName="Bloqueio de Dispositivos (Blacklist MAC)"
          reason="O roteador atualmente conectado ou protocolo em uso (ex: SNMP) não suporta adição de regras de bloqueio de hardware. Para habilitar bloqueio, configure um conector com suporte a API REST ou SSH."
        />
      )}

      {/* State Tabs Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <button
          onClick={() => setActiveTab('blocked')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'blocked'
              ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
              : 'bg-dark-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bloqueados</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-rose-400">
            {blockedDevices.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Tráfego totalmente impedido</p>
        </button>

        <button
          onClick={() => setActiveTab('paused')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'paused'
              ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
              : 'bg-dark-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pausados</span>
            <Pause className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-400">
            {pausedDevices.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Suspensão temporária manual</p>
        </button>

        <button
          onClick={() => setActiveTab('allowed')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'allowed'
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
              : 'bg-dark-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Permitidos</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
            {allowedDevices.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Acesso irrestrito regular</p>
        </button>

        <button
          onClick={() => setActiveTab('unknown')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'unknown'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-sm'
              : 'bg-dark-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Desconhecidos</span>
            <HelpCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-purple-400">
            {unknownDevices.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Dispositivos não identificados</p>
        </button>

      </div>

      {/* Devices Section According to Selected Tab */}
      <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {activeTab === 'blocked' ? 'Dispositivos na Lista de Bloqueio' :
               activeTab === 'paused' ? 'Dispositivos com Conexão Pausada' :
               activeTab === 'allowed' ? 'Dispositivos Permitidos' :
               'Dispositivos com Perfil Desconhecido'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'blocked' ? 'Aparelhos impedidos pelo roteador de transmitir ou receber dados.' :
               activeTab === 'paused' ? 'Conexão interrompida sob demanda.' :
               activeTab === 'allowed' ? 'Dispositivos seguros autorizados na rede.' :
               'Aparelhos sem identificador reconhecido que demandam auditoria.'}
            </p>
          </div>
        </div>

        {/* Tab Item List */}
        <div className="space-y-3">
          {(activeTab === 'blocked' ? blockedDevices :
            activeTab === 'paused' ? pausedDevices :
            activeTab === 'allowed' ? allowedDevices :
            unknownDevices).length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum dispositivo encontrado nesta categoria.
            </div>
          ) : (
            (activeTab === 'blocked' ? blockedDevices :
             activeTab === 'paused' ? pausedDevices :
             activeTab === 'allowed' ? allowedDevices :
             unknownDevices).map((dev) => (
              <div
                key={dev.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <DeviceIcon category={dev.category} band={dev.band} status={dev.status} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {dev.customName || dev.originalHostname}
                      </span>
                      <DeviceStatusBadge status={dev.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                      <span>IP: {dev.ip}</span>
                      <span>•</span>
                      <span>MAC: {dev.mac}</span>
                      <span>•</span>
                      <span className="text-slate-500">{dev.manufacturer}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {dev.status === 'blocked' && (
                    <button
                      onClick={() => handleUnblock(dev)}
                      disabled={!capabilities.blocking}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Desbloquear Acesso</span>
                    </button>
                  )}

                  {dev.status === 'paused' && (
                    <button
                      onClick={() => handleResume(dev)}
                      disabled={!capabilities.pauseResume}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Retomar Conexão</span>
                    </button>
                  )}

                  {dev.status !== 'blocked' && (
                    <button
                      onClick={() => setDeviceToBlock(dev)}
                      disabled={!capabilities.blocking}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                        !capabilities.blocking
                          ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-600'
                          : 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Bloquear</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDevice(dev)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Confirm Block Modal */}
      <ConfirmModal
        isOpen={!!deviceToBlock}
        title="Confirmar Bloqueio de Rede"
        description={`Deseja bloquear permanentemente o dispositivo "${deviceToBlock?.customName || deviceToBlock?.originalHostname}" (MAC: ${deviceToBlock?.mac})?`}
        confirmLabel="Confirmar Bloqueio"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleBlockConfirm}
        onCancel={() => setDeviceToBlock(null)}
      />

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        capabilities={capabilities}
        onClose={() => setSelectedDevice(null)}
        onUpdated={() => {
          setSelectedDevice(null);
          networkService.refreshData();
        }}
      />
    </div>
  );
};
