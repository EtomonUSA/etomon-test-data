const path = require('path'); 
const cheerio = require('cheerio');
const request = require('request-promise-native');
const fs = require('fs-extra');
const { flatten } = require('lodash');

const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'data');
const outputFile = path.join(outputDir, 'states.json');


async function mainLoop(letter = 'A', states = []) {
    try {
        console.log(`Grabbing states in ${letter}`)
        const $ = await request({
            url: `https://en.wikipedia.org/wiki/List_of_states_in_the_Holy_Roman_Empire_(${letter})`,
            transform: cheerio.load,
            timeout: 10000
        });
        
        const statesInLetter = Array.from($('.wikitable tbody tr'));

        let newStates = [];
        for (const stateEle of statesInLetter.slice(1)) {
            try {
                const col = Array.from($('td', stateEle));

                const imageAnchor = $('a.image img', col[0]);
                let imageUrl = `https:`+$(imageAnchor).attr('src');

                imageUrl = imageUrl.replace('/thumb/', '/').split('/').slice(0, -1).join('/');

                const titleAnchor = $('a:last-child:not(.new)', col[0]);
                const name = titleAnchor.text();
                const url = `https://en.wikipedia.org`+titleAnchor.attr('href');
                const type = $(col[1]).text().trim();
                const circle = $(col[2]).text().trim();
                const branch = $(col[3]).text().trim();
                const founded = Number(($(col[4]).text().trim()).replace(/[^0-9.]/ig, '')) || void(0);
                
                const state = {
                    imageUrl,
                    name,
                    url,
                    type,
                    circle,
                    branch,
                    founded
                };

                if (!state.name || !url)    
                    continue;
            
                console.log(`Found ${state.name}`);
                newStates.push(state);
            } catch (e) {
                console.error(`Error in ${letter}: `+e.message);
                continue;
            }
        }

        newStates = await Promise.all(newStates.filter(s => s.imageUrl).map(async (state) => {
            let image;
            try {
                console.log(`Grabbing image for ${state.name}`);
                image = await request({
                    url: state.imageUrl,
                    encoding: null,
                    transform: null,
                    timeout: 10000
                });

                state.image = image.toString('base64');
            } catch (e) {
                state.image = void(0);
            } finally {
                return state;
            }
        }));

        states = states.concat(newStates);
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
    const data = await mainLoop();

    await fs.ensureFile(outputFile);
    await fs.writeFile(outputFile, JSON.stringify(data, null, 4));
}