import React from 'react';

export function InvoiceView({ saleData, companyInfo, customers }) { 
  if (!saleData) return null; 
  const { id, timestamp, items, subtotal, totalTaxAmount, finalTotal, taxBreakdownDetails, customerId, totalDiscountAmount } = saleData; 
  const customer = customers.find(c => c.id === customerId && c.id !== 'CUST-001'); 
  
  return ( 
    <div className="invoice-container p-6 bg-white text-gray-900 font-sans text-sm"> 
      <div className="flex justify-between items-start mb-4"> 
        <div className="w-2/3"> 
          {companyInfo.logoUrl && ( 
            <img src={companyInfo.logoUrl} alt={`Logo de ${companyInfo.name}`} className="max-h-16 mb-2" onError={(e) => { e.target.style.display='none'; }} /> 
          )} 
          <h1 className="text-xl font-bold mb-1">{companyInfo.name || 'Nombre Empresa'}</h1> 
          <p>{companyInfo.address || 'Dirección Empresa'}</p> 
          <p>{companyInfo.phone || 'Teléfono Empresa'}</p> 
          <p>{companyInfo.taxId || 'ID Fiscal Empresa'}</p> 
        </div> 
        <div className="text-right w-1/3"> 
          <h2 className="text-2xl font-bold mb-1">FACTURA</h2> 
          <p><strong>No:</strong> {id}</p> 
          <p><strong>Fecha:</strong> {new Date(timestamp).toLocaleString()}</p> 
        </div> 
      </div> 
      {customer && ( 
        <div className="mb-4 p-2 border rounded bg-gray-50"> 
          <h3 className="font-semibold text-xs mb-1">Cliente:</h3> 
          <p>{customer.name}</p> 
          <p>{customer.docType} {customer.docNum}</p> 
          <p>{customer.address}</p> 
          <p>{customer.phone} - {customer.email}</p> 
        </div> 
      )} 
      <table className="w-full mb-6 border-collapse"> 
        <thead> 
          <tr className="border-b-2 border-gray-700"> 
            <th className="text-left py-2 px-1">Cant./Peso</th> 
            <th className="text-left py-2 px-1">Descripción</th> 
            <th className="text-right py-2 px-1">Precio Unit.</th> 
            <th className="text-right py-2 px-1">Dcto (%)</th> 
            <th className="text-right py-2 px-1">Total</th> 
          </tr> 
        </thead> 
        <tbody> 
          {items.map(item => { 
            const isWeightBased = item.pricingMethod === 'weight'; 
            const displayQty = isWeightBased ? `${item.weight} ${item.unitLabel}` : item.quantity; 
            const discountedPrice = item.price * (1 - (item.discountPercent / 100)); 
            const itemTotal = isWeightBased ? discountedPrice * item.weight : discountedPrice * item.quantity; 
            return ( 
              <tr key={item.cartItemId} className="border-b border-gray-300"> 
                <td className="py-1 px-1 text-center">{displayQty}</td> 
                <td className="py-1 px-1">{item.name}</td> 
                <td className="text-right py-1 px-1">${item.price.toFixed(2)}{isWeightBased ? `/${item.unitLabel}` : ''}</td> 
                <td className="text-right py-1 px-1">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td> 
                <td className="text-right py-1 px-1">${itemTotal.toFixed(2)}</td> 
              </tr> 
            );})} 
        </tbody> 
      </table> 
      <div className="flex justify-end mb-6"> 
        <div className="w-full max-w-xs space-y-1"> 
          <div className="flex justify-between"> 
            <span>Subtotal (antes dcto):</span> 
            <span>${subtotal.toFixed(2)}</span> 
          </div> 
          {totalDiscountAmount > 0 && ( 
            <div className="flex justify-between text-red-600"> 
              <span>Descuentos:</span> 
              <span>- ${totalDiscountAmount.toFixed(2)}</span> 
            </div> 
          )} 
          {taxBreakdownDetails && Object.entries(taxBreakdownDetails).map(([taxName, taxAmount]) => ( 
            <div key={taxName} className="flex justify-between text-gray-600"> 
              <span>{taxName}:</span> 
              <span>+ ${taxAmount.toFixed(2)}</span> 
            </div> 
          ))} 
          <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-1 mt-1"> 
            <span>TOTAL:</span> 
            <span>${finalTotal.toFixed(2)}</span> 
          </div> 
        </div> 
      </div> 
      {companyInfo.footerNote && ( 
        <div className="text-center text-xs text-gray-600 border-t pt-2"> 
          <p>{companyInfo.footerNote}</p> 
        </div> 
      )} 
    </div> 
  ); 
}















