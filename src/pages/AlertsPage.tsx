import React, { useState } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, ShieldAlert, 
  Info, Sparkles, Volume2, VolumeX, Eye, 
  Send, Smartphone
} from 'lucide-react';
import { networkService } from '../services/networkService';
import { notificationService } from '../services/notificationService';
import { RouterCapabilities } from '../types';
import { DeviceDetailsModal } from '../components/devices/DeviceDetailsModal';

interface AlertsPageProps {
  capabilities: RouterCapabilities;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ capabilities }) => {
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'device' | 'security'>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string>(() => notificationService.getPushPermissionStatus());

  const events = networkService.getEvents();
  const settings = notificationService.getSettings();

  const filteredEvents = events.filter((e) => {
    if (filterType === 'unread') return !e.read;
    if (filterType === 'device') return e.type.startsWith('device_');
    if (filterType === 'security') return e.severity === 'warning' || e.severity === 'error';
    return true;
  });

  const handleRequestPush = async () => {
    const res = await notificationService.requestPushPermission();
    setPushStatus(res);
  };

  const handleToggleSound = () => {
    notificationService.updateSettings({ soundEnabled: !settings.soundEnabled });
    if (!settings.soundEnabled) {
      notificationService.playChime('info');
    }
  };

  const selectedDevice = selectedDeviceId ? networkService.getDeviceById(selectedDeviceId) || null : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-400" />
            Central de Alertas & Notificações
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Histórico auditável de detecções, acessos e eventos operacionais da rede LAN.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => networkService.simulateNewDevice()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simular Evento</span>
          </button>

          <button
            onClick={() => networkService.markAllEventsAsRead()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Marcar todas como lidas</span>
          </button>
        </div>
      </div>

      {/* Preferences & Push Notification Card */}
      <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Web Push / PWA Notification Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-brand-400" />
            Notificações PWA / Web Push
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Receba alertas instantâneos diretamente no seu celular ou navegador quando um novo aparelho conectar.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleRequestPush}
              disabled={pushStatus === 'granted'}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                pushStatus === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {pushStatus === 'granted' ? 'Notificações Ativas no Navegador' : 'Ativar Notificações Push'}
              </span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              Status: {pushStatus}
            </span>
          </div>
        </div>

        {/* Audio Alerts & Sound Feedback */}
        <div className="space-y-3 md:border-l md:border-slate-800/80 md:pl-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Avisos Sonoros da Central
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sons sintetizados discretos no navegador para novas conexões ou ocorrências críticas.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleToggleSound}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                settings.soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{settings.soundEnabled ? 'Avisos Sonoros Ativados' : 'Silenciado'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(['all', 'unread', 'device', 'security'] as const).map((ft) => {
          const labels = {
            all: 'Todos os Alertas',
            unread: 'Não Lidos',
            device: 'Dispositivos',
            security: 'Segurança & Bloqueios'
          };
          const count = ft === 'unread' ? events.filter(e => !e.read).length : events.length;
          return (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                filterType === ft
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{labels[ft]}</span>
              {ft === 'unread' && count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-dark-card border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white mt-2">Nenhum alerta pendente</h3>
            <p className="text-xs text-slate-400 mt-1">Todos os eventos foram processados.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const getIcon = () => {
              if (evt.severity === 'error') return <ShieldAlert className="w-5 h-5 text-rose-400" />;
              if (evt.severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-400" />;
              if (evt.severity === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
              return <Info className="w-5 h-5 text-brand-400" />;
            };

            return (
              <div
                key={evt.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !evt.read
                    ? 'bg-brand-950/20 border-brand-500/40 shadow-sm'
                    : 'bg-dark-card border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    evt.severity === 'error' ? 'bg-rose-500/10' :
                    evt.severity === 'warning' ? 'bg-amber-500/10' :
                    evt.severity === 'success' ? 'bg-emerald-500/10' :
                    'bg-brand-500/10'
                  }`}>
                    {getIcon()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                      {!evt.read && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                          NOVO
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(evt.timestamp).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                {/* Event Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {evt.deviceId && (
                    <button
                      onClick={() => setSelectedDeviceId(evt.deviceId!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-400" />
                      <span>Ver Dispositivo</span>
                    </button>
                  )}

                  {!evt.read && (
                    <button
                      onClick={() => networkService.markEventAsRead(evt.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                    >
                      Marcar lido
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details modal if opened from event */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        capabilities={capabilities}
        onClose={() => setSelectedDeviceId(null)}
        onUpdated={() => {
          setSelectedDeviceId(null);
          networkService.refreshData();
        }}
      />
    </div>
  );
};
