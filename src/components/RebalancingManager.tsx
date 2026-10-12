import React, { useState } from 'react';
import type { Asset, CurrencyCode, SimulationConfig } from '../types/finance';
import { calculateRebalancing, formatMoney } from '../utils/calculator';
import { Scale, Download, Upload, Bookmark, Trash2 } from 'lucide-react';

interface RebalancingManagerProps {
  assets: Asset[];
  portfolioValue: number;
  monthlyDeposit: number;
  currency: CurrencyCode;
  isPrivacyMode: boolean;
  savedScenarios: { id: string; name: string; date: string; config: SimulationConfig; assets: Asset[] }[];
  currentConfig?: SimulationConfig;
  onLoadScenario: (scenario: { config: SimulationConfig; assets: Asset[] }) => void;
  onSaveScenario: (name: string) => void;
  onDeleteScenario: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export const RebalancingManager: React.FC<RebalancingManagerProps> = ({
  assets,
  portfolioValue,
  monthlyDeposit,
  currency,
  isPrivacyMode,
  savedScenarios,
  onLoadScenario,
  onSaveScenario,
  onDeleteScenario,
  onExportJson,
  onImportJson,
}) => {
  const [injectionAmount, setInjectionAmount] = useState<number>(monthlyDeposit);
  const [scenarioNameInput, setScenarioNameInput] = useState('');

  const rebalancingPlan = calculateRebalancing(assets, portfolioValue, injectionAmount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioNameInput.trim()) return;
    onSaveScenario(scenarioNameInput.trim());
    setScenarioNameInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Calculadora de Rebalanceo Inteligente */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Rebalanceo Inteligente por Aportación (Sin Ventas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Reequilibra tus porcentajes objetivo inyectando tu próxima aportación al activo que se ha quedado rezagado, evitando pagar impuestos por venta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs self-start sm:self-auto">
            <span className="text-slate-400">Próxima aportación:</span>
            <input
              type="number"
              value={injectionAmount}
              onChange={e => setInjectionAmount(parseFloat(e.target.value) || 0)}
              className="w-24 bg-slate-900 border border-surface-border rounded px-2.5 py-1 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-400">{currency}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rebalancingPlan.map(item => (
            <div
              key={item.assetId}
              className="p-4 bg-surface-elevated/70 border border-surface-border rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {item.ticker}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Objetivo: {item.targetPercent}%
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium truncate mt-1">
                  {item.name}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between font-mono">
                <span className="text-[11px] text-slate-400">Comprar en próxima orden:</span>
                <span className="text-sm font-bold text-emerald-400 tabular-numbers">
                  +{formatMoney(item.recommendedContribution, currency, isPrivacyMode)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Guardar y Comparar Escenarios Múltiples */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Múltiples Simulaciones Guardadas
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {savedScenarios.length} escenarios guardados
          </span>
        </div>

        {/* Formulario guardar escenario actual */}
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Nombre del escenario (ej: Cartera Agresiva 100% RV, Jubilación a los 55...)"
            value={scenarioNameInput}
            onChange={e => setScenarioNameInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
          >
            Guardar Escenario Actual
          </button>
        </form>

        {/* Lista de escenarios */}
        {savedScenarios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {savedScenarios.map(sc => (
              <div
                key={sc.id}
                className="p-3 bg-surface-elevated/70 border border-surface-border rounded-lg flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">
                    {sc.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {sc.config.timeHorizonYears} años • {formatMoney(sc.config.monthlyContribution, sc.config.currency, isPrivacyMode)}/mes • {sc.date}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onLoadScenario({ config: sc.config, assets: sc.assets })}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-surface-border transition-colors"
                  >
                    Cargar
                  </button>
                  <button
                    onClick={() => onDeleteScenario(sc.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Exportación e Importación de Seguridad (JSON & Privacidad) */}
      <div className="p-4 bg-surface-dark border border-surface-border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-semibold text-slate-200 block">
            Copia de Seguridad & Portabilidad Total (JSON)
          </span>
          <span className="text-slate-400">
            Todos tus datos se guardan en tu navegador (`localStorage`). Puedes descargar tu copia local para no perder nada.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-slate-800 text-slate-200 rounded-lg border border-surface-border cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-slate-800 text-slate-200 rounded-lg border border-surface-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Respaldo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
