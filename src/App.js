import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// --- Mock Data ---
const initialProductsData = [
  // Added discountPercent to each product
  { id: 1, name: 'Café Americano', price: 2.50, costPrice: 0.80, inventory: 20, image: 'https://placehold.co/100x100/A9A9A9/FFFFFF?text=Caf%C3%A9', taxIds: [1], discountPercent: 0 },
  { id: 2, name: 'Croissant', price: 1.80, costPrice: 0.60, inventory: 15, image: 'https://placehold.co/100x100/D2B48C/FFFFFF?text=Croissant', taxIds: [1], discountPercent: 10 }, // Example 10% discount
  { id: 3, name: 'Jugo de Naranja', price: 3.00, costPrice: 1.00, inventory: 10, image: 'https://placehold.co/100x100/FFA500/FFFFFF?text=Jugo', taxIds: [], discountPercent: 0 },
  { id: 4, name: 'Sandwich de Pavo', price: 5.50, costPrice: 2.50, inventory: 8, image: 'https://placehold.co/100x100/8B4513/FFFFFF?text=Sandwich', taxIds: [1, 2], discountPercent: 0 },
  { id: 5, name: 'Ensalada César', price: 6.00, costPrice: 2.80, inventory: 5, image: 'https://placehold.co/100x100/90EE90/FFFFFF?text=Ensalada', taxIds: [1], discountPercent: 5 }, // Example 5% discount
  { id: 6, name: 'Agua Mineral', price: 1.50, costPrice: 0.40, inventory: 30, image: 'https://placehold.co/100x100/ADD8E6/FFFFFF?text=Agua', taxIds: [], discountPercent: 0 },
  { id: 7, name: 'Té Helado', price: 2.20, costPrice: 0.70, inventory: 0, image: 'https://placehold.co/100x100/F5DEB3/FFFFFF?text=T%C3%A9', taxIds: [1], discountPercent: 0 },
];
const initialTaxesData = [
    { id: 1, name: 'IVA', rate: 19, enabled: true },
    { id: 2, name: 'Impoconsumo', rate: 8, enabled: false },
];
const initialCompanyInfo = {
    name: 'Mi Tienda POS',
    logoUrl: 'https://placehold.co/150x50/CCCCCC/FFFFFF?text=Logo+Empresa',
    address: 'Calle Falsa 123, Ciudad Ejemplo',
    phone: '+57 300 123 4567',
    taxId: 'NIT: 900.123.456-7',
    footerNote: '¡Gracias por su compra!'
};
const initialCustomersData = [
    { id: 'CUST-001', docType: 'CC', docNum: 'N/A', name: 'Cliente General', address: 'N/A', email: 'N/A', phone: 'N/A' },
    { id: 'CUST-002', docType: 'NIT', docNum: '98765432-1', name: 'Empresa Ejemplo SAS', address: 'Carrera 4 5-6', email: 'contacto@empresa.com', phone: '3009876543' },
    { id: 'CUST-003', docType: 'CC', docNum: '11223344', name: 'Ana García', address: 'Avenida Siempre Viva 742', email: 'ana.g@mail.com', phone: '3101112233' },
];
const initialCashDrawer = {
    initial: 0,
    current: 0,
    salesTotal: 0,
    returnsTotal: 0,
    expensesTotal: 0,
    isSet: false,
};

// --- Helper Functions ---
const generateId = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

