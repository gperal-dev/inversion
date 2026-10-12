import React, { useState } from 'react';
import type { Asset, CurrencyCode } from '../types/finance';
import { CURRENCIES } from '../data/assetsCatalog';
import { formatMoney } from '../utils/calculator';
import { ArrowRightLeft, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface CurrencyRiskSimulatorProps {
  assets: Asset[];
  portfolioValue: number;
  baseCurrency: CurrencyCode;
  isPrivacyMode: boolean;
}

export const CurrencyRiskSimulator: React.FC<CurrencyRiskSimulatorProps> = ({
  assets,
  portfolioValue,
  baseCurrency,
  isPrivacyMode,
}) => {
  const [activeScenario, setActiveScenario] = useState<'neutral' | 'eur_strengthens' | 'usd_strengthens' | 'high_volatility'>('neutral');

  const activeAssets = assets.filter(a => a.allocation > 0);
  const totalAllocation = activeAssets.reduce((sum, a) => sum + a.allocation, 0) || 1;

  // Calcular exposición por divisa
  const currencyExposure = activeAssets.reduce((acc, asset) => {
    const assetCurrency = asset.currency;
    const share = (asset.allocation / totalAllocation);
    acc[assetCurrency] = (acc[assetCurrency] || 0) + share * 100;
    return acc;
  }, {} as Record<CurrencyCode, number>);

  const foreignExposurePercent = Object.entries(currencyExposure)
    .filter(([curr]) => curr !== baseCurrency)
    .reduce((sum, [, val]) => sum + val, 0);

  // Calcular impacto del escenario seleccionado en el patrimonio
  const scenarioDelta = activeScenario === 'eur_strengthens' 
    ? -12 
    : activeScenario === 'usd_strengthens' 
    ? 14 
    : activeScenario === 'high_volatility' 
    ? -6 
    : 0;

  const euroImpactOnForeignAssets = (portfolioValue * (foreignExposurePercent / 100)) * (scenarioDelta / 100);

  return (
    <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-6 text-slate-100">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Riesgo Divisa & Exposición Internacional
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comprende cómo las variaciones del tipo de cambio afectan a tus activos cotizados en dólares ($) u otras monedas.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-elevated px-3 py-1.5 rounded-lg border border-surface-border font-mono text-xs">
          <span className="text-slate-400">Tu divisa base:</span>
          <span className="font-semibold text-emerald-400">{CURRENCIES[baseCurrency].name} ({CURRENCIES[baseCurrency].symbol})</span>
        </div>
      </div>

      {/* Métricas de exposición */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Exposición a Divisa Extranjera</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-numbers">
              {foreignExposurePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">sin cobertura</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Porcentaje de tu cartera sujeto a oscilaciones de cambio directo frente al euro.
          </p>
        </div>

        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Patrimonio Expuesto a Divisa</span>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-numbers">
            {formatMoney(portfolioValue * (foreignExposurePercent / 100), baseCurrency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Capital en activos no denominados en tu divisa base.
          </p>
        </div>

        <div className="p-4 bg-surface-elevated/70 rounded-lg border border-surface-border">
          <span className="text-xs text-slate-400 block mb-1">Impacto en el Escenario Activo</span>
          <div className={`text-2xl font-bold font-mono tabular-numbers flex items-center gap-1.5 ${
            euroImpactOnForeignAssets >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {euroImpactOnForeignAssets >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {formatMoney(euroImpactOnForeignAssets, baseCurrency, isPrivacyMode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Variación patrimonial neta debida exclusivamente a la divisa.
          </p>
        </div>
      </div>

      {/* Selector de escenarios de tipo de cambio */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Simular escenarios de tipo de cambio (EUR vs USD y otras divisas):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveScenario('neutral')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeScenario === 'neutral'
                ? 'bg-emerald-950/30 border-emerald-500 text-slate-100'
                : 'bg-surface-elevated/60 border-surface-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-medium text-xs text-slate-200">1. Escenario Neutro</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Tipo de cambio estable en su media histórica secular.
            </p>
          </button>

          <button
            onClick={() => setActiveScenario('eur_strengthens')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeScenario === 'eur_strengthens'
                ? 'bg-rose-950/30 border-rose-500 text-slate-100'
                : 'bg-surface-elevated/60 border-surface-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-medium text-xs text-rose-300">2. Euro Fuerte (+12%)</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              El EUR sube. Resta rentabilidad a tus activos en USD al repatriar a euros.
            </p>
          </button>

          <button
            onClick={() => setActiveScenario('usd_strengthens')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeScenario === 'usd_strengthens'
                ? 'bg-emerald-950/30 border-emerald-500 text-slate-100'
                : 'bg-surface-elevated/60 border-surface-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-medium text-xs text-emerald-300">3. Dólar Fuerte (+14%)</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              El USD se revaloriza. Suma ganancias extra a tu patrimonio en euros.
            </p>
          </button>

          <button
            onClick={() => setActiveScenario('high_volatility')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeScenario === 'high_volatility'
                ? 'bg-amber-950/30 border-amber-500 text-slate-100'
                : 'bg-surface-elevated/60 border-surface-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-medium text-xs text-amber-300">4. Choque Volátil</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Incertidumbre cambiaria con fricción de cobertura del -6%.
            </p>
          </button>
        </div>
      </div>

      {/* Desglose de activos por divisa */}
      <div className="p-4 bg-surface-elevated/40 rounded-lg border border-surface-border space-y-2">
        <h4 className="text-xs font-semibold text-slate-300">
          Distribución de divisas en tu cartera actual:
        </h4>
        <div className="space-y-1.5">
          {Object.entries(currencyExposure).map(([curr, pct]) => {
            const isBase = curr === baseCurrency;
            return (
              <div key={curr} className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {curr} ({CURRENCIES[curr as CurrencyCode]?.name || curr})
                  {isBase && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-sans">Divisa local</span>}
                </span>
                <span className="text-slate-100 tabular-numbers font-semibold">
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consejo financiero anti-IA */}
      <div className="p-4 rounded-lg bg-surface-elevated/30 border border-surface-border text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">¿Vale la pena contratar fondos con cobertura de divisa (EUR Hedged)?</strong> En renta variable a largo plazo (más de 10 años), los estudios históricos muestran que el coste anual de la cobertura (1-2% anual) suele superar la fluctuación cambiaria. Sin embargo, en renta fija o para horizontes cortos, la cobertura en euros es muy recomendable para evitar volatilidad inesperada.
        </p>
      </div>
    </div>
  );
};
