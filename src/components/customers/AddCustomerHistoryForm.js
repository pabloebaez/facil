import React, { useState } from 'react';
import { Button, Textarea } from '../ui';

export function AddCustomerHistoryForm({ customerId, onAddHistory, onCancel }) { 
  const [details, setDetails] = useState(''); 
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (details.trim()) { 
      onAddHistory(customerId, { details: details.trim(), type: 'note', timestamp: Date.now() }); 
      setDetails(''); 
    } 
  }; 
  
  return ( 
    <form onSubmit={handleSubmit} className="mt-2 space-y-2"> 
      <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Escribir nota o reporte..." rows={2} required className="text-sm"/> 
      <div className="flex justify-end gap-2"> 
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cerrar</Button> 
        <Button type="submit" size="sm">Agregar Nota</Button> 
      </div> 
    </form> 
  ); 
}















