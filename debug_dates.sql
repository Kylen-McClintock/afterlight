-- Check table definition to see if there are any weird constraints or triggers
\d story_sessions

-- Check storage policies again
select * from pg_policies where tablename = 'objects';

-- Check if there are any recent story sessions and what their dates look like
select id, title, story_date, date_granularity, created_at from story_sessions order by created_at desc limit 5;
