import { User } from './user.js';

export class UserService {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  async getUser(userId) {
    const response = await this.apiClient.get(
      `/users/${userId}`
    );

    return new User(response);
  }
}
