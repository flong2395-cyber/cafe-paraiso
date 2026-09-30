SET local check_function_bodies = off;

CREATE TABLE "public"."business_settings" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "business_name"             text                     DEFAULT 'Café Cumaná'::text,
  "description"               text,
  "address"                   text,
  "phone"                     text,
  "email"                     text,
  "opening_hours"             text,
  "social_instagram"          text,
  "social_facebook"           text,
  "social_tiktok"             text,
  "welcome_text"              text,
  "about_text"                text,
  "updated_at"                timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by"                uuid,
  "social_linkedin"           text,
  "legal_company_name"        text,
  "legal_tax_id"              text,
  "legal_email"               text,
  "legal_address"             text,
  "legal_notice"              text,
  "privacy_policy"            text,
  "cookie_policy"             text,
  "purchase_terms"            text,
  "shipping_policy"           text,
  "returns_policy"            text,
  "cookies_banner_enabled"    boolean                  DEFAULT false,
  "cookies_analytics_enabled" boolean                  DEFAULT false,
  "cookies_marketing_enabled" boolean                  DEFAULT false,
  CONSTRAINT "business_settings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."business_settings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."cart_items" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "product_id" uuid                     NOT NULL,
  "quantity"   integer                  NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cart_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "cart_items_quantity_check" CHECK (((quantity >= 1) AND (quantity <= 99))),
  CONSTRAINT "cart_items_user_product_key" UNIQUE (user_id, product_id)
);

ALTER TABLE "public"."cart_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contact_messages" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "email"      text                     NOT NULL,
  "phone"      text,
  "subject"    text                     NOT NULL,
  "message"    text                     NOT NULL,
  "status"     text                     NOT NULL DEFAULT 'unread'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "contact_messages_email_check" CHECK (((char_length(TRIM(BOTH FROM email)) >= 5) AND (char_length(TRIM(BOTH FROM email)) <= 254))),
  CONSTRAINT "contact_messages_message_check" CHECK (((char_length(TRIM(BOTH FROM message)) >= 5) AND (char_length(TRIM(BOTH FROM message)) <= 5000))),
  CONSTRAINT "contact_messages_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 2) AND (char_length(TRIM(BOTH FROM name)) <= 120))),
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "contact_messages_status_check" CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'archived'::text]))),
  CONSTRAINT "contact_messages_subject_check" CHECK ((subject = ANY (ARRAY['informacion'::text, 'productos'::text, 'distribucion'::text, 'empleo'::text, 'otros'::text])))
);

ALTER TABLE "public"."contact_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."customer_addresses" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "label"          text                     NOT NULL DEFAULT 'Principal'::text,
  "recipient_name" text                     NOT NULL,
  "phone"          text                     NOT NULL,
  "address_line"   text                     NOT NULL,
  "postal_code"    text                     NOT NULL,
  "city"           text                     NOT NULL,
  "province"       text                     NOT NULL,
  "notes"          text,
  "is_default"     boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "customer_addresses_city_check" CHECK (((char_length(TRIM(BOTH FROM city)) >= 2) AND (char_length(TRIM(BOTH FROM city)) <= 100))),
  CONSTRAINT "customer_addresses_label_check" CHECK (((char_length(TRIM(BOTH FROM label)) >= 1) AND (char_length(TRIM(BOTH FROM label)) <= 60))),
  CONSTRAINT "customer_addresses_line_check" CHECK (((char_length(TRIM(BOTH FROM address_line)) >= 3) AND (char_length(TRIM(BOTH FROM address_line)) <= 180))),
  CONSTRAINT "customer_addresses_phone_check" CHECK (((char_length(TRIM(BOTH FROM phone)) >= 6) AND (char_length(TRIM(BOTH FROM phone)) <= 30))),
  CONSTRAINT "customer_addresses_pkey" PRIMARY KEY (id),
  CONSTRAINT "customer_addresses_postal_check" CHECK (((char_length(TRIM(BOTH FROM postal_code)) >= 4) AND (char_length(TRIM(BOTH FROM postal_code)) <= 12))),
  CONSTRAINT "customer_addresses_province_check" CHECK (((char_length(TRIM(BOTH FROM province)) >= 2) AND (char_length(TRIM(BOTH FROM province)) <= 100))),
  CONSTRAINT "customer_addresses_recipient_check" CHECK (((char_length(TRIM(BOTH FROM recipient_name)) >= 2) AND (char_length(TRIM(BOTH FROM recipient_name)) <= 120)))
);

