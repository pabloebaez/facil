import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../ui';

export function CashDrawerControl({ cashDrawer, onOpenDrawer, onCloseDrawer, isLoading }) {
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleOpenDrawer = () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingrese un monto inicial válido');
      return;
    }
    onOpenDrawer(amount);
    setOpeningAmount('');
  };

  const handleCloseDrawer = () => {
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingrese el monto de cierre válido');
      return;
    }
    onCloseDrawer(amount);
    setClosingAmount('');
    setShowCloseModal(false);
  };

  if (!cashDrawer || cashDrawer.is_closed) {
    // Caja cerrada - mostrar formulario para abrir
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Caja Cerrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800 font-semibold">
              ⚠️ La caja está cerrada. Debe abrir la caja para realizar ventas.
            </p>
          </div>
          <div>
            <label htmlFor="openingAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Inicial en Caja *
            </label>
            <Input
              id="openingAmount"
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleOpenDrawer}
            disabled={isLoading || !openingAmount}
            className="w-full"
          >
            {isLoading ? 'Abriendo...' : 'Iniciar Caja'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Caja abierta - mostrar resumen y opción de cerrar
  const currentAmount = parseFloat(cashDrawer.current_amount || cashDrawer.initial_amount || 0);
  const salesTotal = parseFloat(cashDrawer.sales_total || 0);
  const returnsTotal = parseFloat(cashDrawer.returns_total || 0);
  const expensesTotal = parseFloat(cashDrawer.expenses_total || 0);
  const initialAmount = parseFloat(cashDrawer.initial_amount || 0);

  return (
    <Card className="border-green-300 bg-green-50">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-green-800">Caja Abierta</CardTitle>
        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
          Activa
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Saldo Inicial:</span>
            <span className="font-semibold">${initialAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">(+) Ventas:</span>
            <span className="font-semibold text-green-600">+${salesTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">(-) Devoluciones:</span>
            <span className="font-semibold text-orange-600">-${returnsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">(-) Egresos:</span>
            <span className="font-semibold text-red-600">-${expensesTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold text-gray-800">Saldo Actual:</span>
            <span className="font-bold text-lg text-green-700">${currentAmount.toFixed(2)}</span>
          </div>
        </div>

        {!showCloseModal ? (
          <Button
            variant="destructive"
            onClick={() => setShowCloseModal(true)}
            className="w-full"
            disabled={isLoading}
          >
            Cerrar Caja
          </Button>
        ) : (
          <div className="space-y-3 border-t pt-3">
            <div>
              <label htmlFor="closingAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto de Cierre *
              </label>
              <Input
                id="closingAmount"
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder={currentAmount.toFixed(2)}
                step="0.01"
                min="0"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto esperado: ${currentAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingAmount('');
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseDrawer}
                className="flex-1"
                disabled={isLoading || !closingAmount}
              >
                {isLoading ? 'Cerrando...' : 'Confirmar Cierre'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}














