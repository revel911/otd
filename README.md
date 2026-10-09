# Our Time Designs website

The company site for Our Time Designs, LLC, published at https://ourtimedesignsllc.com. One static page: who we are, what we make (PadLock), how to reach us. Open `index.html` directly in a browser, or serve this directory with any static web server. No build step and no runtime dependencies; the only external request is the Figtree font from Google Fonts.

Design notes: `docs/superpowers/specs/2026-10-09-otd-site-design.md`. The leaf mark (`assets/leaf-*.svg`) is traced from the original logo. The dark theme follows the system; the header toggle overrides it and is remembered per browser.

## Contact form

The form posts to a Google Apps Script web app (`contact-apps-script.gs`) that emails each message to support@ourtimedesignsllc.com, with the sender's address as Reply-To. Until the web app's URL is set, Send opens the visitor's email app addressed to support instead.

To connect it (once), signed in as the Google account that should send the mail:
1. Go to https://script.google.com → **New project**. Replace the editor's contents with `contact-apps-script.gs` and save.
2. **Deploy → New deployment →** type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, then authorize (it asks for permission to send email as you).
3. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`) into `CONTACT_ENDPOINT` in `site.js`. Push.

Check it: open the Web app URL in a private window. It should say "Our Time Designs contact receiver is running." Then send a test message from the live site and confirm it arrives at support.

After editing the script, use Deploy → **Manage deployments → Edit → New version** to keep the same URL; a *new* deployment gets a new URL. The script limits every field's length and drops submissions that fill the hidden spam-trap field. Apps Script caps a consumer account at about 100 emails a day; if spam becomes a problem, redeploy with access removed or add a check.
