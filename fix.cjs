const fs = require('fs');
let txt = fs.readFileSync('src/pages/CauseDetail.jsx', 'utf8');
txt = txt.replace(/\{cause\.country \|\| 'India'\}/g, '{cause.country}');
txt = txt.replace(/\{cause\.verified_date \|\| 'Jan 2026'\}/g, "{cause.verified_date ? new Date(cause.verified_date).toLocaleDateString() : 'N/A'}");
fs.writeFileSync('src/pages/CauseDetail.jsx', txt);
