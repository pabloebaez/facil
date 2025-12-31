import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Textarea } from '../ui';
import { purchaseService, supplierService, productService } from '../../services/api';

export function PurchaseForm({ 
  product, 
  suppliers = [], 
  onPurchaseRegistered, 
  onCancel,
  showCancelButton = true,
  initialSupplierId = null,
  initialUnitPrice = null,
  onSupplierCreated,
  onCreateProductFirst = null, // Callback para crear el producto antes de la compra
  renderAsForm = true, // Por defecto renderiza como form, pero puede ser false para usar dentro de otro form
}) {
  const [purchaseData, setPurchaseData] = useState({
    supplier_id: initialSupplierId || '',
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: '',
    unit_price: initialUnitPrice || '',
    lot_number: '',
    expiration_date: '',
    notes: '',
  });
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
  const [bestSupplier, setBestSupplier] = useState(null);
  const [localSuppliers, setLocalSuppliers] = useState(suppliers);

  // Actualizar lista local cuando cambien los suppliers del padre
  useEffect(() => {
    setLocalSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    if (product && product.id) {
      loadBestSupplier();
      loadNextLotNumber();
    } else {
      setPurchaseData(prev => ({
        ...prev,
        lot_number: '',
      }));
    }
  }, [product]);

  useEffect(() => {
    if (bestSupplier) {
      setPurchaseData(prev => ({
        ...prev,
        supplier_id: prev.supplier_id || bestSupplier.supplier_id || '',
        unit_price: prev.unit_price || bestSupplier.last_purchase_price || '',
      }));
    }
  }, [bestSupplier]);

  const loadBestSupplier = async () => {
    if (!product?.id) return;
    try {
      const response = await productService.getBestSupplier(product.id);
      if (response.data) {
        setBestSupplier(response.data);
      }
    } catch (error) {
      console.error('Error loading best supplier:', error);
    }
  };

  const loadNextLotNumber = async () => {
    if (!product?.id) return;
    try {
      // Obtener el kardex del producto para ver los lotes existentes
      const response = await productService.getKardex(product.id);
      if (response.data && response.data.lots) {
        const lots = response.data.lots;
        
        // Buscar el último número de lote numérico
        let maxNumber = 0;
        const currentYear = new Date().getFullYear();
        
        lots.forEach(lot => {
          if (lot.lot_number) {
            const lotNumber = lot.lot_number.trim();
            
            // Buscar patrones numéricos en el número de lote
            // Patrones comunes: "001", "LOTE-001", "LOTE-2024-001", "2024-001", etc.
            const patterns = [
              /(\d+)$/, // Número al final: "LOTE-001" -> 1
              /-(\d+)$/, // Número después de guion: "LOTE-2024-001" -> 1
              /^(\d+)$/, // Solo número: "001" -> 1
              /(\d{4})-(\d+)$/, // Año-número: "2024-001" -> 1
            ];
            
            for (const pattern of patterns) {
              const match = lotNumber.match(pattern);
              if (match) {
                const number = parseInt(match[match.length - 1], 10);
                if (!isNaN(number) && number > maxNumber) {
                  maxNumber = number;
                }
                break;
              }
            }
          }
        });
        
        // Generar el siguiente número consecutivo
        const nextNumber = maxNumber + 1;
        const paddedNumber = String(nextNumber).padStart(3, '0');
        
        // Formato sugerido: LOTE-YYYY-XXX (ej: LOTE-2024-001)
        const suggestedLotNumber = `LOTE-${currentYear}-${paddedNumber}`;
        setPurchaseData(prev => ({
          ...prev,
          lot_number: suggestedLotNumber,
        }));
      } else {
        // Si no hay lotes, empezar con 001
        const currentYear = new Date().getFullYear();
        setPurchaseData(prev => ({
          ...prev,
          lot_number: `LOTE-${currentYear}-001`,
        }));
      }
    } catch (error) {
      console.error('Error loading lot numbers:', error);
      // En caso de error, sugerir un número básico
      const currentYear = new Date().getFullYear();
      setPurchaseData(prev => ({
        ...prev,
        lot_number: `LOTE-${currentYear}-001`,
      }));
    }
  };

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewSupplierChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({
      ...prev,
      [name]: value,
    }));
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

      // Agregar el nuevo proveedor a la lista local
      const createdSupplier = response.data;
      
      // Actualizar la lista local de proveedores inmediatamente
      setLocalSuppliers(prev => [...prev, createdSupplier]);
      
      // Actualizar el formulario de compra con el nuevo proveedor
      setPurchaseData(prev => ({
        ...prev,
        supplier_id: createdSupplier.id,
      }));

      // Cerrar el formulario de nuevo proveedor
      setShowNewSupplierForm(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });

      // Notificar que se creó un proveedor
      alert('Proveedor creado exitosamente');
      
      // Notificar al padre para que recargue la lista de proveedores
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

  const FormFieldsContent = () => (
    <>
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
          {localSuppliers.length === 0 && !showNewSupplierForm && (
            <p className="text-xs text-gray-500 mt-1">
              No hay proveedores registrados. Haz clic en "+ Nuevo" para crear uno.
            </p>
          )}
          {bestSupplier && purchaseData.supplier_id === bestSupplier.supplier_id && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Este es el proveedor con mejor precio histórico
            </p>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            name="quantity"
            value={purchaseData.quantity}
            onChange={handlePurchaseChange}
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
            name="unit_price"
            value={purchaseData.unit_price}
            onChange={handlePurchaseChange}
            required
            placeholder="0.00"
          />
          {bestSupplier && (
            <p className="text-xs text-gray-500 mt-1">
              Último: ${bestSupplier.last_purchase_price}
              {parseFloat(purchaseData.unit_price) > parseFloat(bestSupplier.last_purchase_price) && (
                <span className="text-orange-600 ml-1">⚠ Más caro</span>
              )}
              {parseFloat(purchaseData.unit_price) < parseFloat(bestSupplier.last_purchase_price) && (
                <span className="text-green-600 ml-1">✓ Mejor precio</span>
              )}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtotal
          </label>
          <Input
            type="text"
            value={
              purchaseData.quantity && purchaseData.unit_price
                ? (parseFloat(purchaseData.quantity) * parseFloat(purchaseData.unit_price)).toFixed(2)
                : '0.00'
            }
            disabled
            className="bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Lote (Opcional)
          </label>
          <Input
            name="lot_number"
            value={purchaseData.lot_number}
            onChange={handlePurchaseChange}
            placeholder="Ej: LOTE-2024-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Vencimiento (Opcional)
          </label>
          <Input
            type="date"
            name="expiration_date"
            value={purchaseData.expiration_date}
            onChange={handlePurchaseChange}
          />
        </div>
      </div>

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

      <div className="flex justify-end gap-2">
        {showCancelButton && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
              setPurchaseData({
                supplier_id: bestSupplier?.supplier_id || '',
                purchase_date: new Date().toISOString().split('T')[0],
                quantity: '',
                unit_price: bestSupplier?.last_purchase_price || '',
                lot_number: '',
                expiration_date: '',
                notes: '',
              });
            }}
            disabled={purchaseLoading}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type={renderAsForm ? "submit" : "button"} 
          onClick={renderAsForm ? undefined : (e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          disabled={purchaseLoading}
        >
          {purchaseLoading ? 'Registrando...' : 'Registrar Compra'}
        </Button>
      </div>
    </>
  );

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!purchaseData.supplier_id) {
      alert('Por favor selecciona un proveedor');
      return;
    }
    
    if (!purchaseData.quantity || parseFloat(purchaseData.quantity) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (!purchaseData.unit_price || parseFloat(purchaseData.unit_price) <= 0) {
      alert('El precio unitario debe ser mayor a 0');
      return;
    }

    setPurchaseLoading(true);
    try {
      // Si el producto no existe y hay un callback para crearlo, crearlo primero
      let productToUse = product;
      if (!product && onCreateProductFirst) {
        productToUse = await onCreateProductFirst();
        if (!productToUse) {
          setPurchaseLoading(false);
          return; // Error al crear producto, ya se mostró el mensaje
        }
      }

      if (!productToUse || !productToUse.id) {
        alert('Error: No se puede registrar la compra sin un producto válido.');
        setPurchaseLoading(false);
        return;
      }

      await purchaseService.create({
        supplier_id: purchaseData.supplier_id,
        purchase_date: purchaseData.purchase_date,
        items: [{
          product_id: productToUse.id,
          quantity: parseFloat(purchaseData.quantity),
          unit_price: parseFloat(purchaseData.unit_price),
          lot_number: purchaseData.lot_number || null,
          expiration_date: purchaseData.expiration_date || null,
          notes: purchaseData.notes || null,
        }],
        notes: purchaseData.notes || null,
      });

      alert('Compra registrada exitosamente. El inventario y los lotes han sido actualizados.');
      
      // Limpiar formulario
      setPurchaseData({
        supplier_id: bestSupplier?.supplier_id || '',
        purchase_date: new Date().toISOString().split('T')[0],
        quantity: '',
        unit_price: bestSupplier?.last_purchase_price || '',
        lot_number: '',
        expiration_date: '',
        notes: '',
      });

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

  return (
    <div className="space-y-4">
      {/* Información del mejor proveedor */}
      {bestSupplier && (
        <div className="bg-accent-50 p-3 border border-accent-200 rounded-lg">
          <p className="text-sm font-semibold text-secondary-800 mb-1">
            💡 Sugerencia: Mejor Proveedor (Última Compra)
          </p>
          <p className="text-xs text-secondary-700">
            <strong>{bestSupplier.supplier_name}</strong> - 
            Precio: <strong>${bestSupplier.last_purchase_price}</strong> - 
            Fecha: {new Date(bestSupplier.last_purchase_date).toLocaleDateString('es-ES')}
          </p>
        </div>
      )}

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
                  onChange={handleNewSupplierChange}
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
                  onChange={handleNewSupplierChange}
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
                  onChange={handleNewSupplierChange}
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
                  onChange={handleNewSupplierChange}
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
                onChange={handleNewSupplierChange}
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
      {renderAsForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <FormFieldsContent />
        </form>
      ) : (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <FormFieldsContent />
        </div>
      )}
    </div>
  );
}

