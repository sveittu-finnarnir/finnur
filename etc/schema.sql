CREATE TABLE IF NOT EXISTS "Users" (
    "id" character varying(255),
    "authy_id" character varying(255),
    "arion_token" character varying(255),
    "wit_session_id" character varying(255),
    "first_name" character varying(255),
    "last_name" character varying(255),
    "gender" character varying(10)
);

INSERT INTO "Users" (id, authy_id) VALUES ('10154234453187128', '23738888');
