const _ = require('lodash');
const injectDefaults = require('../../infrastructure/utils/inject-defaults');

const dependencies = {
  answerRepository: require('../../infrastructure/repositories/answer-repository'),
  assessmentRepository: require('../../infrastructure/repositories/assessment-repository'),
  assessmentResultRepository: require('../../infrastructure/repositories/assessment-result-repository'),
  assessmentService: require('../../domain/services/assessment-service'),
  campaignParticipationRepository: require('../../infrastructure/repositories/campaign-participation-repository'),
  campaignRepository: require('../../infrastructure/repositories/campaign-repository'),
  certificationChallengeRepository: require('../../infrastructure/repositories/certification-challenge-repository'),
  certificationCourseRepository: require('../../infrastructure/repositories/certification-course-repository'),
  certificationRepository: require('../../infrastructure/repositories/certification-repository'),
  challengeRepository: require('../../infrastructure/repositories/challenge-repository'),
  competenceMarkRepository: require('../../infrastructure/repositories/competence-mark-repository'),
  competenceRepository: require('../../infrastructure/repositories/competence-repository'),
  competenceTreeRepository: require('../../infrastructure/repositories/competence-tree-repository'),
  correctionRepository: require('../../infrastructure/repositories/correction-repository'),
  courseRepository: require('../../infrastructure/repositories/course-repository'),
  encryptionService: require('../../domain/services/encryption-service'),
  mailService: require('../../domain/services/mail-service'),
  organizationRepository: require('../../infrastructure/repositories/organization-repository'),
  reCaptchaValidator: require('../../infrastructure/validators/grecaptcha-validator'),
  skillRepository: require('../../infrastructure/repositories/skill-repository'),
  skillsService: require('../../domain/services/skills-service'),
  smartPlacementAssessmentRepository: require('../../infrastructure/repositories/smart-placement-assessment-repository'),
  smartPlacementKnowledgeElementRepository: require('../../infrastructure/repositories/smart-placement-knowledge-element-repository'),
  targetProfileRepository: require('../../infrastructure/repositories/target-profile-repository'),
  tokenService: require('../../domain/services/token-service'),
  userRepository: require('../../infrastructure/repositories/user-repository'),
};

function injectDependencies(usecases) {
  return _.mapValues(usecases, _.partial(injectDefaults, dependencies));
}

module.exports = injectDependencies({
  authenticateUser: require('./authenticate-user'),
  correctAnswerThenUpdateAssessment: require('./correct-answer-then-update-assessment'),
  createCampaign: require('./create-campaign'),
  createAssessmentResultForCompletedCertification: require('./create-assessment-result-for-completed-certification'),
  createAssessmentForCampaign: require('./create-assessment-for-campaign'),
  createUser: require('./create-user'),
  findAvailableTargetProfiles: require('./find-available-target-profiles'),
  findCampaignParticipationsByAssessmentId: require('./find-campaign-participations-by-assessmentId'),
  findCompletedUserCertifications: require('./find-completed-user-certifications'),
  findUserAssessmentsByFilters: require('./find-user-assessments-by-filters'),
  getCorrectionForAnswerWhenAssessmentEnded: require('./get-correction-for-answer-when-assessment-ended'),
  getNextChallengeForCertification: require('./get-next-challenge-for-certification'),
  getNextChallengeForDemo: require('./get-next-challenge-for-demo'),
  getNextChallengeForPlacement: require('./get-next-challenge-for-placement'),
  getNextChallengeForPreview: require('./get-next-challenge-for-preview'),
  getNextChallengeForSmartPlacement: require('./get-next-challenge-for-smart-placement'),
  getResultsCampaignInCSVFormat: require('./get-results-campaign-in-csv-format'),
  getOrganizationCampaigns: require('./get-organization-campaigns'),
  getSkillReview: require('./get-skill-review'),
  getUserCertification: require('./get-user-certification'),
  getUserCertificationWithResultTree: require('./get-user-certification-with-result-tree'),
  getUserWithOrganizationAccesses: require('./get-user-with-organization-accesses'),
  preloadCacheEntries: require('./preload-cache-entries'),
  removeAllCacheEntries: require('./remove-all-cache-entries'),
  removeCacheEntry: require('./remove-cache-entry'),
  shareCampaignResult: require('./share-campaign-result.js'),
  updateCertification: require('./update-certification'),
});
