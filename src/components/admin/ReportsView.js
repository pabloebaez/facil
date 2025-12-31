import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { reportService } from '../../services/api';

export function ReportsView({ sales = [], expensesLog = [], products = [], taxes = [], cashDrawer, purchases = [] }) {
  const [periodFilter, setPeriodFilter] = useState('today'); // 'today', 'week', 'month', 'quarter', 'semester', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const isRequestingRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Evitar múltiples llamadas simultáneas
    if (isRequestingRef.current) {
      return;
    }

    // Solo ejecutar si no es custom o si ambas fechas están definidas
    if (periodFilter === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    // Debounce: esperar 300ms antes de hacer la solicitud
    timeoutRef.current = setTimeout(() => {
      loadReportsFromBackend();
    }, 300);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [periodFilter, customStartDate, customEndDate]);

  const loadReportsFromBackend = async () => {
    // Evitar múltiples llamadas simultáneas
    if (isRequestingRef.current) {
      return;
    }

    isRequestingRef.current = true;
    setLoading(true);
    
    try {
      const params = { period: periodFilter };
      if (periodFilter === 'custom' && customStartDate && customEndDate) {
        params.custom_start_date = customStartDate;
        params.custom_end_date = customEndDate;
      }
      
      const response = await reportService.getReports(params);
      if (response.data) {
        // Mapear los datos del backend al formato esperado
        const inventoryData = response.data.inventory || {};
        console.log('Inventory data from backend:', inventoryData);
        setReportData({
          income: response.data.income,
          expenses: {
            ...response.data.expenses,
            purchases_without_taxes: response.data.expenses?.purchases_without_taxes || 0,
            purchase_taxes: response.data.expenses?.purchase_taxes || 0,
            purchase_taxes_breakdown: response.data.expenses?.purchase_taxes_breakdown || [],
          },
          profit: response.data.profit,
          topProducts: response.data.top_products || [],
          leastSoldProducts: response.data.least_sold_products || [],
          salesCount: response.data.sales_count || 0,
          taxesBreakdown: response.data.taxes_breakdown || [],
          inventory: {
            initialValue: inventoryData.initial_value || inventoryData.initialValue || 0,
            currentAtCost: inventoryData.current_at_cost || inventoryData.currentAtCost || 0,
            currentAtSalePrice: inventoryData.current_at_sale_price || inventoryData.currentAtSalePrice || 0,
            estimatedProfit: inventoryData.estimated_profit || inventoryData.estimatedProfit || 0,
          },
        });
        isRequestingRef.current = false;
        setLoading(false);
        return;
      }
    } catch (error) {
      // Si es error 429, esperar un poco antes de reintentar
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded, waiting before retry...');
        isRequestingRef.current = false;
        setLoading(false);
        // Calcular localmente mientras esperamos
        if (periodFilter !== 'custom' || (customStartDate && customEndDate)) {
          calculateLocalReports();
        }
        return;
      }
      console.error('Error loading reports from backend, using local calculation:', error);
    }
    
    // Si falla, calcular desde datos locales
    if (periodFilter !== 'custom' || (customStartDate && customEndDate)) {
      calculateLocalReports();
    }
    isRequestingRef.current = false;
    setLoading(false);
  };

  const calculateLocalReports = () => {
    // Calcular fechas según el período
    const { startDate, endDate } = getPeriodDates(periodFilter, customStartDate, customEndDate);
    
    // Filtrar ventas por período
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.timestamp);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Filtrar compras por período
    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at || purchase.purchase_date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    // Filtrar compras iniciales (capital invertido) - no deben contarse como egresos operativos
    const operationalPurchases = filteredPurchases.filter(purchase => {
      const notes = (purchase.notes || '').toLowerCase();
      // Excluir compras iniciales
      if (notes.includes('inicial') || notes.includes('lote inicial') || notes.includes('compra inicial')) {
        return false;
      }
      return true;
    });

    // Filtrar egresos (gastos) por período
    const filteredExpenses = expensesLog.filter(expense => {
      const expenseDate = new Date(expense.created_at || expense.timestamp);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Calcular ingresos (ventas)
    const totalIncome = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.final_total || sale.total || 0), 0);
    const totalTaxesCollected = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_tax_amount || 0), 0);
    const totalDiscounts = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_discount_amount || 0), 0);

    // Calcular egresos (solo compras operativas + gastos, excluyendo capital inicial)
    const totalPurchases = operationalPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);
    const totalOtherExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    const totalExpenses = totalPurchases + totalOtherExpenses;

    // Calcular valor del inventario inicial (lotes iniciales - capital invertido)
    const initialInventoryValue = calculateInitialInventoryValue();

    // Calcular valor total del inventario actual
    const currentInventoryAtCost = products.reduce((sum, product) => {
      const inventory = parseFloat(product.inventory || 0);
      const costPrice = parseFloat(product.cost_price || 0);
      return sum + (inventory * costPrice);
    }, 0);

    const currentInventoryAtSalePrice = products.reduce((sum, product) => {
      const inventory = parseFloat(product.inventory || 0);
      const salePrice = parseFloat(product.price || 0);
      return sum + (inventory * salePrice);
    }, 0);

    // Calcular ganancia estimada del inventario actual
    // La ganancia estimada es simplemente la diferencia entre el precio de venta y el costo
    // El inventario inicial ya está incluido en el costo actual, no se debe restar dos veces
    const estimatedInventoryProfit = currentInventoryAtSalePrice - currentInventoryAtCost;

    // Calcular productos más vendidos
    const productSales = {};
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const productId = item.product_id || item.product?.id;
          const quantity = parseFloat(item.quantity || 0);
          if (productId && quantity > 0) {
            if (!productSales[productId]) {
              productSales[productId] = {
                productId,
                productName: item.product_name || item.product?.name || 'Producto desconocido',
                quantity: 0,
                totalSales: 0,
              };
            }
            productSales[productId].quantity += quantity;
            productSales[productId].totalSales += parseFloat(item.price || 0) * quantity;
          }
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const leastSoldProducts = Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    setReportData({
      income: {
        total: totalIncome,
        taxes: totalTaxesCollected,
        discounts: totalDiscounts,
        net: totalIncome - totalTaxesCollected,
      },
      expenses: {
        total: totalExpenses,
        purchases: totalPurchases,
        other_expenses: totalOtherExpenses,
      },
      profit: totalIncome - totalExpenses,
      topProducts,
      leastSoldProducts,
      salesCount: filteredSales.length,
      taxesBreakdown: calculateTaxesBreakdown(filteredSales, taxes),
      inventory: {
        initialValue: initialInventoryValue,
        currentAtCost: currentInventoryAtCost,
        currentAtSalePrice: currentInventoryAtSalePrice,
        estimatedProfit: estimatedInventoryProfit,
      },
    });
  };

  const calculateInitialInventoryValue = () => {
    // Calcular el valor del inventario inicial basado en los lotes iniciales
    // Los lotes iniciales son aquellos con lot_number null, vacío o "Lote Inicial"
    // Buscamos compras que tengan notas indicando que son "iniciales" o "lote inicial"
    let initialValue = 0;
    
    // Buscar todas las compras (no solo las filtradas por período)
    purchases.forEach(purchase => {
      const notes = (purchase.notes || '').toLowerCase();
      if (notes.includes('inicial') || notes.includes('lote inicial') || notes.includes('compra inicial')) {
        initialValue += parseFloat(purchase.total || 0);
      }
    });

    return initialValue;
  };

  const getPeriodDates = (period, startDateCustom = '', endDateCustom = '') => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();

    if (period === 'custom') {
      // Usar fechas personalizadas
      if (startDateCustom && endDateCustom) {
        const customStart = new Date(startDateCustom);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(endDateCustom);
        customEnd.setHours(23, 59, 59, 999);
        return { startDate: customStart, endDate: customEnd };
      } else {
        // Si no hay fechas personalizadas, usar hoy por defecto
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
    }

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'semester':
        startDate.setMonth(endDate.getMonth() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  };

  const calculateTaxesBreakdown = (filteredSales, taxes) => {
    const taxBreakdown = {};
    
    taxes.forEach(tax => {
      taxBreakdown[tax.id] = {
        id: tax.id,
        name: tax.name,
        rate: tax.rate,
        total: 0,
      };
    });

    filteredSales.forEach(sale => {
      if (sale.tax_breakdown_details && Array.isArray(sale.tax_breakdown_details)) {
        sale.tax_breakdown_details.forEach(detail => {
          const taxId = detail.tax_id;
          if (taxBreakdown[taxId]) {
            taxBreakdown[taxId].total += parseFloat(detail.amount || 0);
          }
        });
      }
    });

    return Object.values(taxBreakdown).filter(t => t.total > 0);
  };

  const periodLabels = {
    today: 'Hoy',
    week: 'Última Semana',
    month: 'Último Mes',
    quarter: 'Último Trimestre',
    semester: 'Último Semestre',
    year: 'Último Año',
    custom: 'Rango Personalizado',
  };

  // Formatear fecha para input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando informes...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle>Informes y Contabilidad</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <Select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-48"
              >
                <option value="today">{periodLabels.today}</option>
                <option value="week">{periodLabels.week}</option>
                <option value="month">{periodLabels.month}</option>
                <option value="quarter">{periodLabels.quarter}</option>
                <option value="semester">{periodLabels.semester}</option>
                <option value="year">{periodLabels.year}</option>
                <option value="custom">{periodLabels.custom}</option>
              </Select>
              {periodFilter === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Desde:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hasta:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={formatDateForInput(new Date())}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(reportData.income?.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {reportData.salesCount || 0} venta(s)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Egresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(reportData.expenses?.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Ganancia Neta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(reportData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(reportData.profit || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Impuestos Recaudados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              ${(reportData.income?.taxes || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Egresos */}
      {reportData.expenses?.purchase_taxes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">Compras sin Impuestos</div>
                <div className="text-xl font-bold text-gray-800">
                  ${(reportData.expenses?.purchases_without_taxes || reportData.expenses?.purchases || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Subtotal de compras (base imponible)
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">Impuestos Pagados en Compras</div>
                <div className="text-xl font-bold text-yellow-800">
                  ${(reportData.expenses?.purchase_taxes || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Total de impuestos pagados a proveedores
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600 font-medium">Total de Compras</div>
                <div className="text-xl font-bold text-red-800">
                  ${(reportData.expenses?.purchases || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Incluye impuestos (egreso total)
                </div>
              </div>
            </div>
            
            {/* Desglose de impuestos por tipo */}
            {reportData.expenses?.purchase_taxes_breakdown && reportData.expenses.purchase_taxes_breakdown.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-800 mb-3">Impuestos Pagados por Tipo</h4>
                <div className="space-y-2">
                  {reportData.expenses.purchase_taxes_breakdown.map((tax, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-gray-900">{tax.name}</span>
                        <span className="text-xs text-gray-600 ml-2">({tax.rate}%)</span>
                        <span className="text-xs text-gray-500 ml-2">- {tax.count} compra(s)</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        ${(tax.total_amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información de Inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Valor del Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Inventario Inicial (Capital Invertido)</div>
              <div className="text-xl font-bold text-purple-800">
                ${(reportData.inventory?.initialValue || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Valor de los lotes iniciales
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Inventario Actual a Costo</div>
              <div className="text-xl font-bold text-orange-800">
                ${(reportData.inventory?.currentAtCost || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Valor de compra del inventario actual
              </div>
            </div>
            <div className="bg-accent-50 p-4 rounded-lg">
              <div className="text-sm text-secondary-600 font-medium">Inventario Actual a Precio de Venta</div>
              <div className="text-xl font-bold text-secondary-800">
                ${(reportData.inventory?.currentAtSalePrice || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-secondary-600 mt-1">
                Valor potencial de venta del inventario
              </div>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="text-sm text-teal-600 font-medium">Ganancia Estimada del Inventario</div>
              <div className={`text-xl font-bold ${(reportData.inventory?.estimatedProfit || 0) >= 0 ? 'text-teal-800' : 'text-red-600'}`}>
                ${(reportData.inventory?.estimatedProfit || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-teal-600 mt-1">
                Diferencia entre venta y costo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Ingresos Brutos</div>
              <div className="text-xl font-bold text-green-800">
                ${(reportData.income?.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-accent-50 p-4 rounded-lg">
              <div className="text-sm text-secondary-600 font-medium">Impuestos</div>
              <div className="text-xl font-bold text-secondary-800">
                ${(reportData.income?.taxes || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Descuentos</div>
              <div className="text-xl font-bold text-yellow-800">
                ${(reportData.income?.discounts || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productos Más Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.topProducts && reportData.topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad Vendida</TableHead>
                  <TableHead className="text-right">Total en Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topProducts.map((item, index) => (
                  <TableRow key={item.productId || index}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${item.totalSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay productos vendidos en este período</p>
          )}
        </CardContent>
      </Card>

      {/* Productos Menos Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Menos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.leastSoldProducts && reportData.leastSoldProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad Vendida</TableHead>
                  <TableHead className="text-right">Total en Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.leastSoldProducts.map((item, index) => (
                  <TableRow key={item.productId || index}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${item.totalSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay productos vendidos en este período</p>
          )}
        </CardContent>
      </Card>

      {/* Desglose de Impuestos */}
      {reportData.taxesBreakdown && reportData.taxesBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Impuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Impuesto</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">Total Recaudado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.taxesBreakdown.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell className="font-medium">{tax.name}</TableCell>
                    <TableCell className="text-right">{tax.rate}%</TableCell>
                    <TableCell className="text-right">
                      ${tax.total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}










