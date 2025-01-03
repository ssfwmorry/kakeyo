# data

開発 DB で動作確認をするために投入するデータ

## transaction tables

### users

```sql
-- migration-sort: 1
insert into develop.users (uid, mail)
values
    ('wkircIISqlYkFTOVNBtJe6sZnST2', 'supabase.develop.test@example.com')
;
```

### methods

```sql
-- migration-sort: 4
insert into develop.methods (id, user_id, name, is_pay, color_classification_id)
values
    (1, 'wkircIISqlYkFTOVNBtJe6sZnST2', '現金', true, 1),
    (2, 'wkircIISqlYkFTOVNBtJe6sZnST2', 'クレカ', true, 2),
    (3, 'wkircIISqlYkFTOVNBtJe6sZnST2', '現金', false, 3)
;
```

### types

```sql
-- migration-sort: 5
insert into develop.types (id, user_id, name, is_pay, color_classification_id)
values
    (1, 'wkircIISqlYkFTOVNBtJe6sZnST2', '食費', true, 1),
    (2, 'wkircIISqlYkFTOVNBtJe6sZnST2', '交通費', true, 2)
;
```

### sub_types

```sql
-- migration-sort: 6
insert into develop.sub_types (id, type_id, name)
values
    (1, 1, '朝ごはん'),
    (2, 1, '昼ごはん')
;
```

### records

```sql
-- migration-sort: 8
```

### planned_records

```sql
-- migration-sort: 7
```

### plans

```sql
-- migration-sort: 10
```

### plan_types

```sql
-- migration-sort: 9
```

## master tables

[tables.md](./tables.md) でデータ投入済
