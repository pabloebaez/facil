import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../ui';
import { AddCustomerForm } from './AddCustomerForm';
import { CustomerHistoryEntry } from './CustomerHistoryEntry';
import { AddCustomerHistoryForm } from './AddCustomerHistoryForm';

export function CustomerManagementView({ customers, onAddCustomer, onRemoveCustomer, onAddCustomerHistory }) { 
  const [showAddForm, setShowAddForm] = useState(false); 
  const [historyFormOpenFor, setHistoryFormOpenFor] = useState(null); 
  
  const handleRemoveClick = (customerId, customerName) => { 
    if (customerId === 'CUST-001') { 
      alert("No se puede eliminar el cliente general."); 
      return; 
    } 
    if (window.confirm(`¿Seguro que quieres eliminar al cliente "${customerName}"?`)) { 
      onRemoveCustomer(customerId); 
    } 
  }; 
  
  const toggleHistoryForm = (customerId) => { 
    setHistoryFormOpenFor(prev => prev === customerId ? null : customerId); 
  }; 
  
  return ( 
    <div className="space-y-6"> 
      <div className="text-right"> 
        <Button onClick={() => setShowAddForm(prev => !prev)}> 
          {showAddForm ? 'Cancelar Agregar Cliente' : 'Agregar Nuevo Cliente'} 
        </Button> 
      </div> 
      {showAddForm && ( 
        <AddCustomerForm onAddCustomer={onAddCustomer} onCancel={() => setShowAddForm(false)} /> 
      )} 
      <Card> 
        <CardHeader><CardTitle>Gestión de Clientes</CardTitle></CardHeader> 
        <CardContent> 
          <Table> 
            <TableHeader> 
              <TableRow> 
                <TableHead>Tipo Doc.</TableHead> 
                <TableHead>Número Doc.</TableHead> 
                <TableHead>Nombre / Razón Social</TableHead> 
                <TableHead>Email</TableHead> 
                <TableHead>Teléfono</TableHead> 
                <TableHead>Historial</TableHead> 
                <TableHead className="text-right">Acciones</TableHead> 
              </TableRow> 
            </TableHeader> 
            <TableBody> 
              {customers.length === 0 ? ( 
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-4">No hay clientes registrados.</TableCell></TableRow> 
              ) : ( 
                customers.map(customer => ( 
                  <React.Fragment key={customer.id}> 
                    <TableRow> 
                      <TableCell>{customer.docType}</TableCell> 
                      <TableCell>{customer.docNum}</TableCell> 
                      <TableCell className="font-medium">{customer.name}</TableCell> 
                      <TableCell>{customer.email}</TableCell> 
                      <TableCell>{customer.phone}</TableCell> 
                      <TableCell> 
                        <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => toggleHistoryForm(customer.id)}> 
                          Ver/Añadir ({customer.historyLog?.length || 0}) 
                        </Button> 
                      </TableCell> 
                      <TableCell className="text-right"> 
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 disabled:text-gray-400" onClick={() => handleRemoveClick(customer.id, customer.name)} disabled={customer.id === 'CUST-001'} > 
                          Eliminar 
                        </Button> 
                      </TableCell> 
                    </TableRow> 
                    {historyFormOpenFor === customer.id && ( 
                      <TableRow className="bg-gray-50"> 
                        <TableCell colSpan={7} className="p-3"> 
                          <div className="text-xs"> 
                            <h4 className="font-semibold mb-1">Historial de Notas:</h4> 
                            {customer.historyLog?.length > 0 ? ( 
                              customer.historyLog.slice().reverse().map((entry, index) => <CustomerHistoryEntry key={index} entry={entry} />) 
                            ) : ( 
                              <p className="text-gray-400 italic">Sin notas.</p> 
                            )} 
                            <AddCustomerHistoryForm customerId={customer.id} onAddHistory={onAddCustomerHistory} onCancel={() => toggleHistoryForm(customer.id)} /> 
                          </div> 
                        </TableCell> 
                      </TableRow> 
                    )} 
                  </React.Fragment> 
                )) 
              )} 
            </TableBody> 
          </Table> 
        </CardContent> 
      </Card> 
    </div> 
  ); 
}















