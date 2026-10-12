import React, { useMemo, useState } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import type { Asset, CurrencyCode } from '../types/finance';
import { formatMoney } from '../utils/calculator';
import { Layers, X, Edit3 } from 'lucide-react';

interface TreemapProps {
  assets: Asset[];
  portfolioValue: number;
  currency: CurrencyCode;
  isPrivacyMode: boolean;
  onUpdateAsset?: (asset: Asset) => void;
  onRemoveAsset?: (assetId: string) => void;
}

interface HierarchyNodeData {
  name: string;
  value?: number;
  asset?: Asset;
  children?: HierarchyNodeData[];
}

// Paleta sobria y distinguida para categorías de activos (Anti-IA: sin colores neón estridentes)
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  global_equity: {
    bg: 'bg-emerald-950/40 dark:bg-emerald-950/50',
    border: 'border-emerald-700/50 dark:border-emerald-600/40',
    text: 'text-emerald-300 dark:text-emerald-300',
    label: 'Renta Variable Global',
  },
  us_equity: {
    bg: 'bg-blue-950/40 dark:bg-blue-950/50',
    border: 'border-blue-700/50 dark:border-blue-600/40',
    text: 'text-blue-300 dark:text-blue-300',
    label: 'Renta Variable EEUU',
  },
  tech: {
    bg: 'bg-indigo-950/40 dark:bg-indigo-950/50',
    border: 'border-indigo-700/50 dark:border-indigo-600/40',
    text: 'text-indigo-300 dark:text-indigo-300',
    label: 'Tecnología & IA',
  },
  emerging: {
    bg: 'bg-amber-950/40 dark:bg-amber-950/50',
    border: 'border-amber-700/50 dark:border-amber-600/40',
    text: 'text-amber-300 dark:text-amber-300',
    label: 'Mercados Emergentes',
  },
  bonds: {
    bg: 'bg-cyan-950/40 dark:bg-cyan-950/50',
    border: 'border-cyan-700/50 dark:border-cyan-600/40',
    text: 'text-cyan-300 dark:text-cyan-300',
    label: 'Renta Fija / Bonos',
  },
  gold: {
    bg: 'bg-yellow-950/40 dark:bg-yellow-950/50',
    border: 'border-yellow-700/50 dark:border-yellow-600/40',
    text: 'text-yellow-300 dark:text-yellow-300',
    label: 'Oro & Refugio',
  },
  crypto: {
    bg: 'bg-purple-950/40 dark:bg-purple-950/50',
    border: 'border-purple-700/50 dark:border-purple-600/40',
    text: 'text-purple-300 dark:text-purple-300',
    label: 'Criptoactivos',
  },
  cash: {
    bg: 'bg-slate-800/40 dark:bg-slate-800/50',
    border: 'border-slate-600/50 dark:border-slate-500/40',
    text: 'text-slate-300 dark:text-slate-300',
    label: 'Efectivo / Monetario',
  },
  real_estate: {
    bg: 'bg-stone-900/40 dark:bg-stone-900/50',
    border: 'border-stone-700/50 dark:border-stone-600/40',
    text: 'text-stone-300 dark:text-stone-300',
    label: 'Inmobiliario / REITs',
  },
};

