-- Create memberships table
CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    recurring_price DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    state VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(255),
    payment_method VARCHAR(50),
    billing_interval VARCHAR(50) NOT NULL,
    billing_periods INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create membership_periods table
CREATE TABLE membership_periods (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    membership_id INTEGER NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_membership_periods_membership_id ON membership_periods(membership_id);