import React, { useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';

export function SavedCartsView({ savedCarts, customers, onLoadCart, onDeleteSavedCart }) { 
  const getCustomerName = useCallback((customerId) => { 
    const customer = customers.find(c => c.id === customerId); 
    return customer ? customer.name : 'Cliente General'; 
  }, [customers]); 
  
  return ( 
    <Card className="mt-6"> 
      <CardHeader> 
        <CardTitle>Carritos Guardados</CardTitle> 
      </CardHeader> 
      <CardContent> 
        {savedCarts.length === 0 ? ( 
          <p className="text-gray-500 text-center py-4">No hay carritos guardados.</p> 
        ) : ( 
          <ul className="space-y-3"> 
            {savedCarts.map(cart => ( 
              <li key={cart.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50 hover:bg-gray-100"> 
                <div> 
                  <p className="text-sm font-medium"> 
                    Guardado: {new Date(cart.timestamp).toLocaleTimeString()} 
                  </p> 
                  <p className="text-xs text-gray-600"> 
                    Cliente: {getCustomerName(cart.customerId)} ({cart.items.length} items) 
                  </p> 
                </div> 
                <div className="flex gap-2"> 
                  <Button size="sm" variant="secondary" onClick={() => onLoadCart(cart.id)}> 
                    Cargar 
                  </Button> 
                  <Button size="sm" variant="destructive" onClick={() => onDeleteSavedCart(cart.id)}> 
                    Borrar 
                  </Button> 
                </div> 
              </li> 
            ))} 
          </ul> 
        )} 
      </CardContent> 
    </Card> 
  ); 
}