export const Treemap: React.FC<TreemapProps> = ({
  assets,
  portfolioValue,
  currency,
  isPrivacyMode,
  onUpdateAsset,
  onRemoveAsset,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editReturn, setEditReturn] = useState('');
  const [editAllocation, setEditAllocation] = useState('');

  const activeAssets = useMemo(() => assets.filter(a => a.allocation > 0), [assets]);
  const totalAllocation = useMemo(() => activeAssets.reduce((sum, a) => sum + a.allocation, 0), [activeAssets]);

  // Construcción de la jerarquía Squarified con D3
  const layout = useMemo(() => {
    if (activeAssets.length === 0) return [];

    const rootData: HierarchyNodeData = {
      name: 'Portfolio',
      children: activeAssets.map(a => ({
        name: a.name,
        value: a.allocation,
        asset: a,
      })),
    };

    const root = hierarchy(rootData)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Espacio de coordenadas porcentuales 100x100
    const tree = treemap<HierarchyNodeData>()
      .size([100, 100])
      .padding(0.8)
      .tile(treemapSquarify.ratio(1.3));

    tree(root);

    return (root.leaves() as HierarchyRectangularNode<HierarchyNodeData>[]).map(leaf => ({
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
      asset: leaf.data.asset!,
    }));
  }, [activeAssets]);

  const handleSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditReturn(asset.expectedReturn.toString());
    setEditAllocation(asset.allocation.toString());
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedAsset || !onUpdateAsset) return;
    const newReturn = parseFloat(editReturn);
    const newAlloc = parseFloat(editAllocation);
    if (!isNaN(newReturn) && !isNaN(newAlloc)) {
      onUpdateAsset({
        ...selectedAsset,
        expectedReturn: Math.max(0, newReturn),
        allocation: Math.max(0, Math.min(100, newAlloc)),
      });
      setSelectedAsset(prev => prev ? {
        ...prev,
        expectedReturn: Math.max(0, newReturn),
        allocation: Math.max(0, Math.min(100, newAlloc)),
      } : null);
      setIsEditing(false);
    }
  };

  if (activeAssets.length === 0) {
    return (
      <div className="border border-surface-border dark:border-surface-border bg-surface-dark/40 rounded-xl p-8 text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No hay activos con asignación mayor a 0%</p>
        <p className="text-xs text-slate-500 mt-1">Añade o asigna porcentajes en la sección de cartera para generar el Treemap interactivo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contenedor del Treemap proporcional */}
      <div className="relative w-full h-[360px] md:h-[440px] rounded-xl overflow-hidden border border-surface-border bg-slate-950 p-1 select-none">
        {layout.map(({ x0, y0, x1, y1, asset }) => {
          const width = x1 - x0;
          const height = y1 - y0;
          const config = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.global_equity;
          const assetEuroValue = (portfolioValue * (asset.allocation / (totalAllocation || 1)));

          const isSmall = width < 14 || height < 14;
          const isMicro = width < 8 || height < 8;

          return (
            <div
              key={asset.id}
              onClick={() => handleSelect(asset)}
              style={{
                left: `${x0}%`,
                top: `${y0}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
              className={`absolute cursor-pointer rounded-lg border transition-all duration-150 p-2 overflow-hidden flex flex-col justify-between group
                ${config.bg} ${config.border} hover:border-slate-300 hover:z-10 hover:shadow-lg`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-semibold text-xs tracking-tight text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                    {asset.ticker}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 tabular-numbers">
                    {asset.allocation}%
                  </span>
                </div>
                {!isSmall && (
                  <p className="text-[11px] text-slate-300 truncate mt-0.5 opacity-80 group-hover:opacity-100">
                    {asset.name}
                  </p>
                )}
              </div>

              {!isMicro && (
                <div className="pt-1 flex items-end justify-between text-[11px] font-mono border-t border-white/5">
                  <span className="text-emerald-400 tabular-numbers">
                    +{asset.expectedReturn}%
                  </span>
                  {!isSmall && (
                    <span className="text-slate-400 tabular-numbers">
                      {formatMoney(assetEuroValue, currency, isPrivacyMode)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda de categorías */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 px-1">
        <span className="font-medium text-slate-300">Categorías:</span>
        {Object.entries(CATEGORY_COLORS).map(([key, item]) => {
          const hasAssets = activeAssets.some(a => a.category === key);
          if (!hasAssets) return null;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${item.border} ${item.bg}`} />
              <span className="text-slate-300">{item.label}</span>
            </div>
          );
        })}
        <span className="ml-auto text-[11px] text-slate-400 italic">
          Haz clic en cualquier bloque para ver la ficha detallada
        </span>
      </div>

      {/* Modal / Ficha de Inspección Detallada del Activo */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-dark border border-surface-border rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-100">
            {/* Cabecera */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated border border-surface-border font-semibold text-emerald-400">
                    {selectedAsset.ticker}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedAsset.isin || 'Sin ISIN'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {CATEGORY_COLORS[selectedAsset.category]?.label || selectedAsset.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mt-2">
                  {selectedAsset.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Métricas clave */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 bg-surface-elevated/70 rounded-lg border border-surface-border">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Asignación</span>
                <span className="text-lg font-bold text-slate-100 tabular-numbers">
                  {selectedAsset.allocation}%
                </span>
              </div>
              <div className="p-3 bg-surface-elevated/70 rounded-lg border border-surface-border">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Retorno Estimado</span>
                <span className="text-lg font-bold text-emerald-400 tabular-numbers">
                  +{selectedAsset.expectedReturn}%
                </span>
              </div>
              <div className="p-3 bg-surface-elevated/70 rounded-lg border border-surface-border">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">CAGR 10 Años</span>
                <span className="text-lg font-bold text-slate-200 tabular-numbers">
                  {selectedAsset.historical10yCagr ? `+${selectedAsset.historical10yCagr}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Descripción */}
            {selectedAsset.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-surface-dark/50 p-3 rounded-lg border border-surface-border/50">
                {selectedAsset.description}
              </p>
            )}

            {/* Etiquetas de sensibilidad y exposición */}
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">Etiquetas de exposición (Simulador de Crisis):</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAsset.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Edición rápida de valores */}
            {isEditing ? (
              <div className="p-4 bg-surface-elevated rounded-lg border border-surface-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Retorno Esperado (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editReturn}
                      onChange={e => setEditReturn(e.target.value)}
                      className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Peso en Cartera (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={editAllocation}
                      onChange={e => setEditAllocation(e.target.value)}
                      className="w-full bg-slate-900 border border-surface-border rounded px-3 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-2 border-t border-surface-border text-xs">
                {onRemoveAsset && (
                  <button
                    onClick={() => {
                      onRemoveAsset(selectedAsset.id);
                      setSelectedAsset(null);
                    }}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Eliminar activo
                  </button>
                )}
                {onUpdateAsset && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-auto flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modificar porcentaje o interés
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
