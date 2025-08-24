# tables

最新の DDL を記載する

開発時は 'develop.${table_name}' を使う。一方、本番では 'public.${table_name}' を使う。

## 順番

- 1: [day_classifications](#day_classifications)
- 5: [color_classifications](#color_classifications)
- 11: [users](#users)
- 15: [pairs(users の後)](#pairs)
- 20: [methods](#methods)
- 30: [types](#types)
- 35: [sub_types(types の後)](#sub_types)
- 40: [planned_records](#planned_records)
- 45: [records(planned_records の後)](#records)
- 50: [plan_types](#plan_types)
- 52: [conditions](#conditions)
- 53: [reminders(conditions の後)](#reminders)
- 55: [plans(plan_types, reminders の後)](#plans)
- 60: [memos](#memos)
- 65: [short_cuts](#short_cuts)
- 70: [banks](#banks)
- 75: [bank_balances(banks の後)](#bank_balances)

## transaction tables

### users

#### schema

| name |  type  | size | required | auto_increment | key | remarks                                                     |
| :--- | :----: | :--: | :------: | :------------: | :-: | :---------------------------------------------------------- |
| uid  | string |  28  |    v     |       -        | PK  | 固定長だが、JS から操作する時にエラーとなるので自由長とする |
| mail | string |  -   |    v     |       -        |  -  | -                                                           |
| name | string |  10  |    v     |       -        |  -  | -                                                           |

#### migration

```sql
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
```

#### example

| uid                          |         mail          | name  |
| :--------------------------- | :-------------------: | :---: |
| OsoPkexxPDTjocAIhpXgfvsswTg1 |   test@example.com    | test1 |
| HWcdx07GOzdMNqBhHlL65wRFoK73 | demouser1@example.com | test2 |

### pairs

#### schema

| name     |  type  | size | required | auto_increment |    key    | remarks |
| :------- | :----: | :--: | :------: | :------------: | :-------: | :------ |
| id       |  int   |  -   |    v     |       v        |    PK     | -       |
| user1_id | string |  28  |    v     |       -        | users.uid | -       |
| user2_id | string |  28  |    v     |       -        | users.uid | -       |

#### migration

```sql
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
```

#### example

| id  |           user1_id           |           user2_id           |
| :-- | :--------------------------: | :--------------------------: |
| 1   | OsoPkexxPDTjocAIhpXgfvsswTg1 | HWcdx07GOzdMNqBhHlL65wRFoK73 |

### methods

#### schema

| name                    |  type   |  size  | required | auto_increment |           key            | remarks                                      |
| :---------------------- | :-----: | :----: | :------: | :------------: | :----------------------: | :------------------------------------------- |
| id                      |   int   |   -    |    v     |       v        |            PK            | -                                            |
| user_id                 | string  |   28   |    -     |       -        |        users.uid         | pair_id とどちらか必須                       |
| pair_id                 |   int   |   -    |    -     |       -        |         pairs.id         | user_id とどちらか必須                       |
| name                    | string  | max 10 |    v     |       -        |            -             | -                                            |
| is_pay                  |  bool   |   -    |    -     |       -        |            -             | 送金方法の場合は NULL となる                 |
| color_classification_id | tinyint |   -    |    v     |       -        | color_classifications.id | [定義](#color_classification)を参照          |
| sort                    |   int   |   -    |    v     |       v        |            -             | クエリひとつでスワップするために UK としない |

##### 起こり得る状況

| user_id | pair_id |   is_pay   | 状況説明                                       |
| :-----: | :-----: | :--------: | :--------------------------------------------- |
|    Q    |    -    | true/false | records.record_type=0, 5 に紐づく支払/受取方法 |
|    -    |    W    | true/false | records.record_type=10 に紐づく支払/受取方法   |
|    -    |    W    |     -      | records.record_type=15 に紐づく送金方法        |

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id |    name    | is_pay | color_classification_id | sort |
| :-- | :-----: | :-----: | :--------: | :----: | :---------------------: | :--: |
| 1   |    2    |    -    |    現金    |   T    |            1            |  1   |
| 2   |    2    |    -    | 電子マネー |   T    |            2            |  2   |
| 3   |    2    |    -    |   クレカ   |   T    |            3            |  3   |
| 4   |    -    |    1    |    現金    |   F    |            4            |  4   |
| 5   |    -    |    1    |  振り込み  |   F    |            5            |  5   |

### types

#### schema

| name                    |  type   |  size  | required | auto_increment |           key            | remarks                                      |
| :---------------------- | :-----: | :----: | :------: | :------------: | :----------------------: | :------------------------------------------- |
| id                      |   int   |   -    |    v     |       v        |            PK            | -                                            |
| user_id                 | string  |   28   |    -     |       -        |        users.uid         | pair_id とどちらか必須                       |
| pair_id                 |   int   |   -    |    -     |       -        |         pairs.id         | user_id とどちらか必須                       |
| name                    | string  | max 10 |    v     |       -        |            -             | -                                            |
| is_pay                  |  bool   |   -    |    v     |       -        |            -             | -                                            |
| color_classification_id | tinyint |   -    |    v     |       -        | color_classifications.id | [定義](#color_classification)を参照          |
| sort                    |   int   |   -    |    v     |       v        |            -             | クエリひとつでスワップするために UK としない |

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id |  name  | is_pay | color_classification_id | sort |
| :-- | :-----: | :-----: | :----: | :----: | :---------------------: | :--: |
| 1   |    2    |    -    |  食費  |   T    |            1            |  1   |
| 2   |    2    |    -    | 交通費 |   T    |            2            |  2   |
| 3   |    -    |    1    |  雑費  |   T    |            3            |  3   |
| 4   |    -    |    1    |  給与  |   F    |            1            |  4   |
| 5   |    -    |    1    |  賞与  |   F    |            2            |  5   |

### sub_types

#### schema

| name    |  type  |  size  | required | auto_increment |   key    | remarks                                      |
| :------ | :----: | :----: | :------: | :------------: | :------: | :------------------------------------------- |
| id      |  int   |   -    |    v     |       v        |    PK    | -                                            |
| type_id |  int   |   -    |    v     |       -        | types.id | -                                            |
| name    | string | max 10 |    v     |       -        |    -     | -                                            |
| sort    |  int   |   -    |    v     |       v        |    -     | クエリひとつでスワップするために UK としない |

#### migration

```sql
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
```

#### example

| id  | type_id |     name     | sort |
| :-- | :-----: | :----------: | :--: |
| 1   |    2    |    通勤費    |  1   |
| 2   |    2    | プライベート |  2   |

### records

#### schema

| name              |   type   | size | required | auto_increment |        key         | remarks                                       |
| :---------------- | :------: | :--: | :------: | :------------: | :----------------: | :-------------------------------------------- |
| id                |   int    |  -   |    v     |       v        |         PK         | -                                             |
| user_id           |  string  |  28  |    -     |       -        |     users.uid      | [起こり得る状況](#起こり得る状況) 参照        |
| pair_id           |   int    |  -   |    -     |       -        |      pairs.id      | -                                             |
| datetime          | datetime |  -   |    v     |       -        |         UK         | -                                             |
| is_pay            |   bool   |  -   |    -     |       -        |         -          | record_type=5 の時 true 固定                  |
| method_id         |   int    |  -   |    v     |       -        |     methods.id     | -                                             |
| type_id           |   int    |  -   |    -     |       -        |      types.id      | -                                             |
| sub_type_id       |   int    |  -   |    -     |       -        |    sub_types.id    | -                                             |
| price             |   int    |  -   |    v     |       -        |         -          | -                                             |
| memo              |  string  |  -   |    -     |       -        |         -          | -                                             |
| planned_record_id |   int    |  -   |    -     |       -        | planned_records.id | 外部キーが削除されると、null となる           |
| is_settled        |   bool   |  -   |    -     |       -        |         -          | record_type=5 の時、精算済みかどうかを示す    |
| record_type       |   int    |  -   |    v     |       -        |         -          | 0: SELF, 5: INSTEAD, 10: PAIR, 15: SETTLEMENT |

※ is_pay は、method_id からわかるので不要かも、あった方が便利そう  
※ pair_id, user_id からわかるので不要かも、あった方が便利そう

##### 起こり得る状況

| user_id | pair_id |  record_type   |   is_pay   | type_id | method_id | is_settled | 状況説明                                                           |
| :-----: | :-----: | :------------: | :--------: | :-----: | :-------: | :--------: | :----------------------------------------------------------------- |
|    Q    |    -    |    0: SELF     | true/false |    E    |     R     |     -      | Q さん個人の record                                                |
|    Q    |    W    |   5: INSTEAD   |    true    |    E    |     R     | true/false | Q さんが立替, is_pay は true 固定                                  |
|    -    |    W    |    10: PAIR    | true/false |    D    |     F     |     -      | 二人の record, type_id に紐づく types.pair_id あり                 |
|    Q    |    W    | 15: SETTLEMENT |     -      |    -    |     F     |     -      | Q さんが払った精算 record, method_id に紐づく methods.pair_id あり |

※ アルファベットは固有の ID を示す

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id |      datetime       | is_pay | method_id | type_id | sub_type_id | price  | memo | plannde_record_id |
| :-- | :-----: | :-----: | :-----------------: | :----: | :-------: | :-----: | :---------: | :----: | :--: | :---------------: |
| 1   |    2    |    -    | 2022-01-01 12:00:11 |   T    |     1     |    2    |      2      |  320   |  -   |         -         |
| 2   |    -    |    1    | 2022-01-01 12:00:22 |   F    |     4     |    4    |      -      | 200000 | 月給 |         1         |

### planned_records

#### schema

| name                  |   type   | size | required | auto_increment |          key           | remarks                                                                          |
| :-------------------- | :------: | :--: | :------: | :------------: | :--------------------: | :------------------------------------------------------------------------------- |
| id                    |   int    |  -   |    v     |       v        |           PK           | -                                                                                |
| user_id               |  string  |  28  |    -     |       -        |       users.uid        | pair_id とどちらか必須                                                           |
| pair_id               |   int    |  -   |    -     |       -        |        pairs.id        | user_id とどちらか必須                                                           |
| day_classification_id | tinyint  |  -   |    v     |       -        | day_classifications.id | [定義](#day_classification)を参照                                                |
| is_pay                |   bool   |  -   |    v     |       -        |           -            | -                                                                                |
| method_id             |   int    |  -   |    v     |       -        |       methods.id       | -                                                                                |
| type_id               |   int    |  -   |    v     |       -        |        types.id        | -                                                                                |
| sub_type_id           |   int    |  -   |          |       -        |      sub_types.id      | -                                                                                |
| price                 |   int    |  -   |    v     |       -        |           -            | -                                                                                |
| memo                  |  string  |  -   |    -     |       -        |           -            | -                                                                                |
| sort                  |   int    |  -   |    v     |       v        |           -            | クエリひとつでスワップするために UK としない                                     |
| updated_at            | datetime |  -   |    v     |       -        |           -            | supabase [固有の設定](https://zenn.dev/matken/articles/supabase-timestamp)が必要 |
| record_type           |   int    |  -   |    v     |       -        |           -            | records テーブルと同様                                                           |

※ planned_records は record_type=15 となることがないので、is_pay と type_id は NotNull である

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id | day_classification_d | is_pay | method_id | type_id | sub_type_id | price  | memo | sort |     updated_at      |
| :-- | :-----: | :-----: | :------------------: | :----: | :-------: | :-----: | :---------: | :----: | :--: | :--: | :-----------------: |
| 1   |    2    |    -    |          4           |   T    |     4     |    4    |      -      | 200000 | 月給 |  1   | 2022-01-01 10:00:00 |

### plans

#### schema

| name         |  type  |  size  | required | auto_increment |      key      | remarks                                                   |
| :----------- | :----: | :----: | :------: | :------------: | :-----------: | :-------------------------------------------------------- |
| id           |  int   |   -    |    v     |       v        |      PK       | -                                                         |
| user_id      | string |   28   |    -     |       -        |   users.uid   | pair_id とどちらか必須                                    |
| pair_id      |  int   |   -    |    -     |       -        |   pairs.uid   | user_id とどちらか必須                                    |
| start_date   |  date  |   -    |    v     |       -        |       -       | -                                                         |
| end_date     |  date  |   -    |    v     |       -        |       -       | -                                                         |
| plan_type_id |  int   |   -    |    -     |       -        | plan_types.id | -                                                         |
| name         | string | max 30 |    v     |       -        |       -       | -                                                         |
| memo         | string |   -    |    -     |       -        |       -       | -                                                         |
| reminder_id  |  int   |   -    |    -     |       -        | reminders.id  | reminders.reminder_type=10(Stock)の場合に作られたかどうか |

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id |     start_date      |      end_date       | plan_type_id |   name   | memmo |
| :-- | :-----: | :-----: | :-----------------: | :-----------------: | :----------: | :------: | :---: |
| 1   |    2    |    -    | 2022-01-01 12:00:00 | 2022-01-02 12:00:00 |      1       | WEB 会議 | zoom  |

### plan_types

#### schema

| name                    |  type   |  size  | required | auto_increment |           key            | remarks                                      |
| :---------------------- | :-----: | :----: | :------: | :------------: | :----------------------: | :------------------------------------------- |
| id                      |   int   |   -    |    v     |       v        |            PK            | -                                            |
| user_id                 | string  |   28   |    -     |       -        |        users.uid         | pair_id とどちらか必須                       |
| pair_id                 |   int   |   -    |    -     |       -        |         pairs.id         | user_id とどちらか必須                       |
| name                    | string  | max 10 |    v     |       -        |            -             | -                                            |
| color_classification_id | tinyint |   -    |    v     |       -        | color_classifications.id | [定義](#color_classification)を参照          |
| sort                    |   int   |   -    |    v     |       v        |            -             | クエリひとつでスワップするために UK としない |

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id | name | color_classification_id | sort |
| :-- | :-----: | :-----: | :--: | :---------------------: | :--: |
| 1   |    2    |    -    | 仕事 |            1            |  1   |

### memos

#### schema

| name    |  type  |  size  | required | auto_increment |    key    | remarks                |
| :------ | :----: | :----: | :------: | :------------: | :-------: | :--------------------- |
| id      |  int   |   -    |    v     |       v        |    PK     | -                      |
| user_id | string |   28   |    -     |       -        | users.uid | pair_id とどちらか必須 |
| pair_id |  int   |   -    |    -     |       -        | pairs.id  | user_id とどちらか必須 |
| memo    | string | max 30 |    v     |       -        |     -     | -                      |

#### migration

```sql
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
```

#### example

| id  | user_id | pair_id |   memo   |
| :-- | :-----: | :-----: | :------: |
| 1   |    2    |    -    | 歯磨き粉 |

### short_cuts

#### schema

| name        |  type  | size | required | auto_increment |     key      | remarks                |
| :---------- | :----: | :--: | :------: | :------------: | :----------: | :--------------------- |
| id          |  int   |  -   |    v     |       v        |      PK      | -                      |
| user_id     | string |  28  |    -     |       -        |  users.uid   | pair_id とどちらか必須 |
| pair_id     |  int   |  -   |    -     |       -        |   pairs.id   | user_id とどちらか必須 |
| is_pay      |  bool  |  -   |    v     |       -        |      -       | -                      |
| method_id   |  int   |  -   |    v     |       -        |  methods.id  | -                      |
| type_id     |  int   |  -   |    v     |       -        |   types.id   | -                      |
| sub_type_id |  int   |  -   |    -     |       -        | sub_types.id | -                      |
| price       |  int   |  -   |    v     |       -        |      -       | -                      |
| memo        | string |  -   |    -     |       -        |      -       | -                      |
| record_type |  int   |  -   |    v     |       -        |      -       | records テーブルと同様 |

#### migration

```sql
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
```

### banks

#### schema

| name                    |  type   |  size  | required | auto_increment |           key            | remarks                             |
| :---------------------- | :-----: | :----: | :------: | :------------: | :----------------------: | :---------------------------------- |
| id                      |   int   |   -    |    v     |       v        |            PK            | -                                   |
| user_id                 | string  |   28   |    v     |       -        |        users.uid         | -                                   |
| name                    | string  | max 30 |    v     |       -        |            -             | -                                   |
| color_classification_id | tinyint |   -    |    v     |       -        | color_classifications.id | [定義](#color_classification)を参照 |

#### migration

```sql
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
```

### bank_balances

#### schema

| name       |   type   | size | required | auto_increment |   key    | remarks |
| :--------- | :------: | :--: | :------: | :------------: | :------: | :------ |
| id         |   int    |  -   |    v     |       v        |    PK    | -       |
| bank_id    |   int    |  -   |    v     |       -        | banks.id | -       |
| price      |   int    |  -   |    v     |       -        |    -     | -       |
| created_at | datetime |  -   |    v     |       -        |    -     | -       |

#### migration

```sql
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
```

### conditions

#### schema

| name  | type | size | required | auto_increment | key | remarks  |
| :---- | :--: | :--: | :------: | :------------: | :-: | :------- |
| id    | int  |  -   |    v     |       v        | PK  | -        |
| month | int  |  -   |    v     |       -        |  -  | N ヶ月後 |

#### migration

```sql
-- migration-sort: 52
drop table if exists develop.conditions cascade;
create table develop.conditions (
    id    serial  primary key,
    month int not null
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
```

### reminders

#### schema

| name                    |  type   |  size  | required | auto_increment |           key            | remarks                                                                    |
| :---------------------- | :-----: | :----: | :------: | :------------: | :----------------------: | :------------------------------------------------------------------------- |
| id                      |   int   |   -    |    v     |       v        |            PK            | -                                                                          |
| user_id                 | string  |   28   |    -     |       -        |        users.uid         | pair_id とどちらか必須                                                     |
| pair_id                 |   int   |   -    |    -     |       -        |         pairs.id         | user_id とどちらか必須                                                     |
| name                    | string  | max 10 |    v     |       -        |            -             | -                                                                          |
| reminder_type           | tinyint |   -    |    v     |       -        |         banks.id         | 5(Flow): チェック後に日付が変わる, 10(Stock): チェック後に plan として残る |
| condition_id            |   int   |   -    |    v     |       -        |      conditions.id       | -                                                                          |
| base_type               | tinyint |   -    |    v     |       -        |            -             | 5(Now): 基準が現在日付, 10(Date): 基準が date                              |
| date                    |  date   |   -    |    v     |       -        |            -             | -                                                                          |
| memo                    | string  |   -    |    -     |       -        |            -             | -                                                                          |
| color_classification_id | tinyint |   -    |    v     |       -        | color_classifications.id | [定義](#color_classification)を参照                                        |

#### migration

```sql
-- migration-sort: 53
drop table if exists develop.reminders cascade;
create table develop.reminders (
    id                      serial      primary key,
    user_id                 varchar(28),
    pair_id                 integer,
    name                    varchar(10) not null check (length(name) <= 10),
    reminder_type           smallint    not null,
    condition_id            integer     not null,
    base_type               smallint    not null,
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
```

## master tables

### day_classifications

毎月何日とするかを指定する

| id  | name(string) | value(int) |
| :-- | :----------: | :--------: |
| 1   |  毎月 1 日   |     1      |
| 2   |  毎月 10 日  |     10     |
| 3   |  毎月 15 日  |     15     |
| 4   |  毎月 25 日  |     25     |

#### migration

```sql
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
```

### color_classifications

| id  | name(string) |
| :-- | :----------: |
| 1   |     red      |
| 2   |     pink     |
| 3   |    purple    |
| 4   | deep-purple  |
| 5   |    indigo    |
| 6   |     blue     |
| 7   |  light-blue  |
| 8   |     cyan     |
| 9   |     teal     |
| 10  |    green     |
| 11  | light-green  |
| 12  |     lime     |
| 13  |    amber     |
| 14  |    orange    |
| 15  |    brown     |
| 16  |  blue-brown  |
| 17  |     grey     |
| 18  |    black     |

#### migration

```sql
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
```
