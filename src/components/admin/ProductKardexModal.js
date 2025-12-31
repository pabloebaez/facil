import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';

export function ProductKardexModal({ product, isOpen, onClose }) {
  const [kardexData, setKardexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      loadKardex();
    }
  }, [isOpen, product]);

  const loadKardex = async () => {
    if (!product) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getKardex(product.id);
      setKardexData(response.data);
    } catch (err) {
      console.error('Error loading kardex:', err);
      setError('Error al cargar el kardex del producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Kardex - {product?.name || 'Producto'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando kardex...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button onClick={loadKardex} className="mt-4">
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && kardexData && (
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-accent-50 p-4 rounded-lg border border-accent-200">
                  <div className="text-sm text-secondary-600 font-medium">Cantidad Total</div>
                  <div className="text-2xl font-bold text-secondary-800">
                    {(parseFloat(kardexData.statistics?.total_quantity) || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Disponible</div>
                  <div className="text-2xl font-bold text-green-800">
                    {(parseFloat(kardexData.statistics?.total_remaining) || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">Vendido</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {(parseFloat(kardexData.statistics?.total_sold) || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Costo Total</div>
                  <div className="text-2xl font-bold text-purple-800">
                    ${(parseFloat(kardexData.statistics?.total_cost) || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tabla de lotes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Historial de Lotes (FIFO)</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote #</TableHead>
                        <TableHead>Fecha Entrada</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Compra</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                        <TableHead className="text-right">Vendido</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-right">Costo Total</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kardexData.lots && kardexData.lots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-gray-500 py-4">
                            No hay lotes registrados para este producto
                          </TableCell>
                        </TableRow>
                      ) : (
                        kardexData.lots?.map((lot) => {
                          // Convertir valores numéricos a números para evitar errores
                          const quantity = parseFloat(lot.quantity) || 0;
                          const remainingQuantity = parseFloat(lot.remaining_quantity) || 0;
                          const unitCost = parseFloat(lot.unit_cost) || 0;
                          const sold = quantity - remainingQuantity;
                          const isExpired = lot.is_expired;
                          const isDepleted = remainingQuantity === 0;
                          
                          return (
                            <TableRow 
                              key={lot.id}
                              className={
                                isExpired ? 'bg-red-50' : 
                                isDepleted ? 'bg-gray-50' : 
                                remainingQuantity < quantity * 0.2 ? 'bg-yellow-50' : ''
                              }
                            >
                              <TableCell className="font-medium">
                                {lot.lot_number && String(lot.lot_number).trim() !== '' ? String(lot.lot_number).trim() : 'Lote Inicial'}
                              </TableCell>
                              <TableCell>
                                {new Date(lot.entry_date).toLocaleDateString('es-ES')}
                              </TableCell>
                              <TableCell>
                                {lot.expiration_date 
                                  ? new Date(lot.expiration_date).toLocaleDateString('es-ES')
                                  : 'Sin vencimiento'}
                              </TableCell>
                              <TableCell>
                                {lot.supplier?.name || '-'}
                              </TableCell>
                              <TableCell className="text-xs">
                                {lot.purchase?.purchase_number || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {quantity.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                <span className={remainingQuantity > 0 ? 'text-green-700' : 'text-gray-500'}>
                                  {remainingQuantity.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {sold.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${unitCost.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                ${(remainingQuantity * unitCost).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {isExpired ? (
                                  <span className="text-red-600 font-medium text-xs">Vencido</span>
                                ) : isDepleted ? (
                                  <span className="text-gray-500 text-xs">Agotado</span>
                                ) : (
                                  <span className="text-green-600 text-xs">Disponible</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Información adicional */}
              {(parseFloat(kardexData.statistics?.average_cost) || 0) > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">
                    <strong>Costo promedio ponderado:</strong> ${(parseFloat(kardexData.statistics.average_cost) || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    * El sistema utiliza el método FIFO (First In, First Out) para asignar lotes en las ventas.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}

