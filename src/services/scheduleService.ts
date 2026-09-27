import { AccessSchedule } from '../types';

const SCHEDULES_STORAGE_KEY = 'inwifi_access_schedules';

class ScheduleService {
  private schedules: AccessSchedule[] = [];
  private listeners: Array<(schedules: AccessSchedule[]) => void> = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (stored) {
        this.schedules = JSON.parse(stored);
      } else {
        this.schedules = [];
        this.save();
      }
    } catch {
      this.schedules = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(this.schedules));
    } catch {
      // ignore
    }
    this.notify();
  }

  getSchedules(): AccessSchedule[] {
    return [...this.schedules];
  }

  getSchedulesByDevice(deviceId: string): AccessSchedule[] {
    return this.schedules.filter(s => s.deviceId === deviceId);
  }

  createSchedule(schedule: Omit<AccessSchedule, 'id' | 'createdDate'>): AccessSchedule {
    const newSchedule: AccessSchedule = {
      ...schedule,
      id: `sch_${Date.now()}`,
      createdDate: new Date().toISOString()
    };
    this.schedules.push(newSchedule);
    this.save();
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<AccessSchedule>): boolean {
    const idx = this.schedules.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.schedules[idx] = { ...this.schedules[idx], ...updates };
    this.save();
    return true;
  }

  deleteSchedule(id: string): boolean {
    const prevLen = this.schedules.length;
    this.schedules = this.schedules.filter(s => s.id !== id);
    if (this.schedules.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  toggleSchedule(id: string): boolean {
    const item = this.schedules.find(s => s.id === id);
    if (!item) return false;
    item.isActive = !item.isActive;
    this.save();
    return true;
  }

  subscribe(callback: (schedules: AccessSchedule[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb([...this.schedules]);
      } catch (err) {
        console.error(err);
      }
    });
  }
}

export const scheduleService = new ScheduleService();
