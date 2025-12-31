// --- Helper Functions ---
export const generateId = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
export const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';






