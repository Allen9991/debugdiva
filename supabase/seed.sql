-- Admin Ghost demo seed data
-- Realistic NZ plumber demo for Sunday pitch

-- Clear existing demo data in dependency order
delete from messages;
delete from quotes;
delete from invoices;
delete from captures;
delete from jobs;
delete from clients;
delete from users;

-- Demo user / business owner
insert into users (
  id,
  email,
  business_name,
  business_type,
  gst_registered,
  gst_number,
  created_at
) values (
  '11111111-1111-1111-1111-111111111111',
  'mike@ghostplumbing.co.nz',
  'Ghost Plumbing',
  'plumber',
  true,
  '123-456-789',
  now() - interval '30 days'
);

-- Demo clients
insert into clients (
  id,
  user_id,
  name,
  email,
  phone,
  address,
  created_at
) values
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Sarah Thompson',
  'sarah.thompson@example.com',
  '021 555 0142',
  '25 Queen Street, Christchurch',
  now() - interval '7 days'
),
(
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'James Wilson',
  'james.wilson@example.com',
  '027 555 0188',
  '14 Bealey Avenue, Christchurch',
  now() - interval '12 days'
),
(
  '22222222-2222-2222-2222-222222222224',
  '11111111-1111-1111-1111-111111111111',
  'Emma Patel',
  'emma.patel@example.com',
  '022 555 0199',
  '8 Riccarton Road, Christchurch',
  now() - interval '20 days'
);

-- Demo jobs
insert into jobs (
  id,
  user_id,
  client_id,
  location,
  description,
  status,
  labour_hours,
  materials,
  created_at,
  updated_at
) values
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '25 Queen Street, Christchurch',
  'Leak repair under kitchen sink. Used sealant, pipe fitting, and replacement valve. Job tested and complete.',
  'completed',
  2.00,
  '[
    { "name": "Sealant", "cost": 15.00 },
    { "name": "Pipe fitting", "cost": 25.00 },
    { "name": "Replacement valve", "cost": 35.00 }
  ]'::jsonb,
  now() - interval '1 day',
  now() - interval '1 day'
),
(
  '33333333-3333-3333-3333-333333333334',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  '14 Bealey Avenue, Christchurch',
  'Bathroom tap replacement. Quote sent, waiting for approval.',
  'quoted',
  1.50,
  '[
    { "name": "Mixer tap", "cost": 95.00 },
    { "name": "Flexible hose pair", "cost": 28.00 }
  ]'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days'
),
(
  '33333333-3333-3333-3333-333333333335',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222224',
  '8 Riccarton Road, Christchurch',
  'Hot water cylinder inspection completed. Invoice already sent.',
  'invoiced',
  1.00,
  '[
    { "name": "Inspection consumables", "cost": 20.00 }
  ]'::jsonb,
  now() - interval '12 days',
  now() - interval '12 days'
),
(
  '33333333-3333-3333-3333-333333333336',
  '11111111-1111-1111-1111-111111111111',
  null,
  null,
  'Unlinked receipt capture from Bunnings. Needs attaching to the right job.',
  'new',
  null,
  '[]'::jsonb,
  now() - interval '2 hours',
  now() - interval '2 hours'
);

-- Demo captures
insert into captures (
  id,
  user_id,
  type,
  raw_text,
  image_url,
  audio_url,
  processed,
  job_id,
  created_at
) values
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'voice',
  'Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.',
  null,
  '/demo/audio/sarah-queen-street-note.mp3',
  true,
  '33333333-3333-3333-3333-333333333333',
  now() - interval '1 day'
),
(
  '44444444-4444-4444-4444-444444444445',
  '11111111-1111-1111-1111-111111111111',
  'receipt',
  'Bunnings receipt. Plumbing materials. Total $75.00 including GST.',
  '/demo/receipts/bunnings-75.jpg',
  null,
  true,
  null,
  now() - interval '2 hours'
);

-- Demo invoices
insert into invoices (
  id,
  job_id,
  line_items,
  labour_total,
  materials_total,
  gst,
  total,
  status,
  due_date,
  sent_at,
  created_at
) values
(
  '55555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333',
  '[
    { "description": "Labour - leak repair", "quantity": 2, "unit_price": 90.00, "total": 180.00 },
    { "description": "Materials - sealant, pipe fitting, replacement valve", "quantity": 1, "unit_price": 75.00, "total": 75.00 }
  ]'::jsonb,
  180.00,
  75.00,
  38.25,
  293.25,
  'draft',
  current_date + interval '7 days',
  null,
  now() - interval '1 day'
),
(
  '55555555-5555-5555-5555-555555555556',
  '33333333-3333-3333-3333-333333333335',
  '[
    { "description": "Hot water cylinder inspection", "quantity": 1, "unit_price": 90.00, "total": 90.00 },
    { "description": "Inspection consumables", "quantity": 1, "unit_price": 20.00, "total": 20.00 }
  ]'::jsonb,
  90.00,
  20.00,
  16.50,
  126.50,
  'sent',
  current_date - interval '4 days',
  now() - interval '11 days',
  now() - interval '12 days'
);

-- Demo quotes
insert into quotes (
  id,
  job_id,
  line_items,
  total,
  status,
  expires_at,
  created_at
) values
(
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333334',
  '[
    { "description": "Labour - bathroom tap replacement", "quantity": 1.5, "unit_price": 90.00, "total": 135.00 },
    { "description": "Mixer tap and hose pair", "quantity": 1, "unit_price": 123.00, "total": 123.00 }
  ]'::jsonb,
  296.70,
  'sent',
  current_date + interval '7 days',
  now() - interval '5 days'
);

-- Demo messages
insert into messages (
  id,
  job_id,
  type,
  subject,
  body,
  status,
  sent_at,
  created_at
) values
(
  '77777777-7777-7777-7777-777777777777',
  '33333333-3333-3333-3333-333333333333',
  'job_complete',
  'Leak repair completed',
  'Hi Sarah, the leak repair at 25 Queen Street has been completed and tested. I have drafted the invoice and will send it through shortly. Thanks again.',
  'draft',
  null,
  now() - interval '1 day'
),
(
  '77777777-7777-7777-7777-777777777778',
  '33333333-3333-3333-3333-333333333334',
  'quote_follow_up',
  'Following up your bathroom tap quote',
  'Hi James, just checking whether you had a chance to review the quote for the bathroom tap replacement. Happy to answer any questions.',
  'draft',
  null,
  now() - interval '2 days'
),
(
  '77777777-7777-7777-7777-777777777779',
  '33333333-3333-3333-3333-333333333335',
  'payment_follow_up',
  'Friendly payment reminder',
  'Hi Emma, just a friendly reminder that the invoice for the hot water cylinder inspection is now overdue. Please let me know if you have any questions.',
  'draft',
  null,
  now() - interval '1 day'
);