# Our Time Designs website — design

Date: 2026-10-09. Approved in conversation (brainstorming path: architectural, owner asked to build to the end after section 1).

## Purpose
The company front door for Our Time Designs, LLC (Richmond, VA). A visitor should trust the publisher and click through to PadLock. Secondary: a public, verifiable business presence (LLC name in the footer) for things like code-signing identity validation.

Story: Our Time Designs started in 2008 as a small design and marketing studio, paused while the founder led design at Capital One, and is back in 2026 as a product studio building its own things. PadLock is product one.

## Scope
One static page, anchored sections: hero, products (one PadLock card, room for more), about (studio + founder, link to LinkedIn), contact (form), footer (LLC line). Plain HTML/CSS/JS, no build step, no framework, no analytics. Deployed with GitHub Pages to ourtimedesigns.com, same pattern as drumwithpadlock.com.

Out of scope: résumé timeline, blog, dark theme, second product, CMS.

## Visual direction
"Evolved letterhead": white and light-gray field, letterhead blue primary, charcoal text, orange used as a rare accent. The letterhead's devices carry the identity: the thick blue rule at the page's right edge, the blue/orange/charcoal stripe, bracketed `[ segment ]` info strips. The leaf mark is redrawn as SVG (the original was only a small JPG). One typeface (Figtree), left-aligned.

## Contact form
Fields: name, email, message, hidden honeypot. Posts (plain form POST into a hidden iframe) to a Google Apps Script web app (`contact-apps-script.gs`) that emails support@ourtimedesignsllc.com. Until the endpoint URL is set in `site.js`, Send opens the visitor's email app addressed to support. Same mechanism as PadLock's feedback form.

## Deployment
GitHub repo, Actions workflow `pages.yml` uploads the repo root (minus docs) on push to main. Custom domain set in repository Settings → Pages; DNS at the registrar points to GitHub Pages.

## Testing
Manual: open index.html locally, check phone width, keyboard focus, form validation and the mailto fallback. Node test for the form's validation helper is not worth it at this size; the Apps Script is checked by opening its URL (GET returns a running message).
