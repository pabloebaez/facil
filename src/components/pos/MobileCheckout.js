import React, { useState, useMemo, useRef } from 'react';
import { Button, Input } from '../ui';

export function MobileCheckout({ 
  cartItems, 
  products, 
  taxes, 
  onCheckout, 
  customers, 
  selectedCustomerId, 
  onSelectCustomer, 
  electronicInvoicingEnabled = false 
}) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [isListVisible, setIsListVisible] = useState(false);
  const [documentType, setDocumentType] = useState('ticket');
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const finalTotal = useMemo(() => {
    if (!cartItems || cartItems.length === 0) {
      return 0;
    }

    let currentSubtotal = 0;
    let currentTotalDiscount = 0;
    let currentTotalTax = 0;

    cartItems.forEach(item => {
      const price = parseFloat(item.price || 0) || 0;
      const quantity = parseFloat(item.quantity || 0) || 0;
      const weight = parseFloat(item.weight || 0) || 0;
      const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0) || 0;
      const pricingMethod = item.pricing_method || item.pricingMethod || 'fixed';
      const unitLabel = item.unit_label || item.unitLabel || '';
      
      const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
      const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
      const baseItemTotal = isWeightBased ? price * weight : price * quantity;
      currentSubtotal += baseItemTotal || 0;
      const itemDiscountAmount = (baseItemTotal || 0) * ((discountPercent || 0) / 100);
      currentTotalDiscount += itemDiscountAmount || 0;
      const itemSubtotalAfterDiscount = (baseItemTotal || 0) - (itemDiscountAmount || 0);
      
      const product = products?.find(p => p.id === item.id);
      const productTaxIds = product ? (product.taxes ? product.taxes.map(t => t.id) : (product.taxIds || [])) : [];
      const applicableTaxes = (taxes || []).filter(tax => tax?.enabled && productTaxIds.includes(tax.id));
      
      applicableTaxes.forEach(tax => {
        const taxRate = parseFloat(tax.rate || 0) || 0;
        const taxAmountForItem = (itemSubtotalAfterDiscount || 0) * (taxRate / 100);
        currentTotalTax += taxAmountForItem || 0;
      });
    });

    const total = (currentSubtotal || 0) - (currentTotalDiscount || 0) + (currentTotalTax || 0);
    return isNaN(total) || !isFinite(total) ? 0 : total;
  }, [cartItems, products, taxes]);

  const selectedCustomerName = useMemo(() => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;
    return customer.name;
  }, [selectedCustomerId, customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5); // Limitar a 5 en móvil
    const searchTerm = customerSearch.toLowerCase();
    return customers.filter(c => {
      const name = (c.name || '').toLowerCase();
      const docNum = ((c.doc_num || c.docNum) || '').toLowerCase();
      return name.includes(searchTerm) || docNum.includes(searchTerm);
    }).slice(0, 5);
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

  const checkoutData = useMemo(() => {
    if (!cartItems || cartItems.length === 0) {
      return {
        subtotal: 0,
        totalDiscountAmount: 0,
        subtotalAfterDiscounts: 0,
        totalTaxAmount: 0,
        finalTotal: 0,
        taxBreakdown: {}
      };
    }

    let currentSubtotal = 0;
    let currentTotalDiscount = 0;
    let currentTotalTax = 0;
    const currentTaxBreakdown = {};

    cartItems.forEach(item => {
      const price = parseFloat(item.price || 0) || 0;
      const quantity = parseFloat(item.quantity || 0) || 0;
      const weight = parseFloat(item.weight || 0) || 0;
      const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0) || 0;
      const pricingMethod = item.pricing_method || item.pricingMethod || 'fixed';
      const unitLabel = item.unit_label || item.unitLabel || '';
      
      const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
      const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
      const baseItemTotal = isWeightBased ? price * weight : price * quantity;
      currentSubtotal += baseItemTotal || 0;
      const itemDiscountAmount = (baseItemTotal || 0) * ((discountPercent || 0) / 100);
      currentTotalDiscount += itemDiscountAmount || 0;
      const itemSubtotalAfterDiscount = (baseItemTotal || 0) - (itemDiscountAmount || 0);
      
      const product = products?.find(p => p.id === item.id);
      const productTaxIds = product ? (product.taxes ? product.taxes.map(t => t.id) : (product.taxIds || [])) : [];
      const applicableTaxes = (taxes || []).filter(tax => tax?.enabled && productTaxIds.includes(tax.id));
      
      applicableTaxes.forEach(tax => {
        const taxRate = parseFloat(tax.rate || 0) || 0;
        const taxAmountForItem = (itemSubtotalAfterDiscount || 0) * (taxRate / 100);
        currentTotalTax += taxAmountForItem || 0;
        if (currentTaxBreakdown[tax.name]) {
          currentTaxBreakdown[tax.name] += taxAmountForItem || 0;
        } else {
          currentTaxBreakdown[tax.name] = taxAmountForItem || 0;
        }
      });
    });

    const subtotal = currentSubtotal || 0;
    const totalDiscountAmount = currentTotalDiscount || 0;
    const subtotalAfterDiscounts = subtotal - totalDiscountAmount;
    const totalTaxAmount = currentTotalTax || 0;
    const finalTotal = subtotalAfterDiscounts + totalTaxAmount;

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      totalDiscountAmount: isNaN(totalDiscountAmount) ? 0 : totalDiscountAmount,
      subtotalAfterDiscounts: isNaN(subtotalAfterDiscounts) ? 0 : subtotalAfterDiscounts,
      totalTaxAmount: isNaN(totalTaxAmount) ? 0 : totalTaxAmount,
      finalTotal: isNaN(finalTotal) || !isFinite(finalTotal) ? 0 : finalTotal,
      taxBreakdown: currentTaxBreakdown
    };
  }, [cartItems, products, taxes]);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    
    onCheckout({
      ...checkoutData,
      customerId: selectedCustomerId,
      documentType: electronicInvoicingEnabled ? documentType : 'ticket'
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-secondary-500 shadow-xl z-30">
      <div className="px-3 py-2">
        {/* Cliente compacto - solo si hay items */}
        {cartItems.length > 0 && (
          <div className="relative mb-2">
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={selectedCustomerName || "👤 Cliente"}
              value={customerSearch}
              onChange={handleSearchChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
              className="text-sm h-9 bg-gray-50 border-gray-300 focus:border-secondary-400"
            />
            {selectedCustomerId && !customerSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0 text-red-500 hover:bg-red-100"
                onClick={() => handleCustomerSelect(null)}
              >
                ✕
              </Button>
            )}
            {isListVisible && filteredCustomers.length > 0 && (
              <ul ref={listRef} className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-32 overflow-y-auto text-sm z-50">
                {filteredCustomers.map(customer => (
                  <li
                    key={customer.id}
                    className="px-3 py-2 hover:bg-accent-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onMouseDown={() => handleCustomerSelect(customer.id)}
                  >
                    <span className="font-medium text-gray-800">{customer.name}</span>
                    <span className="text-gray-500 text-xs ml-1">
                      ({customer.doc_num || customer.docNum})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Botón de pago compacto */}
        <Button
          onClick={handleCheckoutClick}
          className={`w-full font-bold py-2.5 rounded-lg transition-all ${
            cartItems.length === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed text-sm' 
              : 'bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white shadow-md'
          }`}
          disabled={cartItems.length === 0}
        >
          <div className="flex items-center justify-between w-full">
            <span>
              {cartItems.length === 0 ? '📦 Agregue productos' : '💳 Procesar Pago'}
            </span>
            {cartItems.length > 0 && finalTotal !== undefined && (
              <span className="text-lg font-bold">
                ${(finalTotal || 0).toFixed(2)}
              </span>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}

