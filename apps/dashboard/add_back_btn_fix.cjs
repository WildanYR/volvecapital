const fs = require('fs');
const path = require('path');

const configs = [
  {
    file: 'role/index.tsx',
    innerParagraph: '<p className="text-muted-foreground mt-1">Kelola role dan hak akses staff dashboard</p>'
  },
  {
    file: 'staff/index.tsx',
    innerParagraph: '<p className="text-muted-foreground mt-1">Kelola akun staff yang dapat login ke dashboard</p>'
  },
  {
    file: 'shift/route.tsx',
    innerParagraph: '<p className="text-muted-foreground">Kelola jam kerja shift karyawan.</p>'
  },
  {
    file: 'attendance/route.tsx',
    innerParagraph: '<p className="text-muted-foreground">Kelola jam kerja, absensi harian dan jadwal libur mingguan karyawan.</p>'
  },
  {
    file: 'withdrawal/route.tsx',
    innerParagraph: '<p className="text-muted-foreground">Kelola permintaan penarikan dana dari user.</p>'
  }
];

configs.forEach(cfg => {
  const p = path.join('e:/latihan coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accountsetting', cfg.file);
  if(!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf-8');
  
  if(c.includes('<ChevronLeft') && !c.includes('</div>\n        </div>')) {
    // Need to insert </div> after the inner paragraph
    c = c.replace(cfg.innerParagraph + '\\n        </div>', cfg.innerParagraph + '\\n          </div>\\n        </div>');
    fs.writeFileSync(p, c);
  } else if(c.includes('<ChevronLeft') && c.includes('</p>\\n        </div>')) {
    c = c.replace(cfg.innerParagraph + '\\n        </div>', cfg.innerParagraph + '\\n          </div>\\n        </div>');
    fs.writeFileSync(p, c);
  } else {
    // If we just need to add the closing div
    const lines = c.split('\\n');
    const pIndex = lines.findIndex(l => l.includes(cfg.innerParagraph.substring(0, 30)));
    if (pIndex !== -1 && lines[pIndex+1].trim() === '</div>') {
      lines.splice(pIndex + 2, 0, '        </div>');
      fs.writeFileSync(p, lines.join('\\n'));
    }
  }
});
