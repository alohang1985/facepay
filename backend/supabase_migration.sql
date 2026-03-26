-- FacePay Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text default 'provider' check (role in ('provider', 'buyer', 'admin')),
  avatar_url text,
  balance numeric(10, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Faces table
create table if not exists faces (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  photo_url text default '',
  price numeric(10, 2) not null,
  tags text default '',
  ethnicity text default '',
  age int,
  gender text default '',
  style text default '',
  location text default '',
  allowed_for text[] default '{}',
  not_allowed_for text[] default '{}',
  verified boolean default false,
  embedding jsonb,  -- DeepFace embedding for similarity search
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Face photos (multiple photos per face)
create table if not exists face_photos (
  id uuid default uuid_generate_v4() primary key,
  face_id uuid references faces(id) on delete cascade,
  photo_url text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Licenses table
create table if not exists licenses (
  id uuid default uuid_generate_v4() primary key,
  face_id uuid references faces(id) on delete set null,
  buyer_id uuid references users(id) on delete set null,
  provider_id uuid references users(id) on delete set null,
  license_type text not null check (license_type in ('standard', 'extended')),
  usage_purpose text not null,
  duration_months int not null,
  price_paid numeric(10, 2) not null,
  company_name text default '',
  status text default 'active' check (status in ('active', 'expired', 'revoked', 'pending')),
  stripe_payment_id text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- Transactions / payment history
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  license_id uuid references licenses(id) on delete set null,
  from_user_id uuid references users(id),
  to_user_id uuid references users(id),
  amount numeric(10, 2) not null,
  platform_fee numeric(10, 2) default 0,
  stripe_payment_id text,
  status text default 'completed',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_faces_user on faces(user_id);
create index if not exists idx_faces_verified on faces(verified);
create index if not exists idx_faces_ethnicity on faces(ethnicity);
create index if not exists idx_faces_gender on faces(gender);
create index if not exists idx_licenses_buyer on licenses(buyer_id);
create index if not exists idx_licenses_provider on licenses(provider_id);
create index if not exists idx_licenses_face on licenses(face_id);
create index if not exists idx_licenses_status on licenses(status);

-- RLS (Row Level Security)
alter table users enable row level security;
alter table faces enable row level security;
alter table licenses enable row level security;

-- Policies: users can read all faces, but only edit their own
create policy "Public faces are viewable by everyone"
  on faces for select using (verified = true);

create policy "Users can insert own faces"
  on faces for insert with check (auth.uid() = user_id);

create policy "Users can update own faces"
  on faces for update using (auth.uid() = user_id);

-- Policies: users can view their own licenses
create policy "Users can view own purchased licenses"
  on licenses for select using (auth.uid() = buyer_id or auth.uid() = provider_id);

create policy "Users can create licenses (purchase)"
  on licenses for insert with check (auth.uid() = buyer_id);
