const { expect, sinon } = require('../../../test-helper');
const Hapi = require('hapi');
const assessmentController = require('../../../../lib/application/assessments/assessment-controller');
const assessmentAuthorization = require('../../../../lib/application/preHandlers/assessment-authorization');
const securityController = require('../../../../lib/interfaces/controllers/security-controller');

describe('Integration | Route | AssessmentRoute', () => {

  let sandbox;
  let server;

  function _expectRouteToExist(routeOptions) {
    // when
    const promise = server.inject(routeOptions);

    // then
    return promise.then((res) => {
      expect(res.statusCode).to.equal(200);
    });
  }

  beforeEach(() => {
    // stub dependencies
    sandbox = sinon.sandbox.create();
    sandbox.stub(assessmentController, 'save');
    sandbox.stub(assessmentController, 'getNextChallenge');
    sandbox.stub(assessmentController, 'findByFilters');
    sandbox.stub(assessmentController, 'get');
    sandbox.stub(assessmentAuthorization, 'verify');
    sandbox.stub(securityController, 'checkUserHasRolePixMaster');

    // instance server
    server = this.server = Hapi.server();

    return server.register(require('../../../../lib/application/assessments'));
  });

  afterEach(() => {
    sandbox.restore();
    server.stop();
  });

  describe('POST /api/assessments', () => {

    beforeEach(() => {
      assessmentController.save.returns('ok');
    });

    it('should exist', () => {
      return _expectRouteToExist({ method: 'POST', url: '/api/assessments' });
    });
  });

  describe('GET /api/assessments/assessment_id/next', () => {

    beforeEach(() => {
      assessmentController.getNextChallenge.returns('ok');
    });

    it('should exist', () => {
      return _expectRouteToExist({ method: 'GET', url: '/api/assessments/assessment_id/next' });
    });
  });

  describe('GET /api/assessments/assessment_id/next/challenge_id', () => {

    beforeEach(() => {
      assessmentController.getNextChallenge.returns('ok');
    });

    it('should exist', () => {
      return _expectRouteToExist({ method: 'GET', url: '/api/assessments/assessment_id/next/challenge_id' });
    });
  });

  describe('GET /api/assessments', () => {

    beforeEach(() => {
      assessmentController.findByFilters.returns('ok');
    });

    it('should exist', () => {
      return _expectRouteToExist({ method: 'GET', url: '/api/assessments' });
    });
  });

  describe('GET /api/assessments/{id}', () => {

    let options;

    beforeEach(() => {
      options = {
        method: 'GET',
        url: '/api/assessments/assessment_id'
      };

      assessmentController.get.returns('ok');
      assessmentAuthorization.verify.returns('userId');
    });

    it('should exist', () => {
      return _expectRouteToExist(options);
    });

    it('should call pre-handler', () => {
      // when
      const promise = server.inject(options);

      // then
      return promise.then(() => {
        sinon.assert.called(assessmentAuthorization.verify);
      });
    });
  });
});
