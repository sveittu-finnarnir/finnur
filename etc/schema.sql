CREATE TABLE IF NOT EXISTS "Users" (
    "id" character varying(255),
    "authy_id" character varying(255),
    "arion_token" character varying(2500),
    "wit_session_id" character varying(255),
    "first_name" character varying(255),
    "last_name" character varying(255),
    "gender" character varying(10)
);

INSERT INTO "Users" (id, authy_id, arion_token) VALUES ('10154234453187128', '23738888', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJjbGllbnRfaWQiOiJmaW5udXIiLCJzY29wZSI6ImZpbmFuY2lhbCIsInN1YiI6IjExMDk0NTIwNTkiLCJhbXIiOiJwYXNzd29yZCIsImF1dGhfdGltZSI6MTQ2NDk5MDk3MCwiaWRwIjoiaWRzcnYiLCJpc3MiOiJodHRwczovL2FyaW9uYXBpLWlkZW50aXR5c2VydmVyMy1zYW5kYm94LmF6dXJld2Vic2l0ZXMubmV0IiwiYXVkIjoiaHR0cHM6Ly9hcmlvbmFwaS1pZGVudGl0eXNlcnZlcjMtc2FuZGJveC5henVyZXdlYnNpdGVzLm5ldC9yZXNvdXJjZXMiLCJleHAiOjE0NjUzNTA5NzcsIm5iZiI6MTQ2NDk5MDk3N30.TmmROYMam-DtX1n1Axu3b2xsVNoUyL0VSwSwnQAEI7JTybLUjSupsRVsx9iBDQhwzGXzs76Y-vgVVHCDzpKLfzgdAEDbLm1bOd75PcDPHDZ62BTrW339Q0RDE3gyrNGPk8Tpc4HQwYbswIhrtTQvlK705tQkBVuw7dnt09VjE3a5dk0fWjv-sdEtaQi-wGV29du6OSRlYlFL9d12sCHZvT2E0kuTni_tD-8efFsw_5nKe3wFHn3eqFTUCtexYvqtoW2bJKIAE64OkVN20p6K7AJTuIJC24XEXG81SNkb059L8feHvYMXU1nSO_0g7e97MWycIM6p3JBHqLD52dY1nw');
