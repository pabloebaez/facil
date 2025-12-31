import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui';
import { taxService } from '../../services/api';

export function TaxManagement({ taxes = [], onAddTax, onToggleTax, onRemoveTax }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    enabled: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rate) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await taxService.create({
        name: formData.name,
        rate: parseFloat(formData.rate),
        enabled: formData.enabled,
      });
      
      if (onAddTax) {
        onAddTax();
      }
      
      setFormData({ name: '', rate: '', enabled: true });
      setShowForm(false);
    } catch (error) {
      console.error('Error al crear impuesto:', error);
      alert('Error al crear impuesto: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggle = async (tax) => {
    try {
      await taxService.update(tax.id, {
        enabled: !tax.enabled,
      });
      
      if (onToggleTax) {
        onToggleTax(tax.id);
      }
    } catch (error) {
      console.error('Error al actualizar impuesto:', error);
      alert('Error al actualizar impuesto');
    }
  };

  const handleRemove = async (tax) => {
    if (!window.confirm(`¿Estás seguro de eliminar el impuesto "${tax.name}"?`)) {
      return;
    }

    try {
      await taxService.delete(tax.id);
      
      if (onRemoveTax) {
        onRemoveTax(tax.id);
      }
    } catch (error) {
      console.error('Error al eliminar impuesto:', error);
      alert('Error al eliminar impuesto');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Impuestos</CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Agregar Impuesto'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Impuesto *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: IVA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa (%) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  min="0"
                  max="100"
                  placeholder="19"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Guardar</Button>
              </div>
            </div>
          </form>
        )}

        {taxes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay impuestos configurados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tasa (%)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map(tax => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.rate}%</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      tax.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tax.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(tax)}
                      >
                        {tax.enabled ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(tax)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

