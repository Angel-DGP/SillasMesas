# Instrucciones para agregar el logo al sistema

## Opción 1: Imagen local (Recomendada)

1. **Descarga la imagen** que quieres usar como logo
2. **Guárdala** en la carpeta del proyecto con el nombre `logo.png`
3. **Asegúrate** de que sea una imagen cuadrada (recomendado: 200x200px o 400x400px)

## Opción 2: URL externa

Si prefieres usar una URL externa, puedes modificar el archivo `index.html` y cambiar:

```html
<img src="logo.png" alt="Logo del Sistema">
```

Por:

```html
<img src="https://tu-url-de-imagen.com/logo.png" alt="Logo del Sistema">
```

## Características del logo implementado:

- **Login**: Aparece en la pantalla de inicio de sesión (80x80px, circular)
- **Header**: Aparece en el header del dashboard (40x40px, circular)
- **Fallback**: Si la imagen no carga, se muestra el icono original
- **Responsive**: Se adapta automáticamente al tamaño del contenedor
- **Estilo**: Bordes redondeados y ajuste de imagen optimizado

## Formatos recomendados:
- PNG con transparencia
- JPG para fotos
- SVG para logos vectoriales
- Tamaño recomendado: 200x200px o mayor

## Ubicación de archivos:
```
SillasMesas/
├── index.html
├── script.js
├── logo.png  ← Aquí va tu logo
└── README.md
```

