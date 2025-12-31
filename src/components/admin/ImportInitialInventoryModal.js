import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import * as XLSX from 'xlsx';
import { inventoryService } from '../../services/api';

export function ImportInitialInventoryModal({ onClose, onSuccess, suppliers = [] }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validar extensión
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Leer y mostrar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length > 0) {
          setPreview({
            headers: jsonData[0] || [],
            rows: jsonData.slice(1, 6), // Mostrar primeras 5 filas
            totalRows: jsonData.length - 1
          });
        }
      } catch (err) {
        console.error('Error reading file:', err);
        setError('Error al leer el archivo. Por favor, verifica que sea un archivo Excel válido.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await inventoryService.downloadTemplate();
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_inventario_inicial.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Error al descargar la plantilla. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await inventoryService.importInitialInventory(formData);
      
      if (response.data.success) {
        alert(`✅ Importación exitosa!\n\nProductos creados: ${response.data.products_created}\nCompras creadas: ${response.data.purchases_created}\nLotes creados: ${response.data.lots_created}`);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (err) {
      console.error('Error importing:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al importar el archivo. Por favor, verifica el formato.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Importar Inventario Inicial desde Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent-50 p-4 rounded-lg">
            <h3 className="font-semibold text-secondary-900 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-secondary-800 space-y-1 list-disc list-inside">
              <li>Descarga la plantilla de ejemplo para ver el formato correcto</li>
              <li>El archivo debe tener las columnas: Nombre, Código de Barras, Descripción, Precio de Venta, Precio de Costo, Cantidad Inicial, Unidad, [Impuestos con porcentajes], Proveedor, Fecha de Compra (opcional)</li>
              <li>Los productos se crearán automáticamente si no existen</li>
              <li>Se crearán compras y lotes iniciales para cada producto</li>
              <li>Las columnas de impuestos son opcionales y deben tener el formato "Nombre del Impuesto (%)" (ej: "IVA (%)", "ICOM (%)")</li>
              <li>Si no se especifica un porcentaje para un impuesto, se usará el porcentaje por defecto del impuesto global</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              Descargar Plantilla de Ejemplo
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Seleccionar archivo Excel:
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-secondary-700 hover:file:bg-accent-100"
            />
          </div>

          {preview && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Vista previa ({preview.totalRows} productos):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-gray-100">
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className="border px-2 py-1 text-left">{header || `Col ${idx + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {preview.headers.map((_, colIdx) => (
                          <td key={colIdx} className="border px-2 py-1">{row[colIdx] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.totalRows > 5 && (
                  <p className="text-xs text-gray-500 mt-2">... y {preview.totalRows - 5} filas más</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !file}>
              {loading ? 'Importando...' : 'Importar Inventario'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









