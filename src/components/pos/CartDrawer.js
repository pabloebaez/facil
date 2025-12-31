import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../ui';
import { CartItem } from './CartItem';

export function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  products, 
  taxes, 
  onRemoveFromCart, 
  onUpdateQuantity, 
  onUpdateWeight, 
  onClearCart, 
  onSaveCart, 
  savedCartsCount, 
  onToggleSavedCarts 
}) {
  const { subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown } = useMemo(() => {
    let currentSubtotal = 0;
    let currentTotalDiscount = 0;
    let currentSubtotalAfterDiscounts = 0;
    let currentTotalTax = 0;
    const currentTaxBreakdown = {};
    
    cartItems.forEach(item => {
      const price = parseFloat(item.price || 0);
      const quantity = parseFloat(item.quantity || 0);
      const weight = parseFloat(item.weight || 0);
      const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0);
      const pricingMethod = item.pricing_method || item.pricingMethod || 'fixed';
      const unitLabel = item.unit_label || item.unitLabel || '';
      
      const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
      const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
      const baseItemTotal = isWeightBased ? price * weight : price * quantity;
      currentSubtotal += baseItemTotal;
      const itemDiscountAmount = baseItemTotal * (discountPercent / 100);
      currentTotalDiscount += itemDiscountAmount;
      const itemSubtotalAfterDiscount = baseItemTotal - itemDiscountAmount;
      currentSubtotalAfterDiscounts += itemSubtotalAfterDiscount;
      
      const product = products.find(p => p.id === item.id);
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
  
  const getInventory = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.inventory : 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <CardHeader className="flex-shrink-0 border-b-2 border-accent-200 bg-gradient-to-r from-accent-50 to-accent-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold text-gray-800">🛒 Carrito</CardTitle>
              {cartItems.length > 0 && (
                <span className="bg-secondary-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                  {cartItems.length}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-4 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <div className="text-7xl mb-4">🛒</div>
              <p className="text-xl font-semibold text-gray-500 mb-2">El carrito está vacío</p>
              <p className="text-sm text-gray-400 text-center">Agregue productos para comenzar</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <CartItem 
                    key={item.cartItemId} 
                    item={item} 
                    productInventory={getInventory(item.id)} 
                    onRemoveFromCart={onRemoveFromCart} 
                    onUpdateQuantity={onUpdateQuantity} 
                    onUpdateWeight={onUpdateWeight}
                  />
                ))}
              </ul>
              
              {/* Resumen del carrito */}
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border-2 border-accent-200 space-y-2 text-sm sticky bottom-0 shadow-sm">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">💰 Descuentos:</span>
                    <span className="font-bold">-${totalDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {Object.entries(taxBreakdown).map(([taxName, taxAmount]) => (
                  <div key={taxName} className="flex justify-between text-gray-600">
                    <span>{taxName}:</span>
                    <span className="font-semibold">+${taxAmount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold text-secondary-700 pt-2 mt-2 border-t border-accent-300">
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {cartItems.length > 0 && (
          <CardFooter className="flex-shrink-0 border-t-2 border-accent-200 bg-gray-50 px-4 py-3 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-accent-100 hover:bg-accent-200 text-secondary-700 font-semibold border-accent-300" 
              onClick={onSaveCart}
            >
              💾 Guardar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearCart} 
              className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold border-red-300"
            >
              🗑️ Vaciar
            </Button>
          </CardFooter>
        )}
      </div>
    </>
  );
}

