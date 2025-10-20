# 🚀 Saberi Cursos - Lead Manager (Vercel)

## ✅ Deploy en Vercel

Este backend está configurado específicamente para funcionar en Vercel.

### 🔧 Configuración de Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```env
NODE_ENV=production
KOMMO_CLIENT_ID=tu_client_id_de_kommo
KOMMO_CLIENT_SECRET=tu_client_secret_de_kommo
KOMMO_REDIRECT_URI=https://tu-dominio.vercel.app/api/kommo/callback
KOMMO_WEBHOOK_SECRET=tu_secret_para_webhooks
DATABASE_URL=./database.sqlite
LOG_LEVEL=info
```

### 🌐 URLs Importantes

- **Principal**: `https://tu-dominio.vercel.app/`
- **Health Check**: `https://tu-dominio.vercel.app/health`
- **API Kommo**: `https://tu-dominio.vercel.app/api/kommo`
- **Webhook**: `https://tu-dominio.vercel.app/webhook/kommo`

### 📋 Configuración de Kommo

1. **Redirect URI**: `https://tu-dominio.vercel.app/api/kommo/callback`
2. **Webhook URL**: `https://tu-dominio.vercel.app/webhook/kommo`

### 🎯 Verificar que Funciona

Visita `https://tu-dominio.vercel.app/` y deberías ver:

```json
{
  "message": "Backend Saberi funcionando",
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "platform": "Vercel"
}
```

### 🔄 Deploy Automático

Cada push a la rama `main` hará deploy automático en Vercel.

### 📊 Monitoreo

- **Logs**: Disponibles en el dashboard de Vercel
- **Métricas**: En la sección Analytics
- **Errores**: En la sección Functions

---

**¡El backend está listo para producción en Vercel!** 🎉
