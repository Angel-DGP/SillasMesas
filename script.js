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
        document.getElementById('viewRecepcionesBtn').addEventListener('click', () => this.showRecepcionesModal());

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
        const tbody = document.querySelector('#proformasTable tbody');
        tbody.innerHTML = '';

        this.data.proformas.forEach(proforma => {
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

    filterProformas() {
        // Implementar filtro de proformas
    }

    showAddProformaModal() {
        this.showModal('Nueva Proforma', this.getProformaFormHTML());
        
        document.getElementById('proformaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProforma();
        });
    }

    getProformaFormHTML() {
        return `
            <form id="proformaForm">
                <!-- Información del Cliente -->
                <div class="section-title">
                    <i class="fas fa-user"></i> Información del Cliente
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="clienteNombre" class="form-label">Nombre del Cliente *</label>
                        <input type="text" id="clienteNombre" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="clienteTelefono" class="form-label">Teléfono</label>
                        <input type="tel" id="clienteTelefono" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="clienteDireccion" class="form-label">Dirección</label>
                    <input type="text" id="clienteDireccion" class="form-input">
                </div>
                
                <!-- Ítems de la Proforma -->
                <div class="section-title">
                    <i class="fas fa-list"></i> Ítems de la Proforma
                </div>
                
                <div id="proformaItemsContainer">
                    <div class="proforma-item-row">
                        <select class="form-input" style="flex: 1;">
                            <option value="">Seleccionar ítem...</option>
                            ${this.data.items.map(item => `<option value="${item.id}" data-precio="${item.costo_unitario}">${item.codigo} - ${item.nombre}</option>`).join('')}
                        </select>
                        <input type="number" placeholder="Cantidad" class="form-input" style="width: 100px;" min="1">
                        <input type="number" placeholder="Precio unit." class="form-input" style="width: 120px;" step="0.01">
                        <input type="number" placeholder="Subtotal" class="form-input" style="width: 120px;" step="0.01" readonly>
                        <button type="button" class="btn btn-danger btn-icon" onclick="this.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <button type="button" class="btn btn-secondary" onclick="inventorySystem.addProformaItem()">
                    <i class="fas fa-plus"></i> Agregar Ítem
                </button>
                
                <!-- Costos Adicionales -->
                <div class="section-title">
                    <i class="fas fa-calculator"></i> Costos Adicionales
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="costoMontaje" class="form-label">Costo de Montaje</label>
                        <input type="number" id="costoMontaje" class="form-input" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="costoTransporte" class="form-label">Costo de Transporte</label>
                        <input type="number" id="costoTransporte" class="form-input" min="0" step="0.01">
                    </div>
                </div>
                
                <!-- Notas -->
                <div class="form-group">
                    <label for="proformaNotas" class="form-label">Notas</label>
                    <textarea id="proformaNotas" class="form-input" rows="3" placeholder="Información adicional sobre la proforma..."></textarea>
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

    addProformaItem() {
        const container = document.getElementById('proformaItemsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'proforma-item-row';
        newRow.innerHTML = `
            <select class="form-input" style="flex: 1;">
                <option value="">Seleccionar ítem...</option>
                ${this.data.items.map(item => `<option value="${item.id}" data-precio="${item.costo_unitario}">${item.codigo} - ${item.nombre}</option>`).join('')}
            </select>
            <input type="number" placeholder="Cantidad" class="form-input" style="width: 100px;" min="1">
            <input type="number" placeholder="Precio unit." class="form-input" style="width: 120px;" step="0.01">
            <input type="number" placeholder="Subtotal" class="form-input" style="width: 120px;" step="0.01" readonly>
            <button type="button" class="btn btn-danger btn-icon" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(newRow);
    }

    saveProforma() {
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
            
            if (select.value && cantidad && precio) {
                const item = this.data.items.find(i => i.id === select.value);
                items.push({
                    item_id: select.value,
                    nombre: item.nombre,
                    cantidad: cantidad,
                    precio_unit: precio,
                    subtotal: cantidad * precio
                });
            }
        });

        const costoMontaje = parseFloat(document.getElementById('costoMontaje').value) || 0;
        const costoTransporte = parseFloat(document.getElementById('costoTransporte').value) || 0;
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
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
            notas: document.getElementById('proformaNotas').value
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

        const html = `
            <div class="proforma-view">
                <div class="proforma-header">
                    <h3>Proforma ${proforma.numero}</h3>
                    <p><strong>Cliente:</strong> ${proforma.cliente.nombre}</p>
                    <p><strong>Fecha:</strong> ${new Date(proforma.fecha_creacion).toLocaleDateString('es-ES')}</p>
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
            ${proforma.estado_compuesto !== 'cumplido' ? `
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
                    ${proforma.cliente.direccion ? `<p>Dirección: ${proforma.cliente.direccion}</p>` : ''}
                    <p>Fecha: ${new Date(proforma.fecha_creacion).toLocaleDateString('es-ES')}</p>
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
            this.addArregloRow(arreglo.tipo, arreglo.precio, arreglo.descripcion);
        });
        if (item.arreglos.length === 0) {
            this.addArregloRow();
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
                `"${new Date(item.created_at).toLocaleDateString('es-ES')}"`
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
                `"${new Date(proforma.fecha_creacion).toLocaleDateString('es-ES')}"`,
                `"${proforma.fecha_cumplimiento ? new Date(proforma.fecha_cumplimiento).toLocaleDateString('es-ES') : ''}"`,
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
                        this.logAudit('import_data', `Importó backup del ${new Date(backup.export_date).toLocaleDateString('es-ES')}`);
                        
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

    showRecepcionModal(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        const html = `
            <form id="recepcionForm">
                <div class="section-title">
                    <i class="fas fa-truck"></i> Registrar Recepción de Adimentos
                </div>
                
                <div class="form-group">
                    <label class="form-label">Proforma: ${proforma.numero}</label>
                    <p><strong>Cliente:</strong> ${proforma.cliente.nombre}</p>
                </div>
                
                <div class="section-title">
                    <i class="fas fa-list"></i> Cantidades Recibidas
                </div>
                
                <div id="recepcionItemsContainer">
                    ${proforma.items.map(item => `
                        <div class="recepcion-item-row" style="display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: end; padding: 1rem; background: var(--gray-50); border-radius: var(--radius); border: 1px solid var(--gray-200);">
                            <div style="flex: 1;">
                                <label class="form-label">${item.nombre}</label>
                                <p style="font-size: 0.875rem; color: var(--gray-600);">Solicitado: ${item.cantidad} unidades</p>
                            </div>
                            <div style="width: 150px;">
                                <label class="form-label">Cantidad Recibida *</label>
                                <input type="number" class="form-input" min="0" max="${item.cantidad}" value="${item.cantidad}" data-item-id="${item.item_id}" required>
                            </div>
                            <div style="width: 120px;">
                                <label class="form-label">Estado</label>
                                <select class="form-input" data-item-id="${item.item_id}">
                                    <option value="completo">Completo</option>
                                    <option value="parcial">Parcial</option>
                                    <option value="faltante">Faltante</option>
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="form-group">
                    <label for="recepcionNotas" class="form-label">Notas de Recepción</label>
                    <textarea id="recepcionNotas" class="form-input" rows="3" placeholder="Observaciones sobre la recepción..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="recepcionFecha" class="form-label">Fecha de Recepción *</label>
                    <input type="date" id="recepcionFecha" class="form-input" required>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-check"></i>
                        Confirmar Recepción
                    </button>
                </div>
            </form>
        `;

        this.showModal(`Registrar Recepción - ${proforma.numero}`, html);
        
        // Establecer fecha actual
        document.getElementById('recepcionFecha').value = new Date().toISOString().split('T')[0];
        
        // Event listener para el formulario
        document.getElementById('recepcionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmarRecepcion(proformaId);
        });
    }

    confirmarRecepcion(proformaId) {
        const proforma = this.data.proformas.find(p => p.id === proformaId);
        if (!proforma) return;

        const recepcionNotas = document.getElementById('recepcionNotas').value;
        const recepcionFecha = document.getElementById('recepcionFecha').value;

        // Recopilar cantidades recibidas
        const recepciones = [];
        document.querySelectorAll('.recepcion-item-row').forEach(row => {
            const cantidadRecibida = parseInt(row.querySelector('input[type="number"]').value);
            const estado = row.querySelector('select').value;
            const itemId = row.querySelector('input[type="number"]').dataset.itemId;
            
            recepciones.push({
                item_id: itemId,
                cantidad_solicitada: proforma.items.find(i => i.item_id === itemId).cantidad,
                cantidad_recibida: cantidadRecibida,
                estado: estado
            });
        });

        // Crear registro de recepción
        const recepcion = {
            id: this.generateId(),
            proforma_id: proformaId,
            fecha: recepcionFecha,
            notas: recepcionNotas,
            items: recepciones,
            created_at: new Date().toISOString()
        };

        // Guardar recepción
        if (!this.data.recepciones) {
            this.data.recepciones = [];
        }
        this.data.recepciones.push(recepcion);

        // Actualizar inventario
        recepciones.forEach(rec => {
            const item = this.data.items.find(i => i.id === rec.item_id);
            if (item) {
                item.cantidad_total += rec.cantidad_recibida;
                item.updated_at = new Date().toISOString();
            }
        });

        // Cambiar estado de la proforma a cumplido
        proforma.estado_compuesto = 'cumplido';
        proforma.fecha_cumplimiento = new Date().toISOString();

        // Crear movimiento de entrada
        recepciones.forEach(rec => {
            this.createMovement(rec.item_id, 'entrada', rec.cantidad_recibida, `Recepción proforma ${proforma.numero}`, `Estado: ${rec.estado}`);
        });

        this.saveData();
        this.logAudit('confirm_recepcion', `Confirmó recepción de proforma ${proforma.numero}`);

        this.closeModal();
        this.loadProformas();
        this.loadMovements();
        this.updateKPIs();
        this.showNotification('Recepción registrada exitosamente', 'success');
    }

    showRecepcionesModal() {
        const recepciones = this.data.recepciones || [];
        
        const html = `
            <div class="recepciones-view">
                <div class="section-title">
                    <i class="fas fa-history"></i> Historial de Recepciones
                </div>
                
                ${recepciones.length === 0 ? `
                    <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>No hay recepciones registradas</p>
                    </div>
                ` : `
                    <div class="table-container">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--gray-100);">
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200);">Fecha</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200);">Proforma</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200);">Cliente</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200);">Items</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200);">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recepciones.map(recepcion => {
                                    const proforma = this.data.proformas.find(p => p.id === recepcion.proforma_id);
                                    return `
                                        <tr>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${new Date(recepcion.fecha).toLocaleDateString('es-ES')}
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
                                                    return `${itemData ? itemData.nombre : 'Ítem eliminado'}: ${item.cantidad_recibida}/${item.cantidad_solicitada} (${item.estado})`;
                                                }).join('<br>')}
                                            </td>
                                            <td style="padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                                                ${recepcion.notas || 'Sin notas'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        this.showModal('Historial de Recepciones', html, `
            <button type="button" class="btn btn-secondary" onclick="inventorySystem.closeModal()">Cerrar</button>
        `);
    }
}

// Inicializar sistema
const inventorySystem = new InventorySystem();

