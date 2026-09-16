create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings(key,value) values
('pass_price','950'),
('delivery_charge','0'),
('max_passes_per_booking','10'),
('available_passes','1000')
on conflict (key) do nothing;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique not null,
  customer_name text not null,
  phone text not null,
  email text not null,
  address text default '',
  quantity integer not null check (quantity > 0),
  pass_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  delivery_required boolean not null default false,
  delivery_charge numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending','Submitted','Verified','Failed','Refunded')),
  booking_status text not null default 'Pending'
    check (booking_status in ('Pending','Payment Submitted','Confirmed','Processing','Ready for Collection','Out for Delivery','Delivered','Cancelled')),
  transaction_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.booking_seq;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin'
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create table if not exists public.pandals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null check(region in ('North Kolkata','South Kolkata')),
  area text,
  address text,
  latitude numeric,
  longitude numeric,
  participating boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.admin_users enable row level security;
alter table public.contact_messages enable row level security;
alter table public.pandals enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()); $$;

-- Public settings needed by the booking UI.
create policy "public read safe settings" on public.site_settings
for select using (key in ('pass_price','delivery_charge','max_passes_per_booking','available_passes'));

create policy "admins manage settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

-- Public booking creation happens through the RPC below.
create policy "admins manage bookings" on public.bookings
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins read contacts" on public.contact_messages
for select using (public.is_admin());

create policy "public submit contacts" on public.contact_messages
for insert with check (true);

create policy "admins manage pandals" on public.pandals
for all using (public.is_admin()) with check (public.is_admin());

create policy "public read participating pandals" on public.pandals
for select using (participating = true);

create or replace function public.create_booking(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_quantity integer,
  p_delivery_required boolean
)
returns json
language plpgsql
security definer
set search_path=public
as $$
declare
  v_price numeric;
  v_delivery numeric;
  v_max integer;
  v_available integer;
  v_subtotal numeric;
  v_total numeric;
  v_seq bigint;
  v_booking_id text;
  v_id uuid;
begin
  if length(trim(p_customer_name)) < 2 then raise exception 'Enter a valid name'; end if;
  if length(trim(p_phone)) < 8 then raise exception 'Enter a valid phone number'; end if;
  if p_quantity < 1 then raise exception 'Quantity must be at least 1'; end if;

  select (value::numeric) into v_price from site_settings where key='pass_price';
  select (value::numeric) into v_delivery from site_settings where key='delivery_charge';
  select (value::integer) into v_max from site_settings where key='max_passes_per_booking';
  select (value::integer) into v_available from site_settings where key='available_passes';

  if p_quantity > coalesce(v_max,10) then raise exception 'Maximum % passes per booking', v_max; end if;
  if p_quantity > coalesce(v_available,0) then raise exception 'Not enough passes available'; end if;
  if p_delivery_required and length(trim(coalesce(p_address,''))) < 5 then raise exception 'Address is required for delivery'; end if;

  v_subtotal := p_quantity * v_price;
  v_total := v_subtotal + case when p_delivery_required then v_delivery else 0 end;

  -- Lock settings row while reducing availability to prevent simple overselling races.
  perform 1 from site_settings where key='available_passes' for update;
  select (value::integer) into v_available from site_settings where key='available_passes';
  if p_quantity > v_available then raise exception 'Not enough passes available'; end if;

  update site_settings set value=(v_available-p_quantity)::text, updated_at=now() where key='available_passes';

  v_seq := nextval('booking_seq');
  v_booking_id := 'POR-2026-' || lpad(v_seq::text,6,'0');

  insert into bookings(booking_id,customer_name,phone,email,address,quantity,pass_price,subtotal,delivery_required,delivery_charge,total_amount)
  values(v_booking_id,trim(p_customer_name),trim(p_phone),lower(trim(p_email)),coalesce(p_address,''),p_quantity,v_price,v_subtotal,p_delivery_required,case when p_delivery_required then v_delivery else 0 end,v_total)
  returning id into v_id;

  return json_build_object('id',v_id,'booking_id',v_booking_id,'total_amount',v_total,'quantity',p_quantity);
