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

global.Audio = window.Audio
global.requestAnimationFrame = window.requestAnimationFrame
global.expect = chai.expect
global.sinon = sinon
