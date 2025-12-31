/**
 * Servicio para manejar sincronización offline de ventas
 */

const PENDING_SALES_KEY = 'pending_sales';
const SYNC_IN_PROGRESS_KEY = 'sync_in_progress';

/**
 * Guarda una venta pendiente en localStorage
 */
export const savePendingSale = (saleData) => {
  try {
    const pendingSales = getPendingSales();
    const saleWithId = {
      ...saleData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    pendingSales.push(saleWithId);
    localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pendingSales));
    console.log('Venta guardada offline:', saleWithId.id);
    return saleWithId;
  } catch (error) {
    console.error('Error guardando venta offline:', error);
    throw error;
  }
};

/**
 * Obtiene todas las ventas pendientes de sincronización
 */
export const getPendingSales = () => {
  try {
    const pendingSalesJson = localStorage.getItem(PENDING_SALES_KEY);
    return pendingSalesJson ? JSON.parse(pendingSalesJson) : [];
  } catch (error) {
    console.error('Error leyendo ventas pendientes:', error);
    return [];
  }
};

/**
 * Marca una venta como sincronizada y la elimina de pendientes
 */
export const markSaleAsSynced = (saleId) => {
  try {
    const pendingSales = getPendingSales();
    const filtered = pendingSales.filter(sale => sale.id !== saleId);
    localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(filtered));
    console.log('Venta sincronizada:', saleId);
  } catch (error) {
    console.error('Error marcando venta como sincronizada:', error);
  }
};

/**
 * Marca una venta como en proceso de sincronización para evitar duplicados
 */
export const markSaleAsSyncing = (saleId) => {
  try {
    const pendingSales = getPendingSales();
    const updated = pendingSales.map(sale => 
      sale.id === saleId ? { ...sale, syncing: true } : sale
    );
    localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marcando venta como sincronizando:', error);
  }
};

/**
 * Obtiene solo las ventas pendientes que no están siendo sincronizadas
 */
export const getPendingSalesNotSyncing = () => {
  try {
    const pendingSales = getPendingSales();
    return pendingSales.filter(sale => !sale.syncing && !sale.synced);
  } catch (error) {
    console.error('Error leyendo ventas pendientes no sincronizando:', error);
    return [];
  }
};

/**
 * Desmarca una venta como sincronizando (para reintentar después de un error)
 */
export const unmarkSaleAsSyncing = (saleId) => {
  try {
    const pendingSales = getPendingSales();
    const updated = pendingSales.map(sale => 
      sale.id === saleId ? { ...sale, syncing: false } : sale
    );
    localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error desmarcando venta como sincronizando:', error);
  }
};

/**
 * Elimina una venta pendiente (por ejemplo, si falla múltiples veces)
 */
export const removePendingSale = (saleId) => {
  try {
    const pendingSales = getPendingSales();
    const filtered = pendingSales.filter(sale => sale.id !== saleId);
    localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(filtered));
    console.log('Venta eliminada de pendientes:', saleId);
  } catch (error) {
    console.error('Error eliminando venta pendiente:', error);
  }
};

/**
 * Obtiene el número de ventas pendientes
 */
export const getPendingSalesCount = () => {
  return getPendingSales().length;
};

/**
 * Verifica si hay ventas pendientes
 */
export const hasPendingSales = () => {
  return getPendingSalesCount() > 0;
};

/**
 * Limpia todas las ventas pendientes (útil para testing o reset)
 */
export const clearPendingSales = () => {
  try {
    localStorage.removeItem(PENDING_SALES_KEY);
    console.log('Ventas pendientes limpiadas');
  } catch (error) {
    console.error('Error limpiando ventas pendientes:', error);
  }
};

