import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../ui';

export function CashDrawerCountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cashDrawer,
  sales = [],
  isLoading 
}) {
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Resetear valores al abrir
      setCashAmount('');
      setNotes('');
    }
  }, [isOpen]);

  // Filtrar ventas de la caja actual (mismo usuario y mismo día)
  const getCashDrawerSales = () => {
    if (!cashDrawer || !cashDrawer.user_id || !cashDrawer.date) {
      return [];
    }

    const drawerDate = new Date(cashDrawer.date).toDateString();
    
    return sales.filter(sale => {
      const saleDate = sale.created_at 
        ? new Date(sale.created_at).toDateString()
        : null;
      return sale.user_id === cashDrawer.user_id && saleDate === drawerDate;
    });
  };

  // Calcular ingresos por método de pago desde las ventas
  const calculatePaymentBreakdown = () => {
    const breakdown = {
      cash: 0,
      card: 0,
      nequi: 0,
      daviplata: 0,
      transfer: 0,
      other: 0,
      total: 0,
    };

    const drawerSales = getCashDrawerSales();

    drawerSales.forEach(sale => {
      const total = parseFloat(sale.final_total || 0);
      const paymentMethod = sale.payment_method || 'cash';
      
      breakdown.total += total;
      
      switch (paymentMethod.toLowerCase()) {
        case 'cash':
        case 'efectivo':
          breakdown.cash += total;
          break;
        case 'card':
        case 'tarjeta':
          breakdown.card += total;
          break;
        case 'nequi':
          breakdown.nequi += total;
          break;
        case 'daviplata':
          breakdown.daviplata += total;
          break;
        case 'transfer':
        case 'transferencia':
          breakdown.transfer += total;
          break;
        default:
          breakdown.other += total;
      }
    });

    return breakdown;
  };

  const paymentBreakdown = calculatePaymentBreakdown();
  
  // Valores por defecto seguros
  const initialAmount = cashDrawer ? parseFloat(cashDrawer.initial_amount || 0) : 0;
  const salesTotal = cashDrawer ? parseFloat(cashDrawer.sales_total || 0) : 0;
  const returnsTotal = cashDrawer ? parseFloat(cashDrawer.returns_total || 0) : 0;
  const expensesTotal = cashDrawer ? parseFloat(cashDrawer.expenses_total || 0) : 0;
  
  // El efectivo esperado es: inicial + ventas en efectivo - devoluciones en efectivo - egresos
  // Como no tenemos el desglose exacto, asumimos que todas las ventas fueron en efectivo para el cálculo esperado
  // Pero mostramos el desglose real si está disponible
  const expectedCashAmount = initialAmount + paymentBreakdown.cash - returnsTotal - expensesTotal;
  const countedAmount = parseFloat(cashAmount) || 0;
  const difference = countedAmount - expectedCashAmount;

  const handleConfirm = () => {
    if (countedAmount === 0) {
      alert('Por favor ingrese el monto total en efectivo');
      return;
    }
    onConfirm(countedAmount, null, notes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">💰 Cerrar Caja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Resumen compacto de ingresos */}
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">💰 Efectivo:</span>
                <span className="font-bold text-green-700 ml-1">${paymentBreakdown.cash.toFixed(2)}</span>
              </div>
              {paymentBreakdown.card > 0 && (
                <div>
                  <span className="text-gray-600">💳 Tarjeta:</span>
                  <span className="font-semibold text-blue-700 ml-1">${paymentBreakdown.card.toFixed(2)}</span>
                </div>
              )}
              {paymentBreakdown.nequi > 0 && (
                <div>
                  <span className="text-gray-600">📱 Nequi:</span>
                  <span className="font-semibold text-purple-700 ml-1">${paymentBreakdown.nequi.toFixed(2)}</span>
                </div>
              )}
              {paymentBreakdown.daviplata > 0 && (
                <div>
                  <span className="text-gray-600">📱 Daviplata:</span>
                  <span className="font-semibold text-purple-700 ml-1">${paymentBreakdown.daviplata.toFixed(2)}</span>
                </div>
              )}
              {paymentBreakdown.transfer > 0 && (
                <div>
                  <span className="text-gray-600">🏦 Transfer:</span>
                  <span className="font-semibold text-indigo-700 ml-1">${paymentBreakdown.transfer.toFixed(2)}</span>
                </div>
              )}
              <div className="col-span-2 border-t border-gray-300 pt-1 mt-1 flex justify-between">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="font-bold text-secondary-700">${paymentBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Efectivo esperado compacto */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">💵 Efectivo Esperado:</span>
              <span className="text-xl font-bold text-secondary-700">${expectedCashAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Input para el total en efectivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total en Efectivo Contado *
            </label>
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder={expectedCashAmount.toFixed(2)}
              step="0.01"
              min="0"
              className="text-lg font-semibold text-center"
              autoFocus
            />
          </div>

          {/* Resumen del conteo compacto */}
          {cashAmount && (
            <div className={`border rounded-lg p-3 ${
              difference === 0 
                ? 'bg-green-50 border-green-200' 
                : difference > 0 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-800">Contado:</span>
                <span className="text-xl font-bold text-gray-800">
                  ${countedAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Diferencia:</span>
                <span className={`text-base font-bold ${
                  difference === 0 
                    ? 'text-green-700' 
                    : difference > 0 
                      ? 'text-yellow-700' 
                      : 'text-red-700'
                }`}>
                  {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Notas compactas */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400"
              rows="2"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1 text-sm py-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || countedAmount === 0}
              className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-sm py-2"
            >
              {isLoading ? 'Cerrando...' : 'Cerrar Caja'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

