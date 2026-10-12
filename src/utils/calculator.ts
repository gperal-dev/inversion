import type { 
  Asset, 
  CurrencyCode, 
  SimulationConfig, 
  SimulationYearPoint, 
  StressScenario,
  CashflowItem 
} from '../types/finance';
import { CURRENCIES } from '../data/assetsCatalog';

/**
 * Calcula la rentabilidad media ponderada anual de la cartera según los porcentajes asignados.
 */
export function calculateWeightedReturn(assets: Asset[]): { weightedReturn: number; totalAllocation: number } {
  const activeAssets = assets.filter(a => a.allocation > 0);
  const totalAllocation = activeAssets.reduce((sum, a) => sum + a.allocation, 0);

  if (totalAllocation === 0) {
    return { weightedReturn: 0, totalAllocation: 0 };
  }

  // Ponderación relativa al total asignado
  const weightedReturn = activeAssets.reduce((sum, a) => {
    return sum + (a.expectedReturn * (a.allocation / totalAllocation));
  }, 0);

  return { weightedReturn: Number(weightedReturn.toFixed(2)), totalAllocation };
}

/**
 * Genera la proyección temporal mes a mes y consolidada año a año con interés compuesto.
 */
export function generateProjectionTimeline(
  config: SimulationConfig,
  effectiveReturn: number
): SimulationYearPoint[] {
  const {
    initialDeposit,
    monthlyContribution,
    timeHorizonYears,
    annualInflationRate,
    bankInterestRate,
  } = config;

  const totalMonths = Math.max(1, timeHorizonYears * 12);
  const monthlyInvRate = Math.pow(1 + effectiveReturn / 100, 1 / 12) - 1;
  const monthlyBankRate = Math.pow(1 + bankInterestRate / 100, 1 / 12) - 1;
  const monthlyInflationRate = Math.pow(1 + annualInflationRate / 100, 1 / 12) - 1;

  let currentInvested = initialDeposit;
  let currentPortfolioNominal = initialDeposit;
  let currentBankNominal = initialDeposit;
  let cumulativeInflationDeflator = 1.0;

  const points: SimulationYearPoint[] = [
    {
      year: 0,
      month: 0,
      investedCapital: initialDeposit,
      nominalPortfolioValue: initialDeposit,
      realPortfolioValue: initialDeposit,
      bankValue: initialDeposit,
      realBankValue: initialDeposit,
      totalInterestEarned: 0,
    }
  ];

  for (let m = 1; m <= totalMonths; m++) {
    // Interés compuesto mensual + aportación al final del mes
    currentPortfolioNominal = (currentPortfolioNominal * (1 + monthlyInvRate)) + monthlyContribution;
    currentBankNominal = (currentBankNominal * (1 + monthlyBankRate)) + monthlyContribution;
    currentInvested += monthlyContribution;
    cumulativeInflationDeflator *= (1 + monthlyInflationRate);

    // Guardar puntos cada 12 meses (o el último mes)
    if (m % 12 === 0 || m === totalMonths) {
      const year = Math.floor(m / 12);
      const realPortfolio = currentPortfolioNominal / cumulativeInflationDeflator;
      const realBank = currentBankNominal / cumulativeInflationDeflator;

      points.push({
        year,
        month: m,
        investedCapital: Math.round(currentInvested),
        nominalPortfolioValue: Math.round(currentPortfolioNominal),
        realPortfolioValue: Math.round(realPortfolio),
        bankValue: Math.round(currentBankNominal),
        realBankValue: Math.round(realBank),
        totalInterestEarned: Math.round(currentPortfolioNominal - currentInvested),
      });
    }
  }

  return points;
}

/**
 * Calcula el impacto del gasto hormiga proyectado a 5, 10, 20 y 30 años si ese dinero se invirtiese.
 */
export function calculateAntExpenseImpact(
  item: CashflowItem,
  annualReturn: number = 8.0
): {
  monthlyAmount: number;
  annualAmount: number;
  fv5Years: number;
  fv10Years: number;
  fv20Years: number;
  fv30Years: number;
} {
  let monthlyAmount = item.amount;
  if (item.frequency === 'daily') {
    monthlyAmount = item.amount * 30.41;
  } else if (item.frequency === 'annual') {
    monthlyAmount = item.amount / 12;
  }

  const annualAmount = monthlyAmount * 12;
  const r = annualReturn / 100;
  const monthlyR = Math.pow(1 + r, 1 / 12) - 1;

  const calculateFv = (years: number) => {
    const months = years * 12;
    if (monthlyR <= 0) return monthlyAmount * months;
    return monthlyAmount * ((Math.pow(1 + monthlyR, months) - 1) / monthlyR);
  };

  return {
    monthlyAmount: Math.round(monthlyAmount * 100) / 100,
    annualAmount: Math.round(annualAmount * 100) / 100,
    fv5Years: Math.round(calculateFv(5)),
    fv10Years: Math.round(calculateFv(10)),
    fv20Years: Math.round(calculateFv(20)),
    fv30Years: Math.round(calculateFv(30)),
  };
}