ALTER TABLE "public"."customer_addresses"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_applications" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "email"      text                     NOT NULL,
  "phone"      text                     NOT NULL,
  "position"   text                     NOT NULL,
  "message"    text                     NOT NULL,
  "cv_path"    text                     NOT NULL,
  "cv_name"    text                     NOT NULL,
  "cv_size"    bigint                   NOT NULL,
  "cv_type"    text,
  "status"     text                     NOT NULL DEFAULT 'pending'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "user_id"    uuid,
  CONSTRAINT "job_applications_cv_name_check" CHECK (((char_length(TRIM(BOTH FROM cv_name)) >= 1) AND (char_length(TRIM(BOTH FROM cv_name)) <= 180))),
  CONSTRAINT "job_applications_cv_path_key" UNIQUE (cv_path),
  CONSTRAINT "job_applications_cv_size_check" CHECK (((cv_size > 0) AND (cv_size <= 5242880))),
  CONSTRAINT "job_applications_email_check" CHECK (((char_length(TRIM(BOTH FROM email)) >= 5) AND (char_length(TRIM(BOTH FROM email)) <= 254))),
  CONSTRAINT "job_applications_message_check" CHECK (((char_length(TRIM(BOTH FROM message)) >= 10) AND (char_length(TRIM(BOTH FROM message)) <= 5000))),
  CONSTRAINT "job_applications_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 2) AND (char_length(TRIM(BOTH FROM name)) <= 120))),
  CONSTRAINT "job_applications_phone_check" CHECK (((char_length(TRIM(BOTH FROM phone)) >= 6) AND (char_length(TRIM(BOTH FROM phone)) <= 30))),
  CONSTRAINT "job_applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "job_applications_position_check"
    CHECK (("position" = ANY (ARRAY['produccion'::text, 'almacen'::text, 'administracion'::text, 'comercial'::text, 'reparto'::text, 'otro'::text]))),
  CONSTRAINT "job_applications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'archived'::text])))
);

