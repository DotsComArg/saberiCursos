#!/bin/bash

echo "🚀 Saberi Cursos - Lead Manager"
echo "================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    echo "   Visita: https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "✅ Node.js y npm están instalados"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "⚙️  Creando archivo de configuración..."
    cp env.example .env
    echo "📝 Archivo .env creado. Por favor configura tus credenciales de Kommo."
    echo ""
fi

# Crear directorio de logs si no existe
if [ ! -d "logs" ]; then
    echo "📁 Creando directorio de logs..."
    mkdir logs
fi

echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales de Kommo"
echo "2. Ejecuta: npm run dev"
echo "3. Ve a: http://localhost:3000"
echo "4. Configura tu integración con Kommo"
echo ""
echo "📖 Para más información, lee SETUP.md"
echo ""
echo "¡Listo para empezar! 🚀"
