const fs = require('fs');
const path = require('path');
const files = [
  'role/index.tsx', 
  'role/create.tsx', 
  'role/$roleId.tsx', 
  'staff/index.tsx', 
  'staff/create.tsx', 
  'shift/route.tsx', 
  'attendance/route.tsx', 
  'withdrawal/route.tsx'
];

files.forEach(f => {
  const p = path.join('e:/latihan coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accountsetting', f);
  if(fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf-8');
    c = c.replace(/createFileRoute\('\/dashboard\/(role|staff|admin\/shift|admin\/attendance|admin\/withdrawal)([^']*)'\)/g, "createFileRoute('/dashboard/accountsetting/$1$2')");
    c = c.replace(/accountsetting\/admin\//g, 'accountsetting/');
    c = c.replace(/to="\/dashboard\/(role|staff|admin\/shift|admin\/attendance|admin\/withdrawal)/g, 'to="/dashboard/accountsetting/$1');
    c = c.replace(/to="\/dashboard\/accountsetting\/admin\//g, 'to="/dashboard/accountsetting/');
    fs.writeFileSync(p, c);
  }
});