// --- UI Components ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`p-4 border-b border-gray-200 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;
const CardFooter = ({ children, className = '' }) => <div className={`p-4 border-t border-gray-200 flex items-center ${className}`}>{children}</div>;
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }) => { const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"; const variants = { default: "bg-slate-900 text-white hover:bg-slate-800", destructive: "bg-red-600 text-white hover:bg-red-700", outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900", secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300", ghost: "hover:bg-slate-100", link: "text-slate-900 underline-offset-4 hover:underline", }; const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-md", icon: "h-10 w-10", }; return <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>{children}</button>; };
const Table = ({ children, className = "" }) => <div className={`w-full overflow-auto ${className}`}><table className="w-full caption-bottom text-sm">{children}</table></div>;
const TableHeader = ({ children, className = "" }) => <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
const TableBody = ({ children, className = "" }) => <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
const TableFooter = ({ children, className = "" }) => <tfoot className={`border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0 ${className}`}>{children}</tfoot>;
const TableRow = ({ children, className = "" }) => <tr className={`border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 ${className}`}>{children}</tr>;
const TableHead = ({ children, className = "" }) => <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</th>;
const TableCell = ({ children, className = "" }) => <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>;
const Input = ({ className = "", type = "text", ...props }) => <input type={type} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
const Checkbox = ({ id, checked, onChange, className = "", children }) => ( <div className={`flex items-center space-x-2 ${className}`}> <input type="checkbox" id={id} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"/> <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label> </div> );
const Textarea = ({ className = "", ...props }) => ( <textarea className={`flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> );
const Select = ({ children, className = "", ...props }) => ( <select className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</select> );

// --- POS Components ---

// Product Item Component - Modified to show discount
function ProductItem({ product, onAddToCart }) { const hasStock = product.inventory > 0; const hasDiscount = product.discountPercent > 0; const finalPrice = product.price * (1 - (product.discountPercent / 100)); return ( <Card className={`flex flex-col ${!hasStock ? 'opacity-60 bg-gray-50' : ''}`}> <CardContent className="flex-grow flex flex-col items-center text-center p-3 relative"> {hasDiscount && ( <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded"> -{product.discountPercent}% </div> )} <img src={product.image} alt={`Imagen de ${product.name}`} className="w-20 h-20 object-cover mb-2 rounded-md" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/100x100/CCCCCC/FFFFFF?text=Error`; }}/> <p className="font-semibold text-sm mb-1">{product.name}</p> <div className="text-xs"> {hasDiscount ? ( <> <span className="text-red-600 font-bold">${finalPrice.toFixed(2)}</span> <span className="line-through text-gray-500 ml-1">${product.price.toFixed(2)}</span> </> ) : ( <span className="text-gray-600">${product.price.toFixed(2)}</span> )} </div> <p className={`text-xs mt-1 font-medium ${hasStock ? 'text-green-600' : 'text-red-600'}`}>Stock: {product.inventory}</p> </CardContent> <CardFooter className="p-2"> <Button onClick={() => onAddToCart(product)} className="w-full text-xs" size="sm" disabled={!hasStock}>{hasStock ? 'Agregar' : 'Sin Stock'}</Button> </CardFooter> </Card> ); }
// Product List Component - No changes needed
function ProductList({ products, onAddToCart, searchTerm, onSearchChange }) { const filteredProducts = useMemo(() => { if (!searchTerm) return products; return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]); return ( <Card> <CardHeader> <div className="flex flex-col sm:flex-row justify-between items-center gap-3"> <CardTitle>Productos</CardTitle> <div className="w-full sm:w-64"> <Input type="search" placeholder="Buscar producto por nombre..." value={searchTerm} onChange={onSearchChange} className="h-9"/> </div> </div> </CardHeader> <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"> {filteredProducts.length > 0 ? ( filteredProducts.map((product) => ( <ProductItem key={product.id} product={product} onAddToCart={onAddToCart} /> )) ) : ( <p className="col-span-full text-center text-gray-500 py-4"> No se encontraron productos {searchTerm ? `para "${searchTerm}"` : ''}. </p> )} </CardContent> </Card> ); }
// Cart Item Component - Modified to show discount
function CartItem({ item, productInventory, onRemoveFromCart, onUpdateQuantity }) { const canIncreaseQuantity = item.quantity < productInventory; const hasDiscount = item.discountPercent > 0; const discountedPrice = item.price * (1 - (item.discountPercent / 100)); const itemTotal = discountedPrice * item.quantity; return ( <li className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"> <div className="flex-grow pr-2"> <p className="text-sm font-medium">{item.name}</p> {hasDiscount ? ( <p className="text-xs text-gray-500"> <span className="text-red-600">${discountedPrice.toFixed(2)}</span> <span className="line-through ml-1">${item.price.toFixed(2)}</span> <span className="ml-1">(-{item.discountPercent}%)</span> </p> ) : ( <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p> )} </div> <div className="flex items-center space-x-1.5"> <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button> <span className="text-sm w-6 text-center">{item.quantity}</span> <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} disabled={!canIncreaseQuantity}>+</Button> </div> <div className="w-16 text-right text-sm font-medium pl-2">${itemTotal.toFixed(2)}</div> <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-100 ml-2" onClick={() => onRemoveFromCart(item.id)}> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> </Button> </li> ); }
// Cart Component - Modified calculation for discounts
function Cart({ cartItems, products, taxes, onRemoveFromCart, onUpdateQuantity, onClearCart }) { const { subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown } = useMemo(() => { let currentSubtotal = 0; let currentTotalDiscount = 0; let currentSubtotalAfterDiscounts = 0; let currentTotalTax = 0; const currentTaxBreakdown = {}; cartItems.forEach(item => { const originalItemTotal = item.price * item.quantity; currentSubtotal += originalItemTotal; const itemDiscountAmount = originalItemTotal * (item.discountPercent / 100); currentTotalDiscount += itemDiscountAmount; const itemSubtotalAfterDiscount = originalItemTotal - itemDiscountAmount; currentSubtotalAfterDiscounts += itemSubtotalAfterDiscount; const product = products.find(p => p.id === item.id); const productTaxIds = product ? product.taxIds : []; const applicableTaxes = taxes.filter(tax => tax.enabled && productTaxIds.includes(tax.id)); applicableTaxes.forEach(tax => { const taxAmountForItem = itemSubtotalAfterDiscount * (tax.rate / 100); currentTotalTax += taxAmountForItem; if (currentTaxBreakdown[tax.name]) { currentTaxBreakdown[tax.name] += taxAmountForItem; } else { currentTaxBreakdown[tax.name] = taxAmountForItem; } }); }); return { subtotal: currentSubtotal, totalDiscountAmount: currentTotalDiscount, subtotalAfterDiscounts: currentSubtotalAfterDiscounts, totalTaxAmount: currentTotalTax, finalTotal: currentSubtotalAfterDiscounts + currentTotalTax, taxBreakdown: currentTaxBreakdown }; }, [cartItems, products, taxes]); const getInventory = (productId) => { const product = products.find(p => p.id === productId); return product ? product.inventory : 0; }; return ( <Card> <CardHeader className="flex justify-between items-center"> <CardTitle>Carrito</CardTitle> {cartItems.length > 0 && (<Button variant="outline" size="sm" onClick={onClearCart} className="text-xs">Vaciar Carrito</Button>)} </CardHeader> <CardContent> {cartItems.length === 0 ? ( <p className="text-gray-500 text-center py-4">El carrito está vacío.</p> ) : ( <ul className="divide-y divide-gray-100 mb-4"> {cartItems.map((item) => ( <CartItem key={item.id} item={item} productInventory={getInventory(item.id)} onRemoveFromCart={onRemoveFromCart} onUpdateQuantity={onUpdateQuantity}/> ))} </ul> )} {cartItems.length > 0 && ( <div className="space-y-1 border-t border-gray-200 pt-3 text-sm"> <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div> {totalDiscountAmount > 0 && ( <div className="flex justify-between text-red-600"> <span>Descuentos:</span> <span>- ${totalDiscountAmount.toFixed(2)}</span> </div> )} {totalDiscountAmount > 0 && ( <div className="flex justify-between font-medium"> <span>Subtotal c/ Dcto:</span> <span>${subtotalAfterDiscounts.toFixed(2)}</span> </div> )} {Object.entries(taxBreakdown).map(([taxName, taxAmount]) => ( <div key={taxName} className="flex justify-between text-gray-600"> <span>{taxName}:</span> <span>+ ${taxAmount.toFixed(2)}</span> </div> ))} {totalTaxAmount > 0 && Object.keys(taxBreakdown).length > 1 && ( <div className="flex justify-between text-gray-700 font-medium"> <span>Total Impuestos:</span> <span>${totalTaxAmount.toFixed(2)}</span> </div> )} <div className="flex justify-between font-semibold text-base pt-1 border-t border-dashed mt-1"> <span>Total:</span> <span>${finalTotal.toFixed(2)}</span> </div> </div> )} </CardContent> </Card> ); }

// Checkout Component - UPDATED with Searchable Customer Input
function Checkout({ cartItems, products, taxes, onCheckout, customers, selectedCustomerId, onSelectCustomer }) {
    // Local state for customer search
    const [customerSearch, setCustomerSearch] = useState('');
    const [isListVisible, setIsListVisible] = useState(false);
    const searchInputRef = useRef(null); // Ref for the input
    const listRef = useRef(null); // Ref for the results list

    // Calculate totals (same logic as before)
    const { subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown } = useMemo(() => {
        let currentSubtotal = 0; let currentTotalDiscount = 0; let currentSubtotalAfterDiscounts = 0; let currentTotalTax = 0; const currentTaxBreakdown = {};
        cartItems.forEach(item => {
            const originalItemTotal = item.price * item.quantity; currentSubtotal += originalItemTotal;
            const itemDiscountAmount = originalItemTotal * (item.discountPercent / 100); currentTotalDiscount += itemDiscountAmount;
            const itemSubtotalAfterDiscount = originalItemTotal - itemDiscountAmount; currentSubtotalAfterDiscounts += itemSubtotalAfterDiscount;
            const product = products.find(p => p.id === item.id); const productTaxIds = product ? product.taxIds : [];
            const applicableTaxes = taxes.filter(tax => tax.enabled && productTaxIds.includes(tax.id));
            applicableTaxes.forEach(tax => {
                const taxAmountForItem = itemSubtotalAfterDiscount * (tax.rate / 100); currentTotalTax += taxAmountForItem;
                if (currentTaxBreakdown[tax.name]) { currentTaxBreakdown[tax.name] += taxAmountForItem; }
                else { currentTaxBreakdown[tax.name] = taxAmountForItem; }
            });
        });
        return { subtotal: currentSubtotal, totalDiscountAmount: currentTotalDiscount, subtotalAfterDiscounts: currentSubtotalAfterDiscounts, totalTaxAmount: currentTotalTax, finalTotal: currentSubtotalAfterDiscounts + currentTotalTax, taxBreakdown: currentTaxBreakdown };
    }, [cartItems, products, taxes]);

    // Find the name of the currently selected customer
    const selectedCustomerName = useMemo(() => {
        const customer = customers.find(c => c.id === selectedCustomerId);
        return customer ? `${customer.name} (${customer.docNum})` : 'Cliente General';
    }, [selectedCustomerId, customers]);

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers; // Show all if search is empty
        const searchTerm = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.docNum.toLowerCase().includes(searchTerm)
        );
    }, [customerSearch, customers]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setIsListVisible(true); // Show list when typing
    };

    // Handle selecting a customer from the list
    const handleCustomerSelect = (customerId) => {
        onSelectCustomer(customerId); // Update global state
        setCustomerSearch(''); // Clear search input
        setIsListVisible(false); // Hide list
    };

    // Handle input focus
    const handleFocus = () => {
        setIsListVisible(true);
    };

    // Handle input blur - hide list after a short delay to allow clicks on list items
    const handleBlur = () => {
        setTimeout(() => {
             // Check if the focus is now inside the list itself before hiding
             if (listRef.current && !listRef.current.contains(document.activeElement)) {
                setIsListVisible(false);
             }
        }, 150); // Small delay
    };

     // Effect to potentially update search input display when selectedCustomerId changes externally
     useEffect(() => {
         // Optional: If you want the input to reflect the selected customer name
         // setCustomerSearch(selectedCustomerName); // This might interfere with typing, use carefully
     }, [selectedCustomerId, selectedCustomerName]);


    const handleCheckoutClick = () => {
        if (cartItems.length === 0) { console.warn("El carrito está vacío."); return; }
        onCheckout({ subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown, customerId: selectedCustomerId });
    };

    return (
        <Card>
            <CardHeader><CardTitle>Pago</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 {/* Customer Search Input */}
                 <div className="relative">
                     <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente (Nombre/Documento)</label>
                     <Input
                        ref={searchInputRef}
                        id="customerSearch"
                        type="search"
                        placeholder="Buscar..."
                        value={customerSearch}
                        onChange={handleSearchChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        autoComplete="off"
                     />
                     {/* Display Selected Customer */}
                      <p className="text-xs text-gray-600 mt-1">
                        Seleccionado: <span className="font-medium">{selectedCustomerName}</span>
                        {selectedCustomerId !== 'CUST-001' && (
                             <Button
                                variant="ghost" size="sm"
                                className="text-red-500 hover:bg-red-100 text-xs h-auto px-1 py-0 ml-1"
                                onClick={() => handleCustomerSelect('CUST-001')} // Reset to general
                                title="Quitar selección"
                             >
                                (x)
                             </Button>
                         )}
                     </p>

                     {/* Filtered Customer List */}
                     {isListVisible && (
                         <ul
                            ref={listRef} // Add ref to the list
                            className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 text-sm"
                         >
                             {filteredCustomers.length > 0 ? (
                                 filteredCustomers.map(customer => (
                                     <li
                                         key={customer.id}
                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                         // Use onMouseDown to register click before blur hides the list
                                         onMouseDown={() => handleCustomerSelect(customer.id)}
                                     >
                                         {customer.name} ({customer.docType} {customer.docNum})
                                     </li>
                                 ))
                             ) : (
                                 <li className="px-3 py-2 text-gray-500">No se encontraron clientes.</li>
                             )}
                         </ul>
                     )}
                 </div>

                 {/* Totals Display */}
                 <div className="text-center border-t pt-4">
                    <p className="text-sm text-gray-500 mb-1">Total a Pagar</p>
                    <p className="text-3xl font-bold mb-4">${finalTotal.toFixed(2)}</p>
                    <Button onClick={handleCheckoutClick} className="w-full" disabled={cartItems.length === 0}>Procesar Pago (Simulado)</Button>
                 </div>
            </CardContent>
        </Card>
    );
}


