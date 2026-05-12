export class UserView {
  static diKeyMap = {
    'user': 'user',
  };

  constructor({ user }) {
    this.user = user;
  }

  render() {
    return `User: ${this.user.name}`;
  }
}
