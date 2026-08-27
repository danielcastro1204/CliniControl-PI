<div align="center">

<img src="https://raw.githubusercontent.com/githubocto/flat-ui/main/.github/placeholder-logo.png" width="0" height="0" alt="" />

# CliniControl

**Plataforma web integral de gestión administrativa para consultorios odontológicos pequeños**

Inventario clínico · Pacientes y atenciones · Generación de RIPS · Autenticación por roles

[![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](#)
[![License](https://img.shields.io/badge/status-MVP%20académico-yellow)](#)

</div>

---

## Tabla de contenido

- [¿Qué es CliniControl?](#qué-es-clinicontrol)
- [El problema](#el-problema)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [API REST](#api-rest)
- [Roles y seguridad](#roles-y-seguridad)
- [Limitaciones del MVP](#limitaciones-del-mvp)
- [Riesgos y mitigaciones](#riesgos-y-mitigaciones)
- [Presupuesto y viabilidad](#presupuesto-y-viabilidad)
- [Roadmap (v2.0)](#roadmap-v20)
- [Lecciones aprendidas](#lecciones-aprendidas)
- [Equipo](#equipo)

---

## ¿Qué es CliniControl?

En Colombia existen cerca de **8.726 consultorios odontológicos**, la gran mayoría pequeños e independientes, donde el inventario de insumos clínicos, el registro de pacientes y la generación de reportes **RIPS** para aseguradoras todavía se llevan en cuadernos, hojas de cálculo sueltas o documentos sin ninguna integración entre sí.

**CliniControl** es una plataforma web que centraliza esa operación en un solo sistema: inventario clínico con trazabilidad por lote, historia de atenciones por paciente y generación automática del JSON normativo de RIPS — todo con acceso seguro por roles y aislamiento total de datos por clínica (**multi-tenant**).

El proyecto es el trabajo final de un equipo de tres estudiantes de la **Facultad Barberi de Ingeniería, Diseño y Ciencias Aplicadas — Universidad Icesi** (Cali, Colombia, 2026), desarrollado en 4 sprints a lo largo de 18 semanas, cumpliendo el 100 % de los requerimientos funcionales y no funcionales planteados.

## El problema

Los consultorios pequeños enfrentan una brecha tecnológica real: las soluciones del mercado o son ERPs hospitalarios costosos y complejos, o son genéricas y no contemplan particularidades del sector odontológico como la trazabilidad de insumos por vencimiento o la estructura RIPS del Ministerio de Salud. Esto genera:

| Problema | Consecuencia |
|---|---|
| Procesos manuales y repetitivos | Horas administrativas que restan tiempo a la atención del paciente |
| Errores humanos en el ingreso de datos | Inconsistencias de stock, errores de registro, glosas o rechazos de RIPS |
| Ausencia de trazabilidad | Imposible saber qué insumo se usó, en qué atención, quién lo registró y cuándo |

## Funcionalidades

CliniControl se organiza en **4 módulos**, entregados en 4 sprints con 95 story points en total:

<table>
<tr><td width="25%" valign="top">

### Inventario clínico
`Sprint 1 · 32 SP`

</td><td>

- Registro de insumos (nombre, categoría, lote, cantidad, proveedor, fecha de vencimiento, etc.)
- Edición de insumos existentes
- Consulta con filtros por nombre, marca, proveedor, estado de alerta y nivel de stock
- **Semaforización de vencimientos** (verde / amarillo / rojo) según proximidad al vencimiento
- Registro de consumo asociado a paciente y atención
- **Descuento automático de stock** en tiempo real

</td></tr>
<tr><td valign="top">

### Gestión de pacientes
`Sprint 2 · 19 SP`

</td><td>

- Registro de pacientes: documento, fecha de nacimiento, sexo, tipo de usuario (régimen de salud) y estado del tratamiento
- Consulta y edición con filtros por tipo de usuario, sexo y estado de tratamiento
- Registro de atenciones clínicas vinculando paciente, odontólogo, consultas y procedimientos

</td></tr>
<tr><td valign="top">

### RIPS y reportes
`Sprint 3 · 24 SP`

</td><td>

- **Exportación JSON para RIPS** conforme a la normativa vigente del Ministerio de Salud, diferenciando pacientes particulares y amparados
- Informe de inventario descargable en **PDF**
- Exportación de inventario en **CSV** para análisis externo

</td></tr>
<tr><td valign="top">

### Autenticación y acceso
`Sprint 4 · 20 SP`

</td><td>

- Login seguro con **JWT** (HMAC-SHA256), tokens con vigencia de 2 horas
- **RBAC** con tres roles: `admin`, `clinico`, `system_admin`, con permisos específicos por módulo
- Gestión de usuarios clínicos por parte del administrador del consultorio
- **Multi-tenant**: aislamiento total de datos por `clinic_id`

</td></tr>
</table>

## Arquitectura

Aplicación web de **tres capas**, desplegada con Docker Compose, con separación estricta entre presentación, lógica de negocio y persistencia:

| Capa | Tecnología | Propósito | Puerto |
|---|---|---|---|
| **Presentación** | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui, servido con Nginx | SPA que consume la API REST | `8080` |
| **Negocio** | Spring Boot 3.5 (Java 25) + Spring Security + JWT + Spring Data JPA | API REST con lógica de negocio, seguridad y acceso a datos | `3000` |
| **Persistencia** | PostgreSQL 16 (alpine), volumen Docker `pgdata` | Motor relacional con aislamiento multi-tenant | `5432` |
| **Infraestructura** | Docker + Docker Compose | Orquestación con red *bridge* interna y healthchecks en cascada (`db → backend → frontend`) | — |

### Componentes del backend

```
com.clinicontrol
├── config/       → JacksonConfig, AppRoleConverter, RequestLoggingFilter
├── controller/    → 15 REST controllers (Auth, Patients, Dentists, Attentions, Products, RIPS, Reports…)
├── entity/       → Entidades JPA (Clinic, Patient, Dentist, Attention, Product, ProductInstance…)
├── repository/   → Repositorios Spring Data, todos filtrados por clinic_id
├── security/     → JwtProvider, JwtAuthenticationFilter, SecurityConfig, RateLimitFilter
└── service/      → Lógica de negocio (Attention, Inventory, Patient, Product, Report, RIPS)
```

### Comunicación entre componentes

```
Navegador ──HTTP/HTTPS──▶ Frontend (Nginx :8080)
Frontend ──REST/JSON + JWT (Authorization: Bearer <token>)──▶ Backend (Spring Boot :3000)
Backend ──JDBC (red Docker interna)──▶ PostgreSQL (:5432)
```

- Cada consumo de insumo registrado durante una atención **descuenta el inventario automáticamente**, guardando trazabilidad de insumo, lote, paciente, fecha y responsable.
- Las atenciones, consultas y procedimientos registrados alimentan directamente la generación del JSON RIPS.
- El token JWT incluye el `clinic_id` del usuario; todos los repositorios JPA filtran automáticamente por ese valor, garantizando que cada consultorio solo vea sus propios datos.

## Modelo de datos

Todas las tablas usan **UUID** como llave primaria (`gen_random_uuid()`), registran `created_at` / `updated_at`, y — salvo las de autenticación global — incluyen `clinic_id` como llave foránea para el aislamiento multi-tenant.

| Dominio | Tablas |
|---|---|
| **Autenticación y usuarios** | `clinics`, `auth_users`, `profiles`, `user_roles` |
| **Gestión clínica** | `dentists`, `patients`, `attentions`, `consultas`, `procedimientos` |
| **Inventario** | `products`, `product_instances`, `inventory_movements` |

Las migraciones SQL (`001_initial_schema.sql`, `002_add_indexes.sql`) se ejecutan automáticamente al levantar el backend y se gestionan manualmente en lugar de dejar que Hibernate genere el esquema, dando control total sobre índices y relaciones en producción.

## Stack tecnológico

**Backend**
- Java 25 · Spring Boot 3.5 · Spring Security · Spring Data JPA / Hibernate
- PostgreSQL 16 (driver JDBC)
- JJWT (io.jsonwebtoken) para tokens JWT firmados con HMAC-SHA256
- Lombok

**Frontend**
- React 18 + TypeScript · Vite (con `@vitejs/plugin-react-swc`)
- TailwindCSS + shadcn/ui + Radix UI
- React Router, React Hook Form + Zod, TanStack Query
- jsPDF / jsPDF-autotable (reportes en PDF)
- Vitest + Testing Library + Playwright (pruebas)

**Infraestructura**
- Docker multi-stage builds (Maven → JRE Alpine / Node → Nginx Alpine)
- Docker Compose con healthchecks encadenados
- GitHub (control de versiones)

## Estructura del repositorio

```
CliniControl/
├── docker-compose.yml              # Orquesta db + backend + frontend
├── OPTIMIZACIONES.md               # Historial de mejoras de performance aplicadas
├── clinicontrolbackend/            # API REST — Spring Boot
│   ├── src/main/java/com/clinicontrol/
│   └── src/main/resources/db/migration/
└── clinicontrolmanagement/         # SPA — React + Vite
    └── src/
        ├── pages/                  # inventory, patients, attentions, rips, reports, users
        ├── components/             # ui, auth, dashboard, landing
        ├── contexts/, store/       # AuthContext + stores por dominio
        └── integrations/api/       # cliente HTTP hacia el backend
```

## Puesta en marcha

### Requisitos previos

- Docker y Docker Compose
- (Opcional, para desarrollo local sin contenedores) Java 25 + Maven, Node.js 20+

### Opción 1 — Con Docker Compose (recomendado)

```bash
git clone https://github.com/<tu-usuario>/CliniControl.git
cd CliniControl

# Configura tus propias credenciales antes de levantar el stack (ver sección de abajo)
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend / API | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

Los healthchecks garantizan el orden de arranque: `db` (saludable) → `backend` → `frontend`.

### Opción 2 — Desarrollo local sin Docker

**Backend**

```bash
cd clinicontrolbackend
# Configura las variables de entorno (ver más abajo) o exporta un .env
mvn spring-boot:run
```

**Frontend**

```bash
cd clinicontrolmanagement
npm install
npm run dev
```

### Pruebas

```bash
# Backend
cd clinicontrolbackend && mvn test

# Frontend
cd clinicontrolmanagement && npm run test        # Vitest
npx playwright test                              # E2E (si están configuradas)
```

## Variables de entorno

> **Importante:** el repositorio incluye valores de ejemplo únicamente para desarrollo local. **Nunca uses credenciales por defecto en producción** — genera un `JWT_SECRET` propio y una contraseña de base de datos robusta.

**Backend** (`clinicontrolbackend/.env` o variables del entorno)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` / `db` (en Docker) |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `clinicontrol` |
| `DB_USER` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | *(definir la tuya)* |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | *(cadena aleatoria segura)* |
| `PORT` | Puerto del backend | `3000` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (coma-separados) | `http://localhost:8080` |

**Frontend** (`clinicontrolmanagement/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

## API REST

Todas las rutas (salvo `/auth/v1/*` y `/health`) requieren el header `Authorization: Bearer <token>`.

**Autenticación** — `/auth/v1`
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/sign-up` | Registro de usuario / clínica |
| `POST` | `/sign-in` | Inicio de sesión (devuelve JWT) |
| `GET` | `/user` | Usuario autenticado actual |
| `POST` | `/sign-out` | Cierre de sesión |

**Recursos clínicos** — CRUD estándar (`GET`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`) bajo `/rest/v1/…`:

`patients` · `dentists` · `attentions` · `consultas` · `procedimientos` · `products` (+ `GET /with-stock`) · `product_instances` · `profiles` · `user_roles`

**Inventario** — `/rest/v1/inventory_movements`
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Listado de movimientos |
| `POST` | `/` | Registrar movimiento |
| `POST` | `/consume` | Registrar consumo (descuenta stock automáticamente) |
| `DELETE` | `/{id}` | Eliminar movimiento |

**RIPS** — `/rest/v1/rips`
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/attentions` | Atenciones disponibles para generar RIPS |
| `GET` | `/particular/{attentionId}` | JSON RIPS de un paciente particular |
| `POST` | `/amparado` | JSON RIPS para pacientes amparados (por lote) |

**Reportes** — `/rest/v1/reports`
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/inventory` | Reporte de inventario en PDF |
| `GET` | `/inventory/csv` | Reporte de inventario en CSV |

**Administración** — `/functions/v1/create-clinic-user` (creación de usuarios clínicos) · `GET /health` (estado del servicio)

## Roles y seguridad

| Rol | Alcance |
|---|---|
| `admin` | Administra usuarios, pacientes, inventario y reportes de su propio consultorio |
| `clinico` | Registra atenciones, consultas, procedimientos y consumo de insumos |
| `system_admin` | Administración transversal del sistema |

- Autenticación **stateless** basada en JWT firmado con HMAC-SHA256, con expiración de 2 horas.
- Contraseñas cifradas con **bcrypt**.
- **RBAC** aplicado a nivel de endpoint mediante `SecurityConfig` y `AppRoleConverter`.
- **Multi-tenant real:** cada repositorio JPA filtra automáticamente por `clinic_id`, de modo que un consultorio nunca puede ver datos de otro.

## Limitaciones del MVP

- Sin integración directa con la plataforma del Ministerio de Salud: el JSON RIPS se genera correctamente pero debe cargarse manualmente.
- Sin módulo de agenda/citas (solo gestiona atenciones ya realizadas).
- Sin facturación electrónica (DIAN).
- Despliegue actual pensado para entorno local vía Docker Compose; producción real requiere VPS, dominio y HTTPS.
- CORS abierto en configuración de desarrollo — debe restringirse en producción.

## Riesgos y mitigaciones

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Complejidad de la estructura RIPS del MinSalud | Alto | Estructura validada desde el Sprint 3; JSON modular y configurable |
| Carga académica del equipo reduce tiempo de desarrollo | Alto | Bloques de trabajo fijos, tablero de tareas, seguimiento semanal |
| Errores de registro por datos incompletos del usuario | Alto | Validaciones obligatorias, mensajes claros, listas desplegables para campos normados |
| Fallas técnicas o de conectividad | Medio | Manejo de errores con reintentos, validaciones de frontend, endpoint `/health` |
| Cambios en la normativa RIPS | Medio | Generación de RIPS parametrizada y modular, sin necesidad de reprogramación completa |
| Resistencia al cambio del personal del consultorio | Bajo | Interfaz simple e intuitiva, plan de capacitación inicial |

## Presupuesto y viabilidad

**CAPEX (inversión de desarrollo)** — 95 story points en 4 sprints:

| Sprint / Componente | Story Points | Costo (COP) |
|---|---|---|
| Sprint 1 — Inventario clínico | 32 | $1.912.500 |
| Sprint 2 — Gestión de pacientes | 19 | $1.087.500 |
| Sprint 3 — RIPS y reportes | 24 | $1.062.500 |
| Sprint 4 — Autenticación y acceso | 20 | $637.500 |
| Costos operativos (diseño, documentación, cierre) | — | $300.000 |
| Reserva para riesgos (15 %) | — | $750.000 |
| **Presupuesto total** | **95** | **$5.750.000** |

> El costo real de mercado del equipo (3 personas × $6.750.000 COP) habría sido de **$20.250.000 COP**; el proyecto se desarrolló como ejercicio académico.

**OPEX (operación mensual estimada)**

| Servicio | Costo mensual |
|---|---|
| Docker Compose + PostgreSQL | $0 |
| GitHub | $0 |
| Backups de base de datos | $20.000 |
| VPS (servidor de producción) | $80.000 |
| Dominio | $5.000 |
| **Total** | **$105.000 / mes** |

**Modelo de negocio propuesto** — suscripción por consultorio:

| Plan | Precio | Incluye |
|---|---|---|
| **Básico** | $80.000 COP/mes | Inventario, pacientes, atenciones |
| **Completo** | $180.000 COP/mes | Todo lo anterior + generación de RIPS + reportes de inventario |

Con **2 consultorios** en plan completo la operación no genera pérdidas; con **10 consultorios** el proyecto es rentable y permite reinversión en nuevas funcionalidades.

## Roadmap (v2.0)

| Funcionalidad | Valor | Prioridad |
|---|---|---|
| Módulo de agendas/citas | Gestión completa de agenda y recordatorios | Alta |
| Integración directa con MinSalud | Transmisión automática del JSON RIPS | Alta |
| Facturación electrónica | Conforme al modelo DIAN | Media |
| App móvil con acceso offline | Registro sin conexión, sincronización posterior | Media |
| Dashboard de analítica | Productividad, consumo de insumos, ingresos | Media |
| Notificaciones de vencimientos | Alertas por correo/SMS de stock crítico | Media |
| Odontograma digital | Estado bucal del paciente con representación visual | Baja |

**Camino a producción real:** VPS con dominio público, HTTPS/TLS, CORS restrictivo por dominio, backups automáticos con retención ≥ 30 días, variables de entorno segregadas por ambiente, onboarding automatizado de nuevas clínicas y un SLA de soporte documentado.

## Lecciones aprendidas

- **Arquitectura multi-tenant desde el día uno:** incluir `clinic_id` en todas las tablas desde la primera migración fue más costoso en diseño, pero evitó refactorizaciones al escalar a múltiples consultorios.
- **Migraciones SQL manuales** en lugar de `ddl-auto` de Hibernate, para tener control total del esquema en producción.
- **RIPS en JSON modular** en vez de archivo plano, facilitando el mantenimiento ante cambios normativos.
- La estructura RIPS del Ministerio de Salud fue más exigente de lo previsto — requirió varias iteraciones de `FunctionsController` para distinguir correctamente pacientes particulares y amparados.
- La configuración de JWT stateless con Spring Security 6 generó fricción; se resolvió con pair programming intensivo.
- Con el conocimiento actual, el equipo arrancaría el desarrollo antes (prototipos en paralelo al diseño técnico), añadiría pruebas automatizadas desde el Sprint 1 y desarrollaría autenticación desde el inicio del proyecto.

## Equipo

Proyecto desarrollado por estudiantes de la **Facultad Barberi de Ingeniería, Diseño y Ciencias Aplicadas — Universidad Icesi**, Cali, Colombia (2026):

- **Daniel Alejandro Castro Escobar**
- **Laura Valentina Revelo Villareal**
- **Katerine Valens Orejuela**

---

<div align="center">

*CliniControl — llevando la gestión de consultorios odontológicos pequeños del cuaderno a la nube.*

</div>