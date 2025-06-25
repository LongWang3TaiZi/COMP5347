module.exports = {
    presets: [
      '@babel/preset-env', // This handles the latest JavaScript syntax
      ['@babel/preset-react', {runtime: 'automatic'}] // This specifically handles React JSX
    ]
  };