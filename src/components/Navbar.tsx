import React from 'react';
import type { CurrencyCode } from '../types/finance';
import { CURRENCIES } from '../data/assetsCatalog';
import { 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  Wallet, 
  ArrowRightLeft, 
  Scale, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon
} from 'lucide-react';

export type NavigationTab = 
  | 'calculator' 
  | 'treemap' 
  | 'currency' 
  | 'stress' 
  | 'personal' 
  | 'rebalance';

interface NavbarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currency,
  onSelectCurrency,
  isPrivacyMode,
  onTogglePrivacy,
  theme,
  onToggleTheme,
}) => {
  const tabs = [
    { id: 'calculator' as const, label: 'Interés Compuesto', icon: TrendingUp },
    { id: 'treemap' as const, label: 'Treemap Cartera', icon: Layers },
    { id: 'currency' as const, label: 'Riesgo Divisa', icon: ArrowRightLeft },
    { id: 'stress' as const, label: 'Crisis & Shocks', icon: ShieldAlert },
    { id: 'personal' as const, label: 'Finanzas & Cashflow', icon: Wallet },
    { id: 'rebalance' as const, label: 'Rebalanceo & Escenarios', icon: Scale },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-canvas-dark/90 dark:bg-canvas-dark/90 light:bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo y título limpio */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              IF
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 block font-sans">
                Inversión Fácil
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                Plataforma de Simulación
              </span>
            </div>
          </div>

          {/* Navegación de pestañas (Escritorio) */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-elevated/70 p-1 rounded-xl border border-surface-border">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 shadow-sm font-semibold border border-surface-border'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controles de Utilidad (Moneda, Privacidad, Modo Oscuro, GitHub) */}
          <div className="flex items-center gap-2">
            
            {/* Selector de Moneda */}
            <select
              value={currency}
              onChange={e => onSelectCurrency(e.target.value as CurrencyCode)}
              className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {Object.keys(CURRENCIES).map(currKey => (
                <option key={currKey} value={currKey}>
                  {currKey} ({CURRENCIES[currKey as CurrencyCode].symbol})
                </option>
              ))}
            </select>

            {/* Toggle Modo Privacidad (Antiespía) */}
            <button
              onClick={onTogglePrivacy}
              title={`Modo Privacidad (Shift + H) ${isPrivacyMode ? 'Activado' : 'Desactivado'}`}
              className={`p-1.5 rounded-lg border transition-colors ${
                isPrivacyMode
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
              }`}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Toggle Modo Claro / Oscuro */}
            <button
              onClick={onToggleTheme}
              title="Alternar Modo Claro / Oscuro"
              className="p-1.5 rounded-lg bg-surface-elevated border border-surface-border text-slate-400 hover:text-slate-200 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Enlace GitHub con icono SVG directo */}
            <a
              href="https://github.com/gperal-dev/inversion"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-surface-elevated border border-surface-border text-slate-400 hover:text-slate-100 transition-colors hidden sm:flex items-center justify-center"
              title="Ver repositorio en GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navegación móvil (scroll horizontal) */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-surface-border no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-emerald-400 font-semibold border border-surface-border'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
