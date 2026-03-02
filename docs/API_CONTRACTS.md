# Y2 API Contracts

> Supabase table schemas, RLS policies, and Edge Function signatures.
> This is the single source of truth for data shapes.

## Supabase Project

- **Status**: Not yet created
- **URL**: TBD
- **Anon Key**: TBD (stored in `.env.local`)

## Tables

### profiles
Extends Supabase auth.users with app-specific data.

```sql
create table profiles (
  id uuid references auth.users primary key,
  display_name text not null,
  avatar_url text,
  partner_id uuid references profiles(id),
  notification_preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can read both profiles, update only their own
```

### notes
Love notes / shared notes between partners.

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) not null,
  recipient_id uuid references profiles(id),
  content text not null,
  is_scheduled boolean default false,
  scheduled_for timestamptz,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS: both partners can read all notes, authors can write/delete their own
```

### daily_checkins
Daily mood and gratitude check-in.

```sql
create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  date date not null default current_date,
  mood integer check (mood between 1 and 5),
  gratitude text,
  one_thing text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
```

### health_entries
Unified health tracking.

```sql
create table health_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  entry_type text not null, -- 'weight', 'workout', 'water', 'steps', 'eye_care'
  value jsonb not null, -- flexible: {kg: 87.5} or {exercise: "push", sets: 4} etc.
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);
```

### spiritual_logs
Prayer, Quran, azkar tracking.

```sql
create table spiritual_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  log_type text not null, -- 'prayer', 'quran', 'azkar', 'dua'
  value jsonb not null, -- {prayer: "fajr", completed: true} or {pages: 3} etc.
  date date not null default current_date,
  created_at timestamptz default now()
);
```

### shared_lists
Grocery, tasks, watchlists, etc.

```sql
create table shared_lists (
  id uuid primary key default gen_random_uuid(),
  list_type text not null, -- 'grocery', 'task', 'movie', 'restaurant', 'travel'
  title text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table shared_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shared_lists(id) on delete cascade,
  content text not null,
  is_completed boolean default false,
  added_by uuid references profiles(id),
  position integer default 0,
  metadata jsonb default '{}', -- rating, url, notes, etc.
  created_at timestamptz default now()
);
```

### milestones
Relationship timeline events.

```sql
create table milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  icon text, -- lucide icon name
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### notifications
Scheduled notification definitions.

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references profiles(id),
  title text not null,
  body text not null,
  category text, -- 'azkar', 'health', 'love', 'reminder', 'custom'
  schedule_cron text, -- cron expression for recurring
  next_fire_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## Edge Functions

### send-notification
Triggered by pg_cron. Queries due notifications, sends via Web Push.

### check-schedules
Triggered by pg_cron every minute. Updates `next_fire_at` for recurring notifications.

## External APIs

### Aladhan Prayer Times
- URL: `https://api.aladhan.com/v1/timingsByCity`
- Params: `city=Cairo&country=Egypt&method=5` (Egyptian General Authority)
- No API key needed
- Cache response for 24 hours
