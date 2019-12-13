module.exports = api => {
  api.cache(true);
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: '> 0.25%, not dead',
        },
      ],
    ],
  };
};
