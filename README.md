# Sistema de Inventario - Adimentos para Eventos

Sistema completo de gestión de inventario diseñado para administrar adimentos de eventos (sillas, mesas, manteles, accesorios) con funcionalidades de proformas, control de stock y reportes.

## 🚀 Características Principales

### ✅ Gestión de Inventario
- **CRUD completo** de adimentos (Crear, Leer, Actualizar, Eliminar)
- **Control de stock** en tiempo real (total, comprometido, disponible)
- **Categorización** de ítems (Sillas, Mesas, Manteles, Accesorios, Decoración)
- **Ubicación** y **códigos únicos** para cada ítem
- **Costos unitarios** opcionales

### ✅ Sistema de Proformas
- **Creación de proformas** con múltiples ítems
- **Estados compuestos**: Sin retirar/Retirado + Cancelado/No cancelado
- **Costos adicionales**: Montaje y transporte
- **Reserva automática** de stock al crear proforma
- **Control de pagos** (parciales y totales)
- **Numeración automática** (PF-YYYYMMDD-XXX)

### ✅ Dashboard y Reportes
- **KPIs en tiempo real**: Total ítems, comprometidos, proformas pendientes, ingresos
- **Gráficas interactivas**:
  - Top 5 ítems más solicitados (barras)
  - Inventario ocupado vs libre (pie)
  - Tendencia de movimientos mensuales (línea)
- **Proformas recientes** con vista rápida

### ✅ Movimientos de Inventario
- **Registro de entradas** con motivo y fecha
- **Historial completo** de movimientos
- **Trazabilidad** de cambios en stock
- **Filtros** por tipo y fecha

### ✅ Exportación e Impresión
- **Exportar inventario** a CSV/JSON
- **Exportar proformas** a CSV/JSON
- **Impresión** de proformas con formato profesional
- **Backup completo** del sistema
- **Importación** de datos desde backup

### ✅ Seguridad y Auditoría
- **Autenticación** con contraseña
- **Sesión persistente** (localStorage)
- **Auditoría completa** de todas las acciones
- **Validaciones** de negocio integradas

## 🛠️ Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere servidor (funciona completamente local)

### Instalación
1. **Descargar archivos**:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Abrir en navegador**:
   - Hacer doble clic en `index.html`
   - O arrastrar el archivo al navegador

### Acceso Inicial
- **Contraseña por defecto**: `admin123`
- **Cambiar contraseña**: Ir a Configuración → Cambiar Contraseña

## 📋 Guía de Uso

### 1. Configuración Inicial
1. **Cambiar contraseña** en la sección Configuración
2. **Agregar categorías** si es necesario (editar en el código)
3. **Crear ítems iniciales** en la sección Inventario

### 2. Gestión de Inventario
1. **Agregar ítem**:
   - Clic en "Nuevo Ítem"
   - Completar formulario (código, nombre, categoría, cantidad inicial)
   - El sistema creará automáticamente el movimiento de entrada

2. **Registrar entrada**:
   - Clic en "Registrar Entrada" en Movimientos
   - Seleccionar ítem y cantidad
   - Especificar motivo (ej: "Compra proveedor")

3. **Ver inventario**:
   - Sección Inventario muestra tabla completa
   - Filtros por nombre/código y categoría
   - Columnas: Total, Comprometido, Disponible

### 3. Gestión de Proformas
1. **Crear proforma**:
   - Clic en "Nueva Proforma"
   - Completar datos del cliente
   - Agregar ítems con cantidades y precios
   - El sistema reserva automáticamente el stock

2. **Estados de proforma**:
   - **Sin retirar y no cancelado**: Proforma creada, stock reservado
   - **Sin retirar y cancelado**: Pagada pero no retirada
   - **Retirado y no cancelado**: Entregada pero no pagada
   - **Retirado y cancelado**: Completamente finalizada

3. **Marcar retiro**:
   - Al marcar como retirado, el stock se consume definitivamente
   - No se puede editar una proforma retirada

4. **Registrar pagos**:
   - Usar la función de pagos para marcar como cancelado
   - Se puede registrar pagos parciales

### 4. Dashboard y Reportes
1. **Vista general**:
   - KPIs principales en la parte superior
   - Gráficas de tendencias
   - Lista de proformas recientes

