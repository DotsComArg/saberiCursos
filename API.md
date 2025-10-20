# API Documentation - Saberi Lead Manager

## Endpoints Principales

### 🔗 Kommo Integration

#### `GET /api/kommo/auth-url`
Obtiene la URL de autorización de Kommo.

**Response:**
```json
{
  "authUrl": "https://tu-dominio.kommo.com/oauth/authorize?..."
}
```

#### `GET /api/kommo/callback`
Callback para procesar la autorización de Kommo.

**Query Parameters:**
- `code`: Código de autorización
- `error`: Error si la autorización falló

#### `GET /api/kommo/status`
Verifica el estado de la conexión con Kommo.

**Response:**
```json
{
  "connected": true,
  "expiresAt": "2024-01-01T00:00:00.000Z",
  "message": "Conexión activa"
}
```

#### `POST /api/kommo/webhook`
Configura el webhook en Kommo.

**Body:**
```json
{
  "webhookUrl": "https://tu-dominio.com/webhook/kommo",
  "events": ["lead_add", "lead_update"]
}
```

### 📝 Frases Management

#### `GET /api/phrases`
Obtiene todas las frases configuradas.

**Response:**
```json
[
  {
    "id": 1,
    "phrase": "curso de marketing digital",
    "funnel_id": 1,
    "funnel_name": "Embudo Marketing",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/phrases`
Crea una nueva frase.

**Body:**
```json
{
  "phrase": "curso de marketing digital",
  "funnel_id": 1,
  "is_active": true
}
```

#### `PUT /api/phrases/:id`
Actualiza una frase existente.

#### `DELETE /api/phrases/:id`
Elimina una frase.

#### `PATCH /api/phrases/:id/toggle`
Activa/desactiva una frase.

#### `POST /api/phrases/search`
Busca frases que coincidan con un texto.

**Body:**
```json
{
  "text": "marketing digital"
}
```

### 🎯 Embudos Management

#### `GET /api/funnels`
Obtiene todos los embudos configurados.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Embudo Marketing Digital",
    "webhook_url": "https://webhook.site/unique-id",
    "description": "Embudo para leads de marketing",
    "is_active": 1,
    "phrase_count": 4,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/funnels`
Crea un nuevo embudo.

**Body:**
```json
{
  "name": "Embudo Marketing Digital",
  "webhook_url": "https://webhook.site/unique-id",
  "description": "Embudo para leads de marketing",
  "is_active": true
}
```

#### `PUT /api/funnels/:id`
Actualiza un embudo existente.

#### `DELETE /api/funnels/:id`
Elimina un embudo.

#### `PATCH /api/funnels/:id/toggle`
Activa/desactiva un embudo.

#### `POST /api/funnels/:id/test`
Prueba el webhook de un embudo.

### 📊 Webhook Processing

#### `POST /webhook/kommo`
Endpoint principal para recibir webhooks de Kommo.

**Headers:**
- `x-kommo-signature`: Firma del webhook (opcional en desarrollo)

**Body:**
```json
{
  "type": "lead_add",
  "lead": {
    "id": 12345,
    "name": "Lead de Prueba",
    "price": 1000,
    "contacts": [
      {
        "name": "Juan Pérez",
        "first_name": "Juan",
        "last_name": "Pérez"
      }
    ],
    "custom_fields_values": [
      {
        "field_id": 123,
        "values": [
          {
            "value": "curso de marketing digital"
          }
        ]
      }
    ]
  }
}
```

#### `POST /webhook/process-lead`
Procesa un lead manualmente.

**Body:**
```json
{
  "lead_id": 12345
}
```

#### `GET /webhook/logs`
Obtiene logs de procesamiento.

**Query Parameters:**
- `limit`: Número de registros (default: 50)
- `page`: Página (default: 1)
- `status`: Filtrar por estado (success, error, no_match)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "kommo_lead_id": 12345,
      "phrase_matched": "curso de marketing digital",
      "funnel_id": 1,
      "funnel_name": "Embudo Marketing",
      "status": "success",
      "processed_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### 🧪 Ejemplos (Solo Desarrollo)

#### `POST /api/examples/seed`
Crea datos de ejemplo para testing.

#### `DELETE /api/examples/seed`
Elimina datos de ejemplo.

### 🏥 Health Check

#### `GET /health`
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Códigos de Estado HTTP

- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error en la solicitud
- `401`: No autorizado
- `404`: No encontrado
- `500`: Error interno del servidor

## Autenticación

La API utiliza tokens de acceso de Kommo para las operaciones con su CRM. Los webhooks pueden incluir una firma de verificación.

## Rate Limiting

- Límite: 100 requests por 15 minutos por IP
- Headers de respuesta:
  - `X-RateLimit-Limit`: Límite de requests
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## Manejo de Errores

Todos los errores siguen el formato:

```json
{
  "error": "Descripción del error",
  "message": "Mensaje adicional (solo en desarrollo)"
}
```

## Webhooks de Salida

Cuando un lead coincide con una frase, se envía un POST al webhook del embudo con:

```json
{
  "lead_id": 12345,
  "lead_name": "Lead de Prueba",
  "lead_price": 1000,
  "matched_phrase": "curso de marketing digital",
  "funnel_name": "Embudo Marketing",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "kommo",
  "lead_data": {
    // Datos completos del lead de Kommo
  }
}
```
