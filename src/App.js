import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getUser, logout as authLogout, isSuperAdmin, isAdmin } from './utils/auth';
import { authService, productService, taxService, customerService, saleService, returnService, userService, companyService, cashDrawerService, supplierService, purchaseService, warehouseService } from './services/api';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { savePendingSale, getPendingSales, markSaleAsSynced, hasPendingSales, getPendingSalesCount, markSaleAsSyncing, getPendingSalesNotSyncing, unmarkSaleAsSyncing } from './utils/offlineSync';
import { Button } from './components/ui';
import { ProductList, Cart, SavedCartsView } from './components/pos';
import { CashDrawerBar } from './components/pos/CashDrawerBar';
import { CheckoutBar } from './components/pos/CheckoutBar';
import { WeightInputModal } from './components/pos/WeightInputModal';
import { CartDrawer } from './components/pos/CartDrawer';
import { MobileCartButton } from './components/pos/MobileCartButton';
import { MobileCheckout } from './components/pos/MobileCheckout';
import { InventoryView, SalesView, SettingsView, ReturnsLogView, ReportsView } from './components/admin';
import { AdminPasswordModal } from './components/admin/AdminPasswordModal';
import { CustomerManagementView } from './components/customers';
import { InvoiceView, InvoiceHistoryView } from './components/invoice';
import { RecurringPaymentsView } from './components/recurring';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingOverlay } from './components/ui/Loading';
import { Logo } from './components/ui/Logo';
import { AboutModal } from './components/ui/AboutModal';

