import React, { useState, useEffect, useCallback } from 'react';
import type { 
  SimulationConfig, 
  Asset, 
  BankAccount, 
  CashflowItem, 
  SavedPortfolioState 
} from './types/finance';
import { 
  PRESET_ASSETS, 
  INITIAL_BANK_ACCOUNTS, 
  INITIAL_CASHFLOW_ITEMS 
} from './data/assetsCatalog';
import { Navbar } from './components/Navbar';
import type { NavigationTab } from './components/Navbar';
import { CompoundInterestCalculator } from './components/CompoundInterestCalculator';
import { Treemap } from './components/Treemap';
import { CurrencyRiskSimulator } from './components/CurrencyRiskSimulator';
import { StressTestSimulator } from './components/StressTestSimulator';
import { PersonalFinance } from './components/PersonalFinance';
import { RebalancingManager } from './components/RebalancingManager';
import { AssetSearchModal } from './components/AssetSearchModal';
import { calculateWeightedReturn, generateProjectionTimeline } from './utils/calculator';

const LOCAL_STORAGE_KEY = 'inversion_facil_state_v1';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'default-config',
  name: 'Simulación Estándar',
  initialDeposit: 10000,
  monthlyContribution: 500,
  timeHorizonYears: 25,
  annualInflationRate: 2.5,
  includeInflation: false,
  bankInterestRate: 1.0,
  currency: 'EUR',
  useCustomPortfolio: true,
  singleExpectedReturn: 8.0,
  currencyEvolutionScenario: 'neutral',
};