/**
 * Métricas de Independencia Financiera (Regla del 4% / FIRE).
 */
export function calculateFireMetrics(
  annualExpenses: number,
  currentNetWorth: number,
  monthlySavings: number,
  expectedReturn: number = 7.5,
  inflationRate: number = 2.5
) {
  // Retorno real neto de inflación
  const realReturn = ((1 + expectedReturn / 100) / (1 + inflationRate / 100)) - 1;
  const fireNumber = annualExpenses * 25; // Regla del 4%
  const currentCoveragePercent = fireNumber > 0 ? (currentNetWorth / fireNumber) * 100 : 0;

  if (currentNetWorth >= fireNumber) {
    return {
      fireNumber: Math.round(fireNumber),
      yearsToFire: 0,
      currentCoveragePercent: 100,
      monthlyPassiveIncome: Math.round((currentNetWorth * 0.04) / 12),
      isFireReached: true,
    };
  }

  // Simular meses hasta alcanzar el número FIRE
  let months = 0;
  let wealth = currentNetWorth;
  const monthlyRealR = Math.pow(1 + realReturn, 1 / 12) - 1;
  const maxSimMonths = 600; // Máximo 50 años

  while (wealth < fireNumber && months < maxSimMonths) {
    wealth = (wealth * (1 + monthlyRealR)) + monthlySavings;
    months++;
  }

  const yearsToFire = months < maxSimMonths ? Number((months / 12).toFixed(1)) : 99;

  return {
    fireNumber: Math.round(fireNumber),
    yearsToFire,
    currentCoveragePercent: Math.min(100, Number(currentCoveragePercent.toFixed(1))),
    monthlyPassiveIncome: Math.round((currentNetWorth * 0.04) / 12),
    isFireReached: false,
  };
}

/**
 * Calculadora de rebalanceo inteligente sin ventas (Smart Cash Infusion).
 */
export function calculateRebalancing(
  assets: Asset[],
  currentTotalPortfolioValue: number,
  nextDeposit: number
) {
  const activeAssets = assets.filter(a => a.allocation > 0);
  const totalWeight = activeAssets.reduce((sum, a) => sum + a.allocation, 0);

  if (totalWeight === 0) return [];

  const newTotalValue = currentTotalPortfolioValue + nextDeposit;

  return activeAssets.map(asset => {
    const targetWeight = asset.allocation / totalWeight;
    const currentAssetValue = (currentTotalPortfolioValue * targetWeight); // Valor actual teórico
    const targetAssetValue = newTotalValue * targetWeight;
    const recommendedDeposit = Math.max(0, targetAssetValue - currentAssetValue);

    return {
      assetId: asset.id,
      name: asset.name,
      ticker: asset.ticker,
      targetPercent: asset.allocation,
      recommendedContribution: Math.round(recommendedDeposit),
    };
  });
}

/**
 * Simulación de Estrés y Crisis de Cartera según etiquetas de activos.
 */
export function evaluateStressScenarioImpact(
  assets: Asset[],
  scenario: StressScenario,
  portfolioValue: number
) {
  const activeAssets = assets.filter(a => a.allocation > 0);
  const totalAllocation = activeAssets.reduce((sum, a) => sum + a.allocation, 0);

  if (totalAllocation === 0) {
    return {
      overallLossPercent: scenario.overallDrop,
      euroLoss: Math.round(portfolioValue * (scenario.overallDrop / 100)),
      finalValue: Math.round(portfolioValue * (1 + scenario.overallDrop / 100)),
      assetBreakdown: [],
    };
  }

  let weightedLossPercent = 0;

  const assetBreakdown = activeAssets.map(asset => {
    const assetShare = asset.allocation / totalAllocation;
    let specificDrop = scenario.overallDrop; // Fallback al drop medio

    // Buscar si alguna de sus etiquetas coincide con los impactos definidos en el escenario
    const matchingTags = asset.tags.filter(tag => tag in scenario.tagImpacts);
    if (matchingTags.length > 0) {
      // Tomamos el impacto más representativo o la media de sus tags
      const sumImpacts = matchingTags.reduce((acc, tag) => acc + scenario.tagImpacts[tag], 0);
      specificDrop = sumImpacts / matchingTags.length;
    }

    weightedLossPercent += specificDrop * assetShare;

    return {
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker,
      specificDrop: Number(specificDrop.toFixed(1)),
      valueBefore: Math.round(portfolioValue * assetShare),
      valueAfter: Math.round(portfolioValue * assetShare * (1 + specificDrop / 100)),
    };
  });

  const euroLoss = Math.round(portfolioValue * (weightedLossPercent / 100));
  const finalValue = Math.round(portfolioValue + euroLoss);

  return {
    overallLossPercent: Number(weightedLossPercent.toFixed(1)),
    euroLoss,
    finalValue,
    assetBreakdown,
  };
}

