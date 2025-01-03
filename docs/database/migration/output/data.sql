-- now: 2023-11-12 11:26
-- migration-sort: 1
insert into develop.users (uid, mail)
values
    ('wkircIISqlYkFTOVNBtJe6sZnST2', 'supabase.develop.test@example.com')
;

-- migration-sort: 4
insert into develop.methods (id, user_id, name, is_pay, color_classification_id)
values
    (1, 'wkircIISqlYkFTOVNBtJe6sZnST2', '現金', true, 1),
    (2, 'wkircIISqlYkFTOVNBtJe6sZnST2', 'クレカ', true, 2),
    (3, 'wkircIISqlYkFTOVNBtJe6sZnST2', '現金', false, 3)
;

-- migration-sort: 5
insert into develop.types (id, user_id, name, is_pay, color_classification_id)
values
    (1, 'wkircIISqlYkFTOVNBtJe6sZnST2', '食費', true, 1),
    (2, 'wkircIISqlYkFTOVNBtJe6sZnST2', '交通費', true, 2)
;

-- migration-sort: 6
insert into develop.sub_types (id, type_id, name)
values
    (1, 1, '朝ごはん'),
    (2, 1, '昼ごはん')
;

-- migration-sort: 7

-- migration-sort: 8

-- migration-sort: 9

-- migration-sort: 10

