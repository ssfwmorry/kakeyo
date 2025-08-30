-- now: 2025-08-30 23:07
-- migration-sort: 1
drop table if exists develop.day_classifications cascade;

create table develop.day_classifications (
    id    smallint    primary key,
    name  varchar(10) not null check (length(name) <= 10),
    value smallint    not null
);

insert into develop.day_classifications (id, name, value)
values
    (1, '毎月 1 日',  '1'),
    (2, '毎月 10 日', '10'),
    (3, '毎月 15 日', '15'),
    (4, '毎月 25 日', '25')
;

alter table develop.day_classifications
    enable row level security;

create policy "develop.day_classifications select"
    on develop.day_classifications for select
    to anon
    using (
        true
    )
;

-- migration-sort: 5
drop table if exists develop.color_classifications cascade;

create table develop.color_classifications (
    id    smallint    primary key,
    name  varchar(20) not null check (length(name) <= 20)
);

insert into develop.color_classifications (id, name)
values
    (1, 'red'),
    (2, 'pink'),
    (3, 'purple'),
    (4, 'deep-purple'),
    (5, 'indigo'),
    (6, 'blue'),
    (7, 'light-blue'),
    (8, 'cyan'),
    (9, 'teal'),
    (10, 'green'),
    (11, 'light-green'),
    (12, 'lime'),
    (13, 'amber'),
    (14, 'orange'),
    (15, 'brown'),
    (16, 'blue-grey'),
    (17, 'grey'),
    (18, 'black')
;

alter table develop.color_classifications
    enable row level security;

create policy "develop.color_classifications select"
    on develop.color_classifications for select
    to anon
    using (
        true
    )
;

-- migration-sort: 11
drop table if exists develop.users cascade;

create table develop.users (
    uid   varchar(28)    primary key,
    mail  varchar(100)   not null check (length(mail) <= 100),
    name  varchar(10)    not null check (length(name) <= 10)
);

alter table develop.users
    enable row level security;

create policy "develop.users all"
    on develop.users for all
    to anon
    using (
        true
    )
;

-- migration-sort: 15
drop table if exists develop.pairs cascade;

create table develop.pairs (
    id       serial      primary key,
    user1_id varchar(28) not null,
    user2_id varchar(28) not null,

    foreign key (user1_id) references develop.users (uid),
    foreign key (user2_id) references develop.users (uid)
);

alter table develop.pairs
    enable row level security;

create policy "develop.pairs all"
    on develop.pairs for all
    to anon
    using (
        true
    )
;

-- migration-sort: 20
drop table if exists develop.methods cascade;

create table develop.methods (
    id                      serial       primary key,
    user_id                 varchar(28),
    pair_id                 integer,
    name                    varchar(10)  not null check (length(name) <= 10),
    is_pay                  boolean,
    color_classification_id smallint     not null,
    sort                    serial       not null,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (color_classification_id) references develop.color_classifications (id)
);

alter table develop.methods
    enable row level security;

create policy "develop.methods all"
    on develop.methods for all
    to anon
    using (
        true
    )
;

-- migration-sort: 30
drop table if exists develop.types cascade;
create table develop.types (
    id                      serial       primary key,
    user_id                 varchar(28),
    pair_id                 integer,
    name                    varchar(10)  not null check (length(name) <= 10),
    is_pay                  boolean      not null,
    color_classification_id smallint     not null,
    sort                    serial       not null,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (color_classification_id) references develop.color_classifications (id)
);

alter table develop.types
    enable row level security;

create policy "develop.types all"
    on develop.types for all
    to anon
    using (
        true
    )
;

-- migration-sort: 35
drop table if exists develop.sub_types cascade;

create table develop.sub_types (
    id      serial      primary key,
    type_id integer     not null,
    name    varchar(10) not null check (length(name) <= 10),
    sort    serial      not null,

    foreign key (type_id) references develop.types (id)
);

alter table develop.sub_types
    enable row level security;

create policy "develop.sub_types all"
    on develop.sub_types for all
    to anon
    using (
        true
    )
;

-- migration-sort: 40
drop table if exists develop.planned_records cascade;

create table develop.planned_records (
    id                    serial       primary key,
    user_id               varchar(28),
    pair_id               integer,
    day_classification_id smallint     not null,
    is_pay                boolean      not null,
    method_id             integer      not null,
    type_id               integer      not null,
    sub_type_id           integer,
    price                 integer      not null check (price <= 1000000),
    memo                  text,
    sort                  serial       not null,
    updated_at            timestamptz  not null default now(),
    record_type           smallint     not null default 0,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (day_classification_id) references develop.day_classifications (id),
    foreign key (method_id) references develop.methods (id),
    foreign key (type_id) references develop.types (id),
    foreign key (sub_type_id) references develop.sub_types (id)
);

-- update_at の設定
create extension if not exists moddatetime schema extensions;
create trigger handle_updated_at before update on develop.planned_records
    for each row execute procedure moddatetime (updated_at);

alter table develop.planned_records
    enable row level security;

create policy "develop.planned_records all"
    on develop.planned_records for all
    to anon
    using (
        true
    )
;

-- migration-sort: 45
drop table if exists develop.records cascade;

