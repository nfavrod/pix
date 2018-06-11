class NotFoundError extends Error {
  constructor(message) {
    super(message);
  }
}

class InvaliOrganizationIdError extends Error {
  constructor(message) {
    super(message);
  }
}

class InvalidSnapshotCode extends Error {
  constructor(message) {
    super(message);
  }
}

class InvalidTokenError extends Error {
  constructor(message) {
    super(message);
  }
}

class NotElligibleToQmailError extends Error {
  constructor(message) {
    super(message);
  }
}

class PasswordNotMatching extends Error {
  constructor(message) {
    super(message);
  }
}

class AlreadyRegisteredEmailError extends Error {
  constructor(message) {
    super(message);
  }
}

class NotCompletedAssessmentError extends Error {
  constructor() {
    super('Cette évaluation n\'est pas terminée.');
  }
}

class AlreadyRatedAssessmentError extends Error {
  constructor() {
    super('Cette évaluation a déjà été évaluée.');
  }
}

class UserNotFoundError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        id: ['Ce compte est introuvable.'],
      },
    };
  }
}

class InternalError extends Error {
  constructor() {
    super();
    this.errorStack = [
      'Une erreur interne est survenue.',
    ];
  }

  getErrorMessage() {
    return {
      data: {
        error: this.errorStack,
      },
    };
  }
}

class PasswordResetDemandNotFoundError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        temporaryKey: ['Cette demande de réinitialisation n’existe pas.'],
      },
    };
  }
}

class InvalidTemporaryKeyError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        temporaryKey: ['Cette demande de réinitialisation n’est pas valide.'],
      },
    };
  }
}

class UserNotAuthorizedToCertifyError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        authorization: ['Vous n’êtes pas autorisé à passer un test de certification.'],
      },
    };
  }
}

class AssessmentEndedError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        error: ['L\'évaluation est terminée. Nous n\'avons plus de questions à vous poser.'],
      },
    };
  }
}

class WrongDateFormatError extends Error {
  constructor() {
    super();
  }

  getErrorMessage() {
    return {
      data: {
        date: ['Veuillez renseigner une date de session au format (jj/mm/yyyy).'],
      },
    };
  }
}

class ObjectValidationError extends Error {

}

class MissingOrInvalidCredentialsError extends Error {
  constructor() {
    super('Missing or invalid credentials');
  }
}

class InvalidRecaptchaTokenError extends Error {
  constructor(message) {
    super(message);
  }
}

class EntityValidationError extends Error {
  constructor({ invalidAttributes }) {
    super();
    this.invalidAttributes = invalidAttributes;
  }

  static fromJoiErrors(joiErrors) {
    const invalidAttributes = joiErrors.map((error) => {
      return { attribute: error.context.key, message: error.message };
    });
    return new EntityValidationError({ invalidAttributes });
  }

  static fromMultipleEntityValidationErrors(entityValidationErrors) {
    const invalidAttributes = entityValidationErrors.reduce(
      (invalidAttributes, entityValidationError) => {
        invalidAttributes.push(...entityValidationError.invalidAttributes);
        return invalidAttributes;
      },
      []);
    return new EntityValidationError({ invalidAttributes });
  }
}

class UserNotAuthorizedToAccessEntity extends Error {
  constructor() {
    super('User is not authorized to access ressource');
  }
}

class ForbiddenAccess extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports = {
  AlreadyRatedAssessmentError,
  AlreadyRegisteredEmailError,
  AssessmentEndedError,
  EntityValidationError,
  ForbiddenAccess,
  InternalError,
  InvalidRecaptchaTokenError,
  InvalidSnapshotCode,
  InvalidTemporaryKeyError,
  InvalidTokenError,
  InvaliOrganizationIdError,
  MissingOrInvalidCredentialsError,
  NotCompletedAssessmentError,
  NotElligibleToQmailError,
  NotFoundError,
  ObjectValidationError,
  PasswordNotMatching,
  PasswordResetDemandNotFoundError,
  UserNotAuthorizedToAccessEntity,
  UserNotAuthorizedToCertifyError,
  UserNotFoundError,
  WrongDateFormatError,
};