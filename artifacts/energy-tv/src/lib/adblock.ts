// EnergyTV AdBlock + Tracker Interceptor
// ONLY vidlink.pro allowed as video player source

const BLOCKED_DOMAINS = [
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adform.net',
  'adsafeprotected.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'amazon-adsystem.com',
  'taboola.com',
  'outbrain.com',
  'criteo.net',
  'scorecardresearch.com',
  'quantserve.com',
  'facebook.net',
  'facebook.com/tr',
  // Add more trackers here if needed
];

const ALLOWED_PLAYER_DOMAINS = [
  '111movies.net',
  'tmdb.org',
  'themoviedb.org',
  'image.tmdb.org',
];

export function initAdBlock() {
  console.log('[EnergyTV] AdBlock initialized - vidlink.pro only');

  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    let hostname: string;

    try {
      hostname = new URL(url.startsWith('http') ? url : window.location.origin + url).hostname;
    } catch {
      return originalFetch(input, init);
    }

    // Block ad/tracker domains
    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      console.log(`[EnergyTV AdBlock] Blocked: ${hostname}`);
      return new Response('{}', { status: 204 });
    }

    // Strict player domain check
    if (url.includes('/embed/') && !ALLOWED_PLAYER_DOMAINS.some(d => hostname.includes(d))) {
      console.warn(`[EnergyTV] Blocked unauthorized player: ${hostname}`);
      return new Response('Blocked', { status: 403 });
    }

    return originalFetch(input, init);
  };

  // Also patch XHR
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
    const urlStr = url.toString();
    let hostname: string;

    try {
      hostname = new URL(urlStr.startsWith('http') ? urlStr : window.location.origin + urlStr).hostname;
    } catch {
      return originalXHROpen.apply(this, [method, url] as any);
    }

    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      console.log(`[EnergyTV AdBlock] Blocked XHR: ${hostname}`);
      return;
    }

    return originalXHROpen.apply(this, [method, url] as any);
  } as any;
}

// Auto init when imported
if (typeof window !== 'undefined') {
  initAdBlock();
}

export { BLOCKED_DOMAINS, ALLOWED_PLAYER_DOMAINS };
