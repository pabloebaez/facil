import React, { useMemo } from 'react';
import { Button } from '../ui';
import { Checkout } from './Checkout';

export function CheckoutBar({
  cartItems,
  products,
  taxes,
  onCheckout,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  electronicInvoicingEnabled = false,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl z-50 border-t-2 border-secondary-500">
      <div className="container mx-auto max-w-7xl px-4">
        <Checkout
          cartItems={cartItems}
          products={products}
          taxes={taxes}
          onCheckout={onCheckout}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
          electronicInvoicingEnabled={electronicInvoicingEnabled}
        />
      </div>
    </div>
  );
}
