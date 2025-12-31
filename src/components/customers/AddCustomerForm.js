import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Select } from '../ui';

export function AddCustomerForm({ onAddCustomer, onCancel }) { 
  const [docType, setDocType] = useState('CC'); 
  const [docNum, setDocNum] = useState(''); 
  const [name, setName] = useState(''); 
  const [address, setAddress] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); 
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (docNum.trim() && name.trim()) { 
      onAddCustomer({ 
        docType, 
        docNum: docNum.trim(), 
        name: name.trim(), 
        address: address.trim() || 'N/A', 
        email: email.trim() || 'N/A', 
        phone: phone.trim() || 'N/A', 
        historyLog: [] 
      }); 
      onCancel(); 
    } else { 
      console.error("Tipo/Número de documento y Nombre son requeridos."); 
    } 
  }; 
  
  return ( 
    <Card className="mb-6 border-green-300"> 
      <CardHeader> 
        <CardTitle>Agregar Nuevo Cliente</CardTitle> 
      </CardHeader> 
      <form onSubmit={handleSubmit}> 
        <CardContent className="space-y-4"> 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
            <div> 
              <label htmlFor="custDocType" className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.*</label> 
              <Select id="custDocType" value={docType} onChange={(e) => setDocType(e.target.value)}> 
                <option value="CC">CC</option> 
                <option value="NIT">NIT</option> 
                <option value="CE">CE</option> 
                <option value="Pasaporte">Pasaporte</option> 
                <option value="Otro">Otro</option> 
              </Select> 
            </div> 
            <div> 
              <label htmlFor="custDocNum" className="block text-sm font-medium text-gray-700 mb-1">Número Doc.*</label> 
              <Input id="custDocNum" value={docNum} onChange={(e) => setDocNum(e.target.value)} required /> 
            </div> 
            <div> 
              <label htmlFor="custName" className="block text-sm font-medium text-gray-700 mb-1">Nombre/Razón Social*</label> 
              <Input id="custName" value={name} onChange={(e) => setName(e.target.value)} required /> 
            </div> 
          </div> 
          <div> 
            <label htmlFor="custAddress" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label> 
            <Input id="custAddress" value={address} onChange={(e) => setAddress(e.target.value)} /> 
          </div> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
            <div> 
              <label htmlFor="custEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label> 
              <Input id="custEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /> 
            </div> 
            <div> 
              <label htmlFor="custPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label> 
              <Input id="custPhone" value={phone} onChange={(e) => setPhone(e.target.value)} /> 
            </div> 
          </div> 
        </CardContent> 
        <CardFooter className="justify-end gap-2"> 
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> 
          <Button type="submit">Guardar Cliente</Button> 
        </CardFooter> 
      </form> 
    </Card> 
  ); 
}















