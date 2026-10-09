// Contact form. Submissions post to the Google Apps Script web app in contact-apps-script.gs, which
// emails support. Until its URL is set below, Send opens the visitor's email app with the same message
// addressed to support. See README.md, "Contact form".
// The web app's URL: "https://script.google.com/macros/s/<deployment id>/exec". Empty = email.
const CONTACT_ENDPOINT = '';
const SUPPORT_EMAIL = 'support@ourtimedesignsllc.com';

const form = document.getElementById('contact-form');
const error = document.getElementById('contact-error');
const connected = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(CONTACT_ENDPOINT);

document.getElementById('year').textContent = String(new Date().getFullYear());
document.getElementById('contact-privacy').textContent = connected
  ? 'Your message is emailed to us. Your address is used only to reply to you.'
  : 'Send opens your email app with this message addressed to ' + SUPPORT_EMAIL + '.';

function values() {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim(),
    message: String(data.get('message') || '').trim(),
    website: String(data.get('website') || ''),
  };
}

function problem(v) {
  if (!v.name) return 'Add your name.';
  if (!v.email || !form.elements.email.checkValidity()) return 'Check the email address.';
  if (!v.message) return 'Write your message before sending.';
  return '';
}

function sendByEmail(v) {
  const body = v.message + '\n\n---\nFrom: ' + v.name + ' <' + v.email + '>';
  location.href = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent('Website contact from ' + v.name) +
    '&body=' + encodeURIComponent(body);
}

function sendToReceiver(v) {
  // A plain form POST into a hidden frame: the web app accepts it without cross-origin access, and
  // the page never reads the response (it shows its own thanks when the frame loads).
  const post = document.createElement('form');
  post.method = 'POST';
  post.action = CONTACT_ENDPOINT;
  post.target = 'contact-sink';
  post.hidden = true;
  for (const [name, value] of Object.entries(v)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    post.append(input);
  }
  document.getElementById('contact-sink').addEventListener('load', () => {
    form.hidden = true;
    document.getElementById('contact-thanks').hidden = false;
  }, { once: true });
  form.querySelector('button[type=submit]').disabled = true;
  document.body.append(post);
  post.submit();
  post.remove();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const v = values();
  error.textContent = problem(v);
  if (error.textContent) return;
  if (connected) sendToReceiver(v); else sendByEmail(v);
});

// Light / dark. The page follows the system until the visitor picks one; the pick is remembered in
// this browser only. A tiny inline script in <head> applies it before first paint.
const toggle = document.getElementById('theme-toggle');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
function currentlyDark() {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === 'dark' : systemDark.matches;
}
function paintToggle() {
  const dark = currentlyDark();
  toggle.textContent = dark ? 'Light' : 'Dark';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
toggle.addEventListener('click', () => {
  const next = currentlyDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) { /* private mode: not remembered */ }
  paintToggle();
  document.dispatchEvent(new Event('themechange'));
});
systemDark.addEventListener('change', paintToggle);
paintToggle();