ALTER TABLE "public"."job_applications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "application_id" uuid,
  "type"           text                     NOT NULL DEFAULT 'job_application'::text,
  "title"          text                     NOT NULL,
  "message"        text                     NOT NULL,
  "created_by"     uuid,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "read_at"        timestamp with time zone,
  CONSTRAINT "notifications_message_check" CHECK (((char_length(TRIM(BOTH FROM message)) >= 2) AND (char_length(TRIM(BOTH FROM message)) <= 5000))),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 2) AND (char_length(TRIM(BOTH FROM title)) <= 180))),
  CONSTRAINT "notifications_type_check" CHECK (((char_length(TRIM(BOTH FROM type)) >= 2) AND (char_length(TRIM(BOTH FROM type)) <= 50)))
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_items" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"     uuid                     NOT NULL,
  "product_id"   uuid,
  "product_name" text                     NOT NULL,
  "unit_price"   numeric(10,2)            NOT NULL,
  "quantity"     integer                  NOT NULL,
  "line_total"   numeric(10,2)            NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_price_check" CHECK ((unit_price >= (0)::numeric)),
  CONSTRAINT "order_items_quantity_check" CHECK (((quantity >= 1) AND (quantity <= 99))),
  CONSTRAINT "order_items_total_check" CHECK ((line_total = (unit_price * (quantity)::numeric)))
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_number"   bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "user_id"        uuid                     NOT NULL,
  "status"         text                     NOT NULL DEFAULT 'pending'::text,
  "payment_method" text                     NOT NULL,
  "payment_status" text                     NOT NULL DEFAULT 'pending'::text,
  "subtotal"       numeric(10,2)            NOT NULL DEFAULT 0,
  "delivery_fee"   numeric(10,2)            NOT NULL DEFAULT 0,
  "total"          numeric(10,2)            NOT NULL DEFAULT 0,
  "notes"          text,
  "recipient_name" text                     NOT NULL,
  "phone"          text                     NOT NULL,
  "address_line"   text                     NOT NULL,
  "postal_code"    text                     NOT NULL,
  "city"           text                     NOT NULL,
  "province"       text                     NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "orders_amounts_check" CHECK (((subtotal >= (0)::numeric) AND (delivery_fee >= (0)::numeric) AND (total >= (0)::numeric))),
  CONSTRAINT "orders_order_number_key" UNIQUE (order_number),
  CONSTRAINT "orders_payment_method_check" CHECK ((payment_method = ANY (ARRAY['bank_transfer'::text, 'card'::text, 'bizum'::text, 'cash'::text]))),
  CONSTRAINT "orders_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]))),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_status_check"
    CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'preparing'::text, 'ready'::text, 'out_for_delivery'::text, 'delivered'::text, 'cancelled'::text]))),
  CONSTRAINT "orders_total_check" CHECK ((total = (subtotal + delivery_fee)))
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_categories" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "slug"        text                     NOT NULL,
  "description" text,
  "sort_order"  integer                  NOT NULL DEFAULT 0,
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_categories_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."product_categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "category_id"  uuid,
  "name"         text                     NOT NULL,
  "slug"         text                     NOT NULL,
  "description"  text,
  "price"        numeric(10,2)            NOT NULL DEFAULT 0,
  "image_url"    text,
  "is_available" boolean                  NOT NULL DEFAULT true,
  "sort_order"   integer                  NOT NULL DEFAULT 0,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "image_path"   text,
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_price_check" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "products_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                     uuid                     NOT NULL,
  "full_name"              text,
  "email"                  text,
  "phone"                  text,
  "avatar_url"             text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "role"                   text                     NOT NULL DEFAULT 'user'::text,
  "default_payment_method" text,
  CONSTRAINT "profiles_default_payment_method_check"
    CHECK (((default_payment_method IS NULL) OR (default_payment_method = ANY (ARRAY['bank_transfer'::text, 'card'::text, 'bizum'::text, 'cash'::text])))),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'rrhh'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_delete_order (
  p_order_id uuid
)
  RETURNS public.orders
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_order public.orders%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Debes iniciar sesión.' using errcode = '42501';
    end if;

    if not public.is_admin() then
        raise exception 'No autorizado.' using errcode = '42501';
    end if;

    select * into v_order
    from public.orders
    where id = p_order_id;

    if not found then
        raise exception 'Pedido no encontrado.' using errcode = 'P0002';
    end if;

    delete from public.order_items
    where order_id = p_order_id;

    delete from public.orders
    where id = p_order_id;

    return v_order;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_order_status (
  p_order_id       uuid,
  p_status         text,
  p_payment_status text DEFAULT NULL::text
)
  RETURNS public.orders
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_order public.orders%rowtype;
begin
    if not public.is_admin() then
        raise exception 'No autorizado.' using errcode = '42501';
    end if;

    if p_status not in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled') then
        raise exception 'Estado de pedido no válido.' using errcode = '22023';
    end if;

    if p_payment_status is not null
       and p_payment_status not in ('pending','paid','failed','refunded') then
        raise exception 'Estado de pago no válido.' using errcode = '22023';
    end if;

    update public.orders
    set status = p_status,
        payment_status = coalesce(p_payment_status, payment_status),
        updated_at = now()
    where id = p_order_id
    returning * into v_order;

    if not found then
        raise exception 'Pedido no encontrado.' using errcode = 'P0002';
    end if;

    return v_order;
end;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_jobs()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('rrhh', 'admin')
    );
$function$;

