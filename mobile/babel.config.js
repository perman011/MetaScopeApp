module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './',
            '@api': './api',
            '@components': './components',
            '@screens': './screens',
            '@navigation': './navigation',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};