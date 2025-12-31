import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../ui';

export function Checkout({ cartItems, products, taxes, onCheckout, customers, selectedCustomerId, onSelectCustomer, electronicInvoicingEnabled = false }) { 
  const [customerSearch, setCustomerSearch] = useState(''); 
  const [isListVisible, setIsListVisible] = useState(false); 
  const [documentType, setDocumentType] = useState('ticket'); // 'ticket' o 'electronic_invoice'
  const searchInputRef = useRef(null); 
  const listRef = useRef(null); 
  
  const { subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown } = useMemo(() => { 
    let currentSubtotal = 0; 
    let currentTotalDiscount = 0; 
    let currentSubtotalAfterDiscounts = 0; 
    let currentTotalTax = 0; 
    const currentTaxBreakdown = {}; 
    
    cartItems.forEach(item => { 
      // Convertir valores numéricos y usar nombres de API con fallback
      const price = parseFloat(item.price || 0);
      const quantity = parseFloat(item.quantity || 0);
      const weight = parseFloat(item.weight || 0);
      const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0);
      const pricingMethod = item.pricing_method || item.pricingMethod || 'unit';
      const unitLabel = item.unit_label || item.unitLabel || '';
      
      // Detectar productos por peso basándose en unit_label
      const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
      const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
      const baseItemTotal = isWeightBased ? price * weight : price * quantity; 
      currentSubtotal += baseItemTotal; 
      const itemDiscountAmount = baseItemTotal * (discountPercent / 100); 
      currentTotalDiscount += itemDiscountAmount; 
      const itemSubtotalAfterDiscount = baseItemTotal - itemDiscountAmount; 
      currentSubtotalAfterDiscounts += itemSubtotalAfterDiscount; 
      
      const product = products.find(p => p.id === item.id); 
      // La API devuelve taxes como array de objetos
      const productTaxIds = product ? (product.taxes ? product.taxes.map(t => t.id) : (product.taxIds || [])) : []; 
      const applicableTaxes = taxes.filter(tax => tax.enabled && productTaxIds.includes(tax.id)); 
      
      applicableTaxes.forEach(tax => { 
        const taxAmountForItem = itemSubtotalAfterDiscount * (tax.rate / 100); 
        currentTotalTax += taxAmountForItem; 
        if (currentTaxBreakdown[tax.name]) { 
          currentTaxBreakdown[tax.name] += taxAmountForItem; 
        } else { 
          currentTaxBreakdown[tax.name] = taxAmountForItem; 
        } 
      }); 
    }); 
    
    return { 
      subtotal: currentSubtotal, 
      totalDiscountAmount: currentTotalDiscount, 
      subtotalAfterDiscounts: currentSubtotalAfterDiscounts, 
      totalTaxAmount: currentTotalTax, 
      finalTotal: currentSubtotalAfterDiscounts + currentTotalTax, 
      taxBreakdown: currentTaxBreakdown 
    }; 
  }, [cartItems, products, taxes]); 
  
  const selectedCustomerName = useMemo(() => { 
    const customer = customers.find(c => c.id === selectedCustomerId); 
    if (!customer) return 'Cliente General';
    const docNum = customer.doc_num || customer.docNum || '';
    return `${customer.name} (${docNum})`; 
  }, [selectedCustomerId, customers]); 
  
  const filteredCustomers = useMemo(() => { 
    if (!customerSearch) return customers; 
    const searchTerm = customerSearch.toLowerCase(); 
    return customers.filter(c => {
      const name = (c.name || '').toLowerCase();
      const docNum = ((c.doc_num || c.docNum) || '').toLowerCase();
      return name.includes(searchTerm) || docNum.includes(searchTerm);
    }); 
  }, [customerSearch, customers]); 
  
  const handleSearchChange = (e) => { 
    setCustomerSearch(e.target.value); 
    setIsListVisible(true); 
  }; 
  
  const handleCustomerSelect = (customerId) => { 
    onSelectCustomer(customerId); 
    setCustomerSearch(''); 
    setIsListVisible(false); 
  }; 
  
  const handleFocus = () => { 
    setIsListVisible(true); 
  }; 
  
  const handleBlur = () => { 
    setTimeout(() => { 
      if (listRef.current && !listRef.current.contains(document.activeElement)) { 
        setIsListVisible(false); 
      } 
    }, 150); 
  }; 
  
  const handleCheckoutClick = () => { 
    if (cartItems.length === 0) { 
      console.warn("El carrito está vacío."); 
      return; 
    } 
    onCheckout({ 
      subtotal, 
      totalDiscountAmount, 
      subtotalAfterDiscounts, 
      totalTaxAmount, 
      finalTotal, 
      taxBreakdown, 
      customerId: selectedCustomerId,
      documentType: electronicInvoicingEnabled ? documentType : 'ticket' // Solo enviar si está habilitada
    }); 
  }; 
  
  return ( 
    <div className="bg-white border-t-2 border-secondary-500 shadow-lg"> 
      <div className="flex items-center gap-3 p-3"> 
        {/* Cliente compacto - solo si hay items */}
        {cartItems.length > 0 && (
          <div className="relative flex-shrink-0 w-48">
            <Input 
              ref={searchInputRef} 
              type="search" 
              placeholder="👤 Cliente..." 
              value={customerSearch} 
              onChange={handleSearchChange} 
              onFocus={handleFocus} 
              onBlur={handleBlur} 
              autoComplete="off"
              className="h-9 text-sm bg-gray-50 border-gray-300 focus:border-secondary-400"
            />
            {selectedCustomerId && !customerSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1 h-7 w-7 p-0 text-red-500 hover:bg-red-100" 
                onClick={() => handleCustomerSelect(null)} 
                title="Quitar cliente"
              >
                ✕
              </Button>
            )}
            {isListVisible && filteredCustomers.length > 0 && ( 
              <ul ref={listRef} className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-40 overflow-y-auto text-sm z-50"> 
                {filteredCustomers.map(customer => ( 
                  <li 
                    key={customer.id} 
                    className="px-3 py-2 hover:bg-accent-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
                    onMouseDown={() => handleCustomerSelect(customer.id)}> 
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      ({customer.doc_num || customer.docNum})
                    </span>
                  </li> 
                ))} 
              </ul> 
            )}
          </div>
        )}

        {/* Tipo de documento compacto - solo si facturación electrónica está habilitada */}
        {electronicInvoicingEnabled && cartItems.length > 0 && (
          <div className="flex gap-2 bg-gray-50 rounded-lg p-1 border border-gray-300">
            <button
              type="button"
              onClick={() => setDocumentType('ticket')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                documentType === 'ticket' 
                  ? 'bg-secondary-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ticket
            </button>
            <button
              type="button"
              onClick={() => setDocumentType('electronic_invoice')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                documentType === 'electronic_invoice' 
                  ? 'bg-secondary-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Factura
            </button>
          </div>
        )}

        {/* Total y botón de pago */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {cartItems.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-2xl font-bold text-primary-600">${finalTotal.toFixed(2)}</div>
            </div>
          )}
          <Button 
            onClick={handleCheckoutClick} 
            className={`font-bold px-6 py-2.5 rounded-lg transition-all ${
              cartItems.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white shadow-md hover:shadow-lg'
            }`}
            disabled={cartItems.length === 0}
          >
            {cartItems.length === 0 ? 'Agregar productos' : '💳 Procesar Pago'}
          </Button>
        </div>
      </div> 
    </div> 
  ); 
}

