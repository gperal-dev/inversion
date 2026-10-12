import React, { useState } from 'react';
import type { BankAccount, CashflowItem, CurrencyCode } from '../types/finance';
import { formatMoney, calculateAntExpenseImpact, calculateFireMetrics } from '../utils/calculator';
import { 
  Wallet, 
  Building2, 
  Plus, 
  Trash2, 
  TrendingUp, 
  PiggyBank, 
  Coffee, 
  Clock
} from 'lucide-react';

interface PersonalFinanceProps {
  accounts: BankAccount[];
  cashflow: CashflowItem[];
  currency: CurrencyCode;
  portfolioValue: number;
  expectedReturn: number;
  isPrivacyMode: boolean;
  onUpdateAccounts: (accounts: BankAccount[]) => void;
  onUpdateCashflow: (cashflow: CashflowItem[]) => void;
  onSetMonthlyInvestment: (amount: number) => void;
}

export const PersonalFinance: React.FC<PersonalFinanceProps> = ({
  accounts,
  cashflow,
  currency,
  portfolioValue,
  expectedReturn,
  isPrivacyMode,
  onUpdateAccounts,
  onUpdateCashflow,
  onSetMonthlyInvestment,
}) => {
  // Estado para crear nueva cuenta
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccRate, setNewAccRate] = useState('0');
  const [newAccType, setNewAccType] = useState<BankAccount['type']>('checking');
  const [showAddAccount, setShowAddAccount] = useState(false);

  // Estado para nuevo movimiento de cashflow
  const [newCfName, setNewCfName] = useState('');
  const [newCfAmount, setNewCfAmount] = useState('');
  const [newCfType, setNewCfType] = useState<CashflowItem['type']>('ant_expense');
  const [newCfFreq, setNewCfFreq] = useState<CashflowItem['frequency']>('monthly');
  const [showAddCashflow, setShowAddCashflow] = useState(false);

  // Cálculos agregados
  const totalBankBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalNetWorth = totalBankBalance + portfolioValue;

  const totalMonthlyIncome = cashflow
    .filter(c => c.type === 'income')
    .reduce((sum, c) => {
      if (c.frequency === 'daily') return sum + c.amount * 30.41;
      if (c.frequency === 'annual') return sum + c.amount / 12;
      return sum + c.amount;
    }, 0);

  const totalFixedExpenses = cashflow
    .filter(c => c.type === 'fixed_expense')
    .reduce((sum, c) => {
      if (c.frequency === 'daily') return sum + c.amount * 30.41;
      if (c.frequency === 'annual') return sum + c.amount / 12;
      return sum + c.amount;
    }, 0);

  const totalAntExpenses = cashflow
    .filter(c => c.type === 'ant_expense')
    .reduce((sum, c) => {
      if (c.frequency === 'daily') return sum + c.amount * 30.41;
      if (c.frequency === 'annual') return sum + c.amount / 12;
      return sum + c.amount;
    }, 0);

  const totalMonthlyExpenses = totalFixedExpenses + totalAntExpenses;
  const netMonthlySurplus = Math.max(0, totalMonthlyIncome - totalMonthlyExpenses);
  const savingsRatePercent = totalMonthlyIncome > 0 ? (netMonthlySurplus / totalMonthlyIncome) * 100 : 0;
  
  // Colchón de emergencia en meses
  const emergencyRunwayMonths = totalMonthlyExpenses > 0 ? totalBankBalance / totalMonthlyExpenses : 0;

  // FIRE metrics
  const fireMetrics = calculateFireMetrics(
    totalMonthlyExpenses * 12,
    totalNetWorth,
    netMonthlySurplus,
    expectedReturn
  );

  // Handlers para cuentas
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const newAcc: BankAccount = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      balance: parseFloat(newAccBalance) || 0,
      remunerationRate: parseFloat(newAccRate) || 0,
      type: newAccType,
      currency,
    };

    onUpdateAccounts([...accounts, newAcc]);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccRate('0');
    setNewAccType('checking');
    setShowAddAccount(false);
  };

  const handleDeleteAccount = (id: string) => {
    onUpdateAccounts(accounts.filter(a => a.id !== id));
  };

  // Handlers para cashflow
  const handleAddCashflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCfName.trim()) return;

    const newCf: CashflowItem = {
      id: `cf-${Date.now()}`,
      name: newCfName.trim(),
      amount: parseFloat(newCfAmount) || 0,
      type: newCfType,
      frequency: newCfFreq,
      category: newCfType === 'income' ? 'Ingreso' : newCfType === 'fixed_expense' ? 'Gasto Fijo' : 'Gasto Hormiga',
    };

    onUpdateCashflow([...cashflow, newCf]);
    setNewCfName('');
    setNewCfAmount('');
    setNewCfFreq('monthly');
    setShowAddCashflow(false);
  };

  const handleDeleteCashflow = (id: string) => {
    onUpdateCashflow(cashflow.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Tarjetas de Resumen Global de Patrimonio y Cashflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Patrimonio Total Líquido</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2 tabular-numbers">
            {formatMoney(totalNetWorth, currency, isPrivacyMode)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Cuentas ({formatMoney(totalBankBalance, currency, isPrivacyMode)}) + Inversión ({formatMoney(portfolioValue, currency, isPrivacyMode)})
          </span>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Capacidad de Ahorro / Mes</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 tabular-numbers">
            {formatMoney(netMonthlySurplus, currency, isPrivacyMode)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>Tasa de ahorro: {savingsRatePercent.toFixed(1)}%</span>
            <button
              onClick={() => onSetMonthlyInvestment(Math.round(netMonthlySurplus))}
              className="text-emerald-400 hover:underline font-mono text-[10px]"
            >
              Usar en simulación
            </button>
          </div>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Colchón de Seguridad</span>
            <PiggyBank className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-2 tabular-numbers">
            {emergencyRunwayMonths.toFixed(1)} meses
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {emergencyRunwayMonths >= 6 ? 'Excelente (6+ meses cubiertos)' : emergencyRunwayMonths >= 3 ? 'Aceptable (3-6 meses)' : 'Bajo (<3 meses recomendados)'}
          </span>
        </div>

        <div className="p-4 bg-surface-dark border border-surface-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Objetivo Libertad (FIRE)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2 tabular-numbers">
            {fireMetrics.isFireReached ? 'Alcanzado' : `${fireMetrics.yearsToFire} años`}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Meta 4%: {formatMoney(fireMetrics.fireNumber, currency, isPrivacyMode)} ({fireMetrics.currentCoveragePercent}%)
          </span>
        </div>
      </div>

      {/* 2. Cuentas Bancarias Personalizadas */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Cuentas Bancarias & Ubicación de tu Dinero
            </h3>
          </div>
          <button
            onClick={() => setShowAddAccount(!showAddAccount)}
            className="flex items-center gap-1.5 text-xs bg-surface-elevated hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-surface-border transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir Cuenta
          </button>
        </div>

        {showAddAccount && (
          <form onSubmit={handleAddAccount} className="p-4 bg-surface-elevated rounded-lg border border-surface-border space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nueva Cuenta</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Nombre de la Cuenta (Banco o Propósito)</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Nómina BBVA, Depósito MyInvestor..."
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Saldo Actual</label>
                <input
                  type="number"
                  required
                  placeholder="2500"
                  value={newAccBalance}
                  onChange={e => setNewAccBalance(e.target.value)}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Interés Remunerado (%)</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="3.5"
                  value={newAccRate}
                  onChange={e => setNewAccRate(e.target.value)}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] text-slate-400 block mb-1">Tipo de Cuenta</label>
                <select
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value as BankAccount['type'])}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="checking">Cuenta Corriente (Nómina / Gastos)</option>
                  <option value="savings">Cuenta Remunerada / Ahorro</option>
                  <option value="emergency_fund">Fondo de Emergencia</option>
                  <option value="investment_cash">Efectivo en Broker de Inversión</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Guardar Cuenta
              </button>
            </div>
          </form>
        )}

        {/* Listado de cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {accounts.map(account => (
            <div
              key={account.id}
              className="p-4 bg-surface-elevated/70 border border-surface-border rounded-lg relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {account.name}
                  </span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-2 tabular-numbers">
                  {formatMoney(account.balance, account.currency, isPrivacyMode)}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-white/5">
                <span>{account.remunerationRate > 0 ? `${account.remunerationRate}% TAE` : '0% TAE'}</span>
                {account.remunerationRate > 0 && (
                  <span className="text-emerald-400">
                    +{formatMoney((account.balance * account.remunerationRate) / 100, account.currency, isPrivacyMode)}/año
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Desglose de Gastos Hormiga & Su Coste Futuro Millonario */}
      <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                El Coste Futuro de tus Gastos Hormiga
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mira cuánto tendrías dentro de 10, 20 o 30 años si invirtieses ese pequeño gasto recurrente al {expectedReturn}% anual.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCashflow(!showAddCashflow)}
            className="flex items-center gap-1.5 text-xs bg-surface-elevated hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-surface-border transition-colors font-medium self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Gasto o Ingreso
          </button>
        </div>

        {showAddCashflow && (
          <form onSubmit={handleAddCashflow} className="p-4 bg-surface-elevated rounded-lg border border-surface-border space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nuevo Concepto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Café diario, Suscripción X, Alquiler..."
                  value={newCfName}
                  onChange={e => setNewCfName(e.target.value)}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Importe</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="3.20"
                  value={newCfAmount}
                  onChange={e => setNewCfAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tipo</label>
                <select
                  value={newCfType}
                  onChange={e => setNewCfType(e.target.value as CashflowItem['type'])}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ant_expense">Gasto Hormiga (Prescindible)</option>
                  <option value="fixed_expense">Gasto Fijo Esencial</option>
                  <option value="income">Ingreso / Nómina</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] text-slate-400 block mb-1">Frecuencia</label>
                <select
                  value={newCfFreq}
                  onChange={e => setNewCfFreq(e.target.value as CashflowItem['frequency'])}
                  className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="monthly">Mensual</option>
                  <option value="daily">Diaria (ej. café)</option>
                  <option value="annual">Anual (ej. seguro)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCashflow(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Añadir al Flujo
              </button>
            </div>
          </form>
        )}

        {/* Tabla de gastos hormiga y su coste compuesto */}
        <div className="overflow-x-auto border border-surface-border rounded-lg bg-surface-elevated/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3 font-medium">Gasto Hormiga</th>
                <th className="py-2.5 px-3 font-medium text-right">Al Mes</th>
                <th className="py-2.5 px-3 font-medium text-right">Al Año</th>
                <th className="py-2.5 px-3 font-medium text-right text-emerald-400">Si lo inviertes a 10 años</th>
                <th className="py-2.5 px-3 font-medium text-right text-emerald-400">Si lo inviertes a 25 años</th>
                <th className="py-2.5 px-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {cashflow
                .filter(c => c.type === 'ant_expense')
                .map(item => {
                  const impact = calculateAntExpenseImpact(item, expectedReturn);
                  return (
                    <tr key={item.id} className="hover:bg-surface-elevated/60 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-medium text-slate-200">{item.name}</span>
                        {item.notes && <span className="block text-[11px] text-slate-400">{item.notes}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-300 tabular-numbers">
                        -{formatMoney(impact.monthlyAmount, currency, isPrivacyMode)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 tabular-numbers">
                        -{formatMoney(impact.annualAmount, currency, isPrivacyMode)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200 font-semibold tabular-numbers">
                        {formatMoney(impact.fv10Years, currency, isPrivacyMode)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold tabular-numbers">
                        {formatMoney(impact.fv20Years, currency, isPrivacyMode)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteCashflow(item.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-surface-elevated/40 rounded-lg border border-surface-border flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">Total fuga mensual en gastos hormiga:</span>
          <span className="text-rose-400 font-bold text-sm">
            -{formatMoney(totalAntExpenses, currency, isPrivacyMode)}/mes
          </span>
        </div>
      </div>
    </div>
  );
};
