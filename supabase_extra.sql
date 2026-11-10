-- Run this once in Supabase -> SQL Editor

-- 1) Column to save the full AI result
alter table leads add column if not exists ai_result jsonb;

-- 2) Sample activities
insert into activities (lead_id, type, description)
select id, 'Call', 'Intro call done. Wants a product demo.' from leads where email = 'rahul@techvista.in';
insert into activities (lead_id, type, description)
select id, 'Email', 'Sent pricing sheet. No reply yet.' from leads where email = 'priya@growmore.com';
insert into activities (lead_id, type, description)
select id, 'Meeting', 'Demo for 25 sales reps. Positive feedback.' from leads where email = 'amit@buildwell.in';
insert into activities (lead_id, type, description)
select id, 'Note', 'Asked for a 10% discount on the annual plan.' from leads where email = 'neha@edusmart.in';
insert into activities (lead_id, type, description)
select id, 'Email', 'Sent two follow-up emails. No response.' from leads where email = 'arjun@fintrack.in';

-- 3) Sample follow-ups (some overdue, some upcoming, one done)
insert into follow_ups (lead_id, title, due_date)
select id, 'Send pricing proposal', current_date - 2 from leads where email = 'priya@growmore.com';
insert into follow_ups (lead_id, title, due_date)
select id, 'Schedule product demo', current_date + 1 from leads where email = 'rahul@techvista.in';
insert into follow_ups (lead_id, title, due_date)
select id, 'Share contract draft', current_date + 3 from leads where email = 'neha@edusmart.in';
insert into follow_ups (lead_id, title, due_date, completed)
select id, 'Welcome call', current_date - 1, true from leads where email = 'vikas@shopkart.in';
