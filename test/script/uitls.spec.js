import * as _ from '../../src/utils'

describe('utils method', () => {
  it('real path', () => {
    const cfg = {
      envDir: '/',
      envPath: '/test.js',
    }
    const a = _.realPath('./dev//a.js', cfg, {})
    const b = _.realPath('./dev//../test/file.a.js', cfg, {})
    const c = _.realPath('@A/a.json', cfg, {
      exname: '.grs',
      alias: { A: 'dev' }
    })
    const d = _.realPath('@A', cfg, {
      exname: '.grs',
      alias: { A: 'dev' },
    })
    expect(a.exname).toBe('.js')
    expect(a.path).toBe('/dev/a.js')
    expect(b.exname).toBe('.js')
    expect(b.path).toBe('/test/file.a.js')
    expect(c.exname).toBe('.json')
    expect(c.path).toBe('/dev/a.json')
    expect(d.exname).toBe('.grs')
    expect(d.path).toBe('/dev.grs')
  })

  it('parent config', () => {
    const res = _.getParentConfig('/', 'http://xx/dev/test/a.js')
    expect(res.envPath).toBe('/')
    expect(res.envDir).toBe('/dev/test')
    expect(res.dirname).toBe('http://xx/dev/test')
  })
})