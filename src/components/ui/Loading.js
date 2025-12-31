import { AnimatedLogo } from './Logo';

export function Loading({ message = 'Cargando...', size = 'md' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AnimatedLogo size={size} />
      {message && (
        <p className="mt-4 text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message = 'Cargando...' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center">
          <AnimatedLogo size="lg" />
          <p className="mt-4 text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}














