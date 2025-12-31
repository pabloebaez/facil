import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../ui';
import { AddProductForm } from './AddProductForm';
import { EditProductForm } from './EditProductForm';
import { MultiProductPurchaseForm } from './MultiProductPurchaseForm';

export function InventoryView({
  products = [],
  taxes = [],
  suppliers = [],
  warehouses = [],
  onUpdateInventory,
  onProductTaxToggle,
  onAddProduct,
  onRemoveProduct,
  onProductDiscountChange,
  searchTerm = '',
  onSearchChange,
  onProductUpdated,
  onSuppliersReload,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleSaveEdit = async (productData) => {
    try {
      setEditingProduct(null);
      if (onProductUpdated) {
        await onProductUpdated();
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
    }
  };

  if (showPurchaseForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrar Compra Múltiple</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiProductPurchaseForm
            products={products}
            suppliers={suppliers}
            onPurchaseRegistered={async () => {
              setShowPurchaseForm(false);
              if (onProductUpdated) {
                await onProductUpdated();
              }
            }}
            onCancel={() => setShowPurchaseForm(false)}
            onSupplierCreated={async () => {
              if (onSuppliersReload) {
                await onSuppliersReload();
              }
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (showAddForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agregar Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <AddProductForm
            taxes={taxes}
            suppliers={suppliers}
            warehouses={warehouses}
            onSubmit={async (productData) => {
              await onAddProduct(productData);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
            onSuppliersReload={onSuppliersReload}
          />
        </CardContent>
      </Card>
    );
  }

  if (editingProduct) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProductForm
            product={editingProduct}
            taxes={taxes}
            suppliers={suppliers}
            warehouses={warehouses}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            onSuppliersReload={onSuppliersReload}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Inventario</CardTitle>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64"
            />
            <Button 
              variant="outline"
              onClick={() => setShowPurchaseForm(true)}
            >
              📦 Registrar Compra
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              + Agregar Producto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Inventario</TableHead>
                <TableHead>Impuestos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.barcode || '-'}</TableCell>
                  <TableCell>
                    {product.warehouse ? (
                      <span className="text-sm">
                        {product.warehouse.name}
                        {product.warehouse.code && ` (${product.warehouse.code})`}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin bodega</span>
                    )}
                  </TableCell>
                  <TableCell>${(parseFloat(product.price) || 0).toFixed(2)}</TableCell>
                  <TableCell>{product.inventory ?? 0}</TableCell>
                  <TableCell>
                    {product.taxes && product.taxes.length > 0
                      ? product.taxes.map(t => t.name).join(', ')
                      : 'Sin impuestos'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </Button>
                      {onRemoveProduct && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveProduct(product.id)}
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
