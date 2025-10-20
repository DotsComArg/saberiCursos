const express = require('express');
const router = express.Router();
const path = require('path');

// Servir la interfaz de configuración
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saberi Cursos - Lead Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .tabs {
            display: flex;
            border-bottom: 2px solid #f0f0f0;
            margin-bottom: 30px;
        }
        
        .tab {
            padding: 15px 25px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1rem;
            color: #666;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
        }
        
        .card h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-danger {
            background: #dc3545;
        }
        
        .btn-success {
            background: #28a745;
        }
        
        .status {
            padding: 10px 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status.warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        .table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }
        
        .table tr:hover {
            background: #f8f9fa;
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .badge.active {
            background: #d4edda;
            color: #155724;
        }
        
        .badge.inactive {
            background: #f8d7da;
            color: #721c24;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .hidden {
            display: none;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .tabs {
                flex-wrap: wrap;
            }
            
            .tab {
                padding: 10px 15px;
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Saberi Cursos</h1>
            <p>Lead Manager - Gestión Inteligente de Leads</p>
        </div>
        
        <div class="content">
            <div class="tabs">
                <button class="tab active" onclick="showTab('kommo')">🔗 Kommo</button>
                <button class="tab" onclick="showTab('phrases')">📝 Frases</button>
                <button class="tab" onclick="showTab('funnels')">🎯 Embudos</button>
                <button class="tab" onclick="showTab('logs')">📊 Logs</button>
            </div>
            
            <!-- Tab Kommo -->
            <div id="kommo" class="tab-content active">
                <div class="card">
                    <h3>Configuración de Kommo</h3>
                    <div id="kommo-status" class="status warning">
                        Verificando conexión...
                    </div>
                    <div class="form-group">
                        <label>Estado de Conexión:</label>
                        <div id="connection-info">Cargando...</div>
                    </div>
                    <button class="btn" onclick="checkKommoStatus()">🔄 Verificar Estado</button>
                    <button class="btn btn-secondary" onclick="authorizeKommo()">🔑 Autorizar Kommo</button>
                </div>
                
                <div class="card">
                    <h3>Configuración de Webhook</h3>
                    <div class="form-group">
                        <label>URL del Webhook:</label>
                        <input type="text" id="webhook-url" placeholder="https://tu-dominio.com/webhook/kommo" readonly>
                    </div>
                    <div class="form-group">
                        <label>Eventos a Escuchar:</label>
                        <select id="webhook-events" multiple>
                            <option value="lead_add" selected>Nuevo Lead</option>
                            <option value="lead_update" selected>Lead Actualizado</option>
                            <option value="contact_add">Nuevo Contacto</option>
                            <option value="contact_update">Contacto Actualizado</option>
                        </select>
                    </div>
                    <button class="btn" onclick="configureWebhook()">⚙️ Configurar Webhook</button>
                </div>
            </div>
            
            <!-- Tab Frases -->
            <div id="phrases" class="tab-content">
                <div class="card">
                    <h3>Agregar Nueva Frase</h3>
                    <div class="form-group">
                        <label>Frase a Detectar:</label>
                        <input type="text" id="new-phrase" placeholder="Ej: curso de marketing digital">
                    </div>
                    <div class="form-group">
                        <label>Embudo de Destino:</label>
                        <select id="phrase-funnel">
                            <option value="">Seleccionar embudo...</option>
                        </select>
                    </div>
                    <button class="btn" onclick="addPhrase()">➕ Agregar Frase</button>
                </div>
                
                <div class="card">
                    <h3>Frases Configuradas</h3>
                    <div id="phrases-list" class="loading">Cargando frases...</div>
                </div>
            </div>
            
            <!-- Tab Embudos -->
            <div id="funnels" class="tab-content">
                <div class="card">
                    <h3>Crear Nuevo Embudo</h3>
                    <div class="form-group">
                        <label>Nombre del Embudo:</label>
                        <input type="text" id="funnel-name" placeholder="Ej: Embudo Marketing Digital">
                    </div>
                    <div class="form-group">
                        <label>URL del Webhook:</label>
                        <input type="url" id="funnel-webhook" placeholder="https://tu-embudo.com/webhook">
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea id="funnel-description" rows="3" placeholder="Descripción del embudo..."></textarea>
                    </div>
                    <button class="btn" onclick="createFunnel()">🎯 Crear Embudo</button>
                </div>
                
                <div class="card">
                    <h3>Embudos Configurados</h3>
                    <div id="funnels-list" class="loading">Cargando embudos...</div>
                </div>
            </div>
            
            <!-- Tab Logs -->
            <div id="logs" class="tab-content">
                <div class="card">
                    <h3>Logs de Procesamiento</h3>
                    <div class="form-group">
                        <label>Filtrar por Estado:</label>
                        <select id="log-status" onchange="loadLogs()">
                            <option value="">Todos</option>
                            <option value="success">Exitosos</option>
                            <option value="error">Con Error</option>
                            <option value="no_match">Sin Coincidencia</option>
                        </select>
                    </div>
                    <div id="logs-list" class="loading">Cargando logs...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Variables globales
        let currentTab = 'kommo';
        
        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            loadInitialData();
        });
        
        // Funciones de tabs
        function showTab(tabName) {
            // Ocultar todos los tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar tab seleccionado
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            currentTab = tabName;
            
            // Cargar datos específicos del tab
            switch(tabName) {
                case 'kommo':
                    checkKommoStatus();
                    break;
                case 'phrases':
                    loadPhrases();
                    loadFunnelsForPhrases();
                    break;
                case 'funnels':
                    loadFunnels();
                    break;
                case 'logs':
                    loadLogs();
                    break;
            }
        }
        
        // Funciones de Kommo
        async function checkKommoStatus() {
            try {
                const response = await fetch('/api/kommo/status');
                const data = await response.json();
                
                const statusDiv = document.getElementById('kommo-status');
                const infoDiv = document.getElementById('connection-info');
                
                if (data.connected) {
                    statusDiv.className = 'status success';
                    statusDiv.textContent = '✅ Conectado a Kommo';
                    infoDiv.innerHTML = \`
                        <strong>Estado:</strong> Conectado<br>
                        <strong>Expira:</strong> \${new Date(data.expiresAt).toLocaleString()}
                    \`;
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.textContent = '❌ No conectado a Kommo';
                    infoDiv.innerHTML = \`
                        <strong>Estado:</strong> \${data.message}<br>
                        <strong>Acción:</strong> Hacer clic en "Autorizar Kommo"
                    \`;
                }
            } catch (error) {
                console.error('Error verificando estado:', error);
                document.getElementById('kommo-status').className = 'status error';
                document.getElementById('kommo-status').textContent = '❌ Error verificando conexión';
            }
        }
        
        function authorizeKommo() {
            window.open('/api/kommo/auth-url', '_blank');
        }
        
        async function configureWebhook() {
            const webhookUrl = document.getElementById('webhook-url').value;
            const events = Array.from(document.getElementById('webhook-events').selectedOptions)
                .map(option => option.value);
            
            try {
                const response = await fetch('/api/kommo/webhook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        webhookUrl: webhookUrl,
                        events: events
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Webhook configurado correctamente', 'success');
                } else {
                    showMessage('Error configurando webhook: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error configurando webhook', 'error');
            }
        }
        
        // Funciones de Frases
        async function loadPhrases() {
            try {
                const response = await fetch('/api/phrases');
                const phrases = await response.json();
                
                const container = document.getElementById('phrases-list');
                
                if (phrases.length === 0) {
                    container.innerHTML = '<p>No hay frases configuradas</p>';
                    return;
                }
                
                container.innerHTML = \`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Frase</th>
                                <th>Embudo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${phrases.map(phrase => \`
                                <tr>
                                    <td>\${phrase.phrase}</td>
                                    <td>\${phrase.funnel_name || 'Sin asignar'}</td>
                                    <td>
                                        <span class="badge \${phrase.is_active ? 'active' : 'inactive'}">
                                            \${phrase.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="togglePhrase(\${phrase.id})">
                                            \${phrase.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button class="btn btn-danger" onclick="deletePhrase(\${phrase.id})">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } catch (error) {
                document.getElementById('phrases-list').innerHTML = 
                    '<p class="status error">Error cargando frases</p>';
            }
        }
        
        async function loadFunnelsForPhrases() {
            try {
                const response = await fetch('/api/funnels');
                const funnels = await response.json();
                
                const select = document.getElementById('phrase-funnel');
                select.innerHTML = '<option value="">Seleccionar embudo...</option>' +
                    funnels.map(funnel => 
                        \`<option value="\${funnel.id}">\${funnel.name}</option>\`
                    ).join('');
            } catch (error) {
                console.error('Error cargando embudos:', error);
            }
        }
        
        async function addPhrase() {
            const phrase = document.getElementById('new-phrase').value.trim();
            const funnelId = document.getElementById('phrase-funnel').value;
            
            if (!phrase) {
                showMessage('Por favor ingresa una frase', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/phrases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phrase: phrase,
                        funnel_id: funnelId || null
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Frase agregada correctamente', 'success');
                    document.getElementById('new-phrase').value = '';
                    document.getElementById('phrase-funnel').value = '';
                    loadPhrases();
                } else {
                    showMessage('Error agregando frase: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error agregando frase', 'error');
            }
        }
        
        async function togglePhrase(id) {
            try {
                const response = await fetch(\`/api/phrases/\${id}/toggle\`, {
                    method: 'PATCH'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage(data.message, 'success');
                    loadPhrases();
                } else {
                    showMessage('Error cambiando estado', 'error');
                }
            } catch (error) {
                showMessage('Error cambiando estado', 'error');
            }
        }
        
        async function deletePhrase(id) {
            if (!confirm('¿Estás seguro de que quieres eliminar esta frase?')) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/phrases/\${id}\`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Frase eliminada correctamente', 'success');
                    loadPhrases();
                } else {
                    showMessage('Error eliminando frase', 'error');
                }
            } catch (error) {
                showMessage('Error eliminando frase', 'error');
            }
        }
        
        // Funciones de Embudos
        async function loadFunnels() {
            try {
                const response = await fetch('/api/funnels');
                const funnels = await response.json();
                
                const container = document.getElementById('funnels-list');
                
                if (funnels.length === 0) {
                    container.innerHTML = '<p>No hay embudos configurados</p>';
                    return;
                }
                
                container.innerHTML = \`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Webhook URL</th>
                                <th>Frases</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${funnels.map(funnel => \`
                                <tr>
                                    <td>\${funnel.name}</td>
                                    <td>\${funnel.webhook_url}</td>
                                    <td>\${funnel.phrase_count}</td>
                                    <td>
                                        <span class="badge \${funnel.is_active ? 'active' : 'inactive'}">
                                            \${funnel.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-success" onclick="testFunnel(\${funnel.id})">
                                            Probar
                                        </button>
                                        <button class="btn btn-secondary" onclick="toggleFunnel(\${funnel.id})">
                                            \${funnel.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button class="btn btn-danger" onclick="deleteFunnel(\${funnel.id})">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } catch (error) {
                document.getElementById('funnels-list').innerHTML = 
                    '<p class="status error">Error cargando embudos</p>';
            }
        }
        
        async function createFunnel() {
            const name = document.getElementById('funnel-name').value.trim();
            const webhookUrl = document.getElementById('funnel-webhook').value.trim();
            const description = document.getElementById('funnel-description').value.trim();
            
            if (!name || !webhookUrl) {
                showMessage('Por favor completa todos los campos requeridos', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/funnels', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        webhook_url: webhookUrl,
                        description: description
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Embudo creado correctamente', 'success');
                    document.getElementById('funnel-name').value = '';
                    document.getElementById('funnel-webhook').value = '';
                    document.getElementById('funnel-description').value = '';
                    loadFunnels();
                } else {
                    showMessage('Error creando embudo: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error creando embudo', 'error');
            }
        }
        
        async function testFunnel(id) {
            try {
                const response = await fetch(\`/api/funnels/\${id}/test\`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Webhook probado exitosamente', 'success');
                } else {
                    showMessage('Error probando webhook: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error probando webhook', 'error');
            }
        }
        
        async function toggleFunnel(id) {
            try {
                const response = await fetch(\`/api/funnels/\${id}/toggle\`, {
                    method: 'PATCH'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage(data.message, 'success');
                    loadFunnels();
                } else {
                    showMessage('Error cambiando estado', 'error');
                }
            } catch (error) {
                showMessage('Error cambiando estado', 'error');
            }
        }
        
        async function deleteFunnel(id) {
            if (!confirm('¿Estás seguro de que quieres eliminar este embudo?')) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/funnels/\${id}\`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Embudo eliminado correctamente', 'success');
                    loadFunnels();
                } else {
                    showMessage('Error eliminando embudo: ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('Error eliminando embudo', 'error');
            }
        }
        
        // Funciones de Logs
        async function loadLogs() {
            const status = document.getElementById('log-status').value;
            
            try {
                const url = status ? \`/webhook/logs?status=\${status}\` : '/webhook/logs';
                const response = await fetch(url);
                const data = await response.json();
                
                const container = document.getElementById('logs-list');
                
                if (data.logs.length === 0) {
                    container.innerHTML = '<p>No hay logs disponibles</p>';
                    return;
                }
                
                container.innerHTML = \`
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Lead ID</th>
                                <th>Frase</th>
                                <th>Embudo</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${data.logs.map(log => \`
                                <tr>
                                    <td>\${log.kommo_lead_id}</td>
                                    <td>\${log.phrase_matched || '-'}</td>
                                    <td>\${log.funnel_name || '-'}</td>
                                    <td>
                                        <span class="badge \${log.status === 'success' ? 'active' : 'inactive'}">
                                            \${log.status}
                                        </span>
                                    </td>
                                    <td>\${new Date(log.processed_at).toLocaleString()}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } catch (error) {
                document.getElementById('logs-list').innerHTML = 
                    '<p class="status error">Error cargando logs</p>';
            }
        }
        
        // Funciones auxiliares
        function showMessage(message, type) {
            const statusDiv = document.createElement('div');
            statusDiv.className = \`status \${type}\`;
            statusDiv.textContent = message;
            
            const content = document.querySelector('.content');
            content.insertBefore(statusDiv, content.firstChild);
            
            setTimeout(() => {
                statusDiv.remove();
            }, 5000);
        }
        
        async function loadInitialData() {
            // Configurar URL del webhook
            const webhookUrl = window.location.origin + '/webhook/kommo';
            document.getElementById('webhook-url').value = webhookUrl;
            
            // Cargar datos iniciales
            checkKommoStatus();
        }
    </script>
</body>
</html>
  `);
});

module.exports = router;
