CREATE TABLE "public"."event_standings" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "event_id" integer,
  "team_id" integer,
  "place" integer,
  "disqualified" boolean DEFAULT 'false',
  CONSTRAINT "standings_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams" ("team_id"),
  CONSTRAINT "standings_event_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events" ("event_id"),
  CONSTRAINT "unique_team_event_standings" UNIQUE ("event_id", "team_id")
  