CREATE OR REPLACE FUNCTION public.cancel_my_order (
  p_order_id uuid
)
  RETURNS public.orders
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_order public.orders%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Debes iniciar sesión.' using errcode = '42501';
    end if;

    select * into v_order
    from public.orders
    where id = p_order_id
      and user_id = auth.uid();

    if not found then
        raise exception 'Pedido no encontrado.' using errcode = 'P0002';
    end if;

    if v_order.status not in ('pending', 'confirmed') then
        raise exception 'Este pedido ya no se puede cancelar desde Mi cuenta.' using errcode = '55000';
    end if;

    update public.orders
       set status = 'cancelled', updated_at = now()
     where id = p_order_id
     returning * into v_order;

    return v_order;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_from_cart (
  p_address_id     uuid,
  p_payment_method text,
  p_notes          text DEFAULT NULL::text
)
  RETURNS public.orders
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_user_id uuid := auth.uid();
    v_address public.customer_addresses%rowtype;
    v_order public.orders%rowtype;
    v_subtotal numeric(10,2);
    v_delivery_fee numeric(10,2) := 0;
begin
    if v_user_id is null then
        raise exception 'Debes iniciar sesión para realizar un pedido.' using errcode = '42501';
    end if;

    if p_payment_method not in ('bank_transfer','card','bizum','cash') then
        raise exception 'Método de pago no permitido.' using errcode = '22023';
    end if;

    select * into v_address
    from public.customer_addresses
    where id = p_address_id and user_id = v_user_id;

    if not found then
        raise exception 'La dirección seleccionada no pertenece a tu cuenta.' using errcode = '42501';
    end if;

    select coalesce(sum(ci.quantity * p.price), 0)::numeric(10,2)
    into v_subtotal
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_user_id
      and p.is_available = true;

    if v_subtotal <= 0 then
        raise exception 'El carrito está vacío o sus productos ya no están disponibles.' using errcode = 'P0001';
    end if;

    insert into public.orders (
        user_id, status, payment_method, payment_status,
        subtotal, delivery_fee, total, notes,
        recipient_name, phone, address_line, postal_code, city, province
    ) values (
        v_user_id, 'pending', p_payment_method, 'pending',
        v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee, nullif(trim(p_notes), ''),
        v_address.recipient_name, v_address.phone, v_address.address_line,
        v_address.postal_code, v_address.city, v_address.province
    ) returning * into v_order;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    select
        v_order.id,
        p.id,
        p.name,
        p.price,
        ci.quantity,
        (p.price * ci.quantity)::numeric(10,2)
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_user_id
      and p.is_available = true;

    delete from public.cart_items where user_id = v_user_id;

    return v_order;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_hr_job_application_stats()
  RETURNS TABLE (
    total    bigint,
    pending  bigint,
    approved bigint,
    rejected bigint,
    archived bigint
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN

    IF NOT public.can_manage_jobs() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total,

        COUNT(*) FILTER (
            WHERE status = 'pending'
        )::bigint AS pending,

        COUNT(*) FILTER (
            WHERE status = 'approved'
        )::bigint AS approved,

        COUNT(*) FILTER (
            WHERE status = 'rejected'
        )::bigint AS rejected,

        COUNT(*) FILTER (
            WHERE status = 'archived'
        )::bigint AS archived

    FROM public.job_applications;

END;
$function$;

CREATE OR REPLACE FUNCTION public.get_hr_job_applications (
  p_status text DEFAULT 'all'::text,
  p_search text DEFAULT ''::text
)
  RETURNS SETOF public.job_applications
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
    if not public.can_manage_jobs() then raise exception 'No autorizado'; end if;
    return query
    select ja.*
    from public.job_applications ja
    where (coalesce(p_status, 'all') = 'all' or ja.status = p_status)
      and (
        nullif(btrim(coalesce(p_search, '')), '') is null
        or ja.name ilike '%' || btrim(p_search) || '%'
        or ja.email ilike '%' || btrim(p_search) || '%'
        or ja.phone ilike '%' || btrim(p_search) || '%'
        or ja.message ilike '%' || btrim(p_search) || '%'
      )
    order by ja.created_at desc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_job_applications()
  RETURNS TABLE (
    id         uuid,
    name       text,
    email      text,
    phone      text,
    "position" text,
    message    text,
    cv_name    text,
    cv_size    bigint,
    cv_type    text,
    status     text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
    select
        ja.id,
        ja.name,
        ja.email,
        ja.phone,
        ja.position,
        ja.message,
        ja.cv_name,
        ja.cv_size,
        ja.cv_type,
        ja.status,
        ja.created_at,
        ja.updated_at
    from public.job_applications ja
    where ja.user_id = auth.uid()
    order by ja.created_at desc;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
    insert into public.profiles (id, full_name, email, role)
    values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.email,
        'user'
    )
    on conflict (id) do update
    set
        full_name = excluded.full_name,
        email = excluded.email,
        updated_at = now();

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_hr()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'rrhh'
    );
