const fs = require('fs');
const path = require('path');

const filesToFix = [
  'frontend/components/layout/Header.tsx',
  'frontend/components/layout/Footer.tsx',
  'frontend/components/IntroLoader.tsx',
  'frontend/components/admin/AdminSidebar.tsx',
  'frontend/app/(store)/auth/login/page.tsx'
];

for (const rel of filesToFix) {
  const filePath = path.join(__dirname, rel);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace the Image tag spanning multiple lines possibly
    content = content.replace(/<Image[^>]*src="\/logo\.png(\?v=\d+)?"[^>]*\/>/gs, '<Image src="/logo.png" width={120} height={120} alt="Logo" />');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', rel);
  }
}
