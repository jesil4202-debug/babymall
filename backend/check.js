const fs = require('fs');
const path = require('path');

function checkRequire(modulePath) {
  try {
    require(modulePath);
    console.log(`[OK] ${modulePath}`);
  } catch (err) {
    console.error(`[FAIL] ${modulePath}: ${err.message}`);
    if (err.stack) {
        // Find the first mention of a missing module
        const match = err.stack.match(/Cannot find module '([^']+)'/);
        if (match) {
            console.error(`MISSING MODULE: ${match[1]}`);
        } else {
            console.error(err.stack);
        }
    }
  }
}

checkRequire('./server.js');
