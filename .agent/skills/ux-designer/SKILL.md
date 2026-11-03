---
name: UX Designer
description: Auditoría de flujos de usuario, contraste WCAG 2.1 y accesibilidad táctil para web móvil.
---

# UX Designer Directive

Al diseñar o modificar cualquier interfaz o componente:
1. **Target Táctil Móvil:** Cualquier elemento interactivo (botones, inputs, toggles, chips) debe medir como mínimo 44x44px de área de pulsación (padding generoso en móviles).
2. **Contraste y Legibilidad:**
   - Textos normales: contraste mínimo 4.5:1 contra el fondo.
   - Textos grandes o titulares: mínimo 3:1.
   - No colocar texto gris atenuado sobre fondos oscuros si el ratio cae por debajo de 4.5:1.
3. **Manejo de Estados:**
   - Todo botón debe tener estados visuales definidos: hover, active (presionado), focus-visible (navegación por teclado) y disabled.
   - Las acciones asíncronas (como cargar de Supabase o girar la ruleta) deben bloquear inputs repetidos para evitar condiciones de carrera o dobles cobros.
4. **Claridad de Error:** Errores en modales o pasarelas deben explicar exactamente qué falló y dar una ruta de escape clara (botón de cerrar o reintentar visible).