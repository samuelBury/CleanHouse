// Plugin Expo pour configurer App Transport Security
const { withInfoPlist } = require('@expo/config-plugins');

const withATS = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
      NSAllowsArbitraryLoadsForMedia: true,
      NSAllowsArbitraryLoadsInWebContent: true,
      NSExceptionDomains: {
        'railway.app': {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSExceptionMinimumTLSVersion: 'TLSv1.2',
          NSExceptionRequiresForwardSecrecy: false,
        },
        'up.railway.app': {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSExceptionMinimumTLSVersion: 'TLSv1.2',
          NSExceptionRequiresForwardSecrecy: false,
        },
      },
    };
    return config;
  });
};

module.exports = withATS;