$function$;

CREATE OR REPLACE FUNCTION public.keep_one_default_address()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
    if new.is_default then
        update public.customer_addresses
        set is_default = false
        where user_id = new.user_id
          and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
          and is_default = true;
    end if;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.protect_job_application_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
    IF public.can_manage_jobs() THEN
        IF NEW.user_id IS DISTINCT FROM OLD.user_id
           OR NEW.name IS DISTINCT FROM OLD.name
           OR NEW.email IS DISTINCT FROM OLD.email
           OR NEW.phone IS DISTINCT FROM OLD.phone
           OR NEW.position IS DISTINCT FROM OLD.position
           OR NEW.message IS DISTINCT FROM OLD.message
           OR NEW.cv_path IS DISTINCT FROM OLD.cv_path
           OR NEW.cv_name IS DISTINCT FROM OLD.cv_name
           OR NEW.cv_size IS DISTINCT FROM OLD.cv_size
           OR NEW.cv_type IS DISTINCT FROM OLD.cv_type
           OR NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Los datos de la candidatura son de solo lectura para RRHH y administradores. Solo se puede modificar el estado.';
        END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_system_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
    if new.id is distinct from old.id then
        raise exception 'El identificador del perfil no puede modificarse.';
    end if;

    if new.email is distinct from old.email then
        raise exception 'El correo del perfil se gestiona mediante Supabase Auth.';
    end if;

    if new.created_at is distinct from old.created_at then
        raise exception 'La fecha de creación no puede modificarse.';
    end if;

    if new.role is distinct from old.role then
        if current_user <> 'postgres'
           and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
            raise exception 'El rol no puede modificarse desde el cliente.';
        end if;
    end if;

    -- La fecha de actualización la controla la base de datos.
    new.updated_at := now();

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.send_candidate_notification (
  p_application_id uuid,
  p_message        text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_application public.job_applications;
    v_message text := trim(coalesce(p_message, ''));
    v_notification_id uuid;
BEGIN
    IF NOT public.can_manage_jobs() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    IF char_length(v_message) < 2 OR char_length(v_message) > 5000 THEN
        RAISE EXCEPTION 'El mensaje debe tener entre 2 y 5000 caracteres';
    END IF;

    SELECT *
    INTO v_application
    FROM public.job_applications
    WHERE id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Candidatura no encontrada';
    END IF;

    IF v_application.user_id IS NULL THEN
        RAISE EXCEPTION 'Esta candidatura no está vinculada a una cuenta de usuario';
    END IF;

    INSERT INTO public.notifications (
        user_id,
        application_id,
        type,
        title,
        message,
        created_by
    )
    VALUES (
        v_application.user_id,
        v_application.id,
        'job_application',
        'Mensaje sobre tu candidatura',
        v_message,
        auth.uid()
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_business_settings_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
    new.updated_at = now();
    new.updated_by = auth.uid();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_catalog_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.updated_at := now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_commerce_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_contact_message_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.updated_at := now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_job_application_status (
  p_application_id uuid,
  p_status         text
)
  RETURNS public.job_applications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    v_application public.job_applications;
    v_status text := lower(trim(coalesce(p_status, '')));
BEGIN
    IF NOT public.can_manage_jobs() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    IF v_status NOT IN ('pending', 'approved', 'rejected', 'archived') THEN
        RAISE EXCEPTION 'Estado de candidatura no válido';
    END IF;

    UPDATE public.job_applications
    SET status = v_status,
        updated_at = now()
    WHERE id = p_application_id
    RETURNING * INTO v_application;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Candidatura no encontrada';
    END IF;

    RETURN v_application;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_job_application_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.updated_at := now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_role (
  target_user_id uuid,
  new_role       text
)
  RETURNS public.profiles
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles;
    actor_id uuid := auth.uid();
BEGIN

    -- Solo administradores pueden modificar roles
    IF actor_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- Roles permitidos
    IF new_role NOT IN ('user', 'admin', 'rrhh') THEN
        RAISE EXCEPTION 'Rol no válido';
    END IF;

    -- Un administrador no puede cambiar su propio rol desde el panel
    IF target_user_id = actor_id THEN
        RAISE EXCEPTION 'No puedes cambiar tu propio rol desde el panel';
    END IF;

    -- Actualizar rol
    UPDATE public.profiles
    SET
        role = new_role,
        updated_at = now()
    WHERE id = target_user_id
    RETURNING * INTO target_profile;

    -- Usuario inexistente
    IF target_profile.id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    RETURN target_profile;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_job_application (
  p_id       uuid,
  p_name     text,
  p_email    text,
  p_phone    text,
  p_position text,
  p_message  text,
  p_cv_path  text,
  p_cv_name  text,
  p_cv_size  bigint,
  p_cv_type  text   DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
    v_user_id uuid := auth.uid();
    v_auth_email text;
    v_profile_name text;
    v_profile_phone text;
begin
    if v_user_id is null then
        raise exception 'Debes iniciar sesión para enviar una candidatura';
    end if;

    select
        au.email,
        p.full_name,
        p.phone
    into
        v_auth_email,
        v_profile_name,
        v_profile_phone
    from auth.users au
    left join public.profiles p on p.id = au.id
    where au.id = v_user_id;

    if v_auth_email is null then
        raise exception 'No se pudo obtener el correo de tu cuenta';
    end if;

    if char_length(trim(coalesce(v_profile_name, ''))) not between 2 and 120 then
        raise exception 'Completa tu nombre y apellidos en Datos personales antes de enviar una candidatura';
    end if;

    if char_length(trim(coalesce(v_profile_phone, ''))) not between 6 and 30 then
        raise exception 'Completa tu teléfono en Datos personales antes de enviar una candidatura';
    end if;

    if p_id is null then
        raise exception 'ID de candidatura no válido';
    end if;

    if p_position not in ('produccion', 'almacen', 'administracion', 'comercial', 'reparto', 'otro') then
        raise exception 'Puesto no válido';
    end if;

    if char_length(trim(coalesce(p_message, ''))) not between 10 and 5000 then
        raise exception 'Mensaje no válido';
    end if;

    if p_cv_path !~ ('^' || v_user_id::text || '/' || p_id::text || '/curriculum[.](pdf|doc|docx)$') then
        raise exception 'Ruta de CV no válida';
    end if;

    if p_cv_name !~* '[.](pdf|doc|docx)$' then
        raise exception 'Nombre de CV no válido';
    end if;

    if p_cv_size is null or p_cv_size < 1 or p_cv_size > 5242880 then
        raise exception 'Tamaño de CV no válido';
    end if;

    insert into public.job_applications (
        id,
        user_id,
        name,
        email,
        phone,
        position,
        message,
        cv_path,
        cv_name,
        cv_size,
        cv_type,
        status
    ) values (
        p_id,
        v_user_id,
        trim(v_profile_name),
        lower(trim(v_auth_email)),
        trim(v_profile_phone),
        p_position,
        trim(p_message),
        p_cv_path,
        trim(p_cv_name),
        p_cv_size,
        nullif(trim(p_cv_type), ''),
        'pending'
    );

    return p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_job_application_personal_data()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
    update public.job_applications
    set
        name = trim(new.full_name),
        email = lower(trim(coalesce(new.email, email))),
        phone = trim(new.phone)
    where user_id = new.id
      and char_length(trim(coalesce(new.full_name, ''))) between 2 and 120
      and char_length(trim(coalesce(new.phone, ''))) between 6 and 30;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
    update public.profiles
    set
        email = new.email,
        full_name = coalesce(new.raw_user_meta_data ->> 'full_name', full_name),
        updated_at = now()
    where id = new.id;

    return new;
end;
$function$;

ALTER TABLE "public"."business_settings"
  ADD CONSTRAINT "business_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."customer_addresses"
  ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."job_applications"
  ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX cart_items_user_idx ON public.cart_items USING btree (user_id, updated_at DESC);

CREATE INDEX contact_messages_created_idx ON public.contact_messages USING btree (created_at DESC);

CREATE INDEX contact_messages_email_idx ON public.contact_messages USING btree (email);

CREATE INDEX contact_messages_status_idx ON public.contact_messages USING btree (status, created_at DESC);

CREATE INDEX customer_addresses_user_idx ON public.customer_addresses USING btree (user_id, is_default DESC, created_at DESC);

CREATE INDEX job_applications_created_idx ON public.job_applications USING btree (created_at DESC);

CREATE INDEX job_applications_email_idx ON public.job_applications USING btree (email);

CREATE INDEX job_applications_status_idx ON public.job_applications USING btree (status, created_at DESC);

CREATE INDEX job_applications_user_id_idx ON public.job_applications USING btree (user_id, created_at DESC);

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX notifications_user_unread_idx ON public.notifications USING btree (user_id, read_at)
  WHERE (read_at IS NULL);

CREATE INDEX order_items_order_idx ON public.order_items USING btree (order_id);

CREATE INDEX orders_status_idx ON public.orders USING btree (status, created_at DESC);

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id, created_at DESC);

CREATE INDEX product_categories_sort_idx ON public.product_categories USING btree (sort_order, name);

CREATE INDEX products_available_idx ON public.products USING btree (is_available, sort_order);

CREATE INDEX products_category_idx ON public.products USING btree (category_id);

CREATE INDEX products_name_idx ON public.products USING btree (name);

CREATE INDEX profiles_role_idx ON public.profiles USING btree (ROLE);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth_user();

CREATE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_business_settings_updated_at();

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_commerce_updated_at();

CREATE TRIGGER contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contact_message_updated_at();

CREATE TRIGGER customer_addresses_one_default
  BEFORE INSERT OR UPDATE OF is_default, user_id ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_one_default_address();

CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_commerce_updated_at();

CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_job_application_updated_at();

CREATE TRIGGER trg_protect_job_application_fields
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_job_application_fields();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_commerce_updated_at();

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_catalog_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_catalog_updated_at();

CREATE TRIGGER protect_profile_system_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_system_fields();

CREATE TRIGGER trg_sync_job_application_personal_data
  AFTER UPDATE OF full_name, email, phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_application_personal_data();

CREATE POLICY "Admins can delete business settings" ON "public"."business_settings"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Admins can insert business settings" ON "public"."business_settings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update business settings" ON "public"."business_settings"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can read business settings" ON "public"."business_settings"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can delete from their own cart" ON "public"."cart_items"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert into their own cart" ON "public"."cart_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own cart" ON "public"."cart_items"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own cart" ON "public"."cart_items"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins can delete contact messages" ON "public"."contact_messages"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Admins can update contact messages" ON "public"."contact_messages"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view contact messages" ON "public"."contact_messages"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Public can send contact messages" ON "public"."contact_messages"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (true);

CREATE POLICY "Users can delete their own addresses" ON "public"."customer_addresses"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own addresses" ON "public"."customer_addresses"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own addresses" ON "public"."customer_addresses"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own addresses" ON "public"."customer_addresses"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins and HR can delete job applications" ON "public"."job_applications"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.can_manage_jobs() AS can_manage_jobs));

