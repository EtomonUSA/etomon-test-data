const path = require('path'); 
const cheerio = require('cheerio');
const request = require('request-promise-native');
const fs = require('fs-extra');
const { flatten } = require('lodash');

const outputFile = path.join(__dirname, '..', 'data', 'emperors.json');

(async () => {
    const $ = await request({ url: `https://en.wikipedia.org/wiki/Holy_Roman_Emperor`, transform: cheerio.load });

    $('table[cellpadding="4"]').remove();

    const data = flatten(
        $('.mw-parser-output h4').get().map((h4) => {
            const house = $('.mw-headline', h4).text();
            const emperors = $('tr', $(h4).nextAll('table').first()).get().slice(1);

            return emperors.map((emperor) => {
                const imageUrl = `https:`+$('img', $('td', emperor)[0]).attr('src');
                const nameElement = $(emperor).children()[$('th:contains("Name")', $(emperor).parent()).index()];

                const name = $(nameElement).clone().children('small').remove().end().text().trim().split('[').shift();
                const url = 'https://en.wikipedia.org'+$('a', nameElement).attr('href');
                const reignText = $('small', nameElement).text().trim().replace(/\(/g, '').replace(/\)/g, '');
                const reignStart = Number(reignText.split('–').shift());
                const reignEnd = Number(reignText.split('–').pop());


                return {
                    house,
                    imageUrl,
                    name,
                    url,
                    reignStart,
                    reignEnd
                };
            });
        })
    );

    await fs.ensureFile(outputFile);
    await fs.writeFile(outputFile, JSON.stringify(data, null, 4));
})();