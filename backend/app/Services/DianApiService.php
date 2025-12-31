<?php

namespace App\Services;

use App\Models\DianProviderConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DianApiService
{
    /**
     * Enviar factura a DIAN mediante proveedor tecnológico
     */
    public function sendInvoice(string $signedXmlContent, DianProviderConfig $config): array
    {
        try {
            // Autenticación con el proveedor
            $token = $this->authenticate($config);

            // Enviar XML al proveedor
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/xml',
            ])->post($config->api_url . '/invoices', [
                'xml' => base64_encode($signedXmlContent),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'status' => $data['status'] ?? 'accepted',
                    'cufe' => $data['cufe'] ?? null,
                    'acuse' => $data['acuse'] ?? null,
                    'message' => $data['message'] ?? 'Factura enviada exitosamente',
                    'errors' => $data['errors'] ?? [],
                ];
            } else {
                $errorData = $response->json();
                
                return [
                    'success' => false,
                    'status' => 'rejected',
                    'message' => $errorData['message'] ?? 'Error al enviar factura a DIAN',
                    'errors' => $errorData['errors'] ?? [
                        [
                            'code' => $response->status(),
                            'message' => $response->body(),
                        ]
                    ],
                ];
            }

        } catch (\Exception $e) {
            Log::error('Error al enviar factura a DIAN', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'status' => 'rejected',
                'message' => 'Error de conexión con proveedor DIAN',
                'errors' => [
                    [
                        'code' => 'CONNECTION_ERROR',
                        'message' => $e->getMessage(),
                    ]
                ],
            ];
        }
    }

    /**
     * Consultar estado de una factura en DIAN
     */
    public function checkStatus(string $cufeOrNumber, DianProviderConfig $config): array
    {
        try {
            $token = $this->authenticate($config);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->get($config->api_url . '/invoices/' . $cufeOrNumber . '/status');

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'status' => $data['status'] ?? 'pending',
                    'cufe' => $data['cufe'] ?? $cufeOrNumber,
                    'message' => $data['message'] ?? 'Estado consultado',
                    'errors' => $data['errors'] ?? [],
                ];
            } else {
                return [
                    'success' => false,
                    'status' => 'unknown',
                    'message' => 'No se pudo consultar el estado',
                    'errors' => [
                        [
                            'code' => $response->status(),
                            'message' => $response->body(),
                        ]
                    ],
                ];
            }

        } catch (\Exception $e) {
            Log::error('Error al consultar estado DIAN', [
                'cufe' => $cufeOrNumber,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'unknown',
                'message' => 'Error de conexión',
                'errors' => [
                    [
                        'code' => 'CONNECTION_ERROR',
                        'message' => $e->getMessage(),
                    ]
                ],
            ];
        }
    }

    /**
     * Autenticar con el proveedor tecnológico
     */
    protected function authenticate(DianProviderConfig $config): string
    {
        // Implementación básica de autenticación
        // Cada proveedor tiene su propio método de autenticación
        
        if ($config->api_key && $config->getDecryptedApiSecret()) {
            // Autenticación con API Key/Secret
            $response = Http::post($config->api_url . '/auth', [
                'api_key' => $config->api_key,
                'api_secret' => $config->getDecryptedApiSecret(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['token'] ?? $data['access_token'] ?? '';
            }
        }

        if ($config->username && $config->getDecryptedPassword()) {
            // Autenticación con usuario/contraseña
            $response = Http::post($config->api_url . '/auth/login', [
                'username' => $config->username,
                'password' => $config->getDecryptedPassword(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['token'] ?? $data['access_token'] ?? '';
            }
        }

        throw new \Exception('No se pudo autenticar con el proveedor DIAN. Verifique las credenciales.');
    }
}














