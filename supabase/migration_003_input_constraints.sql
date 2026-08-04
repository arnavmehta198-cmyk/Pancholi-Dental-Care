-- Defense-in-depth: DB-level CHECK constraints mirroring src/validation.js.
-- Client-side Zod validation can always be bypassed by anyone calling the
-- PostgREST API directly with the anon key, so the same limits are enforced
-- here as the actual security boundary. Run in Supabase SQL Editor.
--
-- Notes on the regex style below: patterns use POSIX classes ([[:space:]]) and
-- bracketed literals ([.], [+]) instead of backslash escapes (\s, \., \+).
-- Backslash escapes inside bracket expressions behave inconsistently in
-- Postgres ARE and an earlier version of this file silently failed to enforce
-- because of it. No backslashes here at all — nothing left to misparse.
--
-- Constraints are added NOT VALID: they are fully enforced on every INSERT and
-- UPDATE from now on, but Postgres skips re-scanning pre-existing rows. That
-- means a single bad legacy row can't block the whole migration. The cleanup
-- + VALIDATE steps at the bottom handle the existing data.

begin;

-- Remove test rows that violate the rules, so the VALIDATE step below passes.
delete from contacts
where email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   or char_length(message) not between 1 and 2000
   or char_length(first_name) not between 1 and 80
   or char_length(last_name) not between 1 and 80;

delete from appointments
where email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   or char_length(first_name) not between 1 and 80
   or char_length(last_name) not between 1 and 80
   or char_length(appointment_time) not between 1 and 20
   or (country_code is not null and country_code !~ '^[+]?[0-9]{1,5}$')
   or (phone is not null and (phone !~ '^[0-9 -]+$' or char_length(phone) not between 6 and 15));

-- appointments
alter table appointments drop constraint if exists appointments_first_name_len;
alter table appointments add constraint appointments_first_name_len
  check (char_length(first_name) between 1 and 80) not valid;

alter table appointments drop constraint if exists appointments_last_name_len;
alter table appointments add constraint appointments_last_name_len
  check (char_length(last_name) between 1 and 80) not valid;

alter table appointments drop constraint if exists appointments_email_format;
alter table appointments add constraint appointments_email_format
  check (email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
         and char_length(email) <= 254) not valid;

alter table appointments drop constraint if exists appointments_country_code_format;
alter table appointments add constraint appointments_country_code_format
  check (country_code is null or country_code ~ '^[+]?[0-9]{1,5}$') not valid;

alter table appointments drop constraint if exists appointments_phone_format;
alter table appointments add constraint appointments_phone_format
  check (phone is null or (phone ~ '^[0-9 -]+$'
         and char_length(phone) between 6 and 15)) not valid;

alter table appointments drop constraint if exists appointments_time_len;
alter table appointments add constraint appointments_time_len
  check (char_length(appointment_time) between 1 and 20) not valid;

-- contacts
alter table contacts drop constraint if exists contacts_first_name_len;
alter table contacts add constraint contacts_first_name_len
  check (char_length(first_name) between 1 and 80) not valid;

alter table contacts drop constraint if exists contacts_last_name_len;
alter table contacts add constraint contacts_last_name_len
  check (char_length(last_name) between 1 and 80) not valid;

alter table contacts drop constraint if exists contacts_email_format;
alter table contacts add constraint contacts_email_format
  check (email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
         and char_length(email) <= 254) not valid;

alter table contacts drop constraint if exists contacts_message_len;
alter table contacts add constraint contacts_message_len
  check (char_length(message) between 1 and 2000) not valid;

-- Promote to fully validated now that violating rows are gone.
alter table appointments validate constraint appointments_first_name_len;
alter table appointments validate constraint appointments_last_name_len;
alter table appointments validate constraint appointments_email_format;
alter table appointments validate constraint appointments_country_code_format;
alter table appointments validate constraint appointments_phone_format;
alter table appointments validate constraint appointments_time_len;
alter table contacts validate constraint contacts_first_name_len;
alter table contacts validate constraint contacts_last_name_len;
alter table contacts validate constraint contacts_email_format;
alter table contacts validate constraint contacts_message_len;

commit;

-- Proof it worked: this must return 10 rows, all with convalidated = true.
select conrelid::regclass as table_name, conname as constraint_name, convalidated
from pg_constraint
where contype = 'c'
  and conrelid in ('appointments'::regclass, 'contacts'::regclass)
  and conname like any (array['appointments_%', 'contacts_%'])
order by table_name, constraint_name;
