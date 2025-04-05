# functions

supabase に登録する RPC を記述する

## func_swap_method

- methods を入れ替える
- [参考](https://www.living-in.tokyo/post/2023/5/swap_in_sql/)

```sql
-- migration-sort: 1
drop function if exists develop.swap_method(id1 int, id2 int);

create or replace function develop.swap_method(id1 int, id2 int)
returns void
as $$
    update develop.methods as t1 SET sort = t2.sort
    from develop.methods as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;
```

## func_swap_type

- types を入れ替える
- [参考](https://www.living-in.tokyo/post/2023/5/swap_in_sql/)

```sql
-- migration-sort: 2
drop function if exists develop.swap_type(id1 int, id2 int);

create or replace function develop.swap_type(id1 int, id2 int)
returns void
as $$
    update develop.types as t1 SET sort = t2.sort
    from develop.types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;
```

## func_swap_sub_type

- sub_types を入れ替える
- [参考](https://www.living-in.tokyo/post/2023/5/swap_in_sql/)

```sql
-- migration-sort: 3
drop function if exists develop.swap_sub_type(id1 int, id2 int);

create or replace function develop.swap_sub_type(id1 int, id2 int)
returns void
as $$
    update develop.sub_types as t1 SET sort = t2.sort
    from develop.sub_types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;
```

## func_swap_plan_type

- plan_types を入れ替える
- [参考](https://www.living-in.tokyo/post/2023/5/swap_in_sql/)

```sql
-- migration-sort: 4
drop function if exists develop.swap_plan_type(id1 int, id2 int);

create or replace function develop.swap_plan_type(id1 int, id2 int)
returns void
as $$
    update develop.plan_types as t1 SET sort = t2.sort
    from develop.plan_types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;
```

## func_swap_planned_record

- planned_records を入れ替える
- [参考](https://www.living-in.tokyo/post/2023/5/swap_in_sql/)

```sql
-- migration-sort: 5
drop function if exists develop.swap_planned_record(id1 int, id2 int);

create or replace function develop.swap_planned_record(id1 int, id2 int)
returns void
as $$
    update develop.planned_records as t1 SET sort = t2.sort
    from develop.planned_records as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;
```

## func_get_month_sum

- 概要
  - 月毎に収支の集計を行う
- 入力例
  - input_user_id
    - 型: char(28)だと「{"code":"22001","details":null,"hint":null,"message":"value too long for type character(1)"}」エラーになるので varchar(30)とする
  - input_year_month
    - 例: '2022-01'
    - 型: varchar(7)
    - 備考: YYYY-MM の形式
- 出力例
  - 以下カラムを持つ 1 件のレコード
    - year_month
      - 例: '2022-01'
      - 型: vharchar(7)
      - 備考: input_year_month と同一の値
    - self_sum
      - 例: 9000
      - 型: int
      - 備考: 正の値は、収支がマイナスを意味する
    - pair_sum
    - both_sum

```sql
-- migration-sort: 6
drop function if exists develop.get_month_sum(input_user_id varchar(30), input_year_month varchar(7));

create or replace function develop.get_month_sum(input_user_id varchar(30), input_year_month varchar(7))
returns table (
    year_month varchar(7),
    self_sum int,
    pair_sum int,
    both_sum int
)
as $$
    with converted_price as (
        select
            case
                when records.pair_id is null and records.user_id = input_user_id then
                    case
                        when is_pay = false then price * (-1)
                        else price
                    end
                else 0
            end as self_price,
            case
                when records.pair_id is not null then
                    case
                        when is_pay = false then price * (-1)
                        else price
                    end
                else 0
            end as pair_price,
            case
                when records.user_id = input_user_id then
                    case
                        when is_pay = false then price * (-1)
                        else price
                    end
                else 0
            end as both_price,
            to_char(cast(datetime as date),'YYYY-MM') as year_month
        from develop.records
        left join develop.pairs on
            records.pair_id = pairs.id
        where
            (
                records.user_id = input_user_id
                or pairs.user1_id = input_user_id
                or pairs.user2_id = input_user_id
            )
            and to_char(cast(datetime as date),'YYYY-MM') = input_year_month
    )
    select
        year_month,
        sum(self_price) as self_sum,
        sum(pair_price) as pair_sum,
        sum(both_price) as both_sum
    from converted_price
    group by year_month;
$$ language sql;
```

## func_get_method_summary

- 概要
  - 期間ごとに method の集計を行う
- 入力例
  - input_user_id
    - 型: char(28)だと「{"code":"22001","details":null,"hint":null,"message":"value too long for type character(1)"}」エラーになるので varchar(30)とする
  - input_is_pay
    - 例: true
    - 型: bool
  - input_is_pair
  - input_is_include_instead
    - 立替起票を含めるか含めないかを指定する
  - input_year
    - 例: '2022'
    - 型: char(4)
  - input_month
    - 例: '01'
    - 型: varchar(2)
    - 備考: 今後の改修で、年単位の集計(isMonth=false)とする場合は、''で入ってくる想定
- 出力例
  - 以下カラムを持つ N 件のレコード
    - method_name
      - 例: '現金'
      - 型: varchar(10)
    - method_id
    - method_color_id
    - method_color_name
    - sum
      - 例: 7000
      - 型: int
      - 備考: input_is_pay と期間によって集約された methods の合計
      - `func_get_type_summary` との整合をとるためにカラム名は `sum` とする

```sql
-- migration-sort: 7
drop function if exists develop.get_method_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4));

create or replace function develop.get_method_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4))
returns table (
    method_name varchar(10),
    method_id int,
    pair_user_name varchar(10),
    color_name varchar(20),
    is_pair boolean,
    sum int
)
as $$
    with summarized_records as (
        select distinct
            records.method_id,
            sum(records.price) as sum
        from develop.records
        where
            (case
                -- TODO fix-bug これだと、全てのpairからrecordsをとってくるはず。pairsとJOINして絞り込む必要あり
                when input_is_pair = true and input_is_include_instead = true then pair_id is not null
                when input_is_pair = true and input_is_include_instead = false then (pair_id is not null and record_type in (10, 15))
                when input_is_pair = false and input_is_include_instead = true then (user_id = cast(input_user_id as char(28)))
                else (user_id = cast(input_user_id as char(28)) and pair_id is null)
            end)
            and is_pay = input_is_pay
            and to_char(cast(datetime as date),'YYYY-MM') = input_year || '-' || input_month
        group by method_id
    )
    select
        methods.name as method_name,
        methods.id as method_id,
        users.name as pair_user_name,
        color_classifications.name as color_name,
        methods.pair_id is not null as is_pair,
        summarized_records.sum
    from summarized_records
    inner join develop.methods on
        summarized_records.method_id = methods.id
    inner join develop.color_classifications on
        methods.color_classification_id = color_classifications.id
    left join develop.pairs on
        methods.pair_id = pairs.id
    left join develop.users on
        methods.user_id = users.uid
    order by summarized_records.sum desc;
$$ language sql;
```

## func_get_type_summary

- 概要
  - 期間ごとに type の集計を行う
- 入力例
  - input_user_id
    - 型: char(28)
  - input_is_pay
    - 例: true
    - 型: bool
  - input_is_pair
  - input_is_include_instead
    - 立替起票を含めるか含めないかを指定する
  - input_year
    - 例: '2022'
    - 型: char(4)
  - input_month
    - 例: '01'
    - 型: varchar(2)
    - 備考: 今後の改修で、年単位の集計(isMonth=false)とする場合は、''で入ってくる想定
- 出力例
  - 以下カラムを持つ N 件のレコード
    - type_name
    - type_id
    - is_pair
      - types.pair_id をもとに算出
    - sub_type_name
    - sub_type_id
    - color_name
    - sub_type_sum
      - 備考: sub_type ごとの合計が入る
        - type_id が設定済みで、sub_type が未設定のものの合計もここに入る
    - sum
      - 備考: input_is_pay と期間によって集約された methods の合計
        - `func_get_method_summary` との整合をとるためにカラム名は `sum` とする

```sql
-- migration-sort: 8
drop function if exists develop.get_type_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4));

create or replace function develop.get_type_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4))
returns table (
    type_name varchar(10),
    type_id int,
    is_pair boolean,
    sub_type_name varchar(10),
    sub_type_id int,
    color_name varchar(20),
    sub_type_sum int,
    sum int
)
as $$
    with summarized_records as (
        select distinct
            records.type_id,
            records.sub_type_id,
            sum(records.price) as sum
        from develop.records
        where
            (case
                -- TODO fix-bug これだと、全てのpairからrecordsをとってくるはず。pairsとJOINして絞り込む必要あり
                when input_is_pair = true and input_is_include_instead = true then pair_id is not null
                when input_is_pair = true and input_is_include_instead = false then (pair_id is not null and record_type in (10, 15))
                when input_is_pair = false and input_is_include_instead = true then (user_id = cast(input_user_id as char(28)))
                else (user_id = cast(input_user_id as char(28)) and pair_id is null)
            end)
            and is_pay = input_is_pay
            and to_char(cast(datetime as date),'YYYY-MM') = input_year || '-' || input_month
        group by type_id, sub_type_id
        order by type_id
    )
    select
        types.name as type_name,
        types.id as type_id,
        types.pair_id is not null as is_pair,
        case
            when sub_types.name is null then ''
            else sub_types.name
        end as sub_type_name,
        sub_types.id as sub_type_id,
        color_classifications.name as color_name,
        summarized_records.sum as sub_type_sum,
        cast( sum(summarized_records.sum) over (partition by types.id) as integer) as sum -- なぜか sum() が文字列になるので cast
    from summarized_records
    inner join develop.types on
        summarized_records.type_id = types.id
    inner join develop.color_classifications on
        types.color_classification_id = color_classifications.id
    left join develop.sub_types on
        summarized_records.sub_type_id = sub_types.id
    order by sum desc
$$ language sql;
```

## func_get_pay_and_income_list

- 概要
  - 期間ごとに 収支 の集計を行う
- 入力例
  - input_user_id
  - input_year
    - 例: 2022
    - 型: int
  - input_is_pair
  - input_is_include_instead
- 出力例
  - 以下カラムを持つ N 件のレコード
    - year_month
      - 例: '2023-10'
    - pay_sum
      - 正の値が返ってくる
    - income_sum
      - 正の値が返ってくる

```sql
-- migration-sort: 9
drop function if exists develop.get_pay_and_income_list(input_user_id varchar(30), input_year varchar(5), input_is_pair boolean, input_is_include_instead boolean);

create or replace function develop.get_pay_and_income_list(input_user_id varchar(30), input_year varchar(5), input_is_pair boolean, input_is_include_instead boolean)
returns table (
    year_month varchar(7),
    pay_sum int,
    income_sum int
)
as $$
    with converted_price as (
        select
            case
                when is_pay = true then price
                else 0
            end as pay_price,
            case
                when is_pay = false then price
                else 0
            end as income_price,
            to_char(cast(datetime as date),'YYYY-MM') as year_month
        from develop.records
        left join develop.pairs on
            records.pair_id = pairs.id
        where
            (case
                when input_is_pair = true and input_is_include_instead = true then (pairs.user1_id = input_user_id or pairs.user2_id = input_user_id)
                when input_is_pair = true and input_is_include_instead = false then ((pairs.user1_id = input_user_id or pairs.user2_id = input_user_id) and records.record_type in (10, 15))
                when input_is_pair = false and input_is_include_instead = true then records.user_id = input_user_id
                else (records.user_id = input_user_id and records.pair_id is null)
            end)
            and to_char(cast(datetime as date), 'YYYY') = input_year
    )
    select
        year_month,
        sum(pay_price) as pay_sum,
        sum(income_price) as income_sum
    from converted_price
    group by year_month
    order by year_month;
$$ language sql;
```

## func_post_records

- 概要
  - 期間ごとに planned_record で設定されているが存在しない record を取得する
- 入力例
  - input_year_month
    - 例: '2022-01'
    - 型: varchar(7)
    - 備考: YYYY-MM の形式
- 出力例
  - なし

```sql
-- migration-sort: 10
drop function if exists develop.post_records(input_user_id varchar(30), input_year_month varchar(7));

create or replace function develop.post_records(input_user_id varchar(30), input_year_month varchar(7))
returns void
as $$
    -- すでに planned_record_id が設定されている record を取り出す
    with summarized_records as (
        select
            planned_record_id
        from develop.records
        left join develop.pairs on
            records.pair_id = pairs.id
        where
            (
                records.user_id = input_user_id
                or pairs.user1_id = input_user_id
                or pairs.user2_id = input_user_id
            )
            and to_char(cast(datetime as date),'YYYY-MM') = input_year_month
            and planned_record_id is not null
    )
    -- コピーされたものを登録する
    insert into develop.records (
        user_id,
        pair_id,
        datetime,
        is_pay,
        method_id,
        type_id,
        sub_type_id,
        price,
        memo,
        planned_record_id,
        is_settled,
        record_type
    )
    select
        planned_records.user_id,
        planned_records.pair_id,
        cast(input_year_month || '-' || lpad(cast(day_classifications.value as character varying), 2, '0') as timestamp) as datetime,
        planned_records.is_pay,
        planned_records.method_id,
        planned_records.type_id,
        planned_records.sub_type_id,
        planned_records.price,
        planned_records.memo,
        planned_records.id as planned_record_id,
        case
            when planned_records.pair_id is not null and planned_records.user_id is not null then false
            else null
        end as is_settled,
        case
            when planned_records.pair_id is null then 0
            when planned_records.pair_id is not null and planned_records.user_id is not null then 5
            when planned_records.pair_id is not null and planned_records.user_id is null then 10
            else 15 -- 起こり得ない
        end as record_type
    from develop.planned_records
    inner join develop.day_classifications on
        planned_records.day_classification_id = day_classifications.id
    left join summarized_records on
        planned_records.id = summarized_records.planned_record_id
    left join develop.pairs on
        planned_records.pair_id = pairs.id
    where
        (
            planned_records.user_id = input_user_id
            or pairs.user1_id = input_user_id
            or pairs.user2_id = input_user_id
        )
        and summarized_records.planned_record_id is null -- planned_record_id が登録されていないものを抽出
        and cast(planned_records.updated_at as date) <=  cast((input_year_month || '-01') as date) -- planned_record が登録された後の期間でのみ、record 登録を行う
        and cast(input_year_month || '-' || lpad(cast(day_classifications.value as character varying), 2, '0') as timestamp) > now() -- 登録される datetime が未来の場合のみrecord 登録を行う
    ;
$$ language sql;
```

## func_get_plan_type_list

- 概要
  - plan_type を複数取得する
- 入力
  - input_user_id
- 出力
  - plan_type_id
  - plan_type_name
  - sort
  - color_classification_id
  - color_classification_name
  - is_pair
    - その plan_type が共有用かどうか

```sql
-- migration-sort: 11
drop function if exists develop.get_plan_type_list(input_user_id varchar(30));

create or replace function develop.get_plan_type_list(input_user_id varchar(30))
returns table (
    plan_type_id integer,
    plan_type_name varchar(10),
    sort integer,
    color_classification_id integer,
    color_classification_name varchar(10),
    is_pair boolean
)
as $$
    select
        plan_types.id as plan_type_id,
        plan_types.name as plan_type_name,
        plan_types.sort,
        color_classifications.id as color_classification_id,
        color_classifications.name as color_classification_name,
        pairs.id is not null as is_pair
    from develop.plan_types
    inner join develop.color_classifications on
        plan_types.color_classification_id = color_classifications.id
    left join develop.pairs on
        plan_types.pair_id = pairs.id
    where
        plan_types.user_id = input_user_id
        or pairs.user1_id = input_user_id
        or pairs.user2_id = input_user_id
    order by
        is_pair, sort -- todo sortが効くかどうか
    ;
$$ language sql;
```

## func_get_type_list

- 概要
  - type を複数取得する
- 入力
  - input_user_id
- 出力
  - type_id
  - type_name
  - is_pay
  - type_sort
  - color_classification_id
  - color_classification_name
  - is_pair
    - その type が共有用かどうか
  - sub_type_id
    - `null` の場合もある
  - sub_type_name
    - `null` の場合もある
  - sub_type_sort
    - `null` の場合もある

```sql
-- migration-sort: 12
drop function if exists develop.get_type_list(input_user_id varchar(30));

create or replace function develop.get_type_list(input_user_id varchar(30))
returns table (
    type_id integer,
    type_name varchar(10),
    is_pay boolean,
    type_sort integer,
    color_classification_id integer,
    color_classification_name varchar(10),
    is_pair boolean,
    sub_type_id integer,
    sub_type_name varchar(10),
    sub_type_sort integer
)
as $$
    select
        types.id as type_id,
        types.name as type_name,
        types.is_pay,
        types.sort as type_sort,
        color_classifications.id as color_classification_id,
        color_classifications.name as color_classification_name,
        pairs.id is not null as is_pair,
        sub_types.id as sub_type_id,
        sub_types.name as sub_type_name,
        sub_types.sort as sub_type_sort
    from develop.types
    inner join develop.color_classifications on
        types.color_classification_id = color_classifications.id
    left join develop.sub_types on
        types.id = sub_types.type_id
    left join develop.pairs on
        types.pair_id = pairs.id
    where
        types.user_id = input_user_id
        or pairs.user1_id = input_user_id
        or pairs.user2_id = input_user_id
    order by
        is_pair, is_pay, type_sort, sub_type_sort -- todo sub_type_sortが効くかどうか
    ;
$$ language sql;
```

## func_get_method_list

- 概要
  - method を複数取得する
- 入力
  - input_user_id
- 出力
  - id
  - name
  - is_pay
  - sort
  - color_classification_id
  - color_classification_name
  - is_pair
    - その method が共有用かどうか

```sql
-- migration-sort: 13
drop function if exists develop.get_method_list(input_user_id varchar(30));

create or replace function develop.get_method_list(input_user_id varchar(30))
returns table (
    id integer,
    name varchar(10),
    is_pay boolean,
    sort integer,
    color_classification_id integer,
    color_classification_name varchar(10),
    is_pair boolean
)
as $$
    select
        methods.id,
        methods.name,
        methods.is_pay,
        methods.sort,
        color_classifications.id as color_classification_id,
        color_classifications.name as color_classification_name,
        pairs.id is not null as is_pair
    from develop.methods
    inner join develop.color_classifications on
        methods.color_classification_id = color_classifications.id
    left join develop.pairs on
        methods.pair_id = pairs.id
    where
        methods.user_id = input_user_id
        or pairs.user1_id = input_user_id
        or pairs.user2_id = input_user_id
    order by
        is_pair, is_pay, sort -- todo sortが効くかどうか
    ;
$$ language sql;
```

## func_get_planned_record_list

- 概要
  - planned_record を複数取得する
- 入力
  - input_user_id
- 出力
  - planned_record_id
  - is_pay
  - price
  - memo
    - `null` の場合もある
  - sort
  - updated_at
    - 例: '2021-12-31 00:00:00'
  - is_pair
  - day_classification_id
  - day_classification_name
    - 例: '毎月 1 日'
  - method_id
  - method_name
  - type_id
  - type_name
  - type_color_classification_id
  - type_color_classification_name
  - sub_type_id
    - `null` の場合もある
  - sub_type_name
    - `null` の場合もある

```sql
-- migration-sort: 14
drop function if exists develop.get_planned_record_list(input_user_id varchar(30));

create or replace function develop.get_planned_record_list(input_user_id varchar(30))
returns table (
  planned_record_id integer,
  is_self boolean,
  is_pay boolean,
  price integer,
  memo text,
  sort integer,
  updated_at timestamptz,
  is_pair boolean,
  pair_user_name varchar(10),
  day_classification_id integer,
  day_classification_name varchar(10),
  method_id integer,
  method_name varchar(10),
  method_color_classification_name varchar(10),
  type_id integer,
  type_name varchar(10),
  type_color_classification_name varchar(10),
  sub_type_id integer,
  sub_type_name varchar(10)
)
as $$
    select
        planned_records.id as planned_record_id,
        planned_records.user_id = input_user_id as is_self,
        planned_records.is_pay,
        planned_records.price,
        planned_records.memo,
        planned_records.sort,
        planned_records.updated_at,
        pairs.id is not null as is_pair,
        users.name as pair_user_name, -- 立替した人の名前, 立替してないなら null
        day_classifications.id as day_classification_id,
        day_classifications.name as day_classification_name,
        methods.id as method_id,
        methods.name as method_name,
        mc.name as method_color_classification_name,
        types.id as type_id,
        types.name as type_name,
        tc.name as type_color_classification_name,
        sub_types.id as sub_type_id,
        sub_types.name as sub_type_name
    from develop.planned_records
    inner join develop.day_classifications on
        planned_records.day_classification_id = day_classifications.id
    inner join develop.methods on
        planned_records.method_id = methods.id
    inner join develop.types on
        planned_records.type_id = types.id
    left join develop.sub_types on
        planned_records.sub_type_id = sub_types.id
    inner join develop.color_classifications as tc on
        types.color_classification_id = tc.id
    inner join develop.color_classifications as mc on
        methods.color_classification_id = mc.id
    left join develop.pairs on
        planned_records.pair_id = pairs.id
    left join develop.users on
        planned_records.user_id = users.uid
        and planned_records.pair_id is not null
    where
        planned_records.user_id = input_user_id
        or pairs.user1_id = input_user_id
        or pairs.user2_id = input_user_id
    order by
        is_pair, sort
    ;
$$ language sql;
```

## func_get_plan_list

- 概要
  - plan を複数取得する
- 入力
  - input_user_id
  - input_start_date
  - input_end_date
- 出力
  - id
  - start_date
  - end_date
  - name
  - memo
  - is_pair
  - plan_type_id
    - plan 編集用に使用
  - plan_type_name
  - color_classification_name

```sql
-- migration-sort: 15
drop function if exists develop.get_plan_list(input_user_id varchar(30), input_start_date varchar(10), input_end_date varchar(10));

create or replace function develop.get_plan_list(input_user_id varchar(30), input_start_date varchar(10), input_end_date varchar(10))
returns table (
  id integer,
  start_date date,
  end_date date,
  name varchar(30),
  memo text,
  plan_type_id integer,
  plan_type_name varchar(10),
  plan_type_color_classification_name varchar(10),
  is_pair boolean
)
as $$
    select
      plans.id,
      plans.start_date,
      plans.end_date,
      plans.name,
      plans.memo,
      plan_types.id as plan_type_id,
      plan_types.name as plan_type_name,
      color_classifications.name as plan_type_color_classification_name,
      pairs.id is not null as is_pair
    from develop.plans
    left join develop.plan_types on
        plans.plan_type_id = plan_types.id
    inner join develop.color_classifications on
        plan_types.color_classification_id = color_classifications.id
    left join develop.pairs on
        plans.pair_id = pairs.id
    where
        (
          plans.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and plans.start_date between cast(input_start_date as date) and cast(input_end_date as date)
    ;
$$ language sql;
```

## func_get_record_list

- 概要
  - record を複数取得する
- 入力
  - input_user_id
  - input_start_datetime
  - input_end_datetime
- 出力
  - record_id
  - is_self
    - 自分の record なら true、共有相手の record なら false
  - datetime
  - is_pay
  - price
  - memo
  - is_instead
  - planned_record_id
  - method_id
  - method_name
  - method_color_classification_name
  - type_id
  - type_name
  - sub_type_id
  - sub_type_name
  - type_color_classification_name
  - is_pair
    - pair_user_name があるかどうかでわかるので、冗長かもしれない TODO 精査
  - pair_user_name
    - 共有された record じゃない場合は null

```sql
-- migration-sort: 16
drop function if exists develop.get_record_list(input_user_id varchar(30), input_start_datetime varchar(19), input_end_datetime varchar(19));

create or replace function develop.get_record_list(input_user_id varchar(30), input_start_datetime varchar(19), input_end_datetime varchar(19))
returns table (
  record_id integer,
  is_self boolean,
  datetime timestamptz,
  is_pay boolean,
  price integer,
  memo text,
  is_instead boolean,
  planned_record_id integer,
  method_id integer,
  method_name varchar(10),
  method_color_classification_name varchar(10),
  type_id integer,
  type_name varchar(10),
  sub_type_id integer,
  sub_type_name varchar(10),
  type_color_classification_name varchar(10),
  is_pair boolean,
  pair_user_name varchar(10)
)
as $$
    select
      records.id as record_id,
      records.user_id = input_user_id as is_self,
      records.datetime,
      records.is_pay,
      records.price,
      records.memo,
      (case
        when records.record_type = 5 then true
        when records.record_type = 0 then null
        else false
      end) as is_instead,
      records.planned_record_id,
      methods.id as method_id,
      methods.name as method_name,
      mc.name as method_color_classification_name,
      types.id as type_id,
      types.name as type_name,
      sub_types.id as sub_type_id,
      sub_types.name as sub_type_name,
      tc.name as type_color_classification_name,
      pairs.id is not null as is_pair,
      users.name as pair_user_name
    from develop.records
    inner join develop.methods on
        records.method_id = methods.id
    inner join develop.types on
        records.type_id = types.id
    left join develop.sub_types on
        records.sub_type_id = sub_types.id
    inner join develop.color_classifications as tc on
        types.color_classification_id = tc.id
    inner join develop.color_classifications as mc on
        methods.color_classification_id = mc.id
    left join develop.pairs on
        records.pair_id = pairs.id
    left join develop.users on
        records.user_id = users.uid
        and records.pair_id is not null
    /*  レコードを作った方じゃない pair_id を取得するとき
      left join develop.users on
        (case
          when pairs.user1_id = records.user_id then pairs.user2_id
          else pairs.user1_id
        end)
        = users.uid */
    where
        (
          records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and records.datetime between cast(input_start_datetime as timestamp) and cast(input_end_datetime as timestamp)
    ;
$$ language sql;
```

## func_get_summarized_record_list

- 概要
  - records 画面用に検索された records を複数取得する
- 入力
  - input_user_id
  - input_is_pay
  - input_is_type
  - input_is_pair
  - input_is_include_instead
  - input_year_month
  - input_id
  - input_sub_type_id
- 出力
  - `get_record_list` と同義

```sql
-- migration-sort: 17
drop function if exists develop.get_summarized_record_list(input_user_id varchar(30), input_is_pay boolean, input_is_type boolean, input_is_pair boolean, input_is_include_instead boolean, input_year_month varchar(8), input_id int, input_sub_type_id int);

create or replace function develop.get_summarized_record_list(input_user_id varchar(30), input_is_pay boolean, input_is_type boolean, input_is_pair boolean, input_is_include_instead boolean, input_year_month varchar(8), input_id int, input_sub_type_id int)
returns table (
    record_id integer,
    is_self boolean,
    datetime timestamptz,
    is_pay boolean,
    price integer,
    memo text,
    is_instead boolean,
    planned_record_id integer,
    method_id integer,
    method_name varchar(10),
    method_color_classification_name varchar(10),
    type_id integer,
    type_name varchar(10),
    sub_type_id integer,
    sub_type_name varchar(10),
    type_color_classification_name varchar(10),
    is_pair boolean,
    pair_user_name varchar(10)
)
as $$
    select
        records.id as record_id,
        records.user_id = input_user_id as is_self,
        records.datetime,
        records.is_pay,
        records.price,
        records.memo,
        (case
            when records.record_type = 5 then true
            when records.record_type = 0 then null
            else false
        end) as is_instead,
        records.planned_record_id,
        methods.id as method_id,
        methods.name as method_name,
        mc.name as method_color_classification_name,
        types.id as type_id,
        types.name as type_name,
        sub_types.id as sub_type_id,
        sub_types.name as sub_type_name,
        tc.name as type_color_classification_name,
        pairs.id is not null as is_pair,
        users.name as pair_user_name
    from develop.records
    inner join develop.methods on
        records.method_id = methods.id
    inner join develop.types on
        records.type_id = types.id
    left join develop.sub_types on
        records.sub_type_id = sub_types.id
    inner join develop.color_classifications as tc on
        types.color_classification_id = tc.id
    inner join develop.color_classifications as mc on
        methods.color_classification_id = mc.id
    left join develop.pairs on
        records.pair_id = pairs.id
    left join develop.users on
        records.user_id = users.uid
        and records.pair_id is not null
    where
        to_char(cast(datetime as date),'YYYY-MM') = input_year_month
        and records.is_pay = input_is_pay
        and (case
            when input_is_type is true then (
                types.id = input_id
                and (case when input_sub_type_id is not null then sub_types.id = input_sub_type_id
                    else true
                end)
            ) else
                methods.id = input_id
        end)
        and (case
            when input_is_pair = true and input_is_include_instead = true then pairs.id is not null
            when input_is_pair = true and input_is_include_instead = false then (pairs.id is not null and records.record_type in (10, 15))
            when input_is_pair = false and input_is_include_instead = true then (records.user_id = cast(input_user_id as char(28)))
            else (records.user_id = cast(input_user_id as char(28)) and pairs.id is null)
        end)
    order by records.datetime desc
    ;
$$ language sql;
```

## func_get_paired_record_list

- 概要
  - summary_settlement 画面用に検索された records を複数取得する
- 入力
  - input_user_id
  - input_year_month
- 出力
  - `get_record_list` とほぼ同義
    - is_settled 以外は編集不可とするので、不要な情報は返却しない

```sql
-- migration-sort: 18
drop function if exists develop.get_paired_record_list(input_user_id varchar(30), input_year_month varchar(8));

create or replace function develop.get_paired_record_list(input_user_id varchar(30),input_year_month varchar(8))
returns table (
    id integer,
    datetime timestamptz,
    is_self boolean,
    is_pay boolean,
    price integer,
    memo text,
    is_instead boolean,
    is_settled boolean,
    is_planned_record boolean,
    method_name varchar(10),
    method_color_classification_name varchar(10),
    type_name varchar(10),
    sub_type_name varchar(10),
    type_color_classification_name varchar(10)
)
as $$
    select
        records.id,
        records.datetime,
        records.user_id = input_user_id as is_self,
        records.is_pay,
        records.price,
        records.memo,
        (case
            when records.record_type = 5 then true
            when records.record_type = 0 then null
            else false
        end) as is_instead,
        records.is_settled,
        records.planned_record_id is not null as is_planned_record,
        methods.name as method_name,
        mc.name as method_color_classification_name,
        types.name as type_name,
        sub_types.name as sub_type_name,
        tc.name as type_color_classification_name
    from develop.records
    inner join develop.methods on
        records.method_id = methods.id
    inner join develop.types on
        records.type_id = types.id
    left join develop.sub_types on
        records.sub_type_id = sub_types.id
    inner join develop.color_classifications as tc on
        types.color_classification_id = tc.id
    inner join develop.color_classifications as mc on
        methods.color_classification_id = mc.id
    inner join develop.pairs on
        records.pair_id = pairs.id
    left join develop.users on
        records.user_id = users.uid
        and records.pair_id is not null
    where
        to_char(cast(datetime as date),'YYYY-MM') = input_year_month
    order by records.datetime desc
    ;
$$ language sql;
```
