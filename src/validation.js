// Validation for every public-facing form payload before it reaches
// adminStore.js / Supabase. This is defense in depth, not the primary
// control — Postgres CHECK constraints (supabase/migration_003_input_constraints.sql)
// enforce the same limits server-side, since client-side validation alone can
// always be bypassed by anyone calling the API directly with the anon key.
//
// \p{L}/\p{M} (unicode letter/mark) rather than [a-zA-Z] so names typed in
// Hindi (or any other script) aren't rejected — this site has a Hindi/English
// toggle, and a name field that only accepts Latin letters would be a real bug,
// not just a security nicety.
//
// zod is imported dynamically and cached: it's ~60 KB and nothing can be
// validated until a visitor actually submits a form, so paying for it during
// first paint is wasted bytes on the critical path.

let schemasPromise = null;

function buildSchemas(z) {
  const name = z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Name is too long.')
    .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Name can only contain letters, spaces, hyphens, and apostrophes.');

  const email = z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(254, 'Email is too long.')
    .email('Enter a valid email address.');

  const message = z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(2000, 'Message is too long (2000 characters max).');

  const countryCode = z
    .string()
    .trim()
    .min(1, 'Country code is required.')
    .max(6, 'Country code is too long.')
    .regex(/^\+?[0-9]{1,5}$/, 'Enter a valid country code, e.g. +91.');

  // [0-9 -] (literal space), not [0-9\s-]: \s would also accept tabs/newlines,
  // which the matching Postgres CHECK constraint rejects. Keeping the client
  // rule exactly as strict as the DB rule means anything this accepts is
  // guaranteed to survive the insert.
  const phone = z
    .string()
    .trim()
    .min(6, 'Phone number is too short.')
    .max(15, 'Phone number is too long.')
    .regex(/^[0-9 -]+$/, 'Phone number can only contain digits, spaces, and hyphens.');

  const isoDate = z
    .string()
    .trim()
    .refine(v => !Number.isNaN(new Date(v).getTime()), 'Select a valid date.');

  const time = z.string().trim().min(1, 'Select a time.').max(20, 'Invalid time.');

  return {
    contactSchema: z.object({ firstName: name, lastName: name, email, message }),
    appointmentSchema: z.object({
      firstName: name,
      lastName: name,
      email,
      countryCode,
      phone,
      date: isoDate,
      time
    })
  };
}

function getSchemas() {
  if (!schemasPromise) {
    schemasPromise = import('zod').then(({ z }) => buildSchemas(z));
  }
  return schemasPromise;
}

// Returns { data, error } — error is a user-facing message, or null on success.
async function validate(schemaName, payload) {
  const schemas = await getSchemas();
  const parsed = schemas[schemaName].safeParse(payload);
  if (parsed.success) return { data: parsed.data, error: null };
  return { data: null, error: parsed.error.issues[0]?.message ?? 'Please check your details and try again.' };
}

export const validateContact = payload => validate('contactSchema', payload);
export const validateAppointment = payload => validate('appointmentSchema', payload);

// Kick off the zod download when a visitor first focuses a form field, so the
// module is usually already cached by the time they press submit.
export function preloadValidation() {
  getSchemas();
}
