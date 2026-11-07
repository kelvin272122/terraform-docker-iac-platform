-- Administrative, idempotent privileges for the application role.
-- Run as the database administrator after applying migrations.
-- Required psql variables: database_name, app_user.
-- Identifiers are interpolated with psql's :"name" form.
\set ON_ERROR_STOP on

REVOKE ALL ON DATABASE :"database_name" FROM :"app_user";
REVOKE ALL ON SCHEMA public FROM :"app_user";
REVOKE ALL ON TABLE public.records FROM :"app_user";

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT CONNECT ON DATABASE :"database_name" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, DELETE ON TABLE public.records TO :"app_user";
