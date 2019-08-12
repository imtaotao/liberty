const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const cmd = require('rollup-plugin-commonjs')
const cleanup = require('rollup-plugin-cleanup')
const resolve = require('rollup-plugin-node-resolve')

const esm = {
  input: 'src/index.js',
  output: {
    file: `dist/liberty.esm.js`,
    format: 'es',
  }
}

const umd = {
  input: 'src/index.js',
  output: {
    file: `dist/liberty.min.js`,
    format: 'umd',
    name: 'Liberty',
  }
}

const cjs = {
  input: 'src/index.js',
  output: {
    file: `dist/liberty.common.js`,
    format: 'cjs',
  }
}

async function build (cfg) {
  const bundle = await rollup.rollup({
    input: cfg.input,
    plugins: [
      cleanup(),
      resolve(),
      babel({
        babelrc: true,
        exclude: 'node_modules/**',
      }),
      cmd(),
    ]
  })
  await bundle.generate(cfg.output)
  await bundle.write(cfg.output)
}

build(esm)
build(cjs)
build(umd)

// watch, use in dev and test
rollup.watch({
  ...umd,
  include: './src/**',
})