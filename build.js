import fs from 'fs';
import path from 'path';

console.log('Copying assets...');

const distDir = path.resolve('dist');

// Ensure clean/empty dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy a directory recursively
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy src directory and index.html
try {
  copyDirectory(path.resolve('src'), path.resolve('dist/src'));
  fs.copyFileSync(path.resolve('index.html'), path.resolve('dist/index.html'));
  console.log('Build completed successfully! Assets copied to dist/');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}
