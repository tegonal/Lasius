/* eslint-disable license-header/header */

 
const packageJson = require('./package.json');

module.exports = {
  generateBuildId: async () => {
    const buildId = `${packageJson.version}`;
    console.info(`Current build: ${buildId}`);
    return buildId;
  },
  generateBuildIdSync: () => {
    const buildId = `${packageJson.version}`;
    console.info(`Current build: ${buildId}`);
    return buildId;
  },
};
