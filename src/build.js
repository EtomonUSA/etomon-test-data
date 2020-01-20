(async () => {
    await require('./build-emperors')();
    // await require('./build-states')();
})().then(() => process.exit).catch((err) => { console.error(err.message); process.exit(1); });