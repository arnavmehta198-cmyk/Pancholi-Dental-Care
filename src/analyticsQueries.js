// Real aggregation queries against the analytics_events / appointments tables
// logged by src/analytics.js. Returns null when Supabase isn't configured or
// a query fails, so callers can fall back to clearly-labeled sample data
// instead of pretending empty/broken results are real numbers.
import { isSupabaseConfigured } from './supabaseConfig.js';

const getSupabase = async () => (await import('./supabaseClient.js')).supabase;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export async function fetchConversionData() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabase();

  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [{ data: views, error: viewsError }, { data: appts, error: apptsError }] = await Promise.all([
    supabase.from('analytics_events').select('created_at').eq('event_type', 'pageview').gte('created_at', since.toISOString()),
    supabase.from('appointments').select('submitted_at').gte('submitted_at', since.toISOString())
  ]);
  if (viewsError || apptsError || !views || !appts) return null;

  const byMonth = {};
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    byMonth[monthKey(d)] = { month: MONTH_LABELS[d.getMonth()], visits: 0, bookings: 0 };
  }

  views.forEach(v => {
    const key = monthKey(new Date(v.created_at));
    if (byMonth[key]) byMonth[key].visits += 1;
  });
  appts.forEach(a => {
    const key = monthKey(new Date(a.submitted_at));
    if (byMonth[key]) byMonth[key].bookings += 1;
  });

  const rows = Object.values(byMonth);
  const hasSignal = rows.some(r => r.visits > 0);
  return hasSignal ? rows.map(r => ({ ...r, visits: Math.max(r.visits, r.bookings) })) : null;
}

export async function fetchAcquisitionData() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabase();

  const since = new Date();
  since.setDate(since.getDate() - 7 * 8);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('created_at, source')
    .eq('event_type', 'pageview')
    .gte('created_at', since.toISOString());
  if (error || !data || data.length === 0) return null;

  const weeks = Array.from({ length: 8 }, (_, i) => ({
    label: `W${i + 1}`,
    organic: 0,
    maps: 0,
    paid: 0,
    direct: 0
  }));

  data.forEach(row => {
    const daysAgo = Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = 7 - Math.min(7, Math.floor(daysAgo / 7));
    const bucket = weeks[weekIndex];
    if (!bucket) return;
    const source = ['organic', 'maps', 'paid'].includes(row.source) ? row.source : 'direct';
    bucket[source] += 1;
  });

  return weeks;
}

export async function fetchPatientSplit() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabase();

  const { data, error } = await supabase.from('analytics_events').select('session_id').eq('event_type', 'pageview');
  if (error || !data || data.length === 0) return null;

  const counts = new Map();
  data.forEach(row => counts.set(row.session_id, (counts.get(row.session_id) || 0) + 1));

  const total = counts.size;
  const returning = [...counts.values()].filter(count => count > 1).length;
  const newPatients = Math.round(((total - returning) / total) * 100);

  return { newPatients, returning: 100 - newPatients };
}

export async function fetchDeviceIntentData() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabase();

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('created_at, device')
    .eq('event_type', 'booking_page_view')
    .gte('created_at', since.toISOString());
  if (error || !data || data.length === 0) return null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i + 1);
    return { day: DAY_LABELS[d.getDay()], mobile: 0, desktop: 0 };
  });

  data.forEach(row => {
    const daysAgo = Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const dayIndex = 6 - Math.min(6, daysAgo);
    const bucket = days[dayIndex];
    if (!bucket) return;
    if (row.device === 'mobile') bucket.mobile += 1;
    else bucket.desktop += 1;
  });

  return days;
}
