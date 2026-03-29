INSERT INTO locations (name, description) VALUES
  ('Building A — Floor 1', 'Main production floor'),
  ('Building A — Floor 2', 'Offices and control room'),
  ('Building B — Warehouse', 'Storage and logistics'),
  ('Outdoor — North Zone', 'External equipment area');

INSERT INTO asset_categories (name) VALUES
  ('HVAC'),
  ('Electrical'),
  ('Mechanical'),
  ('Plumbing'),
  ('Safety Systems');

INSERT INTO assets (name, serial_number, model, category_id, location_id, status, notes) VALUES
  ('Air Compressor Unit A-01', 'SN-2021-001', 'Atlas Copco GA15', 3, 1, 'active', 'Main production compressor'),
  ('HVAC Rooftop Unit B-02',   'SN-2019-045', 'Carrier 50XC',     1, 4, 'active', 'Serviced annually'),
  ('Electrical Panel EP-03',   'SN-2020-112', 'Schneider iEM',    2, 2, 'active', 'Main distribution board'),
  ('Fire Suppression System',  'SN-2018-007', 'Kidde Sapphire',   5, 1, 'active', 'Inspection due Q2'),
  ('Forklift Toyota FLK-01',   'SN-2022-033', 'Toyota 8FBN25',    3, 3, 'under_maintenance', 'Hydraulic issue reported');

-- Admin user: admin@cmms.dev / password123
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@cmms.dev',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('John Technician', 'john@cmms.dev',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician');

INSERT INTO work_orders (title, description, asset_id, assigned_to, created_by, status, priority, due_date) VALUES
  ('Replace air filter — Compressor A-01', 'Monthly filter replacement as per schedule', 1, 2, 1, 'open', 'medium', CURRENT_DATE + 3),
  ('Annual HVAC inspection',               'Full inspection and refrigerant top-up',      2, 2, 1, 'in_progress', 'high', CURRENT_DATE + 7),
  ('Fix hydraulic leak — Forklift FLK-01', 'Technician reported oil leak from cylinder',  5, 2, 1, 'open', 'critical', CURRENT_DATE + 1),
  ('Test fire suppression system',         'Quarterly test and inspection',                4, 2, 1, 'open', 'high', CURRENT_DATE + 14);

INSERT INTO maintenance_schedules (title, asset_id, frequency, next_due, description) VALUES
  ('Monthly filter check — Compressor A-01', 1, 'monthly', CURRENT_DATE + 30, 'Replace air intake filter'),
  ('Annual HVAC service',                    2, 'annual',  CURRENT_DATE + 90, 'Full refrigerant + belt check'),
  ('Weekly forklift safety check',           5, 'weekly',  CURRENT_DATE + 7,  'Brakes, hydraulics, horn, lights');
