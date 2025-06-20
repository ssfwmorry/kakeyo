-- now: 2025-05-31 10:15
-- migration-sort: 1
drop function if exists develop.swap_method(id1 int, id2 int);

create or replace function develop.swap_method(id1 int, id2 int)
returns void
as $$
    update develop.methods as t1 SET sort = t2.sort
    from develop.methods as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;

-- migration-sort: 2
drop function if exists develop.swap_type(id1 int, id2 int);

create or replace function develop.swap_type(id1 int, id2 int)
returns void
as $$
    update develop.types as t1 SET sort = t2.sort
    from develop.types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;

-- migration-sort: 3
drop function if exists develop.swap_sub_type(id1 int, id2 int);

create or replace function develop.swap_sub_type(id1 int, id2 int)
returns void
as $$
    update develop.sub_types as t1 SET sort = t2.sort
    from develop.sub_types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;

-- migration-sort: 4
drop function if exists develop.swap_plan_type(id1 int, id2 int);

create or replace function develop.swap_plan_type(id1 int, id2 int)
returns void
as $$
    update develop.plan_types as t1 SET sort = t2.sort
    from develop.plan_types as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;

-- migration-sort: 5
drop function if exists develop.swap_planned_record(id1 int, id2 int);

create or replace function develop.swap_planned_record(id1 int, id2 int)
returns void
as $$
    update develop.planned_records as t1 SET sort = t2.sort
    from develop.planned_records as t2
    where (t1.id, t2.id) IN ((id1, id2), (id2, id1))
$$ language sql;

-- migration-sort: 6
drop function if exists develop.get_month_sum(input_user_id varchar(30), input_year_month varchar(7));

create or replace function develop.get_month_sum(input_user_id varchar(30), input_year_month varchar(7))
returns table (
    year_month varchar(7),
    self_sum int
)
as $$
    with converted_price as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        case
          when records.record_type = 0 and records.user_id = input_user_id then
            case
              when is_pay = false then price * (-1)
              else price
            end
          -- when records.record_type = 0 and records.user_id <> input_user_id は相手の支払なのでノーカウント
          when records.record_type = 5 and records.user_id = input_user_id then price -- 立替は必ず支払
          -- when records.record_type = 5 and records.user_id <> input_user_id は相手の立替なのでノーカウント
          -- when records.record_type = 10 はノーカウント
          when records.record_type = 15 and records.user_id = input_user_id then price -- 精算による支払
          when records.record_type = 15 and records.user_id <> input_user_id then price * (-1) -- 精算による受取
          else 0
        end as self_price
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
      sum(self_price) as self_sum
    from converted_price
    group by year_month;
$$ language sql;

-- migration-sort: 7
drop function if exists develop.get_method_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4));

create or replace function develop.get_method_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4))
returns table (
    method_name varchar(10), -- not null
    method_id int, -- not null
    pair_user_name varchar(10),
    color_name varchar(20), -- not null
    is_pair boolean, -- not null
    sum int -- not null
)
as $$
    with summarized_records as (
      select distinct
        records.method_id,
        sum(records.price) as sum
      from develop.records
      left join develop.pairs on
        records.pair_id = pairs.id
      where
        -- 自分, 自分の立替, 相手の立替, 共有, 精算 を取得
        ( records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and (case
          -- 二人の家計に関わる、立替/共有
          when input_is_pair = true then record_type in (5, 10)
          -- 自分の家計に関わる、自分/(自分のみの)立替/精算
          when input_is_pair = false and input_is_include_instead = true
            then (record_type in (0, 15) or ( record_type = 5 and (user_id = cast(input_user_id as char(28))) ))
          -- 相手を除く自分の家計に関わる、自分
          when input_is_pair = false and input_is_include_instead = false then record_type = 0
          -- 起こり得ない
          else true
        end)
        and (case
          -- 精算recordの場合はis_payがnullなので、user_idをもとに支払/受取の判断をする
          when record_type = 15 and input_is_pay = true then (user_id = cast(input_user_id as char(28)))
          when record_type = 15 and input_is_pay = false then (user_id <> cast(input_user_id as char(28)))
          else is_pay = input_is_pay
        end)
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

-- migration-sort: 8
drop function if exists develop.get_type_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4));

