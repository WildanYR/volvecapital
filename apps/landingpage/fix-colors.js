const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('e:\\latihan coding\\1volvecapital\\volvecapital\\apps\\landingpage\\src\\app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Orange borders and fills
    content = content.replace(/border-\[\#f97316\]/g, 'border-primary');
    content = content.replace(/border-t-\[\#f97316\]/g, 'border-t-primary');
    content = content.replace(/border-l-\[\#f97316\]/g, 'border-l-primary');
    content = content.replace(/ring-\[\#f97316\]/g, 'ring-primary');
    content = content.replace(/shadow-orange-500\/(\d+)/g, 'shadow-primary/$1');
    content = content.replace(/bg-orange-100/g, 'bg-primary/20');
    content = content.replace(/fill-\[\#f97316\]/g, 'fill-primary');
    content = content.replace(/shadow-\[0_\d+px_\d+px_rgba\(249,115,22,0\.\d+\)\]/g, 'shadow-xl shadow-primary/20');
    
    // Hardcoded white text matching primary backgrounds
    content = content.replace(/text-white/g, 'text-primary-foreground');
    content = content.replace(/text-slate-900/g, 'text-foreground');
    content = content.replace(/bg-slate-900/g, 'bg-muted/30');
    content = content.replace(/bg-\[\#050505\]/g, 'bg-background');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
