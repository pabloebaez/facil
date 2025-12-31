import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Checkbox } from '../ui';
import { companyService, dianProviderConfigService } from '../../services/api';

export function ElectronicInvoicingConfigView({ onConfigUpdated }) {
  const [electronicInvoicingEnabled, setElectronicInvoicingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState([]);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerForm, setProviderForm] = useState({
    provider_name: '',
    api_url: '',
    api_key: '',
    api_secret: '',
    username: '',
    password: '',
    certificate_path: '',
    certificate_password: '',
    environment: 'test',
    is_active: false,
  });

  useEffect(() => {
    loadCompanyConfig();
    loadProviderConfigs();
  }, []);

  const loadCompanyConfig = async () => {
    try {
      setLoading(true);
      const response = await companyService.getAll();
      const company = response.data[0] || response.data;
      if (company) {
        setElectronicInvoicingEnabled(company.electronic_invoicing_enabled || false);
      }
    } catch (error) {
      console.error('Error al cargar configuración de empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderConfigs = async () => {
    try {
      const response = await dianProviderConfigService.getAll();
      setProviderConfigs(response.data || []);
    } catch (error) {
      console.error('Error al cargar configuraciones de proveedor:', error);
    }
  };

  const handleToggleElectronicInvoicing = async (enabled) => {
    try {
      setSaving(true);
      console.log('handleToggleElectronicInvoicing called with enabled:', enabled);
      const response = await companyService.getAll();
      const company = response.data[0] || response.data;
      if (company) {
        console.log('Updating company:', company.id, 'with electronic_invoicing_enabled:', enabled);
        await companyService.update(company.id, {
          electronic_invoicing_enabled: enabled,
        });
        setElectronicInvoicingEnabled(enabled);
        // Notificar al componente padre para que recargue la información
        if (onConfigUpdated) {
          console.log('Calling onConfigUpdated callback');
          await onConfigUpdated();
        } else {
          console.warn('onConfigUpdated callback is not defined');
        }
      }
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      alert('Error al actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleProviderFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProviderForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingProvider) {
        await dianProviderConfigService.update(editingProvider.id, providerForm);
      } else {
        await dianProviderConfigService.create(providerForm);
      }
      await loadProviderConfigs();
      setShowProviderForm(false);
      setEditingProvider(null);
      setProviderForm({
        provider_name: '',
        api_url: '',
        api_key: '',
        api_secret: '',
        username: '',
        password: '',
        certificate_path: '',
        certificate_password: '',
        environment: 'test',
        is_active: false,
      });
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      alert('Error al guardar la configuración del proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderForm({
      provider_name: provider.provider_name,
      api_url: provider.api_url,
      api_key: provider.api_key || '',
      api_secret: '',
      username: provider.username || '',
      password: '',
      certificate_path: provider.certificate_path || '',
      certificate_password: '',
      environment: provider.environment || 'test',
      is_active: provider.is_active || false,
    });
    setShowProviderForm(true);
  };

  const handleDeleteProvider = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta configuración?')) {
      return;
    }
    try {
      await dianProviderConfigService.delete(id);
      await loadProviderConfigs();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar la configuración');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facturación Electrónica DIAN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Habilitar Facturación Electrónica</h3>
              <p className="text-sm text-gray-600 mt-1">
                Cuando está habilitada, las ventas se procesan como facturas electrónicas
                con XML UBL 2.1 y se envían a DIAN. Cuando está deshabilitada, se emiten
                tickets de venta con numeración consecutiva simple.
              </p>
            </div>
            <Checkbox
              checked={electronicInvoicingEnabled}
              onChange={(e) => handleToggleElectronicInvoicing(e.target.checked)}
              disabled={saving}
            >
              {electronicInvoicingEnabled ? 'Habilitada' : 'Deshabilitada'}
            </Checkbox>
          </div>

          {electronicInvoicingEnabled && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Configuración de Proveedor Tecnológico DIAN</h3>
                <Button
                  onClick={() => {
                    setShowProviderForm(true);
                    setEditingProvider(null);
                    setProviderForm({
                      provider_name: '',
                      api_url: '',
                      api_key: '',
                      api_secret: '',
                      username: '',
                      password: '',
                      certificate_path: '',
                      certificate_password: '',
                      environment: 'test',
                      is_active: false,
                    });
                  }}
                >
                  Agregar Proveedor
                </Button>
              </div>

              {showProviderForm && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProvider} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Proveedor
                          </label>
                          <Input
                            name="provider_name"
                            value={providerForm.provider_name}
                            onChange={handleProviderFormChange}
                            placeholder="Ej: Facturación Electrónica"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL de la API
                          </label>
                          <Input
                            name="api_url"
                            type="url"
                            value={providerForm.api_url}
                            onChange={handleProviderFormChange}
                            placeholder="https://api.proveedor.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <Input
                            name="api_key"
                            type="password"
                            value={providerForm.api_key}
                            onChange={handleProviderFormChange}
                            placeholder="API Key"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Secret
                          </label>
                          <Input
                            name="api_secret"
                            type="password"
                            value={providerForm.api_secret}
                            onChange={handleProviderFormChange}
                            placeholder="API Secret"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                          </label>
                          <Input
                            name="username"
                            value={providerForm.username}
                            onChange={handleProviderFormChange}
                            placeholder="Usuario"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                          </label>
                          <Input
                            name="password"
                            type="password"
                            value={providerForm.password}
                            onChange={handleProviderFormChange}
                            placeholder="Contraseña"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ruta del Certificado
                          </label>
                          <Input
                            name="certificate_path"
                            value={providerForm.certificate_path}
                            onChange={handleProviderFormChange}
                            placeholder="/ruta/al/certificado.p12"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña del Certificado
                          </label>
                          <Input
                            name="certificate_password"
                            type="password"
                            value={providerForm.certificate_password}
                            onChange={handleProviderFormChange}
                            placeholder="Contraseña del certificado"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ambiente
                          </label>
                          <select
                            name="environment"
                            value={providerForm.environment}
                            onChange={handleProviderFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="test">Pruebas</option>
                            <option value="production">Producción</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-6">
                          <Checkbox
                            name="is_active"
                            checked={providerForm.is_active}
                            onChange={handleProviderFormChange}
                          >
                            Activar este proveedor
                          </Checkbox>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowProviderForm(false);
                            setEditingProvider(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {providerConfigs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay proveedores configurados. Agregue uno para comenzar.
                </p>
              ) : (
                <div className="space-y-2">
                  {providerConfigs.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-semibold">{provider.provider_name}</div>
                        <div className="text-sm text-gray-600">{provider.api_url}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Ambiente: {provider.environment === 'test' ? 'Pruebas' : 'Producción'}
                          {provider.is_active && (
                            <span className="ml-2 text-green-600 font-semibold">(Activo)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProvider(provider)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

