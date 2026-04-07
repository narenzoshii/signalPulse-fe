import packageInfo from '../../package.json';

export const environment = {
  production: false,
  ADMIN_ENDPOINT: 'http://localhost:9090/',
  version: packageInfo.version,
  DATE_RANGE: 'DATE_RANGE',
};
