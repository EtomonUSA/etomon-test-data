const path = require('path'); 
const xxhash = require('xxhash');
const cheerio = require('cheerio');
const request = require('request-promise-native');
const lzma = require('lzma-native');
const fs = require('fs-extra');
const sharp = require('sharp');
const { flatten } = require('lodash');
const msgpack = require('@msgpack/msgpack');
const outputDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data', 'emperors');

function getEmpPath(emp) {
    return path.join(outputDir, `${emp.id}`);
}

async function getTextAndImageUrl(emp) {
    console.log(`Grabbing page for ${emp.name}...`);
        
    let $ = await request({
        url: emp.url,
        transform: (body) => cheerio.load(body)
    });
    
    $('sup.reference').remove();
    const text = $('#mw-content-text p').text();
    emp.text = text.trim();
    const imagePage = 'https://en.wikipedia.org'+$('.infobox a.image img[data-file-width]').parents('a').first().attr('href');
    
    $ = await request({
        url: imagePage,
        transform: (body) => cheerio.load(body)
    });

    emp.imageUrl = 'https:'+$('.fullImageLink > a').attr('href');
    return emp;
}

async function getImage(emp) {
    console.log(`Grabbing images for ${emp.name}...`);
    let image = await request({
        url: emp.imageUrl,
        encoding: null,
        transform: null
    });

    image = await sharp(image)
        .resize(300)
        .png()
        .toBuffer();

    emp.image = Buffer.from(image);

    return emp;
}

module.exports = async () => {
    console.log(`Grabbing emperor info...`);
    let $ = await request({ url: `https://en.wikipedia.org/wiki/Holy_Roman_Emperor`, transform: cheerio.load });

    $('table[cellpadding="4"]').remove();

    const data = flatten(
        $('.mw-parser-output h4').get().map((h4, index) => {
            let house = $('.mw-headline', h4).text();
                            
            if  (house.indexOf(': ') !== -1) {
                house = house.split(': ').pop();
            }

            const emperors = $('tr', $(h4).nextAll('table').first()).get().slice(1);

            return emperors.map((emperor) => {
                const nameElement = $(emperor).children()[$('th:contains("Name")', $(emperor).parent()).index()];

                const name = $(nameElement).clone().children('small').remove().end().text().trim().split('[').shift();
                const url = 'https://en.wikipedia.org'+$('a', nameElement).attr('href');
                const reignText = $('small', nameElement).text().trim().replace(/\(/g, '').replace(/\)/g, '');
                const reignStart = Number(reignText.split('–').shift());
                const reignEnd = Number(reignText.split('–').pop());
                

                const id = xxhash.hash(Buffer.from(url, 'utf8'), 7367);
                return {
                    index,
                    id,
                    house,
                    name,
                    url,
                    reignStart,
                    reignEnd
                };
            });
        })
    );

    for (const emp of data) {
        if (await fs.pathExists(getEmpPath(emp)) || await fs.pathExists(getEmpPath(emp)+'.xz')) {
            console.log(`${emp.name} already downloaded...`);
            continue;
        }
        
        await getTextAndImageUrl(emp);
        await getImage(emp);

        let buf = msgpack.encode(emp);
        if (!process.env.NO_COMPRESS) {
            buf = await lzma.compress(buf, 9);
            await fs.ensureFile(getEmpPath(emp)+'.xz');
            await fs.writeFile(getEmpPath(emp)+'.xz', buf);
        } else {
            await fs.ensureFile(getEmpPath(emp));
            await fs.writeFile(getEmpPath(emp), buf);
        }
    } 
};