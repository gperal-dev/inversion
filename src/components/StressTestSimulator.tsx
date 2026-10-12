import React, { useState } from 'react';
import type { Asset, CurrencyCode } from '../types/finance';
import { STRESS_SCENARIOS } from '../data/assetsCatalog';
import { evaluateStressScenarioImpact, formatMoney } from '../utils/calculator';
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface StressTestSimulatorProps {
  assets: Asset[];
  portfolioValue: number;
  currency: CurrencyCode;
  isPrivacyMode: boolean;
}

export const StressTestSimulator: React.FC<StressTestSimulatorProps> = ({
  assets,
  portfolioValue,
  currency,
  isPrivacyMode,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('crisis-2008');

  const selectedScenario = STRESS_SCENARIOS.find(s => s.id === selectedScenarioId) || STRESS_SCENARIOS[0];

  // Evaluar impacto del escenario seleccionado
  const evaluation = evaluateStressScenarioImpact(assets, selectedScenario, portfolioValue);

  return (
    <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-6 text-slate-100">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Simulador de Estrés, Crisis Históricas & Shocks Sectoriales
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comprueba la resistencia de tu cartera ante grandes recesiones o caídas específicas de sectores (IA, tecnológicas, EEUU).
          </p>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-surface-elevated border border-surface-border font-mono text-slate-300 self-start sm:self-auto">
          Cartera simulada: {formatMoney(portfolioValue, currency, isPrivacyMode)}
        </span>
      </div>

      {/* Selector de Escenarios */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Selecciona un escenario de estrés o crisis:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STRESS_SCENARIOS.map(sc => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-950/20 border-rose-500/80 text-slate-100 ring-1 ring-rose-500/30'
                    : 'bg-surface-elevated/60 border-surface-border text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {sc.name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      sc.overallDrop < 0 ? 'bg-rose-900/40 text-rose-300' : 'bg-emerald-900/40 text-emerald-300'
                    }`}>
                      {sc.overallDrop < 0 ? `${sc.overallDrop}%` : `+${sc.overallDrop}%`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {sc.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sc.recoveryYears > 0 ? `${sc.recoveryYears}a recuperación` : 'Ininterrumpido'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta de Resultados del Impacto en Tu Cartera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Impacto Ponderado en Tu Cartera</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-numbers ${
              evaluation.overallLossPercent <= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {evaluation.overallLossPercent > 0 ? `+${evaluation.overallLossPercent}%` : `${evaluation.overallLossPercent}%`}
            </span>
            <span className="text-xs text-slate-400">drawdown</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Calculado en base a las etiquetas específicas (#ia, #eeuu, #tech, #bonos) de tus activos reales.
          </p>
        </div>

        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Pérdida en Capital (€)</span>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-numbers">
            {formatMoney(evaluation.euroLoss, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Caída máxima sobre el capital total acumulado.
          </p>
        </div>

        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Valor en el Fondo del Suelo</span>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-numbers">
            {formatMoney(evaluation.finalValue, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Punto más bajo antes de comenzar la fase de recuperación histórica.
          </p>
        </div>
      </div>

      {/* Desglose detallado por Activo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Comportamiento individual de cada activo en este escenario:</span>
          <span className="text-slate-400 font-mono text-[11px]">Ordenado por impacto</span>
        </div>

        <div className="overflow-x-auto border border-surface-border rounded-lg bg-surface-elevated/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3 font-medium">Activo</th>
                <th className="py-2.5 px-3 font-medium text-right">Antes</th>
                <th className="py-2.5 px-3 font-medium text-right">Impacto</th>
                <th className="py-2.5 px-3 font-medium text-right">En el Suelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {evaluation.assetBreakdown.map(item => (
                <tr key={item.id} className="hover:bg-surface-elevated/60 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-200">{item.ticker}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs font-sans">{item.name}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300 tabular-numbers">
                    {formatMoney(item.valueBefore, currency, isPrivacyMode)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold tabular-numbers ${
                    item.specificDrop <= 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {item.specificDrop > 0 ? `+${item.specificDrop}%` : `${item.specificDrop}%`}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200 tabular-numbers">
                    {formatMoney(item.valueAfter, currency, isPrivacyMode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota de gestión emocional del inversor */}
      <div className="p-4 rounded-lg bg-surface-elevated/30 border border-surface-border text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Lección de las crisis pasadas:</strong> Si continúas haciendo tus aportaciones periódicas durante las caídas (comprando activos a precios de descuento), la velocidad de recuperación real de tu patrimonio es sustancialmente mayor que la recuperación del índice en solitario.
        </p>
      </div>
    </div>
  );
};
