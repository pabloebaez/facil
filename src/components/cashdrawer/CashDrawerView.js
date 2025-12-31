import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { AddExpenseForm } from './AddExpenseForm';

export function CashDrawerView({ cashDrawer, expensesLog, onSetInitialCash, onAddExpense }) { 
  const [initialCashInput, setInitialCashInput] = useState(''); 
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false); 
  
  const handleSetInitial = () => { 
    const amount = parseFloat(initialCashInput); 
    if (!isNaN(amount) && amount >= 0) { 
      onSetInitialCash(amount); 
      setInitialCashInput(''); 
    } else { 
      console.error("Ingrese un monto inicial válido."); 
    } 
  }; 
  
  return ( 
    <div className="space-y-6"> 
      {!cashDrawer.isSet && ( 
        <Card> 
          <CardHeader><CardTitle>Abrir Caja</CardTitle></CardHeader> 
          <CardContent className="flex items-end gap-2"> 
            <div className="flex-grow"> 
              <label htmlFor="initialCash" className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial en Caja*</label> 
              <Input id="initialCash" type="number" value={initialCashInput} onChange={(e) => setInitialCashInput(e.target.value)} placeholder="0.00" step="0.01" min="0" required/> 
            </div> 
            <Button onClick={handleSetInitial}>Iniciar Caja</Button> 
          </CardContent> 
        </Card> 
      )} 
      {cashDrawer.isSet && ( 
        <Card> 
          <CardHeader><CardTitle>Resumen de Caja (Sesión Actual)</CardTitle></CardHeader> 
          <CardContent className="space-y-2 text-sm"> 
            <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Saldo Inicial:</span><span className="font-medium">${cashDrawer.initial.toFixed(2)}</span></div> 
            <div className="flex justify-between p-2"><span>(+) Ventas Totales:</span><span className="font-medium text-green-600">+ ${cashDrawer.salesTotal.toFixed(2)}</span></div> 
            <div className="flex justify-between p-2"><span>(-) Devoluciones (Sim.):</span><span className="font-medium text-orange-600">- ${cashDrawer.returnsTotal.toFixed(2)}</span></div> 
            <div className="flex justify-between p-2"><span>(-) Egresos Totales:</span><span className="font-medium text-red-600">- ${cashDrawer.expensesTotal.toFixed(2)}</span></div> 
            <div className="flex justify-between p-2 bg-gray-100 rounded border-t font-semibold text-base"><span>Saldo Actual Estimado:</span><span>${cashDrawer.current.toFixed(2)}</span></div> 
            <p className="text-xs text-gray-500 mt-2">* Este es un cálculo simulado basado en las operaciones de esta sesión.</p> 
          </CardContent> 
        </Card> 
      )} 
      {cashDrawer.isSet && ( 
        <div className="space-y-6"> 
          <div className="text-right"> 
            <Button variant="destructive" onClick={() => setShowAddExpenseForm(prev => !prev)}> 
              {showAddExpenseForm ? 'Cancelar Egreso' : 'Registrar Egreso'} 
            </Button> 
          </div> 
          {showAddExpenseForm && ( 
            <AddExpenseForm onAddExpense={onAddExpense} onCancel={() => setShowAddExpenseForm(false)} /> 
          )} 
          <Card> 
            <CardHeader><CardTitle>Registro de Egresos</CardTitle></CardHeader> 
            <CardContent> 
              {expensesLog.length === 0 ? ( 
                <p className="text-gray-500 text-center py-4">No hay egresos registrados en esta sesión.</p> 
              ) : ( 
                <Table> 
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader> 
                  <TableBody> 
                    {expensesLog.map(exp => ( 
                      <TableRow key={exp.id}> 
                        <TableCell className="text-xs">{new Date(exp.timestamp).toLocaleString()}</TableCell> 
                        <TableCell>{exp.description}</TableCell> 
                        <TableCell className="text-right font-medium text-red-600">-${exp.amount.toFixed(2)}</TableCell> 
                      </TableRow> 
                    ))} 
                  </TableBody> 
                </Table> 
              )} 
            </CardContent> 
          </Card> 
        </div> 
      )} 
    </div> 
  ); 
}















