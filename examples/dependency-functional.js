import { createContainer } from '../src/index.js';

console.log('Example: functional dependency');

const di = createContainer();

// A dependency may return executable logic.
di.define('format.user.name', [], () => {
  console.log('Factory executed: format.user.name');

  return (user) => {
    return user.name.toUpperCase();
  };
});

di.define('create.profile.title', [
  'format.user.name',
], (formatUserName) => {
  console.log('Factory executed: create.profile.title');

  return (user) => {
    return `Profile: ${formatUserName(user)}`;
  };
});

const createProfileTitle = await di.get(
  'create.profile.title'
);

const title = createProfileTitle({
  name: 'John Smith',
});

console.log(title);
