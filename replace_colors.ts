import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace teal to amber
    content = content.replace(/bg-teal-/g, 'bg-amber-');
    content = content.replace(/text-teal-/g, 'text-amber-');
    content = content.replace(/border-teal-/g, 'border-amber-');
    content = content.replace(/ring-teal-/g, 'ring-amber-');
    content = content.replace(/shadow-teal-/g, 'shadow-amber-');
    content = content.replace(/from-teal-/g, 'from-amber-');
    content = content.replace(/to-teal-/g, 'to-amber-');

    // Replace slate-800/900 to blue-950
    content = content.replace(/bg-slate-800/g, 'bg-blue-950');
    content = content.replace(/text-slate-800/g, 'text-blue-950');
    content = content.replace(/border-slate-800/g, 'border-blue-950');
    content = content.replace(/bg-slate-900/g, 'bg-blue-950');
    content = content.replace(/text-slate-900/g, 'text-blue-950');
    content = content.replace(/border-slate-900/g, 'border-blue-950');

    // Replace slate backgrounds to stone-50 for warm offwhite
    // But Slate works well as Steel Grey so I will leave slate as is, just the dark ones became deep blue.
    content = content.replace(/bg-slate-50/g, 'bg-[#faf9f6]'); // true offwhite
    
    // What about gray borders/text? Let's leave slate for Steel Grey.

    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Done!');
