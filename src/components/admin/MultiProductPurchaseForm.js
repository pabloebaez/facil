import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Textarea } from '../ui';
import { purchaseService, supplierService, productService } from '../../services/api';

export function MultiProductPurchaseForm({ 
  products = [],
  suppliers = [], 
  onPurchaseRegistered, 
  onCancel,
  showCancelButton = true,
  onSupplierCreated,
}) {
  const [purchaseData, setPurchaseData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [purchaseItems, setPurchaseItems] = useState([
    {
      product_id: '',
      quantity: '',
      unit_price: '',
      lot_number: '',
      expiration_date: '',
      notes: '',
    }
  ]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [localSuppliers, setLocalSuppliers] = useState(suppliers);
  const [localProducts, setLocalProducts] = useState(products);

  useEffect(() => {
    setLocalSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setPurchaseItems(updatedItems);
  };

  const addItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        product_id: '',
        quantity: '',
        unit_price: '',
        lot_number: '',
        expiration_date: '',
        notes: '',
      }
    ]);
  };

  const removeItem = (index) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    
    if (!newSupplier.name.trim()) {
      alert('El nombre del proveedor es requerido');
      return;
    }

    setSupplierLoading(true);
    try {
      const response = await supplierService.create({
        name: newSupplier.name.trim(),
        contact_name: newSupplier.contact_person.trim() || null,
        phone: newSupplier.phone.trim() || null,
        email: newSupplier.email.trim() || null,
        address: newSupplier.address.trim() || null,
      });

      const createdSupplier = response.data;
      setLocalSuppliers(prev => [...prev, createdSupplier]);
      setPurchaseData(prev => ({
        ...prev,
        supplier_id: createdSupplier.id,
      }));
      setShowNewSupplierForm(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
      alert('Proveedor creado exitosamente');
      
      if (onSupplierCreated) {
        onSupplierCreated(createdSupplier);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Error al crear el proveedor: ' + (error.response?.data?.message || error.message));
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!purchaseData.supplier_id) {
      alert('Por favor selecciona un proveedor');
      return;
    }

    // Validar que todos los items tengan producto, cantidad y precio
    const validItems = purchaseItems.filter(item => 
      item.product_id && 
      item.quantity && 
      parseFloat(item.quantity) > 0 && 
      item.unit_price && 
      parseFloat(item.unit_price) > 0
    );

    if (validItems.length === 0) {
      alert('Debes agregar al menos un producto con cantidad y precio válidos');
      return;
    }

    setPurchaseLoading(true);
    try {
      await purchaseService.create({
        supplier_id: purchaseData.supplier_id,
        purchase_date: purchaseData.purchase_date,
        items: validItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          lot_number: item.lot_number || null,
          expiration_date: item.expiration_date || null,
          notes: item.notes || null,
        })),
        notes: purchaseData.notes || null,
      });

      alert(`Compra registrada exitosamente con ${validItems.length} producto(s). El inventario y los lotes han sido actualizados.`);
      
      // Limpiar formulario
      setPurchaseData({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setPurchaseItems([{
        product_id: '',
        quantity: '',
        unit_price: '',
        lot_number: '',
        expiration_date: '',
        notes: '',
      }]);

      if (onPurchaseRegistered) {
        onPurchaseRegistered();
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Error al registrar la compra: ' + (error.response?.data?.message || error.message));
    } finally {
      setPurchaseLoading(false);
    }
  };

  const calculateSubtotal = (item) => {
    if (item.quantity && item.unit_price) {
      return (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2);
    }
    return '0.00';
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => {
      if (item.quantity && item.unit_price) {
        return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
      }
      return sum;
    }, 0).toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Formulario de nuevo proveedor */}
      {showNewSupplierForm && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-3">Crear Nuevo Proveedor</h4>
          <form onSubmit={handleCreateSupplier} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proveedor *
                </label>
                <Input
                  name="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ej: Distribuidora ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <Input
                  name="contact_person"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <Input
                  name="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej: contacto@proveedor.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <Textarea
                name="address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                placeholder="Dirección del proveedor"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewSupplierForm(false);
                  setNewSupplier({
                    name: '',
                    contact_person: '',
                    phone: '',
                    email: '',
                    address: '',
                  });
                }}
                disabled={supplierLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={supplierLoading}>
                {supplierLoading ? 'Creando...' : 'Crear Proveedor'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de compra */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor *
            </label>
            <div className="flex gap-2">
              <Select
                name="supplier_id"
                value={purchaseData.supplier_id}
                onChange={handlePurchaseChange}
                required
                className="flex-1"
              >
                <option value="">Seleccionar proveedor</option>
                {localSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewSupplierForm(!showNewSupplierForm)}
                className="whitespace-nowrap"
              >
                {showNewSupplierForm ? '✕' : '+ Nuevo'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Compra *
            </label>
            <Input
              type="date"
              name="purchase_date"
              value={purchaseData.purchase_date}
              onChange={handlePurchaseChange}
              required
            />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
            <Button type="button" variant="outline" onClick={addItem}>
              + Agregar Producto
            </Button>
          </div>

          {purchaseItems.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Producto {index + 1}</span>
                {purchaseItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <Select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {localProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.barcode ? `(${product.barcode})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <Input
                    type="text"
                    value={calculateSubtotal(item)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Lote (Opcional)
                  </label>
                  <Input
                    value={item.lot_number}
                    onChange={(e) => handleItemChange(index, 'lot_number', e.target.value)}
                    placeholder="Ej: LOTE-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vencimiento (Opcional)
                  </label>
                  <Input
                    type="date"
                    value={item.expiration_date}
                    onChange={(e) => handleItemChange(index, 'expiration_date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-primary-700">${calculateTotal()}</span>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (Opcional)
          </label>
          <Textarea
            name="notes"
            value={purchaseData.notes}
            onChange={handlePurchaseChange}
            rows={2}
            placeholder="Notas adicionales sobre esta compra..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={purchaseLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={purchaseLoading}>
            {purchaseLoading ? 'Registrando...' : `Registrar Compra (${purchaseItems.filter(item => item.product_id && item.quantity && item.unit_price).length} producto(s))`}
          </Button>
        </div>
      </form>
    </div>
  );
}

