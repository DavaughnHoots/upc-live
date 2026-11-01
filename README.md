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
