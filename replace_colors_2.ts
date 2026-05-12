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
    
    // Replace amber to red
    content = content.replace(/bg-amber-/g, 'bg-red-');
    content = content.replace(/text-amber-/g, 'text-red-');
    content = content.replace(/border-amber-/g, 'border-red-');
    content = content.replace(/ring-amber-/g, 'ring-red-');
    content = content.replace(/shadow-amber-/g, 'shadow-red-');
    content = content.replace(/from-amber-/g, 'from-red-');
    content = content.replace(/to-amber-/g, 'to-red-');

    // Replace blue-950 to slate-900
    content = content.replace(/bg-blue-950/g, 'bg-slate-900');
    content = content.replace(/text-blue-950/g, 'text-slate-900');
    content = content.replace(/border-blue-950/g, 'border-slate-900');

    // Replace #faf9f6 to slate-50
    content = content.replace(/\[\#faf9f6\]/g, 'slate-50');

    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Done!');
