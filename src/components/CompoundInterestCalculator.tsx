import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Asset, CurrencyCode, SimulationConfig } from '../types/finance';
import { generateProjectionTimeline, calculateWeightedReturn, formatMoney, calculateCapitalGainsTax } from '../utils/calculator';
import { 
  Landmark, 
  Coins, 
  Plus, 
  ToggleLeft, 
  ToggleRight,
  Percent
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CompoundInterestCalculatorProps {
  config: SimulationConfig;
  assets: Asset[];
  currency: CurrencyCode;
  isPrivacyMode: boolean;
  theme: 'dark' | 'light';
  onUpdateConfig: (newConfig: Partial<SimulationConfig>) => void;
  onOpenAssetSearch: () => void;
  onUpdateAssetAllocation: (assetId: string, allocation: number) => void;
  onRemoveAsset: (assetId: string) => void;
}

export const CompoundInterestCalculator: React.FC<CompoundInterestCalculatorProps> = ({
  config,
  assets,
  currency,
  isPrivacyMode,
  theme,
  onUpdateConfig,
  onOpenAssetSearch,
  onUpdateAssetAllocation,
  onRemoveAsset,
}) => {
  // Rentabilidad ponderada si se usa el modo cartera real
  const { weightedReturn, totalAllocation } = useMemo(() => {
    return calculateWeightedReturn(assets);
  }, [assets]);

  const effectiveReturn = config.useCustomPortfolio ? weightedReturn : config.singleExpectedReturn;

  // Generar datos de la simulación
  const timeline = useMemo(() => {
    return generateProjectionTimeline(config, effectiveReturn);
  }, [config, effectiveReturn]);

  const finalPoint = timeline[timeline.length - 1];
  const finalPortfolioValue = config.includeInflation ? finalPoint.realPortfolioValue : finalPoint.nominalPortfolioValue;
  const finalBankValue = config.includeInflation ? finalPoint.realBankValue : finalPoint.bankValue;
  const finalInvestedCapital = finalPoint.investedCapital;
  const netEarnings = Math.max(0, finalPortfolioValue - finalInvestedCapital);
  const bankOpportunityCost = Math.max(0, finalPortfolioValue - finalBankValue);

  // Fiscalidad estimada
  const taxEstimate = calculateCapitalGainsTax(netEarnings);

  // Configuración del Gráfico (Anti-IA: colores mate, contrastes sobrios, cero neón)
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const chartData = {
    labels: timeline.map(p => `Año ${p.year}`),
    datasets: [
      {
        label: config.includeInflation ? 'Cartera Invertida (Real)' : 'Cartera Invertida (Nominal)',
        data: timeline.map(p => config.includeInflation ? p.realPortfolioValue : p.nominalPortfolioValue),
        borderColor: '#10b981', // Esmeralda mate sobrio
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.25,
        borderWidth: 2.2,
        pointRadius: timeline.length > 25 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Aportaciones Acumuladas (Tu Dinero)',
        data: timeline.map(p => p.investedCapital),
        borderColor: '#64748b', // Slate sobrio
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: config.includeInflation ? 'Banco Tradicional (Real con Inflación)' : 'Banco Tradicional (Nominal)',
        data: timeline.map(p => config.includeInflation ? p.realBankValue : p.bankValue),
        borderColor: '#e11d48', // Terracota / carmín sobrio
        backgroundColor: isDark ? 'rgba(225, 29, 72, 0.05)' : 'rgba(225, 29, 72, 0.04)',
        fill: false,
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 12 },
          boxWidth: 14,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#14171f' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#242a3b' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.dataset.label}: ${formatMoney(val, currency, isPrivacyMode)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 11 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value: any) => formatMoney(value, currency, isPrivacyMode),
        },
      },
    },
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Aportaciones Totales</span>
          <div className="text-2xl font-bold font-mono text-slate-200 tabular-numbers">
            {formatMoney(finalInvestedCapital, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Depósito inicial + aportaciones mes a mes.
          </p>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Interés Compuesto Generado</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-numbers">
            +{formatMoney(netEarnings, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ganancia generada por tu dinero trabajando.
          </p>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl ring-1 ring-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Patrimonio Futuro Final</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {config.timeHorizonYears} años
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1 tabular-numbers">
            {formatMoney(finalPortfolioValue, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {config.includeInflation ? 'Ajustado al poder adquisitivo real de hoy.' : 'Valor monetario nominal futuro.'}
          </p>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Coste vs Dejarlo en Banco</span>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-numbers">
            +{formatMoney(bankOpportunityCost, currency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Lo que habrías dejado de ganar dejándolo en el banco.
          </p>
        </div>
      </div>

      {/* 2. Selector de Modo: Estimación Rápida vs Cartera Real */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Parámetros de Simulación de Inversión
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ajusta las variables con entrada directa o sliders de precisión.
              </p>
            </div>
          </div>

          {/* Toggle de Modo */}
          <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-lg border border-surface-border text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => onUpdateConfig({ useCustomPortfolio: false })}
              className={`px-3 py-1.5 rounded transition-colors ${
                !config.useCustomPortfolio
                  ? 'bg-slate-900 text-emerald-400 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estimación Simple
            </button>
            <button
              onClick={() => onUpdateConfig({ useCustomPortfolio: true })}
              className={`px-3 py-1.5 rounded transition-colors ${
                config.useCustomPortfolio
                  ? 'bg-slate-900 text-emerald-400 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cartera Real por Activos
            </button>
          </div>
        </div>

        {/* Panel de Inputs y Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capital Inicial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Capital Inicial</span>
              <span className="font-mono font-semibold text-slate-100 tabular-numbers">
                {formatMoney(config.initialDeposit, currency, isPrivacyMode)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="500"
              value={config.initialDeposit}
              onChange={e => onUpdateConfig({ initialDeposit: parseFloat(e.target.value) || 0 })}
              className="w-full"
            />
            <input
              type="number"
              value={config.initialDeposit}
              onChange={e => onUpdateConfig({ initialDeposit: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Aportación Mensual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Aportación Mensual</span>
              <span className="font-mono font-semibold text-emerald-400 tabular-numbers">
                {formatMoney(config.monthlyContribution, currency, isPrivacyMode)}/mes
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="25"
              value={config.monthlyContribution}
              onChange={e => onUpdateConfig({ monthlyContribution: parseFloat(e.target.value) || 0 })}
              className="w-full"
            />
            <input
              type="number"
              value={config.monthlyContribution}
              onChange={e => onUpdateConfig({ monthlyContribution: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Horizonte Temporal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Horizonte Temporal</span>
              <span className="font-mono font-semibold text-slate-100 tabular-numbers">
                {config.timeHorizonYears} años
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={config.timeHorizonYears}
              onChange={e => onUpdateConfig({ timeHorizonYears: parseInt(e.target.value) || 1 })}
              className="w-full"
            />
            <input
              type="number"
              value={config.timeHorizonYears}
              onChange={e => onUpdateConfig({ timeHorizonYears: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Rentabilidad Esperada (Si está en modo simple) */}
          {!config.useCustomPortfolio ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rentabilidad Anual Media</span>
                <span className="font-mono font-semibold text-emerald-400 tabular-numbers">
                  +{config.singleExpectedReturn}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={config.singleExpectedReturn}
                onChange={e => onUpdateConfig({ singleExpectedReturn: parseFloat(e.target.value) || 0 })}
                className="w-full"
              />
              <input
                type="number"
                step="0.1"
                value={config.singleExpectedReturn}
                onChange={e => onUpdateConfig({ singleExpectedReturn: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rentabilidad Ponderada</span>
                <span className="font-mono font-semibold text-emerald-400 tabular-numbers">
                  +{weightedReturn}%
                </span>
              </div>
              <div className="p-2.5 bg-surface-elevated rounded border border-surface-border text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Asignación Cartera:</span>
                  <span className={totalAllocation === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {totalAllocation}%
                  </span>
                </div>
                <button
                  onClick={onOpenAssetSearch}
                  className="mt-1.5 w-full py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-center block transition-colors font-sans text-[11px]"
                >
                  + Buscar y Añadir Activo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggles de Inflación y Tipo Bancario */}
        <div className="pt-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            {/* Toggle de Inflación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateConfig({ includeInflation: !config.includeInflation })}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {config.includeInflation ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
              </button>
              <span className="text-slate-300 font-medium">
                Descontar Inflación ({config.annualInflationRate}% anual)
              </span>
            </div>

            {/* Ajuste manual de tasa de inflación */}
            {config.includeInflation && (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">Tasa:</span>
                <input
                  type="number"
                  step="0.1"
                  value={config.annualInflationRate}
                  onChange={e => onUpdateConfig({ annualInflationRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 bg-slate-900 border border-surface-border rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400">%</span>
              </div>
            )}
          </div>

          {/* Tipo de Interés del Banco Comparativo */}
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span>Interés del banco tradicional:</span>
            <input
              type="number"
              step="0.1"
              value={config.bankInterestRate}
              onChange={e => onUpdateConfig({ bankInterestRate: parseFloat(e.target.value) || 0 })}
              className="w-14 bg-slate-900 border border-surface-border rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <span>% TAE</span>
          </div>
        </div>

        {/* Si está en Modo Cartera Real: Lista de Activos con Sliders de Asignación */}
        {config.useCustomPortfolio && (
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Composición de tu Cartera Real ({assets.filter(a => a.allocation > 0).length} activos con peso)
              </span>
              <button
                onClick={onOpenAssetSearch}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir ETF o Fondo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="p-3 bg-surface-elevated/70 border border-surface-border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {asset.ticker}
                      </span>
                      <p className="text-xs text-slate-200 truncate font-medium">
                        {asset.name}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs px-1"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Peso: {asset.allocation}%</span>
                    <span className="text-emerald-400">+{asset.expectedReturn}% CAGR</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={asset.allocation}
                    onChange={e => onUpdateAssetAllocation(asset.id, parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Gráfica Principal de Crecimiento & Comparativa Bancaria */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Evolución Temporal: Interés Compuesto vs Banco Tradicional
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualización a {config.timeHorizonYears} años. La curva superior muestra el efecto bola de nieve.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Inversión ({formatMoney(finalPortfolioValue, currency, isPrivacyMode)})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Banco ({formatMoney(finalBankValue, currency, isPrivacyMode)})
            </span>
          </div>
        </div>

        <div className="h-[380px] w-full pt-2">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 4. Estimación de Impuestos al Rescate */}
      <div className="p-4 bg-surface-dark border border-surface-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <Percent className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200 block">
              Simulador Fiscal al Rescate (Tramos del ahorro en España):
            </span>
            <span>
              Si rescatases todas tus plusvalías de {formatMoney(netEarnings, currency, isPrivacyMode)}, pagarías aprox. {formatMoney(taxEstimate.taxAmount, currency, isPrivacyMode)} en impuestos (tipo efectivo ~{taxEstimate.effectiveTaxRate}%). Tu beneficio limpio final sería {formatMoney(taxEstimate.netProfit, currency, isPrivacyMode)}.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-surface-elevated px-2.5 py-1 rounded text-slate-300 border border-surface-border shrink-0">
          En fondos puedes traspasar sin tributar
        </span>
      </div>
    </div>
  );
};
