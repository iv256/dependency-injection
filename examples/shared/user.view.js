export class UserView {
  constructor({ user }) {
    this.user = user;
  }

  render() {
    return `User: ${this.user.name}`;
  }
}
