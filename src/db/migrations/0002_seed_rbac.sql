-- Seed RBAC roles and permissions
INSERT INTO roles (name) VALUES
  ('admin'),
  ('organizer'),
  ('user'),
  ('venue_owner')
ON CONFLICT (name) DO NOTHING;
--  create name = 445454
INSERT INTO permissions (name) VALUES
  ('create_seat'),
  ('create_event'),
  ('create_venue'),
  ('insert_batches'),
  ('count_seats'),
  ('setup_payment'),
  ('create_event_seat'),
  ('update_event_seat_status'),
  ('reserved_seat_booking'),
  ('get_booked_seat'),
  ('get_booking_for_update'),
  ('update_booking_status'),
  ('delete_event'),
  ('delete_venue'),
  ('update_event')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'create_seat','create_event','create_venue','insert_batches',
    'count_seats','setup_payment','create_event_seat','update_event_seat_status',
    'reserved_seat_booking','get_booked_seat','get_booking_for_update','update_booking_status',
    'delete_event','delete_venue','update_event'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('create_event','create_venue','create_seat')
WHERE r.name = 'organizer'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('create_event','create_venue','create_seat','delete_event','delete_venue','update_event')
WHERE r.name = 'venue_owner'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('reserved_seat_booking','get_booked_seat','get_booking_for_update','update_booking_status')
WHERE r.name = 'user'
ON CONFLICT DO NOTHING;
