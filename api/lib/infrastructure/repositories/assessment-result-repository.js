const AssessmentResult = require('../../domain/models/AssessmentResult');
const BookshelfAssessmentResult = require('../data/assessment-result');

function _toDomain(bookshelfModel) {
  return new AssessmentResult(bookshelfModel.toJSON());
}

module.exports = {
  save: ({
    pixScore,
    level,
    status,
    emitter,
    commentForJury,
    commentForCandidate,
    commentForOrganization,
    id,
    juryId,
    assessmentId,
  }) => {
    return new BookshelfAssessmentResult({
      pixScore,
      level,
      status,
      emitter,
      commentForJury,
      commentForCandidate,
      commentForOrganization,
      id,
      juryId,
      assessmentId,
    })
      .save()
      .then(_toDomain);
  },

  get(id) {
    return BookshelfAssessmentResult
      .where('id', id)
      .fetch({ withRelated: ['competenceMarks'] })
      .then(_toDomain);
  }
};