create or replace function develop.get_type_summary(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_is_include_instead boolean, input_year varchar(5), input_month varchar(4))
returns table (
    type_name varchar(10),
    type_id int,
    is_pair boolean,
    sub_type_id int,
    sub_type_name varchar(10),
    color_name varchar(20),
    sub_type_sum int,
    sum int -- not null
)
as $$
    with summarized_records as (
      select distinct
        records.type_id,
        records.sub_type_id,
        sum(records.price) as sum
      from develop.records
      left join develop.pairs on
        records.pair_id = pairs.id
      where
        -- where 条件はget_method_summary と同様
        ( records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and (case
          when input_is_pair = true then record_type in (5, 10)
          when input_is_pair = false and input_is_include_instead = true
            then (record_type in (0, 15) or ( record_type = 5 and (user_id = cast(input_user_id as char(28))) ))
          when input_is_pair = false and input_is_include_instead = false then record_type = 0
          else true
        end)
        and (case
          when record_type = 15 and input_is_pay = true then (user_id = cast(input_user_id as char(28)))
          when record_type = 15 and input_is_pay = false then (user_id <> cast(input_user_id as char(28)))
          else is_pay = input_is_pay
        end)
        and to_char(cast(datetime as date),'YYYY-MM') = input_year || '-' || input_month
      group by type_id, sub_type_id
      order by type_id
    )
    select
      types.name as type_name,
      types.id as type_id,
      case
        when types.id is null then true -- 精算recordはis_pair=true
        else types.pair_id is not null -- それ以外はtypes.pair_idで判断
      end as is_pair,
      sub_types.id as sub_type_id,
      sub_types.name as sub_type_name,
      color_classifications.name as color_name,
      summarized_records.sum as sub_type_sum,
      cast( sum(summarized_records.sum) over (partition by types.id) as integer) as sum -- なぜか sum() が文字列になるので cast
    from summarized_records
    left join develop.types on
      summarized_records.type_id = types.id
    left join develop.color_classifications on
      types.color_classification_id = color_classifications.id
    left join develop.sub_types on
      summarized_records.sub_type_id = sub_types.id
    order by sum desc
$$ language sql;

-- migration-sort: 9
drop function if exists develop.get_pay_and_income_list(input_user_id varchar(30), input_year varchar(5), input_is_pair boolean, input_is_include_instead boolean);

create or replace function develop.get_pay_and_income_list(input_user_id varchar(30), input_year varchar(5), input_is_pair boolean, input_is_include_instead boolean)
returns table (
    year_month varchar(7), -- not null
    pay_sum int, -- not null
    income_sum int -- not null
)
as $$
    with converted_price as (
      select
        case
          -- 精算の場合、user_idをもとに支払/受取を判断する
          when record_type = 15 and user_id = input_user_id then price
          when record_type = 15 and user_id <> input_user_id then 0
          -- 精算ではない場合、is_payをもとに判断する
          when is_pay = true then price
          else 0
        end as pay_price,
        case
          when record_type = 15 and user_id = input_user_id then 0
          when record_type = 15 and user_id <> input_user_id then price
          when is_pay = false then price
          else 0
        end as income_price,
        to_char(cast(datetime as date),'YYYY-MM') as year_month
      from develop.records
      left join develop.pairs on
        records.pair_id = pairs.id
      where
        -- 自分, 自分の立替, 相手の立替, 共有, 精算 を取得
        ( records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and (case
          -- 二人の家計に関わる、立替/共有
          when input_is_pair = true then record_type in (5, 10)
          -- 自分の家計に関わる、自分/(自分のみの)立替/精算
          when input_is_pair = false and input_is_include_instead = true
            then (record_type in (0, 15) or ( record_type = 5 and user_id = input_user_id ))
          -- 相手を除く自分の家計に関わる、自分
          when input_is_pair = false and input_is_include_instead = false then record_type = 0
          -- 起こり得ない
          else true
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
  record_type smallint, -- not null
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
      records.record_type,
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
    left join develop.types on
        records.type_id = types.id
    left join develop.sub_types on
        records.sub_type_id = sub_types.id
    left join develop.color_classifications as tc on
        types.color_classification_id = tc.id
    inner join develop.color_classifications as mc on
        methods.color_classification_id = mc.id
    left join develop.pairs on
        records.pair_id = pairs.id
    left join develop.users on
        records.user_id = users.uid
        and records.pair_id is not null
    where
        (
          records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and records.datetime between cast(input_start_datetime as timestamp) and cast(input_end_datetime as timestamp)
    ;
$$ language sql;

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
    record_type smallint, -- not null
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
        records.record_type,
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

-- migration-sort: 18
drop function if exists develop.get_sub_type_summary(input_year varchar(5), input_type_id int);

create or replace function develop.get_sub_type_summary(input_year varchar(5), input_type_id int)
returns table (
    year_month varchar(7), -- not null
    type_id int, -- not null
    type_name varchar(10), -- not null
    type_color_classification_name varchar(10), -- not null
    sub_type_id int,
    sub_type_name varchar(10),
    sum int -- not null
)
as $$
    with converted_records as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        type_id,
        sub_type_id,
        sum(price) as sum
      from develop.records
      where
        type_id = input_type_id
        and to_char(cast(datetime as date),'YYYY') = input_year
      group by year_month, type_id, sub_type_id
    )
    select
      year_month,
      converted_records.type_id,
      types.name as type_name,
      color_classifications.name as type_color_classification_name,
      converted_records.sub_type_id,
      sub_types.name as sub_type_name,
      converted_records.sum
    from converted_records
    inner join develop.types on
      converted_records.type_id = types.id
    left join develop.sub_types on
      converted_records.sub_type_id = sub_types.id
    left join develop.color_classifications on
      types.color_classification_id = color_classifications.id
    order by converted_records.year_month, converted_records.type_id, converted_records.sub_type_id
$$ language sql;

-- migration-sort: 19
drop function if exists develop.get_type_summary_period(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_year varchar(5));

create or replace function develop.get_type_summary_period(input_user_id varchar(30), input_is_pay boolean, input_is_pair boolean, input_year varchar(5))
returns table (
    year_month varchar(7), -- not null
    type_id int,
    type_name varchar(10),
    type_color_classification_name varchar(10),
    sum int -- not null
)
as $$
    with converted_records as (
      select
        to_char(cast(datetime as date),'YYYY-MM') as year_month,
        records.type_id,
        sum(records.price) as sum
      from develop.records
      left join develop.pairs on
        records.pair_id = pairs.id
      where
        ( records.user_id = input_user_id
          or pairs.user1_id = input_user_id
          or pairs.user2_id = input_user_id
        )
        and (case
          when input_is_pair = true then record_type in (5, 10)
          else (record_type in (0, 15) or ( record_type = 5 and (user_id = cast(input_user_id as char(28))) ))
        end)
        and (case
          when record_type = 15 and input_is_pay = true then (user_id = cast(input_user_id as char(28)))
          when record_type = 15 and input_is_pay = false then (user_id <> cast(input_user_id as char(28)))
          else is_pay = input_is_pay
        end)
        and to_char(cast(datetime as date),'YYYY') = input_year
      group by year_month, type_id
    )
    select
      year_month,
      converted_records.type_id,
      types.name as type_name,
      color_classifications.name as type_color_classification_name,
      converted_records.sum
    from converted_records
    left join develop.types on
      converted_records.type_id = types.id
    left join develop.color_classifications on
      types.color_classification_id = color_classifications.id
    order by converted_records.year_month, converted_records.type_id
$$ language sql;

-- migration-sort: 20
drop function if exists develop.get_paired_record_list(input_user_id varchar(30), input_year_month varchar(8));

create or replace function develop.get_paired_record_list(input_user_id varchar(30),input_year_month varchar(8))
returns table (
    id integer, -- not null
    datetime timestamptz, -- not null
    is_self boolean,
    is_pay boolean,
    price integer, -- not null
    memo text,
    record_type smallint, -- not null
    is_settled boolean,
    is_planned_record boolean, -- not null
    method_name varchar(10), -- not null
    method_color_classification_name varchar(10), -- not null
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
      records.record_type,
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
    inner join develop.color_classifications as mc on
      methods.color_classification_id = mc.id
    inner join develop.pairs on
      -- pairs.idがあるもののみ絞り込む
      records.pair_id = pairs.id
    left join develop.users on
      records.user_id = users.uid
    left join develop.types on
      records.type_id = types.id
    left join develop.sub_types on
      records.sub_type_id = sub_types.id
    left join develop.color_classifications as tc on
      types.color_classification_id = tc.id
    where
      to_char(cast(datetime as date),'YYYY-MM') = input_year_month
    order by records.datetime desc
    ;
$$ language sql;

