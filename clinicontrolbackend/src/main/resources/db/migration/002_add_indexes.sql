-- Performance indexes.
-- Every table in this schema is filtered by clinic_id (multi-tenant pattern) and
-- several are joined by their foreign keys, but the original schema (001) created
-- no indexes beyond the primary keys. As data grows, every list/detail endpoint
-- forces a sequential scan. This migration adds the missing indexes.
-- Uses IF NOT EXISTS + continue-on-error so it's safe to re-run.

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- dentists
CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON public.dentists(clinic_id);

-- patients
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_clinic_id ON public.products(clinic_id);

-- product_instances
CREATE INDEX IF NOT EXISTS idx_product_instances_clinic_id ON public.product_instances(clinic_id);
CREATE INDEX IF NOT EXISTS idx_product_instances_product_id ON public.product_instances(product_id);

-- attentions
CREATE INDEX IF NOT EXISTS idx_attentions_clinic_id ON public.attentions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_attentions_patient_id ON public.attentions(patient_id);
CREATE INDEX IF NOT EXISTS idx_attentions_dentist_id ON public.attentions(dentist_id);
-- speeds up findByClinicIdAndPatientIdOrderByCreatedAtDesc / OrderByCreatedAtDesc
CREATE INDEX IF NOT EXISTS idx_attentions_clinic_patient_created ON public.attentions(clinic_id, patient_id, created_at DESC);

-- consultas
CREATE INDEX IF NOT EXISTS idx_consultas_clinic_id ON public.consultas(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultas_attention_id ON public.consultas(attention_id);
CREATE INDEX IF NOT EXISTS idx_consultas_dentist_id ON public.consultas(dentist_id);
-- speeds up findByClinicIdAndAttentionIdIn.../findByClinicIdAndAttentionId...
CREATE INDEX IF NOT EXISTS idx_consultas_clinic_attention_sort ON public.consultas(clinic_id, attention_id, sort_order);

-- procedimientos
CREATE INDEX IF NOT EXISTS idx_procedimientos_clinic_id ON public.procedimientos(clinic_id);
CREATE INDEX IF NOT EXISTS idx_procedimientos_attention_id ON public.procedimientos(attention_id);
CREATE INDEX IF NOT EXISTS idx_procedimientos_dentist_id ON public.procedimientos(dentist_id);
CREATE INDEX IF NOT EXISTS idx_procedimientos_clinic_attention_sort ON public.procedimientos(clinic_id, attention_id, sort_order);

-- inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_clinic_id ON public.inventory_movements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_instance_id ON public.inventory_movements(instance_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_patient_id ON public.inventory_movements(patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON public.inventory_movements(user_id);
