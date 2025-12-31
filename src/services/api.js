import axios from 'axios';

// Configurar la instancia base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authService = {
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    
    // Guardar token y usuario en localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser() {
    const response = await api.get('/me');
    const user = response.data?.user || response.data;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  },

  async validateAdminPassword(password) {
    const response = await api.post('/validate-admin-password', { password });
    return response.data;
  },
};

// Función helper para crear servicios CRUD
const createService = (endpoint) => ({
  async getAll(params = {}) {
    const response = await api.get(`/${endpoint}`, { params });
    return response;
  },

  async getById(id) {
    const response = await api.get(`/${endpoint}/${id}`);
    return response;
  },

  async create(data) {
    const response = await api.post(`/${endpoint}`, data);
    return response;
  },

  async update(id, data) {
    const response = await api.put(`/${endpoint}/${id}`, data);
    return response;
  },

  async delete(id) {
    const response = await api.delete(`/${endpoint}/${id}`);
    return response;
  },
});

// Servicio de productos
export const productService = createService('products');

// Servicio de impuestos
export const taxService = createService('taxes');

// Servicio de clientes
export const customerService = createService('customers');

// Servicio de ventas
export const saleService = {
  ...createService('sales'),
  // Método específico para cerrar caja si existe
  async close(id, data) {
    const response = await api.put(`/sales/${id}`, data);
    return response;
  },
};

// Servicio de devoluciones
export const returnService = createService('returns');

// Servicio de usuarios
export const userService = createService('users');

// Servicio de empresas
export const companyService = createService('companies');

// Servicio de cajones de efectivo
export const cashDrawerService = {
  ...createService('cash-drawers'),
  
  async getActive() {
    const response = await api.get('/cash-drawers/active');
    return response;
  },

  async close(id, data) {
    const response = await api.put(`/cash-drawers/${id}`, data);
    return response;
  },

  async addExpense(id, data) {
    const response = await api.post(`/cash-drawers/${id}/expenses`, data);
    return response;
  },
};

// Servicio de proveedores
export const supplierService = createService('suppliers');

// Servicio de bodegas
export const warehouseService = createService('warehouses');

// Servicio de compras
export const purchaseService = createService('purchases');

// Servicio de servicios recurrentes
export const recurringServiceService = createService('recurring-services');

// Servicio de rangos de numeración de documentos
export const documentNumberingRangeService = createService('document-numbering-ranges');

// Servicio de configuración de proveedores DIAN
export const dianProviderConfigService = createService('dian-provider-configs');

// Servicio de configuración de pagos digitales
export const digitalPaymentConfigService = createService('digital-payment-configs');

// Servicio de reportes
export const reportService = {
  async getReports(params = {}) {
    const response = await api.get('/reports', { params });
    return response;
  },
  async getSalesReport(params = {}) {
    const response = await api.get('/reports/sales', { params });
    return response;
  },
  async getProductsReport(params = {}) {
    const response = await api.get('/reports/products', { params });
    return response;
  },
  async getCustomersReport(params = {}) {
    const response = await api.get('/reports/customers', { params });
    return response;
  },
};
