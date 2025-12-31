import React from 'react';
import { Button } from '../ui';

export function MobileCartButton({ cartItemsCount, total, onClick }) {
  if (cartItemsCount === 0) {
    return (
      <Button
        onClick={onClick}
        className="fixed bottom-24 right-4 h-16 w-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 shadow-xl z-40 flex items-center justify-center border-2 border-white"
        size="lg"
      >
        <span className="text-2xl">🛒</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-4 h-auto min-h-[64px] px-5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 shadow-2xl z-40 flex items-center gap-3 border-2 border-white"
      size="lg"
    >
      <div className="relative">
        <span className="text-2xl">🛒</span>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white">
          {cartItemsCount}
        </span>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs text-white/90 font-medium">Ver Carrito</span>
        <span className="text-base font-bold text-white">${total.toFixed(2)}</span>
      </div>
    </Button>
  );
}

