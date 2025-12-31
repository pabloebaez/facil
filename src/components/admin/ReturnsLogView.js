import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Button, Loading } from '../ui';

export function ReturnsLogView({ returnsLog, onFilterChange, userRole, isLoading = false }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [saleNumber, setSaleNumber] = useState('');

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const filters = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (saleNumber.trim()) filters.sale_number = saleNumber.trim();
    
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [dateFrom, dateTo, saleNumber, onFilterChange]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSaleNumber('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular total de devoluciones
  const totalReturns = useMemo(() => {
    return returnsLog.reduce((sum, ret) => {
      const totalReturned = parseFloat(ret.total_returned || ret.totalReturned || 0);
      return sum + totalReturned;
    }, 0);
  }, [returnsLog]);

  const hasActiveFilters = dateFrom || dateTo || saleNumber.trim();

  return ( 
    <Card> 
      <CardHeader className="flex justify-between items-center"> 
        <CardTitle>Registro de Devoluciones</CardTitle>
        {userRole === 'cashier' && (
          <span className="text-sm text-gray-600">(Solo tus devoluciones)</span>
        )}
      </CardHeader> 
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="date-from" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="sale-number" className="block text-xs font-medium text-gray-700 mb-1">
                Número de Factura
              </label>
              <Input
                id="sale-number"
                type="text"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                placeholder="Buscar por número..."
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </div> 
        {returnsLog.length > 0 && (
          <div className="mb-4 p-3 bg-accent-50 rounded-lg">
            <p className="text-sm text-secondary-700">
              <strong>Total de devoluciones:</strong> {returnsLog.length} devolución(es)
            </p>
            <p className="text-sm text-secondary-700">
              <strong>Valor total devuelto:</strong> ${totalReturns.toFixed(2)}
            </p>
          </div>
        )}
        {returnsLog.length === 0 ? ( 
          <p className="text-gray-500 text-center py-4">No se han registrado devoluciones.</p> 
        ) : ( 
          <Table> 
            <TableHeader> 
              <TableRow> 
                <TableHead>N° Devolución</TableHead> 
                <TableHead>Fecha</TableHead> 
                <TableHead>Venta Original</TableHead> 
                <TableHead>Usuario</TableHead> 
                <TableHead>Razón</TableHead> 
                <TableHead className="text-right">Valor Devuelto</TableHead> 
              </TableRow> 
            </TableHeader> 
            <TableBody> 
              {returnsLog.map(ret => {
                const returnNumber = ret.return_number || ret.returnId || ret.id;
                const returnDate = ret.created_at || ret.timestamp;
                const saleNumber = ret.sale?.sale_number || ret.sale_id || ret.originalSaleId;
                const userName = ret.user?.name || ret.user?.email || 'N/A';
                const reason = ret.reason || 'Devolución de venta';
                const totalReturned = parseFloat(ret.total_returned || ret.totalReturned || 0);
                
                return (
                  <TableRow key={ret.id || ret.returnId}> 
                    <TableCell className="font-mono text-xs">{returnNumber}</TableCell> 
                    <TableCell className="text-xs">{formatDate(returnDate)}</TableCell> 
                    <TableCell className="font-mono text-xs">{saleNumber}</TableCell> 
                    <TableCell className="text-xs">{userName}</TableCell> 
                    <TableCell className="text-xs">{reason}</TableCell> 
                    <TableCell className="text-right font-medium">${totalReturned.toFixed(2)}</TableCell> 
                  </TableRow>
                );
              })} 
            </TableBody> 
          </Table> 
        )} 
      </CardContent> 
    </Card> 
  ); 
}

