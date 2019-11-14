const path = require('path');

module.exports.emperors = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', 'data', 'emperors.json'), 'utf8'));
module.exports.states = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', 'data', 'states.json'), 'utf8'));