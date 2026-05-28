const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

function replaceInDir(dir) {
  const items = fs.readdirSync(dir);
  for(const item of items) {
    const full = path.join(dir, item);
    if(fs.statSync(full).isDirectory()) {
        replaceInDir(full);
    } else if(full.endsWith('.ts') || full.endsWith('.tsx')) {
        let content = fs.readFileSync(full, 'utf8');
        let newContent = content.replace(/\\`/g, '`');
        if(content !== newContent) {
           fs.writeFileSync(full, newContent, 'utf8');
           console.log('Fixed', full);
        }
    }
  }
}

replaceInDir('./src');
