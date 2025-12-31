// --- Mock Data ---
export const initialProductsData = [
  { id: 1, name: 'Café Americano', price: 2.50, costPrice: 0.80, inventory: 20, image: 'https://placehold.co/100x100/A9A9A9/FFFFFF?text=Caf%C3%A9', taxIds: [1], discountPercent: 0, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 2, name: 'Croissant', price: 1.80, costPrice: 0.60, inventory: 15, image: 'https://placehold.co/100x100/D2B48C/FFFFFF?text=Croissant', taxIds: [1], discountPercent: 10, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 3, name: 'Jugo de Naranja', price: 3.00, costPrice: 1.00, inventory: 10, image: 'https://placehold.co/100x100/FFA500/FFFFFF?text=Jugo', taxIds: [], discountPercent: 0, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 4, name: 'Sandwich de Pavo', price: 5.50, costPrice: 2.50, inventory: 8, image: 'https://placehold.co/100x100/8B4513/FFFFFF?text=Sandwich', taxIds: [1, 2], discountPercent: 0, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 5, name: 'Ensalada César', price: 6.00, costPrice: 2.80, inventory: 5, image: 'https://placehold.co/100x100/90EE90/FFFFFF?text=Ensalada', taxIds: [1], discountPercent: 5, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 6, name: 'Agua Mineral', price: 1.50, costPrice: 0.40, inventory: 30, image: 'https://placehold.co/100x100/ADD8E6/FFFFFF?text=Agua', taxIds: [], discountPercent: 0, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 7, name: 'Té Helado', price: 2.20, costPrice: 0.70, inventory: 0, image: 'https://placehold.co/100x100/F5DEB3/FFFFFF?text=T%C3%A9', taxIds: [1], discountPercent: 0, pricingMethod: 'unit', unitLabel: 'u' },
  { id: 8, name: 'Manzanas', price: 1.50, costPrice: 0.50, inventory: 50, image: 'https://placehold.co/100x100/FF6347/FFFFFF?text=Manzana', taxIds: [], discountPercent: 0, pricingMethod: 'weight', unitLabel: 'kg' },
  { id: 9, name: 'Servicio Mensual Agua', price: 25.00, costPrice: 5.00, inventory: 9999, image: 'https://placehold.co/100x100/87CEEB/FFFFFF?text=Agua', taxIds: [], discountPercent: 0, pricingMethod: 'consumption', unitLabel: 'mes' },
  // NEW: Gram-based product example
  { id: 10, name: 'Azafrán', price: 15.00, costPrice: 8.00, inventory: 1000 /*grams*/, image: 'https://placehold.co/100x100/FFD700/FFFFFF?text=Azafr%C3%A1n', taxIds: [1], discountPercent: 0, pricingMethod: 'weight', unitLabel: 'g' },
];

export const initialTaxesData = [
    { id: 1, name: 'IVA', rate: 19, enabled: true },
    { id: 2, name: 'Impoconsumo', rate: 8, enabled: false },
];

export const initialCompanyInfo = {
    name: 'QAntico POS',
    logoUrl: 'https://qanticodevs.com/img/logo.sgv',
    address: 'Calle Falsa 123, Ciudad Ejemplo',
    phone: '+57 300 123 4567',
    taxId: 'NIT: 900.123.456-7',
    footerNote: '¡Gracias por su compra!'
};

export const initialCustomersData = [
    { id: 'CUST-001', docType: 'CC', docNum: 'N/A', name: 'Cliente General', address: 'N/A', email: 'N/A', phone: 'N/A', historyLog: [] },
    { id: 'CUST-002', docType: 'NIT', docNum: '98765432-1', name: 'Empresa Ejemplo SAS', address: 'Carrera 4 5-6', email: 'contacto@empresa.com', phone: '3009876543', historyLog: [] },
    { id: 'CUST-003', docType: 'CC', docNum: '11223344', name: 'Ana García', address: 'Avenida Siempre Viva 742', email: 'ana.g@mail.com', phone: '3101112233', historyLog: [{ timestamp: Date.now() - 86400000, type: 'note', details: 'Consultó sobre garantía extendida.' }] },
];

export const initialCashDrawer = { initial: 0, current: 0, salesTotal: 0, returnsTotal: 0, expensesTotal: 0, isSet: false };

export const initialRecurringServicesData = [
    { id: 'REC-001', customerId: 'CUST-002', productId: 9, billingCycle: 'monthly', startDate: '2024-01-15', status: 'active', nextDueDate: '2024-04-15' },
    { id: 'REC-002', customerId: 'CUST-003', productId: 9, billingCycle: 'monthly', startDate: '2024-02-01', status: 'paused', nextDueDate: '2024-05-01' },
];















