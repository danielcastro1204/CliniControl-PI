-- Copy of migration file for Spring Boot SQL init
-- This file is the same as migrations/001_initial_schema.sql

-- 1. Create app_role enum type (DROP+CREATE avoided; use IF NOT EXISTS via DO block workaround)
-- Spring Boot SQL init has issues with DO $$ blocks, so we just create the type directly.
-- continue-on-error=true will skip this if it already exists.
CREATE TYPE public.app_role AS ENUM ('admin', 'clinico', 'system_admin');

-- 2. Create clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nit TEXT,
  address TEXT,
  phone TEXT,
  cod_prestador TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create auth_users table
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  identification TEXT,
  phone TEXT,
  username TEXT,
  user_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 6. Create dentists table
CREATE TABLE IF NOT EXISTS public.dentists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name_1 text NOT NULL,
  last_name_2 text DEFAULT '',
  identification text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'CC',
  cod_prestador text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  primer_apellido text NOT NULL,
  segundo_apellido text NOT NULL DEFAULT '',
  estado_tratamiento text NOT NULL DEFAULT 'en_tratamiento',
  tipo_documento_identificacion text NOT NULL DEFAULT '',
  num_documento_identificacion text NOT NULL,
  tipo_usuario text NOT NULL DEFAULT '',
  fecha_nacimiento text NOT NULL DEFAULT '',
  cod_sexo text NOT NULL DEFAULT '',
  cod_pais_residencia text NOT NULL DEFAULT '',
  cod_municipio_residencia text NOT NULL DEFAULT '',
  cod_zona_territorial_residencia text NOT NULL DEFAULT '',
  incapacidad text NOT NULL DEFAULT 'No',
  cod_pais_origen text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, num_documento_identificacion)
);

-- 8. Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  category text NOT NULL,
  descripcion text NOT NULL,
  marca text NOT NULL DEFAULT '',
  presentacion_comercial text NOT NULL DEFAULT '',
  registro_sanitario text NOT NULL DEFAULT '',
  precio_unitario numeric NOT NULL DEFAULT 0,
  proveedor text NOT NULL DEFAULT '',
  observaciones text NOT NULL DEFAULT '',
  serie text,
  clasificacion_riesgo text,
  vida_util text,
  almacenamiento text,
  principio_activo text,
  forma_farmaceutica text,
  concentracion text,
  unidad_medida text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Create product_instances table
CREATE TABLE IF NOT EXISTS public.product_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lote text NOT NULL DEFAULT '',
  fecha_registro text NOT NULL DEFAULT '',
  fecha_vencimiento text NOT NULL DEFAULT '',
  cantidad integer NOT NULL DEFAULT 0,
  dias_disponibilidad integer NOT NULL DEFAULT 0,
  fecha_salida text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'almacenado',
  semaforizacion text NOT NULL DEFAULT 'verde',
  observaciones text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Create attentions table
CREATE TABLE IF NOT EXISTS public.attentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.dentists(id),
  cod_prestador text NOT NULL DEFAULT '',
  num_documento_obligado text NOT NULL DEFAULT '',
  consecutivo_usuario text NOT NULL DEFAULT '1',
  fecha_inicial_atencion text NOT NULL DEFAULT '',
  num_autorizacion text NOT NULL DEFAULT '',
  tipo_documento_identificacion text NOT NULL DEFAULT '',
  numero_documento_identificacion text NOT NULL DEFAULT '',
  consulta_enabled boolean NOT NULL DEFAULT false,
  procedimiento_enabled boolean NOT NULL DEFAULT false,
  numero_factura text NOT NULL DEFAULT '',
  tipo_nota text NOT NULL DEFAULT '',
  numero_nota text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Create consultas table
CREATE TABLE IF NOT EXISTS public.consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attention_id uuid NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.dentists(id),
  fecha_inicio_atencion text NOT NULL DEFAULT '',
  codigo_consulta text NOT NULL DEFAULT '',
  modalidad_grupo_servicio_tec_sal text NOT NULL DEFAULT '',
  grupo_servicios text NOT NULL DEFAULT '',
  cod_servicio text NOT NULL DEFAULT '',
  finalidad_tecnologia_salud text NOT NULL DEFAULT '',
  causa_motivo_atencion text NOT NULL DEFAULT '',
  codigo_principal_diagnostico text NOT NULL DEFAULT '',
  tipo_diagnostico_principal text NOT NULL DEFAULT '',
  valor_servicio text NOT NULL DEFAULT '0',
  concepto_recaudo text NOT NULL DEFAULT '',
  valor_pago_moderador text NOT NULL DEFAULT '0',
  num_fev_pago_moderador text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Create procedimientos table
CREATE TABLE IF NOT EXISTS public.procedimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attention_id uuid NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.dentists(id),
  fecha_inicio_atencion text NOT NULL DEFAULT '',
  cod_procedimiento text NOT NULL DEFAULT '',
  via_ingreso_servicio_salud text NOT NULL DEFAULT '',
  modalidad_grupo_servicio_tec_sal text NOT NULL DEFAULT '',
  grupo_servicios text NOT NULL DEFAULT '',
  cod_servicio text NOT NULL DEFAULT '',
  finalidad_tecnologia_salud text NOT NULL DEFAULT '',
  codigo_principal_diagnostico text NOT NULL DEFAULT '',
  valor_servicio text NOT NULL DEFAULT '0',
  concepto_recaudo text NOT NULL DEFAULT '',
  valor_pago_moderador text NOT NULL DEFAULT '0',
  num_fev_pago_moderador text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Create inventory_movements table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  product_id UUID NOT NULL,
  instance_id UUID NOT NULL,
  cantidad INTEGER NOT NULL,
  lote TEXT NOT NULL DEFAULT '',
  fecha_uso TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  patient_id UUID,
  patient_name TEXT DEFAULT '',
  tipo_movimiento TEXT NOT NULL DEFAULT 'consumo',
  observaciones TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 14. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_dentists_updated_at BEFORE UPDATE ON public.dentists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_product_instances_updated_at BEFORE UPDATE ON public.product_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
