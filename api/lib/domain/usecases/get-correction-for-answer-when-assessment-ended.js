const { NotCompletedAssessmentError } = require('../errors');

module.exports = function({
  assessmentRepository,
  answerRepository,
  correctionRepository,
  answerId
} = {}) {
  let answer;
  return answerRepository.get(answerId)
    .then((answerFromRepo) => {
      answer = answerFromRepo;
    })
    .then(() => assessmentRepository.get(answer.assessmentId))
    .then(_validateAssessmentIsCompleted)
    .then(() => correctionRepository.getByChallengeId(answer.challengeId));
};

function _validateAssessmentIsCompleted(assessment) {
  if (!assessment.isCompleted()) {
    throw new NotCompletedAssessmentError();
  }
}