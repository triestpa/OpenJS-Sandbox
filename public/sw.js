/**
 * JS Sandbox Service Worker
 * Enables full offline use by pre-caching app resources.
 * Leaves external (non-origin) resources to the browser cache.
 * Refreshes cached files on each page load when online.
*/

const CACHE = 'v1'
const PRECACHE_URLS = [ 'index.html', 'app.js', 'styles.css' ]

/** Precache resouces on SW install  */
self.addEventListener('install', function (event) {
  event.waitUntil(preCache().then(() => self.skipWaiting()))
})

/** Claim client on SW activate */
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
})

/** Handle resource fetch */
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  if (url.origin == event.target.location.origin) {
    // Handle origin(same-domain) requests with custom caching logic
    event.respondWith(handleRequest(event.request))
  } else {
    // Fetch cross-origin resources normally. When offline, these will fallback to the browser cache.
    event.respondWith(fetch(event.request))
  }
})

/** Insert specified URLs in precache  */
async function preCache () {
  const cache = await caches.open(CACHE)
  return cache.addAll(PRECACHE_URLS).catch(console.error)
}

/** Handle an HTTP request - Refresh resource if online, fetch from cache if not  */
async function handleRequest (request) {
  try { // Fetch new resouce version by default
    return await refreshResource(request)
  } catch (err) { // If error on fetch, get from cache
    return await getResourceFromCache(request)
  }
}

/** Download and cache a fresh version of the resource */
async function refreshResource (request) {
  let requestNoCache = new Request(request.url, { headers: { 'Cache-Control': 'no-cache' } });
  const response = await fetch(requestNoCache)
  await putInCache(request, response)
  return response
}

/** Insert resource into cache */
async function putInCache (request, response) {
  const cache = await caches.open(CACHE)
  return cache.put(request, response.clone())
}

/** Retreive resource from cache */
async function getResourceFromCache (request) {
  const cache = await caches.open(CACHE)
  return cache.match(request).catch(console.error)
}