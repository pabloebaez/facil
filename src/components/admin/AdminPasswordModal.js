import React, { useState } from 'react';
import { Input, Button } from '../ui';
import { authService } from '../../services/api';

export function AdminPasswordModal({ isOpen, onClose, onConfirm, saleNumber }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar la contraseña del administrador
      const response = await authService.validateAdminPassword(password);
      
      if (response.valid) {
        // Si la contraseña es válida, llamar a onConfirm con la contraseña
        onConfirm(password);
        setPassword('');
        setError('');
      } else {
        setError(response.message || 'Contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      setError(error.response?.data?.message || 'Error al validar la contraseña. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Autorización Requerida
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Para reversar la factura <strong>{saleNumber}</strong>, se requiere la autorización de un administrador de la empresa.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña del Administrador
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Ingrese la contraseña del administrador"
                className="w-full"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !password.trim()}
              >
                {loading ? 'Validando...' : 'Autorizar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}














