export class ApiClient {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
  }

  async get(url) {
    this.logger.debug(`GET ${url}`);

    return {
      id: 1,
      name: 'John Smith',
    };
  }
}
