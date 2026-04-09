const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace (req, res, next) with (req, res)
  content = content.replace(/\(req,\s*res,\s*next\)/g, '(req, res)');

  // Replace next(error), next(err), next(e) with the block
  content = content.replace(/\s*next\((error|err|e)\);/g, (match, p1) => {
    return `\n    console.error(${p1});\n    return res.status(500).json({\n      success: false,\n      message: ${p1}.message || "Server error"\n    });`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
