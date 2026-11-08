// Opt-in fetch() replacement for the live tests: set SUKEBEI_CURL=1.
// Some networks reset the TLS handshake to sukebei.nyaa.si for Node/Deno while
// the system curl still gets through. Test-only; the extension itself always
// uses the host app's fetch().
import { execFile } from 'node:child_process'

if (process.env.SUKEBEI_CURL === '1') {
  globalThis.fetch = (url, opts = {}) => new Promise((resolve, reject) => {
    const args = ['-s', '-L', '--max-time', '20', '-X', opts.method || 'GET', '-w', '\n%{http_code}']
    for (const [k, v] of Object.entries(opts.headers || {})) args.push('-H', k + ': ' + v)
    if (opts.body) args.push('--data-binary', String(opts.body))
    args.push(String(url))
    execFile('curl', args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new TypeError('fetch failed: ' + err.message))
      const cut = stdout.lastIndexOf('\n')
      const status = parseInt(stdout.slice(cut + 1), 10) || 0
      resolve(new Response(stdout.slice(0, cut), { status }))
    })
  })
}
