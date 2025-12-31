import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../ui';

export function InvoiceHistoryView({ sales, customers }) { 
  const [filterSaleId, setFilterSaleId] = useState(''); 
  const [filterStartDate, setFilterStartDate] = useState(''); 
  const [filterEndDate, setFilterEndDate] = useState(''); 
  const [filterCustomerName, setFilterCustomerName] = useState(''); 
  
  const getCustomerName = useCallback((customerId) => { 
    const customer = customers.find(c => c.id === customerId); 
    return customer ? customer.name : 'Cliente General'; 
  }, [customers]); 
  
  const filteredSales = useMemo(() => { 
    return sales.filter(sale => { 
      if (filterSaleId && !sale.id.toLowerCase().includes(filterSaleId.toLowerCase())) { 
        return false; 
      } 
      const saleDate = new Date(sale.timestamp); 
      if (filterStartDate) { 
        const startDate = new Date(filterStartDate); 
        startDate.setHours(0, 0, 0, 0); 
        if (saleDate < startDate) return false; 
      } 
      if (filterEndDate) { 
        const endDate = new Date(filterEndDate); 
        endDate.setHours(23, 59, 59, 999); 
        if (saleDate > endDate) return false; 
      } 
      if (filterCustomerName) { 
        const customerName = getCustomerName(sale.customerId); 
        if (!customerName.toLowerCase().includes(filterCustomerName.toLowerCase())) { 
          return false; 
        } 
      } 
      return true; 
    }); 
  }, [sales, filterSaleId, filterStartDate, filterEndDate, filterCustomerName, getCustomerName]); 
  
  return ( 
    <Card> 
      <CardHeader> 
        <CardTitle>Historial de Facturas (Sesión Actual)</CardTitle> 
      </CardHeader> 
      <CardContent> 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg bg-gray-50"> 
          <div> 
            <label htmlFor="filterId" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por ID Factura</label> 
            <Input id="filterId" value={filterSaleId} onChange={e => setFilterSaleId(e.target.value)} placeholder="ID..."/> 
          </div> 
          <div> 
            <label htmlFor="filterCust" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Cliente</label> 
            <Input id="filterCust" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} placeholder="Nombre cliente..."/> 
          </div> 
          <div> 
            <label htmlFor="filterStart" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label> 
            <Input id="filterStart" type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /> 
          </div> 
          <div> 
            <label htmlFor="filterEnd" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label> 
            <Input id="filterEnd" type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /> 
          </div> 
        </div> 
        {filteredSales.length === 0 ? ( 
          <p className="text-gray-500 text-center py-4">No se encontraron facturas con los filtros aplicados.</p> 
        ) : ( 
          <Table> 
            <TableHeader><TableRow><TableHead>ID Factura</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader> 
            <TableBody> 
              {filteredSales.map(sale => ( 
                <TableRow key={sale.id}> 
                  <TableCell className="font-mono text-xs">{sale.id}</TableCell> 
                  <TableCell className="text-xs">{new Date(sale.timestamp).toLocaleString()}</TableCell> 
                  <TableCell className="text-xs">{getCustomerName(sale.customerId)}</TableCell> 
                  <TableCell className="text-right font-medium">${sale.finalTotal.toFixed(2)}</TableCell> 
                </TableRow> 
              ))} 
            </TableBody> 
          </Table> 
        )} 
      </CardContent> 
    </Card> 
  ); 
}















