const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Windows'ta @react-native-async-storage codegen geçici klasörü
// oluşturulup hemen siliniyor; Metro izlemeye çalışınca ENOENT hatası veriyor.
config.resolver.blockList = [
  /node_modules\/@react-native-async-storage\/\.async-storage-.+\//,
];

module.exports = config;
