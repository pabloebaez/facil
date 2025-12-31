import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input } from '../ui';

export function AddExpenseForm({ onAddExpense, onCancel }) { 
  const [description, setDescription] = useState(''); 
  const [amount, setAmount] = useState(''); 
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    const parsedAmount = parseFloat(amount); 
    if (description.trim() && !isNaN(parsedAmount) && parsedAmount > 0) { 
      onAddExpense({ description: description.trim(), amount: parsedAmount }); 
      onCancel(); 
    } else { 
      console.error("Descripción y monto válido son requeridos para el egreso."); 
    } 
  }; 
  
  return ( 
    <Card className="mb-6 border-red-300"> 
      <CardHeader><CardTitle>Registrar Egreso de Caja</CardTitle></CardHeader> 
      <form onSubmit={handleSubmit}> 
        <CardContent className="space-y-4"> 
          <div> 
            <label htmlFor="expenseDesc" className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label> 
            <Input id="expenseDesc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ej: Pago servicios"/> 
          </div> 
          <div> 
            <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto*</label> 
            <Input id="expenseAmount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0.01" placeholder="0.00"/> 
          </div> 
        </CardContent> 
        <CardFooter className="justify-end gap-2"> 
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> 
          <Button type="submit" variant="destructive">Registrar Egreso</Button> 
        </CardFooter> 
      </form> 
    </Card> 
  ); 
}















