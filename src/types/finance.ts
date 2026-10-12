export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToEur: number; // Tasa de cambio frente a EUR (1 EUR = X divisa)
  historicalAnnualDrift: number; // Retorno/deriva histórica media anual frente a EUR (%)
}

export type AssetCategory = 
  | 'global_equity' 
  | 'us_equity' 
  | 'emerging' 
  | 'tech' 
  | 'bonds' 
  | 'gold' 
  | 'crypto' 
  | 'real_estate' 
  | 'cash';

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  isin?: string;
  category: AssetCategory;
  expectedReturn: number; // Porcentaje anual esperado (ej: 8.5)
  allocation: number; // Porcentaje de peso en la cartera (0-100)
  currency: CurrencyCode;
  tags: string[]; // ['eeuu', 'ia', 'tech', 'boglehead', 'defensivo', etc.]
  ter?: number; // Coste de gestión anual (TER / OCF)
  description?: string;
  historical10yCagr?: number;
}

export interface SimulationConfig {
  id: string;
  name: string;
  initialDeposit: number;
  monthlyContribution: number;
  timeHorizonYears: number;
  annualInflationRate: number; // Porcentaje (ej: 2.5)
  includeInflation: boolean; // Alternar retorno nominal vs real
  bankInterestRate: number; // Interés de cuenta tradicional o depósito (ej: 0.5 o 1.5)
  currency: CurrencyCode;
  useCustomPortfolio: boolean; // false = porcentaje único, true = cartera desglosada
  singleExpectedReturn: number; // En caso de modo simple
  currencyEvolutionScenario: 'neutral' | 'eur_strengthens' | 'usd_strengthens' | 'high_volatility';
}

export interface StressScenario {
  id: string;
  name: string;
  category: 'historical' | 'thematic';
  description: string;
  durationMonths: number;
  overallDrop: number; // Porcentaje de caída (ej: -45)
  recoveryYears: number;
  // Impacto específico por etiqueta o activo
  tagImpacts: Record<string, number>; // ej: { 'ia': -65, 'tech': -55, 'eeuu': -40, 'bonds': +12 }
}

export interface BankAccount {
  id: string;
  name: string; // ej: 'BBVA Nómina', 'Trade Republic 3.75%', 'MyInvestor'
  type: 'checking' | 'savings' | 'investment_cash' | 'emergency_fund';
  balance: number;
  remunerationRate: number; // % TAE anual
  currency: CurrencyCode;
  purpose?: string;
}

export type CashflowType = 'income' | 'fixed_expense' | 'ant_expense';

export interface CashflowItem {
  id: string;
  name: string; // ej: 'Nómina', 'Alquiler', 'Café diario', 'Suscripción no usada'
  type: CashflowType;
  amount: number; // Cantidad en la moneda seleccionada
  frequency: 'monthly' | 'daily' | 'annual';
  category: string;
  notes?: string;
}

export interface SimulationYearPoint {
  year: number;
  month: number;
  investedCapital: number;
  nominalPortfolioValue: number;
  realPortfolioValue: number; // Ajustado a inflación
  bankValue: number; // En cuenta tradicional
  realBankValue: number; // Banco ajustado a inflación
  totalInterestEarned: number;
  currencyAdjustedValue?: number;
}

export interface SavedPortfolioState {
  version: number;
  activeScenarioId: string;
  config: SimulationConfig;
  assets: Asset[];
  accounts: BankAccount[];
  cashflow: CashflowItem[];
  savedScenarios: { id: string; name: string; date: string; config: SimulationConfig; assets: Asset[] }[];
  isPrivacyMode: boolean;
  theme: 'dark' | 'light';
}
