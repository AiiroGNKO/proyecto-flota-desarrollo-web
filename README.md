# Sistema de Control de Flota y Gestión de Combustible

> Plataforma fullstack para la gestión operativa, control de eficiencia (km/L) y monitoreo de mantenimiento de flotas de transporte en la Región del Maule.

## 1. Descripción del proyecto
- **Problema o necesidad**: Las pymes de transporte y distribución en Talca suelen llevar el control de consumo, mantenciones y documentación de vehículos en planillas manuales, perdiendo trazabilidad sobre los costos reales por kilómetro.
- **Usuarios objetivo**: Administradores de flota, encargados de logística y conductores.
- **Funcionalidades previstas**: Registro de vehículos, seguimiento de cargas de combustible, alertas de mantenimiento preventivo e integración con API de ruteo (OpenRouteService).
- **Funcionalidades ya implementadas**: Configuración del backend en Django, modelo `Vehiculo` con SQLite, panel de administración con registros, endpoint REST en JSON `/api/vehiculos/` y frontend en React integrado mediante Proxy.

## 2. Equipo
| Integrante | Rol | Usuario GitHub |
|---|---|---|
| Alan R. | Backend / Frontend / Documentación | @AiiroGNKO |

## 3. Stack y versiones
| Tecnología | Versión |
|---|---|
| Python | 3.13.9 / 3.14.0 |
| Django | 5.1.x |
| Node.js / npm | v24.21.0 / 11.19.0 |
| React / Vite | React 18+ / Vite 6+ |
| Base de datos | SQLite3 |

## 4. Arquitectura
Navegador (React - :5173) -> Proxy Vite -> Django API (:8000) -> ORM Django -> SQLite3.
Estrategia elegida: **React independiente consumiendo API con Proxy en Vite** para entorno de desarrollo.

## 5. Estructura del repositorio
```text
Proyecto_Flota_desarrollo_web/
├── backend/
│   ├── config/          # Configuración principal de Django
│   ├── flota/           # App de gestión de flota (models, views, urls)
│   ├── manage.py
│   └── requirements.txt # Dependencias de Python
├── frontend/
│   ├── src/             # Componentes React
│   ├── package.json
│   └── vite.config.js   # Configurado con proxy hacia Django
├── docs/img/            # Capturas de evidencia
└── .gitignore
