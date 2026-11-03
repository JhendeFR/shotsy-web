---
name: Web Artifacts Builder
description: Arquitectura de componentes React autocontenidos, tipados y sin efectos colaterales.
---

# Web Artifacts Builder Directive

1. **Aislamiento de Componentes:** Cada componente debe ser autocontenido y depender únicamente de sus props o de hooks de estado locales limpios.
2. **Resiliencia ante Fallos de Red:** Todo consumo de API externa (Supabase, analíticas) debe incluir valores de respaldo (fallback data) para que la UI nunca se quede en blanco.
3. **No Dependencias de Terceros Innecesarias:** Priorizar SVG nativo y CSS puro antes de instalar paquetes NPM pesados para iconos o utilidades simples.