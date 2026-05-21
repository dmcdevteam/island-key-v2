-- Notifications system foundation

CREATE TABLE IF NOT EXISTS public.notifications (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                TEXT        NOT NULL,
  body                 TEXT        NOT NULL,
  type                 TEXT        NOT NULL DEFAULT 'general'
    CHECK (type IN ('general','booking','weather','event','offer','reminder')),
  target               TEXT        NOT NULL DEFAULT 'all'
    CHECK (target IN ('all','property','guest')),
  target_property_id   UUID        REFERENCES properties(id),
  target_guest_id      UUID        REFERENCES guests(id),
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  scheduled_at         TIMESTAMPTZ DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id   UUID        REFERENCES notifications(id) ON DELETE CASCADE,
  guest_id          UUID        REFERENCES guests(id) ON DELETE CASCADE,
  read_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notification_id, guest_id)
);
