const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes("'expired'")) {
          console.log(file);
          const lines = content.split('\n');
          for(let i=0; i<lines.length; i++) {
            if(lines[i].includes("'expired'")) console.log(i+1 + ': ' + lines[i]);
          }
        }
      }
    }
  });
  return results;
}
walk('apps/api/src');
walk('apps/bot/src');
walk('apps/bot2/src');
