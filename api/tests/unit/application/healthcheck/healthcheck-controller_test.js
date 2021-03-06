const { expect, sinon, hFake } = require('../../../test-helper');
const healthcheckRepository = require('../../../../lib/infrastructure/repositories/healthcheck-repository');

const healthcheckController = require('../../../../lib/application/healthcheck/healthcheck-controller');

describe('Unit | Controller | healthcheckController', () => {

  describe('#get', () => {
    it('should reply with the API description', async function() {
      // when
      const response = await healthcheckController.get(null, hFake);

      // then
      expect(response).to.include.keys('name', 'version', 'description');
      expect(response['name']).to.equal('pix-api');
      expect(response['description']).to.equal('Plateforme d\'évaluation et de certification des compétences numériques à l\'usage de tous les citoyens francophones');
      expect(response['environment']).to.equal('test');
    });
  });

  describe('#getDbStatus', () => {

    beforeEach(() => {
      sinon.stub(healthcheckRepository, 'check');
    });

    afterEach(() => {
      healthcheckRepository.check.restore();
    });

    it('should check if DB connection is successful', async () => {
      // given
      healthcheckRepository.check.resolves();

      // when
      const response = await healthcheckController.getDbStatus();

      // then
      expect(response).to.include.keys('message');
      expect(response['message']).to.equal('Connection to database ok');
    });

    it('should reply with a 503 error when the connection with the database is KO', async () => {
      // given
      healthcheckRepository.check.rejects();

      // when
      const promise = healthcheckController.getDbStatus(null, hFake);

      // then
      expect(promise).to.be.rejectedWith(/Connection to database failed/);
    });
  });
});
