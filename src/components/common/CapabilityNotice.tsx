import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface CapabilityNoticeProps {
  featureName: string;
  routerName?: string;
  reason?: string;
}

export const CapabilityNotice: React.FC<CapabilityNoticeProps> = ({
  featureName,
  routerName,
  reason = 'Este recurso não é suportado pelo roteador atual ou conector ativo.'
}) => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-amber-300">
          Recurso não suportado ({featureName})
        </h4>
        <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
          {reason}
          {routerName && ` (Roteador: ${routerName})`}
        </p>
      </div>
    </div>
  );
};

export const CapabilityDisabledTooltip: React.FC<{ children: React.ReactNode; isSupported: boolean; message: string }> = ({
  children,
  isSupported,
  message
}) => {
  if (isSupported) return <>{children}</>;

  return (
    <div className="relative group inline-block">
      <div className="opacity-50 cursor-not-allowed pointer-events-none">
        {children}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 text-xs shadow-xl whitespace-nowrap z-50 pointer-events-none">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        <span>{message}</span>
      </div>
    </div>
  );
};
