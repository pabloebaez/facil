import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Textarea } from '../ui';
import { productService, supplierService, warehouseService } from '../../services/api';

export function EditProductForm({ product, taxes = [], suppliers = [], warehouses = [], onSubmit, onCancel, onSuppliersReload }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    price: '',
    costPrice: '',
    inventory: '',
    discountPercent: '0',
    pricingMethod: 'unit',
    unitLabel: 'u',
    taxIds: [],
    warehouseId: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [localWarehouses, setLocalWarehouses] = useState(warehouses || []);

  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      setLocalWarehouses(warehouses);
    } else {
      loadWarehouses();
    }
  }, [warehouses]);

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getAll();
      if (response.data) {
        setLocalWarehouses(response.data);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        barcode: product.barcode || '',
        price: product.price || '',
        costPrice: product.cost_price || '',
        inventory: product.inventory || '',
        discountPercent: product.discount_percent || '0',
        pricingMethod: product.pricing_method || 'unit',
        unitLabel: product.unit_label || 'u',
        taxIds: product.taxes ? product.taxes.map(t => t.id) : [],
        warehouseId: product.warehouse_id || '',
        image: product.image || null,
      });
      if (product.image) {
        setImagePreview(product.image);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTaxToggle = (taxId) => {
    setFormData(prev => ({
      ...prev,
      taxIds: prev.taxIds.includes(taxId)
        ? prev.taxIds.filter(id => id !== taxId)
        : [...prev.taxIds, taxId],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        barcode: formData.barcode || null,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.costPrice || 0),
        inventory: parseInt(formData.inventory || 0, 10),
        discount_percent: parseFloat(formData.discountPercent || 0),
        pricing_method: formData.pricingMethod,
        unit_label: formData.unitLabel,
        tax_ids: formData.taxIds,
        warehouse_id: formData.warehouseId || null,
        image: formData.image || null,
      };

      await productService.update(product.id, updateData);
      onSubmit(updateData);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al actualizar producto: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto *
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Coca Cola 500ml"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Barras
          </label>
          <Input
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción del producto"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Venta *
          </label>
          <Input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Costo
          </label>
          <Input
            type="number"
            step="0.01"
            name="costPrice"
            value={formData.costPrice}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Inventario
          </label>
          <Input
            type="number"
            name="inventory"
            value={formData.inventory}
            onChange={handleChange}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bodega
          </label>
          <Select
            name="warehouseId"
            value={formData.warehouseId}
            onChange={handleChange}
          >
            <option value="">Sin bodega asignada</option>
            {localWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Precio
          </label>
          <Select
            name="pricingMethod"
            value={formData.pricingMethod}
            onChange={handleChange}
          >
            <option value="unit">Por Unidad</option>
            <option value="weight">Por Peso</option>
            <option value="consumption">Por Consumo</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etiqueta de Unidad
          </label>
          <Input
            name="unitLabel"
            value={formData.unitLabel}
            onChange={handleChange}
            placeholder="u, kg, l, etc."
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descuento (%)
          </label>
          <Input
            type="number"
            step="0.01"
            name="discountPercent"
            value={formData.discountPercent}
            onChange={handleChange}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Impuestos
        </label>
        <div className="flex flex-wrap gap-2">
          {taxes.map(tax => (
            <label key={tax.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.taxIds.includes(tax.id)}
                onChange={() => handleTaxToggle(tax.id)}
                className="rounded"
              />
              <span className="text-sm">{tax.name} ({tax.rate}%)</span>
            </label>
          ))}
          {taxes.length === 0 && (
            <span className="text-sm text-gray-500">No hay impuestos configurados</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen del Producto
        </label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