/**
 * Simulación de riesgo divisa (EUR vs USD u otra moneda del activo).
 */
export function calculateCurrencyScenario(
  assetCurrency: CurrencyCode,
  baseCurrency: CurrencyCode,
  scenario: 'neutral' | 'eur_strengthens' | 'usd_strengthens' | 'high_volatility'
) {
  if (assetCurrency === baseCurrency) {
    return {
      currencyDeltaPercent: 0,
      description: 'El activo cotiza en tu misma divisa. Riesgo divisa directo nulo (solo el indirecto de las empresas multinacionales).',
    };
  }

  let delta = 0;
  let desc = '';

  if (scenario === 'eur_strengthens') {
    delta = -12.0; // El euro sube -> el valor de los activos en USD se reduce un 12% al pasarlo a EUR
    desc = 'El Euro se aprecia fuertemente (+12%). Reduce tus plusvalías al convertir tus inversiones en USD/otras divisas de vuelta a Euros.';
  } else if (scenario === 'usd_strengthens') {
    delta = +14.0; // El dólar sube -> el inversor europeo gana un 14% extra de rentabilidad por divisa
    desc = 'El Dólar se fortalece (+14%). Aumenta tu patrimonio en Euros al revalorizarse la divisa en la que cotizan tus activos extranjeros.';
  } else if (scenario === 'high_volatility') {
    delta = -6.0;
    desc = 'Alta volatilidad en el tipo de cambio con oscilaciones de ±10% y ligero coste de cobertura o conversión.';
  } else {
    delta = CURRENCIES[assetCurrency].historicalAnnualDrift;
    desc = 'Evolución secular normal según medias históricas de tipo de cambio.';
  }

  return {
    currencyDeltaPercent: delta,
    description: desc,
  };
}

/**
 * Cálculo fiscal de plusvalías en España (Tramos del Ahorro).
 */
export function calculateCapitalGainsTax(grossProfit: number) {
  if (grossProfit <= 0) return { taxAmount: 0, netProfit: 0, effectiveTaxRate: 0 };

  let remaining = grossProfit;
  let tax = 0;

  // Tramo 1: hasta 6.000 € al 19%
  const t1 = Math.min(remaining, 6000);
  tax += t1 * 0.19;
  remaining -= t1;

  // Tramo 2: de 6.000 a 50.000 € (44.000 €) al 21%
  if (remaining > 0) {
    const t2 = Math.min(remaining, 44000);
    tax += t2 * 0.21;
    remaining -= t2;
  }

  // Tramo 3: de 50.000 a 200.000 € (150.000 €) al 23%
  if (remaining > 0) {
    const t3 = Math.min(remaining, 150000);
    tax += t3 * 0.23;
    remaining -= t3;
  }

  // Tramo 4: de 200.000 a 300.000 € (100.000 €) al 27%
  if (remaining > 0) {
    const t4 = Math.min(remaining, 100000);
    tax += t4 * 0.27;
    remaining -= t4;
  }

  // Tramo 5: más de 300.000 € al 28%
  if (remaining > 0) {
    tax += remaining * 0.28;
  }

  const effectiveRate = Number(((tax / grossProfit) * 100).toFixed(1));

  return {
    taxAmount: Math.round(tax),
    netProfit: Math.round(grossProfit - tax),
    effectiveTaxRate: effectiveRate,
  };
}

/**
 * Formateador de moneda profesional, limpio y uniforme.
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'EUR',
  isPrivacyMode: boolean = false
): string {
  if (isPrivacyMode) {
    return '•••• ' + CURRENCIES[currency].symbol;
  }

  const symbol = CURRENCIES[currency].symbol;
  const formatted = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `${formatted} ${symbol}`;
}
