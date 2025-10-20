# Saberi Cursos - Lead Manager

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo y configura tus credenciales:
```bash
cp env.example .env
```

Edita el archivo `.env` con tus datos:
```env
PORT=3000
KOMMO_CLIENT_ID=tu_client_id_de_kommo
KOMMO_CLIENT_SECRET=tu_client_secret_de_kommo
KOMMO_REDIRECT_URI=http://localhost:3000/api/kommo/callback
KOMMO_WEBHOOK_SECRET=tu_secret_para_webhooks
DATABASE_URL=./database.sqlite
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Configurar Kommo CRM

#### Paso 1: Crear Aplicación en Kommo
1. Ve a tu cuenta de Kommo
2. Configuración → Integraciones → API
3. Crea una nueva aplicación
4. Configura los siguientes parámetros:
   - **Nombre**: Saberi Lead Manager
   - **Tipo**: Servidor
   - **Redirect URI**: `http://localhost:3000/api/kommo/callback`
   - **Permisos**: CRM (lectura y escritura)

#### Paso 2: Obtener Credenciales
1. Copia el **Client ID** y **Client Secret**
2. Pégalos en tu archivo `.env`

#### Paso 3: Autorizar la Aplicación
1. Ejecuta el servidor: `npm run dev`
2. Ve a: `http://localhost:3000`
3. Haz clic en "Autorizar Kommo"
4. Completa la autorización en Kommo

### 4. Configurar Webhook
1. En el panel de configuración, ve a la pestaña "Kommo"
2. Haz clic en "Configurar Webhook"
3. El sistema configurará automáticamente el webhook en Kommo

## 📝 Configuración de Frases

### Agregar Frases de Detección
1. Ve a la pestaña "Frases"
2. Ingresa la frase que quieres detectar (ej: "curso de marketing")
3. Selecciona el embudo de destino
4. Haz clic en "Agregar Frase"

### Tipos de Frases Recomendadas
- **Palabras clave**: "marketing", "curso", "capacitación"
- **Frases completas**: "quiero aprender marketing digital"
- **Variaciones**: "curso de", "capacitación en", "aprender"

## 🎯 Configuración de Embudos

### Crear Nuevo Embudo
1. Ve a la pestaña "Embudos"
2. Completa los campos:
   - **Nombre**: Nombre descriptivo del embudo
   - **URL del Webhook**: URL donde enviar los leads
   - **Descripción**: Descripción opcional
3. Haz clic en "Crear Embudo"

### Probar Embudo
1. Haz clic en "Probar" junto al embudo
2. El sistema enviará un mensaje de prueba
3. Verifica que recibas el mensaje correctamente

## 📊 Monitoreo y Logs

### Ver Logs de Procesamiento
1. Ve a la pestaña "Logs"
2. Puedes filtrar por estado:
   - **Exitosos**: Leads enviados correctamente
   - **Con Error**: Leads que fallaron al enviar
   - **Sin Coincidencia**: Leads que no coincidieron con ninguna frase

### Estados de Procesamiento
- ✅ **success**: Lead enviado exitosamente al embudo
- ❌ **error**: Error al enviar el lead
- ⚠️ **no_match**: No se encontró frase coincidente

## 🔧 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Ejecutar en modo desarrollo
npm start            # Ejecutar en producción
```

### Base de Datos
```bash
# La base de datos se crea automáticamente
# Ubicación: ./database.sqlite
```

### Logs
```bash
# Los logs se guardan en:
# - logs/combined.log (todos los logs)
# - logs/error.log (solo errores)
```

## 🌐 Despliegue en Producción

### Variables de Entorno para Producción
```env
NODE_ENV=production
PORT=3000
KOMMO_REDIRECT_URI=https://tu-dominio.com/api/kommo/callback
```

### Configuración del Webhook en Producción
1. Actualiza la URL del webhook a: `https://tu-dominio.com/webhook/kommo`
2. Configura SSL/TLS en tu servidor
3. Verifica que el webhook sea accesible desde internet

## 🚨 Solución de Problemas

### Error de Conexión con Kommo
1. Verifica que las credenciales sean correctas
2. Asegúrate de que la aplicación esté autorizada
3. Revisa que el redirect URI coincida exactamente

### Webhook No Funciona
1. Verifica que la URL sea accesible desde internet
2. Comprueba que el servidor tenga SSL/TLS
3. Revisa los logs para errores específicos

### Leads No Se Procesan
1. Verifica que las frases estén activas
2. Comprueba que los embudos estén activos
3. Revisa los logs en la pestaña "Logs"

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa los logs del sistema
- Verifica la configuración de Kommo
- Comprueba la conectividad de red

---

**¡Listo! Tu sistema de gestión de leads está configurado y funcionando.** 🎉
