import packageInfo from '../../package.json';

export const environment = {
  production: false,
  ADMIN_ENDPOINT: 'http://test-api.signalpulse.com/',
  version: packageInfo.version,
  DATE_RANGE: 'DATE_RANGE',
};
