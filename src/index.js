const path = require('path');

module.exports.emperors = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', 'data', 'emperors.json'), 'utf8'));