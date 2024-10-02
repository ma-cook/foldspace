import { resolve as _resolve } from 'path';

export const module = {
  rules: [
    {
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    },
    // Other rules...
  ],
};
export const resolve = {
  extensions: ['.js', '.jsx'],
};
export const output = {
  path: _resolve(__dirname, 'dist'),
  filename: 'bundle.js',
};
