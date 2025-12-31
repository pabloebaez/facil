import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Checkbox } from '../ui';
import { digitalPaymentConfigService } from '../../services/api';

export function DigitalPaymentConfigView() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [expandedProvider, setExpandedProvider] = useState(null);

  const providers = [
    { value: 'nequi', label: 'Nequi', icon: '💚' },
    { value: 'daviplata', label: 'Daviplata', icon: '💙' },
    { value: 'llave_bre_b', label: 'Llave BRE-B', icon: '🔑' },
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await digitalPaymentConfigService.getAll();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Error al cargar configuraciones de pagos digitales:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfigForProvider = (provider) => {
    return configs.find(c => c.payment_provider === provider) || {
      payment_provider: provider,
      is_active: false,
      environment: 'sandbox',
    };
  };

  const handleInputChange = (provider, field, value) => {
    const currentConfig = getConfigForProvider(provider);
    const updatedConfig = {
      ...currentConfig,
      [field]: value,
    };
    
    const updatedConfigs = configs.filter(c => c.payment_provider !== provider);
    if (updatedConfig.id || Object.keys(updatedConfig).length > 3) {
      updatedConfigs.push(updatedConfig);
    }
    setConfigs(updatedConfigs);
  };

  const handleSave = async (provider) => {
    try {
      setSaving(prev => ({ ...prev, [provider]: true }));
      const config = getConfigForProvider(provider);
      
      await digitalPaymentConfigService.create({
        payment_provider: provider,
        client_id: config.client_id || null,
        client_secret: config.client_secret || null,
        api_key: config.api_key || null,
        api_secret: config.api_secret || null,
        merchant_id: config.merchant_id || null,
        phone_number: config.phone_number || null,
        llave_bre_b_value: config.llave_bre_b_value || null,
        environment: config.environment || 'sandbox',
        additional_config: config.additional_config || null,
        is_active: config.is_active || false,
      });

      await loadConfigs();
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getProviderFields = (provider) => {
    const fields = {
      nequi: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'api_key', label: 'API Key', type: 'text' },
        { name: 'api_secret', label: 'API Secret', type: 'password' },
        { name: 'merchant_id', label: 'Merchant ID', type: 'text' },
        { name: 'phone_number', label: 'Número de Teléfono', type: 'text', required: true },
      ],
      daviplata: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'api_key', label: 'API Key', type: 'text' },
        { name: 'api_secret', label: 'API Secret', type: 'password' },
        { name: 'merchant_id', label: 'Merchant ID', type: 'text' },
        { name: 'phone_number', label: 'Número de Teléfono', type: 'text', required: true },
      ],
      llave_bre_b: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'api_key', label: 'API Key', type: 'text' },
        { name: 'api_secret', label: 'API Secret', type: 'password' },
        { name: 'llave_bre_b_value', label: 'Llave BRE-B', type: 'text', required: true },
      ],
    };
    return fields[provider] || [];
  };

  if (loading) {
    return <Card><CardContent><p>Cargando...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Pagos Digitales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Configure los datos necesarios para cada método de pago digital. Estos datos se usarán para generar códigos QR y verificar pagos.
        </p>

        {providers.map((provider) => {
          const config = getConfigForProvider(provider.value);
          const fields = getProviderFields(provider.value);
          const isExpanded = expandedProvider === provider.value;

          return (
            <div key={provider.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <h3 className="text-lg font-semibold">{provider.label}</h3>
                  <Checkbox
                    checked={config.is_active || false}
                    onChange={(e) => handleInputChange(provider.value, 'is_active', e.target.checked)}
                  >
                    <span className="text-sm ml-2">Activo</span>
                  </Checkbox>
                </div>
                <Button
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.value)}
                  variant="outline"
                  size="sm"
                >
                  {isExpanded ? 'Ocultar' : 'Configurar'}
                </Button>
              </div>

              {isExpanded && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          type={field.type}
                          value={config[field.name] || ''}
                          onChange={(e) => handleInputChange(provider.value, field.name, e.target.value)}
                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambiente
                      </label>
                      <select
                        value={config.environment || 'sandbox'}
                        onChange={(e) => handleInputChange(provider.value, 'environment', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="sandbox">Sandbox (Pruebas)</option>
                        <option value="production">Producción</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave(provider.value)}
                      disabled={saving[provider.value]}
                      className="bg-secondary-600 hover:bg-secondary-700"
                    >
                      {saving[provider.value] ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}










