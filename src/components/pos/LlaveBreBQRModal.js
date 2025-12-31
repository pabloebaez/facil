import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { llaveBreBPaymentService } from '../../services/api';

export function LlaveBreBQRModal({ isOpen, onClose, amount, onPaymentConfirmed }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && amount > 0) {
      generateQR();
    } else {
      setQrData(null);
      setError(null);
      setPaymentStatus('pending');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, amount]);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      const reference = 'VENTA-' + Date.now();
      const response = await llaveBreBPaymentService.generateQR(amount, reference);
      
      if (response.data.success) {
        setQrData(response.data);
        startStatusCheck(response.data.reference);
      } else {
        setError(response.data.error || 'Error al generar código QR');
      }
    } catch (err) {
      console.error('Error generating QR:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al generar código QR de Llave BRE-B');
    } finally {
      setLoading(false);
    }
  };

  const startStatusCheck = (reference) => {
    const interval = setInterval(async () => {
      if (paymentStatus === 'completed' || paymentStatus === 'failed' || !isOpen) {
        clearInterval(interval);
        return;
      }

      try {
        setCheckingStatus(true);
        const response = await llaveBreBPaymentService.checkStatus(reference);
        if (response.data.success && response.data.status === 'completed') {
          setPaymentStatus('completed');
          clearInterval(interval);
          setTimeout(() => {
            if (onPaymentConfirmed) {
              onPaymentConfirmed();
            }
            onClose();
          }, 1000);
        } else if (response.data.status === 'failed') {
          setPaymentStatus('failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      } finally {
        setCheckingStatus(false);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  };

  useEffect(() => {
    if (qrData && qrData.reference) {
      const cleanup = startStatusCheck(qrData.reference);
      return cleanup;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Pago con Llave BRE-B</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600"></div>
            <p className="mt-2 text-gray-600">Generando código QR...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={generateQR}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {qrData && !loading && (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Monto a pagar: <span className="text-green-600">${amount.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Escanea el código QR con la app de Llave BRE-B
              </p>
            </div>

            <div className="flex justify-center mb-4 bg-white p-4 rounded-lg border-2 border-gray-200">
              <QRCodeSVG
                value={qrData.qr_data}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">
                Referencia: {qrData.reference}
              </p>
              {paymentStatus === 'pending' && (
                <div className="flex items-center justify-center gap-2 text-sm text-secondary-600">
                  {checkingStatus && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-600"></div>
                  )}
                  <span>Esperando pago...</span>
                </div>
              )}
              {paymentStatus === 'completed' && (
                <div className="text-green-600 font-semibold">
                  ✓ Pago confirmado
                </div>
              )}
              {paymentStatus === 'failed' && (
                <div className="text-red-600 font-semibold">
                  ✗ Pago fallido
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}










