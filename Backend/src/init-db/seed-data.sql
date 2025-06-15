-- Insert memberships data
INSERT INTO memberships (id, uuid, name, user_id, recurring_price, valid_from, valid_until, state, assigned_by, payment_method, billing_interval, billing_periods)
VALUES 
    (1, '123e4567-e89b-12d3-a456-426614174000', 'Platinum Plan', 2000, 150.0, '2023-01-01', '2023-12-31', 'active', 'Admin', 'credit card', 'monthly', 12),
    (2, '123e4567-e89b-12d3-a456-426614174001', 'Gold Plan', 2000, 100.0, '2023-02-01', '2023-12-31', 'active', 'Admin', 'cash', 'monthly', 2),
    (3, '123e4567-e89b-12d3-a456-426614174002', 'Gold Plan', 2000, 100.0, '2023-02-01', '2023-12-31', 'active', 'Admin', NULL, 'monthly', 6);

-- Reset sequence to continue from the last ID
SELECT setval('memberships_id_seq', (SELECT MAX(id) FROM memberships));

-- Insert membership_periods data
INSERT INTO membership_periods (id, uuid, membership_id, start_date, end_date, state)
VALUES 
    (1, '123e4567-e89b-12d3-a456-426614174000', 1, '2023-01-01', '2023-01-31', 'issued'),
    (2, '123e4567-e89b-12d3-a456-426614174001', 2, '2023-02-01', '2023-02-28', 'issued'),
    (3, '123e4567-e89b-12d3-a456-426614174002', 3, '2023-03-01', '2023-03-31', 'issued');

-- Reset sequence to continue from the last ID
SELECT setval('membership_periods_id_seq', (SELECT MAX(id) FROM membership_periods));