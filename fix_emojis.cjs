const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.jsx')) {
        callback(dirPath);
      }
    }
  });
}

walk('src', (f) => {
  let txt = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (txt.includes('?? ')) {
    txt = txt.replace(/\?\? /g, '💝 ');
    changed = true;
  }
  if (txt.includes('? <strong>')) {
    txt = txt.replace(/\? \<strong\>/g, '✔️ <strong>');
    changed = true;
  }
  if (txt.includes('>? ')) {
    txt = txt.replace(/>\? /g, '>\uD83D\uDCCD ');
    changed = true;
  }
  if (txt.includes('> ? ')) {
    txt = txt.replace(/> \? /g, '> \uD83D\uDCCD ');
    changed = true;
  }
  if (txt.includes('"? ')) {
    txt = txt.replace(/\"\? /g, '"\uD83D\uDCCD ');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, txt);
  }
});
