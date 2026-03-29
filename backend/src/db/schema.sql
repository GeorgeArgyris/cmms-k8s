
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'technician',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  serial_number VARCHAR(100),
  model         VARCHAR(100),
  category_id   INTEGER REFERENCES asset_categories(id),
  location_id   INTEGER REFERENCES locations(id),
  status        VARCHAR(30) NOT NULL DEFAULT 'active',
  purchase_date DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  asset_id     INTEGER REFERENCES assets(id),
  assigned_to  INTEGER REFERENCES users(id),
  created_by   INTEGER REFERENCES users(id),
  status       VARCHAR(30) NOT NULL DEFAULT 'open',
  priority     VARCHAR(20) NOT NULL DEFAULT 'medium',
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  asset_id    INTEGER REFERENCES assets(id),
  frequency   VARCHAR(30) NOT NULL,
  next_due    DATE,
  last_done   DATE,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_comments (
  id            SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id),
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  action      VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);