// Admin data layer. Requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY —
// all reads/writes go to the real Supabase project (see supabase/schema.sql)
// and admin login goes through Supabase Auth (bcrypt-hashed server-side,
// MFA-capable via supabase.auth.mfa). There is deliberately no client-side
// password fallback: an earlier version of this file shipped a hardcoded
// plaintext admin password in the JS bundle as a no-backend placeholder. Now
// that Supabase is live, keeping that around would just be a second, weaker
// credential sitting in the bundle for no reason — removed, not left dormant.
// If VITE_SUPABASE_URL/KEY are missing, every function below fails closed
// (no login possible, no data returned) rather than falling back to a local,
// unauthenticated store.
//
// The Supabase SDK is imported *dynamically* in each function so it never lands
// in the initial bundle — App.jsx imports this module at first paint.
import { isSupabaseConfigured } from './supabaseConfig.js';

const getSupabase = async () => (await import('./supabaseClient.js')).supabase;

// Each day can have more than one open "session" (e.g. a morning block and an
// evening block with a lunch gap in between). Monday–Saturday share one
// pattern, Sunday has its own shorter hours. closedDays lets the admin mark a
// whole weekday as off (0 = Sunday .. 6 = Saturday); none are closed by default.
export const DEFAULT_AVAILABILITY = {
  weekdaySessions: [
    { start: 10, end: 14 },
    { start: 16, end: 20 }
  ],
  sundaySessions: [{ start: 10, end: 14 }],
  closedDays: []
};

export function getSessionsForDay(availability, dayOfWeek) {
  if (availability.closedDays?.includes(dayOfWeek)) return [];
  return dayOfWeek === 0 ? availability.sundaySessions : availability.weekdaySessions;
}

function mapAppointmentRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    countryCode: row.country_code,
    phone: row.phone,
    date: row.appointment_date,
    time: row.appointment_time,
    status: row.status,
    submittedAt: row.submitted_at
  };
}

function mapContactRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    message: row.message,
    submittedAt: row.submitted_at
  };
}

// A session alone isn't "logged in" if the account has a verified TOTP
// factor enrolled: Supabase issues a session at AAL1 right after password
// sign-in, and only reaches AAL2 once the TOTP challenge is verified. Without
// this check, a stolen password-only session would satisfy isAdminLoggedIn
// even though the dashboard should require the second factor too.
export async function isAdminLoggedIn() {
  if (!isSupabaseConfigured) return false;
  const supabase = await getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return false;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.nextLevel === 'aal2' && aal.currentLevel !== aal.nextLevel) return false;
  return true;
}

// Returns { success, needsMfa, factorId, error }. On needsMfa, the caller
// must collect a TOTP code and call verifyMfaLogin before the session reaches
// AAL2 / isAdminLoggedIn returns true.
export async function loginAdmin(username, password) {
  if (!isSupabaseConfigured) {
    console.error('loginAdmin: Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
    return { success: false, needsMfa: false, error: 'not_configured' };
  }
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: username.trim(), password });
  if (error) return { success: false, needsMfa: false, error: error.message };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.nextLevel === 'aal2' && aal.currentLevel !== aal.nextLevel) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factorId = factors?.totp?.[0]?.id;
    return { success: false, needsMfa: true, factorId, error: null };
  }
  return { success: true, needsMfa: false, error: null };
}

export async function verifyMfaLogin(factorId, code) {
  if (!isSupabaseConfigured) return { error: 'not_configured' };
  const supabase = await getSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return { error: error?.message ?? null };
}

// Supabase's updateUser({password}) does NOT ask for the existing password —
// it trusts the session. That means anyone who walks up to an unlocked, signed-in
// browser could silently take over the account. So the current password is
// re-verified first, and every other session is revoked afterwards, which is
// the "invalidate sessions on password change" requirement.
export async function changeAdminPassword(currentPassword, newPassword) {
  if (!isSupabaseConfigured) return { error: 'not_configured' };
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  const email = userData?.user?.email;
  if (!email) return { error: 'You are not signed in. Log in again and retry.' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) return { error: 'Current password is incorrect.' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  // scope 'others' keeps this tab signed in but kicks out every other device,
  // so a stolen session can't survive the password change that was meant to end it.
  await supabase.auth.signOut({ scope: 'others' });
  return { error: null };
}

// --- TOTP enrollment (Security settings, run once by the admin) ---

export async function getMfaFactors() {
  if (!isSupabaseConfigured) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    console.error('getMfaFactors failed', error);
    return [];
  }
  return data.totp ?? [];
}

export async function enrollMfa() {
  if (!isSupabaseConfigured) return { error: 'not_configured' };
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) return { error: error.message };
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, error: null };
}

export async function verifyMfaEnrollment(factorId, code) {
  if (!isSupabaseConfigured) return { error: 'not_configured' };
  const supabase = await getSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return { error: error?.message ?? null };
}

export async function unenrollMfa(factorId) {
  if (!isSupabaseConfigured) return { error: 'not_configured' };
  const supabase = await getSupabase();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return { error: error?.message ?? null };
}

// scope: 'global' revokes every session for this user across all devices/tabs,
// not just the current one — required for "invalidate all sessions" after a
// password change, and used here on every logout as the safer default.
export async function logoutAdmin() {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabase();
  await supabase.auth.signOut({ scope: 'global' });
}

export async function getContacts() {
  if (!isSupabaseConfigured) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('contacts').select('*').order('submitted_at', { ascending: false });
  if (error) {
    console.error('getContacts failed', error);
    return [];
  }
  return data.map(mapContactRow);
}

export async function addContact(contact) {
  if (!isSupabaseConfigured) {
    console.error('addContact failed: Supabase is not configured');
    return { error: 'not_configured' };
  }
  const supabase = await getSupabase();
  const { error } = await supabase.from('contacts').insert({
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    message: contact.message
  });
  if (error) console.error('addContact failed', error);
  return { error: error?.message ?? null };
}

export async function getAppointments() {
  if (!isSupabaseConfigured) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('getAppointments failed', error);
    return [];
  }
  return data.map(mapAppointmentRow);
}

export async function addAppointment(appointment) {
  if (!isSupabaseConfigured) {
    console.error('addAppointment failed: Supabase is not configured');
    return { error: 'not_configured' };
  }
  const supabase = await getSupabase();
  const { error } = await supabase.from('appointments').insert({
    first_name: appointment.firstName,
    last_name: appointment.lastName,
    email: appointment.email,
    country_code: appointment.countryCode,
    phone: appointment.phone,
    appointment_date: appointment.date,
    appointment_time: appointment.time
  });
  if (error) console.error('addAppointment failed', error);
  return { error: error?.message ?? null };
}

export async function updateAppointmentStatus(id, status) {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabase();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) console.error('updateAppointmentStatus failed', error);
}

export async function getAvailability() {
  if (!isSupabaseConfigured) return DEFAULT_AVAILABILITY;
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('availability').select('*').eq('id', 1).maybeSingle();
  if (error || !data) {
    if (error) console.error('getAvailability failed', error);
    return DEFAULT_AVAILABILITY;
  }
  return {
    weekdaySessions: data.weekday_sessions,
    sundaySessions: data.sunday_sessions,
    closedDays: data.closed_days
  };
}

export async function setAvailability(availability) {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('availability')
    .update({
      weekday_sessions: availability.weekdaySessions,
      sunday_sessions: availability.sundaySessions,
      closed_days: availability.closedDays
    })
    .eq('id', 1);
  if (error) console.error('setAvailability failed', error);
}
