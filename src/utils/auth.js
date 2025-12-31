export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const getCompanyId = () => {
  const user = getUser();
  return user?.company?.id;
};

export const isSuperAdmin = () => {
  const user = getUser();
  return user?.role === 'super_admin';
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin' || user?.role === 'super_admin';
};

export const canManageUsers = () => {
  return isAdmin();
};

export const logout = async () => {
  const { authService } = await import('../services/api');
  try {
    await authService.logout();
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
  }
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};