// --- Admin/Reporting Components ---

// Add Product Form Component - Added discountPercent default
function AddProductForm({ taxes, onAddProduct, onCancel }) { const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [costPrice, setCostPrice] = useState(''); const [inventory, setInventory] = useState(''); const [imageUrl, setImageUrl] = useState(''); const [selectedTaxIds, setSelectedTaxIds] = useState([]); const handleTaxCheckboxChange = (taxId) => { setSelectedTaxIds(prev => prev.includes(taxId) ? prev.filter(id => id !== taxId) : [...prev, taxId]); }; const handleSubmit = (e) => { e.preventDefault(); const parsedPrice = parseFloat(price); const parsedCostPrice = parseFloat(costPrice); const parsedInventory = parseInt(inventory, 10); if (name.trim() && !isNaN(parsedPrice) && parsedPrice >= 0 && !isNaN(parsedCostPrice) && parsedCostPrice >= 0 && !isNaN(parsedInventory) && parsedInventory >= 0) { onAddProduct({ name: name.trim(), price: parsedPrice, costPrice: parsedCostPrice, inventory: parsedInventory, image: imageUrl || `https://placehold.co/100x100/CCCCCC/FFFFFF?text=${encodeURIComponent(name.trim())}`, taxIds: selectedTaxIds, discountPercent: 0 /* Default discount */ }); onCancel(); } else { console.error("Datos de producto inválidos."); } }; return ( <Card className="mb-6 border-blue-300"> <CardHeader> <CardTitle>Agregar Nuevo Producto</CardTitle> </CardHeader> <form onSubmit={handleSubmit}> <CardContent className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label htmlFor="newProdName" className="block text-sm font-medium text-gray-700 mb-1">Nombre Producto*</label> <Input id="newProdName" value={name} onChange={(e) => setName(e.target.value)} required /> </div> <div> <label htmlFor="newProdImg" className="block text-sm font-medium text-gray-700 mb-1">URL Imagen (Opcional)</label> <Input id="newProdImg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."/> </div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label htmlFor="newProdPrice" className="block text-sm font-medium text-gray-700 mb-1">Precio Venta*</label> <Input id="newProdPrice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" /> </div> <div> <label htmlFor="newProdCost" className="block text-sm font-medium text-gray-700 mb-1">Precio Costo*</label> <Input id="newProdCost" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required step="0.01" min="0" /> </div> <div> <label htmlFor="newProdInv" className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial*</label> <Input id="newProdInv" type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} required step="1" min="0" /> </div> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-2">Impuestos Aplicables</label> <div className="flex flex-wrap gap-x-4 gap-y-2"> {taxes.length > 0 ? taxes.map(tax => ( <Checkbox key={tax.id} id={`new_prod_tax_${tax.id}`} checked={selectedTaxIds.includes(tax.id)} onChange={() => handleTaxCheckboxChange(tax.id)}> {tax.name} ({tax.rate}%) </Checkbox> )) : <span className="text-xs text-gray-500">No hay impuestos globales definidos.</span>} </div> </div> </CardContent> <CardFooter className="justify-end gap-2"> <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> <Button type="submit">Guardar Producto</Button> </CardFooter> </form> </Card> ); }
// Inventory View Component - Modified to include Discount editing
function InventoryView({ products, taxes, onUpdateInventory, onProductTaxToggle, onAddProduct, onRemoveProduct, onProductDiscountChange, searchTerm, onSearchChange }) { const [showAddForm, setShowAddForm] = useState(false); const filteredProducts = useMemo(() => { if (!searchTerm) return products; return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]); const handleRemoveClick = (productId, productName) => { if (window.confirm(`¿Seguro que quieres eliminar el producto "${productName}"? Esta acción no se puede deshacer.`)) { onRemoveProduct(productId); } }; return ( <div className="space-y-6"> <div className="text-right"> <Button onClick={() => setShowAddForm(prev => !prev)}> {showAddForm ? 'Cancelar Agregar Producto' : 'Agregar Nuevo Producto'} </Button> </div> {showAddForm && ( <AddProductForm taxes={taxes} onAddProduct={onAddProduct} onCancel={() => setShowAddForm(false)} /> )} <Card> <CardHeader> <div className="flex flex-col sm:flex-row justify-between items-center gap-3"> <CardTitle>Gestión de Inventario (Simulado)</CardTitle> <div className="w-full sm:w-64"> <Input type="search" placeholder="Buscar producto..." value={searchTerm} onChange={onSearchChange} className="h-9"/> </div> </div> </CardHeader> <CardContent> <Table> <TableHeader> <TableRow> <TableHead>Producto</TableHead> <TableHead className="text-right">Precio</TableHead> <TableHead className="text-right">Costo</TableHead> <TableHead className="text-center">Dcto (%)</TableHead> <TableHead className="text-center">Stock</TableHead> <TableHead className="text-center">Ajustar</TableHead> <TableHead>Impuestos</TableHead> <TableHead className="text-right">Acciones</TableHead> </TableRow> </TableHeader> <TableBody> {filteredProducts.length === 0 ? ( <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-4">No se encontraron productos {searchTerm ? `para "${searchTerm}"` : ''}.</TableCell></TableRow> ) : ( filteredProducts.map(product => ( <TableRow key={product.id}> <TableCell className="font-medium">{product.name} <span className="text-xs text-gray-400">(ID: {product.id})</span></TableCell> <TableCell className="text-right">${product.price.toFixed(2)}</TableCell> <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell> <TableCell className="text-center"> <Input type="number" value={product.discountPercent} onChange={(e) => onProductDiscountChange(product.id, parseFloat(e.target.value) || 0)} className="w-16 h-8 text-center text-sm" min="0" max="100" step="1" /> </TableCell> <TableCell className={`text-center font-semibold ${product.inventory > 0 ? 'text-green-700' : 'text-red-700'}`}>{product.inventory}</TableCell> <TableCell className="text-center"> <div className="flex justify-center items-center gap-1"> <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={() => onUpdateInventory(product.id, product.inventory - 1)} disabled={product.inventory <= 0}>-</Button> <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={() => onUpdateInventory(product.id, product.inventory + 1)}>+</Button> </div> </TableCell> <TableCell> <div className="flex flex-wrap gap-x-3 gap-y-1"> {taxes.length > 0 ? taxes.map(tax => ( <Checkbox key={tax.id} id={`prod_${product.id}_tax_${tax.id}`} checked={product.taxIds.includes(tax.id)} onChange={() => onProductTaxToggle(product.id, tax.id)} className="text-xs"> {tax.name} </Checkbox> )) : <span className="text-xs text-gray-400">-</span>} </div> </TableCell> <TableCell className="text-right"> <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveClick(product.id, product.name)} > Eliminar </Button> </TableCell> </TableRow> )) )} </TableBody> </Table> <p className="text-xs text-gray-500 mt-4">* El inventario se actualiza al procesar pagos/devoluciones. Los cambios son solo para esta sesión.</p> </CardContent> </Card> </div> ); }
// Sales Reports View Component - Added Customer Name
function ReportsView({ sales, onSimulateReturn, customers }) { const { totalSales, totalCost, totalProfit, totalTaxesCollected } = useMemo(() => { let salesSum = 0; let costSum = 0; let taxSum = 0; sales.forEach(sale => { salesSum += sale.finalTotal; taxSum += sale.totalTaxAmount; sale.items.forEach(item => { const originalProduct = initialProductsData.find(p => p.id === item.id); if (originalProduct) { costSum += originalProduct.costPrice * item.quantity; } }); }); const profit = (salesSum - taxSum) - costSum; return { totalSales: salesSum, totalCost: costSum, totalProfit: profit, totalTaxesCollected: taxSum }; }, [sales]); const handleReturnClick = (sale) => { if (window.confirm(`¿Simular devolución completa de la venta ${sale.id}? Esto ajustará el inventario.`)) { onSimulateReturn(sale.id); } }; const getCustomerName = useCallback((customerId) => { const customer = customers.find(c => c.id === customerId); return customer ? customer.name : 'Cliente General'; }, [customers]); return ( <Card> <CardHeader><CardTitle>Reporte de Ventas y Ganancias (Sesión Actual)</CardTitle></CardHeader> <CardContent> <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center"> <div className="p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-700 font-medium">Ingresos Totales</p><p className="text-xl font-bold text-blue-900">${totalSales.toFixed(2)}</p></div> <div className="p-3 bg-purple-50 rounded-lg"><p className="text-sm text-purple-700 font-medium">Impuestos Recaudados</p><p className="text-xl font-bold text-purple-900">${totalTaxesCollected.toFixed(2)}</p></div> <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-sm text-yellow-700 font-medium">Costo Total</p><p className="text-xl font-bold text-yellow-900">${totalCost.toFixed(2)}</p></div> <div className="p-3 bg-green-50 rounded-lg"><p className="text-sm text-green-700 font-medium">Ganancia Neta</p><p className="text-xl font-bold text-green-900">${totalProfit.toFixed(2)}</p></div> </div> <h4 className="text-md font-semibold mb-2">Detalle de Ventas</h4> {sales.length === 0 ? (<p className="text-gray-500 text-center py-4">No se han registrado ventas en esta sesión.</p>) : ( <Table> <TableHeader><TableRow><TableHead>ID Venta</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Items</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">Impuestos</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader> <TableBody> {sales.map(sale => ( <TableRow key={sale.id}> <TableCell className="font-mono text-xs">{sale.id}</TableCell> <TableCell className="text-xs">{new Date(sale.timestamp).toLocaleString()}</TableCell> <TableCell className="text-xs">{getCustomerName(sale.customerId)}</TableCell> <TableCell><ul className="list-disc list-inside text-xs">{sale.items.map(item => <li key={item.id}>{item.name} (x{item.quantity})</li>)}</ul></TableCell> <TableCell className="text-right">${sale.subtotal.toFixed(2)}</TableCell> <TableCell className="text-right">${sale.totalTaxAmount.toFixed(2)}</TableCell> <TableCell className="text-right font-medium">${sale.finalTotal.toFixed(2)}</TableCell> <TableCell> <Button variant="outline" size="sm" className="text-xs" onClick={() => handleReturnClick(sale)} > Devolución (Sim.) </Button> </TableCell> </TableRow> ))} </TableBody> </Table> )} <p className="text-xs text-gray-500 mt-4">* Las ventas y ganancias se calculan solo para esta sesión.</p> </CardContent> </Card> ); }
// Settings View Component - No changes needed
function SettingsView({ taxes, companyInfo, onAddTax, onToggleTax, onRemoveTax, onCompanyInfoChange }) { const [newTaxName, setNewTaxName] = useState(''); const [newTaxRate, setNewTaxRate] = useState(''); const handleAddTaxSubmit = (e) => { e.preventDefault(); const rate = parseFloat(newTaxRate); if (newTaxName.trim() && !isNaN(rate) && rate >= 0) { onAddTax({ name: newTaxName.trim(), rate }); setNewTaxName(''); setNewTaxRate(''); } else { console.error("Nombre de impuesto inválido o tasa inválida."); } }; const handleInputChange = (e) => { const { name, value } = e.target; onCompanyInfoChange(name, value); }; return ( <div className="space-y-6"> <Card> <CardHeader><CardTitle>Datos de la Empresa (Simulado)</CardTitle></CardHeader> <CardContent className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa</label> <Input id="companyName" name="name" value={companyInfo.name} onChange={handleInputChange} placeholder="Nombre de tu tienda"/> </div> <div> <label htmlFor="companyTaxId" className="block text-sm font-medium text-gray-700 mb-1">NIT / ID Fiscal</label> <Input id="companyTaxId" name="taxId" value={companyInfo.taxId} onChange={handleInputChange} placeholder="Ej: 900.123.456-7"/> </div> </div> <div> <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label> <Input id="companyAddress" name="address" value={companyInfo.address} onChange={handleInputChange} placeholder="Dirección completa"/> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label> <Input id="companyPhone" name="phone" value={companyInfo.phone} onChange={handleInputChange} placeholder="+57 ..."/> </div> <div> <label htmlFor="companyLogoUrl" className="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label> <Input id="companyLogoUrl" name="logoUrl" value={companyInfo.logoUrl} onChange={handleInputChange} placeholder="https://.../logo.png"/> {companyInfo.logoUrl && ( <img src={companyInfo.logoUrl} alt="Previsualización del logo" className="mt-2 max-h-12 border rounded" onError={(e) => { e.target.style.display='none'; }} onLoad={(e) => { e.target.style.display='block'; }} /> )} </div> </div> <div> <label htmlFor="companyFooterNote" className="block text-sm font-medium text-gray-700 mb-1">Nota al Pie de Factura</label> <Textarea id="companyFooterNote" name="footerNote" value={companyInfo.footerNote} onChange={handleInputChange} placeholder="Ej: ¡Gracias por su compra!" rows={2}/> </div> <p className="text-xs text-gray-500 mt-4">* La información de la empresa es solo para esta sesión.</p> </CardContent> </Card> <Card> <CardHeader><CardTitle>Configuración de Impuestos Globales (Simulado)</CardTitle></CardHeader> <CardContent> <form onSubmit={handleAddTaxSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50"> <h4 className="text-md font-semibold mb-3">Agregar Nuevo Impuesto Global</h4> <div className="flex flex-col sm:flex-row gap-3"> <div className="flex-grow"><label htmlFor="taxName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><Input id="taxName" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)} placeholder="Ej: IVA, Impoconsumo" required/></div> <div className="w-full sm:w-32"><label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">Tasa (%)</label><Input id="taxRate" type="number" value={newTaxRate} onChange={(e) => setNewTaxRate(e.target.value)} placeholder="Ej: 19" required step="0.01" min="0"/></div> <div className="self-end"><Button type="submit" size="default" className="w-full sm:w-auto">Agregar</Button></div> </div> </form> <h4 className="text-md font-semibold mb-2">Impuestos Globales Actuales</h4> {taxes.length === 0 ? (<p className="text-gray-500 text-center py-4">No hay impuestos configurados.</p>) : ( <ul className="space-y-2"> {taxes.map(tax => ( <li key={tax.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"> <div className="flex items-center gap-3"> <Checkbox id={`tax_enable_${tax.id}`} checked={tax.enabled} onChange={() => onToggleTax(tax.id)}> <span className="font-medium">{tax.name}</span> ({tax.rate}%) {tax.enabled ? <span className="text-green-600 text-xs">(Habilitado)</span> : <span className="text-red-600 text-xs">(Deshabilitado)</span>} </Checkbox> </div> <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" onClick={() => onRemoveTax(tax.id)}>Eliminar</Button> </li> ))} </ul> )} <p className="text-xs text-gray-500 mt-4">* Habilitar/deshabilitar aquí afecta globalmente. La asignación a productos específicos se hace en la vista de Inventario.</p> </CardContent> </Card> </div> ); }
// Invoice Component - Added Customer Info and Discount Column
function InvoiceView({ saleData, companyInfo, customers }) { // Added customers prop
    if (!saleData) return null;
    const { id, timestamp, items, subtotal, totalTaxAmount, finalTotal, taxBreakdownDetails, customerId, totalDiscountAmount } = saleData;
    // Find customer, default to general if not found or ID is CUST-001
    const customer = customers.find(c => c.id === customerId && c.id !== 'CUST-001');

    return ( <div className="invoice-container p-6 bg-white text-gray-900 font-sans text-sm"> <div className="flex justify-between items-start mb-4"> <div className="w-2/3"> {companyInfo.logoUrl && ( <img src={companyInfo.logoUrl} alt={`Logo de ${companyInfo.name}`} className="max-h-16 mb-2" onError={(e) => { e.target.style.display='none'; }} /> )} <h1 className="text-xl font-bold mb-1">{companyInfo.name || 'Nombre Empresa'}</h1> <p>{companyInfo.address || 'Dirección Empresa'}</p> <p>{companyInfo.phone || 'Teléfono Empresa'}</p> <p>{companyInfo.taxId || 'ID Fiscal Empresa'}</p> </div> <div className="text-right w-1/3"> <h2 className="text-2xl font-bold mb-1">FACTURA</h2> <p><strong>No:</strong> {id}</p> <p><strong>Fecha:</strong> {new Date(timestamp).toLocaleString()}</p> </div> </div> {customer && ( <div className="mb-4 p-2 border rounded bg-gray-50"> <h3 className="font-semibold text-xs mb-1">Cliente:</h3> <p>{customer.name}</p> <p>{customer.docType} {customer.docNum}</p> <p>{customer.address}</p> <p>{customer.phone} - {customer.email}</p> </div> )} <table className="w-full mb-6 border-collapse"> <thead> <tr className="border-b-2 border-gray-700"> <th className="text-left py-2 px-1">Cant.</th> <th className="text-left py-2 px-1">Descripción</th> <th className="text-right py-2 px-1">Precio Unit.</th> <th className="text-right py-2 px-1">Dcto (%)</th> <th className="text-right py-2 px-1">Total</th> </tr> </thead> <tbody> {items.map(item => { const discountedPrice = item.price * (1 - (item.discountPercent / 100)); const itemTotal = discountedPrice * item.quantity; return ( <tr key={item.id} className="border-b border-gray-300"> <td className="py-1 px-1 text-center">{item.quantity}</td> <td className="py-1 px-1">{item.name}</td> <td className="text-right py-1 px-1">${item.price.toFixed(2)}</td> <td className="text-right py-1 px-1">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td> <td className="text-right py-1 px-1">${itemTotal.toFixed(2)}</td> </tr> );})} </tbody> </table> <div className="flex justify-end mb-6"> <div className="w-full max-w-xs space-y-1"> <div className="flex justify-between"> <span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span> </div> {totalDiscountAmount > 0 && ( <div className="flex justify-between text-red-600"> <span>Descuentos:</span> <span>- ${totalDiscountAmount.toFixed(2)}</span> </div> )} {taxBreakdownDetails && Object.entries(taxBreakdownDetails).map(([taxName, taxAmount]) => ( <div key={taxName} className="flex justify-between text-gray-600"> <span>{taxName}:</span> <span>+ ${taxAmount.toFixed(2)}</span> </div> ))} <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-1 mt-1"> <span>TOTAL:</span> <span>${finalTotal.toFixed(2)}</span> </div> </div> </div> {companyInfo.footerNote && ( <div className="text-center text-xs text-gray-600 border-t pt-2"> <p>{companyInfo.footerNote}</p> </div> )} </div> ); }
// Returns Log View - No changes needed
function ReturnsLogView({ returnsLog }) { return ( <Card> <CardHeader> <CardTitle>Registro de Devoluciones Simuladas</CardTitle> </CardHeader> <CardContent> <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-md mb-4"> <strong>Nota:</strong> Esta es una simulación básica. Solo se ajusta el inventario y se registra el evento. No se gestionan notas crédito aplicables ni reembolsos monetarios. </p> {returnsLog.length === 0 ? ( <p className="text-gray-500 text-center py-4">No se han simulado devoluciones en esta sesión.</p> ) : ( <Table> <TableHeader> <TableRow> <TableHead>ID Devolución</TableHead> <TableHead>Fecha</TableHead> <TableHead>Venta Original ID</TableHead> <TableHead>Items Devueltos</TableHead> <TableHead className="text-right">Valor Devuelto</TableHead> </TableRow> </TableHeader> <TableBody> {returnsLog.map(ret => ( <TableRow key={ret.returnId}> <TableCell className="font-mono text-xs">{ret.returnId}</TableCell> <TableCell className="text-xs">{new Date(ret.timestamp).toLocaleString()}</TableCell> <TableCell className="font-mono text-xs">{ret.originalSaleId}</TableCell> <TableCell> <ul className="list-disc list-inside text-xs"> {ret.returnedItems.map(item => ( <li key={item.id}>{item.name} (x{item.quantity})</li> ))} </ul> </TableCell> <TableCell className="text-right font-medium">${ret.totalReturned.toFixed(2)}</TableCell> </TableRow> ))} </TableBody> </Table> )} </CardContent> </Card> ); }

// --- NEW: Customer Management Components ---
function AddCustomerForm({ onAddCustomer, onCancel }) { const [docType, setDocType] = useState('CC'); const [docNum, setDocNum] = useState(''); const [name, setName] = useState(''); const [address, setAddress] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const handleSubmit = (e) => { e.preventDefault(); if (docNum.trim() && name.trim()) { onAddCustomer({ docType, docNum: docNum.trim(), name: name.trim(), address: address.trim() || 'N/A', email: email.trim() || 'N/A', phone: phone.trim() || 'N/A', }); onCancel(); } else { console.error("Tipo/Número de documento y Nombre son requeridos."); } }; return ( <Card className="mb-6 border-green-300"> <CardHeader> <CardTitle>Agregar Nuevo Cliente</CardTitle> </CardHeader> <form onSubmit={handleSubmit}> <CardContent className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label htmlFor="custDocType" className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.*</label> <Select id="custDocType" value={docType} onChange={(e) => setDocType(e.target.value)}> <option value="CC">CC</option> <option value="NIT">NIT</option> <option value="CE">CE</option> <option value="Pasaporte">Pasaporte</option> <option value="Otro">Otro</option> </Select> </div> <div> <label htmlFor="custDocNum" className="block text-sm font-medium text-gray-700 mb-1">Número Doc.*</label> <Input id="custDocNum" value={docNum} onChange={(e) => setDocNum(e.target.value)} required /> </div> <div> <label htmlFor="custName" className="block text-sm font-medium text-gray-700 mb-1">Nombre/Razón Social*</label> <Input id="custName" value={name} onChange={(e) => setName(e.target.value)} required /> </div> </div> <div> <label htmlFor="custAddress" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label> <Input id="custAddress" value={address} onChange={(e) => setAddress(e.target.value)} /> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label htmlFor="custEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label> <Input id="custEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /> </div> <div> <label htmlFor="custPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label> <Input id="custPhone" value={phone} onChange={(e) => setPhone(e.target.value)} /> </div> </div> </CardContent> <CardFooter className="justify-end gap-2"> <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> <Button type="submit">Guardar Cliente</Button> </CardFooter> </form> </Card> ); }
function CustomerManagementView({ customers, onAddCustomer, onRemoveCustomer }) { const [showAddForm, setShowAddForm] = useState(false); const handleRemoveClick = (customerId, customerName) => { if (customerId === 'CUST-001') { alert("No se puede eliminar el cliente general."); return; } if (window.confirm(`¿Seguro que quieres eliminar al cliente "${customerName}"?`)) { onRemoveCustomer(customerId); } }; return ( <div className="space-y-6"> <div className="text-right"> <Button onClick={() => setShowAddForm(prev => !prev)}> {showAddForm ? 'Cancelar Agregar Cliente' : 'Agregar Nuevo Cliente'} </Button> </div> {showAddForm && ( <AddCustomerForm onAddCustomer={onAddCustomer} onCancel={() => setShowAddForm(false)} /> )} <Card> <CardHeader><CardTitle>Gestión de Clientes</CardTitle></CardHeader> <CardContent> <Table> <TableHeader> <TableRow> <TableHead>Tipo Doc.</TableHead> <TableHead>Número Doc.</TableHead> <TableHead>Nombre / Razón Social</TableHead> <TableHead>Email</TableHead> <TableHead>Teléfono</TableHead> <TableHead className="text-right">Acciones</TableHead> </TableRow> </TableHeader> <TableBody> {customers.length === 0 ? ( <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-4">No hay clientes registrados.</TableCell></TableRow> ) : ( customers.map(customer => ( <TableRow key={customer.id}> <TableCell>{customer.docType}</TableCell> <TableCell>{customer.docNum}</TableCell> <TableCell className="font-medium">{customer.name}</TableCell> <TableCell>{customer.email}</TableCell> <TableCell>{customer.phone}</TableCell> <TableCell className="text-right"> <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 disabled:text-gray-400" onClick={() => handleRemoveClick(customer.id, customer.name)} disabled={customer.id === 'CUST-001'} > Eliminar </Button> </TableCell> </TableRow> )) )} </TableBody> </Table> </CardContent> </Card> </div> ); }

// --- NEW: Invoice History View ---
function InvoiceHistoryView({ sales, customers }) { const [filterSaleId, setFilterSaleId] = useState(''); const [filterStartDate, setFilterStartDate] = useState(''); const [filterEndDate, setFilterEndDate] = useState(''); const [filterCustomerName, setFilterCustomerName] = useState(''); const getCustomerName = useCallback((customerId) => { const customer = customers.find(c => c.id === customerId); return customer ? customer.name : 'Cliente General'; }, [customers]); const filteredSales = useMemo(() => { return sales.filter(sale => { if (filterSaleId && !sale.id.toLowerCase().includes(filterSaleId.toLowerCase())) { return false; } const saleDate = new Date(sale.timestamp); if (filterStartDate) { const startDate = new Date(filterStartDate); startDate.setHours(0, 0, 0, 0); if (saleDate < startDate) return false; } if (filterEndDate) { const endDate = new Date(filterEndDate); endDate.setHours(23, 59, 59, 999); if (saleDate > endDate) return false; } if (filterCustomerName) { const customerName = getCustomerName(sale.customerId); if (!customerName.toLowerCase().includes(filterCustomerName.toLowerCase())) { return false; } } return true; }); }, [sales, filterSaleId, filterStartDate, filterEndDate, filterCustomerName, getCustomerName]); return ( <Card> <CardHeader> <CardTitle>Historial de Facturas (Sesión Actual)</CardTitle> </CardHeader> <CardContent> <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg bg-gray-50"> <div> <label htmlFor="filterId" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por ID Factura</label> <Input id="filterId" value={filterSaleId} onChange={e => setFilterSaleId(e.target.value)} placeholder="ID..."/> </div> <div> <label htmlFor="filterCust" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Cliente</label> <Input id="filterCust" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} placeholder="Nombre cliente..."/> </div> <div> <label htmlFor="filterStart" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label> <Input id="filterStart" type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /> </div> <div> <label htmlFor="filterEnd" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label> <Input id="filterEnd" type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /> </div> </div> {filteredSales.length === 0 ? ( <p className="text-gray-500 text-center py-4">No se encontraron facturas con los filtros aplicados.</p> ) : ( <Table> <TableHeader><TableRow><TableHead>ID Factura</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader> <TableBody> {filteredSales.map(sale => ( <TableRow key={sale.id}> <TableCell className="font-mono text-xs">{sale.id}</TableCell> <TableCell className="text-xs">{new Date(sale.timestamp).toLocaleString()}</TableCell> <TableCell className="text-xs">{getCustomerName(sale.customerId)}</TableCell> <TableCell className="text-right font-medium">${sale.finalTotal.toFixed(2)}</TableCell> </TableRow> ))} </TableBody> </Table> )} </CardContent> </Card> ); }

// --- NEW: Cash Drawer Components ---
function AddExpenseForm({ onAddExpense, onCancel }) { const [description, setDescription] = useState(''); const [amount, setAmount] = useState(''); const handleSubmit = (e) => { e.preventDefault(); const parsedAmount = parseFloat(amount); if (description.trim() && !isNaN(parsedAmount) && parsedAmount > 0) { onAddExpense({ description: description.trim(), amount: parsedAmount }); onCancel(); } else { console.error("Descripción y monto válido son requeridos para el egreso."); } }; return ( <Card className="mb-6 border-red-300"> <CardHeader><CardTitle>Registrar Egreso de Caja</CardTitle></CardHeader> <form onSubmit={handleSubmit}> <CardContent className="space-y-4"> <div> <label htmlFor="expenseDesc" className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label> <Input id="expenseDesc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ej: Pago servicios"/> </div> <div> <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto*</label> <Input id="expenseAmount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0.01" placeholder="0.00"/> </div> </CardContent> <CardFooter className="justify-end gap-2"> <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> <Button type="submit" variant="destructive">Registrar Egreso</Button> </CardFooter> </form> </Card> ); }
function CashDrawerView({ cashDrawer, expensesLog, onSetInitialCash, onAddExpense }) { const [initialCashInput, setInitialCashInput] = useState(''); const [showAddExpenseForm, setShowAddExpenseForm] = useState(false); const handleSetInitial = () => { const amount = parseFloat(initialCashInput); if (!isNaN(amount) && amount >= 0) { onSetInitialCash(amount); setInitialCashInput(''); } else { console.error("Ingrese un monto inicial válido."); } }; return ( <div className="space-y-6"> {!cashDrawer.isSet && ( <Card> <CardHeader><CardTitle>Abrir Caja</CardTitle></CardHeader> <CardContent className="flex items-end gap-2"> <div className="flex-grow"> <label htmlFor="initialCash" className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial en Caja*</label> <Input id="initialCash" type="number" value={initialCashInput} onChange={(e) => setInitialCashInput(e.target.value)} placeholder="0.00" step="0.01" min="0" required/> </div> <Button onClick={handleSetInitial}>Iniciar Caja</Button> </CardContent> </Card> )} {cashDrawer.isSet && ( <Card> <CardHeader><CardTitle>Resumen de Caja (Sesión Actual)</CardTitle></CardHeader> <CardContent className="space-y-2 text-sm"> <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Saldo Inicial:</span><span className="font-medium">${cashDrawer.initial.toFixed(2)}</span></div> <div className="flex justify-between p-2"><span>(+) Ventas Totales:</span><span className="font-medium text-green-600">+ ${cashDrawer.salesTotal.toFixed(2)}</span></div> <div className="flex justify-between p-2"><span>(-) Devoluciones (Sim.):</span><span className="font-medium text-orange-600">- ${cashDrawer.returnsTotal.toFixed(2)}</span></div> <div className="flex justify-between p-2"><span>(-) Egresos Totales:</span><span className="font-medium text-red-600">- ${cashDrawer.expensesTotal.toFixed(2)}</span></div> <div className="flex justify-between p-2 bg-gray-100 rounded border-t font-semibold text-base"><span>Saldo Actual Estimado:</span><span>${cashDrawer.current.toFixed(2)}</span></div> <p className="text-xs text-gray-500 mt-2">* Este es un cálculo simulado basado en las operaciones de esta sesión.</p> </CardContent> </Card> )} {cashDrawer.isSet && ( <div className="space-y-6"> <div className="text-right"> <Button variant="destructive" onClick={() => setShowAddExpenseForm(prev => !prev)}> {showAddExpenseForm ? 'Cancelar Egreso' : 'Registrar Egreso'} </Button> </div> {showAddExpenseForm && ( <AddExpenseForm onAddExpense={onAddExpense} onCancel={() => setShowAddExpenseForm(false)} /> )} <Card> <CardHeader><CardTitle>Registro de Egresos</CardTitle></CardHeader> <CardContent> {expensesLog.length === 0 ? ( <p className="text-gray-500 text-center py-4">No hay egresos registrados en esta sesión.</p> ) : ( <Table> <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader> <TableBody> {expensesLog.map(exp => ( <TableRow key={exp.id}> <TableCell className="text-xs">{new Date(exp.timestamp).toLocaleString()}</TableCell> <TableCell>{exp.description}</TableCell> <TableCell className="text-right font-medium text-red-600">-${exp.amount.toFixed(2)}</TableCell> </TableRow> ))} </TableBody> </Table> )} </CardContent> </Card> </div> )} </div> ); }


// --- Main App Component ---
function App() {
  const [products, setProducts] = useState(initialProductsData);
  const [cartItems, setCartItems] = useState([]);
  const [userRole, setUserRole] = useState('cashier');
  const [currentPage, setCurrentPage] = useState('pos');
  const [sales, setSales] = useState([]);
  const [taxes, setTaxes] = useState(initialTaxesData);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [companyInfo, setCompanyInfo] = useState(initialCompanyInfo);
  const [lastSaleForInvoice, setLastSaleForInvoice] = useState(null);
  const [returnsLog, setReturnsLog] = useState([]);
  // NEW States
  const [customers, setCustomers] = useState(initialCustomersData);
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-001'); // Default to general customer
  const [cashDrawer, setCashDrawer] = useState(initialCashDrawer);
  const [expensesLog, setExpensesLog] = useState([]);


  // --- Event Handlers ---

  // Add to Cart Handler - Include discountPercent in cart item
  const handleAddToCart = useCallback((productToAdd) => { const productInStock = products.find(p => p.id === productToAdd.id); if (!productInStock || productInStock.inventory <= 0) { console.warn(`Producto ${productToAdd.name} sin stock.`); return; } setCartItems((prevItems) => { const existingItem = prevItems.find((item) => item.id === productToAdd.id); if (existingItem) { if (existingItem.quantity < productInStock.inventory) { return prevItems.map((item) => item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item); } else { console.warn(`No hay suficiente stock para añadir más ${productToAdd.name}.`); return prevItems; } } else { return [...prevItems, { ...productToAdd, quantity: 1, discountPercent: productInStock.discountPercent }]; } }); }, [products]);
  // Remove from Cart Handler
  const handleRemoveFromCart = useCallback((productIdToRemove) => { setCartItems((prevItems) => prevItems.filter((item) => item.id !== productIdToRemove)); }, []);
  // Update Quantity Handler
  const handleUpdateQuantity = useCallback((productId, newQuantity) => { const productInStock = products.find(p => p.id === productId); if (!productInStock) return; if (newQuantity < 1) { handleRemoveFromCart(productId); } else if (newQuantity <= productInStock.inventory) { setCartItems((prevItems) => prevItems.map((item) => item.id === productId ? { ...item, quantity: newQuantity } : item)); } else { console.warn(`No hay suficiente stock para ${newQuantity} unidades de ${productInStock.name}. Máximo: ${productInStock.inventory}`); } }, [products, handleRemoveFromCart]);
  // Clear Cart Handler
  const handleClearCart = useCallback(() => { setCartItems([]); setSelectedCustomerId('CUST-001'); /* Reset customer */ }, []);
  // Checkout Handler - Include customerId and update cash drawer
  const handleCheckout = useCallback(({ subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, taxBreakdown, customerId }) => { const transactionTime = Date.now(); const saleId = generateId('SALE'); const newSale = { id: saleId, timestamp: transactionTime, items: [...cartItems], subtotal, totalDiscountAmount, subtotalAfterDiscounts, totalTaxAmount, finalTotal, userRole: userRole, taxBreakdownDetails: taxBreakdown, customerId: customerId || 'CUST-001' }; let inventoryUpdateSuccessful = true; const updatedProducts = products.map(product => { const itemInCart = cartItems.find(item => item.id === product.id); if (itemInCart) { const newInventory = product.inventory - itemInCart.quantity; if (newInventory < 0) { console.error(`Error: Stock insuficiente para ${product.name} durante el checkout.`); inventoryUpdateSuccessful = false; return product; } return { ...product, inventory: newInventory }; } return product; }); if (inventoryUpdateSuccessful) { setProducts(updatedProducts); setSales(prevSales => [...prevSales, newSale]); setCartItems([]); setLastSaleForInvoice(newSale); setSelectedCustomerId('CUST-001'); setCashDrawer(prev => ({ ...prev, salesTotal: prev.salesTotal + finalTotal, current: prev.current + finalTotal, })); console.log("Pago procesado (simulado). Venta registrada:", newSale); } else { console.error("Error al actualizar el inventario. La venta no se completó."); setLastSaleForInvoice(null); } }, [cartItems, products, userRole]);
  // Update Inventory Handler
  const handleUpdateInventory = useCallback((productId, newInventoryValue) => { const newStock = Math.max(0, newInventoryValue); setProducts(currentProducts => currentProducts.map(p => p.id === productId ? { ...p, inventory: newStock } : p)); }, []);
  // Tax Management Handlers
  const handleAddTax = useCallback((newTaxData) => { setTaxes(prevTaxes => [...prevTaxes, { ...newTaxData, id: generateId('TAX'), enabled: true }]); }, []);
  const handleToggleTax = useCallback((taxId) => { setTaxes(prevTaxes => prevTaxes.map(tax => tax.id === taxId ? { ...tax, enabled: !tax.enabled } : tax)); }, []);
  const handleRemoveTax = useCallback((taxId) => { setTaxes(prevTaxes => prevTaxes.filter(tax => tax.id !== taxId)); }, []);
  // Product-Specific Tax Toggle Handler
  const handleProductTaxToggle = useCallback((productId, taxIdToToggle) => { setProducts(currentProducts => currentProducts.map(p => { if (p.id === productId) { const updatedTaxIds = p.taxIds.includes(taxIdToToggle) ? p.taxIds.filter(id => id !== taxIdToToggle) : [...p.taxIds, taxIdToToggle]; return { ...p, taxIds: updatedTaxIds }; } return p; })); }, []);
  // Toggle User Role Handler
  const toggleRole = useCallback(() => { setUserRole(prevRole => (prevRole === 'cashier' ? 'admin' : 'cashier')); setCurrentPage('pos'); setLastSaleForInvoice(null); }, []);
  // Search input change handlers
  const handleProductSearchChange = (event) => { setProductSearchTerm(event.target.value); };
  const handleInventorySearchChange = (event) => { setInventorySearchTerm(event.target.value); };
  // Company Info Change Handler
  const handleCompanyInfoChange = useCallback((fieldName, value) => { setCompanyInfo(prevInfo => ({ ...prevInfo, [fieldName]: value })); }, []);
  // Print Invoice Handler
  const handlePrintInvoice = () => { if (lastSaleForInvoice) { window.print(); } else { console.warn("No hay una factura reciente para imprimir."); } };
  // Add Product Handler
  const handleAddProduct = useCallback((newProductData) => { setProducts(prevProducts => [ ...prevProducts, { ...newProductData, id: generateId('PROD'), price: parseFloat(newProductData.price) || 0, costPrice: parseFloat(newProductData.costPrice) || 0, inventory: parseInt(newProductData.inventory, 10) || 0, } ]); console.log("Nuevo producto agregado:", newProductData); }, []);
  // Remove Product Handler
  const handleRemoveProduct = useCallback((productIdToRemove) => { setProducts(prevProducts => prevProducts.filter(p => p.id !== productIdToRemove)); console.log("Producto eliminado:", productIdToRemove); }, []);
  // Simulate Return Handler - Update cash drawer
  const handleSimulateReturn = useCallback((saleIdToReturn) => { const sale = sales.find(s => s.id === saleIdToReturn); if (!sale) { console.error("Venta original no encontrada."); return; } let inventoryAdjustmentSuccessful = true; const updatedProducts = products.map(product => { const itemInReturnedSale = sale.items.find(item => item.id === product.id); if (itemInReturnedSale) { const newInventory = product.inventory + itemInReturnedSale.quantity; return { ...product, inventory: newInventory }; } return product; }); setProducts(updatedProducts); const newReturn = { returnId: `RET-${generateId()}`, timestamp: Date.now(), originalSaleId: sale.id, returnedItems: [...sale.items], totalReturned: sale.finalTotal, userRole: userRole }; setReturnsLog(prevLog => [...prevLog, newReturn]); setCashDrawer(prev => ({ ...prev, returnsTotal: prev.returnsTotal + sale.finalTotal, current: prev.current - sale.finalTotal, })); console.log("Devolución simulada procesada:", newReturn); }, [sales, products, userRole]);
  // NEW: Add Customer Handler
  const handleAddCustomer = useCallback((newCustomerData) => { setCustomers(prev => [...prev, { ...newCustomerData, id: generateId('CUST') }]); console.log("Nuevo cliente agregado:", newCustomerData); }, []);
  // NEW: Remove Customer Handler
  const handleRemoveCustomer = useCallback((customerIdToRemove) => { if (customerIdToRemove === 'CUST-001') return; setCustomers(prev => prev.filter(c => c.id !== customerIdToRemove)); setSelectedCustomerId(prev => prev === customerIdToRemove ? 'CUST-001' : prev); console.log("Cliente eliminado:", customerIdToRemove); }, []);
  // NEW: Select Customer Handler
  const handleSelectCustomer = useCallback((customerId) => { setSelectedCustomerId(customerId || 'CUST-001'); }, []);
  // NEW: Product Discount Change Handler
  const handleProductDiscountChange = useCallback((productId, discount) => { const newDiscount = Math.max(0, Math.min(100, discount)); setProducts(prev => prev.map(p => p.id === productId ? { ...p, discountPercent: newDiscount } : p)); }, []);
  // NEW: Set Initial Cash Handler
  const handleSetInitialCash = useCallback((amount) => { setCashDrawer(prev => ({ ...prev, initial: amount, current: amount + prev.salesTotal - prev.returnsTotal - prev.expensesTotal, isSet: true, })); }, []);
  // NEW: Add Expense Handler
  const handleAddExpense = useCallback(({ description, amount }) => { const newExpense = { id: generateId('EXP'), timestamp: Date.now(), description, amount, }; setExpensesLog(prev => [...prev, newExpense]); setCashDrawer(prev => ({ ...prev, expensesTotal: prev.expensesTotal + amount, current: prev.current - amount, })); console.log("Egreso registrado:", newExpense); }, []);


  // --- Render Logic ---
  const renderCurrentPage = () => {
      if (userRole === 'admin') {
          if (currentPage === 'inventory') { return <InventoryView products={products} taxes={taxes} onUpdateInventory={handleUpdateInventory} onProductTaxToggle={handleProductTaxToggle} onAddProduct={handleAddProduct} onRemoveProduct={handleRemoveProduct} onProductDiscountChange={handleProductDiscountChange} searchTerm={inventorySearchTerm} onSearchChange={handleInventorySearchChange}/>; }
          if (currentPage === 'reports') { return <ReportsView sales={sales} customers={customers} onSimulateReturn={handleSimulateReturn} />; }
          if (currentPage === 'settings') { return <SettingsView taxes={taxes} companyInfo={companyInfo} onAddTax={handleAddTax} onToggleTax={handleToggleTax} onRemoveTax={handleRemoveTax} onCompanyInfoChange={handleCompanyInfoChange}/>; }
          if (currentPage === 'returns') { return <ReturnsLogView returnsLog={returnsLog} /> }
          if (currentPage === 'customers') { return <CustomerManagementView customers={customers} onAddCustomer={handleAddCustomer} onRemoveCustomer={handleRemoveCustomer} /> }
          if (currentPage === 'history') { return <InvoiceHistoryView sales={sales} customers={customers} /> }
          if (currentPage === 'cash') { return <CashDrawerView cashDrawer={cashDrawer} expensesLog={expensesLog} onSetInitialCash={handleSetInitialCash} onAddExpense={handleAddExpense} /> }
      }
      // Default POS view
      return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> <div className="lg:col-span-2"> <ProductList products={products} onAddToCart={handleAddToCart} searchTerm={productSearchTerm} onSearchChange={handleProductSearchChange}/> </div> <div className="space-y-6"> <Cart cartItems={cartItems} products={products} taxes={taxes} onRemoveFromCart={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onClearCart={handleClearCart}/> <Checkout cartItems={cartItems} products={products} taxes={taxes} onCheckout={handleCheckout} customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={handleSelectCustomer} /> {lastSaleForInvoice && currentPage === 'pos' && ( <Button onClick={handlePrintInvoice} variant="secondary" className="w-full"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> Imprimir Última Factura </Button> )} </div> </div> );
  };

  return (
    <div className="app-container container mx-auto p-4 font-sans bg-gray-100 min-h-screen">
        {/* Header and Navigation */}
       <div className="main-header mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center sm:text-left">{companyInfo.name || 'Sistema POS'}</h1>
            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                 {/* Role Switcher */}
                 <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm"> <span className="text-sm font-medium text-gray-600">Rol:</span> <span className={`text-sm font-semibold px-2 py-0.5 rounded ${userRole === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}> {userRole === 'admin' ? 'Administrador' : 'Cajero'} </span> <Button onClick={toggleRole} size="sm" variant="outline" className="text-xs">Cambiar Rol</Button> </div>
                 {/* Page Navigation */}
                 <nav className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-wrap justify-center"> {/* Added flex-wrap */}
                     <Button variant={currentPage === 'pos' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('pos')} className="text-xs">POS</Button>
                      {userRole === 'admin' && (
                          <React.Fragment>
                              <Button variant={currentPage === 'inventory' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('inventory')} className="text-xs">Inventario</Button>
                              <Button variant={currentPage === 'customers' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('customers')} className="text-xs">Clientes</Button> {/* NEW */}
                              <Button variant={currentPage === 'reports' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('reports')} className="text-xs">Ventas</Button> {/* Renamed */}
                              <Button variant={currentPage === 'history' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('history')} className="text-xs">Historial</Button> {/* NEW */}
                              <Button variant={currentPage === 'returns' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('returns')} className="text-xs">Devoluciones</Button>
                              <Button variant={currentPage === 'cash' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('cash')} className="text-xs">Caja</Button> {/* NEW */}
                              <Button variant={currentPage === 'settings' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentPage('settings')} className="text-xs">Configuración</Button>
                          </React.Fragment>
                      )}
                 </nav>
            </div>
       </div>
       {/* Render the active page */}
       <div className="main-content">{renderCurrentPage()}</div>
       {/* Hidden Invoice Component for Printing */}
       <div className="printable-invoice"><InvoiceView saleData={lastSaleForInvoice} companyInfo={companyInfo} customers={customers} /></div>
       {/* Tailwind CSS CDN & Font & Print Styles */}
       <script src="https://cdn.tailwindcss.com"></script>
       <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
       <style>{` body { font-family: 'Inter', sans-serif; } @media print { body * { visibility: hidden; } .printable-invoice, .printable-invoice * { visibility: visible; } .printable-invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; background-color: white !important; } .invoice-container { font-size: 10pt; color: black !important; } .invoice-container h1 { font-size: 16pt; } .invoice-container h2 { font-size: 14pt; } .invoice-container table { font-size: 9pt; } .invoice-container * { background-color: transparent !important; color: black !important; border-color: #ccc !important; } @page { size: auto; margin: 1cm; } body { margin: 0; } } `}</style>
    </div>
  );
}
export default App;
