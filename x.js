(async () => {
  let { people, places } = require('@etomon/etomon-test-data');
  let _ = require('lodash');

  console.log('person', await people[0]);
  console.log('places', await places[0]);

  // For a random one use lodash.sample or chance.shuffle
  console.log('random person', await _.sample(people))
  console.log('random place', await _.sample(places))
})();
