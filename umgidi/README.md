# Umgidi ka Uyanda Calana · RSVP

A small mobile-first site for guests confirming they will attend Umgidi ka Uyanda Calana on 12 December 2026 at The Ostrich Cape Town.

There is no build step. The repository root is the static site. Fredoka and Montserrat are included under the SIL Open Font License.

## Pages

- `index.html` — the guest invitation and RSVP form. A successful submit calls the existing Supabase function `submit_umgidi_rsvp`.
- `list.html` — the hosts' private list. Open it with the access key in the query string: `list.html?key=…`. It calls `get_umgidi_rsvps`, searches, refreshes every 60 seconds, and downloads a CSV. Times are shown in Africa/Johannesburg. Search engines are asked not to index this page.

## Run it locally

From this folder:

```bash
python3 -m http.server 47291
```

Then open `http://127.0.0.1:47291/` on a phone or in a narrow browser window.

## Deploy

Upload this folder to any static host. Two commands that work once you are logged in:

```bash
npx netlify deploy --prod --dir .
npx wrangler pages deploy . --project-name umgidi-rsvp
```

The guest page `og:image` and `og:url` currently point at a temporary public tunnel. When you move the site to a permanent host, change those two tags to that host so WhatsApp keeps showing `assets/og.jpg` (already 1200×630).

## Pictures

`assets/border.webp` is the poster's beadwork strip. The guest page also uses the beaded stick, the man in the suit, the cow, and the men in traditional attire. `assets/venue-map.webp` is the hosts' annotated access map. `assets/og.jpg` is the link preview.

WhatsApp preview tags live together at the top of `index.html`. They default to `https://dubanicreatives.tech/umgidi/`. Change `og:url` and `og:image` there if the public address moves. Every other path in the site is relative, so the folder can be served from `/umgidi/`.
