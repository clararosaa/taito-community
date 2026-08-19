/* Pienet muotoiluapurit. Kaikki tekstit suomeksi. */

export function timeAgo(iso) {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'juuri nyt'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} pv`
  const dt = new Date(iso)
  return `${dt.getDate()}.${dt.getMonth() + 1}.`
}

/* Kellonaika suomalaisittain: 9.41 */
export function clockTime(iso) {
  const d = new Date(iso)
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, '0')}`
}

/* Kannan date-sarake (YYYY-MM-DD) suomalaiseen muotoon: 12.8.2026 */
export function shortDate(value) {
  const [y, m, d] = String(value ?? '').split('-').map(Number)
  return y && m && d ? `${d}.${m}.${y}` : String(value ?? '')
}

/* Päiväavain localStoragea varten: YYYY-MM-DD paikallisessa ajassa. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/* Avatarin väriparit tokeneista. Sama henkilö saa aina saman parin. */
const AVATAR_COLORS = [
  { bg: '#E3F3E8', fg: '#00753A' },
  { bg: '#FFF3D4', fg: '#8A6200' },
  { bg: '#FFE7E0', fg: '#8F3018' },
  { bg: '#F1EEE8', fg: '#6E665C' },
  { bg: '#EAF6EC', fg: '#00532A' }
]

export function avatarColor(seed = '') {
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum = (sum + seed.charCodeAt(i)) % 9973
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

/* Etunimi 2×2-ruudukkoon. */
export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name
}

export function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* privaattitila */ }
}
