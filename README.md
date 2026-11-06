# West Delaware Girls Wrestling website

Live at https://westdelawaregirlswrestling.github.io

**Day-to-day updates happen in Google Sheets, not here.** The site reads these live:

| What | Sheet (team Google Drive → Team Website) |
|---|---|
| Meets, practices | Website Schedule (Live) — tabs *Schedule*, *Practices* |
| Home-page photos | Drop images in **Team Website → Website Photos (web)**. The "Website Photo Sync" Apps Script (script.google.com) updates the *Photos* tab every 10 min; set *Active* to FALSE to hide one. |
| News bar | Website Announcements |
| Roster & coaches | Website Roster (Live) |
| Record board | Website Records (Varsity) |

Things that live in this code instead: History page lists (state qualifiers, conference champs, dual records), Youth Wrestling page text, Heja team codes, and the printable-calendar PDF link (`js/site.js`).
