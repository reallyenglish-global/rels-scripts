const jsdom = require('jsdom-global')
const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

jsdom('', {
  url: 'https://localhost',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
  resources: 'usable',
})

if (typeof global !== 'undefined') {
  global.Audio = window.Audio
  global.requestAnimationFrame = window.requestAnimationFrame
  global.expect = chai.expect
  global.sinon = sinon
}

if (typeof window !== 'undefined') {
  window.expect = chai.expect
  window.sinon = sinon
}
