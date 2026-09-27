import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, Trash2
} from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { networkService } from '../services/networkService';
import { AccessSchedule, RouterCapabilities } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CapabilityNotice } from '../components/common/CapabilityNotice';

interface SchedulesPageProps {
  capabilities: RouterCapabilities;
}

export const SchedulesPage: React.FC<SchedulesPageProps> = ({ capabilities }) => {
  const [schedules, setSchedules] = useState<AccessSchedule[]>(scheduleService.getSchedules());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<AccessSchedule | null>(null);

  // Form State for creating schedule
  const devices = networkService.getDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [ruleName, setRuleName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg-Sex
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [ruleAction, setRuleAction] = useState<'block' | 'pause'>('block');

  const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleCreate = () => {
    if (!ruleName.trim() || !selectedDeviceId) return;
    const dev = devices.find(d => d.id === selectedDeviceId);
    const devName = dev?.customName || dev?.originalHostname || 'Dispositivo';

    scheduleService.createSchedule({
      deviceId: selectedDeviceId,
      deviceName: devName,
      name: ruleName.trim(),
      days: selectedDays,
      startTime,
      endTime,
      action: ruleAction,
      isActive: true
    });

    setSchedules(scheduleService.getSchedules());
    setShowCreateModal(false);
    setRuleName('');
  };

  const handleToggleActive = (id: string) => {
    scheduleService.toggleSchedule(id);
    setSchedules(scheduleService.getSchedules());
  };

  const handleDeleteConfirm = () => {
    if (!scheduleToDelete) return;
    scheduleService.deleteSchedule(scheduleToDelete.id);
    setScheduleToDelete(null);
    setSchedules(scheduleService.getSchedules());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-brand-400" />
            Agendamentos & Controle Parental
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Programação de horários para corte automático de internet, descanso e regras de estudo.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Regra de Horário</span>
        </button>
      </div>

      {/* Capability notice if scheduling is not supported */}
      {!capabilities.scheduling && (
        <CapabilityNotice
          featureName="Agendamento Automático no Roteador"
          reason="O adaptador ou roteador conectado atualmente não oferece suporte à aplicação direta de cron no hardware. As regras funcionarão apenas pelo orquestrador local do In-Wifi."
        />
      )}

      {/* Visual Weekly Planner Grid */}
      <div className="p-6 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          Visão Semanal de Cobertura
        </h3>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {daysLabels.map((day, idx) => {
            const activeRulesForDay = schedules.filter(s => s.isActive && s.days.includes(idx));
            return (
              <div
                key={day}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center min-h-[110px]"
              >
                <span className="text-xs font-bold text-slate-300">{day}</span>
                <div className="w-full mt-2 space-y-1">
                  {activeRulesForDay.length === 0 ? (
                    <span className="text-[10px] text-slate-600 block text-center mt-3">Livre</span>
                  ) : (
                    activeRulesForDay.map(r => (
                      <div
                        key={r.id}
                        className={`px-1.5 py-1 rounded text-[9px] font-mono font-medium truncate ${
                          r.action === 'block' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                        title={`${r.deviceName} (${r.startTime} - ${r.endTime})`}
                      >
                        {r.startTime} {r.action === 'block' ? '⛔' : '⏸️'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">
          Regras Configuradas ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-dark-card border border-slate-800 text-slate-500 text-xs">
            Nenhuma regra de horário criada. Clique no botão acima para adicionar a primeira.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((rule) => (
              <div
                key={rule.id}
                className={`p-5 rounded-3xl border transition space-y-4 ${
                  rule.isActive
                    ? 'bg-dark-card border-slate-800 shadow-card-dark'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        rule.action === 'block' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {rule.action === 'block' ? 'Bloquear Acesso' : 'Pausar Conexão'}
                      </span>
                    </div>
                    <p className="text-xs text-brand-400 font-medium mt-1">
                      Aparelho: {rule.deviceName}
                    </p>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      rule.isActive ? 'bg-brand-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        rule.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Days and Time */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-white font-bold">{rule.startTime}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-white font-bold">{rule.endTime}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {daysLabels.map((label, dIdx) => (
                      <span
                        key={label}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                          rule.days.includes(dIdx)
                            ? 'bg-brand-500/30 text-brand-300 font-bold border border-brand-500/40'
                            : 'text-slate-600'
                        }`}
                      >
                        {label.charAt(0)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-slate-500">
                    Status: {rule.isActive ? 'Ativa no orquestrador' : 'Pausada'}
                  </span>
                  <button
                    onClick={() => setScheduleToDelete(rule)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="Excluir regra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 bg-dark-card border border-slate-800 rounded-3xl shadow-card-dark space-y-4">
            <h3 className="text-base font-bold text-white">Criar Regra de Horário</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nome da Regra</label>
                <input
                  type="text"
                  placeholder="Ex: Dormir Crianças, Sem Jogos Noite..."
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Dispositivo Alvo</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.customName || d.originalHostname} ({d.ip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">Dias da Semana</label>
                <div className="flex gap-1.5">
                  {daysLabels.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedDays.includes(idx)
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Hora Início (Bloqueio)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Hora Fim (Liberação)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Ação Durante o Período</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleAction('block')}
                    className={`flex-1 py-2 rounded-xl font-semibold transition ${
                      ruleAction === 'block' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Bloquear Totalmente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleAction('pause')}
                    className={`flex-1 py-2 rounded-xl font-semibold transition ${
                      ruleAction === 'pause' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Pausar Conexão
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-glow-sm"
              >
                Salvar Regra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!scheduleToDelete}
        title="Excluir Regra de Agendamento?"
        description={`Confirma a exclusão permanente da regra "${scheduleToDelete?.name}" vinculada ao aparelho "${scheduleToDelete?.deviceName}"?`}
        confirmLabel="Sim, Excluir Regra"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setScheduleToDelete(null)}
      />
    </div>
  );
};
