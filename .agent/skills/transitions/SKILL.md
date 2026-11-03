---
name: Transitions
description: Catálogo de microinteracciones fluidas y transiciones aceleradas por hardware para CSS Modules.
---

# Transitions Directive

Toda animación debe cumplir estas reglas de rendimiento:
- Usar únicamente propiedades aceleradas por GPU: `transform` y `opacity`. Queda prohibido animar `height`, `width`, `top` o `margin`.
- Tiempos estándar:
  - Microinteracciones de botones: 150ms a 200ms `cubic-bezier(0.4, 0, 0.2, 1)`.
  - Entradas de modales / alertas: 250ms a 320ms con rebote suave `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Giros o cartas: 300ms a 600ms con timing amortiguado.