import React, { useMemo } from 'react';

// Función para generar un color basado en la categoría del producto
const getCategoryColor = (category) => {
  if (!category) category = 'default';
  
  // Colores predefinidos basados en categorías comunes
  const categoryColors = {
    'alimentos': ['#FF6B6B', '#FF8E53', '#FF6B9D'],
    'bebidas': ['#4ECDC4', '#44A08D', '#5BC0DE'],
    'limpieza': ['#95E1D3', '#A8E6CF', '#88D8A3'],
    'higiene': ['#F38181', '#FFB6B9', '#FFAAA5'],
    'electronica': ['#AA96DA', '#C5B9E8', '#B19CD9'],
    'ropa': ['#FFD93D', '#FFE66D', '#FFD700'],
    'hogar': ['#6BCB77', '#95D5B2', '#7FCDCD'],
    'default': ['#CB8D69', '#557B7D', '#A4B5B8']
  };
  
  // Buscar categoría (case insensitive)
  const categoryLower = category.toLowerCase();
  const matchedCategory = Object.keys(categoryColors).find(cat => 
    categoryLower.includes(cat) || cat.includes(categoryLower)
  );
  
  const colors = categoryColors[matchedCategory] || categoryColors['default'];
  
  // Generar un índice determinístico basado en el nombre de la categoría
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  
  return colors[index];
};

// Función para obtener las iniciales (dos caracteres)
const getInitials = (name) => {
  if (!name) return '??';
  
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // Si hay dos o más palabras, tomar la primera letra de las dos primeras
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    // Si solo hay una palabra, tomar las dos primeras letras
    return name.substring(0, 2).toUpperCase();
  }
};

export function ProductItem({ product, onAddToCart }) { 
  const hasStock = (parseInt(product.inventory) || 0) > 0; 
  const hasDiscount = (parseFloat(product.discountPercent) || 0) > 0; 
  // Asegurar que price sea un número
  const displayPrice = parseFloat(product.price) || 0; 
  const priceSuffix = (product.pricing_method === 'per_unit' || product.pricing_method === 'weight') ? ` / ${product.unit_label || 'unidad'}` : ''; 
  // Usar nombres de la API (snake_case) con fallback a camelCase para compatibilidad
  const pricingMethod = product.pricing_method || product.pricingMethod || 'fixed';
  const discountPercent = parseFloat(product.discount_percent || product.discountPercent || 0);
  const unitLabel = product.unit_label || product.unitLabel || '';
  const inventory = parseInt(product.inventory || 0, 10);
  const isConsumption = pricingMethod === 'consumption' || (pricingMethod === 'per_unit' && (unitLabel.includes('mes') || unitLabel.includes('servicio') || unitLabel.includes('consumo')));
  // Detectar productos por peso basándose en unit_label
  const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
  const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
  
  // Obtener categoría del producto (puede venir como category, category_id, o supplier)
  const category = product.category?.name || product.category_name || product.supplier?.name || product.supplier_name || 'default';
  const categoryColor = useMemo(() => getCategoryColor(category), [category]);
  const initials = useMemo(() => getInitials(product.name), [product.name]);
  const hasImage = product.image && product.image.trim() !== '';
  
  const handleClick = () => {
    if (hasStock || isConsumption) {
      onAddToCart(product);
    }
  };
  
  return ( 
    <div 
      className={`flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 active:scale-95 ${!hasStock && !isConsumption ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    > 
      {/* Imagen o placeholder con color de categoría */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {hasImage ? (
          <img 
            src={product.image} 
            alt={`Imagen de ${product.name}`} 
            className="w-full h-full object-cover" 
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center ${hasImage ? 'hidden' : 'flex'}`}
          style={{ backgroundColor: categoryColor }}
        >
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            {initials}
          </span>
        </div>
        
        {/* Badges superpuestos */}
        {hasDiscount && ( 
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-10"> 
            -{discountPercent}%
          </div> 
        )} 
        {isConsumption && ( 
          <div className="absolute top-2 left-2 bg-secondary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-10"> 
            ⚡ Servicio
          </div> 
        )}
        {isWeightBased && !isConsumption && ( 
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-10"> 
            ⚖️ Peso
          </div> 
        )}
      </div>
      
      {/* Información del producto */}
      <div className="flex-grow flex flex-col p-4 bg-white">
        <h3 className="font-bold text-sm sm:text-base mb-1.5 line-clamp-2 text-gray-800 leading-tight min-h-[2.5rem]">
          {product.name}
        </h3> 
        
        {/* Precio destacado */}
        <div className="mb-3 mt-auto"> 
          <span className="text-xl sm:text-2xl font-bold text-primary-600">
            ${displayPrice.toFixed(2)}
          </span>
          {priceSuffix && (
            <span className="text-xs text-gray-500 ml-1 block sm:inline">
              {priceSuffix}
            </span>
          )}
        </div> 
        
        {/* Stock badge */}
        <div className={`text-xs font-semibold px-3 py-1.5 rounded-full w-fit ${
          hasStock || isConsumption 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {!isConsumption ? `📦 ${inventory} disponibles` : '✨ Servicio'}
        </div> 
      </div> 
    </div> 
  ); 
}

