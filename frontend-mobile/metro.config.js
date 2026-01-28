const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// បន្ថែម cjs ទៅក្នុង sourceExts ដើម្បីឱ្យវាស្គាល់ library មួយចំនួន
config.resolver.sourceExts.push('cjs');

module.exports = config;