2. **Exportar datos**:
   - Sección Reportes
   - Exportar inventario o proformas a CSV/JSON
   - Crear backup completo del sistema

## 🔧 Estructura Técnica

### Archivos del Sistema
```
SillasMesas/
├── index.html          # Interfaz principal
├── styles.css          # Estilos y diseño
├── script.js           # Lógica de negocio
└── README.md           # Documentación
```

### Almacenamiento de Datos
- **localStorage**: Persistencia local en el navegador
- **Estructura JSON**: Datos organizados en objetos
- **Backup automático**: Exportación/importación de datos

### Modelo de Datos
```javascript
// Estructura principal
{
  items: [],           // Adimentos del inventario
  proformas: [],       // Proformas creadas
  movements: [],       // Movimientos de stock
  audit: [],          // Registro de auditoría
  settings: {         // Configuración del sistema
    password: 'admin123',
    categories: ['Sillas', 'Mesas', ...]
  }
}
```

## 🎯 Casos de Uso Implementados

### CU-01: Login/Acceso del Administrador ✅
- Autenticación con contraseña
- Sesión persistente
- Máximo 5 intentos (opcional)

### CU-02: Registrar nuevo adimento ✅
- Formulario completo con validaciones
- Código único obligatorio
- Categorización automática

### CU-03: Ingresar stock ✅
- Registro de entradas con motivo
- Actualización automática de inventario
- Trazabilidad completa

### CU-04: Registrar salida (proforma) ✅
- Creación de proformas con múltiples ítems
- Reserva automática de stock
- Validación de disponibilidad

### CU-05: Generar proforma ✅
- Formato profesional imprimible
- Cálculos automáticos
- Numeración secuencial

### CU-06: Administrar estado de proforma ✅
- 4 estados compuestos
- Cambios de estado con fechas
- Consumo de stock al retirar

### CU-07: Registrar devolución ✅
- Sistema de movimientos de entrada
- Actualización de inventario

### CU-08: Consultar inventario ✅
- Vista en tiempo real
- Filtros y búsqueda
- Indicadores de disponibilidad

### CU-09: Reportes / Dashboard ✅
- KPIs principales
- 3 tipos de gráficas
- Filtros por fecha y estado

### CU-10: Exportar / Imprimir ✅
- Exportación CSV/JSON
- Impresión de proformas
- Backup completo

## 🔒 Reglas de Negocio Implementadas

1. **No se puede reservar más stock del disponible**
2. **Reservar reduce disponible y aumenta comprometido**
3. **Al retirar, se consume stock definitivamente**
4. **Proforma editable solo si no fue retirada**
5. **Pago total marca como cancelado automáticamente**
6. **Auditoría obligatoria para todas las acciones**

## 🚨 Validaciones Implementadas

- **Códigos únicos** para ítems
- **Stock disponible** antes de reservar
- **Campos obligatorios** en formularios
- **Contraseña mínima** de 6 caracteres
- **Números positivos** en cantidades y precios
- **Fechas válidas** en movimientos

## 📱 Responsive Design

- **Desktop**: Vista completa con sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Navegación horizontal, formularios optimizados

## 🔄 Flujo de Trabajo Típico

1. **Configuración inicial**: Cambiar contraseña, agregar ítems
2. **Gestión diaria**: Crear proformas, registrar entradas
3. **Seguimiento**: Dashboard para monitorear estado
4. **Finalización**: Marcar retiros y pagos
5. **Reportes**: Exportar datos periódicamente

## 🆘 Solución de Problemas

### Datos no se guardan
- Verificar que el navegador soporte localStorage
- No usar modo incógnito

### Gráficas no aparecen
- Verificar conexión a internet (Chart.js CDN)
- Recargar la página

### Error al imprimir
- Verificar que el navegador permita ventanas emergentes
- Usar Ctrl+P como alternativa

## 🔮 Próximas Mejoras Sugeridas

1. **Códigos de barras** para ítems
2. **Notificaciones** de stock bajo
3. **Historial de precios**
4. **Múltiples ubicaciones**
5. **Integración con impresoras** térmicas
6. **API REST** para integraciones
7. **Base de datos** externa
8. **Múltiples usuarios** con roles

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al desarrollador.

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2024  
**Desarrollado por**: Didier
# SillasMesas
