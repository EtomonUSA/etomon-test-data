const {WikiDummyDataCreator} = require('@etomon/wiki-dummy-data');
const {DEFAULT_RECORD_OPTIONS} = require('@etomon/wiki-dummy-data/lib/Record');
const fs = require('fs-extra');
const path =  require('path');
const outpath = path.join(__dirname, '..', 'data');
const { EncodeTools } = require('@etomon/encode-tools');

const chance = require('chance')();

(async () => {
  for (let [ name, url, col ] of [
    ...[
      ['https://en.wikipedia.org/wiki/Bavarian_Circle', 'Bavarian Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Franconian_Circle',' Franconian Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Lower_Rhenish%E2%80%93Westphalian_Circle', 'Lower Rhenish–Westphalian Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Lower_Saxon_Circle', 'Lower Saxon Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Swabian_Circle', 'Swabian Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Upper_Rhenish_Circle', 'Upper Rhenish Circle (1500–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Austrian_Circle', 'Austrian Circle of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Burgundian_Circle', 'Burgundian Circle (1512–1797) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Electoral_Rhenish_Circle', 'Electoral Rhenish Circle (1512–1806) of the Holy Roman Empire'],
      ['https://en.wikipedia.org/wiki/Upper_Saxon_Circle', 'Upper Saxon Circle (1512–1806) of the Holy Roman Empire']
    ].map(([link, name]) => ['states', link, name]),
    ['emperors', 'https://en.wikipedia.org/wiki/Frederick_I,_Holy_Roman_Emperor', 'Holy Roman Emperors'],
  ]) {
    let W = new WikiDummyDataCreator({
      ...DEFAULT_RECORD_OPTIONS,
      imageSize: {
        width: 960
      }
    });

    let collection = W.createCollection(url, col, true);

    await fs.ensureDir(path.join(
      outpath,
      name));

    for await (let record of collection) {
      let recPath = path.join(
        outpath,
        name,
        await EncodeTools.WithDefaults.hashString(record.pageId, 'xxhash64')
      );

      if (await fs.pathExists(recPath))
        continue;

      let buf = await record.serialize();
      await fs.writeFile(`${recPath}`, buf);

      W.recordOptions.encodeOptions.imageFormat = chance.shuffle([ 'png', 'jpeg' ])[0];
      W.recordOptions.imageSize = {
        width: chance.integer({ min: 301, max: 960 })
      };


      console.log(`wrote ${record.data.title} → ${recPath}`);
    }
  }

  process.exit(0);
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
})
