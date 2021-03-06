const { expect, sinon, domainBuilder } = require('../../../test-helper');

const Assessment = require('../../../../lib/domain/models/Assessment');
const usecases = require('../../../../lib/domain/usecases');
const { NotFoundError } = require('../../../../lib/domain/errors');

describe('Unit | UseCase | start-campaign-participation', () => {

  let sandbox;
  const userId = 19837482;
  const campaignParticipation = domainBuilder.buildCampaignParticipation({});
  const campaignRepository = { get: () => undefined };
  const campaignParticipationRepository = { save: () => undefined };
  const assessmentRepository = { save: () => undefined };

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(campaignRepository, 'get');
    sandbox.stub(campaignParticipationRepository, 'save');
    sandbox.stub(assessmentRepository, 'save');

    campaignRepository.get.resolves(domainBuilder.buildCampaign());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should throw an error if the campaign does not exists', () => {
    // given
    campaignRepository.get.resolves(null);

    // when
    const promise = usecases.startCampaignParticipation({ campaignParticipation, userId, campaignParticipationRepository, assessmentRepository, campaignRepository });

    // then
    return expect(promise).to.be.rejectedWith(NotFoundError);
  });

  it('should create a smart placement assessment', () => {
    // given
    assessmentRepository.save.resolves({});

    // when
    const promise = usecases.startCampaignParticipation({ campaignParticipation, userId, campaignParticipationRepository, assessmentRepository, campaignRepository });

    // then
    return promise.then(() => {
      expect(assessmentRepository.save).to.have.been.called;

      const assessmentToSave = assessmentRepository.save.firstCall.args[0];
      expect(assessmentToSave.type).to.equal(Assessment.types.SMARTPLACEMENT);
      expect(assessmentToSave.state).to.equal(Assessment.states.STARTED);
      expect(assessmentToSave.userId).to.equal(userId);
      expect(assessmentToSave.courseId).to.equal('Smart Placement Tests CourseId Not Used');
    });
  });

  it('should save the campaign participation with userId and assessmentId', () => {
    // given
    const assessmentId = 987654321;
    assessmentRepository.save.resolves({ id: assessmentId });
    campaignParticipationRepository.save.resolves({});

    // when
    const promise = usecases.startCampaignParticipation({ campaignParticipation, userId, campaignParticipationRepository, assessmentRepository, campaignRepository });

    // then
    return promise.then(() => {
      expect(campaignParticipationRepository.save).to.have.been.called;

      const campaignParticipationToSave = campaignParticipationRepository.save.firstCall.args[0];
      expect(campaignParticipationToSave.userId).to.equal(userId);
      expect(campaignParticipationToSave.assessmentId).to.equal(assessmentId);
      expect(campaignParticipationToSave).to.deep.equal(campaignParticipation);
    });
  });

  it('should return the saved campaign participation', () => {
    // given
    const assessmentId = 987654321;
    const createdCampaignParticipation = domainBuilder.buildCampaignParticipation();
    assessmentRepository.save.resolves({ id: assessmentId });
    campaignParticipationRepository.save.resolves(createdCampaignParticipation);

    // when
    const promise = usecases.startCampaignParticipation({ campaignParticipation, userId, campaignParticipationRepository, assessmentRepository, campaignRepository });

    // then
    return promise.then((campaignParticipation) => {
      expect(campaignParticipation).to.deep.equal(createdCampaignParticipation);
    });
  });

});
