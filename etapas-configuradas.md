# 🎯 Configuración de Etapas - Saberi Cursos

## 📋 **Primeras 3 Frases con Movimiento Secuencial:**

### 1️⃣ **HIGIENISTA DENTAL**
- **Palabra clave**: `higienista dental`
- **Etapa ID**: `94705068` (Primera etapa)
- **Mensaje**: "¡Hola! Quiero más información sobre el curso de higienista dental"

### 2️⃣ **FARMACIA**
- **Palabra clave**: `farmacia`
- **Etapa ID**: `94705072` (Segunda etapa)
- **Mensaje**: "¡Hola! Quiero más información sobre el curso de farmacia"

### 3️⃣ **INYECTOLOGIA**
- **Palabra clave**: `inyectologia`
- **Etapa ID**: `94705076` (Tercera etapa)
- **Mensaje**: "¡Hola! Quiero más información sobre el curso de inyectologia"

## 🔄 **Funcionamiento:**

1. **Lead llega** → Sistema analiza el texto
2. **Detecta frase** → Busca coincidencias con las palabras clave
3. **Mueve a etapa** → Mueve el lead a la etapa correspondiente
4. **Registra log** → Guarda la información del procesamiento

## 📊 **Resto de Frases:**
- **Etapa por defecto**: `94705068` (Primera etapa)
- **Embudo ID**: `10826340`
- **Total de frases**: 36 configuradas

## 🚀 **Estado del Sistema:**
- ✅ Detección de frases funcionando
- ✅ Movimiento a etapas implementado
- ✅ Logging completo
- ✅ API endpoints operativos

## 🧪 **Para Probar:**
```bash
# Probar detección de frase
curl -X POST http://localhost:3000/api/test-phrase \
  -H "Content-Type: application/json" \
  -d '{"text": "quiero información sobre el curso de higienista dental"}'
```

**Resultado esperado:**
- Lead se mueve a etapa `94705068`
- Log registra el movimiento
- Respuesta confirma el procesamiento
