import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../ui';
import { AddRecurringServiceForm } from './AddRecurringServiceForm';
import { formatDate } from '../../utils/helpers';

export function RecurringPaymentsView({ recurringServices, customers, products, onAddService, onToggleServiceStatus, onRemoveService }) { 
  const [showAddForm, setShowAddForm] = useState(false); 
  
  const getCustomerName = useCallback((customerId) => { 
    const customer = customers.find(c => c.id === customerId); 
    return customer ? customer.name : 'N/A'; 
  }, [customers]); 
  
  const getProductName = useCallback((productId) => { 
    const product = products.find(p => p.id === productId); 
    return product ? product.name : 'N/A'; 
  }, [products]); 
  
  const handleRemoveClick = (serviceId) => { 
    if (window.confirm("¿Seguro que quieres eliminar este servicio recurrente?")) { 
      onRemoveService(serviceId); 
    } 
  }; 
  
  const cycleLabels = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', bimonthly: 'Bi-Mensual', quarterly: 'Trimestral', semiannually: 'Semestral', annually: 'Anual' }; 
  
  return ( 
    <div className="space-y-6"> 
      <div className="text-right"> 
        <Button onClick={() => setShowAddForm(prev => !prev)}> 
          {showAddForm ? 'Cancelar Agregar Servicio' : 'Agregar Servicio Recurrente'} 
        </Button> 
      </div> 
      {showAddForm && ( 
        <AddRecurringServiceForm customers={customers} products={products} onAddService={onAddService} onCancel={() => setShowAddForm(false)} /> 
      )} 
      <Card> 
        <CardHeader> 
          <CardTitle>Pagos Recurrentes (Simulación Visual)</CardTitle> 
        </CardHeader> 
        <CardContent> 
          <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-md mb-4"> 
            <strong>Nota:</strong> Esta es una visualización. La facturación automática, cálculo de fechas de corte y seguimiento de consumo no están implementados. 
          </p> 
          {recurringServices.length === 0 ? ( 
            <p className="text-gray-500 text-center py-4">No hay servicios recurrentes configurados.</p> 
          ) : ( 
            <Table> 
              <TableHeader> 
                <TableRow> 
                  <TableHead>Cliente</TableHead> 
                  <TableHead>Servicio/Producto</TableHead> 
                  <TableHead>Ciclo</TableHead> 
                  <TableHead>Fecha Inicio</TableHead> 
                  <TableHead>Estado</TableHead> 
                  <TableHead className="text-right">Acciones</TableHead> 
                </TableRow> 
              </TableHeader> 
              <TableBody> 
                {recurringServices.map(service => ( 
                  <TableRow key={service.id}> 
                    <TableCell>{getCustomerName(service.customerId)}</TableCell> 
                    <TableCell>{getProductName(service.productId)}</TableCell> 
                    <TableCell>{cycleLabels[service.billingCycle] || service.billingCycle}</TableCell> 
                    <TableCell>{formatDate(service.startDate)}</TableCell> 
                    <TableCell> 
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                        {service.status === 'active' ? 'Activo' : 'Pausado'} 
                      </span> 
                    </TableCell> 
                    <TableCell className="text-right space-x-1"> 
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => onToggleServiceStatus(service.id)}> 
                        {service.status === 'active' ? 'Pausar' : 'Activar'} 
                      </Button> 
                      <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleRemoveClick(service.id)}> 
                        Eliminar 
                      </Button> 
                    </TableCell> 
                  </TableRow> 
                ))} 
              </TableBody> 
            </Table> 
          )} 
        </CardContent> 
      </Card> 
    </div> 
  ); 
}















