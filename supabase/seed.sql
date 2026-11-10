-- Optional sample data for demo purposes.
-- Run after schema.sql. Do not run it twice, or you will get duplicate rows.

insert into leads (full_name, email, phone, company, source, status, priority, notes) values
('Rahul Sharma','rahul@techvista.in','9876543210','TechVista Solutions','Website','New','High','Asked for a demo of the product'),
('Priya Verma','priya@growmore.com','9812345678','GrowMore Retail','LinkedIn','Contacted','Medium','Interested in pricing plans'),
('Amit Singh','amit@buildwell.in','9898989898','BuildWell Infra','Referral','Interested','High','Needs CRM for 25 sales reps'),
('Neha Gupta','neha@edusmart.in','9123456780','EduSmart','Cold Call','Negotiation','High','Negotiating annual contract'),
('Vikas Mishra','vikas@shopkart.in','9001122334','ShopKart','Website','Converted','Medium','Signed up for the Pro plan'),
('Sana Khan','sana@healthfirst.in','9345678901','HealthFirst Clinics','Event','Lost','Low','Went with a competitor'),
('Arjun Patel','arjun@fintrack.in','9786543210','FinTrack','LinkedIn','New','Medium','No response to 2 follow-up emails'),
('Kavya Reddy','kavya@logiflow.in','9654321098','LogiFlow','Referral','Contacted','High','Asked for a call next week');

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

insert into follow_ups (lead_id, title, due_date)
select id, 'Send pricing proposal', current_date - 2 from leads where email = 'priya@growmore.com';
insert into follow_ups (lead_id, title, due_date)
select id, 'Schedule product demo', current_date + 1 from leads where email = 'rahul@techvista.in';
insert into follow_ups (lead_id, title, due_date)
select id, 'Share contract draft', current_date + 3 from leads where email = 'neha@edusmart.in';
insert into follow_ups (lead_id, title, due_date, completed)
select id, 'Welcome call', current_date - 1, true from leads where email = 'vikas@shopkart.in';