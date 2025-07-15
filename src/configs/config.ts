import * as process from 'process';

export default () => ({
  base: {
    name: 'base',
    url: process.env.BASE_NODE_URL,
  },
  thegraph: {
    url: process.env.THEGRAPH_URL,
    token: process.env.THEGRAPH_TOKEN,
  },
  statisticSyncInterval: parseInt(process.env.STATISTIC_SYNC_INTERVAL),
  startSyncBlock: parseInt(process.env.START_SYNC_BLOCK),
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});
