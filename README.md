# upc-live

Content feed for the self-updating sections of [upcplainfield.com](https://www.upcplainfield.com)
(United Presbyterian Church of Plainfield, NJ): This Week, Newsletters, and Upcoming Events.

- `upc-live.js` draws the sections inside Squarespace code blocks.
- `upc-live.json` holds the content; it is edited by the church's weekly publishing tool.
- `newsletters/` and `flyers/` hold files linked from the site.

## Leaders dashboard (`dashboard/`)

A private overview for church leaders on a hidden, password-protected
Squarespace page. `upc-dashboard.js` asks for the leaders' password and
decrypts `dashboard.enc.json` in the browser (AES-256-GCM, key from the
password with PBKDF2-SHA256, 600,000 rounds). The data file is unreadable
without the password, and the site never stores the password (a leader's own browser may offer to save it on their device). The data is built and
encrypted on the church PC by `build_dashboard.py`, which is not kept here.
No member names, prayer requests, or individual giving go on the dashboard.

## Advent study (`advent/`)

An interactive, step-by-step version of the 2026 Adult Advent Study
("Walking in the Way of Peace", written by Pastor Allegra Hoots).
`upc-advent.js` draws the study inside a Squarespace code block:

```html
<div data-upc-advent>Loading the Advent study…</div>
<script src="https://davaughnhoots.github.io/upc-live/advent/upc-advent.js"></script>
```

The words live in `advent-2026.json`. To add a week, fill in that week's
`steps` list; a week with no steps shows as "Coming soon". Notes and choices
that readers write stay only in their own browser. Nothing is sent anywhere.
