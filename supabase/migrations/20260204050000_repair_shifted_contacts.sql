-- Fix Shifted Contact Data
-- Detects cases where Import shifted columns: Name -> First, Email -> Last, Phone -> Email

DO $$
DECLARE
    r RECORD;
    new_first TEXT;
    new_last TEXT;
    new_email TEXT;
    new_phone TEXT;
BEGIN
    FOR r IN SELECT * FROM public.contacts WHERE last_name LIKE '%@%' LOOP
        -- 1. Identify valid data parts
        new_email := r.last_name; -- The email is incorrectly in last_name
        new_phone := r.email;     -- The phone is incorrectly in email
        
        -- 2. Handle Name Splitting
        -- If first_name is "Ethan Brown", we split it.
        IF r.first_name LIKE '% %' THEN
             new_first := split_part(r.first_name, ' ', 1);
             new_last := substring(r.first_name from position(' ' in r.first_name) + 1);
        ELSE
             -- If first_name is just "Ethan", keep it, but we need a last name?
             -- Actually, if data was shifted, "Ethan" might be First, and "Brown" might be missing?
             -- User screenshot shows "Ethan Brown" in bold, meaning first_name="Ethan Brown".
             new_first := r.first_name;
             new_last := ''; 
        END IF;

        -- 3. Update the record
        -- Only if new_email looks like an email
        IF new_email LIKE '%@%' THEN
            UPDATE public.contacts
            SET 
                first_name = new_first,
                last_name = new_last,
                email = new_email,
                phone = new_phone
            WHERE id = r.id;
            
            RAISE NOTICE 'Fixed Shifted Contact %: "%" "%" <%> Ph:%', r.id, new_first, new_last, new_email, new_phone;
        END IF;
    END LOOP;
END $$;
