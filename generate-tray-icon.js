const fs = require('fs');
const { execSync } = require('child_process');

console.log('Generating menu bar template icon...');

try {
  // Generate 22x22 template icon (recommended size for macOS menu bar)
  execSync(`qlmanage -t -s 44 -o assets/ assets/iconTemplate.svg 2>/dev/null`);

  const generatedFile = fs.readdirSync('assets/').find(f => f.startsWith('iconTemplate') && f.endsWith('.png'));

  if (generatedFile) {
    // Resize to proper menu bar size
    execSync(`sips -z 22 22 assets/${generatedFile} --out assets/iconTemplate@2x.png 2>/dev/null`);
    execSync(`sips -z 16 16 assets/iconTemplate@2x.png --out assets/iconTemplate.png 2>/dev/null`);

    // Clean up temp file
    if (generatedFile !== 'iconTemplate.png' && generatedFile !== 'iconTemplate@2x.png') {
      fs.unlinkSync(`assets/${generatedFile}`);
    }

    console.log('✓ Template icon generated!');
    console.log('  - assets/iconTemplate.png (16x16)');
    console.log('  - assets/iconTemplate@2x.png (22x22)');
  } else {
    console.error('Failed to generate template icon');
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
