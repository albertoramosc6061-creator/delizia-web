# Delizia Bolivia — Sistema de Planificación y Gestión

Sistema web para **Delizia**, empresa boliviana de helados, lácteos y bebidas (planta en El Alto). Su módulo principal recomienda cuánto producir cada mes con un **árbol de decisión y el criterio del Valor Monetario Esperado (VME)**.

## 🚀 Cómo usar

Abre `login.html` en tu navegador. No requiere servidor.

## 🔐 Cuentas de demostración

| Rol | Usuario | Contraseña |
|-----|---------|-----------|
| Administrador | alexander@delizia.bo | admin123 |
| Empleado (jefa de producción) | paty@delizia.bo | paty123 |
| Empleado (ventas) | alan@delizia.bo | emp123 |
| Cliente (agencia) | Crea tu cuenta desde el login | — |

Tras 3 intentos fallidos seguidos la cuenta se bloquea 60 segundos.

## 📋 Funcionalidades

- **Planificación (VME)** — admin y empleado: datos del mes, validaciones (datos faltantes, probabilidades que no suman 100 %, capacidad de cámara fría), matriz de ganancias, árbol de decisión, VEIP, orden de producción y cierre del mes con ventas reales y merma.
- **Admin**: Dashboard, empleados, clientes, proveedores, productos, categorías, pedidos, bitácora y reportes.
- **Empleado**: Planificación, pedidos (actualizar estado), catálogo y lista de clientes.
- **Cliente**: Catálogo, realizar pedidos, historial y perfil.

## 🛠 Tecnologías

- HTML5 + CSS3 (Vanilla), colores y tipografía de la marca (delizia.bo)
- JavaScript (ES6+)
- `localStorage` como base de datos local y `sessionStorage` para la sesión

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `login.html` | Inicio de sesión, bloqueo por intentos y registro de clientes |
| `index.html` | App principal (paneles por rol) |
| `style.css` | Estilos globales |
| `app.js` | Lógica de negocio (CRUD, bitácora, reportes) |
| `planificacion.js` | Modelo de decisión: estimación de demanda, lotes, VME y órdenes de producción |
| `logo.jpg` | Logo anterior (ya no se usa en las pantallas) |
| `bg-login.jpg` | Fondo de pantalla de login |

> Los precios, costos y vida útil del catálogo y los datos de ejemplo de la planificación son **referenciales**.
