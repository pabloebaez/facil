import React from 'react';
import { Logo } from './Logo';

export function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenido */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="lg" animated={true} />
          </div>
          <h2 className="text-2xl font-bold text-primary-700 mb-2">
            QAnticoPOS v1.0.0
          </h2>
        </div>

        <div className="space-y-4 text-gray-700">
          <p className="text-sm leading-relaxed">
            QAnticoPOS es un sistema POS diseñado para facilitar la administración de tu negocio de forma rápida, sencilla y eficiente. Permite gestionar ventas, inventario, compras, bodegas, clientes, proveedores e informes, todo desde una sola plataforma intuitiva.
          </p>

          <p className="text-sm leading-relaxed">
            Este software ha sido desarrollado por <strong className="text-primary-600">QAnticoDevs</strong>, una empresa enfocada en crear soluciones tecnológicas modernas, seguras y adaptadas a las necesidades reales de los negocios.
          </p>

          <p className="text-sm leading-relaxed">
            Estamos comprometidos con la mejora continua del sistema, incorporando nuevas funcionalidades y optimizaciones para ofrecerte una experiencia cada vez más completa y confiable.
          </p>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-800 mb-2">🌐 Más información:</p>
            <a 
              href="https://www.qanticodevs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline text-sm transition-colors"
            >
              https://www.qanticodevs.com
            </a>
          </div>
        </div>

        {/* Botón cerrar inferior */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

