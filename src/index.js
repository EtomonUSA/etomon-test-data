const fs = require('fs-extra');
const path = require('path');
const BSON = require('bson-ext');
const lzma = require('lzma-native');
const bson = new BSON([BSON.Binary, BSON.Code, BSON.DBRef, BSON.Decimal128, BSON.Double, BSON.Int32, BSON.Long, BSON.Map, BSON.MaxKey, BSON.MinKey, BSON.ObjectId, BSON.BSONRegExp, BSON.Symbol, BSON.Timestamp]);
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const empDir = path.join(dataDir, 'emperors');
const statesDir = path.join(dataDir, 'states');

const emperors = fs.pathExistsSync(empDir) ? fs.readdirSync(empDir).filter(f =>  f.indexOf('.bson.xz') === -1 && f.indexOf('.bson') !== -1).map(f => path.join(empDir, f)) : [];
const states = fs.pathExistsSync(statesDir) ? fs.readdirSync(statesDir).filter(f => f.indexOf('.bson.xz') === -1 && f.indexOf('.bson') !== -1).map(f => path.join(statesDir, f)) : [];

function createDataProxy(data) {
    const dataProxy = new Proxy(data, {
        set: () => false,
        has: function (target, prop) {
            if ((typeof(prop) !== 'number' && typeof(prop) !== 'string') && !Number.isInteger(Number(prop)))
                return void(0);

            return Number(prop) in target;
        },
        get: function (target, prop) {
            if (prop === 'length')
                return target.length;
            if ((typeof(prop) !== 'number' && typeof(prop) !== 'string') && !Number.isInteger(Number(prop)))
                return void(0);

            return (() => {
                let filePath = target[Number(prop)]; 
                
                if (!fs.existsSync(filePath))
                    return void(0);

                const file = fs.readFileSync(filePath);
                const record = bson.deserialize(file);
            
                for (let prop in record) {
                    if (record[prop] instanceof BSON.Binary) {
                        record[prop] = Buffer.from(record[prop].buffer);
                    }
                }

                return record;
            })();
        }
    });

    return dataProxy;
}

const mod = {
    emperors: createDataProxy(emperors),
    states: createDataProxy(states)
};

Object.freeze(mod);

module.exports = mod;