import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Textarea } from '../ui';
import { ElectronicInvoicingConfigView } from './ElectronicInvoicingConfigView';
import { DocumentNumberingRangesView } from './DocumentNumberingRangesView';
import { DigitalPaymentConfigView } from './DigitalPaymentConfigView';
import { TaxManagement } from './TaxManagement';

export function SettingsView({
  taxes = [],
  companyInfo = {},
  onAddTax,
  onToggleTax,
  onRemoveTax,
  onCompanyInfoChange,
  onSaveCompanyInfo,
  onElectronicInvoicingConfigUpdated,
}) {
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'taxes', 'electronic-invoicing', 'document-numbering', 'digital-payments'
  const [companyForm, setCompanyForm] = useState({
    name: companyInfo.name || '',
    tax_id: companyInfo.tax_id || '',
    address: companyInfo.address || '',
    phone: companyInfo.phone || '',
    email: companyInfo.email || '',
    logo_url: companyInfo.logo_url || '',
    footer_note: companyInfo.footer_note || '',
  });

  useEffect(() => {
    setCompanyForm({
      name: companyInfo.name || '',
      tax_id: companyInfo.tax_id || '',
      address: companyInfo.address || '',
      phone: companyInfo.phone || '',
      email: companyInfo.email || '',
      logo_url: companyInfo.logo_url || '',
      footer_note: companyInfo.footer_note || '',
    });
  }, [companyInfo]);

  const handleCompanyFormChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value,
    }));
    if (onCompanyInfoChange) {
      onCompanyInfoChange({ ...companyForm, [name]: value });
    }
  };

  const handleSaveCompany = () => {
    if (onSaveCompanyInfo) {
      onSaveCompanyInfo(companyForm);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'taxes'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Impuestos
          </button>
          <button
            onClick={() => setActiveTab('electronic-invoicing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'electronic-invoicing'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Facturación Electrónica
          </button>
          <button
            onClick={() => setActiveTab('document-numbering')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'document-numbering'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Numeración de Documentos
          </button>
          <button
            onClick={() => setActiveTab('digital-payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'digital-payments'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pagos Digitales
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle>Información de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <Input
                  name="name"
                  value={companyForm.name}
                  onChange={handleCompanyFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIT / Identificación Fiscal
                </label>
                <Input
                  name="tax_id"
                  value={companyForm.tax_id}
                  onChange={handleCompanyFormChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <Input
                name="address"
                value={companyForm.address}
                onChange={handleCompanyFormChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <Input
                  name="phone"
                  value={companyForm.phone}
                  onChange={handleCompanyFormChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={companyForm.email}
                  onChange={handleCompanyFormChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Logo
              </label>
              <Input
                name="logo_url"
                value={companyForm.logo_url}
                onChange={handleCompanyFormChange}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nota al Pie de Factura
              </label>
              <Textarea
                name="footer_note"
                value={companyForm.footer_note}
                onChange={handleCompanyFormChange}
                rows={3}
                placeholder="Texto que aparecerá al pie de las facturas..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveCompany}>
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'taxes' && (
        <TaxManagement
          taxes={taxes}
          onAddTax={onAddTax}
          onToggleTax={onToggleTax}
          onRemoveTax={onRemoveTax}
        />
      )}

      {activeTab === 'electronic-invoicing' && (
        <ElectronicInvoicingConfigView
          onConfigUpdated={onElectronicInvoicingConfigUpdated}
        />
      )}

      {activeTab === 'document-numbering' && (
        <DocumentNumberingRangesView />
      )}

      {activeTab === 'digital-payments' && (
        <DigitalPaymentConfigView />
      )}
    </div>
  );
}
