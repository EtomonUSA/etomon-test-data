(async () => {
  let Emp = require('./src/index');
  let b = await Emp.states[0];
  console.log(b);
})();

process.stdin.resume()