create table develop.records (
    id                bigserial    primary key,
    user_id           varchar(28)  not null,
    pair_id           integer,
    datetime          timestamptz  not null,
    is_pay            boolean,
    method_id         integer      not null,
    type_id           integer,
    sub_type_id       integer,
    price             integer      not null check (price <= 1000000),
    memo              text,
    planned_record_id integer,
    is_settled        boolean,
    record_type       smallint     not null default 0,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (method_id) references develop.methods (id),
    foreign key (type_id) references develop.types (id),
    foreign key (sub_type_id) references develop.sub_types (id),
    foreign key (planned_record_id) references develop.planned_records (id) on delete set null
);

alter table develop.records
    enable row level security;

create policy "develop.records all"
    on develop.records for all
    to anon
    using (
        true
    )
;

-- migration-sort: 50
drop table if exists develop.plan_types cascade;
create table develop.plan_types (
    id                      serial      primary key,
    user_id                 varchar(28),
    name                    varchar(10) not null check (length(name) <= 10),
    color_classification_id smallint    not null,
    sort                    serial      not null,
    pair_id                 integer,

    foreign key (user_id) references develop.users (uid),
    foreign key (color_classification_id) references develop.color_classifications (id),
    foreign key (pair_id) references develop.pairs (id)
);

alter table develop.plan_types
    enable row level security;

create policy "develop.plan_types all"
    on develop.plan_types for all
    to anon
    using (
        true
    )
;

-- migration-sort: 52
drop table if exists develop.conditions cascade;
create table develop.conditions (
    id             serial  primary key,
    month          int,
    month_day      varchar(5),
    condition_type smallint not null,
    base_type      smallint
);

alter table develop.conditions
    enable row level security;

create policy "develop.conditions all"
    on develop.conditions for all
    to anon
    using (
        true
    )
;

-- migration-sort: 53
drop table if exists develop.reminders cascade;
create table develop.reminders (
    id                      serial      primary key,
    user_id                 varchar(28),
    pair_id                 integer,
    name                    varchar(10) not null check (length(name) <= 10),
    reminder_type           smallint    not null,
    condition_id            integer     not null,
    date                    date        not null,
    memo                    text,
    color_classification_id smallint    not null,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (condition_id) references develop.conditions (id),
    foreign key (color_classification_id) references develop.color_classifications (id)
);

alter table develop.reminders
    enable row level security;

create policy "develop.reminders all"
    on develop.reminders for all
    to anon
    using (
        true
    )
;

-- migration-sort: 55
drop table if exists develop.plans cascade;

create table develop.plans (
    id           serial       primary key,
    user_id      varchar(28),
    pair_id      integer,
    start_date   date         not null,
    end_date     date         not null,
    plan_type_id integer,
    name         varchar(30)  not null check (length(name) <= 30),
    memo         text,
    reminder_id  integer,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (plan_type_id) references develop.plan_types (id)
    foreign key (reminder_id) references develop.reminders (id)
);

alter table develop.plans
    enable row level security;

create policy "develop.plans all"
    on develop.plans for all
    to anon
    using (
        true
    )
;

-- migration-sort: 60
drop table if exists develop.memos cascade;
create table develop.memos (
    id      serial      primary key,
    user_id varchar(28),
    pair_id integer,
    memo    varchar(30) not null,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id)
);

alter table develop.memos
    enable row level security;

create policy "develop.memos all"
    on develop.memos for all
    to anon
    using (
        true
    )
;

-- migration-sort: 65
drop table if exists develop.short_cuts cascade;
create table develop.short_cuts (
    id                bigserial    primary key,
    user_id           varchar(28)  not null,
    pair_id           integer,
    is_pay            boolean      not null,
    method_id         integer      not null,
    type_id           integer      not null,
    sub_type_id       integer,
    price             integer      not null check (price <= 1000000),
    memo              text,
    record_type       smallint     not null default 0,

    foreign key (user_id) references develop.users (uid),
    foreign key (pair_id) references develop.pairs (id),
    foreign key (method_id) references develop.methods (id),
    foreign key (type_id) references develop.types (id),
    foreign key (sub_type_id) references develop.sub_types (id)
);

alter table develop.short_cuts
    enable row level security;

create policy "develop.short_cuts all"
    on develop.short_cuts for all
    to anon
    using (
        true
    )
;

-- migration-sort: 70
drop table if exists develop.banks cascade;
create table develop.banks (
    id                      serial      primary key,
    user_id                 varchar(28) not null,
    name                    varchar(30) not null,
    color_classification_id smallint    not null,

    foreign key (user_id) references develop.users (uid),
    foreign key (color_classification_id) references develop.color_classifications (id)
);

alter table develop.banks
    enable row level security;

create policy "develop.banks all"
    on develop.banks for all
    to anon
    using (
        true
    )
;

-- migration-sort: 75
drop table if exists develop.bank_balances cascade;
create table develop.bank_balances (
    id         serial      primary key,
    bank_id    integer     not null,
    price      integer     not null,
    created_at timestamptz not null default now(),

    foreign key (bank_id) references develop.banks (id)
);

alter table develop.bank_balances
    enable row level security;

create policy "develop.bank_balances all"
    on develop.bank_balances for all
    to anon
    using (
        true
    )
;

