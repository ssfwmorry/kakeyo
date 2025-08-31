# スキーマ変更による DML

開発 DB と本番 DB との差分を埋めるために実行する DML を記述する

## 20231112\_開発 DB delevelop と本番 DB public を分離する作業

- public よりも develop が進んでいるため、開発時の `docs/` 配下は、develop 状態の想定とする
- PUSH する内容は本番環境であるべきなので、ソースコードは `public` 想定とする
- [公式 Docs](https://supabase.com/docs/guides/api/using-custom-schemas) に従い以下を適用済み
  ```sql
  GRANT USAGE ON SCHEMA develop TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA develop TO anon, authenticated, service_role;
  GRANT ALL ON ALL ROUTINES IN SCHEMA develop TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA develop TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA develop GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA develop GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA develop GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ```

## 20231217\_開発 DB に plan_types に関して、pairs テーブルの追加を反映させる作業

```sql
create table pairs; -- 略
-- develop.plan_types
alter table develop.plan_types add column pair_id integer; -- postgreSQL ではカラムの位置を指定できないので末尾になる
alter table develop.plan_types alter column user_id drop not null;
alter table develop.plan_types add foreign key (pair_id) references develop.pairs (id);
```

`func_get_plan_type_list` も反映

## 20231219\_開発 DB に types と methods と planned_records に関して、pairs テーブルの追加を反映させる作業

```sql
-- develop.types
alter table develop.types add column pair_id integer; -- postgreSQL ではカラムの位置を指定できないので末尾になる
alter table develop.types alter column user_id drop not null;
alter table develop.types add foreign key (pair_id) references develop.pairs (id);
-- develop.methods
alter table develop.methods add column pair_id integer; -- postgreSQL ではカラムの位置を指定できないので末尾になる
alter table develop.methods alter column user_id drop not null;
alter table develop.methods add foreign key (pair_id) references develop.pairs (id);
-- develop.planned_records
alter table develop.planned_records add column pair_id integer; -- postgreSQL ではカラムの位置を指定できないので末尾になる
alter table develop.planned_records alter column user_id drop not null;
alter table develop.planned_records add foreign key (pair_id) references develop.pairs (id);
```

`func_get_type_list` と `func_get_method_list` と `func_get_planned_record_list` も反映

## 20231223\_開発 DB に plans に関して、pairs テーブルの追加を反映させる作業

```sql
-- develop.plans
alter table develop.plans add column pair_id integer; -- postgreSQL ではカラムの位置を指定できないので末尾になる
alter table develop.plans alter column user_id drop not null;
alter table develop.plans add foreign key (pair_id) references develop.pairs (id);
```

`func_get_plan_list` も反映

## 20231223\_本番 DB に types と methods と planned_records と plans に関して、pairs テーブルの追加を反映させる作業

```sql
create table public.pairs; -- 略
insert into public.pairs; -- 略（共有したいユーザ同士を、Supabase 画面上で手動により更新）
-- public.plan_types
alter table public.plan_types add column pair_id integer;
alter table public.plan_types alter column user_id drop not null;
alter table public.plan_types add foreign key (pair_id) references public.pairs (id);
-- public.types
alter table public.types add column pair_id integer;
alter table public.types alter column user_id drop not null;
alter table public.types add foreign key (pair_id) references public.pairs (id);
-- public.methods
alter table public.methods add column pair_id integer;
alter table public.methods alter column user_id drop not null;
alter table public.methods add foreign key (pair_id) references public.pairs (id);
-- public.planned_records
alter table public.planned_records add column pair_id integer;
alter table public.planned_records alter column user_id drop not null;
alter table public.planned_records add foreign key (pair_id) references public.pairs (id);
-- public.plans
alter table public.plans add column pair_id integer;
alter table public.plans alter column user_id drop not null;
alter table public.plans add foreign key (pair_id) references public.pairs (id);
```

以下も反映

- `public.func_get_type_list`
- `public.func_get_method_list`
- `public.func_get_planned_record_list`
- `public.func_get_plan_type_list`
- `public.func_get_plan_list`

## 20231224\_開発 DB と 本番 DB に users と records に関して、pairs テーブルの追加を反映させる作業

```sql
-- develop.users
alter table develop.users add column name varchar(10) not null default '' check (length(name) <= 10);
alter table develop.users alter column name drop default;
-- develop.records
alter table develop.records add column pair_id integer;
alter table develop.records add foreign key (pair_id) references develop.pairs (id);

-- public.users
alter table public.users add column name varchar(10) not null default '' check (length(name) <= 10);
update public.users set name = '森' where --- 略
update public.users set name = '青木' where --- 略
alter table public.users alter column name drop default;
-- public.records
alter table public.records add column pair_id integer;
alter table public.records add foreign key (pair_id) references public.pairs (id);

```

以下も反映

- `develop.func_get_record_list`
- `public.func_get_record_list`

## 20231228\_開発 DB と 本番 DB に get_month_sum と get_record_list を反映させる作業

- `develop.func_get_month_sum`
- `develop.func_get_record_list`
- `public.func_get_month_sum`
- `public.func_get_record_list`

## 20231230\_開発 と 本番 DB の records に is_instead を反映させる作業

```sql
alter table develop.records alter column user_id drop not null;
alter table develop.records add column is_instead boolean;
alter table public.records alter column user_id drop not null;
alter table public.records add column is_instead boolean;
```

- `develop.func_get_record_list`
- `public.func_get_record_list`

## 20240101\_開発 と 本番 DB の get_record_list に method_color_classification_name を反映させる作業

- `develop.func_get_record_list`
- `public.func_get_record_list`

## 20240102\_開発 と 本番 DB の get\_\*\_summary に isPair を反映させる作業

- `develop.get_type_summary`
- `public.get_type_summary`
- `develop.get_method_summary`
- `public.get_method_summary`

## 20240102\_開発 と 本番 DB に get_summarized_record_list と get_planned_record_list を反映させる作業

- `develop.get_summarized_record_list`
- `public.get_summarized_record_list`
- `develop.get_planned_record_list`
- `public.get_planned_record_list`

## 20240106\_開発 と 本番 DB に post_records を反映させる作業

- `develop.post_records`
- `public.post_records`

## 20240106\_開発 と 本番 DB に records が既存である planned_records の削除を可能にする作業

```sql
alter table develop.records drop constraint records_planned_record_id_fkey;
alter table develop.records add foreign key (planned_record_id) references develop.planned_records (id) on delete set null;
alter table public.records drop constraint records_planned_record_id_fkey;
alter table public.records add foreign key (planned_record_id) references public.planned_records (id) on delete set null;
```

## 20240106\_開発 と 本番 DB に get_pay_and_income_list を反映させる作業

- `develop.get_pay_and_income_list`
- `public.get_pay_and_income_list`

## 20240127\_開発 と 本番 DB に get_paired_record_list を反映させる作業

- `develop.get_paired_record_list`
- `public.get_paired_record_list`

## 20240217\_開発 と 本番 DB に records.is_settled を反映させる作業

精算した起票にチェックを入れられるようにする

```sql
alter table develop.records add column is_settled boolean;
update develop.records set is_settled = false where is_instead = true;
alter table public.records add column is_settled boolean;
update public.records set is_settled = false where is_instead = true;
```

- `develop.get_paired_record_list`
- `public.get_paired_record_list`
- `develop.post_records`
- `public.post_records`

## 20240503\_開発 と 本番 DB に get_type_summary, get_method_summary を反映させる作業

- `develop.get_type_summary`
- `public.get_type_summary`

- `develop.get_method_summary`
- `public.get_method_summary`

## 20240503\_開発 と 本番 DB に get_pay_and_income_list を反映させる作業

- `develop.get_pay_and_income_list`
- `public.get_pay_and_income_list`

## 20240623\_開発と本番 DB に memos を反映させる作業

```sql
-- publicも同様
drop table if exists develop.memos cascade;
create table develop.memos (
    id      serial      primary key,
    user_id varchar(28),
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

## 20250405\_開発と本番 DB の records のカラムを変更する対応

```sql
alter table develop.records alter column is_pay drop not null; -- publicも適応
alter table develop.records alter column type_id drop not null; -- publicも適応
alter table develop.records add column record_type smallint default 0 not null; -- publicも適応
update develop.records set record_type = 5 where user_id is not null and pair_id is not null; -- publicも適応
update develop.records set record_type = 10 where user_id is null and pair_id is not null; -- publicも適応
```

## 20250405\_開発と本番 DB の records のカラムを変更する対応

以下を public も

- `develop.get_method_summary`
- `develop.get_type_summary`
- `develop.get_pay_and_income_list`
- `develop.post_records`
- `develop.get_record_list`
- `develop.get_summarized_record_list`
- `develop.get_paired_record_list`

```sql
alter table develop.records drop column is_instead; -- publicも適応
```

## 20250405\_開発と本番 DB の methods のカラムを変更する対応

```sql
alter table develop.methods alter column is_pay drop not null; -- publicも適応
```

## 20250405\_開発と本番 DB の 精算画面に日にちを表示する対応

- `develop.get_paired_record_list`
- `public.get_paired_record_list`

## 20250405\_開発 DB の RPC に精算用 record 対応する

- `develop.get_record_list`
- `develop.get_month_sum`
- `develop.get_summarized_record_list`

## 20250406\_開発 DB の RPC に精算用 record 対応する

- `develop.get_type_summary`

## 20250409\_開発 DB の RPC に精算用 record 対応する

- `develop.get_method_summary`
- `develop.get_type_summary`
- `develop.get_paired_record_list`

## 20250429\_開発 DB の RPC に精算用 record 対応する

- `develop.get_pay_and_income_list`
- `develop.post_records`

## 20250503\_本番 DB の RPC に精算用 record 対応する

- `public.get_month_sum`
- `public.get_method_summary`
- `public.get_type_summary`
- `public.get_pay_and_income_list`
- `public.post_records`
- `public.get_record_list`
- `public.get_summarized_record_list`
- `public.get_paired_record_list`

## 20250518\_開発と本番 DB の planned_records のカラムを変更する対応

```sql
alter table develop.planned_records add column record_type smallint default 0 not null; -- publicも適応
update develop.planned_records set record_type = 5 where user_id is not null and pair_id is not null; -- publicも適応
update develop.planned_records set record_type = 10 where user_id is null and pair_id is not null; -- publicも適応
```

## 20250524\_開発と 本番 DB に RPC を適応する

- `develop.get_sub_type_summary`
- `public.get_sub_type_summary`

## 20250531\_開発と 本番 DB に RPC を適応する

- `develop.get_type_summary_period`
- `public.get_type_summary_period`

## 20250720\_開発と 本番 DB に short_cuts を適応する

- tables.md の short_cuts テーブルを migration
  - 実際にデータ投入は Supabase の WEB サイト経由で行う

## 20250803\_開発 DB と本番 DB に banks と bank_balances テーブルを作成する

## 20250823\_開発 DB の plans にカラム追加・変更、reminders と conditions テーブルを作成する

```sql
ALTER TABLE develop.plans ADD COLUMN reminder_id int;
ALTER TABLE develop.plans ADD FOREIGN KEY (reminder_id) REFERENCES develop.reminders (id);
ALTER TABLE develop.plans ALTER COLUMN plan_type_id DROP NOT NULL;
```

## 20250824\_開発の get_plan_list に plan_type_id が Nullable になるのを許容する

- `develop.get_plan_list`

## 20250824\_本番の plans にカラム追加・変更、reminders と conditions テーブルを作成、get_plan_list を変更

```sql
ALTER TABLE public.plans ADD COLUMN reminder_id int;
ALTER TABLE public.plans ADD FOREIGN KEY (reminder_id) REFERENCES public.reminders (id);
ALTER TABLE public.plans ALTER COLUMN plan_type_id DROP NOT NULL;
```

- `public.get_plan_list`

## 20250830\_開発と本番 DB の　 reminders と conditions のカラムを調整

```sql
ALTER TABLE develop.conditions ALTER COLUMN month DROP NOT NULL;
ALTER TABLE develop.conditions ADD COLUMN month_day varchar(5);
ALTER TABLE develop.conditions ADD COLUMN condition_type smallint;
UPDATE develop.conditions SET condition_type=5;
ALTER TABLE develop.conditions ADD COLUMN base_type smallint;
UPDATE develop.conditions SET base_type=5
  WHERE id IN (SELECT condition_id FROM develop.reminders WHERE base_type=5);
UPDATE develop.conditions SET base_type=10
  WHERE id IN (SELECT condition_id FROM develop.reminders WHERE base_type=10);
ALTER TABLE develop.conditions ALTER COLUMN condition_type SET not null;
ALTER TABLE develop.reminders DROP COLUMN base_type;
-- publicは省略
```

## 20250830\_開発と本番 DB の　 get_plan_list 更新

- `develop.get_plan_list`
- `public.get_plan_list`
