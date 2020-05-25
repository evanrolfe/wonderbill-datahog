const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(require('chai-as-promised'));

global.expect = expect;
global.sinon = sinon;
