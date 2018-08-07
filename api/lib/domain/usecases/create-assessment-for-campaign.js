const { CampaignCodeError } = require('../errors');
const CampaignParticipation = require('../models/CampaignParticipation');
const Assessment = require('../models/Assessment');

function _getCampaignFromCode(codeCampaign, campaignRepository) {
  return campaignRepository.getByCode(codeCampaign)
    .then((campaign) => {
      if(campaign) {
        return Promise.resolve(campaign);
      }

      return Promise.reject(new CampaignCodeError());
    });
}

module.exports = function createAssessmentForCampaign(
  {
    assessment,
    codeCampaign,
    assessmentRepository,
    campaignRepository,
    campaignParticipationRepository
  }) {

  let assessmentCreated;
  let campaign;
  assessment.state = Assessment.states.STARTED;

  return _getCampaignFromCode(codeCampaign, campaignRepository)
    .then((campaignFound) => {
      campaign = campaignFound;
      assessment.courseId = 'Smart Placement Tests CourseId Not Used';
      return assessmentRepository.save(assessment);
    })
    .then((assessmentCreatedInDb) => {
      assessmentCreated = assessmentCreatedInDb;
      const campaignParticipation = new CampaignParticipation({
        assessmentId: assessmentCreated.id,
        campaign: campaign,
      });
      return campaignParticipationRepository.save(campaignParticipation);
    })
    .then(() => {
      return assessmentCreated;
    });
};
