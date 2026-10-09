// Our Time Designs contact receiver: a Google Apps Script web app that emails each submission from
// ourtimedesigns.com's contact form to support. Paste this into a standalone Apps Script project
// (script.google.com -> New project), deploy it as a web app (see README.md, "Contact form"), then
// put the web app URL into CONTACT_ENDPOINT in site.js.

const TO = 'support@ourtimedesignsllc.com';
const MAX = { name: 120, email: 200, message: 5000 };

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
  const options = { name: 'ourtimedesigns.com contact form' };
  if (validEmail) options.replyTo = email;
  MailApp.sendEmail(TO, 'Website contact from ' + name,
    message + '\n\n---\nFrom: ' + name + (email ? ' <' + email + '>' : '') + '\nSent: ' + new Date().toISOString(),
    options);
  return reply('ok');
}

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

function reply(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}
