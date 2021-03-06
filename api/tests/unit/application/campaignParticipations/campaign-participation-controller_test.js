const { sinon, expect, domainBuilder, hFake } = require('../../../test-helper');

const campaignParticipationController = require('../../../../lib/application/campaignParticipations/campaign-participation-controller');
const { NotFoundError } = require('../../../../lib/domain/errors');
const serializer = require('../../../../lib/infrastructure/serializers/jsonapi/campaign-participation-serializer');
const tokenService = require('../../../../lib/domain/services/token-service');
const usecases = require('../../../../lib/domain/usecases');
const queryParamsUtils = require('../../../../lib/infrastructure/utils/query-params-utils');

describe('Unit | Application | Controller | Campaign-Participation', () => {

  describe('#getCampaignParticipationByAssessment', () => {
    let sandbox;
    const resultFilter = {
      assessmentId: 4,
    };

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(queryParamsUtils, 'extractFilters').resolves(resultFilter);
      sandbox.stub(usecases, 'findCampaignParticipationsByAssessmentId');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call the usecases to get the campaign participations of the given assessmentId', async () => {
      const request = {
        headers: {
          authorization: 'token'
        },
      };
      usecases.findCampaignParticipationsByAssessmentId.resolves();

      // when
      await campaignParticipationController.getCampaignParticipationByAssessment(request, hFake);

      // then
      expect(usecases.findCampaignParticipationsByAssessmentId).to.have.been.calledOnce;
      const findCampaignParticipations = usecases.findCampaignParticipationsByAssessmentId.firstCall.args[0];
      expect(findCampaignParticipations).to.have.property('assessmentId');
    });
  });

  describe('#shareCampaignResult', () => {
    let sandbox;
    const userId = 1;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      sandbox.stub(usecases, 'shareCampaignResult');
      sandbox.stub(tokenService, 'extractTokenFromAuthChain').resolves();
      sandbox.stub(tokenService, 'extractUserId').resolves(userId);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call the use case to share campaign result', async () => {
      // given
      const request = {
        params: {
          id: '5'
        },
        headers: {
          authorization: 'token'
        },
      };
      usecases.shareCampaignResult.resolves();

      // when
      await campaignParticipationController.shareCampaignResult(request, hFake);

      // then
      expect(usecases.shareCampaignResult).to.have.been.calledOnce;
      const updateCampaignParticiaption = usecases.shareCampaignResult.firstCall.args[0];
      expect(updateCampaignParticiaption).to.have.property('campaignParticipationId');
      expect(updateCampaignParticiaption).to.have.property('userId');
      expect(updateCampaignParticiaption).to.have.property('campaignParticipationRepository');
    });

    context('when the request is invalid', () => {

      it('should return a 400 status code', async () => {
        // given
        const paramsWithMissingAssessmentId = {};
        const request = {
          params: paramsWithMissingAssessmentId,
          headers: {
            authorization: 'token'
          },
        };

        // when
        const response = await campaignParticipationController.shareCampaignResult(request, hFake);

        // then
        expect(response.statusCode).to.equal(400);
        expect(response.source).to.deep.equal({
          errors: [{
            detail: 'campaignParticipationId manquant',
            code: '400',
            title: 'Bad Request',
          }]
        });
      });

      it('should return a 404 status code if the participation is not found', async () => {
        // given
        const nonExistingAssessmentId = 1789;
        const request = {
          params: {
            id: nonExistingAssessmentId,
          },
          headers: {
            authorization: 'token'
          },
        };
        usecases.shareCampaignResult.rejects(new NotFoundError());

        // when
        const response = await campaignParticipationController.shareCampaignResult(request, hFake);

        // then
        expect(response.statusCode).to.equal(404);
        expect(response.source).to.deep.equal({
          errors: [{
            detail: 'Participation non trouvée',
            code: '404',
            title: 'Not Found',
          }]
        });
      });
    });

    context('when the request comes from a different user', () => {

      it('should return a 403 status code', async () => {
        // given
        const request = {
          params: {
            id: '5'
          },
          headers: {
            authorization: 'token'
          },
        };
        usecases.shareCampaignResult.resolves();

        // when
        await campaignParticipationController.shareCampaignResult(request, hFake);

        // then
        expect(usecases.shareCampaignResult).to.have.been.calledOnce;
        const updateCampaignParticiaption = usecases.shareCampaignResult.firstCall.args[0];
        expect(updateCampaignParticiaption).to.have.property('campaignParticipationId');
        expect(updateCampaignParticiaption).to.have.property('userId');
        expect(updateCampaignParticiaption).to.have.property('campaignParticipationRepository');
      });
    });
  });

  describe('#save', () => {
    let sandbox;
    let request;
    const campaignId = 123456;
    const participantExternalId = 'azer@ty.com';
    const userId = 6;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(usecases, 'startCampaignParticipation');
      sandbox.stub(serializer, 'serialize');
      request = {
        headers: { authorization: 'token' },
        auth: { credentials: { userId } },
        payload: {
          data: {
            type: 'campaign-participations',
            attributes: {
              'participant-external-id': participantExternalId,
            },
            relationships: {
              'campaign': {
                data: {
                  id: campaignId,
                  type: 'campaigns',
                }
              }
            }
          }
        }
      };
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call the usecases to start the campaign participation', async () => {
      // given
      usecases.startCampaignParticipation.resolves();

      // when
      await campaignParticipationController.save(request, hFake);

      // then
      expect(usecases.startCampaignParticipation).to.have.been.calledOnce;

      const args = usecases.startCampaignParticipation.firstCall.args[0];

      expect(args.userId).to.equal(userId);

      const campaignParticipation = args.campaignParticipation;
      expect(campaignParticipation).to.have.property('campaignId', campaignId);
      expect(campaignParticipation).to.have.property('participantExternalId', participantExternalId);
    });

    it('should return the serialized campaign participation when it has been successfully created', async () => {
      // given
      const createdCampaignParticipation = domainBuilder.buildCampaignParticipation();
      usecases.startCampaignParticipation.resolves(createdCampaignParticipation);

      const serializedCampaignParticipation = { id: 88, assessmentId: 12 };
      serializer.serialize.returns(serializedCampaignParticipation);

      // when
      const response = await campaignParticipationController.save(request, hFake);

      // then
      expect(serializer.serialize).to.have.been.calledWith(createdCampaignParticipation);
      expect(response.statusCode).to.equal(201);
      expect(response.source).to.deep.equal(serializedCampaignParticipation);
    });
  });

});
