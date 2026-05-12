import { Photo } from './photo.js';

export class PhotoService {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  async getPhotos(userId) {
    const response = await this.apiClient.get(
      `/users/${userId}/photos`
    );

    return response.map((photo) => {
      return new Photo(photo);
    });
  }
}
