import React from 'react';
import { Button } from '../ui';

export function CartItem({ item, productInventory, onRemoveFromCart, onUpdateQuantity, onUpdateWeight }) { 
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
  const isConsumptionBased = pricingMethod === 'per_unit' && (unitLabel.includes('mes') || unitLabel.includes('servicio') || unitLabel.includes('consumo'));
  const displayQuantity = isWeightBased ? `${weight} ${unitLabel || 'peso'}` : quantity; 
  const canIncreaseQuantity = !isWeightBased && !isConsumptionBased && quantity < productInventory; 
  const canDecreaseQuantity = !isWeightBased && !isConsumptionBased && quantity > 1; 
  const hasDiscount = discountPercent > 0; 
  const baseTotal = isWeightBased ? price * weight : price * quantity; 
  const discountAmount = baseTotal * (discountPercent / 100); 
  const finalItemTotal = baseTotal - discountAmount; 
  
  const handleWeightClick = () => {
    if (isWeightBased && onUpdateWeight) {
      onUpdateWeight(item.cartItemId);
    }
  };
  
  return ( 
    <li className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"> 
      <div className="flex-grow min-w-0"> 
        <p className="text-base font-bold text-gray-800 mb-1">{item.name}</p> 
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600"> 
            ${price.toFixed(2)} / {isWeightBased ? (unitLabel || 'peso') : (isConsumptionBased ? (unitLabel || 'consumo') : 'u')}
          </span>
          {hasDiscount && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )} 
        </div> 
      </div> 
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1"> 
        {!isWeightBased && !isConsumptionBased && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 text-lg font-bold p-0 bg-white hover:bg-accent-100 border-accent-300 text-secondary-600" 
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)} 
            disabled={!canDecreaseQuantity}
          >
            −
          </Button>
        )} 
        <span 
          className={`text-base font-bold text-gray-800 min-w-[2.5rem] text-center ${isWeightBased ? 'cursor-pointer hover:bg-accent-100 px-2 py-1 rounded transition-colors' : ''}`}
          onClick={handleWeightClick}
          title={isWeightBased ? 'Haz clic para editar el peso' : ''}
        >
          {displayQuantity}
        </span> 
        {!isWeightBased && !isConsumptionBased && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 text-lg font-bold p-0 bg-white hover:bg-accent-100 border-accent-300 text-secondary-600" 
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)} 
            disabled={!canIncreaseQuantity}
          >
            +
          </Button>
        )} 
      </div> 
      <div className="flex flex-col items-end gap-1 min-w-[5rem]"> 
        {hasDiscount && (
          <span className="text-xs line-through text-gray-400">${baseTotal.toFixed(2)}</span>
        )} 
        <span className="text-lg font-bold text-primary-600">${finalItemTotal.toFixed(2)}</span> 
      </div> 
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-9 w-9 text-red-500 hover:bg-red-100 hover:text-red-700 flex-shrink-0 p-0 rounded-lg" 
        onClick={() => onRemoveFromCart(item.cartItemId)}
      > 
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg> 
      </Button> 
    </li> 
  ); 
}

