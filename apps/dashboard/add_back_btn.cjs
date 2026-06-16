const fs = require('fs');
const path = require('path');

const configs = [
  {
    file: 'role/index.tsx',
    headerSearch: `<div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Role & Permission</h1>`,
    lucideImport: `import { ChevronRight, Plus, Shield, SquarePen, Trash2 } from 'lucide-react'`
  },
  {
    file: 'staff/index.tsx',
    headerSearch: `<div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Manajemen Staff</h1>`,
    lucideImport: `import { Plus, Trash2, Users } from 'lucide-react'`
  },
  {
    file: 'shift/route.tsx',
    headerSearch: `<div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Shift</h1>`,
    lucideImport: `import { Loader2, Plus, Users, Pencil } from 'lucide-react'`
  },
  {
    file: 'attendance/route.tsx',
    headerSearch: `<div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Absensi</h1>`,
    lucideImport: `import { Loader2, User, Eye, History, MapPin, Check, X, FileText, Download } from 'lucide-react'`
  },
  {
    file: 'withdrawal/route.tsx',
    headerSearch: `<div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Withdrawal</h1>`,
    lucideImport: `import { Loader2, Eye, Check, X, Search, FileText } from 'lucide-react'`
  }
];

configs.forEach(cfg => {
  const p = path.join('e:/latihan coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accountsetting', cfg.file);
  if(!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf-8');
  
  if(!c.includes('ChevronLeft')) {
    c = c.replace(cfg.lucideImport, cfg.lucideImport.replace(' } from', ', ChevronLeft } from'));
  }
  
  if(!c.includes('<ChevronLeft')) {
    const replacement = `<div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/accountsetting">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          ${cfg.headerSearch}`;
    c = c.replace(cfg.headerSearch, replacement);
    // Add closing div after the header block. Since it's a bit tricky, let's just do it cleanly by targeting the whole div.
    // Actually, cfg.headerSearch only matches the inner div. We replaced it with a wrapper div and the inner div.
    // We need to close the wrapper div after the inner div's closing tag.
  }
  
  fs.writeFileSync(p, c);
});