CREATE POLICY "Admins and HR can view job applications" ON "public"."job_applications"
  FOR SELECT
  TO "authenticated"
  USING (( SELECT public.can_manage_jobs() AS can_manage_jobs));

CREATE POLICY "Users can view their own job applications" ON "public"."job_applications"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete their own notifications" ON "public"."notifications"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can mark their own notifications as read" ON "public"."notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own notifications" ON "public"."notifications"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins can view all order items" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Users can view their own order items" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));

CREATE POLICY "Admins can view all orders" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Users can view their own orders" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins can manage categories" ON "public"."product_categories"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view active categories" ON "public"."product_categories"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_active = true));

CREATE POLICY "Admins can delete products" ON "public"."products"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Admins can insert products" ON "public"."products"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON "public"."products"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Public can view available products" ON "public"."products"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_available = true));

CREATE POLICY "Admins can view all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view their own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = id));

CREATE POLICY "Admins and HR can delete job CV" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'job-applications'::text) AND ( SELECT public.can_manage_jobs() AS can_manage_jobs)));

CREATE POLICY "Admins and HR can view job CV" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'job-applications'::text) AND ( SELECT public.can_manage_jobs() AS can_manage_jobs)));

CREATE POLICY "Admins can delete product images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'products'::text) AND public.is_admin()));

