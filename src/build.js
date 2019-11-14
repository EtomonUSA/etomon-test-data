(async () => {
    await require('./build-emperors')();
    await require('./build-states')();
})();