const path = require('path'); 
const cheerio = require('cheerio');
const request = require('request-promise-native');
const lzma = require('lzma-native');
const fs = require('fs-extra');
const sharp = require('sharp');
const { flatten } = require('lodash');
const BSON = require('bson-ext');
const bson = new BSON([BSON.Binary, BSON.Code, BSON.DBRef, BSON.Decimal128, BSON.Double, BSON.Int32, BSON.Long, BSON.Map, BSON.MaxKey, BSON.MinKey, BSON.ObjectId, BSON.BSONRegExp, BSON.Symbol, BSON.Timestamp]);
const outputDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data', 'states');

function getStatePath(state) {
    return path.join(outputDir, `${state.id}.bson`);
}

async function getStatePage(state) {
    let $ = await request({
        url: state.url,
        transform: (body) => cheerio.load(body)
    });
    

    $('sup.reference').remove();
    const text = $('#mw-content-text p').text();
    state.text = text.trim();

    const imagePage = 'https://en.wikipedia.org'+$('.infobox a.image img[data-file-width]').parents('a').first().attr('href');

    $ = await request({
        url: imagePage,
        transform: (body) => cheerio.load(body)
    });

    state.imageUrl = 'https:'+$('.fullImageLink > a').attr('href');
    
    return state;
}

async function getStateImage(state) {
    console.log(`Grabbing image for ${state.name}`);
    image = await request({
        url: state.imageUrl,
        encoding: null,
        transform: null,
        timeout: 10000
    });
    
    image = await sharp(image)
        .resize(300)
        .png()
        .toBuffer();

    state.image = image;
    return state;
}

async function mainLoop(letter = 'A', states = []) {
    try {
        console.log(`Grabbing states in ${letter}`)
        let $ = await request({
            url: `https://en.wikipedia.org/wiki/List_of_states_in_the_Holy_Roman_Empire_(${letter})`,
            transform: cheerio.load,
            timeout: 5000
        });
        
        const statesInLetter = Array.from($('.wikitable tbody tr')).slice(1);

        let newStates = [];
        for (let i = 0; i < statesInLetter.length; i++) {
            try {
                const stateEle = statesInLetter[i];
                const col = Array.from($('td', stateEle));

                const titleAnchor = $('a:last-child:not(.new)', col[0]);
                const url = `https://en.wikipedia.org`+titleAnchor.attr('href');

                const name = titleAnchor.text();
                const type = $(col[1]).text().trim();
                const circle = $(col[2]).text().trim();
                const branch = $(col[3]).text().trim();
                const founded = Number(($(col[4]).text().trim()).replace(/[^0-9.]/ig, '')) || void(0);
                
                const state = {
                    id: i,
                    name,
                    url,
                    type,
                    circle,
                    branch,
                    founded,
                };

                if (!state.name || !url)    
                    continue;

                if (await fs.pathExists(getStatePath(state)) || await fs.pathExists(getStatePath(state)+'.xz')) {
                    console.log(`${state.name} already downloaded...`);
                    continue;
                }

                console.log(`Found ${state.name}`);
                await getStatePage(state);
                await getStateImage(state);

                const buf = await lzma.compress(bson.serialize(state), 9);
                await fs.ensureFile(getStatePath(state)+'.xz');
                await fs.writeFile(getStatePath(state)+'.xz', buf);
            } catch (e) {
                console.error(`Error in ${letter}: `+e.message);
                continue;
            }
        }

    } catch (e) {
        console.error(`Error in ${letter}: `+e.message);
    }

    const letterCode = letter.charCodeAt(0) + 1;
    const nextLetter = String.fromCharCode(letterCode); 
    if (letterCode < 91) {
        return mainLoop(nextLetter, states);
    } else {
        return states;
    }
}

module.exports = async () => {
    await mainLoop();
}