-- Up Migration
CREATE TABLE records (
  id UUID PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT records_title_valid
    CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 100),
  CONSTRAINT records_description_valid
    CHECK (
      description IS NULL
      OR (description = btrim(description) AND char_length(description) BETWEEN 1 AND 500)
    )
);

CREATE INDEX records_created_at_id_idx ON records (created_at DESC, id DESC);

-- Down Migration
DROP TABLE IF EXISTS records;