export const App: React.FC = () => {
  // Estado principal de la aplicación
  const [activeTab, setActiveTab] = useState<NavigationTab>('calculator');
  const [isAssetSearchOpen, setIsAssetSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // Estados financieros
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [assets, setAssets] = useState<Asset[]>(PRESET_ASSETS);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [cashflow, setCashflow] = useState<CashflowItem[]>(INITIAL_CASHFLOW_ITEMS);
  const [savedScenarios, setSavedScenarios] = useState<SavedPortfolioState['savedScenarios']>([]);

  // 1. Cargar estado inicial desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedPortfolioState = JSON.parse(saved);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.assets) setAssets(parsed.assets);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.cashflow) setCashflow(parsed.cashflow);
        if (parsed.savedScenarios) setSavedScenarios(parsed.savedScenarios);
        if (parsed.theme) setTheme(parsed.theme);
        if (typeof parsed.isPrivacyMode === 'boolean') setIsPrivacyMode(parsed.isPrivacyMode);
      }
    } catch (e) {
      console.warn('No se pudo cargar el estado previo de localStorage:', e);
    }
  }, []);

  // 2. Guardar estado automáticamente en localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedPortfolioState = {
        version: 1,
        activeScenarioId: config.id,
        config,
        assets,
        accounts,
        cashflow,
        savedScenarios,
        isPrivacyMode,
        theme,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }, [config, assets, accounts, cashflow, savedScenarios, isPrivacyMode, theme]);

  // 3. Sincronizar clase dark en el <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // 4. Atajo de teclado Shift + H para activar/desactivar Modo Privacidad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'h') {
        setIsPrivacyMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Valor actual de la cartera para cálculos dependientes
  const { weightedReturn } = calculateWeightedReturn(assets);
  const effectiveReturn = config.useCustomPortfolio ? weightedReturn : config.singleExpectedReturn;
  const timeline = generateProjectionTimeline(config, effectiveReturn);
  const currentTotalPortfolioValue = timeline[timeline.length - 1].nominalPortfolioValue;

  // Handlers
  const handleUpdateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const handleAddAsset = useCallback((newAsset: Asset) => {
    setAssets(prev => {
      const exists = prev.some(a => a.id === newAsset.id);
      if (exists) {
        return prev.map(a => a.id === newAsset.id ? newAsset : a);
      }
      return [...prev, newAsset];
    });
  }, []);

  const handleUpdateAsset = useCallback((updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  }, []);

  const handleUpdateAssetAllocation = useCallback((assetId: string, allocation: number) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, allocation } : a));
  }, []);

  const handleRemoveAsset = useCallback((assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  // Handlers para Escenarios
  const handleSaveScenario = (name: string) => {
    const newScenario = {
      id: `sc-${Date.now()}`,
      name,
      date: new Date().toLocaleDateString('es-ES'),
      config: { ...config },
      assets: [...assets],
    };
    setSavedScenarios(prev => [newScenario, ...prev]);
  };

  const handleLoadScenario = (sc: { config: SimulationConfig; assets: Asset[] }) => {
    setConfig(sc.config);
    setAssets(sc.assets);
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  // Exportar / Importar JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ config, assets, accounts, cashflow, savedScenarios }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `inversion_facil_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.assets) setAssets(parsed.assets);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.cashflow) setCashflow(parsed.cashflow);
        if (parsed.savedScenarios) setSavedScenarios(parsed.savedScenarios);
        alert('Copia de seguridad restaurada correctamente.');
      } catch (err) {
        alert('Error al leer el archivo JSON de copia de seguridad.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      theme === 'dark' ? 'bg-canvas-dark text-slate-100' : 'bg-canvas-light text-slate-900'
    }`}>
      {/* Barra de navegación superior */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currency={config.currency}
        onSelectCurrency={curr => handleUpdateConfig({ currency: curr })}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={() => setIsPrivacyMode(prev => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* Contenido principal según la pestaña activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Pestaña 1: Calculadora de Interés Compuesto */}
        {activeTab === 'calculator' && (
          <CompoundInterestCalculator
            config={config}
            assets={assets}
            currency={config.currency}
            isPrivacyMode={isPrivacyMode}
            theme={theme}
            onUpdateConfig={handleUpdateConfig}
            onOpenAssetSearch={() => setIsAssetSearchOpen(true)}
            onUpdateAssetAllocation={handleUpdateAssetAllocation}
            onRemoveAsset={handleRemoveAsset}
          />
        )}

        {/* Pestaña 2: Treemap Interactivo de Cartera */}
        {activeTab === 'treemap' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Treemap de Asignación de Cartera
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Distribución visual de tu capital en bloques rectangulares proporcionales a su peso. Clic en cualquier bloque para inspeccionar su ficha.
                </p>
              </div>
              <button
                onClick={() => setIsAssetSearchOpen(true)}
                className="self-start sm:self-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                + Añadir Activo a la Cartera
              </button>
            </div>

            <Treemap
              assets={assets}
              portfolioValue={currentTotalPortfolioValue}
              currency={config.currency}
              isPrivacyMode={isPrivacyMode}
              onUpdateAsset={handleUpdateAsset}
              onRemoveAsset={handleRemoveAsset}
            />
          </div>
        )}

        {/* Pestaña 3: Riesgo Divisa */}
        {activeTab === 'currency' && (
          <CurrencyRiskSimulator
            assets={assets}
            portfolioValue={currentTotalPortfolioValue}
            baseCurrency={config.currency}
            isPrivacyMode={isPrivacyMode}
          />
        )}

        {/* Pestaña 4: Crisis y Estrés */}
        {activeTab === 'stress' && (
          <StressTestSimulator
            assets={assets}
            portfolioValue={currentTotalPortfolioValue}
            currency={config.currency}
            isPrivacyMode={isPrivacyMode}
          />
        )}

        {/* Pestaña 5: Finanzas Personales & Cashflow */}
        {activeTab === 'personal' && (
          <PersonalFinance
            accounts={accounts}
            cashflow={cashflow}
            currency={config.currency}
            portfolioValue={currentTotalPortfolioValue}
            expectedReturn={effectiveReturn}
            isPrivacyMode={isPrivacyMode}
            onUpdateAccounts={setAccounts}
            onUpdateCashflow={setCashflow}
            onSetMonthlyInvestment={amount => handleUpdateConfig({ monthlyContribution: amount })}
          />
        )}

        {/* Pestaña 6: Rebalanceo & Escenarios */}
        {activeTab === 'rebalance' && (
          <RebalancingManager
            assets={assets}
            portfolioValue={currentTotalPortfolioValue}
            monthlyDeposit={config.monthlyContribution}
            currency={config.currency}
            isPrivacyMode={isPrivacyMode}
            savedScenarios={savedScenarios}
            currentConfig={config}
            onLoadScenario={handleLoadScenario}
            onSaveScenario={handleSaveScenario}
            onDeleteScenario={handleDeleteScenario}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
          />
        )}
      </main>

      {/* Modal de Búsqueda Predictiva de Activos con Fallback */}
      <AssetSearchModal
        isOpen={isAssetSearchOpen}
        onClose={() => setIsAssetSearchOpen(false)}
        onAddAsset={handleAddAsset}
        existingAssetIds={assets.map(a => a.id)}
        baseCurrency={config.currency}
      />

      {/* Pie de página sobrio y profesional */}
      <footer className="border-t border-surface-border bg-surface-dark/50 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">Inversión Fácil</span>
            <span>•</span>
            <span>Diseño editorial y precisión contable sin artificios de IA.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Datos 100% locales en tu navegador</span>
            <span>•</span>
            <a
              href="https://github.com/gperal-dev/inversion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              GitHub Pages (gperal-dev/inversion)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
