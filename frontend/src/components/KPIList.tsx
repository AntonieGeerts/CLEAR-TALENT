import React, { useState } from 'react';
import { KPI } from '../types';
import { BarChart2 } from 'lucide-react';

interface KPIListProps {
  kpis: KPI[];
  maxCollapsed?: number;
}

const formatFrequency = (value?: string) => {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  switch (lower) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'annually':
    case 'annual':
      return 'Annually';
    default:
      return value
        .split('_')
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
        .join(' ');
  }
};

export const KPIList: React.FC<KPIListProps> = ({ kpis, maxCollapsed = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleKPIs = expanded ? kpis : kpis.slice(0, maxCollapsed);

  return (
    <div className="space-y-3">
      {visibleKPIs.map((kpi, index) => {
        const frequency = formatFrequency(kpi.frequency);
        const targetDisplay = kpi.target
          ? `${kpi.target}${kpi.unit ? ` ${kpi.unit}` : ''}`
          : kpi.unit;

        return (
          <div
            key={`${kpi.name}-${index}`}
            className="border border-gray-200 bg-white rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <BarChart2 size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{kpi.name}</p>
                  {kpi.description && (
                    <p className="text-xs text-gray-600 mt-1">{kpi.description}</p>
                  )}
                </div>
              </div>
              {targetDisplay && (
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Target: {targetDisplay}
                </span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-gray-500 flex flex-wrap gap-4">
              {frequency && <span>Cadence: {frequency}</span>}
              {kpi.unit && !kpi.target && <span>Unit: {kpi.unit}</span>}
            </div>
          </div>
        );
      })}

      {kpis.length > maxCollapsed && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {expanded ? 'Show fewer KPIs' : `View all KPIs (${kpis.length})`}
        </button>
      )}
    </div>
  );
};
