// Sistema de Inventario - Adimentos para Eventos
// Versión 2.0 - Interfaz Mejorada
// Autor: Didier

class InventorySystem {
    constructor() {
        this.currentUser = null;
        this.data = {
            items: [],
            proformas: [],
            movements: [],
            audit: [],
            settings: {
                password: 'admin123',
                categories: ['Sillas', 'Mesas', 'Manteles', 'Accesorios', 'Decoración', 'Arreglos']
            }
        };
        
        this.init();
    }

    init() {
        console.log('Inicializando sistema...');
        // Limpiar datos antiguos para forzar recarga
        localStorage.removeItem('inventory_data');
        this.loadData();
        this.setupEventListeners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        // Verificar si hay sesión activa
        if (localStorage.getItem('inventory_session')) {
            this.currentUser = 'admin';
            this.showMainScreen();
        } else {
            this.showLoginScreen();
        }
    }

    // ==================== AUTENTICACIÓN ====================
    
    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Botones principales
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) addItemBtn.addEventListener('click', () => this.showAddItemModal());
        const addProformaBtn = document.getElementById('addProformaBtn');
        if (addProformaBtn) addProformaBtn.addEventListener('click', () => this.showAddProformaModal());
        const addMovementBtn = document.getElementById('addMovementBtn');
        if (addMovementBtn) addMovementBtn.addEventListener('click', () => this.showAddMovementModal());
        const addProformaMovementBtn = document.getElementById('addProformaMovementBtn');
        if (addProformaMovementBtn) addProformaMovementBtn.addEventListener('click', () => this.showProformaMovementModal());
        const viewRecepcionesBtn = document.getElementById('viewRecepcionesBtn');
        if (viewRecepcionesBtn) viewRecepcionesBtn.addEventListener('click', () => this.showRecepcionesModal());

        // Filtros
        document.getElementById('searchItems').addEventListener('input', () => this.filterInventory());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterInventory());
        document.getElementById('searchProformas').addEventListener('input', () => this.filterProformas());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterProformas());
        document.getElementById('dateFromFilter').addEventListener('change', () => this.filterProformas());
        document.getElementById('dateToFilter').addEventListener('change', () => this.filterProformas());
        const movementTypeFilter = document.getElementById('movementTypeFilter');
        if (movementTypeFilter) movementTypeFilter.addEventListener('change', () => this.filterMovements());
        const movementDateFrom = document.getElementById('movementDateFrom');
        if (movementDateFrom) movementDateFrom.addEventListener('change', () => this.filterMovements());
        const movementDateTo = document.getElementById('movementDateTo');
        if (movementDateTo) movementDateTo.addEventListener('change', () => this.filterMovements());

        // Exportación
        document.getElementById('exportInventoryCSV').addEventListener('click', () => this.exportInventory('csv'));
        document.getElementById('exportInventoryJSON').addEventListener('click', () => this.exportInventory('json'));
        document.getElementById('exportProformasCSV').addEventListener('click', () => this.exportProformas('csv'));
        document.getElementById('exportProformasJSON').addEventListener('click', () => this.exportProformas('json'));
        document.getElementById('backupData').addEventListener('click', () => this.backupData());

        // Configuración
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.closeModal();
            }
        });
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        if (password === this.data.settings.password) {
            this.currentUser = 'admin';
            localStorage.setItem('inventory_session', 'active');
            this.showMainScreen();
            this.logAudit('login', 'Inicio de sesión exitoso');
        } else {
            errorDiv.textContent = 'Contraseña incorrecta';
            errorDiv.style.display = 'block';
            this.logAudit('login_failed', 'Intento de inicio de sesión fallido');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('inventory_session');
        this.showLoginScreen();
        this.logAudit('logout', 'Cierre de sesión');
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainScreen').classList.add('hidden');
        document.getElementById('password').value = '';
        document.getElementById('loginError').style.display = 'none';
    }

    showMainScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainScreen').classList.remove('hidden');
        this.showSection('dashboard');
        this.loadDashboard();
    }

    showSection(sectionName) {
        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Mostrar sección
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Cargar datos específicos de la sección
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'proformas':
                this.loadProformas();
                break;
            case 'movements':
                this.loadMovements();
                break;
        }
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        };
        document.getElementById('currentDateTime').textContent = now.toLocaleString('es-ES', options);
    }

    // Función helper para formatear fechas con horas exactas
    formatDateTimeExact(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return date.toLocaleString('es-ES', options);
    }

    // Función helper para formatear solo fecha con hora
    formatDateWithTime(dateString) {
        const date = new Date(dateString);
        const dateOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return {
            date: date.toLocaleDateString('es-ES', dateOptions),
            time: date.toLocaleTimeString('es-ES', timeOptions)
        };
    }

    // ==================== GESTIÓN DE DATOS ====================
    
    loadData() {
        const savedData = localStorage.getItem('inventory_data');
        if (savedData) {
            this.data = { ...this.data, ...JSON.parse(savedData) };
        } else {
            // Cargar datos de ejemplo si no hay datos guardados
            this.loadSampleData();
        }
        this.populateCategoryFilter();
    }

    reloadData() {
        // Forzar recarga de datos
        this.loadSampleData();
        this.populateCategoryFilter();
    }

    loadSampleData() {
        this.data.items = [
            {
                id: 'item_001',
                codigo: 'SILL-001',
                nombre: 'Silla plegable plástico blanca',
                categoria: 'Sillas',
                descripcion: 'Silla plegable de plástico blanco, resistente y fácil de transportar',
                cantidad_total: 100,
                comprometido: 20,
                unidad: 'unidad',
                costo_unitario: 2.50,
                ubicacion: 'Almacén A - Estante 1',
                arreglos: [
                    { tipo: 'Limpieza', precio: 0.50, descripcion: 'Limpieza profunda' },
                    { tipo: 'Manta decorativa', precio: 2.00, descripcion: 'Manta elegante para silla' },
                    { tipo: 'Reparación', precio: 1.00, descripcion: 'Reparación de patas' }
                ],
                created_at: '2024-12-01T08:00:00.000Z',
                updated_at: '2024-12-15T14:30:00.000Z'
            },
            {
                id: 'item_002',
                codigo: 'MESA-001',
                nombre: 'Mesa redonda 1.20m',
                categoria: 'Mesas',
                descripcion: 'Mesa redonda de 1.20m de diámetro, plegable',
                cantidad_total: 50,
                comprometido: 10,
                unidad: 'unidad',
                costo_unitario: 15.00,
                ubicacion: 'Almacén A - Estante 2',
                arreglos: [
                    { tipo: 'Limpieza', precio: 2.00, descripcion: 'Limpieza y desinfección' },
                    { tipo: 'Mantel premium', precio: 5.00, descripcion: 'Mantel de tela elegante' },
                    { tipo: 'Pulido', precio: 3.00, descripcion: 'Pulido de superficie' }
                ],
                created_at: '2024-12-01T08:15:00.000Z',
                updated_at: '2024-12-15T14:30:00.000Z'
            },
            {
                id: 'item_003',
                codigo: 'MANT-001',
                nombre: 'Mantel blanco 1.20m',
                categoria: 'Manteles',
                descripcion: 'Mantel blanco de tela para mesa de 1.20m',
                cantidad_total: 200,
                comprometido: 40,
                unidad: 'unidad',
                costo_unitario: 3.00,
                ubicacion: 'Almacén B - Estante 1',
                arreglos: [
                    { tipo: 'Lavado', precio: 1.00, descripcion: 'Lavado y planchado' },
                    { tipo: 'Reparación', precio: 2.00, descripcion: 'Reparación de bordes' }
                ],
                created_at: '2024-12-01T08:30:00.000Z',
                updated_at: '2024-12-15T14:30:00.000Z'
            },
            {
                id: 'item_004',
                codigo: 'DECO-001',
                nombre: 'Centro de mesa artificial',
                categoria: 'Decoración',
                descripcion: 'Centro de mesa con flores artificiales',
                cantidad_total: 30,
                comprometido: 5,
                unidad: 'unidad',
                costo_unitario: 8.00,
                ubicacion: 'Almacén B - Estante 2',
                arreglos: [
                    { tipo: 'Limpieza', precio: 1.50, descripcion: 'Limpieza de flores' },
                    { tipo: 'Restauración', precio: 3.00, descripcion: 'Restauración de colores' }
                ],
                created_at: '2024-12-01T08:45:00.000Z',
                updated_at: '2024-12-15T14:30:00.000Z'
            },
            {
                id: 'item_005',
                codigo: 'SILL-002',
                nombre: 'Silla plegable metal dorada',
                categoria: 'Sillas',
                descripcion: 'Silla plegable de metal con acabado dorado',
                cantidad_total: 80,
                comprometido: 15,
                unidad: 'unidad',
                costo_unitario: 4.50,
                ubicacion: 'Almacén A - Estante 3',
                arreglos: [
                    { tipo: 'Limpieza', precio: 0.75, descripcion: 'Limpieza de metal' },
                    { tipo: 'Pulido', precio: 1.50, descripcion: 'Pulido de acabado dorado' }
                ],
                created_at: '2024-12-01T09:00:00.000Z',
                updated_at: '2024-12-15T14:30:00.000Z'
            }
        ];

        this.data.proformas = [
            {
                id: 'proforma_001',
                numero: 'PF-20241219-001',
                cliente: {
                    nombre: 'María González',
                    telefono: '555-0123',
                    direccion: 'Av. Principal 123, Ciudad'
                },
                items: [
                    {
                        item_id: 'item_001',
                        nombre: 'Silla plegable plástico blanca',
                        cantidad: 20,
                        precio_unit: 3.00,
                        subtotal: 60.00,
                        arreglos: [
                            { tipo: 'Limpieza', precio: 0.50, cantidad: 20, subtotal: 10.00 }
                        ]
                    },
                    {
                        item_id: 'item_002',
                        nombre: 'Mesa redonda 1.20m',
                        cantidad: 10,
                        precio_unit: 18.00,
                        subtotal: 180.00,
                        arreglos: [
                            { tipo: 'Limpieza', precio: 2.00, cantidad: 10, subtotal: 20.00 }
                        ]
                    }
                ],
                subtotal: 240.00,
                costo_montaje: 50.00,
                costo_transporte: 30.00,
                costo_arreglos: 30.00,
                impuestos: 0.00,
                total: 350.00,
                pagos: [
                    {
                        fecha: '2024-12-19T10:00:00.000Z',
                        monto: 175.00,
                        metodo: 'efectivo'
                    }
                ],
                estado_retiro: false,
                estado_cancelado: false,
                estado_compuesto: 'Sin retirar y no cancelado',
                fecha_creacion: '2024-12-19T10:00:00.000Z',
                fecha_retiro: null,
                fecha_cancelacion: null,
                notas: 'Evento de boda - 15 de enero 2025'
            }
        ];

        this.data.movements = [
            {
                id: 'mov_001',
                item_id: 'item_001',
                tipo: 'entrada',
                cantidad: 100,
                fecha: '2024-12-01',
                motivo: 'Stock inicial',
                nota: 'Compra inicial de sillas'
            },
            {
                id: 'mov_002',
                item_id: 'item_002',
                tipo: 'entrada',
                cantidad: 50,
                fecha: '2024-12-01',
                motivo: 'Stock inicial',
                nota: 'Compra inicial de mesas'
            }
        ];

        this.data.audit = [
            {
                id: 'audit_001',
                action: 'create_item',
                user: 'admin',
                fecha: '2024-12-01T08:00:00.000Z',
                detalle: 'Creó ítem: Silla plegable plástico blanca (SILL-001)'
            }
        ];
    }

    saveData() {
        localStorage.setItem('inventory_data', JSON.stringify(this.data));
    }

    logAudit(action, detail) {
        const auditEntry = {
            id: this.generateId(),
            action: action,
            user: this.currentUser || 'system',
            fecha: new Date().toISOString(),
            detalle: detail
        };
        this.data.audit.push(auditEntry);
        this.saveData();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ==================== DASHBOARD ====================
    
    loadDashboard() {
        this.updateKPIs();
        this.loadRecentProformas();
        this.renderDashboardCharts && this.renderDashboardCharts();
    }

    updateKPIs() {
        const totalItems = this.data.items.reduce((sum, item) => sum + item.cantidad_total, 0);
        const committedItems = this.data.items.reduce((sum, item) => sum + (item.comprometido || 0), 0);
        const pendingProformas = this.data.proformas.filter(p => !p.estado_retiro && !p.estado_cancelado).length;
        const totalIncome = this.data.proformas.reduce((sum, p) => {
            return sum + (p.total || 0);
        }, 0);

        document.getElementById('totalItems').textContent = totalItems.toLocaleString();
        document.getElementById('committedItems').textContent = committedItems.toLocaleString();
        document.getElementById('pendingProformas').textContent = pendingProformas;
        document.getElementById('totalIncome').textContent = `$${totalIncome.toLocaleString()}`;
    }

    // Estados unificados segun retiro, recepción (cumplido) y pago
    getEstadoCompuestoUnificado(proforma) {
        if (proforma.fecha_cumplimiento) {
            const pagadoCumplido = (proforma.pagos || []).reduce((s, p) => s + (p.monto || 0), 0) >= (proforma.total || 0);
            return pagadoCumplido ? 'Cumplido' : 'Cumplido, falta de pago';
        }
        const pagado = (proforma.pagos || []).reduce((s, p) => s + (p.monto || 0), 0) >= (proforma.total || 0);
        const retirado = !!proforma.estado_retiro;
        if (!retirado && !pagado) return 'Pendiente a retiro y pago';
        if (!retirado && pagado) return 'Pendiente a retirar, pagado';
        if (retirado && !pagado) return 'Retirado, pendiente a pagar';
        return 'Retirado y pagado';
    }

    updateProformaEstadoCompuesto(proforma) {
        proforma.estado_compuesto = this.getEstadoCompuestoUnificado(proforma);
        this.saveData();
        this.loadProformas();
    }

    renderDashboardCharts() {
        if (!window.Chart) return;

        // Top ítems solicitados (por comprometido)
        const itemsSorted = [...this.data.items]
            .sort((a, b) => (b.comprometido || 0) - (a.comprometido || 0))
            .slice(0, 5);
        const topLabels = itemsSorted.map(i => i.codigo || i.nombre);
        const topData = itemsSorted.map(i => i.comprometido || 0);

        const ctxTop = document.getElementById('chartTopItems');
        if (ctxTop) {
            if (this._chartTop) this._chartTop.destroy();
            this._chartTop = new Chart(ctxTop, {
                type: 'bar',
                data: { labels: topLabels, datasets: [{ label: 'Comprometidos', data: topData, backgroundColor: '#6366f1' }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }

        // Ocupado vs Disponible
        const totalComprometido = this.data.items.reduce((s, i) => s + (i.comprometido || 0), 0);
        const totalDisponible = this.data.items.reduce((s, i) => s + Math.max((i.cantidad_total || 0) - (i.comprometido || 0), 0), 0);
        const ctxPie = document.getElementById('chartOcupado');
        if (ctxPie) {
            if (this._chartPie) this._chartPie.destroy();
            this._chartPie = new Chart(ctxPie, {
                type: 'doughnut',
                data: { labels: ['Ocupado', 'Disponible'], datasets: [{ data: [totalComprometido, totalDisponible], backgroundColor: ['#f59e0b', '#10b981'] }] },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
            });
        }

        // Tendencia de movimientos por mes (últimos 6 meses)
        const byMonth = {};
        const movements = this.data.movements || [];
        movements.forEach(m => {
            const d = new Date(m.fecha);
            if (isNaN(d)) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] || 0) + Math.abs(Number(m.cantidad) || 0);
        });
        const months = Object.keys(byMonth).sort().slice(-6);
        const ctxLine = document.getElementById('chartMovimientos');
        if (ctxLine) {
            if (this._chartLine) this._chartLine.destroy();
            this._chartLine = new Chart(ctxLine, {
                type: 'line',
                data: { labels: months, datasets: [{ label: 'Movimientos', data: months.map(m => byMonth[m] || 0), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,.15)', tension: .25, fill: true }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
    }

    loadRecentProformas() {
        const tbody = document.querySelector('#recentProformasTable tbody');
        tbody.innerHTML = '';

        const recentProformas = this.data.proformas
            .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
            .slice(0, 10);

        recentProformas.forEach(proforma => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${proforma.numero}</td>
                <td>${proforma.cliente.nombre}</td>
                <td>$${proforma.total.toLocaleString()}</td>
                <td><span class="status-badge status-${proforma.estado_compuesto.replace(/\s+/g, '-').toLowerCase()}">${proforma.estado_compuesto}</span></td>
                <td>
                    <div style="font-weight: 600;">${this.formatDateWithTime(proforma.fecha_creacion).date}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-500);">${this.formatDateWithTime(proforma.fecha_creacion).time}</div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-icon" onclick="inventorySystem.viewProforma('${proforma.id}')" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" onclick="inventorySystem.printProforma('${proforma.id}')" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    registrarSalidaProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        if (proforma.estado_retiro) {
            this.showNotification('La proforma ya fue marcada como retirada.', 'warning');
            return;
        }

        const nowIso = new Date().toISOString();
        const movimientosSalida = [];

        proforma.items.forEach(pi => {
            const movimiento = {
                id: this.generateId(),
                item_id: pi.item_id,
                tipo: 'salida',
                cantidad: pi.cantidad,
                fecha: nowIso,
                motivo: `Proforma #${proforma.numero}`,
                nota: 'Entrega al cliente'
            };
            movimientosSalida.push(movimiento);

            const item = this.data.items.find(i => i.id === pi.item_id);
            if (item) {
                // Si había stock comprometido, lo liberamos y consumimos salida lógica
                const comprometidoActual = Number(item.comprometido || 0);
                item.comprometido = Math.max(comprometidoActual - Number(pi.cantidad || 0), 0);
                // Nota: no alteramos cantidad_total aquí; se asume inventario circulante
                item.updated_at = nowIso;
            }
        });

        this.data.movements.push(...movimientosSalida);

        proforma.estado_retiro = true;
        if (!proforma.estado_cancelado) {
            proforma.estado_compuesto = 'Retirado y no cancelado';
        } else {
            proforma.estado_compuesto = 'Retirado y cancelado';
        }
        proforma.fecha_retiro = nowIso;

        this.saveData();
        this.loadProformas();
        this.loadInventory && this.loadInventory();
        this.loadMovements && this.loadMovements();
        this.updateKPIs();
        this.renderDashboardCharts && this.renderDashboardCharts();

        this.showNotification('Salida registrada correctamente.', 'success');
        // Refrescar la vista de proforma para mostrar nuevos botones/estado
        this.viewProforma(proformaId);
    }

    showSalidaModal(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        const html = `
            <form id="salidaForm" class="form-compact">
                <div class="form-section">
                    <div class="form-section-title"><i class="fas fa-truck"></i> Confirmar Salida</div>
                    <div id="salidaItems">
                        ${proforma.items.map(it => `
                            <div class="proforma-movement-item" style="display:flex; gap:.5rem; align-items:center; padding:.75rem; border:1px solid var(--gray-200); border-radius: var(--radius); margin-bottom:.5rem;">
                                <div style="flex:2; font-weight:600;">${it.nombre}</div>
                                <div style="flex:1;">Solicitado: <strong>${it.cantidad}</strong></div>
                                <div style="flex:1;">
                                    <label class="form-label" style="margin:0; font-size:.75rem;">Entregado</label>
                                    <input type="number" class="form-input" min="0" max="${it.cantidad}" value="${it.cantidad}" data-item-id="${it.item_id}" />
                                </div>
                                <div style="flex:2;">
                                    <input type="text" class="form-input" placeholder="Observaciones (opcional)" data-item-id="${it.item_id}-obs" />
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-warning"><i class="fas fa-truck"></i> Confirmar Salida</button>
                </div>
            </form>
        `;
        this.showModal(`Salida de ${proforma.numero}`, html, '');
        document.getElementById('salidaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmarSalida(proformaId);
        });
    }

    confirmarSalida(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        const nowIso = new Date().toISOString();
        const movimientosSalida = [];
        const inputs = Array.from(document.querySelectorAll('#salidaItems input[type="number"]'));

        inputs.forEach(input => {
            const itemId = input.getAttribute('data-item-id');
            const entregado = Math.max(0, Number(input.value || 0));
            if (entregado <= 0) return;
            const obs = (document.querySelector(`#salidaItems input[data-item-id="${itemId}-obs"]`)?.value || '').trim();
            const proformaItem = proforma.items.find(i => i.item_id === itemId);
            movimientosSalida.push({
                id: this.generateId(),
                item_id: itemId,
                tipo: 'salida',
                cantidad: entregado,
                fecha: nowIso,
                motivo: `Proforma #${proforma.numero}`,
                nota: obs || 'Entrega al cliente'
            });

            const item = this.data.items.find(i => i.id === itemId);
            if (item) {
                const comprometidoActual = Number(item.comprometido || 0);
                item.comprometido = Math.max(comprometidoActual - entregado, 0);
                item.updated_at = nowIso;
            }
            if (proformaItem) {
                proformaItem.entregado = (proformaItem.entregado || 0) + entregado;
            }
        });

        if (movimientosSalida.length === 0) {
            this.showNotification('Debes ingresar al menos una cantidad entregada.', 'warning');
            return;
        }

        this.data.movements.push(...movimientosSalida);

        // Estado compuesto unificado (ver más abajo cálculo final)
        proforma.estado_retiro = true;
        proforma.fecha_retiro = nowIso;

        this.saveData();
        this.closeModal();
        this.loadProformas();
        this.loadInventory && this.loadInventory();
        this.loadMovements && this.loadMovements();
        this.updateProformaEstadoCompuesto(proforma);
        this.updateKPIs();
        this.renderDashboardCharts && this.renderDashboardCharts();
        this.viewProforma(proformaId);
        this.showNotification('Salida confirmada.', 'success');
    }

    // ==================== GESTIÓN DE INVENTARIO ====================
    
    loadInventory() {
        const tbody = document.querySelector('#inventoryTable tbody');
        tbody.innerHTML = '';

        this.data.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>${item.cantidad_total}</td>
                <td>${item.comprometido || 0}</td>
                <td>${item.cantidad_total - (item.comprometido || 0)}</td>
                <td>${item.ubicacion}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-icon" onclick="inventorySystem.editItem('${item.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="inventorySystem.deleteItem('${item.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="">Todas las categorías</option>';
        
        this.data.settings.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    filterInventory() {
        const searchTerm = document.getElementById('searchItems').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const rows = document.querySelectorAll('#inventoryTable tbody tr');

        rows.forEach(row => {
            const nombre = row.cells[1].textContent.toLowerCase();
            const codigo = row.cells[0].textContent.toLowerCase();
            const categoria = row.cells[2].textContent;

            const matchesSearch = nombre.includes(searchTerm) || codigo.includes(searchTerm);
            const matchesCategory = !categoryFilter || categoria === categoryFilter;

            row.style.display = matchesSearch && matchesCategory ? '' : 'none';
        });
    }

    showAddItemModal() {
        this.showModal('Nuevo Ítem', this.getItemFormHTML());
        
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });
    }

    getItemFormHTML() {
        return `
            <form id="itemForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="itemCodigo" class="form-label">Código *</label>
                        <input type="text" id="itemCodigo" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="itemNombre" class="form-label">Nombre *</label>
                        <input type="text" id="itemNombre" class="form-input" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="itemCategoria" class="form-label">Categoría *</label>
                        <select id="itemCategoria" class="form-input" required>
                            <option value="">Seleccionar...</option>
                            ${this.data.settings.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="itemUnidad" class="form-label">Unidad *</label>
                        <input type="text" id="itemUnidad" class="form-input" value="unidad" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="itemDescripcion" class="form-label">Descripción</label>
                    <textarea id="itemDescripcion" class="form-input" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="itemCantidad" class="form-label">Cantidad Inicial *</label>
                        <input type="number" id="itemCantidad" class="form-input" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="itemCosto" class="form-label">Costo Unitario</label>
                        <input type="number" id="itemCosto" class="form-input" min="0" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label for="itemUbicacion" class="form-label">Ubicación *</label>
                    <input type="text" id="itemUbicacion" class="form-input" required>
                </div>
                
                <h4 style="margin: 1.5rem 0 1rem 0; color: var(--gray-700);">Arreglos Disponibles</h4>
                <div id="arreglosContainer">
                    <div class="arreglo-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;">
                        <input type="text" placeholder="Tipo de arreglo" class="form-input" style="flex: 1;">
                        <input type="number" placeholder="Precio" class="form-input" style="width: 120px;" step="0.01">
                        <input type="text" placeholder="Descripción" class="form-input" style="flex: 1;">
                        <button type="button" class="btn btn-danger btn-icon" onclick="this.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" onclick="addArregloRow()">
                    <i class="fas fa-plus"></i> Agregar Arreglo
                </button>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Guardar Ítem
                    </button>
                </div>
            </form>
        `;
    }

    saveItem() {
        const item = {
            id: this.generateId(),
            codigo: document.getElementById('itemCodigo').value,
            nombre: document.getElementById('itemNombre').value,
            categoria: document.getElementById('itemCategoria').value,
            descripcion: document.getElementById('itemDescripcion').value,
            cantidad_total: parseInt(document.getElementById('itemCantidad').value),
            comprometido: 0,
            unidad: document.getElementById('itemUnidad').value,
            costo_unitario: parseFloat(document.getElementById('itemCosto').value) || 0,
            ubicacion: document.getElementById('itemUbicacion').value,
            arreglos: this.getArreglosFromForm(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Validar que el código no exista
        if (this.data.items.find(i => i.codigo === item.codigo)) {
            alert('El código ya existe. Por favor, use un código diferente.');
            return;
        }

        this.data.items.push(item);
        this.saveData();
        this.logAudit('create_item', `Creó ítem: ${item.nombre} (${item.codigo})`);
        
        // Crear movimiento de entrada inicial
        this.createMovement(item.id, 'entrada', item.cantidad_total, 'Stock inicial');
        
        this.closeModal();
        this.loadInventory();
        this.updateKPIs();
        this.showNotification('Ítem creado exitosamente', 'success');
    }

    getArreglosFromForm() {
        const arreglos = [];
        document.querySelectorAll('.arreglo-row').forEach(row => {
            const tipo = row.children[0].value;
            const precio = parseFloat(row.children[1].value);
            const descripcion = row.children[2].value;
            
            if (tipo && precio && descripcion) {
                arreglos.push({
                    tipo: tipo,
                    precio: precio,
                    descripcion: descripcion
                });
            }
        });
        return arreglos;
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    createMovement(itemId, tipo, cantidad, motivo, nota = '') {
        const movement = {
            id: this.generateId(),
            item_id: itemId,
            tipo: tipo,
            cantidad: cantidad,
            fecha: new Date().toISOString().split('T')[0],
            motivo: motivo,
            nota: nota
        };

        this.data.movements.push(movement);
        this.saveData();
        this.logAudit('create_movement', `Creó movimiento: ${tipo} de ${cantidad} unidades - ${motivo}`);
    }

    loadMovements() {
        const tbody = document.querySelector('#movementsTable tbody');
        tbody.innerHTML = '';

        // Leer filtros
        const typeFilter = (document.getElementById('movementTypeFilter')?.value || '').toLowerCase();
        const dateFrom = document.getElementById('movementDateFrom')?.value || '';
        const dateTo = document.getElementById('movementDateTo')?.value || '';

        // Filtrar y ordenar
        const filtered = this.data.movements
            .filter(m => {
                const matchesType = !typeFilter || (m.tipo || '').toLowerCase() === typeFilter;
                // m.fecha puede venir en ISO o yyyy-mm-dd; normalizar
                const d = new Date(m.fecha);
                if (Number.isNaN(d.getTime())) return false;
                const isoDate = d.toISOString().slice(0,10);
                const matchesFrom = !dateFrom || isoDate >= dateFrom;
                const matchesTo = !dateTo || isoDate <= dateTo;
                return matchesType && matchesFrom && matchesTo;
            })
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        filtered.forEach(movement => {
                const item = this.data.items.find(i => i.id === movement.item_id);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="font-weight: 600;">${this.formatDateWithTime(movement.fecha).date}</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">${this.formatDateWithTime(movement.fecha).time}</div>
                    </td>
                    <td>${item ? item.nombre : 'Ítem eliminado'}</td>
                    <td><span class="status-badge ${movement.tipo === 'entrada' ? 'status-retirado-cancelado' : 'status-retirado-no-cancelado'}">${movement.tipo}</span></td>
                    <td>${movement.cantidad}</td>
                    <td>${movement.motivo}</td>
                    <td>${movement.nota}</td>
                `;
                tbody.appendChild(row);
            });
    }

    filterMovements() {
        this.loadMovements();
    }

    showAddMovementModal() {
        this.showModal('Registrar Entrada de Stock', this.getMovementFormHTML());
        
        document.getElementById('movementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMovement();
        });
    }

    getMovementFormHTML() {
        return `
            <form id="movementForm">
                <div class="form-group">
                    <label for="movementItem" class="form-label">Ítem *</label>
                    <select id="movementItem" class="form-input" required>
                        <option value="">Seleccionar ítem...</option>
                        ${this.data.items.map(item => `<option value="${item.id}">${item.codigo} - ${item.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="movementCantidad" class="form-label">Cantidad *</label>
                        <input type="number" id="movementCantidad" class="form-input" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="movementFecha" class="form-label">Fecha *</label>
                        <input type="date" id="movementFecha" class="form-input" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="movementMotivo" class="form-label">Motivo *</label>
                    <input type="text" id="movementMotivo" class="form-input" placeholder="Ej: Compra proveedor, Devolución cliente" required>
                </div>
                <div class="form-group">
                    <label for="movementNota" class="form-label">Nota</label>
                    <textarea id="movementNota" class="form-input" rows="3" placeholder="Información adicional..."></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Guardar Movimiento
                    </button>
                </div>
            </form>
        `;
    }

    saveMovement() {
        const itemId = document.getElementById('movementItem').value;
        const cantidad = parseInt(document.getElementById('movementCantidad').value);
        const fecha = document.getElementById('movementFecha').value;
        const motivo = document.getElementById('movementMotivo').value;
        const nota = document.getElementById('movementNota').value;

        // Actualizar cantidad del ítem
        const item = this.data.items.find(i => i.id === itemId);
        if (item) {
            item.cantidad_total += cantidad;
            item.updated_at = new Date().toISOString();
        }

        // Crear movimiento
        this.createMovement(itemId, 'entrada', cantidad, motivo, nota);

        this.closeModal();
        this.loadInventory();
        this.loadMovements();
        this.updateKPIs();
        this.showNotification('Entrada registrada exitosamente', 'success');
    }

    // ==================== MODALES ====================
    
    showModal(title, content, footer = '') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modalFooter').innerHTML = footer;
        document.getElementById('modalOverlay').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
        document.getElementById('modalBody').innerHTML = '';
        document.getElementById('modalFooter').innerHTML = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==================== FUNCIONES PENDIENTES ====================
    
    loadProformas() {
        const tbody = document.querySelector('#proformasTable tbody');
        tbody.innerHTML = '';

        this.data.proformas.forEach(proforma => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${proforma.numero}</td>
                <td>${proforma.cliente.nombre}</td>
                <td>$${proforma.total.toLocaleString()}</td>
                <td><span class="status-badge status-${proforma.estado_compuesto.replace(/\s+/g, '-').toLowerCase()}">${proforma.estado_compuesto}</span></td>
                <td>
                    <div style="font-weight: 600;">${this.formatDateWithTime(proforma.fecha_creacion).date}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-500);">${this.formatDateWithTime(proforma.fecha_creacion).time}</div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-icon" onclick="inventorySystem.viewProforma('${proforma.id}')" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" onclick="inventorySystem.printProforma('${proforma.id}')" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                        ${proforma.estado_compuesto !== 'cumplido' ? `
                            <button class="btn btn-icon" onclick="inventorySystem.editProforma('${proforma.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-icon" onclick="inventorySystem.deleteProforma('${proforma.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterProformas() {
        // Implementar filtro de proformas
    }

    showAddProformaModal() {
        this.showModal('Nueva Proforma', this.getProformaFormHTML(), '');
        
        document.getElementById('proformaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProforma();
        });

        // Event listeners para actualizar total automáticamente
        document.getElementById('costoMontaje').addEventListener('input', () => this.calculateProformaTotal());
        document.getElementById('costoTransporte').addEventListener('input', () => this.calculateProformaTotal());
        const alquilerTipoEl = document.getElementById('alquilerTipo');
        const alquilerDuracionEl = document.getElementById('alquilerDuracion');
        const precioHoraGlobalEl = document.getElementById('precioHoraGlobal');
        if (alquilerTipoEl) {
            alquilerTipoEl.addEventListener('change', () => {
                this.calculateProformaTotal();
                this.updateTipoUnidad();
            });
        }
        if (alquilerDuracionEl) alquilerDuracionEl.addEventListener('input', () => {
            // Recalcular subtotales de filas porque usan la duración
            document.querySelectorAll('#proformaItemsContainer .proforma-item-row input, #proformaItemsContainer .proforma-item-row select')
                .forEach(el => this.calculateItemSubtotal(el));
        });
        if (precioHoraGlobalEl) precioHoraGlobalEl.addEventListener('input', () => this.calculateProformaTotal());
        // Recalcular al escribir en filas existentes iniciales
        document.querySelectorAll('#proformaItemsContainer .proforma-item-row input, #proformaItemsContainer .proforma-item-row select')
            .forEach(el => el.addEventListener('input', () => this.calculateItemSubtotal(el)));
    }

    getProformaFormHTML() {
        return `
            <form id="proformaForm" class="form-compact">
                <!-- Información del Cliente -->
                <div class="form-section">
                    <div class="form-section-title">
                    <i class="fas fa-user"></i> Información del Cliente
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="clienteNombre" class="form-label">Nombre del Cliente *</label>
                        <input type="text" id="clienteNombre" class="form-input" required>
                    </div>
                    <div class="form-group">
                            <label for="clienteTelefono" class="form-label">Teléfono *</label>
                            <input type="tel" id="clienteTelefono" class="form-input" required>
                    </div>
                </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="clienteCorreo" class="form-label">Correo electrónico *</label>
                            <input type="email" id="clienteCorreo" class="form-input" required>
                        </div>
                <div class="form-group">
                    <label for="clienteDireccion" class="form-label">Dirección</label>
                    <input type="text" id="clienteDireccion" class="form-input">
                        </div>
                    </div>
                </div>
                
                <!-- Grid de Contenido -->
                <div class="proforma-grid" style="display: grid; grid-template-columns: 3fr 2fr; gap: 1rem; align-items: start;">
                    <!-- Columna Izquierda: Ítems -->
                    <div>
                        <div class="form-section">
                            <div class="form-section-title">
                    <i class="fas fa-list"></i> Ítems de la Proforma
                </div>
                
                <div id="proformaItemsContainer">
                            <div class="proforma-item-row" style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; padding: 0.75rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); margin-bottom: 0.75rem;">
                                <select class="form-input" style="flex: 1 1 250px; height: 2.25rem;" onchange="inventorySystem.updateItemPrice(this)">
                            <option value="">Seleccionar ítem...</option>
                            ${this.data.items.map(item => `<option value="${item.id}" data-precio="${item.costo_unitario}">${item.codigo} - ${item.nombre}</option>`).join('')}
                        </select>
                                <input type="number" placeholder="Cantidad" class="form-input" style="flex: 0 1 80px; height: 2.25rem;" min="1" onchange="inventorySystem.calculateItemSubtotal(this)">
                                <input type="number" placeholder="Precio unit." class="form-input" style="flex: 0 1 100px; height: 2.25rem;" step="0.01" onchange="inventorySystem.calculateItemSubtotal(this)">
                                <label style="display: flex; align-items: center; gap: .3rem; font-size: .8125rem; color: var(--gray-700); flex: 0 0 auto; height: 2.25rem;">
                                    <input type="checkbox" data-role="arreglo-toggle" disabled onchange="inventorySystem.toggleArreglo(this)"> Arreglo
                                </label>
                                <select class="form-input" data-role="arreglo-select" style="flex: 1 1 180px; height: 2.25rem; display: none;" onchange="inventorySystem.onArregloChange(this)" disabled>
                                    <option value="">Arreglo decorativo...</option>
                                </select>
                                <input type="number" placeholder="Precio arreglo" class="form-input" data-role="arreglo-precio" style="flex: 0 1 100px; height: 2.25rem; display: none;" step="0.01" onchange="inventorySystem.calculateItemSubtotal(this)">
                                <input type="number" placeholder="Subtotal" class="form-input" style="flex: 0 1 120px; height: 2.25rem;" step="0.01" readonly>
                                <button type="button" class="btn btn-danger btn-icon" style="height: 2.25rem; padding: 0.5rem;" onclick="this.closest('.proforma-item-row').remove(); inventorySystem.calculateProformaTotal()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                            <button type="button" class="btn btn-secondary" onclick="inventorySystem.addProformaItem()" style="margin-top: 0.75rem;">
                    <i class="fas fa-plus"></i> Agregar Ítem
                </button>
                        </div>
                    </div>

                    <!-- Columna Derecha: Alquiler, Costos, Notas y Total -->
                    <aside>
                        <div class="form-section">
                            <div class="form-section-title">
                                <i class="fas fa-clock"></i> Duración del Alquiler
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="alquilerTipo" class="form-label">Tipo de Alquiler</label>
                                    <select id="alquilerTipo" class="form-input">
                                        <option value="horas">Horas</option>
                                        <option value="dias">Días</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="alquilerDuracion" class="form-label">Duración</label>
                                    <input type="number" id="alquilerDuracion" class="form-input" min="1" value="1" placeholder="Ej: 8">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="precioHoraGlobal" class="form-label">Precio por <span id="tipoUnidad">hora</span> (opcional)</label>
                                <input type="number" id="precioHoraGlobal" class="form-input" min="0" step="0.01" placeholder="Ej: 2.50">
                                <small class="form-help">Se aplicará a todos los ítems multiplicado por la duración</small>
                            </div>
                </div>
                
                        <div class="form-section">
                            <div class="form-section-title">
                                <i class="fas fa-calculator"></i> Costos Adicionales
                            </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="costoMontaje" class="form-label">Costo de Montaje</label>
                                    <input type="number" id="costoMontaje" class="form-input" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="costoTransporte" class="form-label">Costo de Transporte</label>
                                    <input type="number" id="costoTransporte" class="form-input" min="0" step="0.01" placeholder="0.00">
                                </div>
                    </div>
                </div>
                
                        <div class="form-section">
                <div class="form-group">
                    <label for="proformaNotas" class="form-label">Notas</label>
                    <textarea id="proformaNotas" class="form-input" rows="3" placeholder="Información adicional sobre la proforma..."></textarea>
                            </div>
                </div>
                
                        <div class="form-section" style="background: var(--primary-50); border-color: var(--primary-200); position: sticky; top: 0.5rem;">
                            <div class="form-section-title" style="color: var(--primary-700);">
                                <i class="fas fa-calculator"></i> Total de la Proforma
                    </div>
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.8125rem; color: var(--gray-600);">
                                    <span>Subtotal ítems:</span>
                                    <span id="subtotalItems">$0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.8125rem; color: var(--gray-600);">
                                    <span>Montaje:</span>
                                    <span id="costoMontajeDisplay">$0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.8125rem; color: var(--gray-600);">
                                    <span>Transporte:</span>
                                    <span id="costoTransporteDisplay">$0</span>
                                </div>
                                <div id="costoHoraGlobalDisplay" style="display: none; margin-bottom: 0.25rem;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--gray-600);">
                                        <span>Precio por <span id="tipoUnidadTotal">hora</span>:</span>
                                        <span id="costoHoraGlobalValue">$0</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1rem; font-weight: 600; color: var(--primary-700); border-top: 1px solid var(--primary-200); padding-top: 0.75rem;">
                                <span>Total:</span>
                                <span id="proformaTotal" style="font-size: 1.25rem; font-weight: 700; color: var(--primary-600);">$0</span>
                            </div>
                        </div>
                    </aside>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Guardar Proforma
                    </button>
                </div>
            </form>
        `;
    }

    addProformaItem(itemId = '', cantidad = '', precio = '') {
        const container = document.getElementById('proformaItemsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'proforma-item-row';
        newRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; padding: 0.75rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); margin-bottom: 0.75rem;';
        newRow.innerHTML = `
            <select class="form-input" style="flex: 1 1 250px; height: 2.25rem;" onchange="inventorySystem.updateItemPrice(this)">
                <option value="">Seleccionar ítem...</option>
                ${this.data.items.map(item => `<option value="${item.id}" data-precio="${item.costo_unitario}" ${item.id === itemId ? 'selected' : ''}>${item.codigo} - ${item.nombre}</option>`).join('')}
            </select>
            <input type="number" placeholder="Cantidad" class="form-input" style="flex: 0 1 80px; height: 2.25rem;" min="1" value="${cantidad}" onchange="inventorySystem.calculateItemSubtotal(this)">
            <input type="number" placeholder="Precio unit." class="form-input" style="flex: 0 1 100px; height: 2.25rem;" step="0.01" value="${precio}" onchange="inventorySystem.calculateItemSubtotal(this)">
            <label style="display: flex; align-items: center; gap: .3rem; font-size: .8125rem; color: var(--gray-700); flex: 0 0 auto; height: 2.25rem;">
                <input type="checkbox" data-role="arreglo-toggle" disabled onchange="inventorySystem.toggleArreglo(this)"> Arreglo
            </label>
            <select class="form-input" data-role="arreglo-select" style="flex: 1 1 180px; height: 2.25rem; display: none;" onchange="inventorySystem.onArregloChange(this)" disabled>
                <option value="">Arreglo decorativo...</option>
            </select>
            <input type="number" placeholder="Precio arreglo" class="form-input" data-role="arreglo-precio" style="flex: 0 1 100px; height: 2.25rem; display: none;" step="0.01" onchange="inventorySystem.calculateItemSubtotal(this)">
            <input type="number" placeholder="Subtotal" class="form-input" style="flex: 0 1 120px; height: 2.25rem;" step="0.01" readonly>
            <button type="button" class="btn btn-danger btn-icon" style="height: 2.25rem; padding: 0.5rem;" onclick="this.closest('.proforma-item-row').remove(); inventorySystem.calculateProformaTotal()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(newRow);
    }

    saveProforma() {
        const cliente = {
            nombre: document.getElementById('clienteNombre').value,
            telefono: document.getElementById('clienteTelefono').value,
            correo: document.getElementById('clienteCorreo').value,
            direccion: document.getElementById('clienteDireccion').value
        };

        const items = [];
        document.querySelectorAll('.proforma-item-row').forEach(row => {
            const select = row.querySelector('select');
            const cantidad = parseInt(row.querySelector('input[placeholder="Cantidad"]').value);
            const precio = parseFloat(row.querySelector('input[placeholder="Precio unit."]').value);
            const duracion = parseInt(document.getElementById('alquilerDuracion')?.value || '1');
            const arregloToggle = row.querySelector('input[data-role="arreglo-toggle"]').checked;
            const arregloTipo = arregloToggle ? (row.querySelector('select[data-role="arreglo-select"]').value || null) : null;
            const arregloPrecio = arregloToggle ? (parseFloat(row.querySelector('input[data-role="arreglo-precio"]').value) || 0) : 0;
            
            if (select.value && cantidad && precio) {
                const item = this.data.items.find(i => i.id === select.value);
                items.push({
                    item_id: select.value,
                    nombre: item.nombre,
                    cantidad: cantidad,
                    precio_unit: precio,
                    arreglo: arregloTipo ? { tipo: arregloTipo, precio: arregloPrecio } : null,
                    subtotal: (cantidad * precio * duracion) + (cantidad * arregloPrecio)
                });
            }
        });

        const costoMontaje = parseFloat(document.getElementById('costoMontaje').value) || 0;
        const costoTransporte = parseFloat(document.getElementById('costoTransporte').value) || 0;
        const precioHoraGlobal = parseFloat(document.getElementById('precioHoraGlobal').value) || 0;
        const duracion = parseInt(document.getElementById('alquilerDuracion').value) || 1;
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0) + (precioHoraGlobal > 0 ? precioHoraGlobal * duracion : 0);
        // Persistir parámetros globales de alquiler
        const alquilerTipo = document.getElementById('alquilerTipo').value;
        const alquilerDuracion = parseInt(document.getElementById('alquilerDuracion').value) || 1;
        const total = subtotal + costoMontaje + costoTransporte;

        const proforma = {
            id: this.generateId(),
            numero: this.generateProformaNumber(),
            cliente: cliente,
            items: items,
            subtotal: subtotal,
            costo_montaje: costoMontaje,
            costo_transporte: costoTransporte,
            costo_arreglos: 0,
            impuestos: 0,
            total: total,
            pagos: [],
            estado_retiro: false,
            estado_cancelado: false,
            estado_compuesto: 'Sin retirar y no cancelado',
            fecha_creacion: new Date().toISOString(),
            fecha_retiro: null,
            fecha_cancelacion: null,
            notas: document.getElementById('proformaNotas').value,
            alquiler: {
                tipo: alquilerTipo,
                duracion: alquilerDuracion,
                precio_hora_global: precioHoraGlobal || 0
            }
        };

        this.data.proformas.push(proforma);
        this.saveData();
        this.logAudit('create_proforma', `Creó proforma: ${proforma.numero} - ${cliente.nombre}`);

        this.closeModal();
        this.loadProformas();
        this.updateKPIs();
        this.showNotification('Proforma creada exitosamente', 'success');
    }

    generateProformaNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const sequence = this.data.proformas.length + 1;
        return `PF-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
    }

    viewProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        const totalProforma = Number(proforma.total || 0);
        const pagado = (proforma.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
        const saldo = Math.max(totalProforma - pagado, 0);

        const html = `
            <div class="proforma-view">
                <div class="proforma-header">
                    <h3>Proforma ${proforma.numero}</h3>
                    <p><strong>Cliente:</strong> ${proforma.cliente.nombre}</p>
                    ${proforma.cliente.telefono ? `<p><strong>Teléfono:</strong> ${proforma.cliente.telefono}</p>` : ''}
                    ${proforma.cliente.correo ? `<p><strong>Correo:</strong> ${proforma.cliente.correo}</p>` : ''}
                    <p><strong>Fecha:</strong> ${this.formatDateTimeExact(proforma.fecha_creacion)}</p>
                    ${proforma.alquiler ? `<p><strong>Alquiler:</strong> ${proforma.alquiler.duracion} ${proforma.alquiler.tipo}</p>` : ''}
                    <p><strong>Estado:</strong> <span class="status-badge status-${proforma.estado_compuesto.replace(/\s+/g, '-').toLowerCase()}">${proforma.estado_compuesto}</span></p>
                </div>
                
                <div class="proforma-items">
                    <h4>Ítems:</h4>
                    <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
                        <thead>
                            <tr style="background: var(--gray-100);">
                                <th style="padding: 0.5rem; text-align: left;">Ítem</th>
                                <th style="padding: 0.5rem; text-align: center;">Cantidad</th>
                                <th style="padding: 0.5rem; text-align: right;">Precio Unit.</th>
                                <th style="padding: 0.5rem; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${proforma.items.map(item => `
                                <tr>
                                    <td style="padding: 0.5rem;">${item.nombre}</td>
                                    <td style="padding: 0.5rem; text-align: center;">${item.cantidad}</td>
                                    <td style="padding: 0.5rem; text-align: right;">$${item.precio_unit.toFixed(2)}</td>
                                    <td style="padding: 0.5rem; text-align: right;">$${item.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="proforma-totals">
                    <div class="total-row">
                        <span>Subtotal Ítems:</span>
                        <span>$${proforma.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Costo de Montaje:</span>
                        <span>$${proforma.costo_montaje.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Costo de Transporte:</span>
                        <span>$${proforma.costo_transporte.toFixed(2)}</span>
                    </div>
                    <div class="total-row total-final">
                        <span>TOTAL:</span>
                        <span>$${proforma.total.toFixed(2)}</span>
                    </div>
                </div>
                
                ${proforma.notas ? `<div class="proforma-notes"><h4>Notas:</h4><p>${proforma.notas}</p></div>` : ''}
            </div>
        `;

        const buttons = `
            <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="inventorySystem.printProforma('${proformaId}')">
                <i class="fas fa-print"></i> Imprimir
            </button>
            ${saldo > 0 ? `
                <button type="button" class="btn btn-info" onclick="inventorySystem.showPagoModal('${proformaId}')">
                    <i class="fas fa-cash-register"></i> Registrar Pago
                </button>
            ` : ''}
            ${!proforma.estado_retiro ? `
                <button type="button" class="btn btn-warning" onclick="inventorySystem.showSalidaModal('${proformaId}')">
                    <i class="fas fa-truck"></i> Registrar Salida
                </button>
            ` : ''}
            ${(!proforma.fecha_cumplimiento) && proforma.estado_retiro ? `
                <button type="button" class="btn btn-success" onclick="inventorySystem.showRecepcionModal('${proformaId}')">
                    <i class="fas fa-check"></i> Registrar Recepción
                </button>
            ` : ''}
        `;

        this.showModal(`Ver Proforma ${proforma.numero}`, html, buttons);
    }

    printProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Proforma ${proforma.numero}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .client-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .totals { margin-top: 20px; }
                    .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total-final { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PROFORMA</h1>
                    <h2>${proforma.numero}</h2>
                </div>
                
                <div class="client-info">
                    <h3>Cliente: ${proforma.cliente.nombre}</h3>
                    ${proforma.cliente.telefono ? `<p>Teléfono: ${proforma.cliente.telefono}</p>` : ''}
                    ${proforma.cliente.correo ? `<p>Correo: ${proforma.cliente.correo}</p>` : ''}
                    ${proforma.cliente.direccion ? `<p>Dirección: ${proforma.cliente.direccion}</p>` : ''}
                    <p>Fecha: ${this.formatDateTimeExact(proforma.fecha_creacion)}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Ítem</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proforma.items.map(item => `
                            <tr>
                                <td>${item.nombre}</td>
                                <td>${item.cantidad}</td>
                                <td>$${item.precio_unit.toFixed(2)}</td>
                                <td>$${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal Ítems:</span>
                        <span>$${proforma.subtotal.toFixed(2)}</span>
                    </div>
                    ${proforma.alquiler ? `
                    <div class="total-row">
                        <span>Alquiler:</span>
                        <span>${proforma.alquiler.duracion} ${proforma.alquiler.tipo}</span>
                    </div>` : ''}
                    <div class="total-row">
                        <span>Costo de Montaje:</span>
                        <span>$${proforma.costo_montaje.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Costo de Transporte:</span>
                        <span>$${proforma.costo_transporte.toFixed(2)}</span>
                    </div>
                    <div class="total-row total-final">
                        <span>TOTAL:</span>
                        <span>$${proforma.total.toFixed(2)}</span>
                    </div>
                </div>
                
                ${proforma.notas ? `<div style="margin-top: 30px;"><h4>Notas:</h4><p>${proforma.notas}</p></div>` : ''}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    showPagoModal(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        const pagado = (proforma.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
        const saldo = Math.max((proforma.total || 0) - pagado, 0);
        const html = `
            <form id="pagoForm" class="form-compact">
                <div class="form-section">
                    <div class="form-section-title"><i class="fas fa-cash-register"></i> Registrar Pago</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Total</label>
                            <div class="form-input" style="background: var(--gray-50);">$${(proforma.total||0).toLocaleString()}</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Pagado</label>
                            <div class="form-input" style="background: var(--gray-50);">$${pagado.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="pagoMonto">Monto</label>
                            <input id="pagoMonto" class="form-input" type="number" min="0" step="0.01" value="${saldo.toFixed(2)}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="pagoMetodo">Método</label>
                            <select id="pagoMetodo" class="form-input">
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="tarjeta">Tarjeta</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="pagoNota">Nota</label>
                        <input id="pagoNota" class="form-input" type="text" placeholder="Referencia, comprobante, etc." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Pago</button>
                </div>
            </form>
        `;
        this.showModal(`Pago de ${proforma.numero}`, html, '');
        document.getElementById('pagoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmarPago(proformaId);
        });
    }

    confirmarPago(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;
        const monto = Math.max(0, Number(document.getElementById('pagoMonto').value || 0));
        if (!monto) { this.showNotification('Ingresa un monto válido.', 'warning'); return; }
        const metodo = document.getElementById('pagoMetodo').value || 'efectivo';
        const nota = (document.getElementById('pagoNota').value || '').trim();
        proforma.pagos = proforma.pagos || [];
        proforma.pagos.push({ fecha: new Date().toISOString(), monto, metodo, nota });

        this.updateProformaEstadoCompuesto(proforma);
        this.saveData();
        this.closeModal();
        this.loadProformas();
        this.updateKPIs();
        this.viewProforma(proformaId);
        this.showNotification('Pago registrado.', 'success');
    }

    editItem(itemId) {
        const item = this.data.items.find(i => i.id === itemId);
        if (!item) return;

        this.showModal('Editar Ítem', this.getItemFormHTML(item));
        
        // Llenar formulario con datos existentes
        document.getElementById('itemCodigo').value = item.codigo;
        document.getElementById('itemNombre').value = item.nombre;
        document.getElementById('itemCategoria').value = item.categoria;
        document.getElementById('itemUnidad').value = item.unidad;
        document.getElementById('itemDescripcion').value = item.descripcion || '';
        document.getElementById('itemCantidad').value = item.cantidad_total;
        document.getElementById('itemCosto').value = item.costo_unitario || '';
        document.getElementById('itemUbicacion').value = item.ubicacion;

        // Llenar arreglos existentes
        const container = document.getElementById('arreglosContainer');
        container.innerHTML = '';
        item.arreglos.forEach(arreglo => {
            addArregloRow(arreglo.tipo, arreglo.precio, arreglo.descripcion);
        });
        if (item.arreglos.length === 0) {
            addArregloRow();
        }
        
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateItem(itemId);
        });
    }

    updateItem(itemId) {
        const item = this.data.items.find(i => i.id === itemId);
        if (!item) return;

        // Validar que el código no exista en otro ítem
        const codigo = document.getElementById('itemCodigo').value;
        if (codigo !== item.codigo && this.data.items.find(i => i.codigo === codigo && i.id !== itemId)) {
            alert('El código ya existe. Por favor, use un código diferente.');
            return;
        }

        // Actualizar datos del ítem
        item.codigo = codigo;
        item.nombre = document.getElementById('itemNombre').value;
        item.categoria = document.getElementById('itemCategoria').value;
        item.descripcion = document.getElementById('itemDescripcion').value;
        item.unidad = document.getElementById('itemUnidad').value;
        item.costo_unitario = parseFloat(document.getElementById('itemCosto').value) || 0;
        item.ubicacion = document.getElementById('itemUbicacion').value;
        item.arreglos = this.getArreglosFromForm();
        item.updated_at = new Date().toISOString();

        this.saveData();
        this.logAudit('update_item', `Editó ítem: ${item.nombre} (${item.codigo})`);
        
        this.closeModal();
        this.loadInventory();
        this.showNotification('Ítem actualizado exitosamente', 'success');
    }

    deleteItem(itemId) {
        const item = this.data.items.find(i => i.id === itemId);
        if (!item) return;

        // Verificar si el ítem está siendo usado en proformas
        const proformasConItem = this.data.proformas.filter(p => 
            p.items.some(pi => pi.item_id === itemId)
        );

        if (proformasConItem.length > 0) {
            alert(`No se puede eliminar este ítem porque está siendo usado en ${proformasConItem.length} proforma(s). Primero elimine o modifique las proformas que lo contienen.`);
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar el ítem "${item.nombre}" (${item.codigo})?`)) {
            this.data.items = this.data.items.filter(i => i.id !== itemId);
            this.saveData();
            this.logAudit('delete_item', `Eliminó ítem: ${item.nombre} (${item.codigo})`);
            this.loadInventory();
            this.updateKPIs();
            this.showNotification('Ítem eliminado exitosamente', 'success');
        }
    }

    exportInventory(format) {
        if (format === 'csv') {
            this.exportInventoryCSV();
        } else if (format === 'json') {
            this.exportInventoryJSON();
        }
    }

    exportInventoryCSV() {
        const headers = ['Código', 'Nombre', 'Categoría', 'Descripción', 'Cantidad Total', 'Comprometido', 'Disponible', 'Unidad', 'Costo Unitario', 'Ubicación', 'Fecha Creación'];
        const csvContent = [
            headers.join(','),
            ...this.data.items.map(item => [
                `"${item.codigo}"`,
                `"${item.nombre}"`,
                `"${item.categoria}"`,
                `"${item.descripcion || ''}"`,
                item.cantidad_total,
                item.comprometido || 0,
                item.cantidad_total - (item.comprometido || 0),
                `"${item.unidad}"`,
                item.costo_unitario || 0,
                `"${item.ubicacion}"`,
                `"${this.formatDateTimeExact(item.created_at)}"`
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'inventario.csv', 'text/csv');
        this.showNotification('Inventario exportado en CSV', 'success');
    }

    exportInventoryJSON() {
        const jsonContent = JSON.stringify({
            export_date: new Date().toISOString(),
            total_items: this.data.items.length,
            items: this.data.items.map(item => ({
                codigo: item.codigo,
                nombre: item.nombre,
                categoria: item.categoria,
                descripcion: item.descripcion,
                cantidad_total: item.cantidad_total,
                comprometido: item.comprometido || 0,
                disponible: item.cantidad_total - (item.comprometido || 0),
                unidad: item.unidad,
                costo_unitario: item.costo_unitario,
                ubicacion: item.ubicacion,
                arreglos: item.arreglos,
                fecha_creacion: item.created_at,
                fecha_actualizacion: item.updated_at
            }))
        }, null, 2);

        this.downloadFile(jsonContent, 'inventario.json', 'application/json');
        this.showNotification('Inventario exportado en JSON', 'success');
    }

    exportProformas(format) {
        if (format === 'csv') {
            this.exportProformasCSV();
        } else if (format === 'json') {
            this.exportProformasJSON();
        }
    }

    exportProformasCSV() {
        const headers = ['Número', 'Cliente', 'Teléfono', 'Dirección', 'Total', 'Estado', 'Fecha Creación', 'Fecha Cumplimiento', 'Notas'];
        const csvContent = [
            headers.join(','),
            ...this.data.proformas.map(proforma => [
                `"${proforma.numero}"`,
                `"${proforma.cliente.nombre}"`,
                `"${proforma.cliente.telefono || ''}"`,
                `"${proforma.cliente.direccion || ''}"`,
                proforma.total,
                `"${proforma.estado_compuesto}"`,
                `"${this.formatDateTimeExact(proforma.fecha_creacion)}"`,
                `"${proforma.fecha_cumplimiento ? this.formatDateTimeExact(proforma.fecha_cumplimiento) : ''}"`,
                `"${proforma.notas || ''}"`
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'proformas.csv', 'text/csv');
        this.showNotification('Proformas exportadas en CSV', 'success');
    }

    exportProformasJSON() {
        const jsonContent = JSON.stringify({
            export_date: new Date().toISOString(),
            total_proformas: this.data.proformas.length,
            proformas: this.data.proformas.map(proforma => ({
                numero: proforma.numero,
                cliente: proforma.cliente,
                items: proforma.items,
                subtotal: proforma.subtotal,
                costo_montaje: proforma.costo_montaje,
                costo_transporte: proforma.costo_transporte,
                costo_arreglos: proforma.costo_arreglos,
                impuestos: proforma.impuestos,
                total: proforma.total,
                pagos: proforma.pagos,
                estado_compuesto: proforma.estado_compuesto,
                fecha_creacion: proforma.fecha_creacion,
                fecha_cumplimiento: proforma.fecha_cumplimiento,
                notas: proforma.notas
            }))
        }, null, 2);

        this.downloadFile(jsonContent, 'proformas.json', 'application/json');
        this.showNotification('Proformas exportadas en JSON', 'success');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    backupData() {
        const backup = {
            version: '1.0',
            export_date: new Date().toISOString(),
            data: {
                items: this.data.items,
                proformas: this.data.proformas,
                movements: this.data.movements,
                recepciones: this.data.recepciones || [],
                audit: this.data.audit,
                settings: this.data.settings
            },
            statistics: {
                total_items: this.data.items.length,
                total_proformas: this.data.proformas.length,
                total_movements: this.data.movements.length,
                total_recepciones: (this.data.recepciones || []).length,
                total_audit_entries: this.data.audit.length
            }
        };

        const jsonContent = JSON.stringify(backup, null, 2);
        const filename = `backup_inventario_${new Date().toISOString().split('T')[0]}.json`;
        
        this.downloadFile(jsonContent, filename, 'application/json');
        this.showNotification('Backup creado exitosamente', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            alert('Por favor, seleccione un archivo JSON válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (!backup.data || !backup.version) {
                    alert('El archivo no es un backup válido del sistema.');
                    return;
                }

                if (confirm('¿Estás seguro de que quieres importar estos datos? Esto reemplazará todos los datos actuales.')) {
                    // Validar estructura del backup
                    if (backup.data.items && backup.data.proformas && backup.data.movements && backup.data.audit && backup.data.settings) {
                        this.data = backup.data;
                        this.saveData();
                        this.logAudit('import_data', `Importó backup del ${this.formatDateTimeExact(backup.export_date)}`);
                        
                        // Recargar todas las vistas
                        this.loadInventory();
                        this.loadProformas();
                        this.loadMovements();
                        this.updateKPIs();
                        
                        this.showNotification('Datos importados exitosamente', 'success');
                    } else {
                        alert('El archivo de backup está corrupto o incompleto.');
                    }
                }
            } catch (error) {
                alert('Error al leer el archivo. Por favor, verifique que sea un archivo JSON válido.');
                console.error('Error importing data:', error);
            }
        };
        
        reader.readAsText(file);
        
        // Limpiar el input
        event.target.value = '';
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validar contraseña actual
        if (currentPassword !== this.data.settings.password) {
            alert('La contraseña actual es incorrecta.');
            return;
        }

        // Validar nueva contraseña
        if (newPassword.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas nuevas no coinciden.');
            return;
        }

        // Cambiar contraseña
        this.data.settings.password = newPassword;
        this.saveData();
        this.logAudit('change_password', 'Cambió la contraseña del sistema');
        
        // Limpiar formulario
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        this.showNotification('Contraseña cambiada exitosamente', 'success');
    }

    editProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        this.showModal('Editar Proforma', this.getProformaFormHTML(proforma), '');
        
        // Llenar formulario con datos existentes
        document.getElementById('clienteNombre').value = proforma.cliente.nombre;
        document.getElementById('clienteTelefono').value = proforma.cliente.telefono || '';
        document.getElementById('clienteDireccion').value = proforma.cliente.direccion || '';
        document.getElementById('costoMontaje').value = proforma.costo_montaje || 0;
        document.getElementById('costoTransporte').value = proforma.costo_transporte || 0;
        document.getElementById('proformaNotas').value = proforma.notas || '';
        if (proforma.alquiler) {
            if (document.getElementById('alquilerTipo')) document.getElementById('alquilerTipo').value = proforma.alquiler.tipo || 'horas';
            if (document.getElementById('alquilerDuracion')) document.getElementById('alquilerDuracion').value = proforma.alquiler.duracion || 1;
            if (document.getElementById('precioHoraGlobal')) document.getElementById('precioHoraGlobal').value = proforma.alquiler.precio_hora_global || 0;
        }

        // Llenar ítems existentes
        const container = document.getElementById('proformaItemsContainer');
        container.innerHTML = '';
        proforma.items.forEach(item => {
            this.addProformaItem(item.item_id, item.cantidad, item.precio_unit);
        });
        if (proforma.items.length === 0) {
            this.addProformaItem();
        }
        
        document.getElementById('proformaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProforma(proformaId);
        });
    }

    updateProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        const cliente = {
            nombre: document.getElementById('clienteNombre').value,
            telefono: document.getElementById('clienteTelefono').value,
            direccion: document.getElementById('clienteDireccion').value
        };

        const items = [];
        document.querySelectorAll('.proforma-item-row').forEach(row => {
            const select = row.querySelector('select');
            const cantidad = parseInt(row.querySelector('input[placeholder="Cantidad"]').value);
            const precio = parseFloat(row.querySelector('input[placeholder="Precio unit."]').value);
            const duracion = parseInt(document.getElementById('alquilerDuracion')?.value || '1');
            const arregloToggle = row.querySelector('input[data-role="arreglo-toggle"]').checked;
            const arregloTipo = arregloToggle ? (row.querySelector('select[data-role="arreglo-select"]').value || null) : null;
            const arregloPrecio = arregloToggle ? (parseFloat(row.querySelector('input[data-role="arreglo-precio"]').value) || 0) : 0;
            
            if (select.value && cantidad && precio) {
                const item = this.data.items.find(i => i.id === select.value);
                items.push({
                    item_id: select.value,
                    nombre: item.nombre,
                    cantidad: cantidad,
                    precio_unit: precio,
                    arreglo: arregloTipo ? { tipo: arregloTipo, precio: arregloPrecio } : null,
                    subtotal: (cantidad * precio * duracion) + (cantidad * arregloPrecio)
                });
            }
        });

        const costoMontaje = parseFloat(document.getElementById('costoMontaje').value) || 0;
        const costoTransporte = parseFloat(document.getElementById('costoTransporte').value) || 0;
        const precioHoraGlobal = parseFloat(document.getElementById('precioHoraGlobal').value) || 0;
        const alquilerTipo = document.getElementById('alquilerTipo').value;
        const alquilerDuracion = parseInt(document.getElementById('alquilerDuracion').value) || 1;
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const total = subtotal + costoMontaje + costoTransporte + (precioHoraGlobal > 0 ? precioHoraGlobal * alquilerDuracion : 0);

        // Actualizar datos de la proforma
        proforma.cliente = cliente;
        proforma.items = items;
        proforma.subtotal = subtotal;
        proforma.costo_montaje = costoMontaje;
        proforma.costo_transporte = costoTransporte;
        proforma.total = total;
        proforma.alquiler = { tipo: alquilerTipo, duracion: alquilerDuracion, precio_hora_global: precioHoraGlobal || 0 };
        proforma.notas = document.getElementById('proformaNotas').value;
        proforma.updated_at = new Date().toISOString();

        this.saveData();
        this.logAudit('update_proforma', `Editó proforma: ${proforma.numero} - ${cliente.nombre}`);

        this.closeModal();
        this.loadProformas();
        this.updateKPIs();
        this.showNotification('Proforma actualizada exitosamente', 'success');
    }

    deleteProforma(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        if (confirm(`¿Estás seguro de que quieres eliminar la proforma "${proforma.numero}" de ${proforma.cliente.nombre}?`)) {
            this.data.proformas = this.data.proformas.filter(p => p.id !== proformaId);
            this.saveData();
            this.logAudit('delete_proforma', `Eliminó proforma: ${proforma.numero} - ${proforma.cliente.nombre}`);
            this.loadProformas();
            this.updateKPIs();
            this.showNotification('Proforma eliminada exitosamente', 'success');
        }
    }

    showProformaMovementModal() {
        const html = `
            <form id="proformaMovementForm" class="form-compact">
                <!-- Selección de Proforma -->
                <div class="form-section">
                    <div class="form-section-title">
                        <i class="fas fa-file-invoice"></i> Seleccionar Proforma
                </div>
                <div class="form-group">
                        <label for="proformaMovementSelect" class="form-label">Proforma *</label>
                    <select id="proformaMovementSelect" class="form-input" required onchange="inventorySystem.loadProformaItems()">
                        <option value="">Seleccionar proforma...</option>
                        ${this.data.proformas.map(p => `<option value="${p.id}">${p.numero} - ${p.cliente.nombre}</option>`).join('')}
                    </select>
                    </div>
                </div>
                
                <!-- Ítems de la Proforma -->
                <div id="proformaItemsDisplay" style="display: none;">
                    <div class="form-section">
                        <div class="form-section-title">
                        <i class="fas fa-list"></i> Ítems de la Proforma
                    </div>
                    <div id="proformaMovementItems"></div>
                    </div>
                </div>
                
                <!-- Detalles del Movimiento -->
                <div class="form-section">
                    <div class="form-section-title">
                        <i class="fas fa-truck"></i> Detalles del Movimiento
                    </div>
                    <div class="form-row">
                <div class="form-group">
                    <label for="movementTipo" class="form-label">Tipo de Movimiento *</label>
                    <select id="movementTipo" class="form-input" required>
                        <option value="">Seleccionar tipo...</option>
                        <option value="salida">Salida (Entrega)</option>
                        <option value="entrada">Entrada (Devolución)</option>
                        <option value="mixto">Mixto (Salida y Entrada)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="movementFecha" class="form-label">Fecha del Movimiento *</label>
                    <input type="date" id="movementFecha" class="form-input" required>
                </div>
                    </div>
                <div class="form-group">
                    <label for="movementNotas" class="form-label">Notas del Movimiento</label>
                    <textarea id="movementNotas" class="form-input" rows="3" placeholder="Observaciones sobre el movimiento..."></textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-check"></i>
                        Registrar Movimiento
                    </button>
                </div>
            </form>
        `;

        this.showModal('Movimiento con Proforma', html);
        
        // Establecer fecha actual
        document.getElementById('movementFecha').value = new Date().toISOString().split('T')[0];
        
        // Event listener para el formulario
        document.getElementById('proformaMovementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProformaMovement();
        });
    }

    loadProformaItems() {
        const proformaId = document.getElementById('proformaMovementSelect').value;
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        const container = document.getElementById('proformaMovementItems');
        const display = document.getElementById('proformaItemsDisplay');
        
        if (!proforma) {
            display.style.display = 'none';
            return;
        }
        
        display.style.display = 'block';
        container.innerHTML = proforma.items.map(item => `
            <div class="proforma-movement-item" style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; align-items: end; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); border: 1px solid var(--gray-200);">
                <div style="flex: 1 1 200px; min-width: 200px;">
                    <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.25rem;">${item.nombre}</label>
                    <p style="font-size: 0.75rem; color: var(--gray-600); margin: 0;">Solicitado: ${item.cantidad} unidades</p>
                </div>
                <div style="flex: 0 1 100px;">
                    <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.25rem;">Cantidad Salida</label>
                    <input type="number" class="form-input" style="height: 2.25rem; font-size: 0.8125rem;" min="0" max="${item.cantidad}" value="0" data-item-id="${item.item_id}" data-max="${item.cantidad}">
                </div>
                <div style="flex: 0 1 100px;">
                    <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.25rem;">Cantidad Entrada</label>
                    <input type="number" class="form-input" style="height: 2.25rem; font-size: 0.8125rem;" min="0" value="0" data-item-id="${item.item_id}">
                </div>
                <div style="flex: 0 1 120px;">
                    <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.25rem;">Estado</label>
                    <select class="form-input" style="height: 2.25rem; font-size: 0.8125rem;" data-item-id="${item.item_id}">
                        <option value="completo">Completo</option>
                        <option value="parcial">Parcial</option>
                        <option value="devuelto">Devuelto</option>
                        <option value="perdido">Perdido</option>
                    </select>
                </div>
            </div>
        `).join('');
    }

    saveProformaMovement() {
        const proformaId = document.getElementById('proformaMovementSelect').value;
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        const tipo = document.getElementById('movementTipo').value;
        const fecha = document.getElementById('movementFecha').value;
        const notas = document.getElementById('movementNotas').value;

        if (!proforma) {
            alert('Por favor, seleccione una proforma válida.');
            return;
        }

        const movimientos = [];
        document.querySelectorAll('.proforma-movement-item').forEach(row => {
            const itemId = row.querySelector('input[data-item-id]').dataset.itemId;
            const cantidadSalida = parseInt(row.querySelector('input[data-item-id]').value) || 0;
            const cantidadEntrada = parseInt(row.querySelectorAll('input[data-item-id]')[1].value) || 0;
            const estado = row.querySelector('select').value;

            if (cantidadSalida > 0 || cantidadEntrada > 0) {
                if (cantidadSalida > 0) {
                    movimientos.push({
                        item_id: itemId,
                        tipo: 'salida',
                        cantidad: cantidadSalida,
                        motivo: `Entrega proforma ${proforma.numero}`,
                        nota: `Estado: ${estado} - ${notas}`
                    });
                }
                if (cantidadEntrada > 0) {
                    movimientos.push({
                        item_id: itemId,
                        tipo: 'entrada',
                        cantidad: cantidadEntrada,
                        motivo: `Devolución proforma ${proforma.numero}`,
                        nota: `Estado: ${estado} - ${notas}`
                    });
                }
            }
        });

        if (movimientos.length === 0) {
            alert('Por favor, ingrese al menos una cantidad de salida o entrada.');
            return;
        }

        // Crear movimientos
        movimientos.forEach(mov => {
            this.createMovement(mov.item_id, mov.tipo, mov.cantidad, mov.motivo, mov.nota);
        });

        // Actualizar inventario
        movimientos.forEach(mov => {
            const item = this.data.items.find(i => i.id === mov.item_id);
            if (item) {
                if (mov.tipo === 'salida') {
                    item.cantidad_total -= mov.cantidad;
                } else {
                    item.cantidad_total += mov.cantidad;
                }
                item.updated_at = new Date().toISOString();
            }
        });

        this.saveData();
        this.logAudit('proforma_movement', `Registró movimiento con proforma ${proforma.numero}: ${movimientos.length} movimientos`);

        this.closeModal();
        this.loadMovements();
        this.loadInventory();
        this.updateKPIs();
        this.showNotification('Movimiento registrado exitosamente', 'success');
    }

    updateItemPrice(selectElement) {
        const precio = selectElement.selectedOptions[0].dataset.precio;
        const row = selectElement.closest('.proforma-item-row');
        const precioInput = row.querySelector('input[placeholder="Precio unit."]');
        const arregloToggle = row.querySelector('input[data-role="arreglo-toggle"]');
        const arregloSelect = row.querySelector('select[data-role="arreglo-select"]');
        const arregloPrecio = row.querySelector('input[data-role="arreglo-precio"]');
        if (precio) {
            precioInput.value = precio;
            this.calculateItemSubtotal(precioInput);
        }
        // Cargar arreglos disponibles del ítem
        const itemId = selectElement.value;
        arregloSelect.innerHTML = `<option value=\"\">Arreglo decorativo...</option>`;
        arregloPrecio.value = '';
        arregloToggle.checked = false;
        arregloSelect.style.display = 'none';
        arregloPrecio.style.display = 'none';
        if (!itemId) {
            arregloSelect.disabled = true;
            arregloToggle.disabled = true;
            return;
        }
        const item = this.data.items.find(i => i.id === itemId);
        if (item && item.arreglos && item.arreglos.length > 0) {
            item.arreglos.forEach(arr => {
                const opt = document.createElement('option');
                opt.value = arr.tipo;
                opt.textContent = `${arr.tipo} ($${arr.precio})`;
                opt.dataset.precio = arr.precio;
                arregloSelect.appendChild(opt);
            });
            arregloSelect.disabled = false;
            arregloToggle.disabled = false;
        } else {
            arregloSelect.disabled = true;
            arregloToggle.disabled = true;
        }
    }

    calculateItemSubtotal(inputElement) {
        const row = inputElement.closest('.proforma-item-row');
        const cantidad = parseInt(row.querySelector('input[placeholder="Cantidad"]').value) || 0;
        const precio = parseFloat(row.querySelector('input[placeholder="Precio unit."]').value) || 0;
        const duracion = parseInt(document.getElementById('alquilerDuracion')?.value || '1');
        const arregloPrecio = parseFloat(row.querySelector('input[data-role="arreglo-precio"]').value) || 0;
        const subtotal = (cantidad * precio * duracion) + (cantidad * arregloPrecio);
        
        const subtotalInput = row.querySelector('input[placeholder="Subtotal"]');
        subtotalInput.value = subtotal.toFixed(2);
        
        this.calculateProformaTotal();
    }

    onArregloChange(selectElement) {
        const row = selectElement.closest('.proforma-item-row');
        const selected = selectElement.selectedOptions[0];
        const precio = parseFloat(selected?.dataset?.precio || '0');
        const precioInput = row.querySelector('input[data-role="arreglo-precio"]');
        precioInput.value = precio ? precio.toFixed(2) : '';
        this.calculateItemSubtotal(precioInput);
    }

    toggleArreglo(checkboxEl) {
        const row = checkboxEl.closest('.proforma-item-row');
        const arregloSelect = row.querySelector('select[data-role="arreglo-select"]');
        const arregloPrecio = row.querySelector('input[data-role="arreglo-precio"]');
        
        if (checkboxEl.checked) {
            arregloSelect.style.display = 'block';
            arregloPrecio.style.display = 'block';
        } else {
            arregloSelect.style.display = 'none';
            arregloPrecio.style.display = 'none';
            arregloSelect.value = '';
            arregloPrecio.value = '';
            this.calculateItemSubtotal(arregloPrecio);
        }
    }

    updateTipoUnidad() {
        const tipoSelect = document.getElementById('alquilerTipo');
        const tipoUnidadSpan = document.getElementById('tipoUnidad');
        if (tipoSelect && tipoUnidadSpan) {
            tipoUnidadSpan.textContent = tipoSelect.value === 'dias' ? 'día' : 'hora';
        }
    }

    calculateProformaTotal() {
        let subtotal = 0;
        document.querySelectorAll('.proforma-item-row').forEach(row => {
            const subtotalInput = row.querySelector('input[placeholder="Subtotal"]');
            if (subtotalInput.value) {
                subtotal += parseFloat(subtotalInput.value);
            }
        });

        // Calcular costos adicionales
        const costoMontaje = parseFloat(document.getElementById('costoMontaje').value) || 0;
        const costoTransporte = parseFloat(document.getElementById('costoTransporte').value) || 0;
        const precioHoraGlobal = parseFloat(document.getElementById('precioHoraGlobal').value) || 0;
        const duracion = parseInt(document.getElementById('alquilerDuracion').value) || 1;
        
        // Calcular total incluyendo precio por hora global
        const costoHoraGlobal = precioHoraGlobal > 0 ? precioHoraGlobal * duracion : 0;
        const total = subtotal + costoMontaje + costoTransporte + costoHoraGlobal;

        // Actualizar desglose en la interfaz
        const subtotalElement = document.getElementById('subtotalItems');
        const montajeElement = document.getElementById('costoMontajeDisplay');
        const transporteElement = document.getElementById('costoTransporteDisplay');
        const horaGlobalElement = document.getElementById('costoHoraGlobalDisplay');
        const horaGlobalValueElement = document.getElementById('costoHoraGlobalValue');
        const tipoUnidadTotalElement = document.getElementById('tipoUnidadTotal');
        const totalElement = document.getElementById('proformaTotal');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
        if (montajeElement) montajeElement.textContent = `$${costoMontaje.toLocaleString()}`;
        if (transporteElement) transporteElement.textContent = `$${costoTransporte.toLocaleString()}`;
        
        if (horaGlobalElement && horaGlobalValueElement) {
            if (costoHoraGlobal > 0) {
                horaGlobalElement.style.display = 'block';
                horaGlobalValueElement.textContent = `$${costoHoraGlobal.toLocaleString()}`;
                if (tipoUnidadTotalElement) {
                    const tipo = document.getElementById('alquilerTipo')?.value || 'horas';
                    tipoUnidadTotalElement.textContent = tipo === 'dias' ? 'día' : 'hora';
                }
            } else {
                horaGlobalElement.style.display = 'none';
            }
        }
        
        if (totalElement) {
            totalElement.textContent = `$${total.toLocaleString()}`;
        }
    }
}

// Función global para agregar filas de arreglos
function addArregloRow(tipo = '', precio = '', descripcion = '') {
    const container = document.getElementById('arreglosContainer');
    const newRow = document.createElement('div');
    newRow.className = 'arreglo-row';
    newRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    newRow.innerHTML = `
        <input type="text" placeholder="Tipo de arreglo" class="form-input" style="flex: 1;" value="${tipo}">
        <input type="number" placeholder="Precio" class="form-input" style="width: 120px;" step="0.01" value="${precio}">
        <input type="text" placeholder="Descripción" class="form-input" style="flex: 1;" value="${descripcion}">
        <button type="button" class="btn btn-danger btn-icon" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

InventorySystem.prototype.showRecepcionModal = function(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        // Construir HTML de ítems con datos completos desde inventario
        const itemsHtml = proforma.items.map((pi) => {
            const inv = this.data.items.find(i => i.id === pi.item_id) || {};
            const unidad = inv.unidad || 'unidad';
            const codigo = inv.codigo || 'N/A';
            const categoria = inv.categoria || '';
            const nombre = pi.nombre || inv.nombre || 'Ítem';
            const solicitado = Number(pi.cantidad || 0);
            return `
                <div class="recepcion-item-card" data-item-id="${pi.item_id}">
                    <div class="recepcion-item-header">
                        <div class="item-info">
                            <h4 class="item-name">${nombre}</h4>
                            <div class="item-details">
                                <span class="item-code">Código: ${codigo}</span>
                                <span class="item-category">${categoria}</span>
                </div>
                        </div>
                        <div class="item-status-indicator">
                            <i class="fas fa-circle" style="color: var(--warning-400);"></i>
                            <span>Pendiente</span>
                        </div>
                    </div>
                    <div class="recepcion-item-content">
                        <div class="quantity-info">
                            <div class="quantity-box">
                                <label class="quantity-label">Solicitado</label>
                                <div class="quantity-value">${solicitado} ${unidad}</div>
                            </div>
                            <div class="quantity-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="quantity-box">
                                <label class="quantity-label">Recibido</label>
                                <input type="number" 
                                       class="form-input quantity-input" 
                                       min="0" 
                                       max="${solicitado}" 
                                       value="${solicitado}" 
                                       data-item-id="${pi.item_id}" 
                                       required
                                       onchange="inventorySystem.updateRecepcionItemStatus(this)">
                            </div>
                        </div>
                        <div class="status-section">
                            <div class="form-group">
                                <label class="form-label">Estado de Recepción</label>
                                <select class="form-input status-select" data-item-id="${pi.item_id}" onchange="inventorySystem.updateRecepcionItemStatus(this)">
                                    <option value="completo">✅ Completo</option>
                                    <option value="parcial">⚠️ Parcial</option>
                                    <option value="faltante">❌ Faltante</option>
                                    <option value="devuelto">🔄 Devuelto</option>
                                    <option value="perdido">💔 Perdido</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Observaciones</label>
                                <input type="text" 
                                       class="form-input" 
                                       placeholder="Notas específicas del ítem..."
                                       data-item-id="${pi.item_id}">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
        <form id="recepcionForm" class="form-compact">
            <!-- Información de la Proforma -->
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-file-invoice"></i> Información de la Proforma
                </div>
                <div class="form-row">
                <div class="form-group">
                        <label class="form-label">Número de Proforma</label>
                        <div class="form-input" style="background: var(--primary-50); border-color: var(--primary-200); font-weight: 600; color: var(--primary-700);">
                            ${proforma.numero}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cliente</label>
                        <div class="form-input" style="background: var(--gray-50);">
                            ${proforma.cliente.nombre}
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha de Creación</label>
                        <div class="form-input" style="background: var(--gray-50);">
                            ${this.formatDateTimeExact(proforma.fecha_creacion)}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total de la Proforma</label>
                        <div class="form-input" style="background: var(--success-50); border-color: var(--success-200); font-weight: 600; color: var(--success-700);">
                            $${proforma.total.toLocaleString()}
                        </div>
                    </div>
                </div>
                </div>
                
            <!-- Ítems a Recibir -->
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-boxes"></i> Ítems a Recibir
                    <span style="font-size: 0.875rem; font-weight: 400; color: var(--gray-600); margin-left: 0.5rem;">
                        (${proforma.items.length} ítem${proforma.items.length !== 1 ? 's' : ''})
                    </span>
                </div>
                
                <div id="recepcionItemsContainer">${itemsHtml}</div>
                            </div>
                
            <!-- Resumen de Recepción -->
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-clipboard-check"></i> Resumen de Recepción
                            </div>
                <div class="recepcion-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-number" id="totalItems">${proforma.items.length}</div>
                            <div class="stat-label">Total Ítems</div>
                            </div>
                        <div class="stat-item">
                            <div class="stat-number" id="completosItems">0</div>
                            <div class="stat-label">Completos</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" id="parcialesItems">0</div>
                            <div class="stat-label">Parciales</div>
                </div>
                        <div class="stat-item">
                            <div class="stat-number" id="faltantesItems">0</div>
                            <div class="stat-label">Faltantes</div>
                        </div>
                    </div>
                </div>
                </div>
                
            <!-- Información Adicional -->
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-notes-medical"></i> Información Adicional
                </div>
                <div class="form-row">
                <div class="form-group">
                    <label for="recepcionFecha" class="form-label">Fecha de Recepción *</label>
                    <input type="date" id="recepcionFecha" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="recepcionHora" class="form-label">Hora de Recepción</label>
                        <input type="time" id="recepcionHora" class="form-input" value="${new Date().toTimeString().slice(0, 5)}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="recepcionNotas" class="form-label">Notas Generales de Recepción</label>
                    <textarea id="recepcionNotas" class="form-input" rows="3" placeholder="Observaciones generales sobre la recepción, condiciones de los ítems, etc..."></textarea>
                </div>
                </div>
                
                <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                    <button type="submit" class="btn btn-success">
                    <i class="fas fa-check"></i> Confirmar Recepción
                    </button>
                </div>
            </form>
        `;

        this.showModal(`Registrar Recepción - ${proforma.numero}`, html);
        
    // Establecer fecha y hora actual
        document.getElementById('recepcionFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('recepcionHora').value = new Date().toTimeString().slice(0, 5);
        
        // Event listener para el formulario
        document.getElementById('recepcionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmarRecepcion(proformaId);
        });
    
    // Actualizar resumen inicial
    this.updateRecepcionSummary();
};

// Funciones auxiliares para el formulario de recepción mejorado
InventorySystem.prototype.updateRecepcionItemStatus = function(element) {
    const itemCard = element.closest('.recepcion-item-card');
    const itemId = element.dataset.itemId;
    const cantidadInput = itemCard.querySelector('.quantity-input');
    const statusSelect = itemCard.querySelector('.status-select');
    const statusIndicator = itemCard.querySelector('.item-status-indicator');
    
    const cantidadRecibida = parseInt(cantidadInput.value) || 0;
    const estado = statusSelect.value;
    
    // Actualizar indicador visual
    this.updateItemStatusIndicator(statusIndicator, estado, cantidadRecibida);
    
    // Actualizar resumen
    this.updateRecepcionSummary();
};

InventorySystem.prototype.updateItemStatusIndicator = function(indicator, estado, cantidad) {
    const icon = indicator.querySelector('i');
    const text = indicator.querySelector('span');
    
    // Remover clases de color existentes
    icon.className = 'fas fa-circle';
    
    switch(estado) {
        case 'completo':
            icon.style.color = 'var(--success-500)';
            text.textContent = 'Completo';
            break;
        case 'parcial':
            icon.style.color = 'var(--warning-500)';
            text.textContent = 'Parcial';
            break;
        case 'faltante':
            icon.style.color = 'var(--danger-500)';
            text.textContent = 'Faltante';
            break;
        case 'devuelto':
            icon.style.color = 'var(--info-500)';
            text.textContent = 'Devuelto';
            break;
        case 'perdido':
            icon.style.color = 'var(--danger-600)';
            text.textContent = 'Perdido';
            break;
        default:
            icon.style.color = 'var(--warning-400)';
            text.textContent = 'Pendiente';
    }
};

InventorySystem.prototype.updateRecepcionSummary = function() {
    const itemCards = document.querySelectorAll('.recepcion-item-card');
    let completos = 0, parciales = 0, faltantes = 0;
    
    itemCards.forEach(card => {
        const statusSelect = card.querySelector('.status-select');
        const estado = statusSelect.value;
        
        switch(estado) {
            case 'completo':
                completos++;
                break;
            case 'parcial':
                parciales++;
                break;
            case 'faltante':
                faltantes++;
                break;
        }
    });
    
    // Actualizar contadores
    const totalElement = document.getElementById('totalItems');
    const completosElement = document.getElementById('completosItems');
    const parcialesElement = document.getElementById('parcialesItems');
    const faltantesElement = document.getElementById('faltantesItems');
    
    if (completosElement) completosElement.textContent = completos;
    if (parcialesElement) parcialesElement.textContent = parciales;
    if (faltantesElement) faltantesElement.textContent = faltantes;
};

InventorySystem.prototype.confirmarRecepcion = function(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        const recepcionNotas = document.getElementById('recepcionNotas').value;
        const recepcionFecha = document.getElementById('recepcionFecha').value;
    const recepcionHora = document.getElementById('recepcionHora').value;

    // Combinar fecha y hora
    const fechaHoraCompleta = new Date(`${recepcionFecha}T${recepcionHora}:00`).toISOString();

        const recepciones = [];
    document.querySelectorAll('.recepcion-item-card').forEach(card => {
        const cantidadRecibida = parseInt(card.querySelector('.quantity-input').value) || 0;
        const estado = card.querySelector('.status-select').value;
        const observaciones = card.querySelector('input[placeholder*="Notas específicas"]').value;
        const itemId = card.dataset.itemId;
            
            recepciones.push({
                item_id: itemId,
                cantidad_solicitada: proforma.items.find(i => i.item_id === itemId).cantidad,
                cantidad_recibida: cantidadRecibida,
            estado: estado,
            observaciones: observaciones || null
            });
        });

        const recepcion = {
            id: this.generateId(),
            proforma_id: proformaId,
            fecha: recepcionFecha,
        hora: recepcionHora,
        fecha_hora_completa: fechaHoraCompleta,
            notas: recepcionNotas,
            items: recepciones,
            created_at: new Date().toISOString()
        };

        if (!this.data.recepciones) {
            this.data.recepciones = [];
        }
        this.data.recepciones.push(recepcion);

    // Actualizar inventario solo con ítems recibidos
        recepciones.forEach(rec => {
            const item = this.data.items.find(i => i.id === rec.item_id);
        if (item && rec.cantidad_recibida > 0) {
                item.cantidad_total += rec.cantidad_recibida;
                item.updated_at = new Date().toISOString();
            }
        });

    // Actualizar estado de la proforma
        proforma.estado_compuesto = 'cumplido';
        proforma.fecha_cumplimiento = new Date().toISOString();

    // Crear movimientos de inventario
        recepciones.forEach(rec => {
        if (rec.cantidad_recibida > 0) {
            this.createMovement(
                rec.item_id, 
                'entrada', 
                rec.cantidad_recibida, 
                `Recepción proforma ${proforma.numero}`, 
                `Estado: ${rec.estado}${rec.observaciones ? ` - ${rec.observaciones}` : ''}`
            );
        }
        });

        this.saveData();
    this.logAudit('confirm_recepcion', `Confirmó recepción de proforma ${proforma.numero} - ${recepciones.length} ítems`);

        this.closeModal();
        this.loadProformas();
        this.loadMovements();
        this.updateKPIs();
        this.showNotification('Recepción registrada exitosamente', 'success');
};

InventorySystem.prototype.showRecepcionesModal = function() {
        const recepciones = this.data.recepciones || [];
        
        const html = `
            <div class="recepciones-view">
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-history"></i> Historial de Recepciones
                </div>
                
                <!-- Filtros y búsqueda -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="recepcionSearch" class="form-label">Buscar</label>
                        <input type="text" id="recepcionSearch" class="form-input" placeholder="Buscar por proforma, cliente o notas...">
                    </div>
                    <div class="form-group">
                        <label for="recepcionDateFilter" class="form-label">Filtrar por fecha</label>
                        <input type="date" id="recepcionDateFilter" class="form-input">
                    </div>
                </div>
                
                <!-- Estadísticas rápidas -->
                <div class="form-row" style="margin-bottom: 1rem;">
                    <div style="background: var(--success-50); padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--success-200); flex: 1;">
                        <div style="font-size: 0.875rem; color: var(--success-700); font-weight: 600;">Total Recepciones</div>
                        <div style="font-size: 1.5rem; color: var(--success-800); font-weight: 700;">${recepciones.length}</div>
                    </div>
                    <div style="background: var(--info-50); padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--info-200); flex: 1;">
                        <div style="font-size: 0.875rem; color: var(--info-700); font-weight: 600;">Este Mes</div>
                        <div style="font-size: 1.5rem; color: var(--info-800); font-weight: 700;">${this.getRecepcionesEsteMes().length}</div>
                    </div>
                </div>
                </div>
                
                ${recepciones.length === 0 ? `
                <div class="form-section" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>No hay recepciones registradas</p>
                    </div>
                ` : `
                <div class="form-section">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha y Hora</th>
                                    <th>Proforma</th>
                                    <th>Cliente</th>
                                    <th>Ítems Recibidos</th>
                                    <th>Estado</th>
                                    <th>Notas</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="recepcionesTableBody">
                                ${this.renderRecepcionesTable(recepciones)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}
        </div>
    `;

    this.showModal('Historial de Recepciones', html, `
        <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="inventorySystem.exportRecepciones()">
            <i class="fas fa-download"></i> Exportar
        </button>
    `);
    
    // Event listeners para filtros
    document.getElementById('recepcionSearch').addEventListener('input', () => this.filterRecepciones());
    document.getElementById('recepcionDateFilter').addEventListener('change', () => this.filterRecepciones());
};

// Funciones auxiliares para recepciones
InventorySystem.prototype.getRecepcionesEsteMes = function() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return (this.data.recepciones || []).filter(recepcion => 
        new Date(recepcion.fecha) >= startOfMonth
    );
};

InventorySystem.prototype.renderRecepcionesTable = function(recepciones) {
    return recepciones.map(recepcion => {
                                    const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
        const fechaHora = new Date(recepcion.created_at || recepcion.fecha);
        const estadoGeneral = this.getEstadoGeneralRecepcion(recepcion);
        
                                    return `
                                        <tr>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                        <div style="font-weight: 600;">${this.formatDateWithTime(fechaHora.toISOString()).date}</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">${this.formatDateWithTime(fechaHora.toISOString()).time}</div>
                                            </td>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${proforma ? proforma.numero : 'Proforma eliminada'}
                                            </td>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${proforma ? proforma.cliente.nombre : 'N/A'}
                                            </td>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${recepcion.items.map(item => {
                                                    const itemData = this.data.items.find(i => i.id === item.item_id);
                        return `<div style="margin-bottom: 0.25rem;">
                            <span style="font-weight: 500;">${itemData ? itemData.nombre : 'Ítem eliminado'}</span><br>
                            <span style="font-size: 0.75rem; color: var(--gray-600);">
                                ${item.cantidad_recibida}/${item.cantidad_solicitada} unidades
                            </span>
                        </div>`;
                    }).join('')}
                </td>
                <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                    <span class="status-badge status-${estadoGeneral.toLowerCase()}">${estadoGeneral}</span>
                                            </td>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${recepcion.notas || 'Sin notas'}
                </td>
                <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="inventorySystem.viewRecepcionDetail('${recepcion.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

InventorySystem.prototype.getEstadoGeneralRecepcion = function(recepcion) {
    const estados = recepcion.items.map(item => item.estado);
    if (estados.every(estado => estado === 'completo')) return 'Completo';
    if (estados.some(estado => estado === 'perdido')) return 'Con Pérdidas';
    if (estados.some(estado => estado === 'devuelto')) return 'Parcial';
    return 'Parcial';
};

InventorySystem.prototype.filterRecepciones = function() {
    const searchTerm = document.getElementById('recepcionSearch').value.toLowerCase();
    const dateFilter = document.getElementById('recepcionDateFilter').value;
    const recepciones = this.data.recepciones || [];
    
    let filtered = recepciones.filter(recepcion => {
        const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
        const matchesSearch = !searchTerm || 
            (proforma && proforma.numero.toLowerCase().includes(searchTerm)) ||
            (proforma && proforma.cliente.nombre.toLowerCase().includes(searchTerm)) ||
            (recepcion.notas && recepcion.notas.toLowerCase().includes(searchTerm));
        
        const matchesDate = !dateFilter || recepcion.fecha === dateFilter;
        
        return matchesSearch && matchesDate;
    });
    
    document.getElementById('recepcionesTableBody').innerHTML = this.renderRecepcionesTable(filtered);
};

InventorySystem.prototype.viewRecepcionDetail = function(recepcionId) {
    const recepcion = this.data.recepciones.find(r => r.id === recepcionId);
    if (!recepcion) return;
    
    const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
    const fechaHora = new Date(recepcion.created_at || recepcion.fecha);
    
    const html = `
        <div class="recepcion-detail">
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-eye"></i> Detalle de Recepción
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Número de Proforma</label>
                        <div class="form-input" style="background: var(--gray-50);">${proforma ? proforma.numero : 'Proforma eliminada'}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cliente</label>
                        <div class="form-input" style="background: var(--gray-50);">${proforma ? proforma.cliente.nombre : 'N/A'}</div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha de Recepción</label>
                        <div class="form-input" style="background: var(--gray-50);">${this.formatDateWithTime(fechaHora.toISOString()).date}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hora de Recepción</label>
                        <div class="form-input" style="background: var(--gray-50);">${this.formatDateWithTime(fechaHora.toISOString()).time}</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notas</label>
                    <div class="form-input" style="background: var(--gray-50); min-height: 3rem;">${recepcion.notas || 'Sin notas'}</div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-list"></i> Ítems Recibidos
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ítem</th>
                                <th>Solicitado</th>
                                <th>Recibido</th>
                                <th>Estado</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recepcion.items.map(item => {
                                const itemData = this.data.items.find(i => i.id === item.item_id);
                                return `
                                    <tr>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                            <div style="font-weight: 500;">${itemData ? itemData.nombre : 'Ítem eliminado'}</div>
                                            <div style="font-size: 0.75rem; color: var(--gray-500);">${itemData ? itemData.codigo : 'N/A'}</div>
                                        </td>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100); text-align: center;">
                                            ${item.cantidad_solicitada}
                                        </td>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100); text-align: center;">
                                            <span style="font-weight: 600; color: var(--primary-600);">${item.cantidad_recibida}</span>
                                        </td>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                            <span class="status-badge status-${item.estado}">${item.estado}</span>
                                        </td>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                            ${item.observaciones || '-'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
            </div>
            </div>
        `;

    this.showModal(`Detalle de Recepción - ${proforma ? proforma.numero : 'N/A'}`, html, `
            <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="inventorySystem.printRecepcion('${recepcionId}')">
            <i class="fas fa-print"></i> Imprimir
        </button>
    `);
};

InventorySystem.prototype.exportRecepciones = function() {
    const recepciones = this.data.recepciones || [];
    const csvContent = this.generateRecepcionesCSV(recepciones);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recepciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showNotification('Recepciones exportadas exitosamente', 'success');
};

InventorySystem.prototype.generateRecepcionesCSV = function(recepciones) {
    const headers = ['Fecha', 'Hora', 'Proforma', 'Cliente', 'Ítem', 'Solicitado', 'Recibido', 'Estado', 'Notas'];
    const rows = [headers.join(',')];
    
    recepciones.forEach(recepcion => {
        const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
        const fechaHora = new Date(recepcion.created_at || recepcion.fecha);
        
        recepcion.items.forEach(item => {
            const itemData = this.data.items.find(i => i.id === item.item_id);
            const row = [
                this.formatDateWithTime(fechaHora.toISOString()).date,
                this.formatDateWithTime(fechaHora.toISOString()).time,
                proforma ? proforma.numero : 'N/A',
                proforma ? proforma.cliente.nombre : 'N/A',
                itemData ? itemData.nombre : 'Ítem eliminado',
                item.cantidad_solicitada,
                item.cantidad_recibida,
                item.estado,
                recepcion.notas || ''
            ];
            rows.push(row.map(field => `"${field}"`).join(','));
        });
    });
    
    return rows.join('\n');
};

InventorySystem.prototype.printRecepcion = function(recepcionId) {
    const recepcion = this.data.recepciones.find(r => r.id === recepcionId);
    if (!recepcion) return;
    
    const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
    const fechaHora = new Date(recepcion.created_at || recepcion.fecha);
    
    const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="color: #333; margin: 0;">RECEPCIÓN DE ADIMENTOS</h1>
                <p style="margin: 5px 0; color: #666;">Sistema de Inventario - Adimentos para Eventos</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Información General</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Proforma:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${proforma ? proforma.numero : 'N/A'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Cliente:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${proforma ? proforma.cliente.nombre : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Fecha:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDateWithTime(fechaHora.toISOString()).date}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Hora:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDateWithTime(fechaHora.toISOString()).time}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Ítems Recibidos</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 10px; border: 1px solid #333; text-align: left;">Ítem</th>
                            <th style="padding: 10px; border: 1px solid #333; text-align: center;">Solicitado</th>
                            <th style="padding: 10px; border: 1px solid #333; text-align: center;">Recibido</th>
                            <th style="padding: 10px; border: 1px solid #333; text-align: center;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recepcion.items.map(item => {
                            const itemData = this.data.items.find(i => i.id === item.item_id);
                            return `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${itemData ? itemData.nombre : 'Ítem eliminado'}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.cantidad_solicitada}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.cantidad_recibida}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.estado}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            ${recepcion.notas ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Notas</h3>
                    <p style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;">${recepcion.notas}</p>
                </div>
            ` : ''}
            
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
                <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
            </div>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
};

// Inicializar sistema
const inventorySystem = new InventorySystem();


