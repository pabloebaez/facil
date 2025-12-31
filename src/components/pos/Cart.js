import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '../ui';
import { CartItem } from './CartItem';

export function Cart({ cartItems, products, taxes, onRemoveFromCart, onUpdateQuantity, onUpdateWeight, onClearCart, onSaveCart, savedCartsCount, onToggleSavedCarts }) { 
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
      const pricingMethod = item.pricing_method || item.pricingMethod || 'fixed';
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
      // La API devuelve taxes como array de objetos, necesitamos extraer los IDs
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
  
  return ( 
    <div className="h-full flex flex-col bg-white rounded-xl shadow-md border border-gray-200"> 
      <div className="flex justify-between items-center bg-gradient-to-r from-accent-50 to-accent-100 px-4 py-4 border-b-2 border-accent-200 rounded-t-xl"> 
        <div className="flex items-center gap-3"> 
          <h2 className="text-xl font-bold text-gray-800">🛒 Carrito</h2> 
          {cartItems.length > 0 && (
            <span className="bg-secondary-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
              {cartItems.length}
            </span>
          )}
        </div> 
        <div className="flex gap-2">
          {savedCartsCount > 0 && (
            <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-accent-50" onClick={onToggleSavedCarts}> 
              💾 ({savedCartsCount}) 
            </Button>
          )}
          {cartItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearCart} className="text-xs text-red-600 hover:bg-red-50 bg-white">
              🗑️ Vaciar
            </Button>
          )}
        </div>
      </div> 
      <div className="flex-1 overflow-y-auto p-4"> 
        {cartItems.length === 0 ? ( 
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="text-7xl mb-4">🛒</div>
            <p className="text-xl font-semibold text-gray-500 mb-2">El carrito está vacío</p>
            <p className="text-sm text-gray-400">Agregue productos para comenzar</p>
          </div>
        ) : ( 
          <>
            <ul className="space-y-3 mb-4"> 
              {cartItems.map((item) => ( 
                <CartItem key={item.cartItemId} item={item} productInventory={getInventory(item.id)} onRemoveFromCart={onRemoveFromCart} onUpdateQuantity={onUpdateQuantity} onUpdateWeight={onUpdateWeight}/> 
              ))} 
            </ul>
            {/* Resumen del carrito */}
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border-2 border-accent-200 space-y-2 sticky bottom-0 shadow-sm"> 
              <div className="flex justify-between text-gray-700 text-sm">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              {totalDiscountAmount > 0 && ( 
                <div className="flex justify-between text-green-600 text-sm"> 
                  <span className="font-medium">💰 Descuentos:</span> 
                  <span className="font-bold">-${totalDiscountAmount.toFixed(2)}</span> 
                </div> 
              )} 
              {Object.entries(taxBreakdown).map(([taxName, taxAmount]) => ( 
                <div key={taxName} className="flex justify-between text-gray-600 text-sm"> 
                  <span>{taxName}:</span> 
                  <span className="font-semibold">+${taxAmount.toFixed(2)}</span> 
                </div> 
              ))} 
              <div className="border-t border-accent-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-secondary-700">
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )} 
      </div> 
      {cartItems.length > 0 && ( 
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 rounded-b-xl"> 
          <Button variant="secondary" size="sm" className="w-full bg-accent-100 hover:bg-accent-200 text-secondary-700 font-semibold" onClick={onSaveCart}> 
            💾 Guardar Carrito
          </Button> 
        </div> 
      )} 
    </div> 
  ); 
}

