# Implementación de Webhook para Mensajes Entrantes

## Resumen

Se ha implementado el flujo completo para procesar webhooks de "Mensaje entrante recibido" de Kommo, con las siguientes características:

### Campos del Webhook que se Procesan

El webhook recibe datos en formato `application/x-www-form-urlencoded` con estos campos:

- `account[subdomain]` → subdominio de Kommo
- `message[add][0][id]` → ID del mensaje
- `message[add][0][chat_id]` → ID del chat
- `message[add][0][element_id]` o `message[add][0][entity_id]` → ID del lead
- `message[add][0][text]` → texto del mensaje (si fue texto)
- `message[add][0][attachment][type]` y `message[add][0][attachment][link]` → adjuntos (opcional)

### Plan B: Obtención de Mensajes desde API

Si el webhook **NO** incluye el texto del mensaje, el sistema automáticamente:

1. **Obtiene el lead completo** desde la API de Kommo usando `messagesToken`
2. **Extrae el último mensaje** del lead ordenado por fecha
3. **Usa ese texto** para buscar coincidencias con las reglas

Esto garantiza que siempre tengamos acceso al mensaje, incluso si el webhook no lo incluye directamente.

### Mapeo de Frases → Stage ID

El sistema usa las **reglas existentes** de `COURSE_PHRASES` para mover leads:

**Reglas de Cursos (principales):**
- "higienista dental" → 94374380
- "farmacia" → 94374748  
- "inyectologia" → 94374748
- "electricidad" → (sin stageId específico, usa 94843344)
- "camaras" → (sin stageId específico, usa 94843344)
- Y todas las demás reglas de cursos existentes...

**Reglas de Mensajes Entrantes (fallback):**
- "confirmo que quiero avanzar a pago" → 86115943
- "quiero hablar con un asesor" → 87384179

### Respuestas del Endpoint

El endpoint `/webhook/kommo` responde con diferentes tipos según el caso:

1. **Mensaje con texto que coincide:**
```json
{
  "type": "incoming_message",
  "hasText": true,
  "moved": true,
  "movedTo": 86115943,
  "phrase": "confirmo que quiero avanzar a pago",
  "leadId": "12345",
  "error": null
}
```

2. **Mensaje sin texto:**
```json
{
  "type": "incoming_message_without_text",
  "message": "Mensaje sin texto",
  "processed": false,
  "leadId": "12345"
}
```

3. **Mensaje que no coincide con ninguna regla:**
```json
{
  "type": "no_stage_change",
  "message": "No coincide con ninguna regla",
  "processed": false,
  "leadId": "12345",
  "text": "hola"
}
```

### Endpoints de Prueba

1. **GET `/api/message-phrases`** - Ver todas las frases configuradas
2. **POST `/api/test-message-phrase`** - Probar detección de frase
3. **POST `/api/simulate-message-webhook`** - Simular webhook completo
4. **GET `/api/test-lead-messages/:leadId`** - Probar obtención de mensajes de un lead específico

### Casos de Prueba

**Caso 1: Coincide con regla de curso (higienista dental)**
```bash
curl -X POST https://tu-dominio.vercel.app/api/simulate-message-webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "quiero información sobre higienista dental"}'
```

**Caso 2: Coincide con regla de asesor**
```bash
curl -X POST https://tu-dominio.vercel.app/api/simulate-message-webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "quiero hablar con un asesor"}'
```

**Caso 3: No coincide con ninguna regla**
```bash
curl -X POST https://tu-dominio.vercel.app/api/simulate-message-webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "hola"}'
```

### Logging

El sistema registra de forma sobria:
- ID del lead
- Si hubo texto
- Si se movió el lead
- A qué status_id se movió
- Sin exponer tokens de autenticación

### Variables de Entorno

- `KOMMO_OAUTH_TOKEN` - Token OAuth para API de Kommo
- `KOMMO_DEFAULT_SUBDOMAIN` - Subdominio por defecto (opcional)

### Notas Importantes

1. **Parser URL-Encoded Robusto:** Preserva claves con corchetes como `message[add][0][text]`
2. **Extracción Segura:** Valida que existan `message_id` y `chat_id` antes de procesar
3. **Manejo de Errores:** Si falla el PATCH a Kommo, se loguea pero se responde 200 para evitar reintentos
4. **Compatibilidad:** Mantiene el comportamiento existente para webhooks JSON
5. **Sin Dependencias:** No usa Redis ni bases de datos externas