CREATE POLICY "Admins can update product images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'products'::text) AND public.is_admin()))
  WITH CHECK (((bucket_id = 'products'::text) AND public.is_admin()));

CREATE POLICY "Admins can upload product images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'products'::text) AND public.is_admin()));

CREATE POLICY "Admins can view product images" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'products'::text) AND public.is_admin()));

CREATE POLICY "Authenticated users can upload own job CV" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id = 'job-applications'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid)) AND (name ~
    '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/curriculum[.](pdf|doc|docx)$'::text)));

CREATE POLICY "Avatar images are publicly readable" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'avatars'::text));

CREATE POLICY "Users can delete their own avatar" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

CREATE POLICY "Users can update their own avatar" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))))
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

CREATE POLICY "Users can upload their own avatar" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";

REVOKE ALL ON FUNCTION "public"."admin_delete_order"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."admin_delete_order"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."admin_update_order_status"(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."admin_update_order_status"(uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."can_manage_jobs"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."can_manage_jobs"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."cancel_my_order"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."cancel_my_order"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_order_from_cart"(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_order_from_cart"(uuid, text, text) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_hr_job_application_stats"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_hr_job_applications"(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_hr_job_applications"(text, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_job_applications"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_my_job_applications"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."is_hr"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."is_hr"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."keep_one_default_address"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."protect_job_application_fields"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."protect_profile_system_fields"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."send_candidate_notification"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."send_candidate_notification"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_business_settings_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_catalog_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_commerce_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_contact_message_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_job_application_status"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_job_application_status"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_job_application_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_user_role"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_user_role"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."submit_job_application"(uuid, text, text, text, text, text, text, text, bigint, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."submit_job_application"(uuid, text, text, text, text, text, text, text, bigint, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."sync_job_application_personal_data"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sync_job_application_personal_data"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."sync_profile_from_auth_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."business_settings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customer_addresses" TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."job_applications" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."job_applications" TO "anon";

REVOKE ALL ON TABLE "public"."job_applications" FROM "authenticated";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."job_applications" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_applications" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."notifications" TO "anon";

REVOKE ALL ("read_at") ON TABLE "public"."notifications" FROM "authenticated";

GRANT UPDATE ("read_at") ON TABLE "public"."notifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."notifications" FROM "authenticated";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."notifications" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."order_items" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "anon";

REVOKE ALL ON TABLE "public"."order_items" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."orders" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "anon";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_categories" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";
