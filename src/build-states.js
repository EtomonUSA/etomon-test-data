const path = require('path'); 
const xxhash = require('xxhash');
const cheerio = require('cheerio');
const request = require('request-promise-native');
const lzma = require('lzma-native');
const fs = require('fs-extra');
const sharp = require('sharp');
const { flatten } = require('lodash');
const msgpack = require('@msgpack/msgpack');
const outputDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data', 'states');

function getStatePath(state) {
    return path.join(outputDir, `${state.id}`);
}

async function getStatePage(state) {
    let $ = await request({
        url: state.url,
        transform: (body) => cheerio.load(body)
    });
    

    $('sup.reference').remove();
    const text = $('#mw-content-text p').text();
    state.text = text.trim();
    const relImg = $('.infobox a.image img[data-file-width]').parents('a').first().attr('href');

    if (!relImg) {
        throw new Error(`State ${state.name} has no image`);
    }

    const imagePage = 'https://en.wikipedia.org'+relImg;

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
        .resize({ height: 400 })
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
        
        const statesInLetter = Array.from($('.wikitable tbody tr'));

        let newStates = [];
        for (const stateEle of statesInLetter.slice(1)) {
            try {
                const col = Array.from($('td', stateEle));

                const titleAnchor = $('a:last-child:not(.new)', col[0]);
                const url = `https://en.wikipedia.org`+titleAnchor.attr('href');
                const id = xxhash.hash(Buffer.from(url, 'utf8'), 7367);

                const name = titleAnchor.text();
                const type = $(col[1]).text().trim();
                const circle = $(col[2]).text().trim();
                const branch = $(col[3]).text().trim();
                const founded = Number(($(col[4]).text().trim()).replace(/[^0-9.]/ig, '')) || void(0);
                
                const state = {
                    id,
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

                let buf = msgpack.encode(state);
                if (!process.env.NO_COMPRESS) {
                    buf = await lzma.compress(buf, 9);
                    await fs.ensureFile(getStatePath(state)+'.xz');
                    await fs.writeFile(getStatePath(state)+'.xz', buf);
                } else {
                    await fs.ensureFile(getStatePath(state));
                    await fs.writeFile(getStatePath(state), buf);
                }
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