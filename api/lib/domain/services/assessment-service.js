const courseRepository = require('../../infrastructure/repositories/course-repository');
const certificationCourseRepository = require('../../infrastructure/repositories/certification-course-repository');
const answerRepository = require('../../infrastructure/repositories/answer-repository');
const assessmentRepository = require('../../infrastructure/repositories/assessment-repository');
const certificationChallengeRepository = require('../../infrastructure/repositories/certification-challenge-repository');
const challengeRepository = require('../../infrastructure/repositories/challenge-repository');
const skillRepository = require('../../infrastructure/repositories/skill-repository');
const competenceRepository = require('../../infrastructure/repositories/competence-repository');
const assessmentAdapter = require('../../infrastructure/adapters/assessment-adapter');
const answerService = require('../services/answer-service');
const assessmentUtils = require('./assessment-service-utils');
const _ = require('../../infrastructure/utils/lodash-utils');

const Course = require('../models/Course');

const { NotFoundError, AssessmentEndedError } = require('../../domain/errors');

function _selectNextInAdaptiveMode(assessment, course) {

  let answers, challenges, competence;

  return answerRepository.findByAssessment(assessment.id)
    .then(fetchedAnswers => (answers = fetchedAnswers))
    .then(() => competenceRepository.get(course.competences[0]))
    .then((fetchedCompetence) => (competence = fetchedCompetence))
    .then(() => challengeRepository.findByCompetence(competence))
    .then(fetchedChallenges => (challenges = fetchedChallenges))
    .then(() => skillRepository.findByCompetence(competence))
    .then(skills => assessmentUtils.getNextChallengeInAdaptiveCourse(answers, challenges, skills));
}

function _selectNextInNormalMode(currentChallengeId, challenges) {

  /*
   * example : - if challenges is ["1st_challenge", "2nd_challenge", "3rd_challenge", "4th_challenge"]
   *           - and currentChallengeId is "2nd_challenge"
   *
   *           nextChallengeId will be "3rd_challenge"
   */
  const nextChallengeId = _(challenges).elementAfter(currentChallengeId).value();
  return _.defaultTo(nextChallengeId, null); // result MUST be null if not found

}

function _selectNextChallengeId(course, currentChallengeId, assessment) {

  const challenges = course.challenges;

  if (course.isAdaptive) {
    return Promise.resolve(_selectNextInAdaptiveMode(assessment, course));
  }

  if (!currentChallengeId) { // no currentChallengeId means the test has not yet started
    return Promise.resolve(challenges[0]);
  }

  return Promise.resolve(_selectNextInNormalMode(currentChallengeId, challenges));
}

function getAssessmentNextChallengeId(assessment, currentChallengeId) {

  if (isPreviewAssessment(assessment)) {
    return Promise.reject(new AssessmentEndedError());
  }

  const courseId = assessment.courseId;

  return courseRepository.get(courseId)
    .then(course => _selectNextChallengeId(course, currentChallengeId, assessment))
    .then((nextChallenge) => {
      if (nextChallenge) {
        return nextChallenge;
      }

      throw new AssessmentEndedError();
    });
}

async function fetchAssessment(assessmentId) {

  const [assessmentPix, answers] = await Promise.all([
    assessmentRepository.get(assessmentId),
    answerRepository.findByAssessment(assessmentId)
  ]);

  if (assessmentPix === null) {
    return Promise.reject(new NotFoundError(`Unable to find assessment with ID ${assessmentId}`));
  }

  assessmentPix.estimatedLevel = 0;
  assessmentPix.pixScore = 0;
  assessmentPix.successRate = answerService.getAnswersSuccessRate(answers);

  if (_isNonScoredAssessment(assessmentPix)) {
    return Promise.resolve({ assessmentPix });
  }

  return courseRepository.get(assessmentPix.courseId)
    .then((course) => {

      if (course.isAdaptive) {
        return competenceRepository
          .get(course.competences[0])
          .then(competencePix => Promise.all([
            skillRepository.findByCompetence(competencePix),
            challengeRepository.findByCompetence(competencePix)
          ]));
      }

      return null;
    })
    .then((skillsAndChallenges) => {

      let skillsReport;

      if (skillsAndChallenges) {
        const [skills, challengesPix] = skillsAndChallenges;
        const catAssessment = assessmentAdapter.getAdaptedAssessment(answers, challengesPix, skills);

        skillsReport = {
          assessmentId,
          validatedSkills: catAssessment.validatedSkills,
          failedSkills: catAssessment.failedSkills
        };

        assessmentPix.estimatedLevel = catAssessment.obtainedLevel;
        assessmentPix.pixScore = catAssessment.displayedPixScore;
      }

      return Promise.resolve({ assessmentPix, skills: skillsReport });
    });
}

function findByFilters(filters) {
  return assessmentRepository.findByFilters(filters)
    .then((assessments) => {
      const assessmentsWithAssociatedCourse = assessments.map((assessment) => {
        // TODO REFACTO DE LA MAGIC STRING
        if (assessment.type === 'CERTIFICATION') {
          return certificationCourseRepository.get(assessment.courseId)
            .then((certificationCourse) => {
              assessment.course = new Course(certificationCourse);
              return assessment;
            });
        } else {
          return Promise.resolve(assessment);
        }
      });
      return Promise.all(assessmentsWithAssociatedCourse);
    });
}

function _isNonScoredAssessment(assessment) {
  return isPreviewAssessment(assessment) || isCertificationAssessment(assessment);
}

function isPreviewAssessment(assessment) {
  return _.startsWith(assessment.courseId, 'null');
}

function isDemoAssessment(assessment) {
  return assessment.type === 'DEMO';
}

function isCertificationAssessment(assessment) {
  return assessment.type === 'CERTIFICATION';
}

function isPlacementAssessment(assessment) {
  return assessment.type === 'PLACEMENT';
}

function isAssessmentCompleted(assessment) {
  if (_.isNil(assessment.estimatedLevel) || _.isNil(assessment.pixScore)) {
    return false;
  }

  return true;
}

function getNextChallengeForCertificationCourse(assessment) {
  return certificationChallengeRepository.getNonAnsweredChallengeByCourseId(
    assessment.id, assessment.courseId
  );
}

module.exports = {
  getAssessmentNextChallengeId,
  getNextChallengeForCertificationCourse,
  fetchAssessment,
  isAssessmentCompleted,
  findByFilters,
  isPreviewAssessment,
  isPlacementAssessment,
  isDemoAssessment,
  isCertificationAssessment
};