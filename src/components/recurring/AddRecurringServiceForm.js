import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Select } from '../ui';
import { formatDate } from '../../utils/helpers';

export function AddRecurringServiceForm({ customers, products, onAddService, onCancel }) { 
  const [customerId, setCustomerId] = useState(''); 
  const [productId, setProductId] = useState(''); 
  const [billingCycle, setBillingCycle] = useState('monthly'); 
  const [startDate, setStartDate] = useState(formatDate(new Date())); 
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (customerId && productId && billingCycle && startDate) { 
      onAddService({ customerId, productId, billingCycle, startDate, status: 'active', }); 
      onCancel(); 
    } else { 
      console.error("Por favor complete todos los campos requeridos."); 
    } 
  }; 
  
  const serviceProducts = useMemo(() => products.filter(p => p.pricingMethod === 'consumption' || !p.inventory), [products]); 
  
  return ( 
    <Card className="mb-6 border-purple-300"> 
      <CardHeader><CardTitle>Agregar Servicio Recurrente (Visual)</CardTitle></CardHeader> 
      <form onSubmit={handleSubmit}> 
        <CardContent className="space-y-4"> 
          <div> 
            <label htmlFor="recCustomer" className="block text-sm font-medium text-gray-700 mb-1">Cliente*</label> 
            <Select id="recCustomer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required> 
              <option value="">-- Seleccionar Cliente --</option> 
              {customers.filter(c => c.id !== 'CUST-001').map(c => ( 
                <option key={c.id} value={c.id}>{c.name} ({c.docNum})</option> 
              ))} 
            </Select> 
          </div> 
          <div> 
            <label htmlFor="recProduct" className="block text-sm font-medium text-gray-700 mb-1">Producto/Servicio*</label> 
            <Select id="recProduct" value={productId} onChange={(e) => setProductId(e.target.value)} required> 
              <option value="">-- Seleccionar Producto --</option> 
              {serviceProducts.map(p => ( 
                <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)} / {p.unitLabel})</option> 
              ))} 
              {products.filter(p => !serviceProducts.some(sp => sp.id === p.id)).map(p => ( 
                <option key={p.id} value={p.id}>{p.name} (Otro)</option> 
              ))} 
            </Select> 
          </div> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
            <div> 
              <label htmlFor="recCycle" className="block text-sm font-medium text-gray-700 mb-1">Ciclo Facturación*</label> 
              <Select id="recCycle" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} required> 
                <option value="weekly">Semanal</option> 
                <option value="biweekly">Quincenal</option> 
                <option value="monthly">Mensual</option> 
                <option value="bimonthly">Bi-Mensual</option> 
                <option value="quarterly">Trimestral</option> 
                <option value="semiannually">Semestral</option> 
                <option value="annually">Anual</option> 
              </Select> 
            </div> 
            <div> 
              <label htmlFor="recStart" className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio*</label> 
              <Input id="recStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /> 
            </div> 
          </div> 
        </CardContent> 
        <CardFooter className="justify-end gap-2"> 
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> 
          <Button type="submit">Guardar Servicio</Button> 
        </CardFooter> 
      </form> 
    </Card> 
  ); 
}















