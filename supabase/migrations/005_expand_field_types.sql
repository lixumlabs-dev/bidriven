-- Expande o CHECK constraint de field_type em form_fields e model_fields
-- para incluir textarea e email, necessários nos formulários de coleta.

ALTER TABLE public.form_fields
  DROP CONSTRAINT form_fields_field_type_check;

ALTER TABLE public.form_fields
  ADD CONSTRAINT form_fields_field_type_check
  CHECK (field_type IN (
    'text','number','date','datetime',
    'select','multiselect','boolean',
    'currency','percentage',
    'textarea','email'
  ));

-- model_fields tem constraint similar
ALTER TABLE public.model_fields
  DROP CONSTRAINT IF EXISTS model_fields_field_type_check;

ALTER TABLE public.model_fields
  ADD CONSTRAINT model_fields_field_type_check
  CHECK (field_type IN (
    'text','number','date','datetime',
    'select','multiselect','boolean',
    'currency','percentage',
    'textarea','email'
  ));
