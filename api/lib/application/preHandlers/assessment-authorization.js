const tokenService = require('../../../lib/domain/services/token-service');
const assessmentRepository = require('../../infrastructure/repositories/assessment-repository');
const validationErrorSerializer = require('../../infrastructure/serializers/jsonapi/validation-error-serializer');

module.exports = {
  verify(request, h) {
    // FIXME: This validation should be part of the use case, as it is a rule of business
    const token = tokenService.extractTokenFromAuthChain(request.headers.authorization);
    const userId = tokenService.extractUserId(token);
    const assessmentId = request.params.id;

    return assessmentRepository
      .getByUserIdAndAssessmentId(assessmentId, userId)
      .catch(() => {
        const buildedError = _handleWhenInvalidAuthorization('Vous n’êtes pas autorisé à accéder à cette évaluation');
        return h.response(validationErrorSerializer.serialize(buildedError)).code(401).takeover();
      });
  }
};

function _handleWhenInvalidAuthorization(errorMessage) {
  return {
    data: {
      authorization: [errorMessage]
    }
  };
}
