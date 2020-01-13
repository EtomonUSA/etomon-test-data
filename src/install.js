const lzma = require('lzma-native');
const path = require('path');
const fs = require('fs-extra');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const empDir = path.join(dataDir, 'emperors');
const statesDir = path.join(dataDir, 'states');

const emperors = fs.pathExistsSync(empDir) ? fs.readdirSync(empDir).filter(f =>  f.indexOf('.bson.xz') !== -1).map(f => path.join(empDir, f)) : [];
const states = fs.pathExistsSync(statesDir) ? fs.readdirSync(statesDir).filter(f => f.indexOf('.bson.xz') !== -1).map(f => path.join(statesDir, f)) : [];

async function main() {
    console.log(`decompressing emperor data...`);
    for (const filePath of (emperors.concat(states))) {
        const buf = await lzma.decompress(await fs.readFile(filePath));
        await fs.writeFile(filePath.replace('.xz', ''), buf);
        await fs.remove(filePath);
    }
    console.log(`decompressed emperor data...`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err.stack); process.exit(1); })