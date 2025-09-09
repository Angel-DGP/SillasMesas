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
        document.getElementById('addItemBtn').addEventListener('click', () => this.showAddItemModal());
        document.getElementById('addProformaBtn').addEventListener('click', () => this.showAddProformaModal());
        document.getElementById('addMovementBtn').addEventListener('click', () => this.showAddMovementModal());

        // Filtros
        document.getElementById('searchItems').addEventListener('input', () => this.filterInventory());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterInventory());
        document.getElementById('searchProformas').addEventListener('input', () => this.filterProformas());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterProformas());
        document.getElementById('dateFromFilter').addEventListener('change', () => this.filterProformas());
        document.getElementById('dateToFilter').addEventListener('change', () => this.filterProformas());

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
            minute: '2-digit' 
        };
        document.getElementById('currentDateTime').textContent = now.toLocaleDateString('es-ES', options);
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
    }

    updateKPIs() {
        const totalItems = this.data.items.reduce((sum, item) => sum + item.cantidad_total, 0);
        const committedItems = this.data.items.reduce((sum, item) => sum + (item.comprometido || 0), 0);
        const pendingProformas = this.data.proformas.filter(p => !p.estado_retiro && !p.estado_cancelado).length;
        const totalIncome = this.data.proformas.reduce((sum, p) => {
            return sum + (p.pagos ? p.pagos.reduce((pSum, pago) => pSum + pago.monto, 0) : 0);
        }, 0);

        document.getElementById('totalItems').textContent = totalItems.toLocaleString();
        document.getElementById('committedItems').textContent = committedItems.toLocaleString();
        document.getElementById('pendingProformas').textContent = pendingProformas;
        document.getElementById('totalIncome').textContent = `$${totalIncome.toLocaleString()}`;
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
                <td>${new Date(proforma.fecha_creacion).toLocaleDateString('es-ES')}</td>
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

        this.data.movements
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .forEach(movement => {
                const item = this.data.items.find(i => i.id === movement.item_id);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(movement.fecha).toLocaleDateString('es-ES')}</td>
                    <td>${item ? item.nombre : 'Ítem eliminado'}</td>
                    <td><span class="status-badge ${movement.tipo === 'entrada' ? 'status-retirado-cancelado' : 'status-retirado-no-cancelado'}">${movement.tipo}</span></td>
                    <td>${movement.cantidad}</td>
                    <td>${movement.motivo}</td>
                    <td>${movement.nota}</td>
                `;
                tbody.appendChild(row);
            });
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
        document.getElementById('modalFooter').innerHTML = footer || `
            <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
        `;
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
        // Implementar carga de proformas
        console.log('Cargando proformas...');
    }

    filterProformas() {
        // Implementar filtro de proformas
    }

    showAddProformaModal() {
        // Implementar modal de nueva proforma
        this.showNotification('Funcionalidad de proformas en desarrollo', 'info');
    }

    viewProforma(proformaId) {
        // Implementar vista de proforma
        this.showNotification('Funcionalidad de proformas en desarrollo', 'info');
    }

    printProforma(proformaId) {
        // Implementar impresión de proforma
        this.showNotification('Funcionalidad de proformas en desarrollo', 'info');
    }

    editItem(itemId) {
        // Implementar edición de ítem
        this.showNotification('Funcionalidad de edición en desarrollo', 'info');
    }

    deleteItem(itemId) {
        // Implementar eliminación de ítem
        this.showNotification('Funcionalidad de eliminación en desarrollo', 'info');
    }

    exportInventory(format) {
        // Implementar exportación de inventario
        this.showNotification('Funcionalidad de exportación en desarrollo', 'info');
    }

    exportProformas(format) {
        // Implementar exportación de proformas
        this.showNotification('Funcionalidad de exportación en desarrollo', 'info');
    }

    backupData() {
        // Implementar backup de datos
        this.showNotification('Funcionalidad de backup en desarrollo', 'info');
    }

    importData(event) {
        // Implementar importación de datos
        this.showNotification('Funcionalidad de importación en desarrollo', 'info');
    }

    changePassword() {
        // Implementar cambio de contraseña
        this.showNotification('Funcionalidad de cambio de contraseña en desarrollo', 'info');
    }
}

// Función global para agregar filas de arreglos
function addArregloRow() {
    const container = document.getElementById('arreglosContainer');
    const newRow = document.createElement('div');
    newRow.className = 'arreglo-row';
    newRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    newRow.innerHTML = `
        <input type="text" placeholder="Tipo de arreglo" class="form-input" style="flex: 1;">
        <input type="number" placeholder="Precio" class="form-input" style="width: 120px;" step="0.01">
        <input type="text" placeholder="Descripción" class="form-input" style="flex: 1;">
        <button type="button" class="btn btn-danger btn-icon" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

// Inicializar sistema
const inventorySystem = new InventorySystem();
