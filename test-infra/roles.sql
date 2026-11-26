-- Simula as roles usadas pela Data API; executado somente no PostgreSQL de testes.
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator LOGIN PASSWORD 'local_test_only' NOINHERIT;
GRANT service_role TO authenticator;