function AppContent() {
  const [user, setUser] = useState(getUser());
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState('pos');
  const [sales, setSales] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [lastSaleForInvoice, setLastSaleForInvoice] = useState(null);
  const [returnsLog, setReturnsLog] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [salesFilterUserId, setSalesFilterUserId] = useState(null);
  const [cashDrawer, setCashDrawer] = useState(null);
  const [isCheckingCashDrawer, setIsCheckingCashDrawer] = useState(true);
  const [expensesLog, setExpensesLog] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [savedCarts, setSavedCarts] = useState([]);
  const [showSavedCarts, setShowSavedCarts] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [recurringServices, setRecurringServices] = useState([]);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [pendingReturnSale, setPendingReturnSale] = useState(null);
  const [returnFilters, setReturnFilters] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [pendingWeightProduct, setPendingWeightProduct] = useState(null);
  const [pendingWeightCartItemId, setPendingWeightCartItemId] = useState(null);
  const [scaleReading, setScaleReading] = useState(null);
  const loadingDataRef = useRef(false);
  const loadedUserIdRef = useRef(null);
  
  // Calcular total del carrito para el botón móvil
  const cartTotal = useMemo(() => {
    let total = 0;
    cartItems.forEach(item => {
      const price = parseFloat(item.price || 0);
      const quantity = parseFloat(item.quantity || 0);
      const weight = parseFloat(item.weight || 0);
      const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0);
      const pricingMethod = item.pricing_method || item.pricingMethod || 'fixed';
      const unitLabel = item.unit_label || item.unitLabel || '';
      
      const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
      const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
      const baseItemTotal = isWeightBased ? price * weight : price * quantity;
      const itemDiscountAmount = baseItemTotal * (discountPercent / 100);
      const itemSubtotalAfterDiscount = baseItemTotal - itemDiscountAmount;
      
      const product = products.find(p => p.id === item.id);
      const productTaxIds = product ? (product.taxes ? product.taxes.map(t => t.id) : (product.taxIds || [])) : [];
      const applicableTaxes = taxes.filter(tax => tax.enabled && productTaxIds.includes(tax.id));
      
      let itemTax = 0;
      applicableTaxes.forEach(tax => {
        itemTax += itemSubtotalAfterDiscount * (tax.rate / 100);
      });
      
      total += itemSubtotalAfterDiscount + itemTax;
    });
    return total;
  }, [cartItems, products, taxes]);
  
  // Estado de conexión
  const isOnline = useOnlineStatus();
  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  // Función para sincronizar ventas pendientes (definida con useCallback para evitar recreación)
  const syncPendingSales = useCallback(async () => {
    if (!isOnline) return;
    
    // Obtener solo ventas que no están siendo sincronizadas actualmente
    const pendingSales = getPendingSalesNotSyncing();
    if (pendingSales.length === 0) return;

    setIsLoading(true);
    setLoadingMessage(`Sincronizando ${pendingSales.length} venta(s) pendiente(s)...`);

    try {
      // Procesar ventas una por una para evitar duplicados
      for (const pendingSale of pendingSales) {
        // Marcar como sincronizando ANTES de enviar para evitar duplicados
        markSaleAsSyncing(pendingSale.id);
        
        try {
          // Intentar enviar la venta al servidor
          const response = await saleService.create(pendingSale.saleData);
          
          // Marcar como sincronizada y eliminar de pendientes
          markSaleAsSynced(pendingSale.id);
          setPendingSalesCount(getPendingSalesCount());
        } catch (error) {
          console.error(`Error sincronizando venta ${pendingSale.id}:`, error);
          
          // Si es un error de red o del servidor, desmarcar como sincronizando para reintentar después
          if (!error.response || error.response.status >= 500) {
            // Error del servidor o de red, desmarcar como sincronizando para reintentar
            unmarkSaleAsSyncing(pendingSale.id);
            continue;
          } else {
            // Error de validación u otro error del cliente, eliminar de pendientes
            console.warn(`Eliminando venta ${pendingSale.id} por error de validación`);
            markSaleAsSynced(pendingSale.id);
          }
        }
      }

      // Recargar ventas después de sincronizar si todas se sincronizaron
      if (!hasPendingSales()) {
        const salesParams = salesFilterUserId ? { user_id: salesFilterUserId } : {};
        const [salesResponse, returnsResponse] = await Promise.all([
          saleService.getAll(salesParams),
          returnService.getAll(returnFilters)
        ]);
        
        // Manejar respuesta paginada o directa
        const responseData = salesResponse.data;
        const allSales = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || []);
        // Manejar respuesta paginada o directa de returns
        const returnsData = returnsResponse.data;
        const returns = Array.isArray(returnsData) 
          ? returnsData 
          : (returnsData?.data || []);
        setReturnsLog(returns);
        
        const returnedSaleIdsSet = new Set(
          returns.map(ret => ret.sale_id || ret.sale?.id).filter(Boolean)
        );
        const activeSales = allSales.filter(sale => !returnedSaleIdsSet.has(sale.id));
        setSales(activeSales);
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, salesFilterUserId, returnFilters]);

  // Actualizar contador de ventas pendientes solo cuando cambia el estado de conexión o después de operaciones
  useEffect(() => {
    setPendingSalesCount(getPendingSalesCount());
  }, [isOnline]);

  // Sincronizar ventas pendientes cuando regrese la conexión (con debounce para evitar múltiples ejecuciones)
  useEffect(() => {
    if (!isOnline || !hasPendingSales()) return;
    
    // Debounce: esperar 1 segundo antes de sincronizar para evitar múltiples ejecuciones simultáneas
    const timeoutId = setTimeout(() => {
      syncPendingSales();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isOnline, syncPendingSales]);

  // Efecto para mostrar modal automáticamente cuando hay lectura de báscula y producto pendiente
  useEffect(() => {
    if (scaleReading !== null && scaleReading > 0 && pendingWeightProduct && !showWeightModal) {
      setShowWeightModal(true);
    }
  }, [scaleReading, pendingWeightProduct, showWeightModal]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Cargar información completa de la empresa
        // Intentar cargar desde la API usando company_id o company.id
        const companyIdToLoad = currentUser?.company_id || currentUser?.company?.id;
        if (companyIdToLoad) {
          try {
            const companyResponse = await companyService.getById(companyIdToLoad);
            const company = companyResponse.data;
            if (company) {
              const electronicInvoicingEnabled = Boolean(company.electronic_invoicing_enabled);
              const newCompanyInfo = {
                id: company.id,
                name: company.name || '',
                taxId: company.tax_id || '',
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                logoUrl: company.logo_url || '',
                footerNote: company.footer_note || '',
                electronicInvoicingEnabled: electronicInvoicingEnabled,
              };
              setCompanyInfo(newCompanyInfo);
            } else {
              console.warn('Company not found for company_id:', companyIdToLoad);
              // Usar fallback si no se encuentra
              if (currentUser?.company) {
                const fallbackCompany = {
                  ...currentUser.company,
                  electronicInvoicingEnabled: Boolean(currentUser.company.electronic_invoicing_enabled || false),
                };
                setCompanyInfo(fallbackCompany);
              }
            }
          } catch (error) {
            console.error('Error loading company info:', error);
            // Si falla, usar la información básica del usuario
            if (currentUser?.company) {
              const fallbackCompany = {
                ...currentUser.company,
                electronicInvoicingEnabled: Boolean(currentUser.company.electronic_invoicing_enabled || false),
              };
              setCompanyInfo(fallbackCompany);
            }
          }
        } else if (currentUser?.company) {
          const fallbackCompany = {
            ...currentUser.company,
            electronicInvoicingEnabled: Boolean(currentUser.company.electronic_invoicing_enabled || false),
          };
          setCompanyInfo(fallbackCompany);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        authLogout();
      }
    };

    if (getUser()) {
      loadUser();
    }
  }, []);

  // Cargar datos iniciales (solo una vez cuando cambia el usuario)
  useEffect(() => {
    // Evitar múltiples ejecuciones simultáneas o para el mismo usuario
    if (!user) {
      loadedUserIdRef.current = null;
      loadingDataRef.current = false;
      return;
    }

    // Si ya se cargó para este usuario o está cargando, no hacer nada
    if (loadedUserIdRef.current === user.id || loadingDataRef.current) {
      return;
    }

    // Si ya se marcó como cargado pero es otro usuario, resetear
    if (initialDataLoaded && loadedUserIdRef.current !== user.id) {
      setInitialDataLoaded(false);
    }

    const loadInitialData = async () => {
      // Doble verificación antes de cargar
      if (loadingDataRef.current || loadedUserIdRef.current === user.id) {
        return;
      }

      loadingDataRef.current = true;
      loadedUserIdRef.current = user.id;
      
      setIsLoadingData(true);
      setIsLoading(true);
      setLoadingMessage('Cargando datos iniciales...');
      
      try {
        // Preparar llamadas en paralelo (productos, impuestos, clientes, devoluciones, ventas, proveedores, compras, bodegas)
        const promises = [
          productService.getAll(),
          taxService.getAll(),
          customerService.getAll(),
          returnService.getAll({}), // Cargar sin filtros inicialmente
          saleService.getAll({}), // Cargar sin filtros inicialmente
          supplierService.getAll(), // Cargar proveedores
          purchaseService.getAll(), // Cargar compras
          warehouseService.getAll(), // Cargar bodegas
        ];

        // Si es administrador, cargar también usuarios/cajeros
        if (user.role === 'admin' || user.role === 'super_admin') {
          promises.push(userService.getAll());
        }

        const results = await Promise.all(promises);

        setProducts(results[0].data || []);
        setTaxes(results[1].data || []);
        setCustomers(results[2].data || []);
        
        // Manejar respuesta paginada o directa de returns
        const returnsResponse = results[3].data;
        const returns = Array.isArray(returnsResponse) 
          ? returnsResponse 
          : (returnsResponse?.data || []);
        setReturnsLog(returns);
        
        // Manejar respuesta paginada o directa de sales
        const salesResponse = results[4].data;
        const allSales = Array.isArray(salesResponse) 
          ? salesResponse 
          : (salesResponse?.data || []);
        
        const returnedSaleIdsSet = new Set(
          returns.map(ret => ret.sale_id || ret.sale?.id).filter(Boolean)
        );
        const activeSales = allSales.filter(sale => !returnedSaleIdsSet.has(sale.id));
        setSales(activeSales);
        
        // Cargar proveedores
        setSuppliers(results[5]?.data || []);
        
        // Cargar compras
        setPurchases(results[6]?.data || []);
        
        // Cargar bodegas
        setWarehouses(results[7]?.data || []);
        
        // Si es administrador, guardar usuarios
        if (user.role === 'admin' || user.role === 'super_admin') {
          setUsers(results[7]?.data || []);
        } else {
          setUsers([]);
        }
        
        setInitialDataLoaded(true);
      } catch (error) {
        // Manejar errores 429 (Too Many Requests) específicamente
        if (error.response?.status === 429) {
          console.warn('Rate limit alcanzado. Esperando antes de reintentar...');
          // Resetear flags para permitir reintento después
          loadingDataRef.current = false;
          loadedUserIdRef.current = null;
          // Reintentar después de 2 segundos
          setTimeout(() => {
            if (user && loadedUserIdRef.current !== user.id) {
              loadInitialData();
            }
          }, 2000);
          return;
        }

        // Solo loguear errores que no sean de red (que son esperados en modo offline o cuando el backend no está disponible)
        const isNetworkError = error.code === 'ERR_NETWORK' || 
                               error.code === 'ERR_NETWORK_CHANGED' ||
                               error.message === 'Network Error' ||
                               error.message?.includes('Network Error');
        
        if (!isNetworkError) {
          console.error('Error loading initial data:', error);
        }
        // Si hay error de red, establecer valores por defecto para que la app pueda funcionar
             if (isNetworkError) {
               setProducts([]);
               setTaxes([]);
               setCustomers([]);
               setReturnsLog([]);
               setSales([]);
               setSuppliers([]);
               setPurchases([]);
               setWarehouses([]);
               if (user.role === 'admin' || user.role === 'super_admin') {
                 setUsers([]);
               }
             }
      } finally {
        loadingDataRef.current = false;
        setIsLoadingData(false);
        setIsLoading(false);
      }
    };

    // Pequeño delay para evitar ejecuciones simultáneas en StrictMode
    const timeoutId = setTimeout(() => {
      loadInitialData();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user?.id]); // Solo cuando cambia el ID del usuario

  // Cargar devoluciones cuando cambian los filtros (solo después de carga inicial)
  useEffect(() => {
    const loadReturns = async () => {
      if (!user || !initialDataLoaded) return;
      
      try {
        const returnsResponse = await returnService.getAll(returnFilters);
        // Manejar respuesta paginada o directa
        const responseData = returnsResponse.data;
        const returns = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || []);
        setReturnsLog(returns);
      } catch (error) {
        console.error('Error loading returns:', error);
      }
    };

    if (user && initialDataLoaded) {
      loadReturns();
    }
  }, [user, returnFilters, initialDataLoaded]);

  // Memoizar el Set de IDs de ventas devueltas para evitar recalcularlo en cada render
  const returnedSaleIdsSet = useMemo(() => {
    if (!Array.isArray(returnsLog)) {
      return new Set();
    }
    return new Set(
      returnsLog.map(ret => ret.sale_id || ret.sale?.id).filter(Boolean)
    );
  }, [returnsLog]);

  // Cargar ventas cuando cambia el filtro de cajero (solo después de carga inicial)
  useEffect(() => {
    const loadSales = async () => {
      if (!user || !initialDataLoaded) return;
      
      setIsLoadingSales(true);
      setIsLoading(true);
      setLoadingMessage('Cargando ventas...');
      try {
        const salesParams = salesFilterUserId ? { user_id: salesFilterUserId } : {};
        const salesResponse = await saleService.getAll(salesParams);
        // Manejar respuesta paginada o directa
        const responseData = salesResponse.data;
        const allSales = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || []);
        
        // Filtrar ventas que NO tienen devoluciones
        const returnedIds = new Set(
          returnsLog.map(ret => ret.sale_id || ret.sale?.id).filter(Boolean)
        );
        const activeSales = allSales.filter(sale => !returnedIds.has(sale.id));
        setSales(activeSales);
      } catch (error) {
        console.error('Error loading sales:', error);
      } finally {
        setIsLoadingSales(false);
        setIsLoading(false);
      }
    };

    if (user && initialDataLoaded) {
      loadSales();
    }
  }, [user, salesFilterUserId, initialDataLoaded, returnsLog]);

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setInitialDataLoaded(false); // Resetear flag al cerrar sesión
    setCashDrawer(null);
    navigate('/login');
  };

  // Cargar caja activa del usuario
  const loadActiveCashDrawer = useCallback(async () => {
    if (!user) {
      setCashDrawer(null);
      setIsCheckingCashDrawer(false);
      return;
    }
    
    setIsCheckingCashDrawer(true);
    
    try {
      const response = await cashDrawerService.getActive();
      
      // Verificar si hay datos válidos
      if (response.data && response.data.id) {
        // Asegurarse de que is_closed sea un booleano
        const cashDrawerData = {
          ...response.data,
          is_closed: response.data.is_closed === true || response.data.is_closed === 1 || response.data.is_closed === '1'
        };
        setCashDrawer(cashDrawerData);
      } else {
        // No hay caja activa (null o vacío)
        setCashDrawer(null);
      }
    } catch (error) {
      // Si es 404 o la respuesta es null, significa que no hay caja activa (esto es normal)
      if (error.response?.status === 404 || (error.response?.status === 200 && error.response?.data === null)) {
        setCashDrawer(null);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        // Errores de red son esperados en modo offline, no loguear
        setCashDrawer(null);
      } else {
        // Para otros errores, loguear para debugging pero establecer null
        console.error('Error loading active cash drawer:', error);
        setCashDrawer(null);
      }
    } finally {
      setIsCheckingCashDrawer(false);
    }
  }, [user]);

  // Cargar caja activa automáticamente cuando el usuario está disponible
  useEffect(() => {
    if (user) {
      loadActiveCashDrawer();
    } else {
      // Si no hay usuario, limpiar la caja
      setCashDrawer(null);
    }
  }, [user, loadActiveCashDrawer]);

  // Abrir caja
  const handleOpenCashDrawer = useCallback(async (openingAmount) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Abriendo caja...');
      
      const response = await cashDrawerService.create({
        opening_amount: openingAmount,
      });
      
      // Si la respuesta tiene un mensaje de reapertura o cash_drawer, cargar la caja
      if (response.data?.cash_drawer) {
        setCashDrawer(response.data.cash_drawer);
        if (response.data?.message) {
          alert(response.data.message);
        } else {
          alert('Caja abierta exitosamente');
        }
      } else if (response.data?.error && response.data?.cash_drawer) {
        // Si hay un error pero también hay cash_drawer (caja existente abierta)
        const existingDrawer = response.data.cash_drawer;
        setCashDrawer(existingDrawer);
        alert('Ya existe una caja abierta para hoy. Se ha cargado la caja existente.');
      } else {
        setCashDrawer(response.data);
        alert('Caja abierta exitosamente');
      }
      
      // Recargar la caja para asegurar que tenemos el estado más reciente
      await loadActiveCashDrawer();
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      
      // Si el error es 409 (conflicto), manejar según el tipo de caja
      if (error.response?.status === 409 && error.response?.data?.cash_drawer) {
        const existingDrawer = error.response.data.cash_drawer;
        
        // Si la caja está abierta, cargarla
        if (!existingDrawer.is_closed) {
          setCashDrawer(existingDrawer);
          alert('Ya existe una caja abierta para hoy. Se ha cargado la caja existente.');
          await loadActiveCashDrawer();
        } else {
          // Si está cerrada, el backend debería haberla reabierto automáticamente
          // pero por si acaso, intentar recargar
          await loadActiveCashDrawer();
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ya existe una caja cerrada para este usuario hoy.';
          alert(errorMessage);
        }
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al abrir la caja. Por favor, intente nuevamente.';
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadActiveCashDrawer]);

  // Cerrar caja
  const handleCloseCashDrawer = useCallback(async (closingAmount, countDetails = null, notes = '') => {
    if (!cashDrawer || !cashDrawer.id) {
      alert('Error: No hay caja abierta para cerrar');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage('Cerrando caja...');
      
      await cashDrawerService.close(cashDrawer.id, {
        closing_amount: closingAmount,
        current_amount: closingAmount,
        is_closed: true,
        count_details: countDetails,
        notes: notes,
      });
      
      // Recargar la caja para obtener el estado actualizado (debería devolver null si está cerrada)
      await loadActiveCashDrawer();
      
      // Limpiar el estado de la caja manualmente para asegurar que se actualice
      setCashDrawer(null);
      
      alert('Caja cerrada exitosamente');
    } catch (error) {
      console.error('Error closing cash drawer:', error);
      alert('Error al cerrar la caja. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [cashDrawer, loadActiveCashDrawer]);

  // Función para recargar información de la empresa
  const reloadCompanyInfo = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.company_id) {
        const companyResponse = await companyService.getAll();
        const companies = Array.isArray(companyResponse.data) ? companyResponse.data : [companyResponse.data];
        const company = companies.find(c => c.id === currentUser.company_id) || companies[0];
        if (company) {
          const rawValue = company.electronic_invoicing_enabled !== undefined ? company.electronic_invoicing_enabled : false;
          const electronicInvoicingEnabled = Boolean(rawValue);
          const updated = {
            id: company.id,
            name: company.name || '',
            taxId: company.tax_id || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            logoUrl: company.logo_url || '',
            footerNote: company.footer_note || '',
            electronicInvoicingEnabled: electronicInvoicingEnabled,
          };
          setCompanyInfo(updated);
        }
      }
    } catch (error) {
      console.error('Error reloading company info:', error);
    }
  }, []);

  // Manejar cambios en la información de la empresa (solo estado local)
  const handleCompanyInfoChange = useCallback((name, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Guardar información de la empresa en el backend
  const handleSaveCompanyInfo = useCallback(async () => {
    if (!companyInfo || !companyInfo.id) {
      alert('No se puede guardar: información de empresa no disponible');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage('Guardando información de la empresa...');
      
      // Mapear nombres de campos del frontend al backend
      const companyData = {
        name: companyInfo.name,
        tax_id: companyInfo.taxId,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        logo_url: companyInfo.logoUrl,
        footer_note: companyInfo.footerNote,
      };

      await companyService.update(companyInfo.id, companyData);
      
      // Actualizar estado local con la respuesta del servidor
      const updatedResponse = await companyService.getById(companyInfo.id);
      const updatedCompany = updatedResponse.data;
      
      const savedCompanyInfo = {
        id: updatedCompany.id,
        name: updatedCompany.name || '',
        taxId: updatedCompany.tax_id || '',
        address: updatedCompany.address || '',
        phone: updatedCompany.phone || '',
        email: updatedCompany.email || '',
        logoUrl: updatedCompany.logo_url || '',
        footerNote: updatedCompany.footer_note || '',
        electronicInvoicingEnabled: Boolean(updatedCompany.electronic_invoicing_enabled),
      };
      setCompanyInfo(savedCompanyInfo);
      
      alert('Información de la empresa guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar información de la empresa:', error);
      alert('Error al guardar la información. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [companyInfo]);

  const userRole = user?.role || 'cashier';


  useEffect(() => {
      if (showInvoicePreview && lastSaleForInvoice) {
          setTimeout(() => {
              window.print();
      }, 50);
      }
  }, [showInvoicePreview, lastSaleForInvoice]);

  // Handlers que usan la API
  const handleAddProduct = async (productData) => {
    try {
      // Mapear los datos del formulario al formato de la API
      // Mapear pricing_method: 'fixed' -> 'unit', 'per_unit' -> 'unit' (o mantener si es 'weight' o 'consumption')
      let pricingMethod = productData.pricingMethod || 'fixed';
      if (pricingMethod === 'fixed' || pricingMethod === 'per_unit') {
        pricingMethod = 'unit';
      } else if (pricingMethod === 'weight') {
        pricingMethod = 'weight';
      } else if (pricingMethod === 'consumption') {
        pricingMethod = 'consumption';
      } else {
        pricingMethod = 'unit'; // Default
      }
      
      const apiData = {
        name: productData.name,
        description: productData.description || null,
        barcode: productData.barcode || null,
        price: parseFloat(productData.price),
        cost_price: parseFloat(productData.costPrice || 0),
        inventory: parseInt(productData.inventory || 0, 10),
        image: productData.image || null,
        discount_percent: parseFloat(productData.discountPercent || 0),
        pricing_method: pricingMethod,
        unit_label: (productData.unitLabel || 'u').substring(0, 50), // Limitar a 50 caracteres
        tax_ids: Array.isArray(productData.taxIds) ? productData.taxIds : [],
      };

      const response = await productService.create(apiData);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      const newProduct = response.data;
      
      // Agregar el producto nuevo directamente sin recargar todos los productos
      setProducts(prev => [...prev, newProduct]);
      
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error completo al crear producto:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Error desconocido al crear el producto';
      
      if (error.response?.status === 422) {
        // Errores de validación de Laravel
        if (error.response.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = 'Errores de validación:\n' + Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'No estás autenticado. Por favor inicia sesión nuevamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor. Por favor verifica la consola para más detalles.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Mensaje de error final:', errorMessage);
      alert('Error al crear el producto:\n' + errorMessage);
      throw error;
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      await productService.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateInventory = async (productId, newInventory) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      await productService.update(productId, {
        inventory: newInventory,
      });
      
      // Actualizar solo el producto afectado en lugar de recargar todos
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, inventory: newInventory } : p
      ));
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      alert('Error al actualizar inventario: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProductTaxToggle = async (productId, taxId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const currentTaxIds = product.taxes?.map(t => t.id) || [];
      const newTaxIds = currentTaxIds.includes(taxId)
        ? currentTaxIds.filter(id => id !== taxId)
        : [...currentTaxIds, taxId];

      const response = await productService.update(productId, {
        tax_ids: newTaxIds,
      });

      // Actualizar solo el producto afectado con los datos del servidor
      if (response.data) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? response.data : p
        ));
      }
    } catch (error) {
      console.error('Error al actualizar impuestos del producto:', error);
      alert('Error al actualizar impuestos: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProductDiscountChange = async (productId, discountPercent) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      await productService.update(productId, {
        discount_percent: discountPercent,
      });

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, discount_percent: discountPercent } : p
      ));
    } catch (error) {
      console.error('Error al actualizar descuento:', error);
    }
  };

  // Funciones del carrito
  const handleAddToCart = (product, weightValue = null) => {
    const productPrice = parseFloat(product.price || 0);
    const productInventory = parseInt(product.inventory || 0, 10);
    const pricingMethod = product.pricing_method || product.pricingMethod || 'unit';
    const unitLabel = product.unit_label || product.unitLabel || 'u';
    const discountPercent = parseFloat(product.discount_percent || product.discountPercent || 0);
    
    // Verificar stock (excepto para servicios/consumo)
    const isConsumption = pricingMethod === 'consumption' || (pricingMethod === 'per_unit' && (unitLabel.includes('mes') || unitLabel.includes('servicio') || unitLabel.includes('consumo')));
    // Detectar productos por peso: 
    // - pricing_method === 'weight' 
    // - O unit_label incluye unidades de peso (kg, lb, g, gr, peso) independientemente del pricing_method
    const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
    const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
    
    if (!isConsumption && productInventory <= 0) {
      alert('No hay stock disponible para este producto');
      return;
    }

    // Si es producto por peso y no se proporcionó peso, mostrar modal
    if (isWeightBased && weightValue === null) {
      setPendingWeightProduct(product);
      setShowWeightModal(true);
      return;
    }

    // Buscar si el producto ya está en el carrito
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Si ya existe y es por peso, agregar al peso existente
      if (isWeightBased && weightValue !== null) {
        const existingItem = cartItems[existingItemIndex];
        const newWeight = parseFloat(existingItem.weight || 0) + weightValue;
        setCartItems(prev => prev.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, weight: newWeight }
            : item
        ));
      } else if (!isWeightBased) {
        // Si ya existe y no es por peso, aumentar la cantidad
        const existingItem = cartItems[existingItemIndex];
        const newQuantity = parseFloat(existingItem.quantity || 0) + 1;
        
        // Verificar stock disponible
        if (!isConsumption && newQuantity > productInventory) {
          alert(`Solo hay ${productInventory} unidades disponibles`);
          return;
        }
        
        setCartItems(prev => prev.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    } else {
      // Si no existe, agregarlo al carrito
      const cartItemId = Date.now(); // ID temporal único
      const newItem = {
        cartItemId: cartItemId,
        id: product.id,
        name: product.name,
        price: productPrice,
        quantity: isWeightBased ? 0 : 1,
        weight: isWeightBased ? (weightValue || 0) : 0,
        discountPercent: discountPercent,
        discount_percent: discountPercent,
        pricingMethod: pricingMethod,
        pricing_method: pricingMethod,
        unitLabel: unitLabel,
        unit_label: unitLabel,
        taxes: product.taxes || [],
      };
      
      setCartItems(prev => [...prev, newItem]);
    }
    
    // Limpiar lectura de báscula después de agregar
    setScaleReading(null);
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleUpdateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(cartItemId);
      return;
    }
    
    setCartItems(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        // Verificar stock disponible
        const product = products.find(p => p.id === item.id);
        if (product) {
          const productInventory = parseInt(product.inventory || 0, 10);
          const pricingMethod = item.pricing_method || item.pricingMethod || 'unit';
          const unitLabel = item.unit_label || item.unitLabel || '';
          const isConsumption = pricingMethod === 'consumption' || (pricingMethod === 'per_unit' && (unitLabel.includes('mes') || unitLabel.includes('servicio') || unitLabel.includes('consumo')));
          
          if (!isConsumption && newQuantity > productInventory) {
            alert(`Solo hay ${productInventory} unidades disponibles`);
            return item;
          }
        }
        
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleUpdateWeight = (cartItemId) => {
    const item = cartItems.find(item => item.cartItemId === cartItemId);
    if (item) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        setPendingWeightCartItemId(cartItemId);
        setPendingWeightProduct(product);
        setShowWeightModal(true);
      }
    }
  };

  const handleConfirmWeight = (weightValue) => {
    if (pendingWeightCartItemId) {
      // Actualizar peso de un item existente
      setCartItems(prev => prev.map(item => {
        if (item.cartItemId === pendingWeightCartItemId) {
          return { ...item, weight: weightValue };
        }
        return item;
      }));
      setPendingWeightCartItemId(null);
    } else if (pendingWeightProduct) {
      // Agregar nuevo producto con peso
      handleAddToCart(pendingWeightProduct, weightValue);
      setPendingWeightProduct(null);
    }
    setShowWeightModal(false);
    setScaleReading(null);
  };

  const handleCancelWeight = () => {
    setShowWeightModal(false);
    setPendingWeightProduct(null);
    setPendingWeightCartItemId(null);
    setScaleReading(null);
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      setCartItems([]);
    }
  };

  const handleSaveCart = () => {
    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    const cartName = prompt('Ingresa un nombre para este carrito guardado:');
    if (!cartName || !cartName.trim()) {
      return;
    }
    
    const savedCart = {
      id: Date.now(),
      name: cartName.trim(),
      items: [...cartItems],
      createdAt: new Date().toISOString(),
    };
    
    setSavedCarts(prev => [...prev, savedCart]);
    alert('Carrito guardado exitosamente');
  };

  const handleToggleSavedCarts = () => {
    setShowSavedCarts(prev => !prev);
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
  };

  const handleCheckout = async (checkoutData) => {
    try {
      if (cartItems.length === 0) {
        alert('El carrito está vacío');
        return;
      }

      // Validar que la caja esté abierta
      if (!cashDrawer || cashDrawer.is_closed) {
        alert('⚠️ La caja está cerrada. Debe abrir la caja antes de realizar ventas.');
        return;
      }

      // Preparar items para la venta
      const saleItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.id);
        const price = parseFloat(item.price || 0);
        const quantity = parseFloat(item.quantity || 0);
        const weight = parseFloat(item.weight || 0);
        const discountPercent = parseFloat(item.discount_percent || item.discountPercent || 0);
        const pricingMethod = item.pricing_method || item.pricingMethod || 'unit';
        const unitLabel = item.unit_label || item.unitLabel || '';
        
        // Detectar productos por peso basándose en unit_label
        const weightUnits = ['kg', 'lb', 'g', 'gr', 'gramo', 'gramos', 'kilogramo', 'kilogramos', 'libra', 'libras', 'peso'];
        const isWeightBased = pricingMethod === 'weight' || weightUnits.some(unit => unitLabel.toLowerCase().includes(unit));
        const baseTotal = isWeightBased ? price * weight : price * quantity;
        const discountAmount = baseTotal * (discountPercent / 100);
        
        // Calcular impuestos
        const productTaxIds = product ? (product.taxes ? product.taxes.map(t => t.id) : []) : [];
        const applicableTaxes = taxes.filter(tax => tax.enabled && productTaxIds.includes(tax.id));
        let taxAmount = 0;
        applicableTaxes.forEach(tax => {
          taxAmount += (baseTotal - discountAmount) * (parseFloat(tax.rate || 0) / 100);
        });

        return {
          product_id: item.id,
          quantity: isWeightBased ? weight : quantity,
          price: price,
          weight: isWeightBased ? weight : null,
          discount_amount: discountAmount,
          discount_percent: discountPercent,
          tax_amount: taxAmount,
        };
      });

      // Crear la venta
      const saleData = {
        customer_id: checkoutData.customerId || null,
        items: saleItems,
        subtotal: checkoutData.subtotal,
        total_discount_amount: checkoutData.totalDiscountAmount,
        subtotal_after_discounts: checkoutData.subtotalAfterDiscounts,
        total_tax_amount: checkoutData.totalTaxAmount,
        final_total: checkoutData.finalTotal,
        tax_breakdown_details: checkoutData.taxBreakdown,
        document_type: checkoutData.documentType || null, // 'ticket' o 'electronic_invoice', null para auto-determinar
        payment_method: checkoutData.paymentMethod || 'cash', // 'cash', 'card', 'nequi', 'daviplata'
        cash_received: checkoutData.cashReceived || null,
        change: checkoutData.change || 0,
      };


      // Verificar si hay conexión
      if (!isOnline) {
        // Sin conexión: guardar localmente
        const pendingSale = savePendingSale({ saleData });
        setPendingSalesCount(getPendingSalesCount());
        
        // Crear una venta local para mostrar el invoice
        const localSale = {
          id: pendingSale.id,
          sale_number: `OFFLINE-${Date.now()}`,
          ...saleData,
          created_at: new Date().toISOString(),
          is_offline: true,
        };
        
        setLastSaleForInvoice(localSale);
        setCartItems([]);
        setSelectedCustomerId(null);
        setIsLoading(false);
        
        alert(`Venta guardada localmente (sin conexión).\nSe sincronizará automáticamente cuando regrese la conexión.\n\nVentas pendientes: ${getPendingSalesCount()}`);
        return;
      }

      // Con conexión: intentar enviar al servidor
      setIsLoading(true);
      setLoadingMessage('Procesando venta...');
      try {
        const response = await saleService.create(saleData);

        // Guardar la venta para mostrar el invoice
        setLastSaleForInvoice(response.data);
        
        // Limpiar el carrito
        setCartItems([]);
        setSelectedCustomerId(null);
        
        // Agregar la nueva venta directamente sin recargar todas las ventas
        setSales(prev => [response.data, ...prev]);

        alert('Venta procesada exitosamente');
        
        // Actualizar la caja después de la venta
        if (cashDrawer && cashDrawer.id) {
          try {
            await loadActiveCashDrawer();
          } catch (error) {
            console.error('Error updating cash drawer after sale:', error);
          }
        }
      } catch (networkError) {
        // Error de red: guardar localmente
        console.warn('Error de red al crear venta, guardando localmente:', networkError);
        const pendingSale = savePendingSale({ saleData });
        setPendingSalesCount(getPendingSalesCount());
        
        const localSale = {
          id: pendingSale.id,
          sale_number: `OFFLINE-${Date.now()}`,
          ...saleData,
          created_at: new Date().toISOString(),
          is_offline: true,
        };
        
        setLastSaleForInvoice(localSale);
        setCartItems([]);
        setSelectedCustomerId(null);
        setIsLoading(false);
        
        alert(`Error de conexión. Venta guardada localmente.\nSe sincronizará automáticamente cuando regrese la conexión.\n\nVentas pendientes: ${getPendingSalesCount()}`);
      }
    } catch (error) {
      console.error('Error al procesar venta:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Error desconocido al procesar la venta';
      
      if (error.response?.status === 422) {
        if (error.response.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = 'Errores de validación:\n' + Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('Error al procesar la venta:\n' + errorMessage);
    }
  };

  const handleReturnSale = async (sale) => {
    if (!sale || !sale.id) {
      alert('Error: Venta no válida');
      return;
    }

    // Guardar la venta pendiente y mostrar el modal de autorización
    setPendingReturnSale(sale);
    setShowAdminPasswordModal(true);
  };

  const handleConfirmReturn = async (adminPassword) => {
    if (!pendingReturnSale) return;

    try {
      const sale = pendingReturnSale;
      const saleNumber = sale.sale_number || sale.id;

      // Crear la devolución (devolver todos los items) con la contraseña del administrador
      const returnData = {
        sale_id: sale.id,
        return_all_items: true,
        reason: 'Devolución completa de venta',
        admin_password: adminPassword,
      };

      const response = await returnService.create(returnData);

      // Cerrar el modal
      setShowAdminPasswordModal(false);
      setPendingReturnSale(null);

      // Actualizar productos afectados por la devolución (restaurar inventario)
      if (response.data?.items) {
        const updatedProductIds = new Set();
        response.data.items.forEach(item => {
          if (item.product_id) updatedProductIds.add(item.product_id);
        });
        
        // Recargar solo los productos afectados
        try {
          const productsToUpdate = await Promise.all(
            Array.from(updatedProductIds).map(productId => 
              productService.getById(productId).catch(() => null)
            )
          );
          
          setProducts(prev => prev.map(p => {
            const updated = productsToUpdate.find(pr => pr?.data?.id === p.id);
            return updated?.data || p;
          }));
        } catch (error) {
          console.error('Error updating products after return:', error);
          // Si falla, recargar todos los productos como fallback
          const productsResponse = await productService.getAll();
          setProducts(productsResponse.data || []);
        }
      }

      // Agregar la devolución y remover la venta de la lista
      setReturnsLog(prev => [response.data, ...prev]);
      setSales(prev => prev.filter(sale => sale.id !== pendingReturnSale.id));

      // Recargar la caja para actualizar el monto después de la devolución
      try {
        await loadActiveCashDrawer();
      } catch (error) {
        console.error('Error updating cash drawer after return:', error);
      }

      const totalReturned = parseFloat(response.data.total_returned || 0);
      alert(`Devolución procesada exitosamente.\n\nNúmero de devolución: ${response.data.return_number}\nTotal devuelto: $${totalReturned.toFixed(2)}\n\nLa venta ha sido eliminada de la lista y el inventario ha sido restaurado.`);
    } catch (error) {
      console.error('Error al procesar devolución:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Error desconocido al procesar la devolución';
      
      if (error.response?.status === 403) {
        errorMessage = error.response.data?.message || 'La contraseña del administrador es incorrecta';
      } else if (error.response?.status === 422) {
        if (error.response.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = 'Errores de validación:\n' + Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('Error al procesar la devolución:\n' + errorMessage);
      
      // Cerrar el modal en caso de error
      setShowAdminPasswordModal(false);
      setPendingReturnSale(null);
    }
  };

  const handleCancelReturn = () => {
    setShowAdminPasswordModal(false);
    setPendingReturnSale(null);
  };

  const handleReturnFiltersChange = useCallback(async (filters) => {
    setReturnFilters(filters);
    // El useEffect se encargará de cargar las devoluciones cuando cambien los filtros
  }, []);

  const renderCurrentPage = () => {
    // Vistas disponibles para administradores y super admins
    if (userRole === 'admin' || userRole === 'super_admin') {
      if (currentPage === 'inventory') {
        return (
          <InventoryView
            products={products}
            taxes={taxes}
            suppliers={suppliers}
            warehouses={warehouses}
            onUpdateInventory={handleUpdateInventory}
            onProductTaxToggle={handleProductTaxToggle}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onProductDiscountChange={handleProductDiscountChange}
            searchTerm={inventorySearchTerm}
            onSearchChange={setInventorySearchTerm}
            onProductUpdated={async () => {
              try {
                const productsResponse = await productService.getAll();
                setProducts(productsResponse.data || []);
              } catch (error) {
                console.error('Error reloading products:', error);
              }
            }}
            onSuppliersReload={async () => {
              try {
                const suppliersResponse = await supplierService.getAll();
                setSuppliers(suppliersResponse.data || []);
              } catch (error) {
                console.error('Error reloading suppliers:', error);
              }
            }}
          />
        );
      }
      if (currentPage === 'sales') {
        return <SalesView sales={sales} customers={customers} products={products} onSimulateReturn={handleReturnSale} userRole={userRole} users={users} onFilterByUser={setSalesFilterUserId} isLoading={isLoadingData} isLoadingSales={isLoadingSales} />;
      }
      if (currentPage === 'settings') {
        return (
          <SettingsView
            taxes={taxes}
            companyInfo={companyInfo || {}}
            onAddTax={() => {}}
            onToggleTax={() => {}}
            onRemoveTax={() => {}}
            onCompanyInfoChange={handleCompanyInfoChange}
            onSaveCompanyInfo={handleSaveCompanyInfo}
            onElectronicInvoicingConfigUpdated={reloadCompanyInfo}
          />
        );
      }
      if (currentPage === 'returns') {
        return <ReturnsLogView returnsLog={returnsLog} onFilterChange={handleReturnFiltersChange} userRole={userRole} isLoading={isLoadingData} />;
      }
      if (currentPage === 'customers') {
        return (
          <CustomerManagementView
            customers={customers}
            onAddCustomer={() => {}}
            onRemoveCustomer={() => {}}
            onAddCustomerHistory={() => {}}
          />
        );
      }
      if (currentPage === 'history') {
        return <InvoiceHistoryView sales={sales} customers={customers} />;
      }
      if (currentPage === 'reports') {
        return (
          <ReportsView
            sales={sales}
            expensesLog={expensesLog}
            products={products}
            taxes={taxes}
            cashDrawer={cashDrawer}
          />
        );
      }
      if (currentPage === 'recurring') {
        return (
          <RecurringPaymentsView
            recurringServices={recurringServices}
            customers={customers}
            products={products}
            onAddService={() => {}}
            onToggleServiceStatus={() => {}}
            onRemoveService={() => {}}
          />
        );
      }
    }

    // Vistas disponibles para cajeros (para hacer devoluciones)
    if (userRole === 'cashier') {
      if (currentPage === 'sales') {
        return <SalesView sales={sales} customers={customers} products={products} onSimulateReturn={handleReturnSale} userRole={userRole} users={users} onFilterByUser={setSalesFilterUserId} isLoading={isLoadingData} isLoadingSales={isLoadingSales} />;
      }
      if (currentPage === 'returns') {
        return <ReturnsLogView returnsLog={returnsLog} onFilterChange={handleReturnFiltersChange} userRole={userRole} isLoading={isLoadingData} />;
      }
    }

    return (
      <>
        {/* Layout responsive: móvil primero, luego desktop */}
        <div className="relative">
          {/* Vista móvil: productos en pantalla completa */}
          <div className="lg:hidden">
            <div className="pb-24">
              <ProductList
                products={products}
                onAddToCart={handleAddToCart}
                searchTerm={productSearchTerm}
                onSearchChange={setProductSearchTerm}
                scaleReading={scaleReading}
                onScaleReadingChange={setScaleReading}
              />
            </div>
            
            {/* Botón flotante para abrir carrito en móviles */}
            <MobileCartButton
              cartItemsCount={cartItems.length}
              total={cartTotal}
              onClick={() => setShowCartDrawer(true)}
            />
            
            {/* Checkout móvil simplificado */}
            <MobileCheckout
              cartItems={cartItems}
              products={products}
              taxes={taxes}
              onCheckout={handleCheckout}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={handleSelectCustomer}
              electronicInvoicingEnabled={Boolean(companyInfo?.electronicInvoicingEnabled)}
            />
            
            {/* Drawer del carrito para móviles */}
            <CartDrawer
              isOpen={showCartDrawer}
              onClose={() => setShowCartDrawer(false)}
              cartItems={cartItems}
              products={products}
              taxes={taxes}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateWeight={handleUpdateWeight}
              onClearCart={handleClearCart}
              onSaveCart={handleSaveCart}
              savedCartsCount={savedCarts.length}
              onToggleSavedCarts={handleToggleSavedCarts}
            />
          </div>

          {/* Vista desktop: layout 50/50 */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4 sm:gap-6 pb-16">
            <div className="overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)]">
              <ProductList
                products={products}
                onAddToCart={handleAddToCart}
                searchTerm={productSearchTerm}
                onSearchChange={setProductSearchTerm}
                scaleReading={scaleReading}
                onScaleReadingChange={setScaleReading}
              />
            </div>
            <div className="flex flex-col">
              {/* Carrito con scroll independiente */}
              <div className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)] overflow-y-auto pr-2">
                <Cart
                  cartItems={cartItems}
                  products={products}
                  taxes={taxes}
                  onRemoveFromCart={handleRemoveFromCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateWeight={handleUpdateWeight}
                  onClearCart={handleClearCart}
                  onSaveCart={handleSaveCart}
                  savedCartsCount={savedCarts.length}
                  onToggleSavedCarts={handleToggleSavedCarts}
                />
                {showSavedCarts && (
                  <div className="mt-4">
                    <SavedCartsView
                      savedCarts={savedCarts}
                      customers={customers}
                      onLoadCart={() => {}}
                      onDeleteSavedCart={() => {}}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Barra de checkout flotante para desktop */}
          <div className="hidden lg:block">
            <CheckoutBar
              cartItems={cartItems}
              products={products}
              taxes={taxes}
              onCheckout={handleCheckout}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={handleSelectCustomer}
              electronicInvoicingEnabled={Boolean(companyInfo?.electronicInvoicingEnabled)}
            />
          </div>
        </div>

        {/* Modales compartidos */}
        {showWeightModal && pendingWeightProduct && (
          <WeightInputModal
            product={pendingWeightProduct}
            onConfirm={handleConfirmWeight}
            onCancel={handleCancelWeight}
            scaleReading={scaleReading}
          />
        )}
        {lastSaleForInvoice && currentPage === 'pos' && !showInvoicePreview && (
          <div className="fixed bottom-24 right-4 lg:bottom-32 lg:right-6 z-30">
            <Button onClick={() => setShowInvoicePreview(true)} variant="secondary" className="shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimir Última Factura
            </Button>
          </div>
        )}
      </>
    );
  };

  // El ProtectedRoute ya maneja la redirección, no necesitamos hacerlo aquí
  if (!user) {
    return null; // ProtectedRoute redirigirá si no hay usuario
  }

  return (
    <div className="app-container container mx-auto p-2 sm:p-4 font-sans bg-gray-100 min-h-screen relative">
       <div className="main-header mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAboutModal(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
              aria-label="Acerca de QAnticoPOS"
            >
              <Logo size="lg" className="hidden sm:block" />
              <Logo size="md" className="sm:hidden" />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 text-center sm:text-left flex items-center">
              {companyInfo?.name || 'QAntico POS'}
            </h1>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex-wrap">
            <span className="text-sm font-medium text-gray-600">Rol:</span>
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded ${
                userRole === 'admin' || userRole === 'super_admin'
                  ? 'bg-accent-100 text-secondary-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {userRole === 'super_admin'
                ? 'Super Admin'
                : userRole === 'admin'
                ? 'Administrador'
                : userRole === 'accountant'
                ? 'Contador'
                : 'Cajero'}
            </span>
            <span className="text-xs text-gray-500">({user.company?.name})</span>
            {/* Indicador de estado de conexión */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </div>
            {/* Contador de ventas pendientes */}
            {pendingSalesCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pendingSalesCount} pendiente{pendingSalesCount !== 1 ? 's' : ''}
              </div>
            )}
            <Button onClick={handleLogout} size="sm" variant="outline" className="text-xs">
              Salir
            </Button>
            </div>
          </div>
          <nav className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-wrap justify-center">
            <Button
              variant={currentPage === 'pos' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentPage('pos')}
              className="text-xs"
            >
              POS
            </Button>
            {/* Botones para administradores y contadores */}
            {(isAdmin() || userRole === 'accountant') && (
              <>
                <Button
                  variant={currentPage === 'inventory' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('inventory')}
                  className="text-xs"
                >
                  Inventario
                </Button>
                <Button
                  variant={currentPage === 'customers' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('customers')}
                  className="text-xs"
                >
                  Clientes
                </Button>
                <Button
                  variant={currentPage === 'sales' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('sales')}
                  className="text-xs"
                >
                  Ventas
                </Button>
                <Button
                  variant={currentPage === 'history' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('history')}
                  className="text-xs"
                >
                  Historial
                </Button>
                <Button
                  variant={currentPage === 'returns' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('returns')}
                  className="text-xs"
                >
                  Devoluciones
                </Button>
                <Button
                  variant={currentPage === 'reports' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('reports')}
                  className="text-xs"
                >
                  Informes
                </Button>
                <Button
                  variant={currentPage === 'recurring' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('recurring')}
                  className="text-xs"
                >
                  Pagos Rec.
                </Button>
                <Button
                  variant={currentPage === 'settings' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('settings')}
                  className="text-xs"
                >
                  Configuración
                </Button>
              </>
            )}
            {/* Botones para cajeros (solo ventas y devoluciones) */}
            {userRole === 'cashier' && (
              <>
                <Button
                  variant={currentPage === 'sales' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('sales')}
                  className="text-xs"
                >
                  Ventas
                </Button>
                <Button
                  variant={currentPage === 'returns' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('returns')}
                  className="text-xs"
                >
                  Devoluciones
                </Button>
              </>
            )}
          </nav>
        </div>
       </div>

       {/* Barra de Funciones */}
       <div className="mb-4">
         <CashDrawerBar
           cashDrawer={cashDrawer}
           onOpenDrawer={handleOpenCashDrawer}
           onCloseDrawer={handleCloseCashDrawer}
           isLoading={isLoading}
           sales={sales}
           isCheckingCashDrawer={isCheckingCashDrawer}
         />
       </div>

       <div className="main-content">{renderCurrentPage()}</div>

       {showInvoicePreview && lastSaleForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 print:inset-auto print:bg-transparent print:p-0">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative print:shadow-none print:rounded-none print:border-0">
                     <div className="printable-invoice">
              <InvoiceView saleData={lastSaleForInvoice} companyInfo={companyInfo || {}} customers={customers} />
                     </div>
                     <div className="p-4 text-right print:hidden">
              <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
                Cerrar Vista Previa
              </Button>
              <Button onClick={() => window.print()} className="ml-2">
                Imprimir
              </Button>
                     </div>
                 </div>
           </div>
       )}

       {pendingReturnSale && (
         <AdminPasswordModal
           isOpen={showAdminPasswordModal}
           onClose={handleCancelReturn}
           onConfirm={handleConfirmReturn}
           saleNumber={pendingReturnSale.sale_number || pendingReturnSale.id}
         />
       )}
       
       {/* Modal Acerca de */}
       <AboutModal 
         isOpen={showAboutModal} 
         onClose={() => setShowAboutModal(false)} 
       />
       
       {/* Loading global overlay */}
       {isLoading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
