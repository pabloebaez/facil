import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Textarea } from '../ui';
import { documentNumberingRangeService } from '../../services/api';

export function DocumentNumberingRangesView() {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRange, setEditingRange] = useState(null);
  const [formData, setFormData] = useState({
    document_type: 'invoice',
    prefix: '',
    authorization_number: '',
    authorization_date: '',
    valid_from: '',
    valid_to: '',
    range_from: '',
    range_to: '',
    notes: '',
  });

  useEffect(() => {
    loadRanges();
  }, []);

  const loadRanges = async () => {
    try {
      setLoading(true);
      const response = await documentNumberingRangeService.getAll();
      setRanges(response.data || []);
    } catch (error) {
      console.error('Error loading ranges:', error);
      alert('Error al cargar los rangos de numeración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRange) {
        await documentNumberingRangeService.update(editingRange.id, formData);
        alert('Rango actualizado exitosamente');
      } else {
        await documentNumberingRangeService.create(formData);
        alert('Rango creado exitosamente');
      }
      setShowForm(false);
      setEditingRange(null);
      resetForm();
      loadRanges();
    } catch (error) {
      console.error('Error saving range:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al guardar el rango';
      alert(errorMessage);
    }
  };

  const handleEdit = (range) => {
    setEditingRange(range);
    setFormData({
      document_type: range.document_type,
      prefix: range.prefix || '',
      authorization_number: range.authorization_number,
      authorization_date: range.authorization_date,
      valid_from: range.valid_from,
      valid_to: range.valid_to,
      range_from: range.range_from.toString(),
      range_to: range.range_to.toString(),
      notes: range.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este rango?')) {
      return;
    }
    try {
      await documentNumberingRangeService.delete(id);
      alert('Rango eliminado exitosamente');
      loadRanges();
    } catch (error) {
      console.error('Error deleting range:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar el rango';
      alert(errorMessage);
    }
  };

  const handleToggleActive = async (range) => {
    try {
      await documentNumberingRangeService.update(range.id, {
        is_active: !range.is_active,
      });
      loadRanges();
    } catch (error) {
      console.error('Error updating range:', error);
      alert('Error al actualizar el estado del rango');
    }
  };

  const resetForm = () => {
    setFormData({
      document_type: 'invoice',
      prefix: '',
      authorization_number: '',
      authorization_date: '',
      valid_from: '',
      valid_to: '',
      range_from: '',
      range_to: '',
      notes: '',
    });
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      invoice: 'Factura de Venta',
      credit_note: 'Nota de Crédito',
      debit_note: 'Nota de Débito',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return <Card><CardContent><p>Cargando...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Rangos de Numeración DIAN</CardTitle>
        <Button onClick={() => { setShowForm(true); setEditingRange(null); resetForm(); }}>
          {showForm ? 'Cancelar' : 'Nuevo Rango'}
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingRange ? 'Editar Rango' : 'Nuevo Rango de Numeración'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Documento *</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!!editingRange}
                  required
                >
                  <option value="invoice">Factura de Venta</option>
                  <option value="credit_note">Nota de Crédito</option>
                  <option value="debit_note">Nota de Débito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prefijo (máx. 4 caracteres)</label>
                <Input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  maxLength={4}
                  placeholder="Ej: FAC, NC, ND"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número de Autorización DIAN *</label>
                <Input
                  type="text"
                  value={formData.authorization_number}
                  onChange={(e) => setFormData({ ...formData, authorization_number: e.target.value })}
                  required
                  placeholder="Número de autorización"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Autorización *</label>
                <Input
                  type="date"
                  value={formData.authorization_date}
                  onChange={(e) => setFormData({ ...formData, authorization_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vigencia Desde *</label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vigencia Hasta *</label>
                <Input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número Inicial del Rango *</label>
                <Input
                  type="number"
                  value={formData.range_from}
                  onChange={(e) => setFormData({ ...formData, range_from: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número Final del Rango *</label>
                <Input
                  type="number"
                  value={formData.range_to}
                  onChange={(e) => setFormData({ ...formData, range_to: e.target.value })}
                  min={parseInt(formData.range_from) + 1 || 2}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notas</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Notas adicionales sobre este rango"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingRange ? 'Actualizar' : 'Crear'}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRange(null); resetForm(); }}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="mb-4 p-3 bg-accent-50 rounded-lg">
          <p className="text-sm text-secondary-700">
            <strong>Importante:</strong> Los rangos de numeración deben ser autorizados previamente por la DIAN. 
            Cada tipo de documento (Factura, Nota de Crédito, Nota de Débito) requiere su propio rango autorizado.
          </p>
        </div>

        {ranges.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay rangos de numeración configurados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Prefijo</TableHead>
                <TableHead>Autorización DIAN</TableHead>
                <TableHead>Rango</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Último Número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((range) => (
                <TableRow key={range.id}>
                  <TableCell>{getDocumentTypeLabel(range.document_type)}</TableCell>
                  <TableCell className="font-mono">{range.prefix || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{range.authorization_number}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {range.range_from} - {range.range_to}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(range.valid_from)} - {formatDate(range.valid_to)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {range.current_number >= range.range_from ? range.current_number : 'Sin usar'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${range.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {range.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(range)}
                        className="text-xs"
                      >
                        {range.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(range)}
                        className="text-xs"
                      >
                        Editar
                      </Button>
                      {range.current_number < range.range_from && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(range.id)}
                          className="text-xs text-red-600"
                        >
                          Eliminar
                        </Button>
                      )}
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

