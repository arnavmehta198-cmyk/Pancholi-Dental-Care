import { isSupabaseConfigured } from './supabaseConfig.js';

const SESSION_KEY = 'pdc_analytics_session';

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function classifySource() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source')?.toLowerCase();
  if (utmSource) {
    if (utmSource.includes('google') && params.get('utm_medium') === 'cpc') return 'paid';
    if (utmSource.includes('maps')) return 'maps';
    return 'paid';
  }

  const referrer = document.referrer;
  if (!referrer) return 'direct';

  try {
    const host = new URL(referrer).hostname;
    if (host.includes('google.') && referrer.includes('/maps')) return 'maps';
    if (host.includes('google.') || host.includes('bing.') || host.includes('duckduckgo.')) return 'organic';
    return 'direct';
  } catch {
    return 'direct';
  }
}

function getDevice() {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 ? 'mobile' : 'desktop';
}

// Wait until the browser is idle before touching the network. Analytics must
// never compete with first paint — the Supabase SDK is loaded lazily here so it
// stays out of the initial bundle entirely.
function whenIdle(callback) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(callback, { timeout: 4000 });
  } else {
    setTimeout(callback, 1500);
  }
}

export function logEvent(eventType, extra = {}) {
  if (!isSupabaseConfigured) return;

  whenIdle(async () => {
    try {
      const { supabase } = await import('./supabaseClient.js');
      const { error } = await supabase.from('analytics_events').insert({
        event_type: eventType,
        path: window.location.hash || '#home',
        source: classifySource(),
        device: getDevice(),
        session_id: getSessionId(),
        ...extra
      });
      if (error) console.error('analytics logEvent failed', error);
    } catch (err) {
      console.error('analytics logEvent failed', err);
    }
  });
}

export function logPageview() {
  logEvent('pageview');
}

export function logBookingPageView() {
  logEvent('booking_page_view');
}

export function logBookingCompleted() {
  logEvent('booking_completed');
}
