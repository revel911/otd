// Our Time Designs contact receiver: a Google Apps Script web app that emails each submission from
// ourtimedesigns.com's contact form to support. Paste this into a standalone Apps Script project
// (script.google.com -> New project), deploy it as a web app (see README.md, "Contact form"), then
// put the web app URL into CONTACT_ENDPOINT in site.js.

const TO = 'support@ourtimedesignsllc.com';
const MAX = { name: 120, email: 200, message: 5000 };
// Flood limits. Past any of them a submission is dropped and the sender still sees the same ok as
// the honeypot (the site never reads the reply). Apps Script does not reveal the sender's IP, so the
// short-term limits are per email address plus one site-wide burst limit.
const DAILY_LIMIT = 50;        // emails per day (New York time); MailApp allows a consumer account ~100
const BURST = { limit: 10, seconds: 600 };      // site-wide: at most 10 emails in any 10-minute window
const PER_SENDER = { limit: 3, seconds: 3600 }; // one email address: at most 3 an hour

// Opening the web app URL in a browser: a quick check that the deployment works.
function doGet() {
  return reply('Our Time Designs contact receiver is running.');
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return reply('ok');   // honeypot field: only bots fill it in
  const message = clip(p.message, MAX.message).trim();
  if (!message) return reply('missing message');
  const name = clip(p.name, MAX.name).trim() || 'Someone';
  const email = clip(p.email, MAX.email).trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!allowed(validEmail ? email.toLowerCase() : '')) return reply('ok');
  const options = { name: 'ourtimedesigns.com contact form' };
  if (validEmail) options.replyTo = email;
  MailApp.sendEmail(TO, 'Website contact from ' + name,
    message + '\n\n---\nFrom: ' + name + (email ? ' <' + email + '>' : '') + '\nSent: ' + new Date().toISOString(),
    options);
  return reply('ok');
}

// Throttles first (so a burst does not use up the day), then the daily cap; one script lock makes
// concurrent submissions count correctly.
function allowed(sender) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    const cache = CacheService.getScriptCache();
    const burstKey = 'burst:' + windowOf(BURST.seconds);
    const senderKey = sender ? 'sender:' + digest(sender) + ':' + windowOf(PER_SENDER.seconds) : '';
    const burst = Number(cache.get(burstKey) || 0);
    const mine = senderKey ? Number(cache.get(senderKey) || 0) : 0;
    if (burst >= BURST.limit || mine >= PER_SENDER.limit) return false;
    if (!takeDailySlot('emails', DAILY_LIMIT)) return false;
    cache.put(burstKey, String(burst + 1), BURST.seconds);
    if (senderKey) cache.put(senderKey, String(mine + 1), PER_SENDER.seconds);
    return true;
  } finally {
    lock.releaseLock();
  }
}

// Counts per day (New York time) in Script properties; older days' counters are removed.
function takeDailySlot(name, limit) {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
  const key = 'count:' + name + ':' + today;
  props.getKeys().forEach(function (k) {
    if (k.indexOf('count:' + name + ':') === 0 && k !== key) props.deleteProperty(k);
  });
  const used = Number(props.getProperty(key) || 0);
  if (!(used < limit)) return false;
  props.setProperty(key, String(used + 1));
  return true;
}

// Fixed time windows: the counter key changes when the window does, and the cache entry expires.
function windowOf(seconds) {
  return Math.floor(Date.now() / (seconds * 1000));
}

function digest(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text));
}

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

function reply(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}
