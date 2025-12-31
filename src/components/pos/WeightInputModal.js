import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Input, Button } from '../ui';

export function WeightInputModal({ product, onConfirm, onCancel, scaleReading = null }) {
  const [weight, setWeight] = useState(scaleReading || '');
  const inputRef = useRef(null);

  useEffect(() => {
    // Si hay lectura de báscula, usarla
    if (scaleReading !== null && scaleReading > 0) {
      setWeight(scaleReading.toString());
    }
  }, [scaleReading]);

  useEffect(() => {
    // Enfocar el input al montar
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0');
      return;
    }
    onConfirm(weightValue);
  };

  const unitLabel = product.unit_label || product.unitLabel || 'kg';

  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
      // Cerrar al hacer clic fuera del modal
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <Card className="w-full max-w-md mx-4 z-[10000]" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Ingresar Peso - {product.name}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-2">
                Peso ({unitLabel})
              </label>
              <Input
                id="weight"
                ref={inputRef}
                type="number"
                step="0.001"
                min="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`Ingresa el peso en ${unitLabel}`}
                className="text-lg"
                autoFocus
              />
              {scaleReading !== null && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Lectura de báscula detectada: {scaleReading} {unitLabel}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                También puedes usar una báscula digital conectada o ingresar el peso manualmente
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              Confirmar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

