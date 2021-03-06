const { expect, sinon } = require('../../../test-helper');
const Hapi = require('hapi');
const securityController = require('../../../../lib/interfaces/controllers/security-controller');
const organisationController = require('../../../../lib/application/organizations/organization-controller');

describe('Integration | Application | Organizations | Routes', () => {

  let server;

  beforeEach(() => {
    server = Hapi.server();
    return server.register(require('../../../../lib/application/organizations/index'));
  });

  describe('POST /api/organizations', (_) => {

    before(() => {
      sinon.stub(securityController, 'checkUserHasRolePixMaster').callsFake((request, h) => h.response(true));
      sinon.stub(organisationController, 'create').returns('ok');
    });

    after(() => {
      securityController.checkUserHasRolePixMaster.restore();
      organisationController.create.restore();
    });

    it('should exist', () => {
      return server.inject({ method: 'POST', url: '/api/organizations' }).then((res) => {
        expect(res.statusCode).to.equal(200);
      });
    });
  });

  describe('GET /api/organizations', (_) => {

    before(() => {
      sinon.stub(organisationController, 'search').returns('ok');
    });

    after(() => {
      organisationController.search.restore();
    });

    it('should exist', () => {
      server.inject({ method: 'GET', url: '/api/organizations' }).then((res) => {
        expect(res.statusCode).to.equal(200);
      });
    });
  });

  describe('GET /api/organizations/:id/snapshots', (_) => {

    before(() => {
      sinon.stub(organisationController, 'getSharedProfiles').returns('ok');
    });

    after(() => {
      organisationController.getSharedProfiles.restore();
    });

    it('should exist', () => {
      server.inject({ method: 'GET', url: '/api/organizations/:id/snapshots' }).then((res) => {
        expect(res.statusCode).to.equal(200);
      });
    });
  });

  describe('GET /api/organizations/:id/campaigns', () => {

    before(() => {
      sinon.stub(organisationController, 'getCampaigns').returns('ok');
    });

    after(() => {
      organisationController.getCampaigns.restore();
    });

    it('should call the organization controller to get the campaigns', () => {
      // when
      const promise = server.inject({ method: 'GET', url: '/api/organizations/:id/campaigns' });

      // then
      return promise.then((resp) => {
        expect(resp.statusCode).to.equal(200);
        expect(organisationController.getCampaigns).to.have.been.calledOnce;
      });
    });
  });
});
