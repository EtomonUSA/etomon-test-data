const {WikiDummyDataCreator} = require('@etomon/wiki-dummy-data/lib/index');
const {DEFAULT_RECORD_OPTIONS} = require('@etomon/wiki-dummy-data/lib/Record');
const fs = require('fs-extra');
const path =  require('path');
const outpath = path.join(__dirname, '..', 'data', fs.readJsonSync(require('path').join(__dirname, '..', 'package.json')).version);
const { EncodeTools } = require('@etomon/encode-tools');

const chance = require('chance')();

(async () => {
  for (let [ name, url, col ] of [
    ...[
      ['https://en.wikipedia.org/wiki/List_of_current_Chinese_provincial_leaders', 'Provincial level government executives in China (list)'],
      ['https://en.wikipedia.org/wiki/Grammy_Award_for_Best_New_Artist', 'Grammy Award for Best New Artist'],
      ['https://en.wikipedia.org/wiki/Governor_General_of_Canada', 'Governors General of Canada'],
      ['https://en.wikipedia.org/wiki/Enrique_Graue_Wiechers', 'Rectors of the Universidad Nacional (Autónoma) de México (UNAM respectively UNM)']
    ].map(([link, name]) => ['people', link, name]),
    ...[
      ['https://en.wikipedia.org/wiki/List_of_cities_in_China', 'Metropolitan cities of China'],
      // North America
      ['https://en.wikipedia.org/wiki/Manhattan', 'New York metropolitan area'],
      ['https://en.wikipedia.org/wiki/Mexico', 'World Heritage Sites in Mexico'],
      ['https://en.wikipedia.org/wiki/Quebec', 'Provinces and territories of Canada']
    ].map(([link, name]) => ['places', link, name])
  ]) {
    console.log(name, url, col);

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
      if (name === 'people' && record.data.coordinates) {

        continue;
      }

      if (record.data.name && record.data.name.split) {
        record.data.name = record.data.name.split('(').shift().trim();
        record.data.title = record.data.title.split('(').shift().trim();
      }


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
