# Saberi Cursos - Lead Manager

## Descripción
Backend para gestionar leads provenientes de Kommo y redirigirlos a otros embudos de ventas.

## Características
- ✅ Integración completa con Kommo CRM
- ✅ Sistema de gestión de frases de leads
- ✅ Webhook handler para recibir leads automáticamente
- ✅ Redirección inteligente a embudos específicos
- ✅ Panel de configuración web
- ✅ Logging y monitoreo

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales de Kommo
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Ejecutar en producción:
```bash
npm start
```

## Configuración de Kommo

1. Ve a tu cuenta de Kommo
2. Configuración → Integraciones → API
3. Crea una nueva aplicación
4. Copia el Client ID y Client Secret
5. Configura la URL de webhook: `https://tu-dominio.com/webhook/kommo`

## Variables de Entorno

```env
PORT=3000
KOMMO_CLIENT_ID=tu_client_id
KOMMO_CLIENT_SECRET=tu_client_secret
KOMMO_REDIRECT_URI=http://localhost:3000/auth/kommo/callback
KOMMO_WEBHOOK_SECRET=tu_webhook_secret
DATABASE_URL=./database.sqlite
NODE_ENV=development
```

## API Endpoints

- `GET /` - Panel de configuración
- `POST /webhook/kommo` - Webhook para recibir leads
- `GET /api/phrases` - Obtener frases configuradas
- `POST /api/phrases` - Agregar nueva frase
- `PUT /api/phrases/:id` - Actualizar frase
- `DELETE /api/phrases/:id` - Eliminar frase
- `GET /api/funnels` - Obtener embudos configurados
- `POST /api/funnels` - Configurar nuevo embudo

## Estructura del Proyecto

```
src/
├── app.js              # Aplicación principal
├── config/             # Configuraciones
├── controllers/        # Controladores de rutas
├── middleware/         # Middleware personalizado
├── models/            # Modelos de base de datos
├── routes/            # Definición de rutas
├── services/          # Lógica de negocio
└── utils/             # Utilidades
```
