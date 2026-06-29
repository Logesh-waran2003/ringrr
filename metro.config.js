const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Support src/ directory structure
config.watchFolders = [__dirname]

module.exports = config
