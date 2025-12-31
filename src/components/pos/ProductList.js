import React, { useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../ui';
import { ProductItem } from './ProductItem';

export function ProductList({ products, onAddToCart, searchTerm, onSearchChange, scaleReading, onScaleReadingChange }) { 
  const barcodeInputRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const barcodeTimeoutRef = useRef(null);
  const scaleBufferRef = useRef('');
  const scaleTimeoutRef = useRef(null);

  // Filtrar productos por nombre o código de barras
  const filteredProducts = useMemo(() => { 
    if (!searchTerm) return products; 
    // Asegurar que searchTerm sea una cadena
    const searchStr = typeof searchTerm === 'string' ? searchTerm : String(searchTerm || '');
    const searchLower = searchStr.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchLower))
    ); 
  }, [products, searchTerm]);

  // Manejar lectura de código de barras
  useEffect(() => {
    const handleBarcodeScan = (e) => {
      // Si el usuario está escribiendo en el campo de búsqueda, ignorar
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const char = e.key;
      
      // Los lectores de código de barras envían caracteres rápidamente seguidos de Enter
      if (char === 'Enter') {
        // Procesar el código de barras acumulado
        if (barcodeBufferRef.current.length > 0) {
          const barcode = barcodeBufferRef.current.trim();
          
          // Buscar producto por código de barras
          const product = products.find(p => p.barcode && p.barcode === barcode);
          
          if (product) {
            // Agregar al carrito automáticamente
            onAddToCart(product);
            // Limpiar búsqueda si había algo
            if (searchTerm && onSearchChange) {
              onSearchChange('');
            }
          } else {
            // Si no se encuentra, mostrar mensaje
            alert(`Producto con código de barras "${barcode}" no encontrado`);
          }
          
          // Limpiar buffer
          barcodeBufferRef.current = '';
        }
        
        // Limpiar timeout
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
          barcodeTimeoutRef.current = null;
        }
      } else if (char.length === 1) {
        // Agregar carácter al buffer
        barcodeBufferRef.current += char;
        
        // Resetear timeout si existe
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
        }
        
        // Si pasan más de 100ms sin caracteres, limpiar buffer (no es un escáner)
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 100);
      }
    };

    // Agregar listener global para capturar códigos de barras
    window.addEventListener('keydown', handleBarcodeScan);

    return () => {
      window.removeEventListener('keydown', handleBarcodeScan);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [products, onAddToCart, searchTerm, onSearchChange]);

  // Manejar lectura de báscula digital
  useEffect(() => {
    const handleScaleReading = (e) => {
      // Si el usuario está escribiendo en el campo de búsqueda, ignorar
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const char = e.key;
      
      // Las básculas digitales suelen enviar el peso seguido de Enter o un carácter especial
      // Algunas básculas envían el peso con un formato específico (ej: "1.250\n" o "1.250\r")
      if (char === 'Enter' || char === '\r') {
        // Procesar el peso acumulado
        if (scaleBufferRef.current.length > 0) {
          const weightStr = scaleBufferRef.current.trim();
          const weight = parseFloat(weightStr);
          
          // Validar que sea un número válido y positivo
          if (!isNaN(weight) && weight > 0) {
            // Notificar al componente padre sobre la lectura de báscula
            if (onScaleReadingChange) {
              onScaleReadingChange(weight);
              // Mostrar notificación visual
              console.log(`Lectura de báscula detectada: ${weight}`);
            }
          }
          
          // Limpiar buffer
          scaleBufferRef.current = '';
        }
        
        // Limpiar timeout
        if (scaleTimeoutRef.current) {
          clearTimeout(scaleTimeoutRef.current);
          scaleTimeoutRef.current = null;
        }
      } else if (char === '.' || (char >= '0' && char <= '9')) {
        // Agregar carácter al buffer (números y punto decimal)
        scaleBufferRef.current += char;
        
        // Resetear timeout si existe
        if (scaleTimeoutRef.current) {
          clearTimeout(scaleTimeoutRef.current);
        }
        
        // Si pasan más de 200ms sin caracteres, limpiar buffer (no es una báscula)
        scaleTimeoutRef.current = setTimeout(() => {
          scaleBufferRef.current = '';
        }, 200);
      } else if (char.length === 1) {
        // Si es otro carácter, podría ser el inicio de una nueva lectura
        // Algunas básculas envían caracteres especiales antes del peso
        scaleBufferRef.current = '';
      }
    };

    // Agregar listener global para capturar lecturas de báscula
    window.addEventListener('keydown', handleScaleReading);

    return () => {
      window.removeEventListener('keydown', handleScaleReading);
      if (scaleTimeoutRef.current) {
        clearTimeout(scaleTimeoutRef.current);
      }
    };
  }, [onScaleReadingChange]); 
  
  return ( 
    <div className="bg-white rounded-xl shadow-sm"> 
      <div className="sticky top-0 z-10 bg-gradient-to-r from-accent-50 to-accent-100 border-b border-accent-200 px-4 py-4 rounded-t-xl"> 
        <div className="flex flex-col gap-3"> 
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🛍️ Productos</h2> 
          <div className="w-full"> 
            <div className="relative">
              <Input 
                type="search" 
                placeholder="🔍 Buscar producto o escanear código..." 
                value={typeof searchTerm === 'string' ? searchTerm : String(searchTerm || '')} 
                onChange={(e) => {
                  const value = e.target?.value || '';
                  if (onSearchChange && typeof onSearchChange === 'function') {
                    onSearchChange(value);
                  }
                }}
                className="h-12 text-base bg-white border-2 border-accent-200 focus:border-secondary-400 rounded-lg shadow-sm"
                ref={barcodeInputRef}
                autoFocus={false}
              /> 
            </div>
            {(scaleReading !== null || searchTerm) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {scaleReading !== null && (
                  <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    ⚖️ Báscula: {scaleReading} kg
                  </span>
                )}
                {searchTerm && (
                  <span className="bg-accent-100 text-secondary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div> 
        </div> 
      </div> 
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"> 
        {filteredProducts.length > 0 ? ( 
          filteredProducts.map((product) => ( 
            <ProductItem key={product.id} product={product} onAddToCart={onAddToCart} /> 
          )) 
        ) : ( 
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg font-medium"> 
              No se encontraron productos {searchTerm ? `para "${searchTerm}"` : ''}
            </p> 
          </div>
        )} 
      </div> 
    </div> 
  ); 
}


