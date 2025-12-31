import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { CashDrawerCountModal } from './CashDrawerCountModal';

export function CashDrawerBar({ cashDrawer, onOpenDrawer, onCloseDrawer, isLoading, sales = [], isCheckingCashDrawer = false }) {
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  
  // Si se está verificando el estado de la caja, mostrar indicador de carga
  if (isCheckingCashDrawer && !cashDrawer) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-600">Verificando estado de la caja...</span>
        </div>
      </div>
    );
  }

  const handleOpenDrawer = () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingrese un monto inicial válido');
      return;
    }
    onOpenDrawer(amount);
    setOpeningAmount('');
    setShowOpenForm(false);
  };

  const handleCloseDrawer = () => {
    // Mostrar modal de arqueo primero
    setShowCountModal(true);
  };

  const handleCountConfirm = (countedAmount, countDetails, notes) => {
    // Usar el monto contado como monto de cierre
    onCloseDrawer(countedAmount, countDetails, notes);
    setClosingAmount('');
    setShowCloseForm(false);
    setShowCountModal(false);
  };

  // Verificar si la caja está cerrada (manejar diferentes formatos de is_closed)
  const isClosed = cashDrawer ? (
    cashDrawer.is_closed === true || 
    cashDrawer.is_closed === 1 || 
    cashDrawer.is_closed === '1' ||
    cashDrawer.is_closed === 'true'
  ) : true;

  // Si no hay caja o está cerrada
  if (!cashDrawer || isClosed) {
    // Caja cerrada - mostrar botón para abrir
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 sm:p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-semibold text-yellow-800">
                {cashDrawer ? 'Caja Cerrada' : 'Sin Caja Abierta'}
              </span>
            </div>
            <span className="text-xs text-yellow-600 hidden sm:inline">
              {cashDrawer 
                ? `Cerrada el ${cashDrawer.closed_at ? new Date(cashDrawer.closed_at).toLocaleString() : 'hoy'}. Debe abrir la caja para realizar ventas.`
                : 'Debe abrir la caja para realizar ventas'}
            </span>
          </div>
          
          {!showOpenForm ? (
            <Button
              onClick={() => setShowOpenForm(true)}
              disabled={isLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              Iniciar Caja
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="Monto inicial"
                className="w-full sm:w-32 h-8 text-sm"
                step="0.01"
                min="0"
                disabled={isLoading}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenDrawer}
                  disabled={isLoading || !openingAmount}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-8 flex-1 sm:flex-none"
                >
                  Abrir
                </Button>
                <Button
                  onClick={() => {
                    setShowOpenForm(false);
                    setOpeningAmount('');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Caja abierta - mostrar resumen compacto
  const currentAmount = parseFloat(cashDrawer.current_amount || cashDrawer.initial_amount || 0);
  const salesTotal = parseFloat(cashDrawer.sales_total || 0);
  const returnsTotal = parseFloat(cashDrawer.returns_total || 0);
  const expensesTotal = parseFloat(cashDrawer.expenses_total || 0);
  const initialAmount = parseFloat(cashDrawer.initial_amount || 0);
  
  // Obtener fecha de apertura
  const openedDate = cashDrawer.created_at 
    ? new Date(cashDrawer.created_at).toLocaleString() 
    : 'hoy';

  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-2 sm:p-3 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-800">Caja Abierta</span>
            <span className="text-xs text-green-600 hidden sm:inline">({openedDate})</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Inicial:</span>
              <span className="font-semibold text-gray-800">${initialAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Ventas:</span>
              <span className="font-semibold text-green-600">+${salesTotal.toFixed(2)}</span>
            </div>
            {returnsTotal > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Devoluciones:</span>
                <span className="font-semibold text-orange-600">-${returnsTotal.toFixed(2)}</span>
              </div>
            )}
            {expensesTotal > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Egresos:</span>
                <span className="font-semibold text-red-600">-${expensesTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded">
              <span className="text-gray-700 font-medium">Saldo:</span>
              <span className="font-bold text-green-700">${currentAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!showCloseForm ? (
          <Button
            onClick={() => setShowCloseForm(true)}
            variant="destructive"
            size="sm"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cerrar Caja
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 hidden sm:inline">Monto cierre:</span>
              <Input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder={currentAmount.toFixed(2)}
                className="w-full sm:w-32 h-8 text-sm"
                step="0.01"
                min="0"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCloseDrawer}
                variant="destructive"
                size="sm"
                disabled={isLoading || !closingAmount}
                className="h-8 flex-1 sm:flex-none"
              >
                Confirmar
              </Button>
              <Button
                onClick={() => {
                  setShowCloseForm(false);
                  setClosingAmount('');
                }}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="h-8 flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de arqueo de caja */}
      <CashDrawerCountModal
        isOpen={showCountModal}
        onClose={() => setShowCountModal(false)}
        onConfirm={handleCountConfirm}
        cashDrawer={cashDrawer}
        sales={sales}
        isLoading={isLoading}
      />
    </div>
  );
}

