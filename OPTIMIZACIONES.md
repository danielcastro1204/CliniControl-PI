# Optimizaciones aplicadas a CliniControl

## Rendimiento — Backend (Spring Boot)

1. **Índices de base de datos faltantes** (`clinicontrolbackend/src/main/resources/db/migration/002_add_indexes.sql`)
   El esquema original no tenía ningún índice más allá de las claves primarias, a pesar de que
   *todas* las tablas se filtran por `clinic_id` (multi-tenant) y varias se consultan por
   claves foráneas (`patient_id`, `attention_id`, `product_id`, etc.). Sin estos índices, cada
   listado de pacientes, atenciones, inventario o RIPS obliga a un sequential scan que empeora
   a medida que crece la clínica. Es la optimización de mayor impacto del proyecto.

2. **Corrección de N+1 en `RipsService.generateAmparado`**
   Generaba el RIPS de un grupo de atenciones haciendo, por cada atención seleccionada, 4
   consultas separadas (atención, paciente, consultas, procedimientos) — es decir, hasta
   `4 × N` round-trips a la base de datos. Se reescribió para cargar todo en lote con
   consultas `IN (...)`, igual que ya se hacía correctamente en `AttentionService` y
   `ReportService`.

3. **Batching de Hibernate** (`application.properties`)
   Se activó `hibernate.jdbc.batch_size`, `order_inserts` y `order_updates` para que la
   creación de una atención con varias consultas/procedimientos (bucle de `.save()`
   individuales en `AttentionService`) se agrupe en menos round-trips a la base de datos.

## Rendimiento — Frontend (React + Vite)

4. **Code-splitting por ruta** (`App.tsx`)
   Las ~15 páginas se importaban todas de forma "eager" en el bundle inicial, incluyendo
   librerías pesadas como `jspdf`/`jspdf-autotable`/`html2canvas` (usadas solo en Reportes y
   RIPS) y catálogos estáticos grandes (municipios, atenciones). Ahora cada página se carga
   bajo demanda con `React.lazy` + `Suspense`. Verificado con build real: `jspdf.es.min`
   (416 KB) y `html2canvas` (201 KB) ya no forman parte del chunk principal.

5. **Eliminación de logging en caliente**
   El cliente HTTP (`integrations/api/client.ts`) y `AuthContext.tsx` emitían ~27
   `console.log` en *cada* petición (incluyendo, en algunos casos, fragmentos del JWT). Se
   sustituyeron por un `debugLog` gateado por `import.meta.env.DEV`, que Vite elimina por
   completo del bundle de producción. Se añadió también `esbuild.drop: ["debugger"]` en
   `vite.config.ts` como red de seguridad (se conserva `console.error` intencionalmente, ya
   que es la única visibilidad de errores en producción que tiene la app).

6. **Compresión gzip en Nginx** (`nginx.conf`)
   El servidor no comprimía ninguna respuesta. Se activó `gzip` para JS/CSS/SVG/JSON, que
   son justo los assets que sirve esta SPA.

## Limpieza — peso del proyecto

El zip original pesaba **~83 MB** casi en su totalidad por artefactos regenerables:

| Carpeta | Antes | Ahora |
|---|---|---|
| `clinicontrolmanagement/node_modules` | 386 MB | *(eliminado, se regenera con `npm install`)* |
| `clinicontrolmanagement/dist` | 2.2 MB | *(eliminado, se regenera con `npm run build`)* |
| `clinicontrolbackend/target` | 608 KB | *(eliminado, se regenera con `mvn package`)* |
| **Proyecto completo** | **390 MB** | **~2 MB** |

Además:

- Se eliminaron **18 dependencias npm sin uso real** (`package.json`): componentes shadcn de
  Radix nunca importados (`accordion`, `avatar`, `dropdown-menu`, `hover-card`, `menubar`,
  `navigation-menu`, `progress`, `radio-group`, `scroll-area`, `slider`, `toggle-group`,
  `context-menu`, `aspect-ratio`) y librerías completas nunca usadas (`recharts`,
  `embla-carousel-react`, `vaul`, `input-otp`, `react-resizable-panels`). Confirmado con
  búsqueda exhaustiva de imports antes de borrar cada una.
- Se eliminaron los **22 archivos `.tsx`/`.ts`** de `components/ui/` correspondientes a esos
  componentes sin uso, y la página muerta `pages/ComingSoon.tsx` (no estaba enrutada en
  `App.tsx` ni referenciada en ningún otro lugar).
- `package-lock.json` se regeneró desde cero con las dependencias limpias (verificado con
  `npm install` + build exitoso).

## Verificación

- `npm install` limpio: **465 paquetes** (antes bastantes más), sin errores.
- `npm run build`: build exitoso, chunks separados por ruta confirmados.
- Los errores de TypeScript preexistentes (`tsc --noEmit`) se compararon contra el proyecto
  original: son exactamente los mismos 12 errores, ninguno introducido por estos cambios, y
  quedan fuera del alcance de "rendimiento y limpieza" pedido (son incompatibilidades de tipos
  en el cliente API mock, no afectan la ejecución en runtime porque JS no tipado ya
  funcionaba así).
- El backend no se pudo compilar en este entorno (no hay Maven/red a Maven Central
  disponible), pero los cambios son localizados y de bajo riesgo: dos métodos nuevos de
  Spring Data JPA derivados por nombre (`findByIdInAndClinicId`, patrón estándar ya usado en
  el resto del código), y una migración SQL adicional con `IF NOT EXISTS`.

## Siguiente paso recomendado (no incluido, requiere tu decisión)

- `clinicontrolbackend/.env` y `clinicontrolmanagement/.env` están incluidos en el zip pese a
  que ambos `.gitignore` los excluyen — probablemente terminaron ahí sin querer. No los toqué
  porque no es un tema de rendimiento, pero si contienen credenciales reales conviene
  rotarlas y no versionarlas.
