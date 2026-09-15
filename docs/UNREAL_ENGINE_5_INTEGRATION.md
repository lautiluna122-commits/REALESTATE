# REALESTATE + Unreal Engine 5

## Objetivo

REALESTATE mantiene la fuente de verdad de cada proyecto y Unreal Engine 5 se convierte en el renderer premium del showroom. La web no debe duplicar inventario, precios ni publicaciones.

```text
REALESTATE Platform
  ├─ companies
  ├─ projects
  ├─ buildings / floors / units
  ├─ assets / plans / amenities
  ├─ publication
  └─ experience config
          │
          ├─ web renderer (fallback)
          │
          └─ Unreal Engine 5 renderer
                    │
                    └─ Pixel Streaming 2
                              │
                              ↓
                       /proyecto/:slug
```

## Contrato de datos

Un proyecto publicado ya expone los datos necesarios en el endpoint público del proyecto. Unreal debe consumir ese contrato y nunca mantener una copia manual de precios/disponibilidad.

Conceptualmente:

```json
{
  "project": {},
  "publication": {},
  "buildings": [],
  "floors": [],
  "units": [],
  "plans": [],
  "amenities": [],
  "assets": [],
  "location": {},
  "experience": {
    "engine": "unreal",
    "model": {
      "scale": 1,
      "position": [0, -1, 0],
      "rotation": [0, 0, 0]
    },
    "hotspots": {},
    "unreal": {
      "playerUrl": "https://...",
      "streamId": "..."
    }
  }
}
```

## Unreal Engine

La primera implementación recomendada es **Unreal Engine 5 + Pixel Streaming 2**. El proyecto UE se ejecuta en una máquina con GPU y transmite la experiencia interactiva al navegador mediante WebRTC. El usuario no instala Unreal.

Para producción, la infraestructura de Pixel Streaming debe corresponder a la versión exacta de UE utilizada.

## Responsabilidades

### REALESTATE

- autenticación
- empresas
- proyectos
- inventario
- precios
- disponibilidad
- assets
- planos
- leads
- publicación
- configuración de experiencia

### Unreal

- iluminación
- materiales
- Lumen/Nanite cuando corresponda
- vegetación/entorno
- océano/agua
- interiores
- cámaras cinematográficas
- navegación
- selección visual de unidades
- animaciones
- día/noche
- experiencia inmersiva

### Sincronización

Al iniciar una sesión, Unreal recibe el `publicSlug` y obtiene el manifiesto publicado. Las acciones de selección deben trabajar con IDs de unidad reales, no con nombres visuales.

Ejemplo de evento:

```json
{
  "type": "UNIT_SELECTED",
  "unitId": "unit-402"
}
```

La web puede responder mostrando la ficha comercial de esa unidad. Los cambios de precio/estado se siguen haciendo en REALESTATE y no en Unreal.

## Pixel Streaming 2

Usar Pixel Streaming 2 para la entrega al navegador. Mantener separada la infraestructura de señalización/streaming del frontend Vercel. Vercel aloja la aplicación web; el servidor Unreal/GPU aloja la instancia de UE.

## Estrategia de fallback

Si `experience.engine !== "unreal"` o no existe un `playerUrl` válido, el showroom utiliza el renderer WebGL actual. Así cada proyecto puede publicarse sin bloquearse por infraestructura GPU.

## Orden de implementación

1. Terminar Owner/Client Project Builder.
2. Estabilizar el contrato público del proyecto.
3. Crear proyecto UE5 base.
4. Crear nivel de showroom reutilizable.
5. Importar un proyecto real como primer caso.
6. Implementar selección de unidad por `unitId`.
7. Implementar día/noche y navegación.
8. Integrar Pixel Streaming 2.
9. Conectar el player al `/proyecto/:slug`.
10. Añadir telemetría y leads.

No se debe crear un proyecto Unreal distinto por cada constructora. El objetivo es un **renderer UE reutilizable** alimentado por el mismo modelo de datos de REALESTATE.
