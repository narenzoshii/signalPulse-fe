import packageInfo from '../../package.json';

export const environment = {
  production: true,
  ADMIN_ENDPOINT: 'BACKEND_ENDPOINT',
  version: packageInfo.version,
  DATE_RANGE: 'DATE_RANGE',
};
