const Assessment = require('../../domain/models/Assessment');
const BookshelfAssessment = require('../../infrastructure/data/assessment');
const SmartPlacementAnswer = require('../../domain/models/SmartPlacementAnswer');
const SmartPlacementAssessment = require('../../domain/models/SmartPlacementAssessment');
const SmartPlacementKnowledgeElement = require('../../domain/models/SmartPlacementKnowledgeElement');
// To delete once target-profile table is created
const targetProfileRepository = require('./target-profile-repository');
const { NotFoundError } = require('../../domain/errors');

module.exports = {

  get(assessmentId) {
    return BookshelfAssessment
      .where({ id: assessmentId })
      .fetch({
        require: true,
        withRelated: [
          'answers',
          'knowledgeElements',
          'campaignParticipation',
          'campaignParticipation.campaign',
        ],
      })
      .then(checkIsSmartPlacement)
      .then(toDomain)
      .catch(mapNotFoundErrorToDomainError(assessmentId));
  },
};

function checkIsSmartPlacement(bookshelfAssessment) {
  if (bookshelfAssessment.get('type') !== Assessment.types.SMARTPLACEMENT) {
    throw new NotFoundError(`Not found Smart Placement Assessment for ID ${bookshelfAssessment.get('id')}`);
  } else {
    return bookshelfAssessment;
  }
}

function toDomain(bookshelfAssessment) {

  // A repository should not call another repository.
  // use Bookshelf as datasource
  // Target-profiles table has been added
  // waiting for link beetween assessment and target-profile
  // in order to find associated target-profile before toDomain() and do only mapping in toDomain()
  const targetProfileId = bookshelfAssessment.related('campaignParticipation').related('campaign').get('targetProfileId');
  return targetProfileRepository.get(targetProfileId)
    .then((targetProfile) => {

      const answers = bookshelfAssessment
        .related('answers')
        .map((bookshelfAnswer) => {
          return new SmartPlacementAnswer({
            id: bookshelfAnswer.get('id'),
            result: bookshelfAnswer.get('result'),
            challengeId: bookshelfAnswer.get('challengeId'),
          });
        });

      const knowledgeElements = bookshelfAssessment
        .related('knowledgeElements')
        .map((bookshelfKnowledgeElement) => {
          return new SmartPlacementKnowledgeElement({
            id: bookshelfKnowledgeElement.get('id'),
            source: bookshelfKnowledgeElement.get('source'),
            status: bookshelfKnowledgeElement.get('status'),
            pixScore: bookshelfKnowledgeElement.get('pixScore'),
            answerId: bookshelfKnowledgeElement.get('answerId'),
            assessmentId: bookshelfKnowledgeElement.get('assessmentId'),
            skillId: bookshelfKnowledgeElement.get('skillId'),
          });
        });

      return new SmartPlacementAssessment({
        id: bookshelfAssessment.get('id'),
        createdAt: bookshelfAssessment.get('createdAt'),
        state: bookshelfAssessment.get('state'),
        userId: bookshelfAssessment.get('userId'),
        answers,
        knowledgeElements,
        targetProfile,
      });
    });
}

function mapNotFoundErrorToDomainError(assessmentId) {
  return (err) => {
    if (err instanceof BookshelfAssessment.NotFoundError) {
      throw new NotFoundError(`Not found Smart Placement Assessment for ID ${assessmentId}`);
    } else {
      throw err;
    }
  };
}