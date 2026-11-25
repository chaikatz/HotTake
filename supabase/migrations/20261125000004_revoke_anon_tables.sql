-- Signed-out visitors only ever call check_invite(); they need no table access.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
