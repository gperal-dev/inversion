# Inversión Fácil — Calculadora, Cartera & Simulador Financiero

> Plataforma web estática de alto rendimiento para análisis de inversión, simulación de interés compuesto realista, control de finanzas personales y gestión de riesgos sin artificios.

Desplegado en **GitHub Pages**: [https://gperal-dev.github.io/inversion/](https://gperal-dev.github.io/inversion/)  
Repositorio: [https://github.com/gperal-dev/inversion](https://github.com/gperal-dev/inversion)

---

## 🏛️ Filosofía Visual: Filtro Anti-IA

A diferencia de los paneles financieros genéricos creados por plantillas de IA (plagados de resplandores de neón fosforito, sombras excesivas, tipografía sin jerarquía y emojis infantiles), **Inversión Fácil** está diseñado bajo los principios del **diseño editorial financiero de autor** (*Bloomberg Terminal / Linear / Financial Times*):
- **Tipografía Tabular de Precisión**: Cifras monetarias con alineación vertical contable perfecta (`tnum`) sin saltos de layout.
- **Paleta Satinada y Mate**: Contrastes sobrios basados en slate profundo, acentos en esmeralda bosque apagado para rendimientos y terracota para caídas. Cero neones.
- **Componentes con Control Doble**: Sliders discretos integrados con campos de entrada numérica directa y teclado.
- **Modo Privacidad Antiespía**: Atajo rápido (`Shift + H`) o botón en cabecera para desenfocar u ocultar cifras confidenciales en público o en el trabajo.

---

## 🚀 Funcionalidades Principales

### 1. Calculadora de Interés Compuesto Realista
- **Modo Simple**: Simulación ágil con porcentaje medio anual esperado.
- **Modo Cartera Real Desglosada**: Cálculo automático de la rentabilidad media ponderada (CAGR) según los pesos asignados a cada activo.
- **Toggle de Inflación**: Permite alternar con un solo clic entre rentabilidad nominal y rentabilidad real (descontando la inflación para conocer tu poder adquisitivo futuro).
- **Comparativa contra Banco Tradicional**: Curva comparativa de coste de oportunidad que evidencia la pérdida frente a dejar el dinero en cuentas corrientes o depósitos al 0-1.5%.
- **Simulador Fiscal**: Cálculo estimado de retención de plusvalías según los tramos del ahorro en el IRPF.

### 2. Treemap Interactivo de Asignación de Activos
- Representación visual del patrimonio en rectángulos proporcionales (*Squarified Treemap* de D3).
- Clic en cualquier activo para acceder a su ficha detallada: ticker, ISIN, rentabilidad histórica a 10 años, TER y etiquetas de exposición.
- Modificación directa de ponderaciones y retornos.

### 3. Buscador Híbrido de Activos (UX Óptima)
- **Autocompletado Predictivo**: Catálogo integrado con más de 40 fondos indexados y ETFs líderes del mercado (Vanguard FTSE All-World, iShares Core MSCI World, S&P 500, Nasdaq 100, Bonos Globales, Oro, etc.).
- **Fallback Dinámico**: Posibilidad de registrar cualquier activo no catalogado en 1 clic personalizando su ticker, retorno esperado, categoría y etiquetas de sensibilidad.

### 4. Simulador de Riesgo Divisa (EUR vs USD)
- Calcula qué porcentaje de la cartera está expuesto a divisas extranjeras sin cobertura.
- Simula escenarios de tipo de cambio: Euro Fuerte (+12%), Dólar Fuerte (+14%) o Choque Volátil.

### 5. Simulador de Estrés, Crisis y Shocks Temáticos
- Simulación de grandes crisis históricas: Crash 2008, Burbuja Puntocom 2000, COVID 2020 y Estanflación.
- Shocks sectoriales específicos: impacto de un estallido en la burbuja de la Inteligencia Artificial / Tecnológicas o crisis de deuda en EEUU sobre los activos que tienen esas etiquetas.
- Cálculo de suelo de mercado, pérdida monetaria máxima y tiempo de recuperación histórico.

### 6. Finanzas Personales, Cuentas Bancarias & Gastos Hormiga
- **Mapa de Cuentas**: Gestión de cuentas bancarias reales (BBVA, Trade Republic, MyInvestor) con sus saldos y remuneraciones TAE.
- **Flujo de Caja**: Nómina vs gastos fijos y gastos hormiga.
- **Calculadora del Coste Futuro del Gasto Hormiga**: Calcula cuánto dinero tendrías a 10, 20 y 30 años si invirtieses ese café diario o suscripción prescindible.
- **Diagnóstico Financiero**: Meses de colchón de emergencia y proyección hacia la Independencia Financiera (Regla del 4% / FIRE).

### 7. Rebalanceo Inteligente & Múltiples Escenarios
- Calcula exactamente cuántos euros ingresar a cada activo con tu próxima aportación periódica para restablecer los porcentajes objetivo sin vender.
- Guardado de múltiples simulaciones independientes en `localStorage`.
- Copia de seguridad y restauración manual mediante archivo descargable `.json`.

---

## 🛠️ Tecnologías Utilizadas

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS** (Tokens editoriales personalizados)
- **Chart.js** & **react-chartjs-2** (Gráficos vectoriales fluidos)
- **D3 Hierarchy** (Algoritmo Squarified Treemap)
- **Lucide Icons**
- **GitHub Actions** (CI/CD para GitHub Pages)

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
