import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../ui';
import { Logo } from '../ui/Logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya hay un usuario logueado
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setLoading(true);

    try {
      console.log('Intentando login con:', { email, apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api' });
      
      const response = await authService.login(email, password);
      
      console.log('Respuesta del login:', response);
      
      if (response && response.user) {
        console.log('Login exitoso, redirigiendo...');
        // Pequeño delay para asegurar que el localStorage se guardó
        setTimeout(() => {
          navigate('/', { replace: true });
          window.location.reload();
        }, 100);
      } else {
        setError('No se recibió información del usuario');
      }
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response) {
        // El servidor respondió con un error
        if (err.response.data) {
          if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.errors) {
            // Errores de validación
            const errors = Object.values(err.response.data.errors).flat();
            errorMessage = errors.join(', ');
          }
        }
        setDebugInfo(`Status: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
        setDebugInfo(`URL: ${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/login`);
      } else {
        // Error al configurar la petición
        errorMessage = err.message || 'Error desconocido';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-3">
            <Logo size="lg" animated={true} />
            <CardTitle className="text-2xl text-center">QAntico POS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-semibold">{error}</p>
                {debugInfo && (
                  <p className="text-xs mt-1 text-red-600">{debugInfo}</p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

