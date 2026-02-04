-- Fix malformed contacts from CSV import
-- Where email ended up in last_name line "Brown email@example.com" and email column is empty

DO $$
DECLARE
    r RECORD;
    extracted_email TEXT;
    clean_last_name TEXT;
BEGIN
    FOR r IN SELECT id, last_name FROM public.contacts WHERE last_name LIKE '%@%' AND (email IS NULL OR email = '') LOOP
        -- Simple extraction: assume email is the last word
        extracted_email := split_part(r.last_name, ' ', array_length(regexp_split_to_array(r.last_name, '\s+'), 1));
        
        -- Check if it looks like an email
        IF extracted_email LIKE '%@%' THEN
            -- Remove email from last name
            clean_last_name := trim(replace(r.last_name, extracted_email, ''));
            
            -- Update record
            UPDATE public.contacts 
            SET 
                email = extracted_email,
                last_name = clean_last_name
            WHERE id = r.id;
            
            RAISE NOTICE 'Fixed contact %: Name "%" -> "%", Email set to "%"', r.id, r.last_name, clean_last_name, extracted_email;
        END IF;
    END LOOP;
END $$;
