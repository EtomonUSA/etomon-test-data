const fs = require('fs-extra');
const path = require('path');
const msgpack = require('@msgpack/msgpack');
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const empDir = path.join(dataDir, 'emperors');
const statesDir = path.join(dataDir, 'states');

const emperors = fs.pathExistsSync(empDir) ? fs.readdirSync(empDir).filter(f =>  f.indexOf('.xz') === -1).map(f => path.join(empDir, f)) : [];
const states = fs.pathExistsSync(statesDir) ? fs.readdirSync(statesDir).filter(f => f.indexOf('.xz') === -1).map(f => path.join(statesDir, f)) : [];

function createDataProxy(data) {
    const dataProxy = new Proxy(data, {
        set: () => false,
        deleteProperty: () => false,
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
                const record = msgpack.decode(file);
                
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