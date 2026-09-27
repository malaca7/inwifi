import React, { useState } from 'react';
import { TrafficPoint } from '../../types';
import { ArrowDownCircle, ArrowUpCircle, Users, Clock } from 'lucide-react';

interface NetworkActivityChartProps {
  data: TrafficPoint[];
  period: 'realtime' | 'day' | 'week' | 'month';
  onPeriodChange: (p: 'realtime' | 'day' | 'week' | 'month') => void;
}

export const NetworkActivityChart: React.FC<NetworkActivityChartProps> = ({
  data,
  period,
  onPeriodChange
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Sem dados de tráfego disponíveis no momento.
      </div>
    );
  }

  // Calculate scaling for SVG
  const maxDownload = Math.max(...data.map(d => d.downloadSpeedMbps), 50);
  const maxUpload = Math.max(...data.map(d => d.uploadSpeedMbps), 20);
  const maxSpeed = Math.max(maxDownload, maxUpload) * 1.15; // padding top

  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Build coordinate paths
  const dlPoints = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
    const y = svgHeight - paddingY - (d.downloadSpeedMbps / maxSpeed) * chartHeight;
    return { x, y, val: d.downloadSpeedMbps, point: d };
  });

  const ulPoints = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
    const y = svgHeight - paddingY - (d.uploadSpeedMbps / maxSpeed) * chartHeight;
    return { x, y, val: d.uploadSpeedMbps };
  });

  const dlPathD = dlPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const dlAreaD = `${dlPathD} L ${dlPoints[dlPoints.length - 1].x} ${svgHeight - paddingY} L ${dlPoints[0].x} ${svgHeight - paddingY} Z`;

  const ulPathD = ulPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const currentHover = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="p-5 rounded-3xl bg-dark-card border border-slate-800 shadow-card-dark space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Atividade da Rede em Tempo Real</h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Vazão agregada de download, upload e densidade de dispositivos conectados.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          {(['realtime', 'day', 'week', 'month'] as const).map((p) => {
            const labels = {
              realtime: 'Tempo Real',
              day: '24 Horas',
              week: '7 Dias',
              month: '30 Dias'
            };
            const isSelected = period === p;
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Hover Data Peek */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" />
            <span className="text-slate-300 font-medium">Download</span>
            <span className="font-mono font-bold text-cyan-400">
              {currentHover ? `${currentHover.downloadSpeedMbps} Mbps` : '--'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-slate-300 font-medium">Upload</span>
            <span className="font-mono font-bold text-slate-300">
              {currentHover ? `${currentHover.uploadSpeedMbps} Mbps` : '--'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span>{currentHover ? `${currentHover.activeDevicesCount} aparelhos ativos` : '--'}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{currentHover ? currentHover.timestamp : ''}</span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-60 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00D2FF" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#0066FF" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#3B82F6" />
              <stop offset="100%" stop-color="#00D2FF" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = svgHeight - paddingY - ratio * chartHeight;
            const val = Math.round(ratio * maxSpeed);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}M
                </text>
              </g>
            );
          })}

          {/* Area Fill for Download */}
          <path d={dlAreaD} fill="url(#dlGradient)" />

          {/* Download Path */}
          <path
            d={dlPathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upload Path */}
          <path
            d={ulPathD}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />

          {/* Interactive vertical hover indicator and points */}
          {dlPoints.map((pt, i) => {
            const isHover = hoverIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHover ? 6 : 3}
                  fill={isHover ? '#FFFFFF' : '#00D2FF'}
                  stroke="#0066FF"
                  strokeWidth={isHover ? '3' : '1.5'}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                {/* Invisible larger hover hit area */}
                <rect
                  x={pt.x - chartWidth / (dlPoints.length * 2)}
                  y={0}
                  width={chartWidth / dlPoints.length}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            // Show every 2nd or 3rd label to avoid crowding
            const step = data.length > 15 ? 4 : 2;
            if (i % step !== 0 && i !== data.length - 1) return null;
            const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 10}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {d.timestamp}
              </text>
            );
          })}
        </svg>
      </div>

    </div>
  );
};
