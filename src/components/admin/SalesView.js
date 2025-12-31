import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Select, Input, Loading } from '../ui';
import { InvoiceView } from '../invoice/InvoiceView';

export function SalesView({ sales, customers, products, onSimulateReturn, userRole, users, onFilterByUser, isLoading = false, isLoadingSales = false }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');

  const filteredSales = useMemo(() => {
    let filtered = sales || [];
    if (filterUserId && onFilterByUser) {
      filtered = filtered.filter(sale => sale.user_id === parseInt(filterUserId));
    }
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [sales, filterUserId, onFilterByUser]);

  const handleViewInvoice = (sale) => {
    setSelectedSale(sale);
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setSelectedSale(null);
  };

  const handleFilterChange = (userId) => {
    setFilterUserId(userId);
    if (onFilterByUser) {
      onFilterByUser(userId);
    }
  };

  if (showInvoice && selectedSale) {
    return (
      <InvoiceView
        sale={selectedSale}
        onClose={handleCloseInvoice}
        customers={customers}
        products={products}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Ventas</CardTitle>
          {userRole === 'admin' || userRole === 'super_admin' ? (
            <div className="flex gap-2">
              <Select
                value={filterUserId}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-48"
              >
                <option value="">Todos los usuarios</option>
                {users && users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingSales ? (
          <Loading />
        ) : filteredSales.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay ventas registradas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{sale.sale_number || sale.id}</TableCell>
                  <TableCell>
                    {sale.customer ? sale.customer.name : 'Cliente general'}
                  </TableCell>
                  <TableCell>${sale.final_total?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {sale.user ? sale.user.name : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(sale)}
                      >
                        Ver Factura
                      </Button>
                      {onSimulateReturn && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSimulateReturn(sale)}
                        >
                          Devolución
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
