-- Create a test user for testing preferences
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    -- Check if test user exists
    SELECT id INTO test_user_id FROM users WHERE email = 'test@wordigo.com';

    -- If not, create it
    IF test_user_id IS NULL THEN
        INSERT INTO users (email, username, password, created_at, updated_at)
        VALUES ('test@wordigo.com', 'testuser', '$2b$10$abcdefghijklmnopqrstuv', NOW(), NOW())
        RETURNING id INTO test_user_id;

        RAISE NOTICE 'Created test user with ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test user already exists with ID: %', test_user_id;
    END IF;
END $$;

-- Display the test user
SELECT id, username, email FROM users WHERE email = 'test@wordigo.com';
