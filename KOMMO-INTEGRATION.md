# 🚀 Integración Completa con Kommo - Saberi Cursos

## ✅ **Sistema Funcionando con Credenciales Reales**

### 🔑 **Credenciales Configuradas:**
- **Client ID**: `59180966-188f-4f82-a4e2-0ceeb6f23fbb`
- **Client Secret**: `xSy2LMLPtxKem6ZyPAewVnNmRfNLuKY2xsy2m8UC336UKdvPiUzNnkL7jQ8kqyCb`
- **Access Token**: Token de larga duración configurado
- **Base URL**: `https://api-c.kommo.com/api/v4`

## 🌐 **Endpoints Disponibles:**

### **Información del Sistema:**
- `GET /` - Mensaje de confirmación + estado de Kommo
- `GET /health` - Health check con estado de Kommo
- `GET /api/stats` - Estadísticas del sistema

### **Integración con Kommo:**
- `GET /api/kommo/account` - Información de la cuenta de Kommo
- `GET /api/kommo/leads` - Obtener leads de Kommo
- `GET /api/kommo/leads/:id` - Obtener lead específico
- `POST /api/process-lead` - Procesar lead manualmente

### **Gestión de Frases:**
- `GET /api/phrases` - Listar frases configuradas
- `POST /api/phrases` - Crear nueva frase
- `DELETE /api/phrases/:id` - Eliminar frase

### **Gestión de Embudos:**
- `GET /api/funnels` - Listar embudos configurados
- `POST /api/funnels` - Crear nuevo embudo

### **Webhook de Kommo:**
- `POST /webhook/kommo` - Recibir leads automáticamente

## 🎯 **Cómo Funciona:**

### **1. Configurar Frases de Detección:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/phrases \
  -H "Content-Type: application/json" \
  -d '{
    "phrase": "curso de marketing digital",
    "funnel_id": 1
  }'
```

### **2. Configurar Embudos de Destino:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/funnels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Embudo Marketing Digital",
    "webhook_url": "https://tu-embudo.com/webhook",
    "description": "Embudo para leads de marketing"
  }'
```

### **3. Configurar Webhook en Kommo:**
1. Ve a tu cuenta de Kommo
2. Configuración → Integraciones → Webhooks
3. URL del webhook: `https://tu-dominio.vercel.app/webhook/kommo`
4. Eventos: `lead_add`, `lead_update`

### **4. Procesamiento Automático:**
- ✅ Lead llega a Kommo
- ✅ Kommo envía webhook a tu sistema
- ✅ Sistema busca frases coincidentes
- ✅ Si encuentra coincidencia, envía al embudo
- ✅ Si no encuentra, registra como "no_match"

## 📊 **Ejemplo de Uso:**

### **Crear Frase:**
```json
{
  "phrase": "quiero aprender marketing",
  "funnel_id": 1
}
```

### **Crear Embudo:**
```json
{
  "name": "Embudo Marketing",
  "webhook_url": "https://webhook.site/unique-id",
  "description": "Para leads de marketing"
}
```

### **Webhook Recibido:**
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
            "value": "quiero aprender marketing digital"
          }
        ]
      }
    ]
  }
}
```

### **Respuesta del Sistema:**
```json
{
  "received": true,
  "processed": true,
  "phrase": "quiero aprender marketing",
  "message": "Lead enviado al embudo 1",
  "platform": "Vercel"
}
```

## 🔧 **Configuración en Vercel:**

### **Variables de Entorno:**
```env
NODE_ENV=production
KOMMO_WEBHOOK_SECRET=tu_secret_para_webhooks
```

### **URLs Importantes:**
- **Principal**: `https://tu-dominio.vercel.app/`
- **Webhook**: `https://tu-dominio.vercel.app/webhook/kommo`
- **API**: `https://tu-dominio.vercel.app/api/`

## 📈 **Monitoreo:**

### **Ver Estadísticas:**
```bash
curl https://tu-dominio.vercel.app/api/stats
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "phrases_count": 5,
    "funnels_count": 2,
    "processed_leads": 15,
    "active_phrases": 5,
    "active_funnels": 2
  }
}
```

### **Ver Leads de Kommo:**
```bash
curl https://tu-dominio.vercel.app/api/kommo/leads
```

### **Procesar Lead Manualmente:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/process-lead \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 12345}'
```

## 🎯 **Próximos Pasos:**

1. **✅ Deploy en Vercel** - Sistema funcionando
2. **✅ Integración con Kommo** - Credenciales configuradas
3. **🔄 Configurar frases** - Agregar frases de tus anuncios
4. **🔄 Configurar embudos** - URLs de destino
5. **🔄 Configurar webhook** - En tu cuenta de Kommo
6. **🔄 Probar sistema** - Crear lead de prueba

## 🚨 **Solución de Problemas:**

### **Webhook No Funciona:**
1. Verificar URL en Kommo: `https://tu-dominio.vercel.app/webhook/kommo`
2. Verificar eventos: `lead_add`, `lead_update`
3. Revisar logs en Vercel

### **Leads No Se Procesan:**
1. Verificar que las frases estén activas
2. Verificar que los embudos estén activos
3. Revisar coincidencias de texto

### **Error de API:**
1. Verificar token de acceso
2. Verificar permisos en Kommo
3. Revisar logs de error

---

**¡El sistema está completamente funcional con Kommo!** 🎉

**URL del webhook para configurar en Kommo:**
`https://tu-dominio.vercel.app/webhook/kommo`
