# REALESTATE — Flujo de ramas

`main` es la rama estable.

## Regla

Los cambios nuevos se implementan en ramas `feature/*`, `fix/*` o `chore/*` creadas desde `main`.

## Ciclo

1. Crear rama desde `main`.
2. Implementar un bloque funcional acotado.
3. Ejecutar build y tests disponibles.
4. Revisar el diff completo.
5. Crear Pull Request contra `main`.
6. Corregir cualquier check fallido.
7. Mergear solamente cuando el bloque esté validado.

## Producción

La validación debe priorizar el backend que realmente recibe tráfico en producción: las Edge Functions de Supabase.

Los tests del backend local se mantienen para compatibilidad, pero no sustituyen los tests de contrato de producción.

## Ramas históricas

Una rama antigua solo se elimina después de comprobar que no contiene commits únicos que deban rescatarse.