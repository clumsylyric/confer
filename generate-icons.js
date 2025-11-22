const fs = require('fs');
const { execSync } = require('child_process');

// Create iconset directory
const iconsetDir = 'assets/icon.iconset';
if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir, { recursive: true });
}

// Icon sizes needed for macOS
const sizes = [
  { size: 16, name: 'icon_16x16.png' },
  { size: 32, name: 'icon_16x16@2x.png' },
  { size: 32, name: 'icon_32x32.png' },
  { size: 64, name: 'icon_32x32@2x.png' },
  { size: 128, name: 'icon_128x128.png' },
  { size: 256, name: 'icon_128x128@2x.png' },
  { size: 256, name: 'icon_256x256.png' },
  { size: 512, name: 'icon_256x256@2x.png' },
  { size: 512, name: 'icon_512x512.png' },
  { size: 1024, name: 'icon_512x512@2x.png' }
];

console.log('Converting SVG to PNG files...');

// Convert SVG to PNG using sips (macOS built-in tool)
// First, we need to create a large PNG from the SVG
try {
  // Use qlmanage to convert SVG to PNG on macOS
  execSync(`qlmanage -t -s 1024 -o ${iconsetDir}/ assets/logo.svg 2>/dev/null`);

  // Rename the generated file
  const generatedFile = fs.readdirSync(iconsetDir).find(f => f.endsWith('.png'));
  if (generatedFile) {
    fs.renameSync(`${iconsetDir}/${generatedFile}`, `${iconsetDir}/temp.png`);

    // Now resize to all needed sizes
    sizes.forEach(({ size, name }) => {
      console.log(`Generating ${name} (${size}x${size})...`);
      execSync(`sips -z ${size} ${size} ${iconsetDir}/temp.png --out ${iconsetDir}/${name} 2>/dev/null`);
    });

    // Remove temp file
    fs.unlinkSync(`${iconsetDir}/temp.png`);

    // Create .icns file
    console.log('Creating .icns file...');
    execSync(`iconutil -c icns ${iconsetDir} -o assets/icon.icns`);

    console.log('✓ Icon generation complete!');
    console.log('  Generated: assets/icon.icns');
  } else {
    console.error('Failed to generate initial PNG from SVG');
    process.exit(1);
  }
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\nTrying alternative method with Node canvas...');

  // Alternative: just copy the SVG and we'll handle it differently
  fs.copyFileSync('assets/logo.svg', 'assets/icon.png');
  console.log('Please manually convert assets/icon.png to icons using an online tool or Image2Icon app');
}
