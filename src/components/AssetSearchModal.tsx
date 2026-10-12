import React, { useState, useMemo } from 'react';
import { PRESET_ASSETS } from '../data/assetsCatalog';
import type { Asset, AssetCategory, CurrencyCode } from '../types/finance';
import { Search, Plus, Check, Globe, X } from 'lucide-react';

interface AssetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: Asset) => void;
  existingAssetIds: string[];
  baseCurrency: CurrencyCode;
}

export const AssetSearchModal: React.FC<AssetSearchModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
  existingAssetIds,
  baseCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Campos para activo personalizado
  const [customName, setCustomName] = useState('');
  const [customTicker, setCustomTicker] = useState('');
  const [customReturn, setCustomReturn] = useState('7.5');
  const [customAllocation, setCustomAllocation] = useState('10');
  const [customCategory, setCustomCategory] = useState<AssetCategory>('global_equity');
  const [customCurrency, setCustomCurrency] = useState<CurrencyCode>(baseCurrency);
  const [customTags, setCustomTags] = useState('eeuu, boglehead');

  // Filtro de activos locales predefinidos
  const filteredPresets = useMemo(() => {
    if (!searchTerm.trim()) {
      return PRESET_ASSETS;
    }
    const term = searchTerm.toLowerCase();
    return PRESET_ASSETS.filter(asset => {
      return (
        asset.name.toLowerCase().includes(term) ||
        asset.ticker.toLowerCase().includes(term) ||
        (asset.isin && asset.isin.toLowerCase().includes(term)) ||
        asset.tags.some(tag => tag.toLowerCase().includes(term)) ||
        asset.category.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelectPreset = (asset: Asset) => {
    onAddAsset({
      ...asset,
      allocation: asset.allocation > 0 ? asset.allocation : 10,
    });
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const parsedReturn = parseFloat(customReturn) || 7.0;
    const parsedAlloc = parseFloat(customAllocation) || 10;
    const tagsArray = customTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const newAsset: Asset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      ticker: (customTicker.trim() || customName.trim().slice(0, 5)).toUpperCase(),
      category: customCategory,
      expectedReturn: parsedReturn,
      allocation: parsedAlloc,
      currency: customCurrency,
      tags: tagsArray.length > 0 ? tagsArray : ['personalizado'],
      historical10yCagr: parsedReturn,
      description: `Activo añadido manualmente por el usuario.`,
    };

    onAddAsset(newAsset);
    onClose();
  };

  const startCustomFromSearch = () => {
    setCustomName(searchTerm);
    setCustomTicker(searchTerm.slice(0, 5).toUpperCase());
    setShowCustomForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-dark border border-surface-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Cabecera del buscador */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder='Escribe "etf de...", "world", "sp500", "nasdaq", "bonos", "oro"...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido: Lista o Formulario de Activo Manual */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {showCustomForm ? (
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <h4 className="text-sm font-semibold text-slate-100">Registrar activo no catalogado</h4>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Volver al catálogo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-300 block mb-1">Nombre del Activo o Fondo</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Ticker / Símbolo</label>
                  <input
                    type="text"
                    value={customTicker}
                    onChange={e => setCustomTicker(e.target.value)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:border-emerald-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as AssetCategory)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="global_equity">Renta Variable Global</option>
                    <option value="us_equity">Renta Variable EEUU</option>
                    <option value="tech">Tecnología & IA</option>
                    <option value="emerging">Mercados Emergentes</option>
                    <option value="bonds">Renta Fija / Bonos</option>
                    <option value="gold">Oro & Materias Primas</option>
                    <option value="crypto">Criptoactivos</option>
                    <option value="real_estate">Inmobiliario / REITs</option>
                    <option value="cash">Efectivo / Monetario</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Divisa de Cotización</label>
                  <select
                    value={customCurrency}
                    onChange={e => setCustomCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Rentabilidad Media Anual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customReturn}
                    onChange={e => setCustomReturn(e.target.value)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Peso en Cartera (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    value={customAllocation}
                    onChange={e => setCustomAllocation(e.target.value)}
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-slate-300 block mb-1">
                    Etiquetas de Sensibilidad (separadas por comas, ej: eeuu, ia, tech, bonos)
                  </label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={e => setCustomTags(e.target.value)}
                    placeholder="eeuu, ia, tech, boglehead"
                    className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Se utilizarán para simular el impacto en caso de crisis específicas en esos sectores.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  Añadir Activo a la Cartera
                </button>
              </div>
            </form>
          ) : (
            <>
              {filteredPresets.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    No encontramos ningún activo para "{searchTerm}".
                  </p>
                  <button
                    onClick={startCustomFromSearch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir "{searchTerm}" con retorno personalizado
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Sugerencias del catálogo local ({filteredPresets.length})</span>
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Crear activo manual
                    </button>
                  </div>

                  {filteredPresets.map(asset => {
                    const isAlreadyAdded = existingAssetIds.includes(asset.id);
                    return (
                      <div
                        key={asset.id}
                        className="p-3 bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border rounded-lg transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-surface-border">
                              {asset.ticker}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {asset.isin || asset.currency}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              TER: {asset.ter ? `${asset.ter}%` : '0%'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-100 truncate mt-1">
                            {asset.name}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {asset.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.2 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="font-mono text-sm font-semibold text-emerald-400 tabular-numbers">
                            +{asset.expectedReturn}%
                          </span>
                          <span className="text-[11px] text-slate-400">CAGR esperado</span>

                          {isAlreadyAdded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded mt-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              En cartera
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectPreset(asset)}
                              className="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-medium transition-colors mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Añadir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie de búsqueda */}
        <div className="p-3 bg-surface-elevated/40 border-t border-surface-border flex items-center justify-between text-xs text-slate-400 px-4">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Catálogo offline + Fallback abierto en cliente
          </span>
          <span>Pulsa Escape para salir</span>
        </div>
      </div>
    </div>
  );
};
