import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const targetDir = path.join(root, 'backend', 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (!fs.existsSync(distDir)) {
    console.error('No dist directory found. Did the build run successfully?');
    process.exit(1);
  }

  // ensure backend/dist exists
  if (!fs.existsSync(path.dirname(targetDir))) {
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  }
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Copying files from ${distDir} to ${targetDir}`);
  copyRecursive(distDir, targetDir);
  console.log('Frontend files copied to backend/dist');
} catch (err) {
  console.error('Error preparing render files:', err);
  process.exit(1);
}
