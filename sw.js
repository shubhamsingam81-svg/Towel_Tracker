const CACHE = 'towel-v4';
const URLS = [
    '/', 'index.html', 'styles.css', 'app.js', 'manifest.json',
    'export.js', 'advanced-features.js', 'customization.js'
];
const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
    'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js',
    'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js',
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => {
            // Cache local files (must succeed)
            const localPromise = c.addAll(URLS);
            // Cache CDN files (best-effort, don't block install)
            const cdnPromise = Promise.allSettled(CDN_URLS.map(url => fetch(url).then(r => r.ok ? c.put(url, r) : null)));
            return Promise.all([localPromise, cdnPromise]);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => {
            if (r) return r;
            return fetch(e.request).then(response => {
                // Cache CDN resources on first fetch
                if (response.ok && e.request.url.startsWith('https://cdn.jsdelivr.net/')) {
                    const clone = response.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                }
                return response;
            }).catch(() => null);
        })
    );
});