end;
$$;

revoke all on function public.create_booking(text,text,text,text,integer,boolean) from public;
grant execute on function public.create_booking(text,text,text,text,integer,boolean) to anon, authenticated;

-- Public status view exposes only customer-facing fields.
create or replace view public.bookings_public as
select booking_id, phone, quantity, total_amount, payment_status, booking_status, created_at
from public.bookings;

grant select on public.bookings_public to anon, authenticated;

-- Seed pandal list. All start as NOT PARTICIPATING until verified by admin.
insert into public.pandals(name,region) values
('Behala Club Sarbojanin Durgotsav Committee','South Kolkata'),
('Behala Nutan Dal','South Kolkata'),
('Thakurpukur State Bank Park Sarbojanin','South Kolkata'),
('Ajeya Sanghati','South Kolkata'),
('41 Pally Club','South Kolkata'),
('Vivekananda Park Athletic Club','South Kolkata'),
('Vivekananda Sporting Club','South Kolkata'),
('Pally Unnayan Samity','South Kolkata'),
('Naktala Udayan Sangha','South Kolkata'),
('Kendua Shanti Sangha','South Kolkata'),
('Santoshpur Lake Pally','South Kolkata'),
('Santoshpur Trikon Park','South Kolkata'),
('Rajdanga Naba Uday Sangha','South Kolkata'),
('Bose Pukur Sitala Mandir','South Kolkata'),
('Hindusthan Park','South Kolkata'),
('Samajsebi','South Kolkata'),
('Shibmandir Sarbojanin','South Kolkata'),
('Mudiali Club','South Kolkata'),
('Pratapaditya Road Tricon Park','South Kolkata'),
('Badamtala Ashar Sangha','South Kolkata'),
('Paddapukur Youth Association','South Kolkata'),
('Chakraberia Sarbojanin','South Kolkata'),
('Alipore Sarbojanin','South Kolkata'),
('25 Pally Club','South Kolkata'),
('Santosh Mitra Square','North Kolkata'),
('33 Pally Beleghata','North Kolkata'),
('Beleghata Sandhani','North Kolkata'),
('Mitali Club','North Kolkata'),
('DB Block Sarbojanin','North Kolkata'),
('AK Block Salt Lake','North Kolkata'),
('EC Block Salt Lake','North Kolkata'),
('Telengabagan Sarbojanin','North Kolkata'),
('Ultadanga Karbagan','North Kolkata'),
('Ultadanga Bidhan Sangha','North Kolkata'),
('Ultadanga Jagaran Sangha','North Kolkata'),
('Nalin Sarkar Street','North Kolkata'),
('Sikdar Bagan','North Kolkata'),
('Kumartuli Park','North Kolkata'),
('Ahiritola Sarbojanin','North Kolkata'),
('Ahiritola Sarodotsab','North Kolkata'),
('Jagat Mukherjee Park','North Kolkata'),
('Maniktala Chaltabagan','North Kolkata'),
('Chinar Park Adhibasibrinda','North Kolkata'),
('Aswininagar Bandhumahal','North Kolkata'),
('Masterda Smriti Sangha','North Kolkata'),
('Kestopur Prafullakanan','North Kolkata'),
('Dum Dum Park Yubak Brinda','North Kolkata'),
('Dum Dum Bharat Chakra','North Kolkata'),
('Dum Dum Park Sarbojanin','North Kolkata'),
('Shyamnagar Road Dum Dum Tarun Dal','North Kolkata'),
('Yuba Sangha Telipukur','North Kolkata'),
('Bandhudal Sporting Club','North Kolkata'),
('Sovabazar Beniatola Sarbojanin','North Kolkata'),
('Attarpara Unnayan Samity','North Kolkata')
on conflict do nothing;

-- IMPORTANT:
-- The bookings_public view should be hardened further if your Supabase
-- project requires additional view/RLS configuration. Keep phone matching
-- in the application flow and never expose broad customer queries.
