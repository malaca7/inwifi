import React from 'react';
import { Smartphone, Laptop, Tv, Cpu, Gamepad2, Router, HelpCircle, Wifi, Cable } from 'lucide-react';
import { DeviceBand, DeviceCategory, DeviceStatus } from '../../types';

interface DeviceIconProps {
  category: DeviceCategory;
  band?: DeviceBand;
  status?: DeviceStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  category,
  band,
  status,
  size = 'md',
  className = ''
}) => {
  const getIcon = () => {
    switch (category) {
      case 'smartphone':
        return <Smartphone className={sizeClasses[size].icon} />;
      case 'computer':
        return <Laptop className={sizeClasses[size].icon} />;
      case 'tv':
        return <Tv className={sizeClasses[size].icon} />;
      case 'gaming':
        return <Gamepad2 className={sizeClasses[size].icon} />;
      case 'iot':
        return <Cpu className={sizeClasses[size].icon} />;
      case 'network':
        return <Router className={sizeClasses[size].icon} />;
      default:
        return <HelpCircle className={sizeClasses[size].icon} />;
    }
  };

  const sizeClasses = {
    sm: { box: 'w-8 h-8 rounded-lg text-xs', icon: 'w-4 h-4', badge: 'w-2 h-2' },
    md: { box: 'w-10 h-10 rounded-xl text-sm', icon: 'w-5 h-5', badge: 'w-2.5 h-2.5' },
    lg: { box: 'w-14 h-14 rounded-2xl text-base', icon: 'w-7 h-7', badge: 'w-3 h-3' },
  };

  const getStatusBorder = () => {
    switch (status) {
      case 'online':
        return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
      case 'blocked':
        return 'border-rose-500/40 bg-rose-950/20 text-rose-400';
      case 'paused':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-400';
      case 'offline':
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-400';
    }
  };

  return (
    <div className="relative inline-block">
      <div className={`flex items-center justify-center border transition-all ${sizeClasses[size].box} ${getStatusBorder()} ${className}`}>
        {getIcon()}
      </div>

      {/* Band indicator badge */}
      {band && (
        <span
          className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-300 flex items-center gap-0.5"
          title={`Conexão: ${band}`}
        >
          {band === 'ethernet' ? <Cable className="w-2 h-2 text-cyan-400" /> : <Wifi className="w-2 h-2 text-blue-400" />}
          {band === 'ethernet' ? 'LAN' : band === '5GHz' ? '5G' : '2.4G'}
        </span>
      )}
    </div>
  );
};

export const DeviceStatusBadge: React.FC<{ status: DeviceStatus; showText?: boolean }> = ({
  status,
  showText = true
}) => {
  const config = {
    online: {
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
      text: 'Conectado'
    },
    offline: {
      color: 'bg-slate-500/10 text-slate-400 border-slate-700/50',
      dot: 'bg-slate-500',
      text: 'Desconectado'
    },
    blocked: {
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
      text: 'Bloqueado'
    },
    paused: {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
      text: 'Pausado'
    }
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showText && <span>{config.text}</span>}
    </span>
  );
};
