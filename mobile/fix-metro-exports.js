const fs = require('fs');
const path = require('path');

function findJsFiles(dir, baseDir = dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, baseDir, fileList);
    } else if (file.endsWith('.js')) {
      const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      fileList.push(relPath);
    }
  });
  
  return fileList;
}

const metroPackages = ['metro', 'metro-cache', 'metro-transform-worker'];

metroPackages.forEach(pkgName => {
  const pkgPath = path.join(__dirname, 'node_modules', pkgName, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const mainExport = pkg.main || './src/index.js';
  const srcPath = path.join(__dirname, 'node_modules', pkgName, 'src');
  
  const exports = {
    '.': mainExport.startsWith('./') ? mainExport : `./${mainExport}`,
    './package.json': './package.json',
    './private/*': './src/*.js'
  };
  
  // Add all src files as exports (both with and without .js extension)
  // Also add directory exports for directories that might be imported
  if (fs.existsSync(srcPath)) {
    const jsFiles = findJsFiles(srcPath, srcPath);
    const dirs = new Set();
    
    jsFiles.forEach(file => {
      const exportPath = `./src/${file}`;
      const exportPathNoExt = exportPath.replace(/\.js$/, '');
      // Add with .js extension
      exports[exportPath] = exportPath;
      // Also add without .js extension (for imports that don't include it)
      if (exportPathNoExt !== exportPath) {
        exports[exportPathNoExt] = exportPath;
      }
      
      // Track directories for directory exports
      const dirPath = path.dirname(file).replace(/\\/g, '/');
      if (dirPath !== '.') {
        dirs.add(`./src/${dirPath}`);
      }
    });
    
    // Add directory exports (point to index.js if exists, otherwise first file)
    dirs.forEach(dir => {
      const dirExportPath = `${dir}/index.js`;
      const dirPath = path.join(__dirname, 'node_modules', pkgName, dir.replace('./src/', 'src/'));
      if (fs.existsSync(path.join(dirPath, 'index.js'))) {
        exports[dir] = dirExportPath;
        exports[`${dir}/`] = dirExportPath;
      }
    });
  }
  
  pkg.exports = exports;
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(`Fixed exports for ${pkgName} (${Object.keys(exports).length} exports)`);
});

// Fix sourceMapString.js to add default export for @expo/metro-config compatibility
const sourceMapStringPath = path.join(__dirname, 'node_modules', 'metro', 'src', 'DeltaBundler', 'Serializers', 'sourceMapString.js');
if (fs.existsSync(sourceMapStringPath)) {
  let content = fs.readFileSync(sourceMapStringPath, 'utf8');
  // Add default export if it doesn't exist
  if (!content.includes('exports.default')) {
    // Find the line with exports.sourceMapString and add default export after it
    content = content.replace(
      /exports\.sourceMapString = sourceMapString;/,
      'exports.sourceMapString = sourceMapString;\n// Add default export for compatibility with @expo/metro-config\nexports.default = sourceMapString;'
    );
    fs.writeFileSync(sourceMapStringPath, content);
    console.log('Fixed sourceMapString.js default export');
  }
}

// Create index.js for Serializers directory if it doesn't exist
const serializersIndexPath = path.join(__dirname, 'node_modules', 'metro', 'src', 'DeltaBundler', 'Serializers', 'index.js');
if (!fs.existsSync(serializersIndexPath)) {
  const indexContent = `"use strict";

const sourceMapStringModule = require("./sourceMapString");

// Re-export as default for compatibility with @expo/metro-config
module.exports = sourceMapStringModule.sourceMapString;
module.exports.sourceMapString = sourceMapStringModule.sourceMapString;
module.exports.sourceMapStringNonBlocking = sourceMapStringModule.sourceMapStringNonBlocking;
`;
  fs.writeFileSync(serializersIndexPath, indexContent);
  console.log('Created Serializers/index.js');
}

console.log('Metro exports fixed!');
