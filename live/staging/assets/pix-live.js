"use strict";



define('pix-live/adapters/application', ['exports', 'ember-data', 'pix-live/config/environment'], function (exports, _emberData, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.JSONAPIAdapter.extend({

    namespace: 'api',
    host: _environment.default.APP.API_HOST,

    session: Ember.inject.service(),

    headers: Ember.computed('session.data.authenticated.token', function () {

      var tokenBearer = '';
      if (this.get('session.data.authenticated.token')) {
        tokenBearer = 'Bearer ' + this.get('session.data.authenticated.token');
      }

      return {
        'Authorization': tokenBearer
      };
    })

  });
});
define('pix-live/adapters/challenge', ['exports', 'pix-live/adapters/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({
    queryRecord: function queryRecord(store, type, query) {
      var url = this.host + '/' + this.namespace + '/assessments/' + query.assessmentId + '/next';
      if (query.challengeId) {
        url += '/' + query.challengeId;
      }
      return this.ajax(url, 'GET');
    }
  });
});
define('pix-live/adapters/correction', ['exports', 'pix-live/adapters/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({

    // refresh cache
    refreshRecord: function refreshRecord(type, challenge) {
      var url = this.host + '/' + this.namespace + '/cache';
      var payload = {
        'cache-key': '\xC9preuves_' + challenge.challengeId
      };
      return this.ajax(url, 'DELETE', { data: payload });
    }
  });
});
define('pix-live/adapters/user', ['exports', 'pix-live/adapters/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({
    shouldBackgroundReloadRecord: function shouldBackgroundReloadRecord() {
      return false;
    },
    queryRecord: function queryRecord() {
      var url = this.buildURL('user', 'me');
      return this.ajax(url, 'GET');
    },
    findRecord: function findRecord() {
      var url = this.buildURL('user', 'me');
      return this.ajax(url, 'GET');
    }
  });
});
define('pix-live/app', ['exports', 'pix-live/resolver', 'ember-load-initializers', 'pix-live/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});
define('pix-live/authenticators/simple', ['exports', 'ember-simple-auth/authenticators/base'], function (exports, _base) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _base.default.extend({

    ajax: Ember.inject.service(),

    restore: function restore(data) {
      return Ember.RSVP.resolve(data);
    },
    authenticate: function authenticate(email, password) {
      return this.get('ajax').request('/api/authentications', {
        method: 'POST',
        data: JSON.stringify({
          data: {
            attributes: {
              password: password,
              email: email
            }
          }
        })
      }).then(function (payload) {
        return Ember.RSVP.Promise.resolve({
          token: payload.data.attributes.token,
          userId: payload.data.attributes['user-id']
        });
      });
    }
  });
});
define('pix-live/breakpoints', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px)',
    desktop: '(min-width: 980px)'
  };
});
define('pix-live/components/app-footer', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['app-footer']

  });
});
define('pix-live/components/beta-logo', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    tagName: 'div',
    classNames: ['beta-logo']
  });
});
define('pix-live/components/certification-banner', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['certification-banner'],
    user: null,

    fullname: Ember.computed('user', function () {
      return this.get('user.firstName') + ' ' + this.get('user.lastName');
    })

  });
});
define('pix-live/components/certification-code-validation', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // Element
    classNames: ['certification-code-validation'],

    // Dependency injection
    store: Ember.inject.service(),

    // Public props
    onSubmit: null,
    onError: null,

    // Internal props
    _accessCode: '',
    _errorMessage: null,
    _loadingCertification: false,

    actions: {
      submit: function submit() {
        var _this = this;

        this.set('_errorMessage', null);
        var accessCode = this.get('_accessCode');
        if (accessCode) {
          this.set('_loadingCertification', true);
          return this.get('store').createRecord('course', { accessCode: accessCode }).save().then(function (certificationCourse) {
            _this.set('_loadingCertification', false);
            _this.get('onSubmit')(certificationCourse);
          }).catch(function (error) {
            _this.set('_loadingCertification', false);
            if (error.errors[0].status === '404') {
              _this.set('_errorMessage', 'Ce code n’existe pas ou n’est plus valide.');
            } else {
              _this.get('onError')(error);
            }
          });
        } else {
          this.set('_errorMessage', 'Merci de saisir un code d’accès valide.');
        }
      }
    }
  });
});
define('pix-live/components/certification-results-page', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['certification-results-page'],

    validSupervisor: false,
    notFinishedYet: true,

    actions: {
      validateBySupervisor: function validateBySupervisor() {
        if (this.get('validSupervisor')) {
          this.set('notFinishedYet', false);
        }
      }
    }
  });
});
define('pix-live/components/certifications-list-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var and = Ember.computed.and,
      or = Ember.computed.or,
      not = Ember.computed.not,
      equal = Ember.computed.equal;
  exports.default = Ember.Component.extend({
    certification: null,
    classNames: ['certifications-list-item'],
    classNameBindings: ['certification.isPublished:certifications-list-item__published-item:certifications-list-item__unpublished-item', 'isClickable:certifications-list-item__clickable:certifications-list-item__not-clickable'],

    isValidated: equal('certification.status', 'validated'),
    isNotValidated: not('isValidated'),

    isNotPublished: not('certification.isPublished'),
    isPublishedAndRejected: and('isNotValidated', 'certification.isPublished'),
    isPublishedAndValidated: and('isValidated', 'certification.isPublished'),

    shouldDisplayComment: and('isNotValidated', 'certification.{isPublished,commentForCandidate}'),

    isClickable: or('shouldDisplayComment', 'isPublishedAndValidated')
  });
});
define('pix-live/components/certifications-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['certifications-list'],
    certifications: null
  });
});
define('pix-live/components/challenge-actions', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var pendingValue = 'pending';
  var enableValue = 'enable';
  exports.default = Ember.Component.extend({

    classNames: ['challenge-actions'],

    challengeSkipped: null, // action
    answerValidated: null, // action

    _validateButtonStatus: enableValue, // enable, pending, offline
    _skipButtonStatus: enableValue,
    isValidateButtonEnable: Ember.computed.equal('_validateButtonStatus', enableValue),
    isValidateButtonPending: Ember.computed.equal('_validateButtonStatus', pendingValue),
    isValidateButtonOffline: Ember.computed.equal('_validateButtonStatus', 'offline'),

    isSkipButtonEnable: Ember.computed.equal('_skipButtonStatus', enableValue),
    isSkipButtonPending: Ember.computed.equal('_skipButtonStatus', pendingValue),

    didUpdateAttrs: function didUpdateAttrs() {
      this._super.apply(this, arguments);
      this.set('_validateButtonStatus', enableValue);
      this.set('_skipButtonStatus', enableValue);
    },


    actions: {
      skipChallenge: function skipChallenge() {
        if (this.get('_validateButtonStatus') === enableValue) {
          this.set('_skipButtonStatus', pendingValue);
          this.get('challengeSkipped')();
        }
      },
      validateAnswer: function validateAnswer() {
        var _this = this;

        if (this.get('_skipButtonStatus') === enableValue) {
          this.set('_validateButtonStatus', pendingValue);
          this.get('answerValidated')().catch(function () {
            return _this.set('_validateButtonStatus', enableValue);
          });
        }
      }
    }
  });
});
define('pix-live/components/challenge-embed-simulator', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // Element
    classNames: ['challenge-embed-simulator rounded-panel'],
    attributeBindings: ['embedDocumentHeightStyle:style'],

    // Data props
    embedDocument: null,

    // CPs
    embedDocumentHeightStyle: Ember.computed('embedDocument.height', function () {
      return Ember.String.htmlSafe('height: ' + this.get('embedDocument.height') + 'px');
    }),

    // Actions
    actions: {
      launchSimulator: function launchSimulator() {
        this.toggleProperty('_isSimulatorNotYetLaunched');
        this._unblurSimulator();
      },
      reloadSimulator: function reloadSimulator() {
        this._reloadSimulator();
      }
    },

    // Internals
    _isSimulatorNotYetLaunched: true,

    /* This method is not tested because it would be too difficult (add an observer on a complicated stubbed DOM API element!) */
    _reloadSimulator: function _reloadSimulator() {
      var iframe = this.element.getElementsByClassName('challenge-embed-simulator__iframe').item(0);
      var tmpSrc = iframe.src;
      iframe.onload = function () {
        iframe.onload = '';
        iframe.src = tmpSrc;
      };
      iframe.src = '';
    },
    _unblurSimulator: function _unblurSimulator() {
      var $simulatorPanel = this.element.getElementsByClassName('challenge-embed-simulator__simulator').item(0);
      $simulatorPanel.classList.remove('blurred');
    }
  });
});
define('pix-live/components/challenge-item-generic', ['exports', 'pix-live/utils/call-only-once', 'pix-live/utils/lodash-custom', 'pix-live/config/environment'], function (exports, _callOnlyOnce, _lodashCustom, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ChallengeItemGeneric = Ember.Component.extend({

    tagName: 'article',
    classNames: ['challenge-item'],
    attributeBindings: ['challenge.id:data-challenge-id'],

    answerValidated: null, // action

    _elapsedTime: null,
    _timer: null,
    _isUserAwareThatChallengeIsTimed: false,

    init: function init() {
      this._super.apply(this, arguments);
      if (!_lodashCustom.default.isInteger(this.get('challenge.timer'))) {
        this._start();
      }
    },
    didUpdateAttrs: function didUpdateAttrs() {
      this._super.apply(this, arguments);
      if (!this.get('_isUserAwareThatChallengeIsTimed')) {
        this.set('hasUserConfirmWarning', false);
        this.set('hasChallengeTimer', this.hasTimerDefined());
      }
    },
    willDestroyElement: function willDestroyElement() {
      this._super.apply(this, arguments);
      var timer = this.get('_timer');
      Ember.run.cancel(timer);
    },


    hasUserConfirmWarning: Ember.computed('challenge', function () {
      return false;
    }),

    hasChallengeTimer: Ember.computed('challenge', function () {
      return this.hasTimerDefined();
    }),

    canDisplayFeedbackPanel: Ember.computed('_isUserAwareThatChallengeIsTimed', function () {
      return !this.hasTimerDefined() || this.hasTimerDefined() && this.get('_isUserAwareThatChallengeIsTimed');
    }),

    hasTimerDefined: function hasTimerDefined() {
      return _lodashCustom.default.isInteger(this.get('challenge.timer'));
    },
    _getTimeout: function _getTimeout() {
      return this.$('.timeout-jauge-remaining').attr('data-spent');
    },
    _getElapsedTime: function _getElapsedTime() {
      return this.get('_elapsedTime');
    },
    _start: function _start() {
      this.set('_elapsedTime', 0);
      this._tick();
    },
    _tick: function _tick() {
      if (_environment.default.APP.isChallengeTimerEnable) {
        var timer = Ember.run.later(this, function () {
          var elapsedTime = this.get('_elapsedTime');
          this.set('_elapsedTime', elapsedTime + 1);
          this.notifyPropertyChange('_elapsedTime');
          this._tick();
        }, 1000);

        this.set('_timer', timer);
      }
    },


    actions: {
      validateAnswer: function validateAnswer() {
        if (this._hasError()) {
          var errorMessage = this._getErrorMessage();
          this.set('errorMessage', errorMessage);
          return Ember.RSVP.reject(errorMessage);
        }
        var answerValue = this._getAnswerValue();
        this.set('errorMessage', null);
        this.set('_isUserAwareThatChallengeIsTimed', false);
        return this.get('answerValidated')(this.get('challenge'), this.get('assessment'), answerValue, this._getTimeout(), this._getElapsedTime());
      },


      skipChallenge: (0, _callOnlyOnce.default)(function () {
        this.set('errorMessage', null);
        this.set('_isUserAwareThatChallengeIsTimed', false);
        this.get('answerValidated')(this.get('challenge'), this.get('assessment'), '#ABAND#', this._getTimeout(), this._getElapsedTime());
      }),

      setUserConfirmation: function setUserConfirmation() {
        this._start();
        this.toggleProperty('hasUserConfirmWarning');
        this.toggleProperty('hasChallengeTimer');
        this.set('_isUserAwareThatChallengeIsTimed', true);
      }
    }

  });

  exports.default = ChallengeItemGeneric;
});
define('pix-live/components/challenge-item-qcm', ['exports', 'pix-live/components/challenge-item-generic'], function (exports, _challengeItemGeneric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ChallengeItemQcm = _challengeItemGeneric.default.extend({

    _hasError: function _hasError() {
      return this._getAnswerValue().length < 1;
    },

    _getAnswerValue: function _getAnswerValue() {
      return this.$('input[type=checkbox][id^=checkbox_]:checked').map(function () {
        return this.name;
      }).get().join(',');
    },
    _getErrorMessage: function _getErrorMessage() {
      return 'Pour valider, sélectionner au moins une réponse. Sinon, passer.';
    },


    actions: {
      answerChanged: function answerChanged() {
        this.set('errorMessage', null);
      }
    }

  });

  exports.default = ChallengeItemQcm;
});
define('pix-live/components/challenge-item-qcu', ['exports', 'pix-live/components/challenge-item-generic'], function (exports, _challengeItemGeneric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ChallengeItemQcu = _challengeItemGeneric.default.extend({

    _hasError: function _hasError() {
      return this._getAnswerValue().length < 1;
    },

    _getAnswerValue: function _getAnswerValue() {

      return this.$('.challenge-proposals input:radio:checked').map(function () {
        return this.getAttribute('data-value');
      }).get().join('');
    },
    _getErrorMessage: function _getErrorMessage() {
      return 'Pour valider, sélectionner une réponse. Sinon, passer.';
    },


    actions: {
      answerChanged: function answerChanged() {
        this.set('errorMessage', null);
      }
    }

  });

  exports.default = ChallengeItemQcu;
});
define('pix-live/components/challenge-item-qmail', ['exports', 'pix-live/components/challenge-item-generic'], function (exports, _challengeItemGeneric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _challengeItemGeneric.default.extend({

    _isChecked: false,

    _hasError: function _hasError() {
      return !this.get('_isChecked');
    },

    _getErrorMessage: function _getErrorMessage() {
      return 'Pour valider, sélectionner une réponse. Sinon, passer.';
    },
    _getAnswerValue: function _getAnswerValue() {
      return '#PENDING#';
    }
  });
});
define('pix-live/components/challenge-item-qroc', ['exports', 'pix-live/components/challenge-item-generic'], function (exports, _challengeItemGeneric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ChallengeItemQroc = _challengeItemGeneric.default.extend({

    _hasError: function _hasError() {
      return this._getAnswerValue().length < 1;
    },

    _getAnswerValue: function _getAnswerValue() {
      return this.$('input[data-uid="qroc-proposal-uid"]').val();
    },
    _getErrorMessage: function _getErrorMessage() {
      return 'Pour valider, saisir une réponse. Sinon, passer.';
    },


    actions: {
      answerChanged: function answerChanged() {
        this.set('errorMessage', null);
      }
    }

  });

  exports.default = ChallengeItemQroc;
});
define('pix-live/components/challenge-item-qrocm', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/components/challenge-item-generic'], function (exports, _lodashCustom, _challengeItemGeneric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ChallengeItemQrocm = _challengeItemGeneric.default.extend({

    _hasError: function _hasError() {
      var allAnswers = this._getRawAnswerValue(); // ex. {"logiciel1":"word", "logiciel2":"excel", "logiciel3":""}
      var hasAtLeastOneAnswer = (0, _lodashCustom.default)(allAnswers).hasSomeTruthyProps();
      return _lodashCustom.default.isFalsy(hasAtLeastOneAnswer);
    },

    _getAnswerValue: function _getAnswerValue() {
      return jsyaml.safeDump(this._getRawAnswerValue());
    },
    _getRawAnswerValue: function _getRawAnswerValue() {
      var result = {};
      Ember.$('.challenge-proposals input').each(function (index, element) {
        result[Ember.$(element).attr('name')] = Ember.$(element).val();
      });
      return result;
    },
    _getErrorMessage: function _getErrorMessage() {
      return 'Pour valider, saisir au moins une réponse. Sinon, passer.';
    },


    actions: {
      answerChanged: function answerChanged() {
        this.set('errorMessage', null);
      }
    }

  });

  exports.default = ChallengeItemQrocm;
});
define('pix-live/components/challenge-statement', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    mailGenerator: Ember.inject.service(),

    classNames: ['challenge-statement'],

    attributeBindings: ['tabindex'],
    tabindex: -1,

    challenge: null,
    assessment: null,

    challengeInstruction: Ember.computed('challenge.instruction', function () {
      var instruction = this.get('challenge.instruction');
      if (!instruction) {
        return null;
      }
      return instruction.replace('${EMAIL}', this._formattedEmailForInstruction());
    }),

    challengeEmbedDocument: Ember.computed('challenge.hasValidEmbedDocument', function () {
      if (this.get('challenge.hasValidEmbedDocument')) {
        return {
          url: this.get('challenge.embedUrl'),
          title: this.get('challenge.embedTitle'),
          height: this.get('challenge.embedHeight')
        };
      }
    }),

    init: function init() {
      this._super.apply(this, arguments);
      this.id = 'challenge_statement_' + this.get('challenge.id');
    },
    didReceiveAttrs: function didReceiveAttrs() {
      this._super.apply(this, arguments);
      Ember.$('#' + this.id).focus();
    },
    didInsertElement: function didInsertElement() {
      this._super.apply(this, arguments);
      Ember.$('#' + this.id).focus();
    },


    selectedAttachmentUrl: Ember.computed('challenge.attachments', function () {
      return this.get('challenge.attachments.firstObject');
    }),

    attachmentsData: Ember.computed('challenge.attachements', function () {
      return this.get('challenge.attachments');
    }),

    actions: {
      selectAttachementUrl: function selectAttachementUrl(attachementUrl) {
        this.set('selectedAttachmentUrl', attachementUrl);
      }
    },

    _formattedEmailForInstruction: function _formattedEmailForInstruction() {
      return this.get('mailGenerator').generateEmail(this.get('challenge.id'), this.get('assessment.id'), window.location.hostname, _environment.default.environment);
    }
  });
});
define('pix-live/components/click-outside', ['exports', 'ember-click-outside/components/click-outside'], function (exports, _clickOutside) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _clickOutside.default;
});
define('pix-live/components/comparison-window', ['exports', 'pix-live/utils/result-icon-url', 'ember-keyboard', 'ember-component-focus/mixins/focusable-component'], function (exports, _resultIconUrl, _emberKeyboard, _focusableComponent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var TEXT_FOR_RESULT = {
    ok: {
      status: 'ok',
      title: 'Vous avez la bonne réponse !',
      tooltip: 'Réponse correcte'
    },

    ko: {
      status: 'ko',
      title: 'Vous n\'avez pas la bonne réponse',
      tooltip: 'Réponse incorrecte'
    },

    aband: {
      status: 'aband',
      title: 'Vous n\'avez pas donné de réponse',
      tooltip: 'Sans réponse'
    },

    partially: {
      status: 'partially',
      title: 'Vous avez donné une réponse partielle',
      tooltip: 'Réponse partielle'
    },

    timedout: {
      status: 'timedout',
      title: 'Vous avez dépassé le temps imparti',
      tooltip: 'Temps dépassé'
    },

    default: {
      status: 'default',
      title: '',
      tooltip: 'Correction automatique en cours de développement ;)'
    }
  };

  exports.default = Ember.Component.extend(_emberKeyboard.EKMixin, _focusableComponent.default, {

    modal: Ember.inject.service('current-routed-modal'),

    classNames: ['comparison-window'],

    answer: null,
    challenge: null,
    correction: null,
    index: null,

    focusNode: '.routable-modal--close-button',

    isAssessmentChallengeTypeQroc: Ember.computed.equal('challenge.type', 'QROC'),
    isAssessmentChallengeTypeQcm: Ember.computed.equal('challenge.type', 'QCM'),
    isAssessmentChallengeTypeQcu: Ember.computed.equal('challenge.type', 'QCU'),
    isAssessmentChallengeTypeQrocm: Ember.computed.equal('challenge.type', 'QROCM'),
    isAssessmentChallengeTypeQrocmInd: Ember.computed.equal('challenge.type', 'QROCM-ind'),
    isAssessmentChallengeTypeQrocmDep: Ember.computed.equal('challenge.type', 'QROCM-dep'),

    activateKeyboard: Ember.on('init', function () {
      this.set('keyboardActivated', true);
    }),

    closeOnEsc: Ember.on((0, _emberKeyboard.keyUp)('Escape'), function () {
      this.get('modal').close();
    }),

    didInsertElement: function didInsertElement() {
      this._super.apply(this, arguments);
      this.focus();
    },
    didDestroyElement: function didDestroyElement() {
      Ember.$('#open-comparison_' + this.get('index')).focus();
    },


    resultItem: Ember.computed('answer.result', function () {
      var resultItem = TEXT_FOR_RESULT['default'];
      var answerStatus = this.get('answer.result');

      if (answerStatus && answerStatus in TEXT_FOR_RESULT) {
        resultItem = TEXT_FOR_RESULT[answerStatus];
      }
      return resultItem;
    }),

    resultItemIcon: Ember.computed('resultItem', function () {
      return (0, _resultIconUrl.default)(this.get('resultItem.status'));
    })
  });
});
define('pix-live/components/competence-area-list', ['exports', 'ember-group-by', 'lodash/sortBy'], function (exports, _emberGroupBy, _sortBy2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['competence-area-list'],

    competences: null,

    _sanitizedCompetences: Ember.computed('competences', function () {
      var _competences = this.get('competences');
      return _competences ? _competences : [];
    }),

    _competencesGroupedByArea: (0, _emberGroupBy.default)('_sanitizedCompetences', 'areaName'),

    _competencesByAreaSorted: Ember.computed('_competencesGroupedByArea', function () {
      var competencesByArea = this.get('_competencesGroupedByArea');
      return (0, _sortBy2.default)(competencesByArea, function (competence) {
        return competence.value;
      });
    })
  });
});
define('pix-live/components/competence-by-area-item', ['exports', 'lodash/sortBy'], function (exports, _sortBy2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['competence-by-area-item'],
    competenceArea: null,
    _competencesAreaName: Ember.computed('competenceArea.value', function () {
      var competenceAreaName = this.get('competenceArea.value');
      return competenceAreaName ? this.get('competenceArea.value').substr(3) : '';
    }),
    _competencesSortedList: Ember.computed('competenceArea.items', function () {
      var competences = this.get('competenceArea.items');
      return (0, _sortBy2.default)(competences, function (competence) {
        return competence.get('index');
      });
    })
  });
});
define('pix-live/components/competence-level-progress-bar', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['competence-level-progress-bar'],

    _MAX_REACHABLE_LEVEL: 5,
    _MAX_LEVEL: 8,

    level: null,
    courseId: null,
    assessmentId: null,
    name: null,
    status: null,

    _showSecondChanceModal: false,

    limitedLevel: Ember.computed('level', function () {
      var level = this.get('level');
      return Math.min(level, this.get('_MAX_REACHABLE_LEVEL'));
    }),

    hasLevel: Ember.computed('level', function () {
      var level = this.get('level');
      return Ember.isPresent(this.get('level')) && level !== -1;
    }),

    widthOfProgressBar: Ember.computed('limitedLevel', function () {

      var level = this.get('limitedLevel');
      var maxLevel = this.get('_MAX_LEVEL');
      var progressBarWidth = void 0;

      if (level === 0) {
        progressBarWidth = '24px';
      } else {
        progressBarWidth = level * 100 / maxLevel + '%';
      }

      return Ember.String.htmlSafe('width : ' + progressBarWidth);
    }),

    canUserStartCourse: Ember.computed('courseId', 'hasLevel', 'assessmentId', function () {
      var courseId = this.get('courseId');
      var hasLevel = this.get('hasLevel');
      var assessmentId = this.get('assessmentId');
      return Boolean(courseId && !hasLevel && !assessmentId);
    }),

    canUserResumeAssessment: Ember.computed('assessmentId', 'status', function () {
      return Boolean(this.get('status') === 'notCompleted') && Ember.isPresent(this.get('assessmentId'));
    }),

    canUserReplayAssessment: Ember.computed('courseId', 'status', function () {
      return Boolean(this.get('status') === 'evaluated' && this.get('courseId'));
    }),

    actions: {
      openModal: function openModal() {
        this.set('_showSecondChanceModal', true);
      },
      closeModal: function closeModal() {
        this.set('_showSecondChanceModal', false);
      }
    }
  });
});
define("pix-live/components/content-backdrop", ["exports", "ember-side-menu/components/content-backdrop"], function (exports, _contentBackdrop) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return _contentBackdrop.default;
    }
  });
});
define('pix-live/components/corner-ribbon', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({});
});
define('pix-live/components/course-banner', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // Element
    classNames: ['course-banner'],

    // Data props
    course: null,
    withHomeLink: false,

    // CPs
    courseName: Ember.computed('course.name', function () {
      var courseName = this.get('course.name');
      return courseName ? courseName : 'Parcours e-pro';
    })
  });
});
define('pix-live/components/course-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var CourseItem = Ember.Component.extend({

    course: null,

    tagName: 'article',
    classNames: ['course-item', 'rounded-panel'],
    attributeBindings: ['tabindex'],
    tabindex: 0,

    imageUrl: Ember.computed('course', function () {
      var imageUrl = this.get('course.imageUrl');
      return imageUrl ? imageUrl : '/images/course-default-image.png';
    }),

    actions: {
      startCourse: function startCourse(course) {
        this.sendAction('startCourse', course);
      }
    }

  });

  exports.default = CourseItem;
});
define('pix-live/components/course-list', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function _userNotAlreadyWarnedAboutMobileIncompleteSupport(that) {
    return that._isMobile() && !localStorage.getItem('pix-mobile-warning');
  }

  function _rememberThatUserIsNowAware() {
    localStorage.setItem('pix-mobile-warning', 'true');
  }

  function _storeCourseToDisplayAfterWarning(that, course) {
    that.set('selectedCourse', course);
  }

  function _displayWarningModal() {
    Ember.$('#js-modal-mobile').modal();
  }

  var CourseList = Ember.Component.extend({

    courses: null,
    selectedCourse: null,

    classNames: ['course-list'],

    isLoading: Ember.computed.readOnly('courses.isPending'),

    filteredCourses: Ember.computed('courses.[]', function () {
      var courses = this.get('courses');
      var filteredCourses = [];

      if (courses) {
        var limit = this.get('limit');
        filteredCourses = courses.toArray();
        if (limit) {
          filteredCourses = courses.slice(0, limit);
        }
      }
      return filteredCourses;
    }),

    didInsertElement: function didInsertElement() {
      var _this = this;

      var that = this;
      Ember.run.scheduleOnce('afterRender', this, function () {
        _this.$('button[data-confirm]').click(function () {
          _this.$('#js-modal-mobile').modal('hide');
          _this.sendAction('startCourse', that.get('selectedCourse'));
        });
      });

      if (_environment.default.APP.isMobileSimulationEnabled) {
        this.$().on('simulateMobileScreen', function () {
          that.set('isSimulatedMobileScreen', 'true');
        });
      }
    },
    _isMobile: function _isMobile() {
      if (_environment.default.APP.isMobileSimulationEnabled) {
        return this.get('isSimulatedMobileScreen');
      }
      return Ember.$(window).width() < 767;
    },


    actions: {
      startCourse: function startCourse(course) {
        if (_userNotAlreadyWarnedAboutMobileIncompleteSupport(this)) {
          _rememberThatUserIsNowAware();
          _storeCourseToDisplayAfterWarning(this, course);
          _displayWarningModal();
        } else {
          this.sendAction('startCourse', course);
        }
      }
    }

  });

  exports.default = CourseList;
});
define('pix-live/components/cp-panel-body', ['exports', 'ember-collapsible-panel/components/cp-panel-body/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('pix-live/components/cp-panel-toggle', ['exports', 'ember-collapsible-panel/components/cp-panel-toggle/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('pix-live/components/cp-panel', ['exports', 'ember-collapsible-panel/components/cp-panel/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('pix-live/components/cp-panels', ['exports', 'ember-collapsible-panel/components/cp-panels/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog-positioned-container', ['exports', 'ember-modal-dialog/components/positioned-container'], function (exports, _positionedContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _positionedContainer.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog/-basic-dialog', ['exports', 'ember-modal-dialog/components/basic-dialog'], function (exports, _basicDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _basicDialog.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog/-in-place-dialog', ['exports', 'ember-modal-dialog/components/in-place-dialog'], function (exports, _inPlaceDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inPlaceDialog.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog/-liquid-dialog', ['exports', 'ember-modal-dialog/components/liquid-dialog'], function (exports, _liquidDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _liquidDialog.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog/-liquid-tether-dialog', ['exports', 'ember-modal-dialog/components/liquid-tether-dialog'], function (exports, _liquidTetherDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _liquidTetherDialog.default;
    }
  });
});
define('pix-live/components/ember-modal-dialog/-tether-dialog', ['exports', 'ember-modal-dialog/components/tether-dialog'], function (exports, _tetherDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tetherDialog.default;
    }
  });
});
define('pix-live/components/ember-wormhole', ['exports', 'ember-wormhole/components/ember-wormhole'], function (exports, _emberWormhole) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberWormhole.default;
    }
  });
});
define('pix-live/components/feature-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    tagName: 'article',
    classNames: ['feature-item']

  });
});
define('pix-live/components/feature-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['feature-list'],

    init: function init() {
      this._super.apply(this, arguments);
      this.features = [{
        icon: 'cafe',
        title: 'Vivez l’expérience PIX',
        description: 'Un parcours d’évaluation convivial, accessible et interactif.'
      }, {
        icon: 'monde',
        title: 'PIX est pour tout le monde',
        description: 'Collégiens, lycéens, étudiants, professionnels, citoyens…'
      }, {
        icon: 'reference',
        title: 'PIX est la référence',
        description: 'La certification nationale de la culture numérique made in France au standard européen.'
      }, {
        icon: 'evolutif',
        title: 'PIX est évolutif',
        description: 'Le référentiel de compétences s’adapte en permanence aux évolutions du monde numérique.'
      }, {
        icon: 'gratuit',
        title: 'PIX est gratuit',
        description: 'Entraînez-vous et progressez gratuitement à votre rythme avant d’être certifié.'
      }];
    }
  });
});
define('pix-live/components/feedback-panel', ['exports', 'pix-live/utils/email-validator', 'pix-live/config/environment'], function (exports, _emailValidator, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var FORM_CLOSED = 'FORM_CLOSED';
  var FORM_OPENED = 'FORM_OPENED';
  var FORM_SUBMITTED = 'FORM_SUBMITTED';

  exports.default = Ember.Component.extend({

    store: Ember.inject.service(),

    classNames: ['feedback-panel'],

    assessment: null,
    challenge: null,
    collapsible: true,

    _status: FORM_CLOSED,
    _email: null,
    _content: null,
    _error: null,

    isFormClosed: Ember.computed.equal('_status', FORM_CLOSED),
    isFormOpened: Ember.computed.equal('_status', FORM_OPENED),
    isFormSubmitted: Ember.computed.equal('_status', FORM_SUBMITTED),

    didReceiveAttrs: function didReceiveAttrs() {
      this._super.apply(this, arguments);
      this._reset();
    },
    _reset: function _reset() {
      this.set('_email', null);
      this.set('_content', null);
      this.set('_error', null);
      this.set('_status', this._getDefaultStatus());
    },
    _closeForm: function _closeForm() {
      this.set('_status', FORM_CLOSED);
      this.set('_error', null);
    },
    _getDefaultStatus: function _getDefaultStatus() {
      return this.get('collapsible') ? FORM_CLOSED : FORM_OPENED;
    },


    _scrollToPanel: function _scrollToPanel() {
      Ember.$('html,body').animate({
        scrollTop: Ember.$('.feedback-panel__view').offset().top - 15
      }, _environment.default.APP.SCROLL_DURATION);
    },

    actions: {
      openFeedbackForm: function openFeedbackForm() {
        this.set('_status', FORM_OPENED);
        this._scrollToPanel();
      },
      cancelFeedback: function cancelFeedback() {
        this._closeForm();
      },
      sendFeedback: function sendFeedback() {
        var _this = this;

        var email = this.get('_email');
        if (!Ember.isEmpty(email) && !(0, _emailValidator.default)(email)) {
          this.set('_error', 'Vous devez saisir une adresse mail valide.');
          return;
        }

        var content = this.get('_content');
        if (Ember.isEmpty(content) || Ember.isEmpty(content.trim())) {
          this.set('_error', 'Vous devez saisir un message.');
          return;
        }

        var store = this.get('store');
        var assessment = this.get('assessment');
        var challenge = this.get('challenge');

        var feedback = store.createRecord('feedback', {
          email: this.get('_email'),
          content: this.get('_content'),
          assessment: assessment,
          challenge: challenge
        });
        feedback.save().then(function () {
          return _this.set('_status', FORM_SUBMITTED);
        });
      }
    }
  });
});
define('pix-live/components/form-textfield', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var INPUT_VALIDATION_STATUS_MAP = {
    default: 'form-textfield__input--default',
    error: 'form-textfield__input--error',
    success: 'form-textfield__input--success'
  };

  var ICON_TYPE_STATUS_MAP = {
    default: '',
    error: 'error',
    success: 'success'
  };

  var MESSAGE_VALIDATION_STATUS_MAP = {
    default: 'form-textfield__message--default',
    error: 'form-textfield__message--error',
    success: 'form-textfield__message--success'
  };

  var INPUT_CONTAINER_VALIDATION_STATUS_MAP = {
    default: 'form-textfield__input-container--default',
    error: 'form-textfield__input-container--error',
    success: 'form-textfield__input-container--success'
  };

  exports.default = Ember.Component.extend({
    classNames: ['form-textfield'],

    label: '',
    textfieldName: '',
    validationMessage: '',

    textfieldType: Ember.computed('textfieldName', function () {
      if (this.get('textfieldName') === 'password') {
        return 'password';
      }
      if (this.get('textfieldName') === 'email') {
        return 'email';
      }
      return 'text';
    }),

    _isValidationStatusNotDefault: function _isValidationStatusNotDefault() {
      return this.get('validationStatus') !== 'default';
    },


    hasIcon: Ember.computed('validationStatus', 'user.errors.content', function () {
      return this._isValidationStatusNotDefault();
    }),

    inputContainerStatusClass: Ember.computed('validationStatus', function () {
      var inputValidationStatus = this.get('validationStatus');
      return INPUT_CONTAINER_VALIDATION_STATUS_MAP[inputValidationStatus] || null;
    }),

    iconType: Ember.computed('validationStatus', function () {
      var inputValidationStatus = this.get('validationStatus');
      return ICON_TYPE_STATUS_MAP[inputValidationStatus] || '';
    }),

    inputValidationStatus: Ember.computed('validationStatus', function () {
      var inputValidationStatus = this.get('validationStatus');
      return INPUT_VALIDATION_STATUS_MAP[inputValidationStatus] || '';
    }),

    validationMessageClass: Ember.computed('validationStatus', function () {
      var inputValidationStatus = this.get('validationStatus');
      return MESSAGE_VALIDATION_STATUS_MAP[inputValidationStatus] || '';
    }),

    actions: {
      validate: function validate() {
        this.sendAction('validate', this.get('textfieldName'));
      }
    }
  });
});
define('pix-live/components/g-recaptcha', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['gg-recaptcha'],

    googleRecaptcha: Ember.inject.service(),

    validateRecaptcha: null, // action
    resetRecaptcha: null, // action

    tokenHasBeenUsed: null,
    validation: null,

    didInsertElement: function didInsertElement() {
      this._super.apply(this, arguments);
      var component = this;
      this.get('googleRecaptcha').loadScript().then(function () {
        component.renderRecaptcha();
      });
    },
    didUpdateAttrs: function didUpdateAttrs() {
      this._super.apply(this, arguments);
      if (this.get('tokenHasBeenUsed')) {
        this.get('googleRecaptcha').reset();
      }
    },
    renderRecaptcha: function renderRecaptcha() {
      var callback = this.get('validateCallback').bind(this);
      var expiredCallback = this.get('expiredCallback').bind(this);
      this.get('googleRecaptcha').render('g-recaptcha-container', callback, expiredCallback);
    },
    validateCallback: function validateCallback(recaptchaResponse) {
      this.set('recaptchaToken', recaptchaResponse);
      this.set('tokenHasBeenUsed', false);
    },
    expiredCallback: function expiredCallback() {
      this.set('recaptchaToken', null);
      this.set('tokenHasBeenUsed', false);
    }
  });
});
define('pix-live/components/learning-more-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['learning-more-panel'],

    learningMoreTutorials: null,

    hasLearningMoreItems: Ember.computed('learningMoreTutorials.length', function () {
      return this.get('learningMoreTutorials.length') > 0;
    })
  });
});
define('pix-live/components/logged-user-profile-banner', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['logged-user-profile-banner'],

    actions: {
      scrollToProfile: function scrollToProfile() {
        Ember.$('html, body').animate({
          scrollTop: Ember.$('.profile-panel__header').offset().top - 15
        }, _environment.default.APP.SCROLL_DURATION);
      }
    }
  });
});
define('pix-live/components/markdown-to-html', ['exports', 'ember-cli-showdown/components/markdown-to-html'], function (exports, _markdownToHtml) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _markdownToHtml.default;
    }
  });
});
define('pix-live/components/medal-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['medal-item'],

    pixScore: null
  });
});
define('pix-live/components/modal-dialog-overlay', ['exports', 'ember-modal-dialog/components/modal-dialog-overlay'], function (exports, _modalDialogOverlay) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _modalDialogOverlay.default;
    }
  });
});
define('pix-live/components/modal-dialog', ['exports', 'ember-modal-dialog/components/modal-dialog'], function (exports, _modalDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _modalDialog.default;
    }
  });
});
define('pix-live/components/modal-mobile', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    didInsertElement: function didInsertElement() {

      // XXX : we hack here Bootstrap,
      // because we need a display:flex to center the modal
      // since bootstrap insert an inlined-style display:block
      // we have to remove this property once the modal renders.
      Ember.run.scheduleOnce('afterRender', this, function () {
        Ember.$('#js-modal-mobile').on('shown.bs.modal', function () {
          Ember.$('#js-modal-mobile').attr('style', function (i, style) {
            return style.replace(/display[^;]+;?/g, '');
          });
        });
      });
    }

  });
});
define('pix-live/components/navbar-desktop-menu', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['navbar-desktop-menu']
  });
});
define('pix-live/components/navbar-header', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    session: Ember.inject.service(),
    store: Ember.inject.service(),
    classNames: ['navbar-header'],
    _canDisplayMenu: false,
    _menuItems: [{ name: 'Projet', link: 'project', class: 'navbar-header-links__link--project', permanent: true }, {
      name: 'Compétences',
      link: 'competences',
      class: 'navbar-header-links__link--competences',
      permanent: true
    }, { name: 'Se connecter', link: 'login', class: 'navbar-menu-signin-link' }, { name: 'S’inscrire', link: 'inscription', class: 'navbar-menu-signup-link' }],

    isUserLogged: Ember.computed.alias('session.isAuthenticated'),
    menu: Ember.computed('isUserLogged', function () {
      var menuItems = this.get('_menuItems');
      return this.get('isUserLogged') ? menuItems.filterBy('permanent', true) : menuItems;
    })
  });
});
define('pix-live/components/navbar-mobile-menu', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    sideMenu: Ember.inject.service(),
    classNames: ['navbar-mobile-menu'],

    actions: {
      closeMenu: function closeMenu() {
        this.get('sideMenu').close();
      }
    }
  });
});
define('pix-live/components/no-certification-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({});
});
define('pix-live/components/password-reset-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    store: Ember.inject.service(),

    email: '',
    _displayErrorMessage: false,
    _displaySuccessMessage: false,

    actions: {
      savePasswordResetDemand: function savePasswordResetDemand() {
        var _this = this;

        this.set('_displayErrorMessage', false);
        this.set('_displaySuccessMessage', false);
        this.get('store').createRecord('password-reset-demand', { email: this.get('email') }).save().then(function () {
          _this.set('_displaySuccessMessage', true);
        }).catch(function () {
          _this.set('_displayErrorMessage', true);
        });
      }
    }
  });
});
define('pix-live/components/pix-content-backdrop', ['exports', 'ember-side-menu/components/content-backdrop'], function (exports, _contentBackdrop) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _contentBackdrop.default.extend({
    touchStart: function touchStart() {
      this.get('sideMenu').close();
    }
  });
});
define('pix-live/components/pix-logo', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['pix-logo']

  });
});
define('pix-live/components/pix-modale', ['exports', 'ember-modal-dialog/components/modal-dialog', 'ember-keyboard'], function (exports, _modalDialog, _emberKeyboard) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function _setFocusOnFirstTabbableElement(modalId) {
    var $tabbableElementInModal = Ember.$(modalId).find(':tabbable');

    var $firstElementToFocus = $tabbableElementInModal.get(0);
    if ($firstElementToFocus != null) {
      $firstElementToFocus.focus();
    }
  }

  exports.default = _modalDialog.default.extend(_emberKeyboard.EKMixin, {

    wrapperClassNames: ['pix-modal-wrapper'],
    containerClassNames: ['pix-modal'],
    keyboardActivated: true,
    translucentOverlay: true,

    didInsertElement: function didInsertElement() {
      this._super.apply(this, arguments);

      var modalId = '#' + Ember.$('.ember-modal-dialog').attr('id');

      try {
        // XXX :tabbable is a jQuery plugin, not loaded in integration tests
        _setFocusOnFirstTabbableElement(modalId);
        Ember.$(modalId).find(':tabbable').last().on('blur', function () {
          _setFocusOnFirstTabbableElement(modalId);
        });
      } catch (e) {
        // thow away the jQuery error
      }
    },


    closeOnEsc: Ember.on((0, _emberKeyboard.keyUp)('Escape'), function () {
      this.sendAction('close');
    })
  });
});
define('pix-live/components/profile-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['profile-panel'],
    competences: null,
    totalPixScore: null
  });
});
define('pix-live/components/progress-bar', ['exports', 'pix-live/models/assessment-progression'], function (exports, _assessmentProgression) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // Element
    classNames: ['progress', 'pix-progress-bar'],

    // Data props
    assessment: null,

    // CPs
    progression: Ember.computed('assessment.{type,answers,course.nbChallenges}', function () {
      return new _assessmentProgression.default({
        assessmentType: this.get('assessment.type'),
        nbAnswers: this.get('assessment.answers.length'),
        nbChallenges: this.get('assessment.course.nbChallenges')
      });
    }),

    barStyle: Ember.computed('progression', function () {
      return Ember.String.htmlSafe('width: ' + this.get('progression.valueNow') + '%');
    })

  });
});
define('pix-live/components/qcm-proposals', ['exports', 'pix-live/utils/labeled-checkboxes', 'pix-live/utils/proposals-as-array', 'pix-live/utils/value-as-array-of-boolean'], function (exports, _labeledCheckboxes, _proposalsAsArray, _valueAsArrayOfBoolean) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    answersValue: null,
    proposals: null,
    answerChanged: null,

    labeledCheckboxes: Ember.computed('proposals', 'answersValue', function () {
      var arrayOfProposals = (0, _proposalsAsArray.default)(this.get('proposals'));
      var arrayOfBoolean = (0, _valueAsArrayOfBoolean.default)(this.get('answersValue'));

      return (0, _labeledCheckboxes.default)(arrayOfProposals, arrayOfBoolean);
    }),

    actions: {
      checkboxCliked: function checkboxCliked() {
        this.get('answerChanged')();
      }
    }
  });
});
define('pix-live/components/qcm-solution-panel', ['exports', 'pix-live/utils/labeled-checkboxes', 'pix-live/utils/value-as-array-of-boolean', 'pix-live/utils/proposals-as-array', 'pix-live/utils/lodash-custom'], function (exports, _labeledCheckboxes, _valueAsArrayOfBoolean, _proposalsAsArray, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['qcm-solution-panel'],
    answer: null,
    solution: null,
    challenge: null,

    solutionArray: Ember.computed('solution', function () {
      var solution = this.get('solution');
      return _lodashCustom.default.isNonEmptyString(solution) ? (0, _valueAsArrayOfBoolean.default)(solution) : [];
    }),

    labeledCheckboxes: Ember.computed('answer', function () {
      var answer = this.get('answer.value');
      var checkboxes = [];
      if (_lodashCustom.default.isNonEmptyString(answer)) {
        var proposals = this.get('challenge.proposals');
        var proposalsArray = (0, _proposalsAsArray.default)(proposals);
        var answerArray = (0, _valueAsArrayOfBoolean.default)(answer);
        checkboxes = (0, _labeledCheckboxes.default)(proposalsArray, answerArray);
      }
      return checkboxes;
    })
  });
});
define('pix-live/components/qcu-proposals', ['exports', 'pix-live/utils/labeled-checkboxes', 'pix-live/utils/proposals-as-array', 'pix-live/utils/value-as-array-of-boolean'], function (exports, _labeledCheckboxes, _proposalsAsArray, _valueAsArrayOfBoolean) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    answersValue: null,
    proposals: null,
    answerChanged: null, // action

    labeledRadios: Ember.computed('proposals', 'answersValue', function () {
      var arrayOfProposals = (0, _proposalsAsArray.default)(this.get('proposals'));
      return (0, _labeledCheckboxes.default)(arrayOfProposals, (0, _valueAsArrayOfBoolean.default)(this.get('answersValue')));
    }),

    _uncheckAllRadioButtons: function _uncheckAllRadioButtons() {
      this.$(':radio').prop('checked', false);
    },
    _checkAgainTheSelectedOption: function _checkAgainTheSelectedOption(index) {
      this.$(':radio:nth(' + index + ')').prop('checked', true);
    },


    actions: {
      radioClicked: function radioClicked(index) {
        this._uncheckAllRadioButtons();
        this._checkAgainTheSelectedOption(index);
        this.get('answerChanged')();
      }
    }

  });
});
define('pix-live/components/qcu-solution-panel', ['exports', 'pix-live/utils/labeled-checkboxes', 'pix-live/utils/value-as-array-of-boolean', 'pix-live/utils/proposals-as-array', 'pix-live/utils/lodash-custom'], function (exports, _labeledCheckboxes, _valueAsArrayOfBoolean, _proposalsAsArray, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['qcu-solution-panel'],
    answer: null,
    solution: null,
    challenge: null,

    solutionArray: Ember.computed('solution', function () {
      var solution = this.get('solution');
      return _lodashCustom.default.isNonEmptyString(solution) ? (0, _valueAsArrayOfBoolean.default)(solution) : [];
    }),

    labeledRadios: Ember.computed('answer', function () {
      var answer = this.get('answer.value');
      var radiosArray = [];
      if (_lodashCustom.default.isNonEmptyString(answer)) {
        var proposals = this.get('challenge.proposals');
        var proposalsArray = (0, _proposalsAsArray.default)(proposals);
        var answerArray = (0, _valueAsArrayOfBoolean.default)(answer);
        radiosArray = (0, _labeledCheckboxes.default)(proposalsArray, answerArray);
      }

      return radiosArray;
    })
  });
});
define('pix-live/components/qroc-proposal', ['exports', 'pix-live/utils/proposals-as-blocks'], function (exports, _proposalsAsBlocks) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['qroc-proposal'],

    proposals: null,
    answerValue: null,
    answerChanged: null, // action

    _blocks: Ember.computed('proposals', function () {
      return (0, _proposalsAsBlocks.default)(this.get('proposals'));
    }),

    userAnswer: Ember.computed('answerValue', function () {
      var answer = this.get('answerValue') || '';
      return answer.indexOf('#ABAND#') > -1 ? '' : answer;
    }),

    didInsertElement: function didInsertElement() {
      var _this = this;

      this.$('input').keydown(function () {
        _this.get('answerChanged')();
      });
    }
  });
});
define('pix-live/components/qroc-solution-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var classByResultValue = {
    ok: 'correction-qroc-box__input-right-answer',
    ko: 'correction-qroc-box__input-wrong-answer',
    aband: 'correction-qroc-box__input-no-answer'
  };

  exports.default = Ember.Component.extend({

    answer: null,
    solution: null,

    inputClass: Ember.computed('answer.result', function () {
      return classByResultValue[this.get('answer.result')] || '';
    }),

    isResultOk: Ember.computed('answer', function () {
      return this.get('answer.result') === 'ok';
    }),

    answerToDisplay: Ember.computed('answer', function () {
      var answer = this.get('answer.value');
      if (answer === '#ABAND#') {
        return 'Pas de réponse';
      }
      return answer;
    }),

    solutionToDisplay: Ember.computed('solution', function () {
      var solutionVariants = this.get('solution');
      if (!solutionVariants) {
        return '';
      }
      return solutionVariants.split('\n')[0];
    })
  });
});
define('pix-live/components/qrocm-ind-solution-panel', ['exports', 'lodash', 'pix-live/utils/answers-as-object', 'pix-live/utils/solution-as-object', 'pix-live/utils/labels-as-object', 'pix-live/utils/result-details-as-object'], function (exports, _lodash, _answersAsObject, _solutionAsObject, _labelsAsObject, _resultDetailsAsObject) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function _computeAnswerOutcome(inputFieldValue, resultDetail) {
    if (inputFieldValue === '') {
      return 'empty';
    }
    return resultDetail === true ? 'ok' : 'ko';
  }

  function _computeInputClass(answerOutcome) {
    if (answerOutcome === 'empty') {
      return 'correction-qroc-box__input-no-answer';
    }
    if (answerOutcome === 'ok') {
      return 'correction-qroc-box__input-right-answer';
    }
    return 'correction-qroc-box__input-wrong-answer';
  }

  var QrocmIndSolutionPanel = Ember.Component.extend({

    inputFields: Ember.computed('challenge.proposals', 'answer.value', 'solution', function () {

      var labels = (0, _labelsAsObject.default)(this.get('challenge.proposals'));
      var answers = (0, _answersAsObject.default)(this.get('answer.value'), _lodash.default.keys(labels));
      var solutions = (0, _solutionAsObject.default)(this.get('solution'));
      var resultDetails = (0, _resultDetailsAsObject.default)(this.get('answer.resultDetails'));

      var inputFields = [];

      _lodash.default.forEach(labels, function (label, labelKey) {
        var answerOutcome = _computeAnswerOutcome(answers[labelKey], resultDetails[labelKey]);
        var inputClass = _computeInputClass(answerOutcome);

        if (answers[labelKey] === '') {
          answers[labelKey] = 'Pas de réponse';
        }
        var inputField = {
          label: labels[labelKey],
          answer: answers[labelKey],
          solution: solutions[labelKey][0],
          emptyOrWrongAnswer: answerOutcome === 'empty' || answerOutcome === 'ko',
          inputClass: inputClass
        };
        inputFields.push(inputField);
      });

      return inputFields;
    })

  });

  exports.default = QrocmIndSolutionPanel;
});
define('pix-live/components/qrocm-proposal', ['exports', 'pix-live/utils/proposals-as-blocks'], function (exports, _proposalsAsBlocks) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['qrocm-proposal'],

    proposals: null,
    answersValue: null,
    answerChanged: null, // action

    _blocks: Ember.computed('proposals', function () {
      return (0, _proposalsAsBlocks.default)(this.get('proposals'));
    }),

    didInsertElement: function didInsertElement() {
      var _this = this;

      this.$('input').keydown(function () {
        _this.get('answerChanged')();
      });
    }

  });
});
define('pix-live/components/reset-password-form', ['exports', 'pix-live/utils/password-validator'], function (exports, _passwordValidator) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ERROR_PASSWORD_MESSAGE = 'Votre mot de passe doit comporter au moins une lettre, un chiffre et 8 caractères.';
  var PASSWORD_SUCCESS_MESSAGE = 'Votre mot de passe a été bien mis à jour';
  var VALIDATION_MAP = {
    default: {
      status: 'default', message: null
    },
    error: {
      status: 'error', message: ERROR_PASSWORD_MESSAGE
    },
    success: {
      status: 'success', message: ''
    }
  };

  var SUBMISSION_MAP = {
    error: {
      status: 'error', message: ERROR_PASSWORD_MESSAGE
    },
    success: {
      status: 'success', message: PASSWORD_SUCCESS_MESSAGE
    }
  };

  exports.default = Ember.Component.extend({
    classNames: ['reset-password-form'],
    validation: VALIDATION_MAP['default'],

    actions: {
      validatePassword: function validatePassword() {
        var password = this.get('user.password');
        var validationStatus = (0, _passwordValidator.default)(password) ? 'success' : 'error';
        this.set('validation', VALIDATION_MAP[validationStatus]);
      },
      handleResetPassword: function handleResetPassword() {
        var _this = this;

        return this.get('user').save().then(function () {
          _this.set('validation', SUBMISSION_MAP['success']);
          _this.set('user.password', null);
        }).catch(function () {
          return _this.set('validation', SUBMISSION_MAP['error']);
        });
      }
    }
  });
});
define('pix-live/components/result-item', ['exports', 'pix-live/utils/result-icon-url'], function (exports, _resultIconUrl) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var contentReference = {
    ok: {
      status: 'ok',
      tooltip: 'Réponse correcte'
    },

    ko: {
      status: 'ko',
      tooltip: 'Réponse incorrecte'
    },

    aband: {
      status: 'aband',
      tooltip: 'Sans réponse'
    },

    partially: {
      status: 'partially',
      tooltip: 'Réponse partielle'
    },

    timedout: {
      status: 'timedout',
      tooltip: 'Temps dépassé'
    },

    default: {
      status: 'default',
      tooltip: 'Correction automatique en cours de développement ;)'
    }
  };

  exports.default = Ember.Component.extend({

    classNames: ['result-item'],

    attributeBindings: ['tabindex'],

    tabindex: 0,

    resultItem: Ember.computed('answer.result', function () {
      if (!this.get('answer.result')) return;
      return contentReference[this.get('answer.result')] || contentReference['default'];
    }),

    resultTooltip: Ember.computed('resultItem', function () {
      return this.get('resultItem') ? this.get('resultItem').tooltip : null;
    }),

    resultItemIcon: Ember.computed('resultItem', function () {
      return (0, _resultIconUrl.default)(this.get('resultItem.status'));
    }),

    validationImplementedForChallengeType: Ember.computed('answer.challenge.type', function () {
      var implementedTypes = ['QCM', 'QROC', 'QCU', 'QROCM-ind'];
      var challengeType = this.get('answer.challenge.type');
      return implementedTypes.includes(challengeType);
    }),

    didRender: function didRender() {
      this._super.apply(this, arguments);

      var tooltipElement = this.$('[data-toggle="tooltip"]');
      var tooltipValue = this.get('resultTooltip');

      if (tooltipValue) {
        tooltipElement.tooltip({ title: tooltipValue });
      }
    },


    actions: {
      openComparisonPopin: function openComparisonPopin() {
        var assessmentId = this.get('answer.assessment.id');
        var answerId = this.get('answer.id');
        var index = this.get('index') + 1;

        this.sendAction('openComparison', assessmentId, answerId, index);
      }
    }
  });
});
define('pix-live/components/routable-modal-backdrop', ['exports', 'ember-routable-modal/components/backdrop'], function (exports, _backdrop) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _backdrop.default;
    }
  });
});
define('pix-live/components/routable-modal-close-button', ['exports', 'ember-routable-modal/components/close-button'], function (exports, _closeButton) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _closeButton.default;
    }
  });
});
define('pix-live/components/routable-modal-hold', ['exports', 'ember-routable-modal/components/hold'], function (exports, _hold) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hold.default;
    }
  });
});
define('pix-live/components/routable-modal-outlet', ['exports', 'ember-routable-modal/components/outlet'], function (exports, _outlet) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _outlet.default;
    }
  });
});
define('pix-live/components/score-pastille', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['score-pastille'],
    pixScore: null,

    score: Ember.computed('pixScore', function () {
      var pixScore = this.get('pixScore');
      return Ember.isNone(pixScore) ? '--' : pixScore;
    })
  });
});
define('pix-live/components/scoring-panel-tantpix', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['scoring-panel-tantpix']
  });
});
define('pix-live/components/scoring-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['scoring-panel'],

    assessment: null,

    hasATrophy: Ember.computed.gt('assessment.estimatedLevel', 0),
    hasSomePix: Ember.computed.gt('assessment.pixScore', 0)
  });
});
define('pix-live/components/share-profile', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ORGANIZATION_CODE_PLACEHOLDER = 'Ex: ABCD12';
  var STEP_1_ORGANIZATION_CODE_ENTRY = 'organization-code-entry';
  var STEP_2_SHARING_CONFIRMATION = 'sharing-confirmation';
  var STEP_3_SUCCESS_NOTIFICATION = 'success-notification';

  exports.default = Ember.Component.extend({

    classNames: ['share-profile'],

    // Actions
    searchForOrganization: null,
    shareProfileSnapshot: null,

    // Internals
    _showingModal: false,
    _view: STEP_1_ORGANIZATION_CODE_ENTRY,
    _placeholder: ORGANIZATION_CODE_PLACEHOLDER,
    _code: null,
    _organization: null,
    _organizationNotFound: false,
    _studentCode: null,
    _campaignCode: null,

    // Computed
    stepOrganizationCodeEntry: Ember.computed.equal('_view', STEP_1_ORGANIZATION_CODE_ENTRY),
    stepProfileSharingConfirmation: Ember.computed.equal('_view', STEP_2_SHARING_CONFIRMATION),
    isOrganizationHasTypeSupOrPro: Ember.computed('_organization.type', function () {
      return this.get('_organization.type') === 'SUP' || this.get('_organization.type') === 'PRO';
    }),

    organizationLabels: Ember.computed('_organization.type', function () {
      if (this.get('_organization.type') === 'PRO') {
        return {
          personalCode: 'Veuillez saisir votre ID-Pix :',
          text1: 'Vous vous apprêtez à transmettre une copie de votre profil Pix à l\'organisation :',
          text2: 'En cliquant sur le bouton « Envoyer », vous transmettrez à l\'organisation :',
          text3: 'votre ID-Pix et le code campagne',
          text4: 'L\'organisation ne recevra les évolutions futures de votre profil que si vous l\'envoyez à nouveau.'
        };
      } else if (this.get('_organization.type') === 'SUP') {
        return {
          personalCode: 'Veuillez saisir votre numéro d\'étudiant :',
          text1: 'Vous vous apprêtez à transmettre une copie de votre profil Pix à l\'établissement :',
          text2: 'En cliquant sur le bouton « Envoyer », vous transmettrez à l\'établissement :',
          text3: 'votre numéro d\'étudiant et le code campagne',
          text4: 'L\'établissement ne recevra les évolutions futures de votre profil que si vous l\'envoyez à nouveau.'
        };
      } else {
        return {
          personalCode: 'Veuillez saisir votre numéro INE :',
          text1: 'Vous vous apprêtez à transmettre une copie de votre profil Pix à l\'établissement :',
          text2: 'En cliquant sur le bouton « Envoyer », vous transmettrez à l\'établissement :',
          text3: 'le code campagne',
          text4: 'L\'établissement ne recevra les évolutions futures de votre profil que si vous l\'envoyez à nouveau.'
        };
      }
    }),

    actions: {
      openModal: function openModal() {
        this.set('_showingModal', true);
      },
      closeModal: function closeModal() {
        this.set('_showingModal', false);
        this.set('_view', STEP_1_ORGANIZATION_CODE_ENTRY);
        this.set('_code', null);
        this.set('_organization', null);
        this.set('_organizationNotFound', false);
        this.set('_studentCode', null);
        this.set('_campaignCode', null);
      },
      cancelSharingAndGoBackToOrganizationCodeEntryView: function cancelSharingAndGoBackToOrganizationCodeEntryView() {
        this.set('_view', STEP_1_ORGANIZATION_CODE_ENTRY);
        this.set('_organization', null);
        this.set('_organizationNotFound', false);
        this.set('_studentCode', null);
        this.set('_campaignCode', null);
      },
      findOrganizationAndGoToSharingConfirmationView: function findOrganizationAndGoToSharingConfirmationView() {
        var _this = this;

        this.get('searchForOrganization')(this.get('_code')).then(function (organization) {
          if (organization) {
            _this.set('_view', STEP_2_SHARING_CONFIRMATION);
            _this.set('_organization', organization);
            _this.set('_organizationNotFound', false);
          } else {
            _this.set('_organizationNotFound', true);
          }
        });
      },
      shareSnapshotAndGoToSuccessNotificationView: function shareSnapshotAndGoToSuccessNotificationView() {
        var _this2 = this;

        this.get('shareProfileSnapshot')(this.get('_organization'), this.get('_studentCode'), this.get('_campaignCode')).then(function () {
          _this2.set('_view', STEP_3_SUCCESS_NOTIFICATION);
        });
      },
      focusInOrganizationCodeInput: function focusInOrganizationCodeInput() {
        this.set('_placeholder', null);
      },
      focusOutOrganizationCodeInput: function focusOutOrganizationCodeInput() {
        this.set('_placeholder', ORGANIZATION_CODE_PLACEHOLDER);
      }
    }
  });
});
define("pix-live/components/side-menu-link-to", ["exports", "ember-side-menu/components/side-menu-link-to"], function (exports, _sideMenuLinkTo) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return _sideMenuLinkTo.default;
    }
  });
});
define("pix-live/components/side-menu-toggle", ["exports", "ember-side-menu/components/side-menu-toggle"], function (exports, _sideMenuToggle) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return _sideMenuToggle.default;
    }
  });
});
define("pix-live/components/side-menu", ["exports", "ember-side-menu/components/side-menu"], function (exports, _sideMenu) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return _sideMenu.default;
    }
  });
});
define('pix-live/components/signin-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    classNames: ['signin-form-container'],

    displayErrorMessage: false,
    signin: null,
    email: '',
    password: '',

    actions: {
      submit: function submit() {
        var _this = this;

        this.set('displayErrorMessage', false);
        this.get('onSubmit')(this.get('email'), this.get('password')).catch(function () {
          _this.set('displayErrorMessage', true);
        });
      }
    }

  });
});
define('pix-live/components/signup-form', ['exports', 'pix-live/utils/email-validator', 'pix-live/utils/password-validator', 'pix-live/config/environment'], function (exports, _emailValidator, _passwordValidator, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ERROR_INPUT_MESSAGE_MAP = {
    firstName: 'Votre prénom n’est pas renseigné.',
    lastName: 'Votre nom n’est pas renseigné.',
    email: 'Votre email n’est pas valide.',
    password: 'Votre mot de passe doit comporter au moins une lettre, un chiffre et 8 caractères.'
  };
  var TEMPORARY_DIV_CLASS_MAP = {
    error: 'signup-form__temporary-msg--error',
    success: 'signup-form__temporary-msg--success'
  };

  function getErrorMessage(status, key) {
    return status === 'error' ? ERROR_INPUT_MESSAGE_MAP[key] : null;
  }

  function getValidationStatus(isValidField) {
    return isValidField ? 'error' : 'success';
  }

  function isValuePresent(value) {
    return value.trim() ? true : false;
  }

  exports.default = Ember.Component.extend({
    classNames: ['signup-form'],

    _notificationMessage: null,
    validation: null,
    _tokenHasBeenUsed: null,

    init: function init() {
      this._super.apply(this, arguments);
      this._resetValidationFields();
    },
    _updateValidationStatus: function _updateValidationStatus(key, status, message) {
      var statusObject = 'validation.' + key + '.status';
      var messageObject = 'validation.' + key + '.message';
      this.set(statusObject, status);
      this.set(messageObject, message);
    },
    _getModelAttributeValueFromKey: function _getModelAttributeValueFromKey(key) {
      var userModel = this.get('user');
      return userModel.get(key);
    },
    _toggleConfirmation: function _toggleConfirmation(status, message) {
      var _this = this;

      this.set('temporaryAlert', { status: TEMPORARY_DIV_CLASS_MAP[status], message: message });
      if (_environment.default.APP.isMessageStatusTogglingEnabled) {
        Ember.run.later(function () {
          _this.set('temporaryAlert', { status: 'default', message: '' });
        }, _environment.default.APP.MESSAGE_DISPLAY_DURATION);
      }
    },
    _resetValidationFields: function _resetValidationFields() {
      var defaultValidationObject = {
        lastName: {
          status: 'default',
          message: null
        },
        firstName: {
          status: 'default',
          message: null
        },
        email: {
          status: 'default',
          message: null
        },
        password: {
          status: 'default',
          message: null
        },
        cgu: {
          status: 'default',
          message: null
        },
        recaptchaToken: {
          status: 'default',
          message: null
        }
      };
      this.set('validation', defaultValidationObject);
    },
    _updateInputsStatus: function _updateInputsStatus() {
      var _this2 = this;

      var errors = this.get('user.errors');
      errors.forEach(function (_ref) {
        var attribute = _ref.attribute,
            message = _ref.message;

        _this2._updateValidationStatus(attribute, 'error', message);
      });
    },


    _executeFieldValidation: function _executeFieldValidation(key, isValid) {
      var modelAttrValue = this._getModelAttributeValueFromKey(key);
      var isValidInput = !isValid(modelAttrValue);
      var status = getValidationStatus(isValidInput);
      var message = getErrorMessage(status, key);
      this._updateValidationStatus(key, status, message);
    },

    actions: {
      resetTokenHasBeenUsed: function resetTokenHasBeenUsed() {
        this.set('_tokenHasBeenUsed', false);
      },
      validateInput: function validateInput(key) {
        this._executeFieldValidation(key, isValuePresent);
      },
      validateInputEmail: function validateInputEmail(key) {
        this._executeFieldValidation(key, _emailValidator.default);
      },
      validateInputPassword: function validateInputPassword(key) {
        this._executeFieldValidation(key, _passwordValidator.default);
      },
      signup: function signup() {
        var _this3 = this;

        this.set('_notificationMessage', null);
        this.get('user').save().then(function () {
          var credentials = { email: _this3.get('user.email'), password: _this3.get('user.password') };
          _this3.sendAction('redirectToProfileRoute', credentials);
          _this3.set('_tokenHasBeenUsed', true);
        }).catch(function () {
          _this3._updateInputsStatus();
          _this3.set('_tokenHasBeenUsed', true);
        });
      }
    }
  });
});
define('pix-live/components/snapshot-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    organization: null,
    snapshots: null,
    _hasSnapshots: Ember.computed('snapshots', function () {
      return Ember.isPresent(this.get('snapshots.length')) && this.get('snapshots.length') > 0;
    })

  });
});
define('pix-live/components/tether-dialog', ['exports', 'ember-modal-dialog/components/deprecated-tether-dialog'], function (exports, _deprecatedTetherDialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _deprecatedTetherDialog.default;
    }
  });
});
define('pix-live/components/timeout-jauge', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/config/environment'], function (exports, _lodashCustom, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  // see http://stackoverflow.com/a/37770048/2595513
  function fmtMSS(s) {
    return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
  }

  exports.default = Ember.Component.extend({

    allotedTime: null,

    _totalTime: Ember.computed('allotedTime', function () {
      var actualAllotedTime = Ember.get(this, 'allotedTime');
      if (!_lodashCustom.default.isNumeric(actualAllotedTime)) {
        return 0;
      }
      return 1000 * actualAllotedTime;
    }),
    _tickInterval: 1000,
    _timer: null,
    _elapsedTime: null,
    _currentTime: Date.now(),

    remainingSeconds: Ember.computed('_elapsedTime', function () {
      return _lodashCustom.default.round((Ember.get(this, '_totalTime') - Ember.get(this, '_elapsedTime')) / 1000);
    }),

    remainingTime: Ember.computed('remainingSeconds', function () {
      if (Ember.get(this, 'remainingSeconds') < 0) {
        return '0:00';
      }
      return fmtMSS(Ember.get(this, 'remainingSeconds'));
    }),

    percentageOfTimeout: Ember.computed('_elapsedTime', function () {
      var actualAllotedTime = Ember.get(this, 'allotedTime');
      if (!_lodashCustom.default.isNumeric(actualAllotedTime) || !_lodashCustom.default.isStrictlyPositiveInteger(actualAllotedTime.toString())) {
        return 0;
      }
      return 100 - Ember.get(this, 'remainingSeconds') / actualAllotedTime * 100;
    }),

    jaugeWidthStyle: Ember.computed('percentageOfTimeout', function () {
      return Ember.String.htmlSafe('width: ' + this.get('percentageOfTimeout') + '%');
    }),

    hasFinished: Ember.computed('remainingSeconds', function () {
      return Ember.get(this, 'remainingSeconds') <= 0;
    }),

    _start: function _start() {
      this._stop();
      Ember.set(this, '_currentTime', Date.now());
      this._tick();
    },

    _stop: function _stop() {
      var _timer = Ember.get(this, '_timer');

      if (_timer) {
        Ember.run.cancel(_timer);
        Ember.set(this, '_timer', null);
      }
    },

    _tick: function _tick() {
      if (_environment.default.APP.isTimerCountdownEnabled) {

        var _tickInterval = Ember.get(this, '_tickInterval');
        var _currentTime = Ember.get(this, '_currentTime');
        var _elapsedTime = Ember.get(this, '_elapsedTime');
        var now = Date.now();

        Ember.set(this, '_elapsedTime', _elapsedTime + (now - _currentTime));
        Ember.set(this, '_currentTime', now);
        Ember.set(this, '_timer', Ember.run.later(this, this._tick, _tickInterval));
      }
    },

    init: function init() {
      this._super.apply(this, arguments);
      this._start();
    },
    willDestroyElement: function willDestroyElement() {
      this._stop();
    }
  });
});
define('pix-live/components/trophy-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['trophy-item'],

    level: null
  });
});
define('pix-live/components/tutorial-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['tutorial-item'],

    imageForFormat: {
      'vidéo': 'video',
      'son': 'son',
      'page': 'page'
    },
    tutorial: null,

    displayedDuration: Ember.computed('tutorial', function () {
      var durationByTime = this.get('tutorial').duration.split(':').map(function (duration) {
        return parseInt(duration);
      });

      var HOURS_OF_DURATION = durationByTime[0];
      var MINUTES_OF_DURATION = durationByTime[1];

      if (HOURS_OF_DURATION > 0) {
        return durationByTime[0] + ' h';
      }
      if (MINUTES_OF_DURATION > 0) {
        return durationByTime[1] + ' min';
      }
      return '1 min';
    }),

    formatImageName: Ember.computed('tutorial', function () {
      var format = this.get('tutorial').format;
      if (this.get('imageForFormat')[format]) {
        return this.get('imageForFormat')[format];
      }
      return 'page';
    })

  });
});
define('pix-live/components/tutorial-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['tutorial-panel'],

    hint: null,
    tutorials: null,

    shouldDisplayHintOrTuto: Ember.computed('tutorials', 'hint', function () {
      var tutorials = this.get('tutorials') || [];
      var hint = this.get('hint') || [];

      return hint.length > 0 || tutorials.length > 0;
    }),

    shouldDisplayHint: Ember.computed('hint', function () {
      var hint = this.get('hint') || [];
      return hint.length > 0;
    }),

    shouldDisplayTutorial: Ember.computed('tutorials', function () {
      var tutorials = this.get('tutorials') || [];
      return tutorials.length > 0;
    }),

    limitedTutorials: Ember.computed('tutorials', function () {
      return this.get('tutorials').slice(0, 3);
    })

  });
});
define('pix-live/components/user-certifications-detail-area', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-detail-area'],
    area: null,

    sortedCompetences: Ember.computed('area.resultCompetences.[]', function () {
      return this.get('area.resultCompetences').sortBy('index');
    })
  });
});
define('pix-live/components/user-certifications-detail-competence', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-detail-competence'],
    competence: null,
    levels: [1, 2, 3, 4, 5, 6, 7, 8]

  });
});
define('pix-live/components/user-certifications-detail-header', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-detail-header'],
    certification: null
  });
});
define('pix-live/components/user-certifications-detail-profile', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-detail-profile'],
    resultCompetenceTree: null,

    sortedAreas: Ember.computed('resultCompetenceTree.areas.[]', function () {
      return this.get('resultCompetenceTree.areas').sortBy('code');
    })
  });
});
define('pix-live/components/user-certifications-detail-result', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-detail-result'],
    certification: null
  });
});
define('pix-live/components/user-certifications-panel', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['user-certifications-panel'],
    certifications: null
  });
});
define('pix-live/components/user-logged-menu', ['exports', 'ember-keyboard'], function (exports, _emberKeyboard) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend(_emberKeyboard.EKMixin, {

    session: Ember.inject.service(),
    store: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),

    classNames: ['logged-user-details'],

    keyboardActivated: true,
    _canDisplayMenu: false,
    _user: null,

    canDisplayLinkToProfile: Ember.computed(function () {
      return this.get('routing.currentRouteName') !== 'compte' && this.get('routing.currentRouteName') !== 'board';
    }),

    init: function init() {
      var _this = this;

      this._super.apply(this, arguments);
      this.get('store').findRecord('user', this.get('session.data.authenticated.userId')).then(function (user) {
        return _this.set('_user', user);
      });
    },


    closeOnEsc: Ember.on((0, _emberKeyboard.keyDown)('Escape'), function () {
      this.set('_canDisplayMenu', false);
    }),

    actions: {
      toggleUserMenu: function toggleUserMenu() {
        this.toggleProperty('_canDisplayMenu');
      },
      closeMenu: function closeMenu() {
        this.set('_canDisplayMenu', false);
      }
    }
  });
});
define('pix-live/components/warning-page', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function _pluralize(word, count) {
    if (!count) {
      return '';
    }
    return count > 1 ? count + ' ' + word + 's' : count + ' ' + word;
  }

  function _getMinutes(time) {
    return Math.floor(time / 60);
  }

  function _getSeconds(time) {
    return time % 60;
  }

  function _formatTimeForText(time) {

    if (_lodashCustom.default.isNotInteger(time)) {
      return '';
    }

    var minutes = _getMinutes(time);
    var seconds = _getSeconds(time);

    var formattedMinutes = _pluralize('minute', minutes);
    var formattedSeconds = _pluralize('seconde', seconds);
    var joiningWord = !minutes || !seconds ? '' : ' et ';

    return '' + formattedMinutes + joiningWord + formattedSeconds;
  }

  function _formatTimeForButton(time) {

    if (_lodashCustom.default.isNotInteger(time) || !time) {
      return 0;
    }

    var minutes = _getMinutes(time);
    var seconds = _getSeconds(time);

    var formattedMinutes = minutes;
    var formattedSeconds = seconds < 9 ? '0' + seconds : '' + seconds;

    return formattedMinutes + ':' + formattedSeconds;
  }

  exports.default = Ember.Component.extend({

    allocatedHumanTime: Ember.computed('time', function () {
      return _formatTimeForText(this.get('time'));
    }),

    allocatedTime: Ember.computed('time', function () {
      return _formatTimeForButton(this.get('time'));
    }),

    actions: {
      confirmWarning: function confirmWarning() {
        this.sendAction('hasUserConfirmWarning');
      }
    }
  });
});
define('pix-live/controllers/assessments/checkpoint', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({

    queryParams: ['finalCheckpoint'],
    finalCheckpoint: false,

    buttonText: Ember.computed('finalCheckpoint', function () {
      return this.get('finalCheckpoint') ? 'Voir mes résultats' : 'Je continue';
    }),

    actions: {
      resumeAssessment: function resumeAssessment(assessment) {
        var nextRoute = this.get('finalCheckpoint') ? 'campaigns.skill-review' : 'assessments.resume';
        return this.transitionToRoute(nextRoute, assessment.get('id'));
      },
      openComparison: function openComparison(assessment_id, answer_id, index) {
        return this.transitionToRoute('assessments.comparison', assessment_id, answer_id, index);
      }
    }

  });
});
define('pix-live/controllers/certification-course', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    queryParams: 'code',
    code: null
  });
});
define('pix-live/helpers/abs', ['exports', 'ember-math-helpers/helpers/abs'], function (exports, _abs) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _abs.default;
    }
  });
  Object.defineProperty(exports, 'abs', {
    enumerable: true,
    get: function () {
      return _abs.abs;
    }
  });
});
define('pix-live/helpers/acos', ['exports', 'ember-math-helpers/helpers/acos'], function (exports, _acos) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _acos.default;
    }
  });
  Object.defineProperty(exports, 'acos', {
    enumerable: true,
    get: function () {
      return _acos.acos;
    }
  });
});
define('pix-live/helpers/acosh', ['exports', 'ember-math-helpers/helpers/acosh'], function (exports, _acosh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _acosh.default;
    }
  });
  Object.defineProperty(exports, 'acosh', {
    enumerable: true,
    get: function () {
      return _acosh.acosh;
    }
  });
});
define('pix-live/helpers/add', ['exports', 'ember-math-helpers/helpers/add'], function (exports, _add) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _add.default;
    }
  });
  Object.defineProperty(exports, 'add', {
    enumerable: true,
    get: function () {
      return _add.add;
    }
  });
});
define('pix-live/helpers/and', ['exports', 'ember-truth-helpers/helpers/and'], function (exports, _and) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _and.default;
    }
  });
  Object.defineProperty(exports, 'and', {
    enumerable: true,
    get: function () {
      return _and.and;
    }
  });
});
define('pix-live/helpers/app-version', ['exports', 'pix-live/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;
  function appVersion(_) {
    var hash = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var version = _environment.default.APP.version;
    // e.g. 1.0.0-alpha.1+4jds75hf

    // Allow use of 'hideSha' and 'hideVersion' For backwards compatibility
    var versionOnly = hash.versionOnly || hash.hideSha;
    var shaOnly = hash.shaOnly || hash.hideVersion;

    var match = null;

    if (versionOnly) {
      if (hash.showExtended) {
        match = version.match(_regexp.versionExtendedRegExp); // 1.0.0-alpha.1
      }
      // Fallback to just version
      if (!match) {
        match = version.match(_regexp.versionRegExp); // 1.0.0
      }
    }

    if (shaOnly) {
      match = version.match(_regexp.shaRegExp); // 4jds75hf
    }

    return match ? match[0] : version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});
define('pix-live/helpers/asin', ['exports', 'ember-math-helpers/helpers/asin'], function (exports, _asin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _asin.default;
    }
  });
  Object.defineProperty(exports, 'asin', {
    enumerable: true,
    get: function () {
      return _asin.asin;
    }
  });
});
define('pix-live/helpers/asinh', ['exports', 'ember-math-helpers/helpers/asinh'], function (exports, _asinh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _asinh.default;
    }
  });
  Object.defineProperty(exports, 'asinh', {
    enumerable: true,
    get: function () {
      return _asinh.asinh;
    }
  });
});
define('pix-live/helpers/atan', ['exports', 'ember-math-helpers/helpers/atan'], function (exports, _atan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atan.default;
    }
  });
  Object.defineProperty(exports, 'atan', {
    enumerable: true,
    get: function () {
      return _atan.atan;
    }
  });
});
define('pix-live/helpers/atan2', ['exports', 'ember-math-helpers/helpers/atan2'], function (exports, _atan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atan.default;
    }
  });
  Object.defineProperty(exports, 'atan2', {
    enumerable: true,
    get: function () {
      return _atan.atan2;
    }
  });
});
define('pix-live/helpers/atanh', ['exports', 'ember-math-helpers/helpers/atanh'], function (exports, _atanh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atanh.default;
    }
  });
  Object.defineProperty(exports, 'atanh', {
    enumerable: true,
    get: function () {
      return _atanh.atanh;
    }
  });
});
define('pix-live/helpers/cbrt', ['exports', 'ember-math-helpers/helpers/cbrt'], function (exports, _cbrt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cbrt.default;
    }
  });
  Object.defineProperty(exports, 'cbrt', {
    enumerable: true,
    get: function () {
      return _cbrt.cbrt;
    }
  });
});
define('pix-live/helpers/ceil', ['exports', 'ember-math-helpers/helpers/ceil'], function (exports, _ceil) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ceil.default;
    }
  });
  Object.defineProperty(exports, 'ceil', {
    enumerable: true,
    get: function () {
      return _ceil.ceil;
    }
  });
});
define('pix-live/helpers/clz32', ['exports', 'ember-math-helpers/helpers/clz32'], function (exports, _clz) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _clz.default;
    }
  });
  Object.defineProperty(exports, 'clz32', {
    enumerable: true,
    get: function () {
      return _clz.clz32;
    }
  });
});
define('pix-live/helpers/convert-to-html', ['exports', 'showdown', 'pix-live/utils/lodash-custom'], function (exports, _showdown, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.convertToHtml = convertToHtml;
  function convertToHtml(params) {
    if (_lodashCustom.default.isArray(params) && params.length > 0) {
      var converter = new _showdown.default.Converter();
      return converter.makeHtml(params[0]);
    }
    return '';
  }

  exports.default = Ember.Helper.helper(convertToHtml);
});
define('pix-live/helpers/cos', ['exports', 'ember-math-helpers/helpers/cos'], function (exports, _cos) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cos.default;
    }
  });
  Object.defineProperty(exports, 'cos', {
    enumerable: true,
    get: function () {
      return _cos.cos;
    }
  });
});
define('pix-live/helpers/cosh', ['exports', 'ember-math-helpers/helpers/cosh'], function (exports, _cosh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cosh.default;
    }
  });
  Object.defineProperty(exports, 'cosh', {
    enumerable: true,
    get: function () {
      return _cosh.cosh;
    }
  });
});
define('pix-live/helpers/div', ['exports', 'ember-math-helpers/helpers/div'], function (exports, _div) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _div.default;
    }
  });
  Object.defineProperty(exports, 'div', {
    enumerable: true,
    get: function () {
      return _div.div;
    }
  });
});
define('pix-live/helpers/eq', ['exports', 'ember-truth-helpers/helpers/equal'], function (exports, _equal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _equal.default;
    }
  });
  Object.defineProperty(exports, 'equal', {
    enumerable: true,
    get: function () {
      return _equal.equal;
    }
  });
});
define('pix-live/helpers/exp', ['exports', 'ember-math-helpers/helpers/exp'], function (exports, _exp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _exp.default;
    }
  });
  Object.defineProperty(exports, 'exp', {
    enumerable: true,
    get: function () {
      return _exp.exp;
    }
  });
});
define('pix-live/helpers/expm1', ['exports', 'ember-math-helpers/helpers/expm1'], function (exports, _expm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _expm.default;
    }
  });
  Object.defineProperty(exports, 'expm1', {
    enumerable: true,
    get: function () {
      return _expm.expm1;
    }
  });
});
define('pix-live/helpers/extract-extension', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.extractExtension = extractExtension;
  function extractExtension(params) {
    var parts = params[0].split('.');
    var lastIndex = parts.length - 1;
    return parts[lastIndex];
  }

  exports.default = Ember.Helper.helper(extractExtension);
});
define('pix-live/helpers/floor', ['exports', 'ember-math-helpers/helpers/floor'], function (exports, _floor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _floor.default;
    }
  });
  Object.defineProperty(exports, 'floor', {
    enumerable: true,
    get: function () {
      return _floor.floor;
    }
  });
});
define('pix-live/helpers/fround', ['exports', 'ember-math-helpers/helpers/fround'], function (exports, _fround) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _fround.default;
    }
  });
  Object.defineProperty(exports, 'fround', {
    enumerable: true,
    get: function () {
      return _fround.fround;
    }
  });
});
define('pix-live/helpers/get-challenge-component-class', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getChallengeComponentClass = getChallengeComponentClass;
  function getChallengeComponentClass(params) {
    var result = void 0;
    var challenge = params[0];
    var challengeType = challenge.get('type').toUpperCase();

    if ((0, _lodashCustom.default)(challengeType).isAmongst(['QCUIMG', 'QCU'])) {
      result = 'qcu';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QCMIMG', 'QCM'])) {
      result = 'qcm';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QROC'])) {
      result = 'qroc';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QROCM', 'QROCM-IND', 'QROCM-DEP'])) {
      result = 'qrocm';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QMAIL'])) {
      result = 'qmail';
    }

    return 'challenge-item-' + result;
  }

  exports.default = Ember.Helper.helper(getChallengeComponentClass);
});
define('pix-live/helpers/gt', ['exports', 'ember-truth-helpers/helpers/gt'], function (exports, _gt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gt.default;
    }
  });
  Object.defineProperty(exports, 'gt', {
    enumerable: true,
    get: function () {
      return _gt.gt;
    }
  });
});
define('pix-live/helpers/gte', ['exports', 'ember-truth-helpers/helpers/gte'], function (exports, _gte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gte.default;
    }
  });
  Object.defineProperty(exports, 'gte', {
    enumerable: true,
    get: function () {
      return _gte.gte;
    }
  });
});
define('pix-live/helpers/hypot', ['exports', 'ember-math-helpers/helpers/hypot'], function (exports, _hypot) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hypot.default;
    }
  });
  Object.defineProperty(exports, 'hypot', {
    enumerable: true,
    get: function () {
      return _hypot.hypot;
    }
  });
});
define('pix-live/helpers/ignore-children', ['exports', 'ember-ignore-children-helper/helpers/ignore-children'], function (exports, _ignoreChildren) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ignoreChildren.default;
    }
  });
  Object.defineProperty(exports, 'ignoreChildren', {
    enumerable: true,
    get: function () {
      return _ignoreChildren.ignoreChildren;
    }
  });
});
define('pix-live/helpers/imul', ['exports', 'ember-math-helpers/helpers/imul'], function (exports, _imul) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _imul.default;
    }
  });
  Object.defineProperty(exports, 'imul', {
    enumerable: true,
    get: function () {
      return _imul.imul;
    }
  });
});
define('pix-live/helpers/inc', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.inc = inc;
  function inc(params) {
    return params[0] + 1;
  }

  exports.default = Ember.Helper.helper(inc);
});
define('pix-live/helpers/is-after', ['exports', 'ember-moment/helpers/is-after'], function (exports, _isAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isAfter.default;
    }
  });
});
define('pix-live/helpers/is-array', ['exports', 'ember-truth-helpers/helpers/is-array'], function (exports, _isArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isArray.default;
    }
  });
  Object.defineProperty(exports, 'isArray', {
    enumerable: true,
    get: function () {
      return _isArray.isArray;
    }
  });
});
define('pix-live/helpers/is-before', ['exports', 'ember-moment/helpers/is-before'], function (exports, _isBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBefore.default;
    }
  });
});
define('pix-live/helpers/is-between', ['exports', 'ember-moment/helpers/is-between'], function (exports, _isBetween) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBetween.default;
    }
  });
});
define('pix-live/helpers/is-equal', ['exports', 'ember-truth-helpers/helpers/is-equal'], function (exports, _isEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
  Object.defineProperty(exports, 'isEqual', {
    enumerable: true,
    get: function () {
      return _isEqual.isEqual;
    }
  });
});
define('pix-live/helpers/is-same-or-after', ['exports', 'ember-moment/helpers/is-same-or-after'], function (exports, _isSameOrAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrAfter.default;
    }
  });
});
define('pix-live/helpers/is-same-or-before', ['exports', 'ember-moment/helpers/is-same-or-before'], function (exports, _isSameOrBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrBefore.default;
    }
  });
});
define('pix-live/helpers/is-same', ['exports', 'ember-moment/helpers/is-same'], function (exports, _isSame) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSame.default;
    }
  });
});
define('pix-live/helpers/log-e', ['exports', 'ember-math-helpers/helpers/log-e'], function (exports, _logE) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _logE.default;
    }
  });
  Object.defineProperty(exports, 'logE', {
    enumerable: true,
    get: function () {
      return _logE.logE;
    }
  });
});
define('pix-live/helpers/log10', ['exports', 'ember-math-helpers/helpers/log10'], function (exports, _log) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log.default;
    }
  });
  Object.defineProperty(exports, 'log10', {
    enumerable: true,
    get: function () {
      return _log.log10;
    }
  });
});
define('pix-live/helpers/log1p', ['exports', 'ember-math-helpers/helpers/log1p'], function (exports, _log1p) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log1p.default;
    }
  });
  Object.defineProperty(exports, 'log1p', {
    enumerable: true,
    get: function () {
      return _log1p.log1p;
    }
  });
});
define('pix-live/helpers/log2', ['exports', 'ember-math-helpers/helpers/log2'], function (exports, _log) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log.default;
    }
  });
  Object.defineProperty(exports, 'log2', {
    enumerable: true,
    get: function () {
      return _log.log2;
    }
  });
});
define('pix-live/helpers/lt', ['exports', 'ember-truth-helpers/helpers/lt'], function (exports, _lt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lt.default;
    }
  });
  Object.defineProperty(exports, 'lt', {
    enumerable: true,
    get: function () {
      return _lt.lt;
    }
  });
});
define('pix-live/helpers/lte', ['exports', 'ember-truth-helpers/helpers/lte'], function (exports, _lte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lte.default;
    }
  });
  Object.defineProperty(exports, 'lte', {
    enumerable: true,
    get: function () {
      return _lte.lte;
    }
  });
});
define('pix-live/helpers/max', ['exports', 'ember-math-helpers/helpers/max'], function (exports, _max) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _max.default;
    }
  });
  Object.defineProperty(exports, 'max', {
    enumerable: true,
    get: function () {
      return _max.max;
    }
  });
});
define('pix-live/helpers/min', ['exports', 'ember-math-helpers/helpers/min'], function (exports, _min) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _min.default;
    }
  });
  Object.defineProperty(exports, 'min', {
    enumerable: true,
    get: function () {
      return _min.min;
    }
  });
});
define('pix-live/helpers/mod', ['exports', 'ember-math-helpers/helpers/mod'], function (exports, _mod) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mod.default;
    }
  });
  Object.defineProperty(exports, 'mod', {
    enumerable: true,
    get: function () {
      return _mod.mod;
    }
  });
});
define('pix-live/helpers/moment-add', ['exports', 'ember-moment/helpers/moment-add'], function (exports, _momentAdd) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentAdd.default;
    }
  });
});
define('pix-live/helpers/moment-calendar', ['exports', 'ember-moment/helpers/moment-calendar'], function (exports, _momentCalendar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentCalendar.default;
    }
  });
});
define('pix-live/helpers/moment-diff', ['exports', 'ember-moment/helpers/moment-diff'], function (exports, _momentDiff) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDiff.default;
    }
  });
});
define('pix-live/helpers/moment-duration', ['exports', 'ember-moment/helpers/moment-duration'], function (exports, _momentDuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDuration.default;
    }
  });
});
define('pix-live/helpers/moment-format', ['exports', 'ember-moment/helpers/moment-format'], function (exports, _momentFormat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFormat.default;
    }
  });
});
define('pix-live/helpers/moment-from-now', ['exports', 'ember-moment/helpers/moment-from-now'], function (exports, _momentFromNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFromNow.default;
    }
  });
});
define('pix-live/helpers/moment-from', ['exports', 'ember-moment/helpers/moment-from'], function (exports, _momentFrom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFrom.default;
    }
  });
});
define('pix-live/helpers/moment-subtract', ['exports', 'ember-moment/helpers/moment-subtract'], function (exports, _momentSubtract) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentSubtract.default;
    }
  });
});
define('pix-live/helpers/moment-to-date', ['exports', 'ember-moment/helpers/moment-to-date'], function (exports, _momentToDate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToDate.default;
    }
  });
});
define('pix-live/helpers/moment-to-now', ['exports', 'ember-moment/helpers/moment-to-now'], function (exports, _momentToNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToNow.default;
    }
  });
});
define('pix-live/helpers/moment-to', ['exports', 'ember-moment/helpers/moment-to'], function (exports, _momentTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentTo.default;
    }
  });
});
define('pix-live/helpers/moment-unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
define('pix-live/helpers/moment', ['exports', 'ember-moment/helpers/moment'], function (exports, _moment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _moment.default;
    }
  });
});
define('pix-live/helpers/mult', ['exports', 'ember-math-helpers/helpers/mult'], function (exports, _mult) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mult.default;
    }
  });
  Object.defineProperty(exports, 'mult', {
    enumerable: true,
    get: function () {
      return _mult.mult;
    }
  });
});
define('pix-live/helpers/not-eq', ['exports', 'ember-truth-helpers/helpers/not-equal'], function (exports, _notEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _notEqual.default;
    }
  });
  Object.defineProperty(exports, 'notEq', {
    enumerable: true,
    get: function () {
      return _notEqual.notEq;
    }
  });
});
define('pix-live/helpers/not', ['exports', 'ember-truth-helpers/helpers/not'], function (exports, _not) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _not.default;
    }
  });
  Object.defineProperty(exports, 'not', {
    enumerable: true,
    get: function () {
      return _not.not;
    }
  });
});
define('pix-live/helpers/now', ['exports', 'ember-moment/helpers/now'], function (exports, _now) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _now.default;
    }
  });
});
define('pix-live/helpers/or', ['exports', 'ember-truth-helpers/helpers/or'], function (exports, _or) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _or.default;
    }
  });
  Object.defineProperty(exports, 'or', {
    enumerable: true,
    get: function () {
      return _or.or;
    }
  });
});
define('pix-live/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _pluralize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pluralize.default;
});
define('pix-live/helpers/pow', ['exports', 'ember-math-helpers/helpers/pow'], function (exports, _pow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pow.default;
    }
  });
  Object.defineProperty(exports, 'pow', {
    enumerable: true,
    get: function () {
      return _pow.pow;
    }
  });
});
define('pix-live/helpers/property-of', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.propertyOf = propertyOf;
  function propertyOf(params) {
    var map = params[0];
    var key = params[1];
    if (_lodashCustom.default.isObject(map) && _lodashCustom.default.isString(key)) {
      return map[key];
    }
    return '';
  }

  exports.default = Ember.Helper.helper(propertyOf);
});
define('pix-live/helpers/random', ['exports', 'ember-math-helpers/helpers/random'], function (exports, _random) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _random.default;
    }
  });
  Object.defineProperty(exports, 'random', {
    enumerable: true,
    get: function () {
      return _random.random;
    }
  });
});
define('pix-live/helpers/round', ['exports', 'ember-math-helpers/helpers/round'], function (exports, _round) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _round.default;
    }
  });
  Object.defineProperty(exports, 'round', {
    enumerable: true,
    get: function () {
      return _round.round;
    }
  });
});
define('pix-live/helpers/route-action', ['exports', 'ember-route-action-helper/helpers/route-action'], function (exports, _routeAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _routeAction.default;
    }
  });
});
define('pix-live/helpers/sign', ['exports', 'ember-math-helpers/helpers/sign'], function (exports, _sign) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sign.default;
    }
  });
  Object.defineProperty(exports, 'sign', {
    enumerable: true,
    get: function () {
      return _sign.sign;
    }
  });
});
define('pix-live/helpers/sin', ['exports', 'ember-math-helpers/helpers/sin'], function (exports, _sin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sin.default;
    }
  });
  Object.defineProperty(exports, 'sin', {
    enumerable: true,
    get: function () {
      return _sin.sin;
    }
  });
});
define('pix-live/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _singularize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _singularize.default;
});
define('pix-live/helpers/sqrt', ['exports', 'ember-math-helpers/helpers/sqrt'], function (exports, _sqrt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sqrt.default;
    }
  });
  Object.defineProperty(exports, 'sqrt', {
    enumerable: true,
    get: function () {
      return _sqrt.sqrt;
    }
  });
});
define('pix-live/helpers/strip-instruction', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.stripInstruction = stripInstruction;
  function stripInstruction(params) {
    var result = Ember.$(params[0]).text();
    result = result.substr(0, 70);
    result += '...';
    return result;
  }

  exports.default = Ember.Helper.helper(stripInstruction);
});
define('pix-live/helpers/sub', ['exports', 'ember-math-helpers/helpers/sub'], function (exports, _sub) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sub.default;
    }
  });
  Object.defineProperty(exports, 'sub', {
    enumerable: true,
    get: function () {
      return _sub.sub;
    }
  });
});
define('pix-live/helpers/tan', ['exports', 'ember-math-helpers/helpers/tan'], function (exports, _tan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tan.default;
    }
  });
  Object.defineProperty(exports, 'tan', {
    enumerable: true,
    get: function () {
      return _tan.tan;
    }
  });
});
define('pix-live/helpers/tanh', ['exports', 'ember-math-helpers/helpers/tanh'], function (exports, _tanh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tanh.default;
    }
  });
  Object.defineProperty(exports, 'tanh', {
    enumerable: true,
    get: function () {
      return _tanh.tanh;
    }
  });
});
define('pix-live/helpers/trunc', ['exports', 'ember-math-helpers/helpers/trunc'], function (exports, _trunc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trunc.default;
    }
  });
  Object.defineProperty(exports, 'trunc', {
    enumerable: true,
    get: function () {
      return _trunc.trunc;
    }
  });
});
define('pix-live/helpers/unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
define('pix-live/helpers/utc', ['exports', 'ember-moment/helpers/utc'], function (exports, _utc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _utc.default;
    }
  });
  Object.defineProperty(exports, 'utc', {
    enumerable: true,
    get: function () {
      return _utc.utc;
    }
  });
});
define('pix-live/helpers/xor', ['exports', 'ember-truth-helpers/helpers/xor'], function (exports, _xor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _xor.default;
    }
  });
  Object.defineProperty(exports, 'xor', {
    enumerable: true,
    get: function () {
      return _xor.xor;
    }
  });
});
define('pix-live/initializers/add-modals-container', ['exports', 'ember-modal-dialog/initializers/add-modals-container'], function (exports, _addModalsContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'add-modals-container',
    initialize: _addModalsContainer.default
  };
});
define('pix-live/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'pix-live/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var name = void 0,
      version = void 0;
  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
define('pix-live/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('pix-live/initializers/ember-cli-mirage', ['exports', 'pix-live/config/environment', 'pix-live/mirage/config', 'ember-cli-mirage/get-rfc232-test-context', 'ember-cli-mirage/start-mirage'], function (exports, _environment, _config, _getRfc232TestContext, _startMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.startMirage = startMirage;
  exports.default = {
    name: 'ember-cli-mirage',
    initialize: function initialize(application) {
      if (_config.default) {
        application.register('mirage:base-config', _config.default, { instantiate: false });
      }
      if (_config.testConfig) {
        application.register('mirage:test-config', _config.testConfig, { instantiate: false });
      }

      _environment.default['ember-cli-mirage'] = _environment.default['ember-cli-mirage'] || {};
      if (_shouldUseMirage(_environment.default.environment, _environment.default['ember-cli-mirage'])) {
        startMirage(_environment.default);
      }
    }
  };
  function startMirage() {
    var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _environment.default;

    return (0, _startMirage.default)(null, { env: env, baseConfig: _config.default, testConfig: _config.testConfig });
  }

  function _shouldUseMirage(env, addonConfig) {
    if (typeof FastBoot !== 'undefined') {
      return false;
    }
    if ((0, _getRfc232TestContext.default)()) {
      return false;
    }
    var userDeclaredEnabled = typeof addonConfig.enabled !== 'undefined';
    var defaultEnabled = _defaultEnabled(env, addonConfig);

    return userDeclaredEnabled ? addonConfig.enabled : defaultEnabled;
  }

  /*
    Returns a boolean specifying the default behavior for whether
    to initialize Mirage.
  */
  function _defaultEnabled(env, addonConfig) {
    var usingInDev = env === 'development' && !addonConfig.usingProxy;
    var usingInTest = env === 'test';

    return usingInDev || usingInTest;
  }
});
define('pix-live/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _setupContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
});
define('pix-live/initializers/ember-keyboard-first-responder-inputs', ['exports', 'ember-keyboard/initializers/ember-keyboard-first-responder-inputs'], function (exports, _emberKeyboardFirstResponderInputs) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberKeyboardFirstResponderInputs.default;
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function () {
      return _emberKeyboardFirstResponderInputs.initialize;
    }
  });
});
define('pix-live/initializers/ember-routable-modal', ['exports', 'pix-live/config/environment', 'ember-routable-modal/configuration'], function (exports, _environment, _configuration) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = {
        name: 'ember-routable-modal',
        initialize: function initialize() {
            var config = _environment.default['ember-routable-modal'] || {};
            _configuration.default.load(config);

            Ember.Router.reopen({
                currentRoutedModalService: Ember.inject.service('current-routed-modal'),
                currentRoutedModalWillTransition: function () {
                    this.get('currentRoutedModalService').clear();
                }.on('willTransition')
            });
        }
    };
});
define('pix-live/initializers/ember-simple-auth', ['exports', 'pix-live/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service', 'ember-simple-auth/initializers/setup-session-restoration'], function (exports, _environment, _configuration, _setupSession, _setupSessionService, _setupSessionRestoration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize: function initialize(registry) {
      var config = _environment.default['ember-simple-auth'] || {};
      config.baseURL = _environment.default.rootURL || _environment.default.baseURL;
      _configuration.default.load(config);

      (0, _setupSession.default)(registry);
      (0, _setupSessionService.default)(registry);
      (0, _setupSessionRestoration.default)(registry);
    }
  };
});
define('pix-live/initializers/export-application-global', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('pix-live/initializers/jquery-tabbable', ['exports', 'ember-tabbable/initializers/jquery-tabbable'], function (exports, _jqueryTabbable) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _jqueryTabbable.default;
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function () {
      return _jqueryTabbable.initialize;
    }
  });
});
define('pix-live/initializers/metrics', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    var _config$metricsAdapte = _environment.default.metricsAdapters,
        metricsAdapters = _config$metricsAdapte === undefined ? [] : _config$metricsAdapte;
    var _config$environment = _environment.default.environment,
        environment = _config$environment === undefined ? 'development' : _config$environment;

    var options = { metricsAdapters: metricsAdapters, environment: environment };

    application.register('config:metrics', options, { instantiate: false });
    application.inject('service:metrics', 'options', 'config:metrics');
  }

  exports.default = {
    name: 'metrics',
    initialize: initialize
  };
});
define('pix-live/initializers/responsive', ['exports', 'ember-responsive/initializers/responsive'], function (exports, _responsive) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'responsive',
    initialize: _responsive.initialize
  };
});
define("pix-live/initializers/side-menu", ["exports", "ember-side-menu/initializers/side-menu"], function (exports, _sideMenu) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function () {
      return _sideMenu.default;
    }
  });
  Object.defineProperty(exports, "initialize", {
    enumerable: true,
    get: function () {
      return _sideMenu.initialize;
    }
  });
});
define('pix-live/instance-initializers/ember-cli-mirage-autostart', ['exports', 'ember-cli-mirage/instance-initializers/ember-cli-mirage-autostart'], function (exports, _emberCliMirageAutostart) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberCliMirageAutostart.default;
    }
  });
});
define("pix-live/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (exports, _initializeStoreService) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: "ember-data",
    initialize: _initializeStoreService.default
  };
});
define('pix-live/instance-initializers/ember-simple-auth', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize: function initialize() {}
  };
});
define('pix-live/instance-initializers/raven-setup', ['exports', 'ember-cli-sentry', 'pix-live/config/environment'], function (exports, _emberCliSentry, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'sentry-setup',
    initialize: function initialize(application) {
      (0, _emberCliSentry.initialize)(application.lookup ? application : application.container, _environment.default);
    }
  };
});
define('pix-live/mirage/config', ['exports', 'pix-live/mirage/routes/get-answer', 'pix-live/mirage/routes/get-answer-by-challenge-and-assessment', 'pix-live/mirage/routes/get-assessment', 'pix-live/mirage/routes/get-user-me', 'pix-live/mirage/routes/get-challenge', 'pix-live/mirage/routes/get-challenges', 'pix-live/mirage/routes/get-course', 'pix-live/mirage/routes/get-courses', 'pix-live/mirage/routes/get-courses-of-the-week', 'pix-live/mirage/routes/get-next-challenge', 'pix-live/mirage/routes/get-organizations', 'pix-live/mirage/routes/get-snapshots', 'pix-live/mirage/routes/get-corrections', 'pix-live/mirage/routes/patch-answer', 'pix-live/mirage/routes/post-answers', 'pix-live/mirage/routes/post-assessments', 'pix-live/mirage/routes/post-authentications', 'pix-live/mirage/routes/post-certification-course', 'pix-live/mirage/routes/post-feedbacks', 'ember-cli-mirage'], function (exports, _getAnswer, _getAnswerByChallengeAndAssessment, _getAssessment, _getUserMe, _getChallenge, _getChallenges, _getCourse, _getCourses, _getCoursesOfTheWeek, _getNextChallenge, _getOrganizations, _getSnapshots, _getCorrections, _patchAnswer, _postAnswers, _postAssessments, _postAuthentications, _postCertificationCourse, _postFeedbacks, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    this.logging = true;
    this.passthrough('/write-coverage');
    this.post('https://fonts.googleapis.com/**', function () {});

    this.urlPrefix = 'http://localhost:3000';
    this.namespace = '/api';
    this.timing = 0; // response delay

    this.get('/courses', _getCourses.default);
    this.get('/courses?isCourseOfTheWeek=true', _getCoursesOfTheWeek.default);

    this.get('/challenges', _getChallenges.default);
    this.get('/challenges/:id', _getChallenge.default);

    this.post('/assessments', _postAssessments.default);
    this.get('/assessments');
    this.get('/assessments/:id', _getAssessment.default);
    this.get('/assessments/:assessmentId/next/:challengeId', _getNextChallenge.default);
    this.get('/assessments/:assessmentId/next', _getNextChallenge.default);

    this.post('/answers', _postAnswers.default);
    this.get('/answers/:id', _getAnswer.default);
    this.get('/answers', _getAnswerByChallengeAndAssessment.default);
    this.patch('/answers/:id', _patchAnswer.default);

    this.post('/feedbacks', _postFeedbacks.default);

    //Nouveau Mirage

    //Courses
    this.get('/courses/:id', _getCourse.default);
    this.post('/courses', _postCertificationCourse.default);

    this.get('/certifications');

    this.post('/authentications', _postAuthentications.default);
    this.get('/users/me', _getUserMe.default);
    this.get('/competences/:id');
    this.get('/areas/:id');
    this.get('/organizations/:id');

    this.get('/organizations', _getOrganizations.default);

    this.get('/corrections', _getCorrections.default);

    this.post('/snapshots');
    this.get('/snapshots/:id');
    this.get('/organizations/:id/snapshots', _getSnapshots.default);

    this.post('/users');
    this.post('/assessment-results');

    this.del('/cache', function () {
      return null;
    }, 204);

    this.post('/password-reset-demands', function (schema, request) {
      var attrs = JSON.parse(request.requestBody);
      var sentEmail = attrs.data.attributes.email;
      var matchingAccount = schema.users.findBy({ email: sentEmail });

      if (matchingAccount !== null) {
        return schema.passwordResetDemands.create({ email: sentEmail });
      } else {
        return new _emberCliMirage.Response(400);
      }
    });

    this.get('/skill-reviews/:id');
  };
});
define('pix-live/mirage/data/answers/ref-qcm-answer', ['exports', 'pix-live/mirage/data/challenges/ref-qcm-challenge'], function (exports, _refQcmChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_answer_qcm_id',
      attributes: {
        value: '2,4',
        result: 'ko'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refQcmChallenge.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/answers/ref-qcu-answer', ['exports', 'pix-live/mirage/data/challenges/ref-qcu-challenge'], function (exports, _refQcuChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_answer_qcu_id',
      attributes: {
        value: '2',
        result: 'ok'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refQcuChallenge.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/answers/ref-qroc-answer', ['exports', 'pix-live/mirage/data/challenges/ref-qroc-challenge'], function (exports, _refQrocChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_answer_qroc_id',
      attributes: {
        value: 'Bill',
        result: 'pending'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refQrocChallenge.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/answers/ref-qrocm-answer', ['exports', 'pix-live/mirage/data/challenges/ref-qrocm-challenge'], function (exports, _refQrocmChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_answer_qrocm_id',
      attributes: {
        value: 'logiciel1: word\nlogiciel2: excel\nlogiciel3: powerpoint',
        result: 'partially'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refQrocmChallenge.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/answers/ref-timed-answer-bis', ['exports', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis'], function (exports, _refTimedChallengeBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_timed_answer_bis_id',
      attributes: {
        value: '',
        result: 'aband'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refTimedChallengeBis.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_timed_challenge_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/answers/ref-timed-answer', ['exports', 'pix-live/mirage/data/challenges/ref-timed-challenge'], function (exports, _refTimedChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'answers',
      id: 'ref_timed_answer_id',
      attributes: {
        value: '',
        result: 'aband'
      },
      relationships: {
        challenge: {
          data: {
            type: 'challenges',
            id: _refTimedChallenge.default.data.id
          }
        },
        assessment: {
          data: {
            type: 'assessments',
            id: 'ref_timed_challenge_assessment_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/data/assessments/ref-assessment-timed-challenges', ['exports', 'pix-live/mirage/data/courses/ref-course-timed-challenges', 'pix-live/mirage/data/answers/ref-timed-answer', 'pix-live/mirage/data/answers/ref-timed-answer-bis'], function (exports, _refCourseTimedChallenges, _refTimedAnswer, _refTimedAnswerBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'assessments',
      id: 'ref_timed_challenge_assessment_id',
      attributes: {
        'user-id': 'user_id',
        'user-name': 'Jon Snow',
        'user-email': 'jsnow@winterfell.got'
      },
      relationships: {
        course: {
          data: {
            type: 'courses',
            id: _refCourseTimedChallenges.default.data.id
          }
        },
        answers: {
          data: [{
            type: 'answers',
            id: _refTimedAnswer.default.data.id
          }, {
            type: 'answers',
            id: _refTimedAnswerBis.default.data.id
          }]
        }
      }
    }
  };
});
define('pix-live/mirage/data/assessments/ref-assessment', ['exports', 'pix-live/mirage/data/courses/ref-course', 'pix-live/mirage/data/answers/ref-qcu-answer', 'pix-live/mirage/data/answers/ref-qcm-answer', 'pix-live/mirage/data/answers/ref-qroc-answer', 'pix-live/mirage/data/answers/ref-qrocm-answer'], function (exports, _refCourse, _refQcuAnswer, _refQcmAnswer, _refQrocAnswer, _refQrocmAnswer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'assessments',
      id: 'ref_assessment_id',
      attributes: {
        'user-id': 'user_id',
        'user-name': 'Jon Snow',
        'user-email': 'jsnow@winterfell.got'
      },
      relationships: {
        course: {
          data: {
            type: 'courses',
            id: _refCourse.default.data.id
          }
        },
        answers: {
          data: [{
            type: 'answers',
            id: _refQcmAnswer.default.data.id
          }, {
            type: 'answers',
            id: _refQcuAnswer.default.data.id
          }, {
            type: 'answers',
            id: _refQrocAnswer.default.data.id
          }, {
            type: 'answers',
            id: _refQrocmAnswer.default.data.id
          }]
        }
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-qcm-challenge', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_qcm_challenge_id',
      attributes: {
        type: 'QCM',
        timer: 2,
        instruction: 'Un QCM propose plusieurs choix, l\'utilisateur peut en choisir [plusieurs](http://link.plusieurs.url)',
        attachments: ['http://example_of_url'],
        'illustration-url': 'http://fakeimg.pl/350x200/?text=PictureOfQCM',
        proposals: '- possibilite 1, et/ou' + '\n - possibilite 2, et/ou' + '\n - possibilite 3, et/ou' + '\n - possibilite 4'
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-qcu-challenge', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_qcu_challenge_id',
      attributes: {
        type: 'QCU',
        'illustration-url': 'http://fakeimg.pl/350x200/?text=QCU',
        attachments: ['file.docx', 'file.odt'],
        instruction: 'Un QCU propose plusieurs choix, l\'utilisateur peut en choisir [un seul](http://link.unseul.url)',
        proposals: '' + '- 1ere possibilite\n ' + '- 2eme possibilite\n ' + '- 3eme possibilite\n' + '- 4eme possibilite',
        'embed-url': 'https://1024pix.github.io/dessin.html',
        'embed-title': 'Notre premier embed',
        'embed-height': 600
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-qroc-challenge', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_qroc_challenge_id',
      attributes: {
        type: 'QROC',
        instruction: 'Un QROC est une question ouverte avec un simple champ texte libre pour répondre',
        proposals: 'Entrez le prénom de B. Gates : ${firstname#prénom} (en toutes lettres)\nSVP'
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-qrocm-challenge', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_qrocm_challenge_id',
      attributes: {
        type: 'QROCM',
        instruction: 'Un QROCM est une question [ouverte](http://link.ouverte.url) avec plusieurs champs texte libre pour repondre',
        proposals: 'Trois logiciels libres : ${logiciel1#un} ${logiciel2#deux} ${logiciel3#trois}\nMerci'
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-timed-challenge-bis', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_timed_challenge_bis_id',
      attributes: {
        type: 'QCU',
        timer: 5,
        'illustration-url': 'http://fakeimg.pl/350x200/?text=QRU',
        attachments: ['http://example_of_url'],
        instruction: 'Une question timée contient un décompte en bas a droite qui se decremente à chaque seconde ',
        proposals: '' + '- Une seule possibilite '
      }
    }
  };
});
define('pix-live/mirage/data/challenges/ref-timed-challenge', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'challenge',
      id: 'ref_timed_challenge_id',
      attributes: {
        type: 'QCU',
        timer: 5,
        'illustration-url': 'http://fakeimg.pl/350x200/?text=QRU',
        attachments: ['http://example_of_url'],
        instruction: 'Une question timée contient un décompte en bas a droite qui se decremente à chaque seconde ',
        proposals: '' + '- Une seule possibilite '
      }
    }
  };
});
define('pix-live/mirage/data/courses/highlighted-course', ['exports', 'pix-live/mirage/data/challenges/ref-qcm-challenge'], function (exports, _refQcmChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'courses',
      id: 'highligthed_course_id',
      attributes: {
        name: 'Traiter des données',
        description: 'Recherche d\'information, gestion et traitement de données.',
        'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course'
      },
      relationships: {
        challenges: {
          data: [{
            type: 'challenges',
            id: _refQcmChallenge.default.data.id
          }]
        }
      }
    }
  };
});
define('pix-live/mirage/data/courses/ref-course-timed-challenges', ['exports', 'pix-live/mirage/data/challenges/ref-timed-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis'], function (exports, _refTimedChallenge, _refTimedChallengeBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'courses',
      id: 'ref_timed_challenge_course_id',
      attributes: {
        name: 'Course with timed challenges',
        description: 'Contient uniquement des épreuves timées',
        duration: 10,
        'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course'
      },
      relationships: {
        challenges: {
          data: [{
            type: 'challenges',
            id: _refTimedChallenge.default.data.id
          }, {
            type: 'challenges',
            id: _refTimedChallengeBis.default.data.id
          }]
        }
      }
    }
  };
});
define('pix-live/mirage/data/courses/ref-course', ['exports', 'pix-live/mirage/data/challenges/ref-qcm-challenge', 'pix-live/mirage/data/challenges/ref-qcu-challenge', 'pix-live/mirage/data/challenges/ref-qroc-challenge', 'pix-live/mirage/data/challenges/ref-qrocm-challenge'], function (exports, _refQcmChallenge, _refQcuChallenge, _refQrocChallenge, _refQrocmChallenge) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'courses',
      id: 'ref_course_id',
      attributes: {
        name: 'First Course',
        description: 'Contient toutes sortes d\'epreuves avec différentes caractéristiques couvrant tous les cas d\'usage.',
        duration: 10,
        'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course'
      },
      relationships: {
        challenges: {
          data: [{
            type: 'challenges',
            id: _refQcmChallenge.default.data.id
          }, {
            type: 'challenges',
            id: _refQcuChallenge.default.data.id
          }, {
            type: 'challenges',
            id: _refQrocChallenge.default.data.id
          }, {
            type: 'challenges',
            id: _refQrocmChallenge.default.data.id
          }]
        }
      }
    }
  };
});
define('pix-live/mirage/data/feedbacks/ref-feedback', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    data: {
      type: 'feedbacks',
      id: 'ref_feedback_id',
      attributes: {
        email: 'shi@fu.me',
        content: 'Some content'
      },
      relationships: {
        assessment: {
          data: {
            type: 'assessment',
            id: 'assessment_id'
          }
        },
        challenge: {
          data: {
            type: 'challenge',
            id: 'challenge_id'
          }
        }
      }
    }
  };
});
define('pix-live/mirage/factories/area', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({});
});
define('pix-live/mirage/factories/certification', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({});
});
define('pix-live/mirage/factories/challenge', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    type: function type() {
      return 'QROC';
    },
    instruction: function instruction() {
      return 'Dans le village de Montrésor (37, France), sur quelle rue débouche la rue des Perrières ?';
    },
    proposals: function proposals() {
      return 'Rue de : ${Rue#}';
    }
  });
});
define('pix-live/mirage/factories/competence', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({});
});
define('pix-live/mirage/factories/correction', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    solution: function solution() {
      return '2';
    },
    hint: function hint(i) {
      return 'Hint number ' + i;
    }
  });
});
define('pix-live/mirage/factories/course', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    name: function name(i) {
      return 'course ' + i;
    }
  });
});
define('pix-live/mirage/factories/organization', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    name: function name(i) {
      return 'Organization ' + i;
    },
    email: function email() {
      return _emberCliMirage.faker.internet.email();
    },
    type: function type() {
      return 'SCO';
    },
    code: function code(i) {
      return 'ABCD0' + i;
    }
  });
});
define('pix-live/mirage/factories/skill-review', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    profileMastery: function profileMastery() {
      return '0.651';
    }
  });
});
define('pix-live/mirage/factories/snapshot', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({

    score: _emberCliMirage.faker.random.number(),

    creationDate: _emberCliMirage.faker.date.recent(),

    testsFinished: function testsFinished() {
      return _emberCliMirage.faker.list.random(2, 3, 4, 8, 10, 12)();
    }

  });
});
define('pix-live/mirage/factories/user', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.Factory.extend({
    firstName: function firstName() {
      return _emberCliMirage.faker.name.firstName();
    },
    lastName: function lastName() {
      return _emberCliMirage.faker.name.lastName();
    },
    email: function email() {
      return _emberCliMirage.faker.internet.email();
    },
    password: function password() {
      return _emberCliMirage.faker.internet.password();
    },
    cgu: function cgu() {
      return _emberCliMirage.faker.random.boolean();
    },
    totalPixScore: function totalPixScore() {
      return _emberCliMirage.faker.random.number();
    },
    recaptchaToken: function recaptchaToken() {
      return _emberCliMirage.faker.random.uuid();
    }
  });
});
define('pix-live/mirage/fixtures/answers', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 'ref_answer_qcm_id', value: '2, 4', result: 'ko', challengeId: 'ref_qcm_challenge_id', assessment: 'ref_assessment_id' }, { id: 'ref_answer_qcu_id', value: '2', result: 'ok', challengeId: 'ref_qcu_challenge_id', assessment: 'ref_assessment_id' }, { id: 'ref_answer_qroc_id', value: 'Bill', result: 'pending', challengeId: 'ref_qroc_challenge_id', assessment: 'ref_assessment_id' }, { id: 'ref_answer_qrocm_id', value: 'logiciel1: word\nlogiciel2: excel\nlogiciel3: powerpoint', result: 'partially', challengeId: 'ref_qrocm_challenge_id', assessment: 'ref_assessment_id' }, { id: 'ref_timed_answer_id', value: '', result: 'aband', challengeId: 'ref_timed_challenge_id', assessment: 'ref_timed_challenge_assessment_id' }, { id: 'ref_timed_answer_bis_id', value: '', result: 'aband', challengeId: 'ref_timed_challenge_bis_id', assessment: 'ref_timed_challenge_assessment_id' }, { id: 'first_challenge_answer_id', value: '', result: 'aband', challengeId: 'first_challenge_id', assessment: 'numeroted_assessment_id' }, { id: 'second_challenge_answer_id', value: 'Jerem', result: 'ok', challengeId: 'second_challenge_id', assessment: 'numeroted_assessment_id' }];
});
define('pix-live/mirage/fixtures/areas', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 1, name: '1. Information et données' }, { id: 2, name: '2. Communication et collaboration' }, { id: 3, name: '3. Création de contenu' }, { id: 4, name: '4. Protection et sécurité' }, { id: 5, name: '5. Environnement numérique' }];
});
define('pix-live/mirage/fixtures/assessments', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 'ref_assessment_id', 'user-id': 'user_id', 'user-name': 'Jon Snow', 'user-email': 'jsnow@winterfell.got', course: 'ref_course_id', answers: ['ref_answer_qcm_id', 'ref_answer_qcu_id', 'ref_answer_qroc_id', 'ref_answer_qrocm_id', 'ref_answer_qru_id'] }, { id: 'ref_assessment_id', 'user-id': 'user_id', 'user-name': 'Jane Doe', 'user-email': 'jane@acme.com', course: 'ref_course_id', answers: ['ref_answer_qcm_id', 'ref_answer_qcu_id', 'ref_answer_qroc_id', 'ref_answer_qrocm_id', 'ref_answer_qru_id'] }, { id: 'ref_assessment_id', 'user-id': 'user_id', 'user-name': 'Jon Snow', 'user-email': 'jsnow@winterfell.got', course: 'ref_course_id', answers: ['ref_answer_qcm_id', 'ref_answer_qcu_id', 'ref_answer_qroc_id', 'ref_answer_qrocm_id', 'ref_answer_qru_id'] }, { id: 'ref_timed_challenge_assessment_id', 'user-id': 'user_id', 'user-name': 'Jon Snow', 'user-email': 'jsnow@winterfell.got', course: 'ref_timed_challenge_course_id', answers: ['ref_timed_answer_id', 'ref_timed_answer_bis_id'] }];
});
define('pix-live/mirage/fixtures/challenges', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [
  // Ref course challenges
  {
    id: 'ref_qcm_challenge_id',
    type: 'QCM',
    timer: 2,
    instruction: 'Un QCM propose plusieurs choix, l\'utilisateur peut en choisir [plusieurs](http://link.plusieurs.url)',
    attachments: ['http://example_of_url'],
    'illustration-url': 'http://fakeimg.pl/350x200/?text=PictureOfQCM',
    proposals: '- possibilite 1, et/ou' + '\n - possibilite 2, et/ou' + '\n - possibilite 3, et/ou' + '\n - possibilite 4'
  }, {
    id: 'ref_qcu_challenge_id',
    type: 'QCU',
    timer: 2,
    instruction: 'Un QCU propose plusieurs choix, l\'utilisateur peut en choisir [un seul](http://link.unseul.url)',
    attachments: ['file.docx', 'file.odt'],
    'illustration-url': 'http://fakeimg.pl/350x200/?text=QCU',
    proposals: '- 1ere possibilite\n ' + '- 2eme possibilite\n ' + '- 3eme possibilite\n' + '- 4eme possibilite'
  }, {
    id: 'ref_qroc_challenge_id',
    type: 'QROC',
    instruction: 'Un QROC est une question ouverte avec un simple champ texte libre pour répondre',
    proposals: 'Entrez le prénom de B. Gates : ${firstname#prénom} (en toutes lettres)\nSVP'
  }, {
    id: 'ref_qrocm_challenge_id',
    type: 'QROCM',
    instruction: 'Un QROCM est une question [ouverte](http://link.ouverte.url) avec plusieurs champs texte libre pour repondre',
    proposals: 'Trois logiciels libres : ${logiciel1#un} ${logiciel2#deux} ${logiciel3#trois}\nMerci'
  },

  // Timed course challenges
  {
    id: 'ref_timed_challenge_id',
    type: 'QCU',
    timer: 5,
    'illustration-url': 'http://fakeimg.pl/350x200/?text=QCU',
    attachments: ['http://example_of_url'],
    instruction: 'Une question timée contient un décompte en bas a droite qui se decremente à chaque seconde ',
    proposals: '- Une seule possibilite '
  }, {
    id: 'ref_timed_challenge_bis_id',
    type: 'QCU',
    timer: 5,
    'illustration-url': 'http://fakeimg.pl/350x200/?text=QRU',
    attachments: ['http://example_of_url'],
    instruction: 'Une question timée contient un décompte en bas a droite qui se decremente à chaque seconde ',
    proposals: '- Une seule possibilite '
  },

  // Mener une recherche et une veille d'information challenges
  {
    id: 'receop4TZKvtjjG0V',
    type: 'QROC',
    instruction: 'Dans le village de Montrésor (37, France), sur quelle rue débouche la rue des Perrières ?',
    proposals: 'Rue de : ${Rue#}'
  }, {
    id: 'recLt9uwa2dR3IYpi',
    type: 'QCM',
    instruction: 'Les œufs de catégorie A ont plusieurs caractéristiques, lesquelles ?',
    proposals: '- Ils sont bio.\n' + '- Ils pèsent plus de 63 grammes.\n' + '- Ce sont des oeufs frais.\n' + '- Ils sont destinés aux consommateurs.\n' + '- Ils ne sont pas lavés.'
  }, {
    id: 'recn7XhSDTWo0Zzep',
    type: 'QROCM-ind',
    timer: 10,
    instruction: 'L\'URL suivante, censée aboutir à un article, donne lieu à une redirection vers la page d\'accueil du site. Retrouvez la page recherchée. Reportez le titre de l’article et son auteur.  \n' + '\n' + '> https://www.cairn.info/revue-reseaux-2011-numero1-page-137.htm',
    proposals: 'Titre : ${titre}\n' + 'Auteur : ${auteur}'
  }];
});
define('pix-live/mirage/fixtures/competences', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 1, name: 'Mener une recherche d\'information', level: -1, index: '1.1', areaId: 1, courseId: 'ref_course_id' }, { id: 2, name: 'Gérer des données', level: 0, index: '1.2', areaId: 1, courseId: 'ref_timed_challenge_course_id' }, { id: 3, name: 'Traiter des données', level: 1, index: '1.3', areaId: 1 }, { id: 4, name: 'Interagir', level: 2, index: '2.1', areaId: 2 }, { id: 5, name: 'Partager et publier', level: 3, index: '2.2', areaId: 2 }, { id: 6, name: 'Collaborer', level: 4, index: '2.3', areaId: 2 }, { id: 7, name: 'Gérer sa présence en ligne', level: 5, index: '2.4', areaId: 2 }, { id: 8, name: 'Développer des documents textuels', level: -1, index: '3.1', areaId: 3, courseId: 'recNPB7dTNt5krlMA' }, { id: 9, name: 'Développer des documents multimedia', level: -1, index: '3.2', areaId: 3, courseId: 'recNPB7dTNt5krlMA', assessmentId: 2 }, { id: 10, name: 'Adapter les documents à leur finalité', level: -1, index: '3.3', areaId: 3 }, { id: 11, name: 'Programmer', level: -1, index: '3.4', areaId: 3 }, { id: 12, name: 'Sécurise environnement num', level: -1, index: '4.1', areaId: 4 }, { id: 13, name: 'Protéger les données personnelles et la vie privée', level: -1, index: '4.2', areaId: 4 }, { id: 14, name: 'Protéger la santé, le bien-être et l\'environnement', level: -1, index: '4.3', areaId: 4 }, { id: 15, name: 'Résoudre problèmes techniques', level: -1, index: '5.1', areaId: 5 }, { id: 16, name: 'Construire un environnement numérique', level: -1, index: '5.2', areaId: 5 }];
});
define('pix-live/mirage/fixtures/corrections', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 'ref_correction_id', solution: '2' }, { id: 'ref_correction_id2', solution: '2,3' }];
});
define('pix-live/mirage/fixtures/courses', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{
    id: 'highligthed_course_id',
    name: 'Traiter des données',
    description: 'Recherche d\'information, gestion et traitement de données.',
    'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course',
    nbChallenges: 1,
    'is-adaptive': false
  }, {
    id: 'ref_course_id',
    name: 'First Course',
    description: 'Contient toutes sortes d\'epreuves avec différentes caractéristiques couvrant tous les cas d\'usage.',
    duration: 10,
    'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course',
    nbChallenges: 4,
    'is-adaptive': false
  }, {
    id: 'ref_timed_challenge_course_id',
    name: 'Course with timed challenges',
    description: 'Contient uniquement des épreuves timées',
    duration: 10,
    'image-url': 'http://fakeimg.pl/350x200/?text=First%20Course',
    nbChallenges: 2,
    'is-adaptive': false
  }, {
    id: 'recNPB7dTNt5krlMA',
    name: 'Mener une recherche et une veille d\'information',
    description: '',
    'image-url': 'http://fakeimg.pl/350x200/?text=Real%20Course',
    nbChallenges: 3,
    'is-adaptive': true
  }];
});
define('pix-live/mirage/fixtures/feedbacks', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = [{ id: 'ref_feedback_id', email: 'shi@fu.me', content: 'Some content', assessment: 'assessment_id', challenge: 'challenge_id' }];
});
define('pix-live/mirage/routes/get-answer-by-challenge-and-assessment', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/answers/ref-qcm-answer', 'pix-live/mirage/data/answers/ref-qcu-answer', 'pix-live/mirage/data/answers/ref-qroc-answer', 'pix-live/mirage/data/answers/ref-qrocm-answer', 'pix-live/mirage/data/answers/ref-timed-answer', 'pix-live/mirage/data/answers/ref-timed-answer-bis'], function (exports, _lodashCustom, _refQcmAnswer, _refQcuAnswer, _refQrocAnswer, _refQrocmAnswer, _refTimedAnswer, _refTimedAnswerBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var assessmentId = request.queryParams.assessment;
    var challengeId = request.queryParams.challenge;

    var allAnswers = [_refQcuAnswer.default, _refQcmAnswer.default, _refQrocAnswer.default, _refQrocmAnswer.default, _refTimedAnswer.default, _refTimedAnswerBis.default];

    var answers = _lodashCustom.default.map(allAnswers, function (oneAnswer) {
      return { id: oneAnswer.data.id, obj: oneAnswer };
    });

    var answer = _lodashCustom.default.find(answers, function (oneAnswer) {
      var belongsToAssessment = _lodashCustom.default.get(oneAnswer.obj, 'data.relationships.assessment.data.id') === assessmentId;
      var belongsToChallenge = _lodashCustom.default.get(oneAnswer.obj, 'data.relationships.challenge.data.id') === challengeId;
      return belongsToAssessment && belongsToChallenge;
    });

    if (answer) {
      return answer.obj;
    }

    // XXX schema.answers.first() (or where(), or findBy()) should return JSONAPI
    // For unknown reasons, it is not the case here (even if there is no answers found)
    // We return this valid JSON API to be sure
    var validJSONAPI = {
      data: {
        type: 'answers',
        id: 'answerId',
        attributes: {
          value: ''
        }
      }
    };

    // TODO make it work for real (use schema.answers.where({assessmentId, challengeId})
    return schema.answers.first() || validJSONAPI;
  };
});
define('pix-live/mirage/routes/get-answer', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/answers/ref-qcm-answer', 'pix-live/mirage/data/answers/ref-qcu-answer', 'pix-live/mirage/data/answers/ref-qroc-answer', 'pix-live/mirage/data/answers/ref-qrocm-answer', 'pix-live/mirage/data/answers/ref-timed-answer', 'pix-live/mirage/data/answers/ref-timed-answer-bis'], function (exports, _lodashCustom, _refQcmAnswer, _refQcuAnswer, _refQrocAnswer, _refQrocmAnswer, _refTimedAnswer, _refTimedAnswerBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var allAnswers = [_refQcuAnswer.default, _refQcmAnswer.default, _refQrocAnswer.default, _refQrocmAnswer.default, _refTimedAnswer.default, _refTimedAnswerBis.default];

    var answers = _lodashCustom.default.map(allAnswers, function (oneAnswer) {
      return { id: oneAnswer.data.id, obj: oneAnswer };
    });

    var answer = _lodashCustom.default.find(answers, { id: request.params.id });

    if (answer) {
      return answer.obj;
    } else {
      return schema.answers.find(request.params.id);
    }
  };
});
define('pix-live/mirage/routes/get-assessment', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/assessments/ref-assessment', 'pix-live/mirage/data/assessments/ref-assessment-timed-challenges'], function (exports, _lodashCustom, _refAssessment, _refAssessmentTimedChallenges) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var assessmentId = request.params.id;

    var allAssessments = [_refAssessment.default, _refAssessmentTimedChallenges.default];

    var assessments = _lodashCustom.default.map(allAssessments, function (oneAssessment) {
      return { id: oneAssessment.data.id, obj: oneAssessment };
    });

    var assessment = _lodashCustom.default.find(assessments, { id: assessmentId });

    if (assessment) {
      return assessment.obj;
    }
    return schema.assessments.find(assessmentId);
  };
});
define('pix-live/mirage/routes/get-challenge', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/challenges/ref-qcm-challenge', 'pix-live/mirage/data/challenges/ref-qcu-challenge', 'pix-live/mirage/data/challenges/ref-qroc-challenge', 'pix-live/mirage/data/challenges/ref-qrocm-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis'], function (exports, _lodashCustom, _refQcmChallenge, _refQcuChallenge, _refQrocChallenge, _refQrocmChallenge, _refTimedChallenge, _refTimedChallengeBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var challengeId = request.params.id;

    var allChallenges = [_refQcmChallenge.default, _refQcuChallenge.default, _refQrocChallenge.default, _refQrocmChallenge.default, _refTimedChallenge.default, _refTimedChallengeBis.default];

    var challenges = _lodashCustom.default.map(allChallenges, function (oneChallenge) {
      return { id: oneChallenge.data.id, obj: oneChallenge };
    });

    var challenge = _lodashCustom.default.find(challenges, { id: challengeId });

    if (challenge) {
      return challenge.obj;
    }
    return schema.challenges.find(challengeId);
  };
});
define('pix-live/mirage/routes/get-challenges', ['exports', 'pix-live/mirage/data/challenges/ref-qcm-challenge', 'pix-live/mirage/data/challenges/ref-qcu-challenge', 'pix-live/mirage/data/challenges/ref-qroc-challenge', 'pix-live/mirage/data/challenges/ref-qrocm-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis'], function (exports, _refQcmChallenge, _refQcuChallenge, _refQrocChallenge, _refQrocmChallenge, _refTimedChallenge, _refTimedChallengeBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {

    return {
      data: [_refQcmChallenge.default.data, _refQcuChallenge.default.data, _refQrocChallenge.default.data, _refQrocmChallenge.default.data, _refTimedChallenge.default.data, _refTimedChallengeBis.default.data]
    };
  };
});
define("pix-live/mirage/routes/get-corrections", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema) {
    return schema.corrections.all();
  };
});
define('pix-live/mirage/routes/get-course', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/courses/ref-course', 'pix-live/mirage/data/courses/highlighted-course', 'pix-live/mirage/data/courses/ref-course-timed-challenges'], function (exports, _lodashCustom, _refCourse, _highlightedCourse, _refCourseTimedChallenges) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var id = request.params.id;

    var allCourses = [_refCourse.default, _highlightedCourse.default, _refCourseTimedChallenges.default];

    if (allCourses.map(function (course) {
      return course.data.id;
    }).includes(id)) {

      var courses = _lodashCustom.default.map(allCourses, function (oneCourse) {
        return { id: oneCourse.data.id, obj: oneCourse };
      });

      var course = _lodashCustom.default.find(courses, { id: request.params.id });

      if (course) {
        return course.obj;
      } else {
        throw new Error('The course you required in the fake server does not exist ' + request.params.id);
      }
    }
    return schema.courses.find(id);
  };
});
define('pix-live/mirage/routes/get-courses-of-the-week', ['exports', 'pix-live/mirage/data/courses/highlighted-course'], function (exports, _highlightedCourse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    return { data: [_highlightedCourse.default.data] };
  };
});
define('pix-live/mirage/routes/get-courses', ['exports', 'pix-live/mirage/data/courses/ref-course', 'pix-live/mirage/data/courses/highlighted-course'], function (exports, _refCourse, _highlightedCourse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {
    var courses = [_refCourse.default.data];

    if (request.queryParams && request.queryParams.isCourseOfTheWeek) {
      courses.push(_highlightedCourse.default.data);
    }

    return { data: courses };
  };
});
define('pix-live/mirage/routes/get-next-challenge', ['exports', 'pix-live/mirage/data/challenges/ref-qcm-challenge', 'pix-live/mirage/data/challenges/ref-qcu-challenge', 'pix-live/mirage/data/challenges/ref-qroc-challenge', 'pix-live/mirage/data/challenges/ref-qrocm-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis'], function (exports, _refQcmChallenge, _refQcuChallenge, _refQrocChallenge, _refQrocmChallenge, _refTimedChallengeBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var assessmentId = request.params.assessmentId;
    var currentChallengeId = request.params.challengeId;

    // dynamic assessment
    var assessment = schema.assessments.find(assessmentId);
    if (assessment) {
      var challengeIds = ['receop4TZKvtjjG0V', 'recLt9uwa2dR3IYpi', 'recn7XhSDTWo0Zzep'];
      var challenges = schema.challenges.find(challengeIds).models;
      return getNextChallengeForDynamicAssessment(assessment, challenges);
    }

    // testing assessment
    return getNextChallengeForTestingAssessment(assessmentId, currentChallengeId);
  };

  function getNextChallengeForDynamicAssessment(assessment, challenges) {
    var answers = assessment.answers.models;

    if (answers.length >= challenges.length) {
      return null;
    }

    return challenges[answers.length];
  }

  function getNextChallengeForTestingAssessment(assessmentId, currentChallengeId) {
    // case 1 : we're trying to reach the first challenge for a given assessment
    if (!currentChallengeId) {
      return _refQcmChallenge.default;
    }

    // case 2 : test already started, challenge exists.
    var nextChallenge = {

      // ref_course
      'ref_qcm_challenge_id': _refQcuChallenge.default,
      'ref_qcu_challenge_id': _refQrocChallenge.default,
      'ref_qroc_challenge_id': _refQrocmChallenge.default,
      'ref_qrocm_challenge_id': 'null',

      'ref_timed_challenge_id': _refTimedChallengeBis.default,
      'ref_timed_challenge_bis_id': 'null'
    };

    return nextChallenge[currentChallengeId];
  }
});
define('pix-live/mirage/routes/get-organizations', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {
    var code = request.queryParams['filter[code]'];

    if (code) {
      return schema.organizations.where({ code: code });
    }

    return schema.organizations.all();
  };
});
define("pix-live/mirage/routes/get-snapshots", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {
    var organizationId = request.params.id;
    return schema.snapshots.where({ organizationId: organizationId });
  };
});
define('pix-live/mirage/routes/get-user-me', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getAuthenticatedUser;
  function getAuthenticatedUser(schema, request) {

    var userToken = request.requestHeaders.Authorization.replace('Bearer ', '');

    if (userToken === 'simple-user-token') return schema.users.find(1);

    if (userToken === 'prescriber-user-token') return schema.users.find(2);

    return schema.users.find(3);
  }
});
define('pix-live/mirage/routes/patch-answer', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/answers/ref-qcu-answer', 'pix-live/mirage/data/answers/ref-qcm-answer', 'pix-live/mirage/data/answers/ref-qroc-answer', 'pix-live/mirage/data/answers/ref-qrocm-answer', 'pix-live/mirage/data/answers/ref-timed-answer', 'pix-live/mirage/data/answers/ref-timed-answer-bis'], function (exports, _lodashCustom, _refQcuAnswer, _refQcmAnswer, _refQrocAnswer, _refQrocmAnswer, _refTimedAnswer, _refTimedAnswerBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var receivedAnswer = JSON.parse(request.requestBody);

    var allAnswers = [_refQcmAnswer.default, _refQcuAnswer.default, _refQrocAnswer.default, _refQrocmAnswer.default, _refTimedAnswer.default, _refTimedAnswerBis.default];
    var existingAnswer = _lodashCustom.default.find(allAnswers, function (answer) {
      return answer.data.id === receivedAnswer.data.id;
    });
    if (!existingAnswer) {
      // TODO make it work for real
      return schema.answers.find(receivedAnswer.data.id);
    }

    var updatedAnswer = existingAnswer;
    Object.assign(updatedAnswer.data.attributes, receivedAnswer.data.attributes);
    return updatedAnswer;
  };
});
define('pix-live/mirage/routes/post-answers', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/challenges/ref-qcm-challenge', 'pix-live/mirage/data/challenges/ref-qcu-challenge', 'pix-live/mirage/data/challenges/ref-qroc-challenge', 'pix-live/mirage/data/challenges/ref-qrocm-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge', 'pix-live/mirage/data/challenges/ref-timed-challenge-bis', 'pix-live/mirage/data/answers/ref-qcu-answer', 'pix-live/mirage/data/answers/ref-qcm-answer', 'pix-live/mirage/data/answers/ref-qroc-answer', 'pix-live/mirage/data/answers/ref-qrocm-answer', 'pix-live/mirage/data/answers/ref-timed-answer', 'pix-live/mirage/data/answers/ref-timed-answer-bis'], function (exports, _lodashCustom, _refQcmChallenge, _refQcuChallenge, _refQrocChallenge, _refQrocmChallenge, _refTimedChallenge, _refTimedChallengeBis, _refQcuAnswer, _refQcmAnswer, _refQrocAnswer, _refQrocmAnswer, _refTimedAnswer, _refTimedAnswerBis) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var answer = JSON.parse(request.requestBody);
    var challengeId = answer.data.relationships.challenge.data.id;

    var allChallenges = [_refQcmChallenge.default, _refQcuChallenge.default, _refQrocChallenge.default, _refQrocmChallenge.default, _refTimedChallenge.default, _refTimedChallengeBis.default];

    var allAnswers = [_refQcmAnswer.default, _refQcuAnswer.default, _refQrocAnswer.default, _refQrocmAnswer.default, _refTimedAnswer.default, _refTimedAnswerBis.default];

    var answers = _lodashCustom.default.map(allChallenges, function (oneChallenge, index) {
      return { id: oneChallenge.data.id, obj: allAnswers[index] };
    });

    var finalAnswer = _lodashCustom.default.find(answers, { id: challengeId });

    if (finalAnswer) {
      return finalAnswer.obj;
    } else {
      var newAnswer = this.normalizedRequestAttrs();
      return schema.answers.create(newAnswer);
    }
  };
});
define('pix-live/mirage/routes/post-assessments', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/mirage/data/assessments/ref-assessment'], function (exports, _lodashCustom, _refAssessment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var answer = JSON.parse(request.requestBody);
    var courseId = answer.data.relationships.course.data.id;

    var allAssessments = [_refAssessment.default];

    // TODO: clean legacy
    var assessments = _lodashCustom.default.map(allAssessments, function (oneAssessment) {
      return { id: oneAssessment.data.relationships.course.data.id, obj: oneAssessment };
    });

    var newAssessment = {
      'user-id': 'user_id',
      'user-name': 'Jane Doe',
      'user-email': 'jane@acme.com',
      'certification-number': 'certification-number'
    };

    var assessment = _lodashCustom.default.find(assessments, { id: courseId });
    if (assessment) {
      return assessment.obj;
    } else if (_lodashCustom.default.startsWith(courseId, 'null')) {
      return _refAssessment.default;
    } else if (!_lodashCustom.default.startsWith(courseId, 'rec')) {
      newAssessment.type = 'CERTIFICATION';
      newAssessment.courseId = 'certification-number';
    }
    return schema.assessments.create(newAssessment);
  };
});
define('pix-live/mirage/routes/post-authentications', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema, request) {

    var email = JSON.parse(request.requestBody).data.attributes.email;

    if (email === 'jane@acme.com') return simpleUserAuthentication;

    if (email === 'john@acme.com') return prescriberAuthentication;

    return otherUserAuthentication;
  };

  var simpleUserAuthentication = {
    data: {
      type: 'authentication',
      attributes: {
        'user-id': 1,
        token: 'simple-user-token'
      },
      id: 1
    }
  };

  var prescriberAuthentication = {
    data: {
      type: 'authentication',
      attributes: {
        'user-id': 2,
        token: 'prescriber-user-token'
      },
      id: 2
    }
  };

  var otherUserAuthentication = {
    data: {
      type: 'authentication',
      attributes: {
        'user-id': 3,
        token: 'other-user-token'
      },
      id: 3
    }
  };
});
define("pix-live/mirage/routes/post-certification-course", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (schema) {
    return schema.courses.create();
  };
});
define("pix-live/mirage/routes/post-courses", [], function () {
  "use strict";
});
define('pix-live/mirage/routes/post-feedbacks', ['exports', 'pix-live/mirage/data/feedbacks/ref-feedback'], function (exports, _refFeedback) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    return _refFeedback.default;
  };
});
define('pix-live/mirage/scenarios/default', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (server) {

    server.loadFixtures('areas');
    server.loadFixtures('competences');
    server.loadFixtures('courses');
    server.loadFixtures('challenges');

    server.create('user', {
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@acme.com',
      password: 'Jane1234',
      cgu: true,
      recaptchaToken: 'recaptcha-token-xxxxxx',
      totalPixScore: 456,
      competenceIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    });

    var prescriber = server.create('user', {
      id: 2,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@acme.com',
      password: 'John1234',
      cgu: true,
      recaptchaToken: 'recaptcha-token-xxxxxx'
    });

    var company = server.create('organization', {
      id: 1,
      name: 'Mon Entreprise',
      email: 'contact@company.com',
      type: 'PRO',
      code: 'PRO001'
    });

    server.create('organization', {
      id: 2,
      name: 'Mon École',
      email: 'contact@school.org',
      type: 'SCO',
      code: 'SCO002'
    });

    server.create('organization', {
      id: 3,
      name: 'Mon Université',
      email: 'contact@university.org',
      type: 'SUP',
      code: 'SUP003'
    });

    server.create('course', {
      id: 'certification-number',
      nbChallenges: 3,
      type: 'CERTIFICATION'
    });

    server.create('skill-review', {
      id: 12
    });

    server.create('certification', {
      id: '1',
      date: new Date('2018-02-15T15:15:52.504Z'),
      status: 'rejected',
      pixScore: '3789',
      isPublished: true,
      certificationCenter: 'Université de Paris',
      commentForCandidate: 'Ceci est un commentaire jury à destination du candidat.'
    });

    server.create('certification', {
      id: '2',
      date: new Date('2018-02-15T15:15:52.504Z'),
      birthdate: new Date('1994-07-10'),
      firstName: 'Jean',
      lastName: 'Bon',
      status: 'rejected',
      pixScore: '6546',
      isPublished: false,
      certificationCenter: 'Université de Lyon'
    });

    server.create('correction');

    prescriber.organization = company;
    company.user = prescriber;

    var snapshots = server.createList('snapshot', 3, { organization: company });

    company.snapshots = snapshots;
  };
});
define('pix-live/mirage/serializers/application', ['exports', 'ember-cli-mirage'], function (exports, _emberCliMirage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberCliMirage.JSONAPISerializer;
});
define('pix-live/mirage/serializers/competence', ['exports', 'pix-live/mirage/serializers/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({
    include: ['area']
  });
});
define('pix-live/mirage/serializers/user', ['exports', 'pix-live/mirage/serializers/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({
    include: ['competences', 'organizations']
  });
});
define('pix-live/mixins/click-outside', ['exports', 'ember-click-outside/mixins/click-outside'], function (exports, _clickOutside) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _clickOutside.default;
});
define('pix-live/models/answer', ['exports', 'ember-data', 'pix-live/models/answer/value-as-array-of-string-mixin'], function (exports, _emberData, _valueAsArrayOfStringMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo;
  exports.default = Model.extend(_valueAsArrayOfStringMixin.default, {

    value: attr('string'),
    result: attr('string'),
    resultDetails: attr('string'),
    timeout: attr('number'),
    elapsedTime: attr('number'),
    assessment: belongsTo('assessment'),
    challenge: belongsTo('challenge'),

    isResultOk: Ember.computed.equal('result', 'ok'),
    isResultNotOk: Ember.computed.not('isResultOk')
  });
});
define('pix-live/models/answer/value-as-array-of-string-mixin', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Mixin.create({

    _valuesAsMap: Ember.computed('value', function () {
      try {
        return jsyaml.load(this.get('value'));
      } catch (e) {
        return undefined;
      }
    })

  });
});
define('pix-live/models/area', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var attr = _emberData.default.attr,
      Model = _emberData.default.Model,
      hasMany = _emberData.default.hasMany;
  exports.default = Model.extend({
    name: attr('string'),
    title: attr('string'),
    competences: hasMany('competence'),
    resultCompetences: hasMany('resultCompetence'),
    code: attr('number')
  });
});
define('pix-live/models/assessment-progression', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var FIRST_STEP_VALUE = 1;
  var ONE_HUNDRED_PERCENT = 100;

  var CHECKPOINTS_MAX_STEPS = _environment.default.APP.NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT;

  exports.default = Ember.Object.extend({

    // Data props
    assessmentType: null,
    nbAnswers: null,
    nbChallenges: null,

    // CPs
    _currentStep: Ember.computed('assessmentType', 'nbAnswers', function () {
      var assessmentType = this.get('assessmentType');
      var nbAnswers = this.get('nbAnswers');
      if (assessmentType === 'SMART_PLACEMENT') {
        return FIRST_STEP_VALUE + nbAnswers % CHECKPOINTS_MAX_STEPS;
      }
      return FIRST_STEP_VALUE + nbAnswers;
    }),

    _maxSteps: Ember.computed('assessmentType', 'nbChallenges', function () {
      var assessmentType = this.get('assessmentType');
      if (assessmentType === 'SMART_PLACEMENT') {
        return CHECKPOINTS_MAX_STEPS;
      }
      return this.get('nbChallenges');
    }),

    valueNow: Ember.computed('_currentStep', '_maxSteps', function () {
      return this.get('_currentStep') / this.get('_maxSteps') * ONE_HUNDRED_PERCENT;
    }),

    text: Ember.computed('_currentStep', '_maxSteps', function () {
      return this.get('_currentStep') + ' / ' + this.get('_maxSteps');
    })

  });
});
define('pix-live/models/assessment-result', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var belongsTo = _emberData.default.belongsTo;
  exports.default = _emberData.default.Model.extend({

    assessment: belongsTo('assessment')

  });
});
define('pix-live/models/assessment', ['exports', 'ember-data', 'pix-live/config/environment'], function (exports, _emberData, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var attr = _emberData.default.attr,
      Model = _emberData.default.Model,
      belongsTo = _emberData.default.belongsTo,
      hasMany = _emberData.default.hasMany;
  exports.default = Model.extend({

    answers: hasMany('answer'),
    course: belongsTo('course', { inverse: null }),
    skillReview: belongsTo('skill-review', { inverse: null }),
    certificationNumber: attr('string'),
    estimatedLevel: attr('number'),
    hasCheckpoints: Ember.computed.equal('type', 'SMART_PLACEMENT'),
    isCertification: Ember.computed.equal('type', 'CERTIFICATION'),
    pixScore: attr('number'),
    result: belongsTo('assessment-result'),
    type: attr('string'),

    answersSinceLastCheckpoints: Ember.computed('answers.[]', function () {
      var answers = this.get('answers').toArray();
      var howManyAnswersSinceTheLastCheckpoint = answers.length % _environment.default.APP.NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT;
      var sliceAnswersFrom = howManyAnswersSinceTheLastCheckpoint === 0 ? -_environment.default.APP.NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT : -howManyAnswersSinceTheLastCheckpoint;
      return answers.slice(sliceAnswersFrom);
    })

  });
});
define('pix-live/models/certification', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo;
  exports.default = Model.extend({
    birthdate: attr('date'),
    firstName: attr('string'),
    lastName: attr('string'),
    date: attr('date'),
    certificationCenter: attr('string'),
    isPublished: attr('boolean'),
    pixScore: attr('number'),
    status: attr('string'),
    user: belongsTo('user'),
    commentForCandidate: attr('string'),
    resultCompetenceTree: belongsTo('resultCompetenceTree')
  });
});
define('pix-live/models/challenge', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo;
  exports.default = Model.extend({

    instruction: attr('string'),
    proposals: attr('string'),
    timer: attr('number'),
    illustrationUrl: attr('string'),
    type: attr('string'),
    embedUrl: attr('string'),
    embedTitle: attr('string'),
    embedHeight: attr('string'),

    attachments: attr('array'),
    answer: belongsTo('answer'),

    hasValidEmbedDocument: Ember.computed('embedUrl', 'embedTitle', 'embedHeight', function () {
      var embedUrl = this.get('embedUrl');
      return !!embedUrl && !!this.get('embedTitle') && !!this.get('embedHeight') && embedUrl.toLowerCase().startsWith('https://');
    }),
    hasAttachment: Ember.computed.notEmpty('attachments'),
    hasSingleAttachment: Ember.computed.equal('attachments.length', 1),
    hasMultipleAttachments: Ember.computed.gt('attachments.length', 1),
    hasTimer: Ember.computed.notEmpty('timer')
  });
});
define('pix-live/models/competence', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo;
  exports.default = Model.extend({
    name: attr('string'),
    area: belongsTo('area'),
    user: belongsTo('user'),
    index: attr('number'),
    level: attr('number'),
    areaName: Ember.computed.alias('area.name'),
    courseId: attr('string'),
    assessmentId: attr('string'),
    status: attr('string')
  });
});
define('pix-live/models/correction', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      hasMany = _emberData.default.hasMany;
  exports.default = Model.extend({

    solution: attr('string'),
    hint: attr('string'),
    tutorials: hasMany('tutorial', { inverse: null }),
    learningMoreTutorials: hasMany('tutorial', { inverse: null }), // Traduction: TutoSavoirPlus

    hasNoHints: Ember.computed.empty('hint'),
    hasNoTutorials: Ember.computed.empty('tutorials'),
    hasNoLearningMoreTutorials: Ember.computed.empty('learningMoreTutorials'),

    noHintsNorTutorialsAtAll: Ember.computed.and('{hasNoHints,hasNoTutorials,hasNoLearningMoreTutorials}')

  });
});
define('pix-live/models/course', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr;
  exports.default = Model.extend({

    name: attr('string'),
    description: attr('string'),
    duration: attr('number'),
    imageUrl: attr('string'),
    isAdaptive: attr('boolean'),
    nbChallenges: attr('number'),
    type: attr('string'),
    accessCode: attr('string')

  });
});
define('pix-live/models/feedback', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({

    email: _emberData.default.attr('string'),
    content: _emberData.default.attr('string'),
    assessment: _emberData.default.belongsTo('assessment'),
    challenge: _emberData.default.belongsTo('challenge')

  });
});
define('pix-live/models/organization', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo,
      hasMany = _emberData.default.hasMany;
  exports.default = Model.extend({
    name: attr('string'),
    email: attr('string'),
    type: attr('string'),
    code: attr('string'),
    user: belongsTo('user'),
    snapshots: hasMany('snapshot')
  });
});
define('pix-live/models/password-reset-demand', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    email: _emberData.default.attr('string'),
    temporaryKey: _emberData.default.attr('string')
  });
});
define('pix-live/models/result-competence-tree', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var hasMany = _emberData.default.hasMany,
      Model = _emberData.default.Model;
  exports.default = Model.extend({
    areas: hasMany('area', { inverse: null })
  });
});
define('pix-live/models/result-competence', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      belongsTo = _emberData.default.belongsTo;
  exports.default = Model.extend({
    name: attr('string'),
    area: belongsTo('area'),
    index: attr('number'),
    level: attr('number')
  });
});
define('pix-live/models/skill-review', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    profileMasteryRate: _emberData.default.attr('number'),
    profileCompletionRate: _emberData.default.attr('number'),

    profileMasteryPercentage: Ember.computed('profileMasteryRate', function () {
      return Number((this.get('profileMasteryRate') * 100).toFixed(1)) + '%';
    }),

    profileCompletionPercentage: Ember.computed('profileCompletionRate', function () {
      return Number((this.get('profileCompletionRate') * 100).toFixed(0)) + '%';
    })
  });
});
define('pix-live/models/snapshot', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      belongsTo = _emberData.default.belongsTo,
      attr = _emberData.default.attr;
  exports.default = Model.extend({
    testsFinished: attr('string'),
    score: attr('number'),
    createdAt: attr('date'),
    organization: belongsTo('organization'),
    user: belongsTo('user'),
    studentCode: attr('string'),
    campaignCode: attr('string'),
    numberOfTestsFinished: Ember.computed('testsFinished', function () {
      return this.get('testsFinished') || 0;
    })
  });
});
define('pix-live/models/tutorial', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr;
  exports.default = Model.extend({

    duration: attr('string'),
    format: attr('string'),
    link: attr('string'),
    source: attr('string'),
    title: attr('string')

  });
});
define('pix-live/models/user', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Model = _emberData.default.Model,
      attr = _emberData.default.attr,
      hasMany = _emberData.default.hasMany;
  exports.default = Model.extend({
    firstName: attr('string'),
    lastName: attr('string'),
    email: attr('string'),
    password: attr('string'),
    cgu: attr('boolean'),
    recaptchaToken: attr('string'),
    competences: hasMany('competence'),
    totalPixScore: attr('number'),
    organizations: hasMany('organization'),
    certifications: hasMany('certification'),

    competenceAreas: Ember.computed('competences', function () {
      return this.get('competences').then(function (competences) {
        return competences.reduce(function (areas, competence) {
          competence.get('area').then(function (competenceArea) {
            if (!areas[competenceArea.get('id')]) {
              areas[competenceArea.get('id')] = {
                name: competenceArea.get('name'),
                competences: []
              };
            }
            areas[competenceArea.get('id')].competences.push(competence);
            return areas;
          });
        }, []);
      });
    }),

    fullName: Ember.computed('firstName', 'lastName', function () {
      return this.get('firstName') + ' ' + this.get('lastName');
    })
  });
});
define('pix-live/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
define('pix-live/router', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  // XXX https://github.com/poteto/ember-metrics/issues/43#issuecomment-252081256
  if (_environment.default.environment === 'integration' || _environment.default.environment === 'staging' || _environment.default.environment === 'production') {
    // do not make any sense in test ENV, therefore can be safely ignored
    /* istanbul ignore next */
    Router.reopen({
      metrics: Ember.inject.service(),

      didTransition: function didTransition() {
        this._super.apply(this, arguments);
        this._trackPage();
      },
      _trackPage: function _trackPage() {
        var _this = this;

        Ember.run.scheduleOnce('afterRender', this, function () {
          var page = _this.get('url');
          var title = _this.getWithDefault('currentRouteName', 'unknown');
          Ember.get(_this, 'metrics').trackPage({ page: page, title: title });
        });
      }
    });
  }

  /* eslint-disable max-statements */
  Router.map(function () {
    this.route('index', { path: '/' });
    this.route('project', { path: '/projet' });
    this.route('competences');
    this.route('inscription');
    this.route('compte');
    this.route('challenge-preview', { path: '/challenges/:challenge_id/preview' });
    this.route('courses.create-assessment', { path: '/courses/:course_id' });

    this.route('assessments.challenge', { path: '/assessments/:assessment_id/challenges/:challenge_id' });
    this.route('assessments.resume', { path: '/assessments/:assessment_id' });
    this.route('assessments.results', { path: '/assessments/:assessment_id/results' });
    this.route('assessments.comparison', { path: '/assessments/:assessment_id/results/compare/:answer_id/:index' });
    this.route('assessments.rating', { path: '/assessments/:assessment_id/rating' });
    this.route('assessments.checkpoint', { path: '/assessments/:assessment_id/checkpoint' });
    this.route('login', { path: '/connexion' });
    this.route('logout', { path: '/deconnexion' });
    this.route('board');
    this.route('legal-notices', { path: '/mentions-legales' });
    this.route('terms-of-service', { path: '/conditions-generales-d-utilisation' });
    this.route('reset-password', { path: '/changer-mot-de-passe/:temporaryKey' });
    this.route('password-reset-demand', { path: '/mot-de-passe-oublie' });
    this.route('certifications', function () {
      this.route('start', { path: '/' });
      this.route('resume', { path: '/:certification_course_id' });
      this.route('results', { path: '/:certification_number/results' });
    });

    this.route('user-certifications', { path: 'mes-certifications' }, function () {
      this.route('get', { path: '/:id' });
    });

    this.route('campaigns', { path: '/campagnes' }, function () {
      this.route('start-or-resume', { path: '/codecampagnepix' });
      this.route('skill-review', { path: '/codecampagnepix/resultats/:assessment_id' });
    });

    // XXX: this route is used for any request that did not match any of the previous routes. SHOULD ALWAYS BE THE LAST ONE
    this.route('not-found', { path: '/*path' });
  });

  exports.default = Router;
});
define('pix-live/routes/application', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    splash: Ember.inject.service(),

    activate: function activate() {
      this.get('splash').hide();
    }
  });
});
define('pix-live/routes/assessments/challenge', ['exports', 'pix-live/routes/base-route', 'pix-live/config/environment'], function (exports, _baseRoute, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({

    session: Ember.inject.service(),

    model: function model(params) {
      var _this = this;

      var store = this.get('store');

      var assessmentId = params.assessment_id;
      var challengeId = params.challenge_id;

      return Ember.RSVP.hash({
        assessment: store.findRecord('assessment', assessmentId),
        challenge: store.findRecord('challenge', challengeId)
      }).catch(function (err) {
        var meta = 'errors' in err ? err.errors.get('firstObject').meta : null;
        if (meta.field === 'authorization') {
          return _this.transitionTo('index');
        }
      });
    },
    afterModel: function afterModel(model) {
      var store = this.get('store');

      return Ember.RSVP.hash({
        user: model.assessment.get('isCertification') ? store.findRecord('user', this.get('session.data.authenticated.userId')) : null,
        answers: store.queryRecord('answer', { assessment: model.assessment.id, challenge: model.challenge.id })
      }).then(function (hash) {
        model.user = hash.user;
        model.answers = hash.answers;
        return model;
      });
    },
    serialize: function serialize(model) {
      return {
        assessment_id: model.assessment.id,
        challenge_id: model.challenge.id
      };
    },
    _findOrCreateAnswer: function _findOrCreateAnswer(challenge, assessment) {
      var answer = assessment.get('answers').findBy('challenge.id', challenge.get('id'));
      if (!answer) {
        answer = this.get('store').createRecord('answer', { assessment: assessment, challenge: challenge });
      }
      return answer;
    },
    _getNextChallenge: function _getNextChallenge(assessment, challenge) {
      return this.get('store').queryRecord('challenge', { assessmentId: assessment.get('id'), challengeId: challenge.get('id') });
    },
    _hasReachedCheckpoint: function _hasReachedCheckpoint(assessment) {
      return assessment.get('answers.length') % _environment.default.APP.NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT === 0;
    },


    actions: {
      saveAnswerAndNavigate: function saveAnswerAndNavigate(challenge, assessment, answerValue, answerTimeout, answerElapsedTime) {
        var _this2 = this;

        var answer = this._findOrCreateAnswer(challenge, assessment);
        answer.setProperties({
          value: answerValue,
          timeout: answerTimeout,
          elapsedTime: answerElapsedTime
        });

        return answer.save().then(function () {
          return _this2._getNextChallenge(assessment, challenge);
        }).then(function (nextChallenge) {

          if (assessment.get('hasCheckpoints') && _this2._hasReachedCheckpoint(assessment)) {
            return _this2.transitionTo('assessments.checkpoint', assessment.get('id'));
          }

          _this2.transitionTo('assessments.challenge', { assessment: assessment, challenge: nextChallenge });
        }).catch(function () {
          _this2.transitionTo('assessments.rating', assessment.get('id'));
        });
      }
    }

  });
});
define('pix-live/routes/assessments/checkpoint', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    afterModel: function afterModel(assesssment) {
      return Ember.RSVP.hash({
        assesssment: assesssment,
        skillReview: this.get('store').findRecord('skillReview', assesssment.get('skillReview.id'))
      });
    }
  });
});
define('pix-live/routes/assessments/comparison', ['exports', 'ember-routable-modal/mixins/route', 'pix-live/routes/base-route'], function (exports, _route, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_route.default, {
    model: function model(params) {
      var store = this.get('store');

      var answerId = params.answer_id;
      var index = params.index;

      var answer = store.findRecord('answer', answerId);

      return Ember.RSVP.hash({
        index: index,
        answer: answer,
        correction: store.query('correction', { answerId: answerId }).then(function (corrections) {
          return corrections.get('firstObject');
        }),
        challenge: answer.then(function (foundAnswer) {
          return store.findRecord('challenge', foundAnswer.get('challenge.id'));
        })
      });
    }
  });
});
define('pix-live/routes/assessments/rating', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    afterModel: function afterModel(assessment) {
      var _this = this;

      return this.get('store').createRecord('assessment-result', { assessment: assessment }).save().finally(function () {
        switch (assessment.get('type')) {
          case 'CERTIFICATION':
            return _this.replaceWith('certifications.results', assessment.get('certificationNumber'));

          case 'SMART_PLACEMENT':
            return _this.replaceWith('assessments.checkpoint', assessment.get('id'), { queryParams: { finalCheckpoint: true } });

          default:
            return _this.replaceWith('assessments.results', assessment.get('id'));
        }
      });
    }
  });
});
define('pix-live/routes/assessments/results', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    afterModel: function afterModel(model) {
      if (model.get('isCertification')) {
        this.transitionTo('index');
      }
    },


    actions: {
      openComparison: function openComparison(assessment_id, answer_id, index) {
        this.transitionTo('assessments.comparison', assessment_id, answer_id, index);
      }
    }

  });
});
define('pix-live/routes/assessments/resume', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    afterModel: function afterModel(assessment) {
      var _this = this;

      return this.get('store').queryRecord('challenge', { assessmentId: assessment.get('id') }).then(function (nextChallenge) {
        return _this.transitionTo('assessments.challenge', assessment.get('id'), nextChallenge.get('id'));
      }).catch(function () {
        return _this.transitionTo('assessments.rating', assessment.get('id'));
      });
    }
  });
});
define('pix-live/routes/base-route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({

    //Toutes les pages reset le scroll par défaut (surcharger scrollToTop dans une route si on ne veut pas de scrollReset)
    scrollsToTop: true,

    activate: function activate() {
      this._super();
      if (this.get('scrollsToTop')) {
        window.scrollTo(0, 0);
      }
    }
  });
});
define('pix-live/routes/board', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'pix-live/routes/base-route', 'pix-live/config/environment'], function (exports, _authenticatedRouteMixin, _baseRoute, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    model: function model() {
      var _this = this;

      return this.get('store').findRecord('user', this.get('session.data.authenticated.userId')).then(function (user) {

        if (user.get('organizations.length') <= 0) {
          return _this.transitionTo('compte');
        }
        var organization = user.get('organizations.firstObject');
        return Ember.RSVP.hash({
          organization: organization,
          snapshots: organization.get('snapshots').reload(),
          organizationSnapshotsExportUrl: _environment.default.APP.API_HOST + '/api/organizations/' + organization.get('id') + '/snapshots/export?userToken=' + _this.get('session.data.authenticated.token')
        });
      });
    }
  });
});
define('pix-live/routes/campaigns/skill-review', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    model: function model(params) {
      return this.get('store').findRecord('assessment', params.assessment_id);
    }
  });
});
define('pix-live/routes/campaigns/start-or-resume', ['exports', 'pix-live/routes/base-route', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _baseRoute, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _asyncToGenerator(fn) {
    return function () {
      var gen = fn.apply(this, arguments);
      return new Promise(function (resolve, reject) {
        function step(key, arg) {
          try {
            var info = gen[key](arg);
            var value = info.value;
          } catch (error) {
            reject(error);
            return;
          }

          if (info.done) {
            resolve(value);
          } else {
            return Promise.resolve(value).then(function (value) {
              step("next", value);
            }, function (err) {
              step("throw", err);
            });
          }
        }

        return step("next");
      });
    };
  }

  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {
    model: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var store, smartPlacementAssessments;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                store = this.get('store');
                _context.next = 3;
                return store.query('assessment', { filter: { type: 'SMART_PLACEMENT' } });

              case 3:
                smartPlacementAssessments = _context.sent;

                if (Ember.isEmpty(smartPlacementAssessments)) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', smartPlacementAssessments.get('firstObject'));

              case 6:
                return _context.abrupt('return', store.createRecord('assessment', { type: 'SMART_PLACEMENT' }).save());

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function model() {
        return _ref.apply(this, arguments);
      }

      return model;
    }(),
    afterModel: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(assessment) {
        var store, challenge;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                store = this.get('store');
                _context2.prev = 1;
                _context2.next = 4;
                return assessment.reload();

              case 4:
                _context2.next = 6;
                return store.queryRecord('challenge', { assessmentId: assessment.get('id') });

              case 6:
                challenge = _context2.sent;
                return _context2.abrupt('return', this.transitionTo('assessments.challenge', { assessment: assessment, challenge: challenge }));

              case 10:
                _context2.prev = 10;
                _context2.t0 = _context2['catch'](1);

                // FIXME: do not manage error when there is no more challenge anymore
                this.transitionTo('assessments.rating', assessment.get('id'));

              case 13:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 10]]);
      }));

      function afterModel(_x) {
        return _ref2.apply(this, arguments);
      }

      return afterModel;
    }()
  });
});
define('pix-live/routes/certifications/results', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'pix-live/routes/base-route'], function (exports, _authenticatedRouteMixin, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    model: function model(params) {
      return Ember.RSVP.hash({
        user: this.get('store').findRecord('user', this.get('session.data.authenticated.userId'), { reload: true }),
        certificationNumber: params.certification_number // FIXME certification number is a domain attribute and should not be queried as a technical id
      });
    }
  });
});
define('pix-live/routes/certifications/resume', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    model: function model(params) {
      var certificationCourseId = params.certification_course_id;

      return this.get('store').query('assessment', {
        filter: {
          courseId: certificationCourseId,
          type: 'CERTIFICATION'
        }
      }).then(function (assessments) {
        return assessments.get('firstObject');
      });
    },
    afterModel: function afterModel(assessment) {
      var _this = this;

      return this.get('store').queryRecord('challenge', { assessmentId: assessment.get('id') }).then(function (nextChallenge) {
        return _this.transitionTo('assessments.challenge', assessment.get('id'), nextChallenge.get('id'));
      }).catch(function () {
        return _this.transitionTo('certifications.results', assessment.get('course.id'));
      });
    }
  });
});
define('pix-live/routes/certifications/start', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {

    actions: {
      error: function error(_error) {
        if (_error.errors[0].status === '403') {
          return this.render('certifications.start-error');
        } else {
          this.transitionTo('index');
        }
      },
      submit: function submit(certificationCourse) {
        return this.replaceWith('courses.create-assessment', certificationCourse.id);
      }
    }
  });
});
define('pix-live/routes/challenge-preview', ['exports', 'pix-live/utils/lodash-custom', 'pix-live/routes/base-route'], function (exports, _lodashCustom, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    model: function model(params) {
      var store = this.get('store');
      return store.findRecord('challenge', params.challenge_id);
    },
    afterModel: function afterModel(challenge) {
      var store = this.get('store');
      var that = this;
      // creates a fake course
      var course = store.createRecord('course', { id: 'null' + _lodashCustom.default.guid(), type: 'PREVIEW', challenges: [challenge] });
      var assessment = store.createRecord('assessment', { course: course, type: course.get('type') });

      var correctionAdapter = store.adapterFor('correction');

      correctionAdapter.refreshRecord('correction', { challengeId: challenge.get('id') });
      return assessment.save().then(function () {
        return that.transitionTo('assessments.challenge', { assessment: assessment, challenge: challenge });
      });
    }
  });
});
define('pix-live/routes/competences', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var domains = [{
    id: 'information-et-donnees',
    title: 'Informations et données',
    topics: [{
      title: 'Mener une recherche et une veille d’information',
      description: 'Mener une recherche et une veille d’information pour répondre à un besoin d’information et se tenir au courant de l’actualité d’un sujet (avec un moteur de recherche, au sein d’un réseau social, par abonnement à des flux ou des lettres d’information, ou tout autre moyen).',
      themes: 'Web et navigation ; Moteur de recherche et requête ; Veille d’information, flux et curation ; Evaluation de l’information ; Source et citation ; Gouvernance d’internet et ouverture du web ; Abondance de l’information, filtrage et personnalisation ; Recul critique face à l’information et aux médias ; Droit d’auteur.'
    }, {
      title: 'Gérer des données',
      description: 'Stocker et organiser des données pour les retrouver, les conserver et en faciliter l’accès et la gestion (avec un gestionnaire de fichiers, un espace de stockage en ligne, des tags, des classeurs, des bases de données, un système d’information, etc.).',
      themes: 'Dossier et fichier ; Stockage et compression ; Transfert et synchronisation ; Recherche et méta-données ; Indexation sémantique et libellé (tag) ; Structuration des données ; Système d’information ; Localisation des données et droit applicable ; Modèles et stratégies économiques ; Sécurité du système d’information.'
    }, {
      title: 'Traiter des données',
      description: 'Appliquer des traitements à des données pour les analyser et les interpréter (avec un tableur, un programme, un logiciel de traitement d’enquête, une requête calcul dans une base de données, etc.).',
      themes: 'Données quantitatives, type et format de données ; Calcul, traitement statistique et représentation graphique ; Flux de données ; Collecte et exploitation de données massives ; Pensée algorithmique et informatique ; Vie privée et confidentialité ; Interopérabilité'
    }]
  }, {
    id: 'communication-et-collaboration',
    title: 'Communication et collaboration',
    topics: [{
      title: 'Interagir',
      description: 'Interagir avec des individus et de petits groupes pour échanger dans divers contextes liés à la vie privée ou à une activité professionnelle, de façon ponctuelle et récurrente (avec une messagerie électronique, une messagerie instantanée, un système de visio-conférence, etc.).',
      themes: 'Protocoles pour l\'interaction ; Modalités d\'interaction et rôles ; Applications et services pour l\'interaction ; Vie privée et confidentialité ; Identité numérique et signaux ; Vie connectée ; Codes de communication et netiquette'
    }, {
      title: 'Partager et publier',
      description: 'Partager et publier des informations et des contenus pour communiquer ses propres productions ou opinions, relayer celles des autres en contexte de communication publique (avec des plateformes de partage, des réseaux sociaux, des blogs, des espaces de forum et de commentaire, des CMS, etc.).',
      themes: 'Protocoles et modalités de partage ; Applications et services pour le partage ; Règles de publication et visibilité ; Réseaux sociaux ; Liberté d\'expression et droit à l\'information ; Formation en ligne ; Vie privée et confidentialité ; Identité numérique et signaux ; Pratiques sociales et participation citoyenne ; e- Réputation et influence ; Ecriture pour le web ; Codes de communication et netiquette ; Droit d\'auteur'
    }, {
      title: 'Collaborer',
      description: 'Collaborer dans un groupe pour réaliser un projet, co-produire des ressources, des connaissances, des données, et pour apprendre (avec des plateformes de travail collaboratif et de partage de document, des éditeurs en ligne, des fonctionnalités de suivi de modifications ou de gestion de versions, etc.).',
      themes: 'Modalités de collaboration et rôles ; Applications et services de partage de document et d\'édition en ligne ; Versions et révisions ; Droits d\'accès et conflit d\'accès ; Gestion de projet ; Droit d\'auteur ; Vie connectée ; Vie privée et confidentialité'
    }, {
      title: 'S\'insérer dans le monde numérique',
      description: 'Maîtriser les stratégies et enjeux de la présence en ligne, et choisir ses pratiques pour se positionner en tant qu\'acteur social, économique et citoyen dans le monde numérique, en lien avec ses règles, limites et potentialités, et en accord avec des valeurs et/ou pour répondre à des objectifs (avec les réseaux sociaux et les outils permettant de développer une présence publique sur le web, et en lien avec la vie citoyenne, la vie professionnelle, la vie privée, etc.).',
      themes: 'Identité numérique et signaux ; e-Réputation et influence ; Codes de communication et netiquette ; Pratiques sociales et participation citoyenne ; Modèles et stratégies économiques ; Questions éthiques et valeurs ; Gouvernance d\'internet et ouverture du web ; Liberté d\'expression et droit à l\'information'
    }]
  }, {
    id: 'creation-de-contenu',
    title: 'Création de contenu',
    topics: [{
      title: 'Développer des documents textuels',
      description: 'Produire des documents à contenu majoritairement textuel pour communiquer des idées, rendre compte et valoriser ses travaux (avec des logiciels de traitement de texte, de présentation, de création de page web, de carte conceptuelle, etc.).',
      themes: 'Applications d\'édition de documents textuels ; Structure et séparation forme et contenu ; Illustration et intégration ; Charte graphique et identité visuelle ; Interopérabilité ; Ergonomie et réutilisabilité du document ; Accessibilité ; Droit d\'auteur'
    }, {
      title: 'Développer des documents multimédia',
      description: 'Développer des documents à contenu multimédia pour créer ses propres productions multimédia, enrichir ses créations majoritairement textuelles ou créer une oeuvre transformative (mashup, remix, ...) (avec des logiciels de capture et d\'édition d\'image / son / vidéo / animation, des logiciels utiles aux pré-traitements avant intégration, etc.).',
      themes: 'Applications d\'édition de documents multimédia ; Capture son, image et vidéo et numérisation ; Interopérabilité ; Accessibilité ; Droit d\'auteur ; Charte graphique et identité visuelle'
    }, {
      title: 'Adapter les documents à leur finalité',
      description: 'Adapter des documents de tous types en fonction de l\'usage envisagé et maîtriser l\'usage des licences pour permettre, faciliter et encadrer l\'utilisation dans divers contextes (mise à jour fréquente, diffusion multicanale, impression, mise en ligne, projection, etc.) (avec les fonctionnalités des logiciels liées à la préparation d\'impression, de projection, de mise en ligne, les outils de conversion de format, etc.).',
      themes: 'Licences ; Diffusion et mise en ligne d\'un document Ergonomie et réutilisabilité du document ; Ecriture pour le web ; Interopérabilité ; Accessibilité ; Vie privée et confidentialité'
    }, {
      title: 'Programmer',
      description: 'Ecrire des programmes et des algorithmes pour répondre à un besoin (automatiser une tâche répétitive, accomplir des tâches complexes ou chronophages, résoudre un problème logique, etc.) et pour développer un contenu riche (jeu, site web, etc.) (avec des environnements de développement informatique simples, des logiciels de planification de tâches, etc.).',
      themes: 'Algorithme et programme ; Représentation et codage de l\'information ; Complexité ; Pensée algorithmique et informatique ; Collecte et exploitation de données massives ; Intelligence artificielle et robots'
    }]
  }, {
    id: 'protection-et-securite',
    title: 'Protection et sécurité',
    topics: [{
      title: 'Sécuriser l\'environnement numérique',
      description: 'Sécuriser les équipements, les communications et les données pour se prémunir contre les attaques, pièges, désagréments et incidents susceptibles de nuire au bon fonctionnement des matériels, logiciels, sites internet, et de compromettre les transactions et les données (avec des logiciels de protection, des techniques de chiffrement, la maîtrise de bonnes pratiques, etc.).',
      themes: 'Attaques et menaces ; Chiffrement ; Logiciels de prévention et de protection ; Authentification ; Sécurité du système d\'information ; Vie privée et confidentialité'
    }, {
      title: 'Protéger les données personnelles et la vie privée',
      description: 'Maîtriser ses traces et gérer les données personnelles pour protéger sa vie privée et celle des autres, et adopter une pratique éclairée (avec le paramétrage des paramètres de confidentialité, la surveillance régulière de ses traces par des alertes ou autres outils, etc.).',
      themes: 'Données personnelles et loi ; Traces ; Vie privée et confidentialité ; Collecte et exploitation de données massives'
    }, {
      title: 'Protéger la santé, le bien-être et l\'environnement',
      description: 'Prévenir et limiter les risques générés par le numérique sur la santé, le bien- être et l\'environnement mais aussi tirer parti de ses potentialités pour favoriser le développement personnel, le soin, l\'inclusion dans la société et la qualité des conditions de vie, pour soi et pour les autres (avec la connaissance des effets du numérique sur la santé physique et psychique et sur l\'environnement, et des pratiques, services et outils numériques dédiés au bien-être, à la santé, à l\'accessibilité).',
      themes: 'Ergonomie du poste de travail ; Communication sans fil et ondes ; Impact environnemental ; Accessibilité ; Vie connectée ; Capteurs ; Intelligence artificielle et robots ; Santé ; Vie privée et confidentialité'
    }]
  }, {
    id: 'environnement-numerique',
    title: 'Environnement numérique',
    topics: [{
      title: 'Résoudre des problèmes techniques',
      description: 'Résoudre des problèmes techniques pour garantir et rétablir le bon fonctionnement d\'un environnement informatique (avec les outils de configuration et de maintenance des logiciels ou des systèmes d\'exploitation, et en mobilisant les ressources techniques ou humaines nécessaires, etc.).',
      themes: 'Panne et support informatique ; Administration et configuration ; Maintenance et mise à jour ; Sauvegarde et restauration ; Interopérabilité ; Complexité'
    }, {
      title: 'Construire un environnement numérique',
      description: 'Installer, configurer et enrichir un environnement numérique (matériels, outils, services) pour disposer d\'un cadre adapté aux activités menées, à leur contexte d\'exercice ou à des valeurs (avec les outils de configuration des logiciels et des systèmes d\'exploitation, l\'installation de nouveaux logiciels ou la souscription à des services, etc.).',
      themes: 'Histoire de l\'informatique ; Informatique et matériel ; Logiciels, applications et services ; Système d\'exploitation ; Réseau informatique ; Offre (matériel, logiciel, service) ; Modèles et stratégies économiques'
    }]
  }];

  exports.default = _baseRoute.default.extend({

    panelActions: Ember.inject.service(),

    model: function model() {
      return domains;
    }
  });
});
define('pix-live/routes/compte', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'pix-live/routes/base-route'], function (exports, _authenticatedRouteMixin, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    model: function model() {
      var _this = this;

      var store = this.get('store');
      return store.findRecord('user', this.get('session.data.authenticated.userId'), { reload: true }).then(function (user) {
        if (user.get('organizations.length') > 0) {
          return _this.transitionTo('board');
        }
        return user;
      });
    },


    actions: {
      searchForOrganization: function searchForOrganization(code) {
        return this.get('store').query('organization', {
          filter: {
            code: code
          }
        }).then(function (organisations) {
          var isOrganizationFound = organisations.content.length === 1;
          return isOrganizationFound ? organisations.get('firstObject') : null;
        });
      },
      shareProfileSnapshot: function shareProfileSnapshot(organization, studentCode, campaignCode) {
        return this.get('store').createRecord('snapshot', { organization: organization, studentCode: studentCode, campaignCode: campaignCode }).save();
      }
    }
  });
});
define('pix-live/routes/courses/create-assessment', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({
    redirect: function redirect(course) {
      var _this = this;

      var store = this.get('store');

      var assessment = void 0;

      return store.createRecord('assessment', { course: course, type: course.get('type') }).save().then(function (createdAssessment) {
        return assessment = createdAssessment;
      }).then(function () {
        return store.queryRecord('challenge', { assessmentId: assessment.get('id') });
      }).then(function (challenge) {
        return _this.replaceWith('assessments.challenge', { assessment: assessment, challenge: challenge });
      });
    }
  });
});
define('pix-live/routes/error', ['exports', 'lodash'], function (exports, _lodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({

    session: Ember.inject.service(),

    hasUnauthorizedError: function hasUnauthorizedError(error) {
      var statusCode = _lodash.default.get(error, 'errors[0].code');
      return statusCode === 401;
    },
    setupController: function setupController(controller, error) {
      var _this = this;

      this._super.apply(this, arguments);

      if (this.hasUnauthorizedError(error)) {
        return this.get('session').invalidate().then(function () {
          return _this.transitionTo('login');
        });
      }
    }
  });
});
define('pix-live/routes/index', ['exports', 'pix-live/routes/base-route', 'ember-simple-auth/mixins/unauthenticated-route-mixin'], function (exports, _baseRoute, _unauthenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_unauthenticatedRouteMixin.default, {

    session: Ember.inject.service(),
    store: Ember.inject.service(),

    beforeModel: function beforeModel() {
      var _this = this;

      if (this.get('session.isAuthenticated')) {
        return this.get('store').findRecord('user', this.get('session.data.authenticated.userId')).then(function (connectedUser) {

          if (connectedUser.get('organizations.length')) {
            _this.transitionTo('board');
          } else {
            _this.transitionTo('compte');
          }
        });
      }
    },
    model: function model() {
      return this.get('store').query('course', { isCourseOfTheWeek: false, isAdaptive: false });
    },
    setupController: function setupController(controller, model) {
      this._super(controller, model);
      this.controllerFor('index').set('session', this.get('session'));
    },


    actions: {
      startCourse: function startCourse(course) {
        this.transitionTo('courses.create-assessment', course.get('id'));
      }
    }

  });
});
define('pix-live/routes/inscription', ['exports', 'ember-simple-auth/mixins/unauthenticated-route-mixin', 'pix-live/routes/base-route'], function (exports, _unauthenticatedRouteMixin, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_unauthenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    model: function model() {
      // XXX: Model needs to be initialize with empty to handle validations on all fields from Api
      return this.store.createRecord('user', {
        lastName: '',
        firstName: '',
        email: '',
        password: '',
        cgu: false
      });
    },


    actions: {
      refresh: function refresh() {
        this.refresh();
      },
      redirectToProfileRoute: function redirectToProfileRoute(_ref) {
        var _this = this;

        var email = _ref.email,
            password = _ref.password;

        return this.get('session').authenticate('authenticator:simple', email, password).then(function () {
          return _this.get('store').queryRecord('user', {});
        }).then(function () {
          _this.transitionTo('compte');
        });
      }
    }
  });
});
define('pix-live/routes/legal-notices', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({});
});
define('pix-live/routes/login', ['exports', 'ember-simple-auth/mixins/unauthenticated-route-mixin', 'pix-live/routes/base-route'], function (exports, _unauthenticatedRouteMixin, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_unauthenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    routeIfNotAuthenticated: 'connexion',
    routeIfAlreadyAuthenticated: 'compte',
    routeForLoggedUserLinkedToOrganization: 'board',

    actions: {
      signin: function signin(email, password) {
        var _this = this;

        return this.get('session').authenticate('authenticator:simple', email, password).then(function (_) {
          return _this.get('store').queryRecord('user', {});
        }).then(function (user) {
          var routeToRedirect = _isUserLinkedToOrganization(user) ? _this.routeForLoggedUserLinkedToOrganization : _this.routeIfAlreadyAuthenticated;
          _this.transitionTo(routeToRedirect);
        });
      }
    }
  });


  function _isUserLinkedToOrganization(user) {
    if (!user.get('organizations')) {
      return false;
    }
    return user.get('organizations.length') > 0;
  }
});
define('pix-live/routes/logout', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({

    session: Ember.inject.service(),

    beforeModel: function beforeModel() {
      var session = this.get('session');
      if (session.get('isAuthenticated')) {
        session.invalidate();
      }
      this.transitionTo('/');
    }
  });
});
define('pix-live/routes/not-found', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    afterModel: function afterModel(model, transition) {
      transition.abort();
      this.transitionTo('index');
    }
  });
});
define('pix-live/routes/password-reset-demand', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({});
});
define('pix-live/routes/project', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({});
});
define('pix-live/routes/reset-password', ['exports', 'ember-simple-auth/mixins/unauthenticated-route-mixin', 'pix-live/routes/base-route'], function (exports, _unauthenticatedRouteMixin, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_unauthenticatedRouteMixin.default, {

    session: Ember.inject.service(),

    model: function model(params) {
      return this.get('store').findRecord('password-reset-demand', params.temporaryKey);
    }
  });
});
define('pix-live/routes/terms-of-service', ['exports', 'pix-live/routes/base-route'], function (exports, _baseRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend({});
});
define('pix-live/routes/user-certifications/get', ['exports', 'pix-live/routes/base-route', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _baseRoute, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {
    model: function model(params) {
      var _this = this;

      return this.get('store').findRecord('certification', params.id, { reload: true }).then(function (certification) {
        if (!certification.get('isPublished') || certification.get('status') !== 'validated') {
          return _this.replaceWith('/mes-certifications');
        }
        return certification;
      });
    }
  });
});
define('pix-live/routes/user-certifications/index', ['exports', 'pix-live/routes/base-route', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _baseRoute, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _baseRoute.default.extend(_authenticatedRouteMixin.default, {
    model: function model() {
      return this.get('store').findAll('certification');
    }
  });
});
define('pix-live/services/ajax', ['exports', 'ember-ajax/services/ajax', 'pix-live/config/environment'], function (exports, _ajax, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _ajax.default.extend({
    host: _environment.default.APP.API_HOST,
    contentType: 'application/json; charset=utf-8'
  });
});
define('pix-live/services/component-focus/focus-manager', ['exports', 'ember-component-focus/services/component-focus/focus-manager'], function (exports, _focusManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _focusManager.default;
    }
  });
});
define('pix-live/services/cookies', ['exports', 'ember-cookies/services/cookies'], function (exports, _cookies) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _cookies.default;
});
define('pix-live/services/current-routed-modal', ['exports', 'ember-routable-modal/configuration'], function (exports, _configuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    router: Ember.inject.service('router'),
    routeName: null,
    activeListener: function () {
      if (typeof Ember.$ !== 'undefined') {
        Ember.$('body')[this.get('routeName') ? 'addClass' : 'removeClass'](_configuration.default.modalOpenBodyClassName);
      }
    }.observes('routeName'),
    init: function init() {
      var _this = this;

      this._super.apply(this, arguments);

      if (typeof Ember.$ !== 'undefined' && typeof window !== 'undefined') {
        Ember.$(window).on('popstate.ember-routable-modal', function () {
          if (_this.get('routeName') !== _this.get('router._router.currentRouteName')) {
            _this.set('routeName', null);
          }
        });
      }
    },
    clear: function clear() {
      if (this.get('routeName')) {
        this.set('routeName', null);
      }
    },
    close: function close() {
      var routerMain = this.get('router._router');
      var routerLib = routerMain._routerMicrolib || routerMain.router;
      var handlerInfos = routerLib.state.handlerInfos;
      var currentController = handlerInfos[handlerInfos.length - 1]._handler.controller;

      this.set('routeName', null);

      if (currentController._isModalRoute) {
        var parentRoute = handlerInfos[handlerInfos.length - 2].name;

        routerLib.transitionTo(parentRoute);
      } else {
        //const url = this.get('router').generateURL(this.get('router.currentPath'));
        var url = this.get('router').urlFor(routerMain.get('currentRouteName'));

        routerLib.updateURL(url);
      }
    }
  });
});
define('pix-live/services/delay', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    ms: function ms(_ms) {
      /* istanbul ignore if  */
      if (_environment.default.APP.useDelay) {
        //unreachable by tests
        return new Ember.RSVP.Promise(function (resolve) {
          setTimeout(resolve, _ms);
        });
      }
      // test-only, to avoid test to take too long
      return new Ember.RSVP.resolve();
    }
  });
});
define('pix-live/services/dependency-checker', ['exports', 'ember-collapsible-panel/services/dependency-checker'], function (exports, _dependencyChecker) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dependencyChecker.default;
    }
  });
});
define('pix-live/services/google-recaptcha', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    loadScript: function loadScript() {
      return new Ember.RSVP.Promise(function (resolve) {
        Ember.$.getScript('https://www.google.com/recaptcha/api.js?onload=onGrecaptchaLoad&render=explicit', function () {
          window.onGrecaptchaLoad = function () {
            resolve();
          };
        });
      });
    },
    render: function render(containerId, callback, expiredCallback) {
      var grecaptcha = window.grecaptcha;
      (true && !(grecaptcha) && Ember.assert('window.grecaptcha must be available', grecaptcha));

      if (!this.get('isDestroyed')) {
        var parameters = {
          'callback': callback,
          'expired-callback': expiredCallback,
          'sitekey': _environment.default.APP.GOOGLE_RECAPTCHA_KEY
        };
        grecaptcha.render(containerId, parameters);
      }
    },
    reset: function reset() {
      var grecaptcha = window.grecaptcha;
      grecaptcha.reset();
    }
  });
});
define('pix-live/services/keyboard', ['exports', 'ember-keyboard/services/keyboard'], function (exports, _keyboard) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _keyboard.default;
    }
  });
});
define('pix-live/services/mail-generator', ['exports', 'moment'], function (exports, _moment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({

    generateEmail: function generateEmail(challengeId, assessmentId, host, environment) {

      var fullyQualifiedDomainName = environment !== 'development' ? 'pix-infra.ovh' : 'localhost';

      var applicationReviewName = '';
      if (environment === 'integration' || environment === 'staging') {
        applicationReviewName = '+' + host.split('.')[0];
      }

      return challengeId + '-' + assessmentId + '-' + (0, _moment.default)().format('DDMM') + applicationReviewName + '@' + fullyQualifiedDomainName;
    }

  });
});
define('pix-live/services/media', ['exports', 'ember-responsive/media'], function (exports, _media) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _media.default;
});
define('pix-live/services/metrics', ['exports', 'ember-metrics/services/metrics'], function (exports, _metrics) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _metrics.default;
    }
  });
});
define('pix-live/services/modal-dialog', ['exports', 'pix-live/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = Ember.computed,
      Service = Ember.Service;


  function computedFromConfig(prop) {
    return computed(function () {
      return _environment.default['ember-modal-dialog'] && _environment.default['ember-modal-dialog'][prop];
    });
  }

  exports.default = Service.extend({
    hasEmberTether: computedFromConfig('hasEmberTether'),
    hasLiquidWormhole: computedFromConfig('hasLiquidWormhole'),
    hasLiquidTether: computedFromConfig('hasLiquidTether'),
    destinationElementId: computed(function () {
      /*
        everywhere except test, this property will be overwritten
        by the initializer that appends the modal container div
        to the DOM. because initializers don't run in unit/integration
        tests, this is a nice fallback.
      */
      if (_environment.default.environment === 'test') {
        return 'ember-testing';
      }
    })
  });
});
define('pix-live/services/moment', ['exports', 'ember-moment/services/moment', 'pix-live/config/environment'], function (exports, _moment, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var get = Ember.get;
  exports.default = _moment.default.extend({
    defaultFormat: get(_environment.default, 'moment.outputFormat')
  });
});
define('pix-live/services/panel-actions', ['exports', 'ember-collapsible-panel/services/panel-actions'], function (exports, _panelActions) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _panelActions.default;
    }
  });
});
define('pix-live/services/raven', ['exports', 'ember-cli-sentry/services/raven'], function (exports, _raven) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _raven.default;
    }
  });
});
define('pix-live/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _session) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _session.default;
});
define('pix-live/services/side-menu', ['exports', 'ember-side-menu/services/side-menu'], function (exports, _sideMenu) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sideMenu.default;
    }
  });
});
define('pix-live/services/splash', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    hide: function hide() {
      var splash = document.getElementById('app-splash');
      if (splash) {
        splash.parentNode.removeChild(splash);
      }
    }
  });
});
define('pix-live/session-stores/application', ['exports', 'ember-simple-auth/session-stores/adaptive'], function (exports, _adaptive) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _adaptive.default.extend();
});
define("pix-live/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hTt5iHZH", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"body\"],[8],[0,\"\\n  \"],[1,[20,\"outlet\"],false],[0,\"\\n  \"],[1,[20,\"routable-modal-outlet\"],false],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/application.hbs" } });
});
define("pix-live/templates/assessments/challenge", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "fZh89qK1", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"assessment-challenge\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__course-banner\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"model\",\"assessment\",\"isCertification\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"certification-banner\",null,[[\"user\",\"certificationNumber\"],[[22,[\"model\",\"user\"]],[22,[\"model\",\"assessment\",\"certificationNumber\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[1,[26,\"course-banner\",null,[[\"course\",\"withHomeLink\"],[[22,[\"model\",\"assessment\",\"course\"]],true]]],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__content\"],[8],[0,\"\\n\"],[4,\"unless\",[[22,[\"model\",\"assessment\",\"course\",\"isAdaptive\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__progress-bar\"],[8],[0,\"\\n        \"],[1,[26,\"progress-bar\",null,[[\"assessment\"],[[22,[\"model\",\"assessment\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n    \"],[1,[26,\"component\",[[26,\"get-challenge-component-class\",[[22,[\"model\",\"challenge\"]]],null]],[[\"challenge\",\"assessment\",\"answers\",\"answerValidated\"],[[22,[\"model\",\"challenge\"]],[22,[\"model\",\"assessment\"]],[22,[\"model\",\"answers\"]],[26,\"route-action\",[\"saveAnswerAndNavigate\"],null]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/challenge.hbs" } });
});
define("pix-live/templates/assessments/checkpoint", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+tT6+owz", "block": "{\"symbols\":[\"answer\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"assessment-challenge\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__course-banner\"],[8],[0,\"\\n      \"],[1,[26,\"course-banner\",null,[[\"course\",\"withHomeLink\"],[[22,[\"model\",\"course\"]],true]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__content\"],[8],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"smart-random pix-progress-bar-wrapper\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"checkpoint-title\"],[8],[0,\"Mon parcours effectué\"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"pix-progress-bar\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"pix-progress-bar__marker\"],[11,\"style\",[27,[\"width: \",[22,[\"model\",\"skillReview\",\"profileCompletionPercentage\"]]]]],[8],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n\\n      \"],[6,\"div\"],[10,\"class\",\"pix-progress-bar__legend-wrapper\"],[11,\"style\",[27,[\"width: \",[22,[\"model\",\"skillReview\",\"profileCompletionPercentage\"]]]]],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"pix-progress-bar__legend-circle\"],[8],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"pix-progress-bar__legend\"],[8],[0,\"\\n          \"],[6,\"p\"],[10,\"class\",\"sr-only\"],[8],[0,\"Vous avez effectué\"],[9],[1,[22,[\"model\",\"skillReview\",\"profileCompletionPercentage\"]],false],[6,\"p\"],[10,\"class\",\"sr-only\"],[8],[0,\" de votre parcours.\"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"h2\"],[8],[0,\"Vos réponses :\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"assessment-results__list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"model\",\"answersSinceLastCheckpoints\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"result-item\",null,[[\"answer\",\"index\",\"openComparison\",\"a11y-focus-id\"],[[21,1,[]],[21,2,[]],\"openComparison\",[26,\"concat\",[\"open-comparison_\",[26,\"add\",[[21,2,[]],1],null]],null]]]],false],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"assessment-challenge__continue-wrapper\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"finalCheckpoint\"]]],null,{\"statements\":[[4,\"link-to\",[\"campaigns.skill-review\",[22,[\"model\",\"id\"]]],[[\"class\"],[\"assessment-checkpoint__continue-button\"]],{\"statements\":[[0,\"          Voir mes résultats\\n          \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/button-continue/button-continue-next.png\"]]],[11,\"srcset\",[27,[\"\\n           \",[20,\"rootURL\"],\"/images/button-continue/button-continue-next@2x.png 2x,\\n\\t\\t\\t\\t\\t \",[20,\"rootURL\"],\"/images/button-continue/button-continue-next@3x.png 3x\"]]],[10,\"alt\",\"\"],[10,\"class\",\"assessment-checkpoint__continue-button__image\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"link-to\",[\"assessments.resume\",[22,[\"model\",\"id\"]]],[[\"class\"],[\"assessment-checkpoint__continue-button\"]],{\"statements\":[[0,\"          Je continue\\n          \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/button-continue/button-continue-next.png\"]]],[11,\"srcset\",[27,[\"\\n           \",[20,\"rootURL\"],\"/images/button-continue/button-continue-next@2x.png 2x,\\n\\t\\t\\t\\t\\t \",[20,\"rootURL\"],\"/images/button-continue/button-continue-next@3x.png 3x\"]]],[10,\"alt\",\"\"],[10,\"class\",\"assessment-checkpoint__continue-button__image\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/checkpoint.hbs" } });
});
define("pix-live/templates/assessments/comparison", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "73sA44y5", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"comparison-window\",null,[[\"answer\",\"challenge\",\"correction\",\"index\"],[[22,[\"model\",\"answer\"]],[22,[\"model\",\"challenge\"]],[22,[\"model\",\"correction\"]],[22,[\"model\",\"index\"]]]]],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/comparison.hbs" } });
});
define("pix-live/templates/assessments/rating", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6R1rz1wF", "block": "{\"symbols\":[],\"statements\":[[1,[20,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/rating.hbs" } });
});
define("pix-live/templates/assessments/results", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lciGzvUF", "block": "{\"symbols\":[\"answer\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"assessment-results\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"model\",\"course\",\"isAdaptive\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"assessment-results__logo-banner\"],[8],[0,\"\\n      \"],[1,[20,\"pix-logo\"],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"assessment-results__scoring\"],[8],[0,\"\\n      \"],[1,[26,\"scoring-panel\",null,[[\"assessment\"],[[22,[\"model\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"assessment-results__course-banner\"],[8],[0,\"\\n      \"],[1,[26,\"course-banner\",null,[[\"course\"],[[22,[\"model\",\"course\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"assessment-results__content\"],[8],[0,\"\\n    \"],[6,\"h2\"],[10,\"class\",\"assessment-results__title\"],[8],[0,\"\\n      Vos résultats\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"assessment-results__list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"model\",\"answers\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"result-item\",null,[[\"answer\",\"index\",\"openComparison\",\"a11y-focus-id\"],[[21,1,[]],[21,2,[]],\"openComparison\",[26,\"concat\",[\"open-comparison_\",[26,\"add\",[[21,2,[]],1],null]],null]]]],false],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"assessment-results__index-link-container\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"index\"],[[\"class\",\"tagName\"],[\"assessment-results__index-link__element\",\"button\"]],{\"statements\":[[0,\"        \"],[6,\"span\"],[10,\"class\",\"assessment-results__link-back\"],[8],[0,\"Revenir à l'accueil\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/results.hbs" } });
});
define("pix-live/templates/assessments/resume-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "M9UBWHhA", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"app-loader\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__image\"],[8],[6,\"img\"],[10,\"src\",\"/images/interwind.gif\"],[8],[9],[9],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__text\"],[8],[0,\"Votre test est en cours de reprise…\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/resume-loading.hbs" } });
});
define("pix-live/templates/assessments/resume", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0ngPyWXs", "block": "{\"symbols\":[],\"statements\":[[1,[20,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/assessments/resume.hbs" } });
});
define("pix-live/templates/board", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "b1SUyBDt", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"board-page\"],[8],[0,\"\\n\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"board-page__header\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"board-page__header-organisation\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"board-page__header-organisation__text\"],[8],[0,\"Votre Organisation\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"board-page__header-organisation__name\"],[8],[1,[22,[\"model\",\"organization\",\"name\"]],false],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"board-page__header-code\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"board-page__header-code__title\"],[8],[0,\"Code Organisation\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"board-page__header-code__text\"],[8],[1,[22,[\"model\",\"organization\",\"code\"]],false],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"board-page__header-code__comment\"],[8],[0,\"Communiquez ce code à vos élèves, étudiants ou collaborateurs et ils\\n        pourront vous envoyer leurs profils Pix.\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"board-page__profiles-title\"],[8],[0,\"Profils envoyés\\n    \"],[6,\"a\"],[10,\"class\",\"profiles-title__export-csv\"],[11,\"href\",[27,[[22,[\"model\",\"organizationSnapshotsExportUrl\"]]]]],[10,\"target\",\"_blank\"],[10,\"download\",\"\"],[8],[0,\"\\n      Exporter (.csv)\\n      \"],[6,\"img\"],[10,\"class\",\"profiles-title__export-csv-icon\"],[10,\"src\",\"/images/icons/icon-export.svg\"],[10,\"alt\",\"Exporter les profils partagés\"],[10,\"width\",\"20\"],[10,\"height\",\"20\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[1,[26,\"snapshot-list\",null,[[\"snapshots\"],[[22,[\"model\",\"snapshots\"]]]]],false],[0,\"\\n\\n  \"],[1,[20,\"app-footer\"],false],[0,\"\\n\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/board.hbs" } });
});
define("pix-live/templates/campaigns", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ihY6rixt", "block": "{\"symbols\":[],\"statements\":[[6,\"header\"],[10,\"class\",\"campaign__header\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"campaign__header__links\"],[8],[0,\"\\n    \"],[4,\"link-to\",[\"index\"],null,{\"statements\":[[6,\"span\"],[10,\"aria-hidden\",\"true\"],[8],[0,\"< \"],[9],[0,\"Retour à mon compte\"]],\"parameters\":[]},null],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"campaign__gradient\"],[8],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"campaign__container\"],[8],[0,\"\\n  \"],[1,[20,\"outlet\"],false],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/campaigns.hbs" } });
});
define("pix-live/templates/campaigns/skill-review", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "u3CsB/Hl", "block": "{\"symbols\":[],\"statements\":[[6,\"p\"],[10,\"class\",\"campaign__competence__title\"],[8],[0,\"\\n  Vous maîtrisez \"],[1,[22,[\"model\",\"skillReview\",\"profileMasteryPercentage\"]],false],[0,\" des compétences\\n  du parcours e-pro !\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"campaign__share_container\"],[8],[0,\"\\n  \"],[6,\"button\"],[10,\"class\",\"campaign__share__button\"],[8],[0,\"J’envoie  mes résultats\"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"p\"],[10,\"class\",\"campaign__share__legal\"],[8],[0,\"\\n  En cliquant, les résultats de votre parcours seront transmis à Pôle emploi pour permettre à votre conseiller de vous\\n  accompagner.\\n\"],[9],[0,\"\\n\"],[1,[20,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/campaigns/skill-review.hbs" } });
});
define("pix-live/templates/campaigns/start-or-resume-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "5pWBS/jK", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"app-loader\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__image\"],[8],[6,\"img\"],[10,\"src\",\"/images/interwind.gif\"],[8],[9],[9],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__text\"],[8],[0,\"\\n    Votre test est en cours de préparation.\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/campaigns/start-or-resume-loading.hbs" } });
});
define("pix-live/templates/campaigns/start-or-resume", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "J61xaKc7", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"app-loader\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__image\"],[8],[6,\"img\"],[10,\"src\",\"/images/interwind.gif\"],[8],[9],[9],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__text\"],[8],[0,\"\\n    Votre parcours est en cours de préparation.\\n  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/campaigns/start-or-resume.hbs" } });
});
define("pix-live/templates/certifications/results", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "pRyua0aY", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"certification-results-page\",null,[[\"user\",\"certificationNumber\"],[[22,[\"model\",\"user\"]],[22,[\"model\",\"certificationNumber\"]]]]],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/certifications/results.hbs" } });
});
define("pix-live/templates/certifications/resume", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2aXJGCTJ", "block": "{\"symbols\":[],\"statements\":[[1,[20,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/certifications/resume.hbs" } });
});
define("pix-live/templates/certifications/start-error", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Q+BnZ2XL", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"certification-error-page\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certification-error-page__ribbon blue-ribbon\"],[8],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certification-error-page__panel rounded-panel\"],[8],[0,\"\\n    \"],[6,\"h2\"],[10,\"class\",\"certification-error-page__title\"],[8],[0,\"\\n      Votre profil n'est pas encore certifiable.\\n    \"],[9],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"certification-error-page__text\"],[8],[0,\"\\n      Pour faire certifier votre profil, vous devez avoir obtenu un niveau supérieur à 0 dans 5 compétences minimum.\\n    \"],[9],[0,\"\\n\\n    \"],[4,\"link-to\",[\"index\"],[[\"class\"],[\"certification-error-page__button\"]],{\"statements\":[[0,\"Retour à l'accueil\"]],\"parameters\":[]},null],[0,\"\\n\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/certifications/start-error.hbs" } });
});
define("pix-live/templates/certifications/start", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "AK6NxP6r", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"certification-start-page\"],[8],[0,\"\\n\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certification-start-page__ribbon blue-ribbon\"],[8],[9],[0,\"\\n\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certification-start-page__panel rounded-panel\"],[8],[0,\"\\n    \"],[6,\"h2\"],[10,\"class\",\"certification-start-page__title\"],[8],[0,\"Lancement du test de certification\"],[9],[0,\"\\n\\n    \"],[1,[26,\"certification-code-validation\",null,[[\"onSubmit\",\"onError\"],[[26,\"route-action\",[\"submit\"],null],[26,\"route-action\",[\"error\"],null]]]],false],[0,\"\\n\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/certifications/start.hbs" } });
});
define("pix-live/templates/challenge-preview", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XIsiJ67e", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"id\",\"challenge-preview\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n      \"],[1,[26,\"component\",[[26,\"get-challenge-component-class\",[[22,[\"model\",\"challenge\"]]],null]],[[\"challenge\"],[[22,[\"model\",\"challenge\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/challenge-preview.hbs" } });
});
define("pix-live/templates/competences", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "aeMeh+kO", "block": "{\"symbols\":[\"panels\",\"domain\",\"panel\",\"topic\"],\"statements\":[[6,\"div\"],[10,\"class\",\"competences-page\"],[8],[0,\"\\n\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"blue-ribbon\"],[8],[0,\"\\n    \"],[6,\"h1\"],[10,\"class\",\"blue-ribbon__text\"],[8],[0,\"\\n      Retrouvez les 5 domaines de compétences que Pix souhaite évaluer, en accord avec le référentiel européen DIGCOMP.\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[4,\"cp-panels\",null,[[\"class\"],[\"competences-page__domains\"]],{\"statements\":[[4,\"each\",[[22,[\"model\"]]],null,{\"statements\":[[4,\"component\",[[21,1,[\"panel\"]]],[[\"class\"],[\"rounded-panel competences-domain\"]],{\"statements\":[[4,\"component\",[[21,3,[\"toggle\"]]],[[\"class\"],[\"competences-domain__header\"]],{\"statements\":[[0,\"          \"],[6,\"h2\"],[10,\"class\",\"competences-domain__title\"],[8],[1,[21,2,[\"title\"]],false],[9],[0,\"\\n          \"],[6,\"span\"],[10,\"class\",\"competences-domain__title-icon\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[21,3,[\"body\"]]],[[\"class\"],[\"competences-domain__content\"]],{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"competences-domain__topics\"],[8],[0,\"\\n\"],[4,\"each\",[[21,2,[\"topics\"]]],null,{\"statements\":[[0,\"              \"],[6,\"div\"],[10,\"class\",\"domain-topic\"],[8],[0,\"\\n                \"],[6,\"h3\"],[10,\"class\",\"domain-topic__title\"],[8],[1,[21,4,[\"title\"]],false],[9],[0,\"\\n                \"],[6,\"p\"],[10,\"class\",\"domain-topic__description\"],[8],[1,[21,4,[\"description\"]],false],[9],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"domain-topic__themes\"],[8],[0,\"\\n                  \"],[6,\"h4\"],[10,\"class\",\"domain-topic__themes-title\"],[8],[0,\"Thématiques associées\"],[9],[0,\"\\n                  \"],[6,\"p\"],[10,\"class\",\"domain-topic__themes-content\"],[8],[1,[21,4,[\"themes\"]],false],[9],[0,\"\\n                \"],[9],[0,\"\\n              \"],[9],[0,\"\\n\"]],\"parameters\":[4]},null],[0,\"          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/competences.hbs" } });
});
define("pix-live/templates/components/app-footer", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "PLze1KcZ", "block": "{\"symbols\":[],\"statements\":[[6,\"section\"],[10,\"class\",\"app-footer__section app-footer__section--pix-logo\"],[8],[0,\"\\n  \"],[1,[20,\"pix-logo\"],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"section\"],[10,\"class\",\"app-footer__section app-footer__section--contact\"],[8],[0,\"\\n  \"],[6,\"a\"],[10,\"class\",\"app-footer__link-text\"],[10,\"href\",\"mailto:contact@pix.fr\"],[8],[0,\"Contactez-nous\"],[9],[0,\"\\n  |\\n  \"],[6,\"a\"],[10,\"class\",\"app-footer__link-text\"],[10,\"href\",\"/mentions-legales\"],[8],[0,\"Mentions légales\"],[9],[0,\"\\n  |\\n  \"],[6,\"a\"],[10,\"class\",\"app-footer__link-text\"],[10,\"href\",\"https://github.com/1024pix/pix\"],[10,\"target\",\"_blank\"],[8],[0,\"Le code source est libre\"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"section\"],[10,\"class\",\"app-footer__section app-footer__section--marianne-logo\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"mariane-logo-container\"],[8],[0,\"\\n    \"],[6,\"img\"],[10,\"src\",\"/images/logo-marianne-footer.jpg\"],[10,\"class\",\"app-footer__logo-marianne-img mariane-logo__item\"],[10,\"alt\",\"Un projet du Ministère de l'Education Nationale et du Ministère de l'Enseignement Supérieur de la Recherche et de l'Innovation\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/app-footer.hbs" } });
});
define("pix-live/templates/components/beta-logo", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "5usfVjRy", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[8],[0,\"Bêta\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/beta-logo.hbs" } });
});
define("pix-live/templates/components/certification-banner", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "kxDpMjYy", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"certification-banner__container\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"certification-banner__user-fullname\"],[8],[0,\"\\n    \"],[1,[20,\"fullname\"],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certification-banner__certification-number\"],[8],[0,\"\\n    #\"],[1,[20,\"certificationNumber\"],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/certification-banner.hbs" } });
});
define("pix-live/templates/components/certification-code-validation", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "iQDGosxo", "block": "{\"symbols\":[],\"statements\":[[6,\"p\"],[10,\"class\",\"certification-course-page__order\"],[8],[0,\"\\n  Un code d'accès va vous être communiqué par le responsable de la session.\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"certification-course-page__session-code-input\"],[8],[0,\"\\n  \"],[1,[26,\"input\",null,[[\"id\",\"type\",\"value\",\"placeholder\"],[\"session-code\",\"text\",[22,[\"_accessCode\"]],\"Code d'accès\"]]],false],[0,\"\\n\"],[4,\"if\",[[22,[\"_errorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"certification-course-page__errors\"],[8],[1,[20,\"_errorMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"certification-course-page__cgu\"],[8],[0,\"\\n  \"],[6,\"p\"],[8],[0,\"\\n    En cliquant sur \\\"Lancer le test\\\", j’accepte que mes données d’identité, le numéro de certification et les\\n    circonstances de la passation telles que renseignées par l’examinateur soient communiquées à Pix. Pix les utilisera\\n    lors de la délibération du jury pour produire et archiver mes résultats et pour éditer mon certificat. Si cette\\n    certification m’a été prescrite par une organisation, j’accepte que Pix lui communique mes résultats.\\n  \"],[9],[0,\"\\n  \"],[6,\"p\"],[8],[0,\"\\n    Conformément à la loi « informatique et libertés », vous pouvez exercer votre droit d'accès aux données vous\\n    concernant et les faire rectifier en envoyant un mail à \"],[6,\"a\"],[10,\"href\",\"mailto:dpo@pix.fr\"],[8],[0,\"dpo@pix.fr\"],[9],[0,\".\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"certification-course-page__field-button\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_loadingCertification\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"certification-course-page__field-button__action-validate\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"certification-course-page__field-button__loader-bar\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[6,\"button\"],[10,\"class\",\"certification-course-page__submit_button\"],[10,\"type\",\"submit\"],[3,\"action\",[[21,0,[]],\"submit\"]],[8],[0,\"Lancer le test\"],[9],[0,\"\\n\"]],\"parameters\":[]}],[9],[0,\"\\n\\n\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/certification-code-validation.hbs" } });
});
define("pix-live/templates/components/certification-results-page", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Gc3OjcCU", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"certification-results__certification-banner\"],[8],[0,\"\\n  \"],[1,[26,\"certification-banner\",null,[[\"user\",\"certificationNumber\"],[[22,[\"user\"]],[22,[\"certificationNumber\"]]]]],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"certification-results__content result-content\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"notFinishedYet\"]]],null,{\"statements\":[[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__panel-picture\"],[8],[0,\"\\n      \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/flag.svg\"]]],[10,\"alt\",\"drapeau\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__panel-title\"],[8],[0,\"\\n      Vous avez presque terminé\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__panel-description-supervisor\"],[8],[0,\"\\n      Appelez le surveillant :\\n      \"],[6,\"br\"],[8],[9],[0,\"Il doit impérativement voir cet écran pour finaliser votre certification.\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__warning-container\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"result-content__checked-supervisor\"],[8],[0,\"\\n        \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\",\"alt\"],[\"checkbox\",\"validSupervisor\",[22,[\"validSupervisor\"]],\"Le surveillant doit cliquer ici.\"]]],false],[0,\"\\n\\n        \"],[6,\"span\"],[10,\"class\",\"result-content__warning-text\"],[8],[0,\"\\n          Le surveillant a bien vu cet écran.\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"validSupervisor\"]]],null,{\"statements\":[[0,\"        \"],[6,\"button\"],[10,\"class\",\"result-content__button result-content__validation-button\"],[3,\"action\",[[21,0,[]],\"validateBySupervisor\"]],[8],[0,\"Je confirme\"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[6,\"button\"],[10,\"class\",\"result-content__button result-content__button-blocked\"],[8],[0,\"Je confirme\"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[9],[0,\"\\n\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"result-content__panel-title\"],[8],[0,\"\\n      Bravo, c'est fini !\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__panel-description\"],[8],[0,\"\\n      Vos résultats seront prochainement disponibles depuis votre compte.\\n\\n      \"],[6,\"br\"],[8],[9],[0,\"Vous serez averti par e-mail.\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"result-content__warning-container\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"result-content__warning-text\"],[8],[0,\"\\n        Si cet ordinateur n’est pas le vôtre, pensez à vous déconnecter.\\n      \"],[9],[0,\"\\n\\n      \"],[4,\"link-to\",[\"logout\"],[[\"class\"],[\"result-content__logout-button result-content__button\"]],{\"statements\":[[0,\"Se déconnecter\"]],\"parameters\":[]},null],[0,\"\\n\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/certification-results-page.hbs" } });
});
define("pix-live/templates/components/certifications-list-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "odorMzId", "block": "{\"symbols\":[\"panel\"],\"statements\":[[4,\"if\",[[22,[\"isPublishedAndRejected\"]]],null,{\"statements\":[[4,\"cp-panel\",null,null,{\"statements\":[[4,\"component\",[[21,1,[\"toggle\"]]],[[\"class\",\"role\"],[\"certifications-list-item__row-presentation\",\"tab\"]],{\"statements\":[[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell\"],[8],[0,\"\\n        \"],[1,[26,\"moment-format\",[[22,[\"certification\",\"date\"]],\"DD/MM/YYYY\"],[[\"allow-empty\"],[true]]],false],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-double-width\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"src\",\"/images/icons/icon-croix.svg\"],[10,\"alt\",\"\"],[10,\"class\",\"certifications-list-item__cross-img\"],[8],[9],[0,\"\\n        Certification non obtenue\\n      \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-pix-score\"],[8],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-certification-center\"],[8],[0,\"\\n        \"],[1,[22,[\"certification\",\"certificationCenter\"]],false],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-detail\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"shouldDisplayComment\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-detail-button\"],[8],[0,\"\\n            DÉTAIL\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"shouldDisplayComment\"]]],null,{\"statements\":[[4,\"component\",[[21,1,[\"body\"]]],[[\"class\",\"role\"],[\"certifications-list-item__row-comment\",\"tabpanel\"]],{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__row-comment-cell\"],[8],[0,\"\\n          \"],[1,[22,[\"certification\",\"commentForCandidate\"]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isPublishedAndValidated\"]]],null,{\"statements\":[[4,\"link-to\",[\"user-certifications.get\",[22,[\"certification\",\"id\"]]],[[\"class\"],[\"certifications-list-item__row-presentation\"]],{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell\"],[8],[0,\"\\n      \"],[1,[26,\"moment-format\",[[22,[\"certification\",\"date\"]],\"DD/MM/YYYY\"],[[\"allow-empty\"],[true]]],false],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-double-width\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"src\",\"/images/icons/icon-check-vert.svg\"],[10,\"alt\",\"\"],[10,\"class\",\"certifications-list-item__green-check-img\"],[8],[9],[0,\"\\n      Certification obtenue\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-pix-score\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__pix-score\"],[8],[0,\"\\n        \"],[6,\"span\"],[8],[1,[22,[\"certification\",\"pixScore\"]],false],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-certification-center\"],[8],[0,\"\\n      \"],[1,[22,[\"certification\",\"certificationCenter\"]],false],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-detail\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-detail-link\"],[8],[0,\"VOIR LES RÉSULTATS\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isNotPublished\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__row-presentation\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell\"],[8],[0,\"\\n      \"],[1,[26,\"moment-format\",[[22,[\"certification\",\"date\"]],\"DD/MM/YYYY\"],[[\"allow-empty\"],[true]]],false],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-double-width\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"src\",\"/images/sablier.svg\"],[10,\"alt\",\"\"],[10,\"class\",\"certifications-list-item__hourglass-img\"],[8],[9],[0,\"\\n      En attente du résultat\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-pix-score\"],[8],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-certification-center\"],[8],[0,\"\\n      \"],[1,[22,[\"certification\",\"certificationCenter\"]],false],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list-item__cell-detail\"],[8],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/certifications-list-item.hbs" } });
});
define("pix-live/templates/components/certifications-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "p57cgtXM", "block": "{\"symbols\":[\"certification\"],\"statements\":[[6,\"div\"],[10,\"class\",\"certifications-list__table\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header-cell\"],[8],[0,\"DATE\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header-cell-double-width\"],[8],[0,\"STATUT\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header-cell\"],[8],[0,\"SCORE PIX\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header-cell-certification-center\"],[8],[0,\"CENTRE DE CERTIFICATION\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-header-cell\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"certifications-list__table-body\"],[10,\"role\",\"tablist\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"certifications\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"certifications-list-item\",null,[[\"certification\"],[[21,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/certifications-list.hbs" } });
});
define("pix-live/templates/components/challenge-actions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "RTAc/wHh", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"isValidateButtonEnable\"]]],null,{\"statements\":[[0,\"  \"],[6,\"a\"],[10,\"class\",\"challenge-actions__action challenge-actions__action-validate\"],[10,\"href\",\"#\"],[3,\"action\",[[21,0,[]],\"validateAnswer\"]],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"challenge-actions__action-validate-text\"],[8],[0,\"Je valide\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-actions__action challenge-actions__action-validate__loader\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"challenge-actions__action-validate__loader-bar\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[4,\"if\",[[22,[\"isSkipButtonEnable\"]]],null,{\"statements\":[[0,\"  \"],[6,\"a\"],[10,\"class\",\"challenge-actions__action challenge-actions__action-skip\"],[10,\"href\",\"#\"],[3,\"action\",[[21,0,[]],\"skipChallenge\"]],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"challenge-actions__action-skip-text\"],[8],[0,\"Je passe\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-actions__action challenge-actions__action-skip__loader\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"challenge-actions__action-skip__loader-bar\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-actions.hbs" } });
});
define("pix-live/templates/components/challenge-embed-simulator", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TzEAyjwy", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"_isSimulatorNotYetLaunched\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-embed-simulator__aknowledgment-overlay\"],[8],[0,\"\\n    \"],[6,\"button\"],[10,\"class\",\"challenge-embed-simulator__launch-simulator-button\"],[3,\"action\",[[21,0,[]],\"launchSimulator\"]],[8],[0,\"Je lance l’application\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"challenge-embed-simulator__simulator blurred\"],[8],[0,\"\\n  \"],[6,\"iframe\"],[10,\"class\",\"challenge-embed-simulator__iframe\"],[11,\"src\",[27,[[22,[\"embedDocument\",\"url\"]]]]],[11,\"title\",[27,[[22,[\"embedDocument\",\"title\"]]]]],[8],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"button\"],[10,\"class\",\"challenge-embed-simulator__reload-button\"],[3,\"action\",[[21,0,[]],\"reloadSimulator\"]],[8],[0,\"Recharger l’application\"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-embed-simulator.hbs" } });
});
define("pix-live/templates/components/challenge-item-generic", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Pb+On6Pr", "block": "{\"symbols\":[\"&default\"],\"statements\":[[13,1],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-generic.hbs" } });
});
define("pix-live/templates/components/challenge-item-qcm", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "WNBQqCU1", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[4,\"unless\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"warning-page\",null,[[\"hasUserConfirmWarning\",\"time\"],[[26,\"action\",[[21,0,[]],\"setUserConfirmation\"],null],[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"unless\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[0,\"\\n  \"],[1,[26,\"challenge-statement\",null,[[\"challenge\",\"assessment\"],[[22,[\"challenge\"]],[22,[\"assessment\"]]]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel challenge-response\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-proposals\"],[8],[0,\"\\n      \"],[1,[26,\"qcm-proposals\",null,[[\"answersValue\",\"proposals\",\"answerChanged\"],[[22,[\"answers\",\"value\"]],[22,[\"challenge\",\"proposals\"]],[26,\"action\",[[21,0,[]],\"answerChanged\"],null]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"timer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row timeout-jauge-wrapper\"],[8],[0,\"\\n        \"],[1,[26,\"timeout-jauge\",null,[[\"allotedTime\"],[[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"errorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n      \"],[1,[20,\"errorMessage\"],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"assessment\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"challenge-actions\",null,[[\"challenge\",\"challengeSkipped\",\"answerValidated\"],[[22,[\"challenge\"]],[26,\"action\",[[21,0,[]],\"skipChallenge\"],null],[26,\"action\",[[21,0,[]],\"validateAnswer\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canDisplayFeedbackPanel\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-item__feedback\"],[8],[0,\"\\n    \"],[1,[26,\"feedback-panel\",null,[[\"assessment\",\"challenge\"],[[22,[\"assessment\"]],[22,[\"challenge\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-qcm.hbs" } });
});
define("pix-live/templates/components/challenge-item-qcu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0JdenoUB", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[4,\"unless\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"warning-page\",null,[[\"hasUserConfirmWarning\",\"time\"],[[26,\"action\",[[21,0,[]],\"setUserConfirmation\"],null],[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"unless\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[0,\"\\n  \"],[1,[26,\"challenge-statement\",null,[[\"challenge\",\"assessment\"],[[22,[\"challenge\"]],[22,[\"assessment\"]]]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel challenge-response\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-proposals\"],[8],[0,\"\\n      \"],[1,[26,\"qcu-proposals\",null,[[\"answersValue\",\"proposals\",\"answerChanged\"],[[22,[\"answers\",\"value\"]],[22,[\"challenge\",\"proposals\"]],[26,\"action\",[[21,0,[]],\"answerChanged\"],null]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"timer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row timeout-jauge-wrapper\"],[8],[0,\"\\n          \"],[1,[26,\"timeout-jauge\",null,[[\"allotedTime\"],[[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"errorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n      \"],[1,[20,\"errorMessage\"],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"assessment\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"challenge-actions\",null,[[\"challenge\",\"challengeSkipped\",\"answerValidated\"],[[22,[\"challenge\"]],[26,\"action\",[[21,0,[]],\"skipChallenge\"],null],[26,\"action\",[[21,0,[]],\"validateAnswer\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canDisplayFeedbackPanel\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-item__feedback\"],[8],[0,\"\\n    \"],[1,[26,\"feedback-panel\",null,[[\"assessment\",\"challenge\"],[[22,[\"assessment\"]],[22,[\"challenge\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-qcu.hbs" } });
});
define("pix-live/templates/components/challenge-item-qmail", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "KTiVz7ZF", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"challenge-statement\",null,[[\"challenge\",\"assessment\"],[[22,[\"challenge\"]],[22,[\"assessment\"]]]]],false],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"rounded-panel challenge-response\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-proposals\"],[8],[0,\"\\n    \"],[1,[26,\"input\",null,[[\"type\",\"checked\",\"id\"],[\"checkbox\",[22,[\"_isChecked\"]],\"checkbox_qmail_confirmation\"]]],false],[0,\"\\n    \"],[6,\"label\"],[10,\"for\",\"checkbox_qmail_confirmation\"],[10,\"class\",\"label-checkbox-proposal\"],[8],[0,\"Je l'ai fait\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"errorMessage\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n    \"],[1,[20,\"errorMessage\"],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[26,\"challenge-actions\",null,[[\"challengeSkipped\",\"answerValidated\"],[[26,\"action\",[[21,0,[]],\"skipChallenge\"],null],[26,\"action\",[[21,0,[]],\"validateAnswer\"],null]]]],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-qmail.hbs" } });
});
define("pix-live/templates/components/challenge-item-qroc", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "gZOaHrCz", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[4,\"unless\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"warning-page\",null,[[\"hasUserConfirmWarning\",\"time\"],[[26,\"action\",[[21,0,[]],\"setUserConfirmation\"],null],[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"unless\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[0,\"\\n  \"],[1,[26,\"challenge-statement\",null,[[\"challenge\",\"assessment\"],[[22,[\"challenge\"]],[22,[\"assessment\"]]]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel challenge-response\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-proposals\"],[8],[0,\"\\n      \"],[1,[26,\"qroc-proposal\",null,[[\"proposals\",\"answerValue\",\"answerChanged\"],[[22,[\"challenge\",\"proposals\"]],[22,[\"answers\",\"value\"]],[26,\"action\",[[21,0,[]],\"answerChanged\"],null]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"timer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row timeout-jauge-wrapper\"],[8],[0,\"\\n          \"],[1,[26,\"timeout-jauge\",null,[[\"allotedTime\"],[[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"errorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n      \"],[1,[20,\"errorMessage\"],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"assessment\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"challenge-actions\",null,[[\"challenge\",\"challengeSkipped\",\"answerValidated\"],[[22,[\"challenge\"]],[26,\"action\",[[21,0,[]],\"skipChallenge\"],null],[26,\"action\",[[21,0,[]],\"validateAnswer\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canDisplayFeedbackPanel\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-item__feedback\"],[8],[0,\"\\n    \"],[1,[26,\"feedback-panel\",null,[[\"assessment\",\"challenge\"],[[22,[\"assessment\"]],[22,[\"challenge\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-qroc.hbs" } });
});
define("pix-live/templates/components/challenge-item-qrocm", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2D6/nEfL", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[4,\"unless\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"warning-page\",null,[[\"hasUserConfirmWarning\",\"time\"],[[26,\"action\",[[21,0,[]],\"setUserConfirmation\"],null],[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"unless\",[[22,[\"hasChallengeTimer\"]]],null,{\"statements\":[[0,\"\\n  \"],[1,[26,\"challenge-statement\",null,[[\"challenge\",\"assessment\"],[[22,[\"challenge\"]],[22,[\"assessment\"]]]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel challenge-response\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-proposals\"],[8],[0,\"\\n      \"],[1,[26,\"qrocm-proposal\",null,[[\"proposals\",\"answersValue\",\"answerChanged\"],[[22,[\"challenge\",\"proposals\"]],[22,[\"answers\",\"_valuesAsMap\"]],[26,\"action\",[[21,0,[]],\"answerChanged\"],null]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"timer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"hasUserConfirmWarning\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row timeout-jauge-wrapper\"],[8],[0,\"\\n          \"],[1,[26,\"timeout-jauge\",null,[[\"allotedTime\"],[[22,[\"challenge\",\"timer\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"errorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n      \"],[1,[20,\"errorMessage\"],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"assessment\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"challenge-actions\",null,[[\"challenge\",\"challengeSkipped\",\"answerValidated\"],[[22,[\"challenge\"]],[26,\"action\",[[21,0,[]],\"skipChallenge\"],null],[26,\"action\",[[21,0,[]],\"validateAnswer\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canDisplayFeedbackPanel\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"challenge-item__feedback\"],[8],[0,\"\\n    \"],[1,[26,\"feedback-panel\",null,[[\"assessment\",\"challenge\"],[[22,[\"assessment\"]],[22,[\"challenge\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-item-qrocm.hbs" } });
});
define("pix-live/templates/components/challenge-statement", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "PIoUT2jB", "block": "{\"symbols\":[\"attachmentUrl\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"rounded-panel\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"challengeInstruction\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-statement__instruction-section\"],[8],[0,\"\\n      \"],[1,[26,\"markdown-to-html\",null,[[\"class\",\"markdown\"],[\"challenge-statement__instruction\",[22,[\"challengeInstruction\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"illustrationUrl\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-statement__illustration-section\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"class\",\"challenge-statement__illustration\"],[11,\"src\",[27,[[22,[\"challenge\",\"illustrationUrl\"]]]]],[10,\"alt\",\"Illustration de l'épreuve\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"hasAttachment\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-statement__attachments-section\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"challenge\",\"hasSingleAttachment\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"challenge-statement__action\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"challenge-statement__action-link\"],[11,\"href\",[27,[[22,[\"challenge\",\"attachments\",\"firstObject\"]]]]],[10,\"target\",\"_blank\"],[10,\"download\",\"\"],[8],[0,\"\\n            \"],[6,\"span\"],[10,\"class\",\"challenge-statement__action-label\"],[8],[0,\"Télécharger\"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"challenge\",\"hasMultipleAttachments\"]]],null,{\"statements\":[[0,\"        \"],[6,\"p\"],[10,\"class\",\"challenge-statement__text\"],[8],[0,\"\\n          \"],[6,\"span\"],[10,\"class\",\"challenge-statement__text-content\"],[8],[0,\"Choisissez le type de fichier que vous voulez utiliser\"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"challenge-statement__help-icon\"],[8],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"challenge-statement__help-tooltip\"],[8],[0,\"\\n            \"],[6,\"span\"],[10,\"class\",\"challenge-statement__help-text\"],[8],[0,\"Pix vous laisse le choix du format de fichier à télécharger. Si vous ne savez pas quelle option retenir, conservez le choix par défaut. Il correspond au format de fichier pris en charge par le plus grand nombre de logiciels.\"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"ul\"],[10,\"class\",\"challenge-statement__file-options\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"attachmentsData\"]]],null,{\"statements\":[[0,\"            \"],[6,\"li\"],[10,\"class\",\"challenge-statement__file-option\"],[8],[0,\"\\n\\n\"],[0,\"              \"],[6,\"input\"],[11,\"id\",[27,[\"attachment\",[21,2,[]]]]],[10,\"class\",\"challenge-statement__file-option_input\"],[10,\"name\",\"attachment_selector\"],[11,\"value\",[27,[[21,1,[]]]]],[11,\"onclick\",[26,\"action\",[[21,0,[]],\"selectAttachementUrl\",[21,1,[]]],null]],[11,\"checked\",[27,[[26,\"if\",[[26,\"eq\",[[21,1,[]],[22,[\"selectedAttachmentUrl\"]]],null],\"checked\"],null]]]],[10,\"type\",\"radio\"],[8],[9],[0,\"\\n\\n              \"],[6,\"label\"],[10,\"class\",\"label-checkbox-downloadable\"],[11,\"for\",[27,[\"attachment\",[21,2,[]]]]],[8],[0,\"\\n                \"],[6,\"span\"],[10,\"class\",\"challenge-statement__file-option-label\"],[8],[0,\"fichier .\"],[1,[26,\"extract-extension\",[[21,1,[]]],null],false],[9],[0,\"\\n              \"],[9],[0,\"\\n\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"challenge-statement__action\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"challenge-statement__action-link\"],[11,\"href\",[27,[[20,\"selectedAttachmentUrl\"]]]],[10,\"target\",\"_blank\"],[10,\"download\",\"\"],[8],[0,\"\\n            \"],[6,\"span\"],[10,\"class\",\"challenge-statement__action-label\"],[8],[0,\"Télécharger\"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"challenge\",\"hasValidEmbedDocument\"]]],null,{\"statements\":[[0,\"  \"],[1,[26,\"challenge-embed-simulator\",null,[[\"embedDocument\"],[[22,[\"challengeEmbedDocument\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/challenge-statement.hbs" } });
});
define("pix-live/templates/components/comparison-window", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xNPQAJ49", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"routable-modal--dialog comparison-window--dialog\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"routable-modal--content comparison-window--content\"],[8],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"routable-modal--header comparison-window__header\"],[8],[0,\"\\n\\n\\n\"],[4,\"routable-modal-close-button\",null,[[\"class\"],[\"routable-modal--close-button\"]],{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"close-button-container\"],[8],[0,\"\\n          \"],[6,\"div\"],[8],[0,\"fermer\"],[9],[0,\"\\n          \"],[6,\"div\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/comparison-window/icon-close-modal.svg\"],[10,\"alt\",\"Fermer la fenêtre modale\"],[10,\"width\",\"24\"],[10,\"height\",\"24\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__result-item-index\"],[8],[0,\"\\n        \"],[1,[20,\"index\"],false],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__result-item-line\"],[8],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__title\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"data-toggle\",\"tooltip\"],[10,\"data-placement\",\"top\"],[11,\"title\",[27,[[22,[\"resultItem\",\"tooltip\"]]]]],[8],[0,\"\\n          \"],[6,\"img\"],[11,\"class\",[27,[\"comparison-window__result-icon comparison-window__result-icon--\",[22,[\"resultItem\",\"status\"]]]]],[11,\"src\",[20,\"resultItemIcon\"]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__title-text\"],[8],[1,[22,[\"resultItem\",\"title\"]],false],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"routable-modal--body comparison-window--body\"],[8],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"rounded-panel comparison-window__instruction\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row \"],[8],[0,\"\\n          \"],[1,[26,\"markdown-to-html\",null,[[\"class\",\"markdown\"],[\"challenge-statement__instruction\",[22,[\"challenge\",\"instruction\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"challenge\",\"illustrationUrl\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row challenge-statement__illustration-section\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"class\",\"challenge-statement__illustration\"],[11,\"src\",[27,[[22,[\"challenge\",\"illustrationUrl\"]]]]],[10,\"alt\",\"Illustration de l'épreuve\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__corrected-answers\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"isAssessmentChallengeTypeQcm\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"qcm-solution-panel\",null,[[\"challenge\",\"answer\",\"solution\"],[[22,[\"challenge\"]],[22,[\"answer\"]],[22,[\"correction\",\"solution\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"isAssessmentChallengeTypeQcu\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"qcu-solution-panel\",null,[[\"challenge\",\"answer\",\"solution\"],[[22,[\"challenge\"]],[22,[\"answer\"]],[22,[\"correction\",\"solution\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isAssessmentChallengeTypeQroc\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"comparison-window__corrected-answers--qroc\"],[8],[0,\"\\n          \"],[1,[26,\"qroc-solution-panel\",null,[[\"answer\",\"solution\"],[[22,[\"answer\"]],[22,[\"correction\",\"solution\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isAssessmentChallengeTypeQrocmInd\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"comparison-window__corrected-answers--qrocm\"],[8],[0,\"\\n          \"],[1,[26,\"qrocm-ind-solution-panel\",null,[[\"answer\",\"solution\",\"challenge\"],[[22,[\"answer\"]],[22,[\"correction\",\"solution\"]],[22,[\"challenge\"]]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"answer\",\"isResultNotOk\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"correction\",\"noHintsNorTutorialsAtAll\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"comparison-windows__default-message-container\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"comparison-windows__default-message-picto-container\"],[8],[0,\"\\n              \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/comparison-window/icon-tuto.svg\"]]],[10,\"alt\",\"\"],[10,\"class\",\"comparison-windows__default-message-picto\"],[8],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"comparison-windows__default-message-title\"],[8],[0,\"Bientôt ici des tutoriels pour vous aider à réussir ce type\\n              d'épreuves !!\\n            \"],[9],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[1,[26,\"tutorial-panel\",null,[[\"hint\",\"tutorials\"],[[22,[\"correction\",\"hint\"]],[22,[\"correction\",\"tutorials\"]]]]],false],[0,\"\\n          \"],[1,[26,\"learning-more-panel\",null,[[\"learningMoreTutorials\"],[[22,[\"correction\",\"learningMoreTutorials\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"routable-modal--footer\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"comparison-window__feedback-panel\"],[8],[0,\"\\n        \"],[1,[26,\"feedback-panel\",null,[[\"assessment\",\"challenge\",\"collapsible\"],[[22,[\"answer\",\"assessment\"]],[22,[\"challenge\"]],false]]],false],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/comparison-window.hbs" } });
});
define("pix-live/templates/components/competence-area-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6WIoesQm", "block": "{\"symbols\":[\"competenceArea\"],\"statements\":[[4,\"each\",[[22,[\"_competencesByAreaSorted\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"competence-area-list__item\"],[8],[0,\"\\n    \"],[1,[26,\"competence-by-area-item\",null,[[\"competenceArea\"],[[21,1,[]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/competence-area-list.hbs" } });
});
define("pix-live/templates/components/competence-by-area-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2TpFgmp9", "block": "{\"symbols\":[\"competence\"],\"statements\":[[6,\"div\"],[10,\"class\",\"area__name\"],[8],[1,[20,\"_competencesAreaName\"],false],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"competence-list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"_competencesSortedList\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"competence\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"competence__name\"],[8],[1,[21,1,[\"name\"]],false],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"competence__progress-bar\"],[8],[0,\"\\n        \"],[1,[26,\"competence-level-progress-bar\",null,[[\"name\",\"level\",\"courseId\",\"assessmentId\",\"status\"],[[21,1,[\"name\"]],[21,1,[\"level\"]],[21,1,[\"courseId\"]],[21,1,[\"assessmentId\"]],[21,1,[\"status\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/competence-by-area-item.hbs" } });
});
define("pix-live/templates/components/competence-level-progress-bar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+iMgSfI2", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasLevel\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__background\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__background-level-limit\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__background-level-limit-indicator\"],[8],[0,\"\\n        \"],[1,[20,\"_MAX_REACHABLE_LEVEL\"],false],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__background-available-soon-text\"],[8],[0,\"Disponible Prochainement\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__background-level-limit-max-indicator\"],[8],[0,\"\\n      \"],[1,[20,\"_MAX_LEVEL\"],false],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"canUserReplayAssessment\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__link\"],[8],[0,\"\\n\"],[4,\"unless\",[[22,[\"_showSecondChanceModal\"]]],null,{\"statements\":[[0,\"          \"],[6,\"button\"],[10,\"class\",\"competence-level-progress-bar__link-replay\"],[3,\"action\",[[21,0,[]],\"openModal\"]],[8],[0,\"\\n            Seconde chance \"],[6,\"div\"],[10,\"class\",\"sr-only\"],[8],[0,\"pour le test \\\"\"],[1,[20,\"name\"],false],[0,\"\\\"\"],[9],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"pix-modale\",null,[[\"containerClass\",\"onClose\"],[\"competence-level-progress-bar__modal-text second-chance__modal\",[26,\"action\",[[21,0,[]],\"closeModal\"],null]]],{\"statements\":[[0,\"            \"],[6,\"div\"],[10,\"class\",\"pix-modal__container\"],[8],[0,\"\\n              \"],[6,\"a\"],[10,\"href\",\"#\"],[10,\"class\",\"pix-modal__close-link\"],[3,\"action\",[[21,0,[]],\"closeModal\"]],[8],[0,\"Fermer\\n                \"],[6,\"img\"],[10,\"src\",\"/images/comparison-window/icon-close-modal.svg\"],[10,\"alt\",\"Fermer la fenêtre modale\"],[10,\"width\",\"24\"],[10,\"height\",\"24\"],[8],[9],[0,\"\\n              \"],[9],[0,\"\\n\\n              \"],[6,\"h1\"],[8],[0,\"Seconde chance\"],[9],[0,\"\\n              \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__modal-body\"],[8],[0,\"\\n                \"],[6,\"p\"],[10,\"class\",\"competence-level-progress-bar__modal-text\"],[8],[0,\"\\n                  Votre niveau actuel sera remplacé par celui de ce nouveau test.\"],[6,\"br\"],[8],[9],[0,\"Les Pix associés à cette compétence seront de nouveau calculés.\\n                \"],[9],[0,\"\\n\\n                \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__modal-actions\"],[8],[0,\"\\n                  \"],[6,\"button\"],[10,\"class\",\"competence-level-progress-bar__modal-link-cancel pix-modal__action cancel\"],[3,\"action\",[[21,0,[]],\"closeModal\"]],[8],[0,\"Annuler\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"courses.create-assessment\",[22,[\"courseId\"]]],[[\"class\"],[\"competence-level-progress-bar__modal-link-validate link-as-button pix-modal__action validate\"]],{\"statements\":[[0,\"                    J'ai compris\\n\"]],\"parameters\":[]},null],[0,\"                \"],[9],[0,\"\\n              \"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__level\"],[11,\"style\",[20,\"widthOfProgressBar\"]],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__level-indicator\"],[8],[0,\"\\n      \"],[1,[20,\"limitedLevel\"],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canUserStartCourse\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__link\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"courses.create-assessment\",[22,[\"courseId\"]]],[[\"class\"],[\"competence-level-progress-bar__link-start\"]],{\"statements\":[[0,\"      Commencer \"],[6,\"div\"],[10,\"class\",\"sr-only\"],[8],[0,\"le test \\\"\"],[1,[20,\"name\"],false],[0,\"\\\"\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"canUserResumeAssessment\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"competence-level-progress-bar__link\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"assessments.resume\",[22,[\"assessmentId\"]]],[[\"class\"],[\"competence-level-progress-bar__link-resume\"]],{\"statements\":[[0,\"      Reprendre \"],[6,\"div\"],[10,\"class\",\"sr-only\"],[8],[0,\"le test \\\"\"],[1,[20,\"name\"],false],[0,\"\\\"\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/competence-level-progress-bar.hbs" } });
});
define("pix-live/templates/components/corner-ribbon", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hkmCqDD5", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"corner-ribbon-wrapper\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"corner-ribbon\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"ribbon\"],[8],[0,\"\\n      \"],[6,\"a\"],[10,\"href\",\"https://github.com/1024pix/pix\"],[8],[0,\"BÊTA\"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/corner-ribbon.hbs" } });
});
define("pix-live/templates/components/course-banner", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "acfz2Van", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"course-banner__container\"],[8],[0,\"\\n\\n  \"],[6,\"h1\"],[10,\"class\",\"course-banner__name\"],[8],[1,[20,\"courseName\"],false],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"withHomeLink\"]]],null,{\"statements\":[[0,\"    \"],[4,\"link-to\",[\"index\"],[[\"class\"],[\"course-banner__home-link\"]],{\"statements\":[[0,\"Revenir à l'accueil\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/course-banner.hbs" } });
});
define("pix-live/templates/components/course-item-placeholder", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "MCXwkggg", "block": "{\"symbols\":[],\"statements\":[[6,\"article\"],[10,\"class\",\"course-item-placeholder rounded-panel\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"course-item-placeholder__picture\"],[8],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"course-item-placeholder__container\"],[8],[0,\"\\n    \"],[6,\"h3\"],[10,\"class\",\"course-item-placeholder__name\"],[8],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"course-item-placeholder__description\"],[8],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"course-item-placeholder__challenges-number\"],[8],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"course-item-placeholder__begin-button\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/course-item-placeholder.hbs" } });
});
define("pix-live/templates/components/course-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3CX14Cxj", "block": "{\"symbols\":[],\"statements\":[[6,\"img\"],[10,\"class\",\"course-item__picture\"],[11,\"src\",[27,[[20,\"imageUrl\"]]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"course-item__container\"],[8],[0,\"\\n  \"],[6,\"h3\"],[10,\"class\",\"course-item__name\"],[8],[1,[22,[\"course\",\"name\"]],false],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"course-item__description\"],[8],[1,[22,[\"course\",\"description\"]],false],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"course-item__challenges-number\"],[8],[0,\"\\n    \"],[4,\"if\",[[22,[\"course\",\"challenges\",\"length\"]]],null,{\"statements\":[[0,\" \"],[1,[22,[\"course\",\"challenges\",\"length\"]],false]],\"parameters\":[]},{\"statements\":[[0,\" \"],[1,[22,[\"course\",\"nbChallenges\"]],false]],\"parameters\":[]}],[0,\" épreuves\\n  \"],[9],[0,\"\\n\\n\"],[0,\"  \"],[6,\"a\"],[10,\"class\",\"course-item__begin-button\"],[10,\"href\",\"#\"],[10,\"style\",\"cursor: pointer;\"],[11,\"title\",[27,[\"Commencer le test \\\"\",[22,[\"course\",\"name\"]],\"\\\"\"]]],[3,\"action\",[[21,0,[]],\"startCourse\",[22,[\"course\"]]]],[8],[0,\"\\n    Commencer\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/course-item.hbs" } });
});
define("pix-live/templates/components/course-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VVvpRUpA", "block": "{\"symbols\":[\"course\"],\"statements\":[[6,\"ul\"],[10,\"class\",\"course-list__ul\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"filteredCourses\"]]],null,{\"statements\":[[0,\"    \"],[6,\"li\"],[10,\"class\",\"course-list__li\"],[8],[0,\"\\n      \"],[1,[26,\"course-item\",null,[[\"course\",\"startCourse\"],[[21,1,[]],\"startCourse\"]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isLoading\"]]],null,{\"statements\":[[0,\"    \"],[6,\"li\"],[10,\"class\",\"course-list__li\"],[8],[1,[26,\"course-item-placeholder\",null,[[\"class\"],[\"course-item-placeholder--first\"]]],false],[9],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"course-list__li\"],[8],[1,[20,\"course-item-placeholder\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\\n\"],[1,[20,\"modal-mobile\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/course-list.hbs" } });
});
define("pix-live/templates/components/feature-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "NP3ln5NN", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"feature-item__icon-container\"],[8],[0,\"\\n  \"],[6,\"img\"],[10,\"class\",\"feature-item__icon\"],[11,\"src\",[27,[\"/images/features/icon-\",[22,[\"feature\",\"icon\"]],\".svg\"]]],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"feature-item__title\"],[8],[1,[22,[\"feature\",\"title\"]],false],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"feature-item__description\"],[8],[1,[22,[\"feature\",\"description\"]],false],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/feature-item.hbs" } });
});
define("pix-live/templates/components/feature-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "4I0C+2RB", "block": "{\"symbols\":[\"feature\"],\"statements\":[[6,\"ul\"],[10,\"class\",\"feature-list__ul\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"features\"]]],null,{\"statements\":[[0,\"    \"],[6,\"li\"],[10,\"class\",\"feature-list__li\"],[8],[0,\"\\n      \"],[1,[26,\"feature-item\",null,[[\"feature\"],[[21,1,[]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/feature-list.hbs" } });
});
define("pix-live/templates/components/feedback-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "SoDXN/oT", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"isFormClosed\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"feedback-panel__view feedback-panel__view--link\"],[8],[0,\"\\n    \"],[6,\"a\"],[10,\"class\",\"feedback-panel__open-link\"],[10,\"href\",\"#\"],[3,\"action\",[[21,0,[]],\"openFeedbackForm\"]],[8],[0,\"Signaler un problème\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isFormOpened\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"feedback-panel__view feedback-panel__view--form\"],[8],[0,\"\\n    \"],[6,\"h3\"],[10,\"class\",\"feedback-panel__form-title\"],[8],[0,\"Signaler un problème\"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"feedback-panel__form-description\"],[8],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"PIX est à l’écoute de vos remarques pour améliorer les épreuves proposées #personnenestparfait.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Vous pouvez nous laisser votre adresse mail si vous le souhaitez. Vos coordonnées ne feront l’objet d’aucune transmission à des tiers.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"feedback-panel__form-wrapper\"],[8],[0,\"\\n      \"],[6,\"form\"],[10,\"class\",\"feedback-panel__form\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"feedback-panel__group\"],[8],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"class\",\"type\",\"value\",\"placeholder\"],[\"feedback-panel__field feedback-panel__field--email\",\"text\",[22,[\"_email\"]],\"Votre email (optionnel)\"]]],false],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"feedback-panel__group\"],[8],[0,\"\\n          \"],[1,[26,\"textarea\",null,[[\"class\",\"value\",\"placeholder\",\"rows\"],[\"feedback-panel__field feedback-panel__field--content\",[22,[\"_content\"]],\"Votre message\",6]]],false],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_error\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"alert alert-danger\"],[10,\"role\",\"alert\"],[8],[0,\"\\n            \"],[1,[20,\"_error\"],false],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[6,\"button\"],[10,\"class\",\"feedback-panel__button feedback-panel__button--send\"],[3,\"action\",[[21,0,[]],\"sendFeedback\"]],[8],[0,\"Envoyer\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"collapsible\"]]],null,{\"statements\":[[0,\"          \"],[6,\"button\"],[10,\"class\",\"feedback-panel__button feedback-panel__button--cancel\"],[3,\"action\",[[21,0,[]],\"cancelFeedback\"]],[8],[0,\"Annuler\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isFormSubmitted\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"feedback-panel__view feedback-panel__view--mercix\"],[8],[0,\"\\n    \"],[6,\"p\"],[8],[0,\"Votre commentaire a bien été transmis à l’équipe du projet PIX.\"],[9],[0,\"\\n    \"],[6,\"p\"],[8],[0,\"Mercix !\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/feedback-panel.hbs" } });
});
define("pix-live/templates/components/form-textfield", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "97pUp/3O", "block": "{\"symbols\":[],\"statements\":[[6,\"label\"],[11,\"for\",[27,[[20,\"textfieldName\"]]]],[10,\"class\",\"form-textfield__label\"],[8],[1,[20,\"label\"],false],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"hasIcon\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[11,\"class\",[27,[\"form-textfield__message \",[20,\"validationMessageClass\"],\" form-textfield__message-\",[20,\"textfieldType\"],\"\\n\"]]],[10,\"role\",\"alert\"],[8],[1,[20,\"validationMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[6,\"div\"],[11,\"class\",[27,[\"form-textfield__input-field-container \",[20,\"inputContainerStatusClass\"]]]],[8],[0,\"\\n  \"],[1,[26,\"input\",[[26,\"-input-type\",[[22,[\"textfieldType\"]]],null]],[[\"type\",\"id\",\"value\",\"focus-out\",\"class\"],[[22,[\"textfieldType\"]],[22,[\"textfieldName\"]],[22,[\"inputBindingValue\"]],[26,\"action\",[[21,0,[]],\"validate\"],null],[26,\"concat\",[\"form-textfield__input\",\" \",[26,\"if\",[[22,[\"inputValidationStatus\"]],[26,\"-normalize-class\",[\"inputValidationStatus\",[22,[\"inputValidationStatus\"]]],null]],null],\" \"],null]]]],false],[0,\"\\n\\n\\n\"],[4,\"if\",[[22,[\"hasIcon\"]]],null,{\"statements\":[[4,\"if\",[[26,\"eq\",[[22,[\"validationStatus\"]],\"error\"],null]],null,{\"statements\":[[0,\"      \"],[6,\"img\"],[10,\"src\",\"/images/icons/icon-error.svg\"],[10,\"class\",\"form-textfield__icon form-textfield__icon--error\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"img\"],[10,\"src\",\"/images/icons/icon-success.svg\"],[10,\"class\",\"form-textfield__icon form-textfield__icon--success validation-icon-success\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/form-textfield.hbs" } });
});
define("pix-live/templates/components/g-recaptcha", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yElKQdCf", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"id\",\"g-recaptcha-container\"],[8],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/g-recaptcha.hbs" } });
});
define("pix-live/templates/components/learning-more-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "An1j41R2", "block": "{\"symbols\":[\"learningMoreTutorial\"],\"statements\":[[4,\"if\",[[22,[\"hasLearningMoreItems\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"learning-more-panel__container\"],[8],[0,\"\\n    \"],[6,\"header\"],[10,\"class\",\"learning-more-panel__hint-container-header\"],[8],[0,\"\\n      \"],[6,\"h3\"],[10,\"class\",\"learning-more-panel__hint-title\"],[8],[6,\"span\"],[8],[0,\"Pour en apprendre davantage\"],[9],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"learning-more-panel__list-container\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"learningMoreTutorials\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"tutorial-item\",null,[[\"tutorial\"],[[21,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"      \"],[6,\"div\"],[10,\"class\",\"learning-more-panel__tutorial-info\"],[8],[0,\"\\n        Ces liens ont été proposés par des utilisateurs de PIX.\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/learning-more-panel.hbs" } });
});
define("pix-live/templates/components/logged-user-profile-banner", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "IcmVOI8y", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"profile-banner__background\"],[8],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"profile-banner__content-text-container\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"profile-banner__title\"],[8],[0,\"\\n    Bienvenue\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"profile-banner__description\"],[8],[0,\"\\n    Vous avez 16 compétences à tester.\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"profile-banner__description\"],[8],[0,\"\\n    On se concentre et c’est partix !\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"profile-banner__button-scroll-container\"],[8],[0,\"\\n  \"],[6,\"button\"],[10,\"class\",\"button-scroll-to-profile\"],[3,\"action\",[[21,0,[]],\"scrollToProfile\"]],[8],[0,\"choisir un test\"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/logged-user-profile-banner.hbs" } });
});
define("pix-live/templates/components/medal-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yd7ee3Tk", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"medal-item__div\"],[8],[0,\"\\n  \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/medaille.svg\"]]],[10,\"alt\",\"Médaille obtenue\"],[10,\"class\",\"medal-item__medal-img\"],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"medal-item__pix-score\"],[8],[0,\"+\"],[1,[20,\"pixScore\"],false],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"medal-item__pix-text\"],[8],[0,\"pix\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"medal-item__bêta\"],[8],[0,\"BÊTA\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/medal-item.hbs" } });
});
define("pix-live/templates/components/modal-mobile", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "FpEKiKyK", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"modal-mobile\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"modal fade js-modal-mobile\"],[10,\"tabindex\",\"-1\"],[10,\"role\",\"dialog\"],[10,\"id\",\"js-modal-mobile\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"modal-dialog\"],[10,\"role\",\"document\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"modal-content\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"modal-header\"],[8],[0,\"\\n          \"],[6,\"h4\"],[10,\"class\",\"modal-title\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"class\",\"modal-title__warning-icon\"],[10,\"src\",\"/images/icon-mobile-support-warning.svg\"],[10,\"alt\",\"Message d'alerte concernant le support des terminaux mobiles\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"modal-body\"],[8],[0,\"\\n          \"],[6,\"p\"],[8],[0,\"Certaines épreuves PIX peuvent être difficiles à réussir sur mobile. Pour une meilleure expérience, nous vous conseillons de passer ce test sur un ordinateur.\"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"modal-footer\"],[8],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"modal-button-container\"],[8],[0,\"\\n            \"],[6,\"button\"],[10,\"class\",\"btn btn-primary modal-mobile__confirm-button\"],[10,\"data-confirm\",\"modal\"],[10,\"type\",\"button\"],[8],[0,\"Continuer\"],[9],[0,\"\\n          \"],[9],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"modal-button-container\"],[8],[0,\"\\n            \"],[6,\"a\"],[10,\"nohref\",\"\"],[10,\"data-dismiss\",\"modal\"],[10,\"class\",\"modal-mobile__dismiss-link\"],[8],[0,\"Revenir à l’accueil\"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/modal-mobile.hbs" } });
});
define("pix-live/templates/components/navbar-desktop-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "qanKvYGS", "block": "{\"symbols\":[\"item\"],\"statements\":[[6,\"div\"],[10,\"class\",\"navbar-desktop-menu-links\"],[8],[0,\"\\n  \"],[6,\"ul\"],[10,\"class\",\"navbar-desktop-menu-links__list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"menu\"]]],null,{\"statements\":[[0,\"      \"],[6,\"li\"],[10,\"class\",\"navbar-desktop-menu-links__item\"],[8],[0,\"\\n        \"],[4,\"link-to\",[[21,1,[\"link\"]]],[[\"class\"],[[26,\"concat\",[\"navbar-desktop-menu-links__link\",\" \",[26,\"if\",[[21,1,[\"class\"]],[26,\"-normalize-class\",[\"item.class\",[21,1,[\"class\"]]],null]],null],\" \"],null]]],{\"statements\":[[1,[21,1,[\"name\"]],false]],\"parameters\":[]},null],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/navbar-desktop-menu.hbs" } });
});
define("pix-live/templates/components/navbar-header", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XbWEIqO0", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"navbar-header__container\"],[8],[0,\"\\n\"],[4,\"unless\",[[22,[\"media\",\"isDesktop\"]]],null,{\"statements\":[[0,\"    \"],[1,[26,\"navbar-mobile-menu\",null,[[\"menu\"],[[22,[\"menu\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[2,\" Logo (left) \"],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"navbar-header-logo\"],[8],[0,\"\\n    \"],[1,[20,\"pix-logo\"],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[2,\" Links (right) \"],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"navbar-header-right\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"media\",\"isDesktop\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"navbar-desktop-menu\",null,[[\"menu\"],[[22,[\"menu\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"isUserLogged\"]]],null,{\"statements\":[[0,\"      \"],[1,[20,\"user-logged-menu\"],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/navbar-header.hbs" } });
});
define("pix-live/templates/components/navbar-mobile-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "HZtSQAN6", "block": "{\"symbols\":[\"item\"],\"statements\":[[4,\"side-menu\",null,null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"mobile-menu-header\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"mobile-menu-header__title\"],[8],[0,\"Menu\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"mobile-menu-header__close-button\"],[3,\"action\",[[21,0,[]],\"closeMenu\"]],[8],[0,\"\\n      \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/icons/icon-croix.svg\"]]],[10,\"alt\",\"close menu\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[4,\"each\",[[22,[\"menu\"]]],null,{\"statements\":[[0,\"    \"],[4,\"link-to\",[[21,1,[\"link\"]]],[[\"class\",\"action\",\"preventDefault\"],[[26,\"concat\",[\"mobile-menu__item\",\" \",[26,\"if\",[[21,1,[\"class\"]],[26,\"-normalize-class\",[\"item.class\",[21,1,[\"class\"]]],null]],null],\" \"],null],\"closeMenu\",false]],{\"statements\":[[0,\" \"],[1,[21,1,[\"name\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"\\n\"],[1,[20,\"pix-content-backdrop\"],false],[0,\"\\n\\n\"],[4,\"side-menu-toggle\",null,null,{\"statements\":[[0,\"   \\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/navbar-mobile-menu.hbs" } });
});
define("pix-live/templates/components/no-certification-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "NQGHpoDE", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"no-certification-panel\"],[8],[0,\"\\n  Vous n'avez pas encore de certification.\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/no-certification-panel.hbs" } });
});
define("pix-live/templates/components/password-reset-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "bMN78L81", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"password-reset__connexion\"],[8],[0,\"\\n  \"],[4,\"link-to\",[\"login\"],[[\"class\"],[\"password-reset__connexion-link\"]],{\"statements\":[[0,\"Annuler\\n    \"],[6,\"img\"],[10,\"class\",\"password-reset__home-link_close\"],[10,\"alt\",\"\"],[10,\"src\",\"/images/icons/icon-close.svg\"],[8],[9]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"password-reset-form\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-form__pix-logo\"],[8],[0,\"\\n    \"],[1,[20,\"pix-logo\"],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-form__title\"],[8],[0,\"Mot de passe oublié ?\"],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-form__text\"],[8],[0,\"Entrez votre adresse e-mail ci-dessous, et c'est repartix\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_displaySuccessMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"password-reset-form__form-success-message\"],[8],[0,\"Vous allez recevoir un lien par e-mail pour renouveler votre\\n      mot de passe\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-form__form\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"password-reset-form__form-label\"],[8],[0,\"Adresse e-mail\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"_displayErrorMessage\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"password-reset-form__form-error-message\"],[8],[0,\"L'e-mail entré ne correspond à aucun compte\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[6,\"div\"],[10,\"class\",\"password-reset-form__form-input\"],[8],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"class\",\"id\",\"type\",\"value\"],[\"password-reset-form__form-email-input\",\"pix-email\",\"email\",[22,[\"email\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-form__button\"],[8],[0,\"\\n    \"],[6,\"button\"],[10,\"class\",\"password-reset-form__submit-button\"],[3,\"action\",[[21,0,[]],\"savePasswordResetDemand\"]],[8],[0,\"\\n      Envoyer\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/password-reset-form.hbs" } });
});
define("pix-live/templates/components/pix-logo", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "g9Njcp4r", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"index\"],[[\"class\",\"title\"],[\"pix-logo__link\",\"Lien vers la page d'accueil de PIX\"]],{\"statements\":[[0,\"  \"],[6,\"img\"],[10,\"class\",\"pix-logo__image\"],[10,\"src\",\"/images/pix-logo.svg\"],[10,\"alt\",\"Logo officiel de PIX (version bêta)\"],[8],[9],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"pix-logo__beta\"],[8],[0,\"Bêta\"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/pix-logo.hbs" } });
});
define("pix-live/templates/components/profile-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "E9ilNvnJ", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"profile-panel__header\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"profile-header__left-bloc\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"profile-header__title\"],[8],[0,\"\\n      Votre profil\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"profile-header__details\"],[8],[0,\"\\n      5 domaines / 16 compétences\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"profile-header__score-pastille-wrapper\"],[8],[0,\"\\n    \"],[1,[26,\"score-pastille\",null,[[\"pixScore\"],[[22,[\"totalPixScore\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"profile-header__share\"],[8],[0,\"\\n    \"],[1,[26,\"share-profile\",null,[[\"searchForOrganization\",\"shareProfileSnapshot\"],[[22,[\"searchForOrganization\"]],[22,[\"shareProfileSnapshot\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"profile-panel__competence-areas\"],[8],[0,\"\\n  \"],[1,[26,\"competence-area-list\",null,[[\"competences\"],[[22,[\"competences\"]]]]],false],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/profile-panel.hbs" } });
});
define("pix-live/templates/components/progress-bar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "PB7egkqS", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"progress-bar progress-bar-info\"],[10,\"role\",\"progressbar\"],[11,\"aria-valuenow\",[22,[\"progression\",\"valueNow\"]]],[10,\"aria-valuemin\",\"0\"],[10,\"aria-valuemax\",\"100\"],[11,\"style\",[20,\"barStyle\"]],[8],[0,\"\\n  \"],[1,[22,[\"progression\",\"text\"]],false],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/progress-bar.hbs" } });
});
define("pix-live/templates/components/qcm-proposals", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8fm5zXDV", "block": "{\"symbols\":[\"labeledCheckbox\",\"index\"],\"statements\":[[4,\"each\",[[22,[\"labeledCheckboxes\"]]],null,{\"statements\":[[6,\"p\"],[10,\"class\",\"proposal-paragraph\"],[8],[0,\"\\n\\n\"],[0,\"  \"],[6,\"input\"],[11,\"id\",[27,[\"checkbox_\",[26,\"inc\",[[21,2,[]]],null]]]],[11,\"checked\",[21,1,[\"1\"]]],[11,\"name\",[27,[[26,\"inc\",[[21,2,[]]],null]]]],[11,\"onclick\",[26,\"action\",[[21,0,[]],\"checkboxCliked\"],null]],[10,\"type\",\"checkbox\"],[8],[9],[0,\"\\n\\n\"],[0,\"  \"],[6,\"label\"],[11,\"for\",[27,[\"checkbox_\",[26,\"inc\",[[21,2,[]]],null]]]],[10,\"class\",\"label-checkbox-proposal\"],[8],[0,\"\\n\\n\"],[0,\"    \"],[6,\"span\"],[10,\"class\",\"proposal-text\"],[8],[1,[21,1,[\"0\"]],false],[9],[0,\"\\n\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"parameters\":[1,2]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qcm-proposals.hbs" } });
});
define("pix-live/templates/components/qcm-solution-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "m7Hgejby", "block": "{\"symbols\":[\"labeledCheckbox\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"qcm-panel__proposals rounded-panel\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row qcm-panel__proposal-list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"labeledCheckboxes\"]]],null,{\"statements\":[[0,\"      \"],[6,\"p\"],[10,\"class\",\"qcm-panel__proposal-item\"],[8],[0,\"\\n        \"],[6,\"label\"],[10,\"class\",\"qcm-panel__proposal-label qcm-proposal-label\"],[8],[0,\"\\n\\n          \"],[6,\"input\"],[10,\"class\",\"qcm-panel__proposal-checkbox\"],[11,\"checked\",[26,\"if\",[[21,1,[\"1\"]],\"checked\",\"\"],null]],[10,\"disabled\",\"disabled\"],[10,\"type\",\"checkbox\"],[8],[9],[0,\"\\n\\n          \"],[6,\"span\"],[10,\"class\",\"qcm-proposal-label__oracle\"],[11,\"data-goodness\",[27,[[26,\"if\",[[26,\"get\",[[22,[\"solutionArray\"]],[26,\"concat\",[[21,2,[]]],null]],null],\"good\",\"bad\"],null]]]],[11,\"data-checked\",[26,\"if\",[[21,1,[\"1\"]],\"yes\",\"no\"],null]],[8],[0,\"\\n            \"],[1,[21,1,[\"0\"]],false],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qcm-solution-panel.hbs" } });
});
define("pix-live/templates/components/qcu-proposals", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3yweuqic", "block": "{\"symbols\":[\"labeledRadio\",\"index\"],\"statements\":[[6,\"form\"],[11,\"onchange\",[27,[[26,\"action\",[[21,0,[]],\"radioClicked\"],null]]]],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"labeledRadios\"]]],null,{\"statements\":[[6,\"p\"],[10,\"class\",\"proposal-paragraph\"],[8],[0,\"\\n\\n\"],[0,\"  \"],[6,\"input\"],[10,\"name\",\"radio\"],[11,\"value\",[27,[[26,\"inc\",[[21,2,[]]],null]]]],[11,\"data-value\",[27,[[26,\"inc\",[[21,2,[]]],null]]]],[11,\"id\",[27,[\"radio_\",[26,\"inc\",[[21,2,[]]],null]]]],[11,\"checked\",[21,1,[\"1\"]]],[11,\"onclick\",[26,\"action\",[[21,0,[]],\"radioClicked\",[21,2,[]]],null]],[10,\"type\",\"radio\"],[8],[9],[0,\"\\n\\n\"],[0,\"  \"],[6,\"label\"],[11,\"for\",[27,[\"radio_\",[26,\"inc\",[[21,2,[]]],null]]]],[10,\"class\",\"label-checkbox-proposal\"],[8],[0,\"\\n\\n\"],[0,\"    \"],[6,\"span\"],[10,\"class\",\"sr-only\"],[8],[0,\"La réponse à la question est : \"],[9],[6,\"span\"],[10,\"class\",\"proposal-text\"],[8],[1,[21,1,[\"0\"]],false],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"parameters\":[1,2]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qcu-proposals.hbs" } });
});
define("pix-live/templates/components/qcu-solution-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "omjwFupr", "block": "{\"symbols\":[\"labeledItemRadio\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"qcu-panel__proposals rounded-panel\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row qcu-panel__proposal-list\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"labeledRadios\"]]],null,{\"statements\":[[0,\"      \"],[6,\"p\"],[10,\"class\",\"qcu-panel__proposal-item\"],[8],[0,\"\\n\\n        \"],[6,\"label\"],[10,\"class\",\"qcu-panel__proposal-label qcu-proposal-label\"],[8],[0,\"\\n\"],[4,\"if\",[[21,1,[\"1\"]]],null,{\"statements\":[[0,\"            \"],[6,\"svg\"],[10,\"class\",\"radio-on picture-radio-proposal--qcu\"],[10,\"width\",\"18px\"],[10,\"height\",\"18px\"],[10,\"viewBox\",\"0 0 18 18\"],[10,\"version\",\"1.1\"],[10,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[10,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[8],[0,\"\\n              \"],[6,\"g\"],[10,\"id\",\"Styles\"],[10,\"stroke\",\"none\"],[10,\"stroke-width\",\"1\"],[10,\"fill\",\"none\"],[10,\"fill-rule\",\"evenodd\"],[8],[0,\"\\n                \"],[6,\"g\"],[10,\"id\",\"Icons\"],[10,\"transform\",\"translate(-133.000000, -89.000000)\"],[10,\"fill\",\"#7D808B\"],[8],[0,\"\\n                  \"],[6,\"g\"],[10,\"id\",\"icontest--radio-enabled\"],[10,\"transform\",\"translate(132.000000, 88.000000)\"],[8],[0,\"\\n                    \"],[6,\"path\"],[10,\"d\",\"M10,1 C12.3869484,1 14.6761336,1.94821156 16.363961,3.63603897 C18.0517884,5.32386638 19,7.61305159 19,10 C19,14.9705627 14.9705627,19 10,19 C7.61305159,19 5.32386638,18.0517884 3.63603897,16.363961 C1.94821156,14.6761336 1,12.3869484 1,10 C1,7.61305159 1.94821156,5.32386638 3.63603897,3.63603897 C5.32386638,1.94821156 7.61305159,1 10,1 L10,1 Z M9.1,14.05 L15.4,7.75 L14.131,6.481 L9.1,11.503 L6.319,8.731 L5.05,10 L9.1,14.05 Z\"],[10,\"id\",\"Shape\"],[8],[9],[0,\"\\n                  \"],[9],[0,\"\\n                \"],[9],[0,\"\\n              \"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[6,\"svg\"],[10,\"class\",\"radio-off picture-radio-proposal--qcu\"],[10,\"width\",\"18px\"],[10,\"height\",\"18px\"],[10,\"viewBox\",\"0 0 18 18\"],[10,\"version\",\"1.1\"],[10,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[10,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[8],[0,\"\\n              \"],[6,\"g\"],[10,\"id\",\"Page-1\"],[10,\"stroke\",\"none\"],[10,\"stroke-width\",\"1\"],[10,\"fill\",\"none\"],[10,\"fill-rule\",\"evenodd\"],[8],[0,\"\\n                \"],[6,\"circle\"],[10,\"id\",\"Oval\"],[10,\"stroke\",\"#7D808B\"],[10,\"stroke-width\",\"2\"],[10,\"cx\",\"9\"],[10,\"cy\",\"9\"],[10,\"r\",\"8\"],[8],[9],[0,\"\\n              \"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n          \"],[6,\"span\"],[10,\"class\",\"qcu-proposal-label__oracle\"],[11,\"data-goodness\",[27,[[26,\"if\",[[26,\"get\",[[22,[\"solutionArray\"]],[26,\"concat\",[[21,2,[]]],null]],null],\"good\",\"bad\"],null]]]],[11,\"data-checked\",[26,\"if\",[[21,1,[\"1\"]],\"yes\",\"no\"],null]],[8],[0,\"\\n            \"],[1,[21,1,[\"0\"]],false],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qcu-solution-panel.hbs" } });
});
define("pix-live/templates/components/qroc-proposal", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "kfMvLP6F", "block": "{\"symbols\":[\"block\"],\"statements\":[[4,\"each\",[[22,[\"_blocks\"]]],null,{\"statements\":[[0,\"\\n\"],[4,\"if\",[[21,1,[\"text\"]]],null,{\"statements\":[[0,\"    \"],[6,\"span\"],[10,\"id\",\"qroc_input\"],[8],[1,[21,1,[\"text\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[21,1,[\"input\"]]],null,{\"statements\":[[0,\"    \"],[6,\"input\"],[10,\"class\",\"challenge-response__proposal-input\"],[10,\"for\",\"qroc_input\"],[11,\"name\",[21,1,[\"input\"]]],[11,\"placeholder\",[21,1,[\"placeholder\"]]],[11,\"value\",[27,[[20,\"userAnswer\"]]]],[10,\"data-uid\",\"qroc-proposal-uid\"],[10,\"type\",\"text\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[21,1,[\"breakline\"]]],null,{\"statements\":[[0,\"    \"],[6,\"br\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qroc-proposal.hbs" } });
});
define("pix-live/templates/components/qroc-solution-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "sSAKIg7D", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"correction-qroc-box rounded-panel\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row \"],[8],[0,\"\\n\\n    \"],[6,\"div\"],[10,\"class\",\"correction-qroc-box__answer\"],[8],[0,\"\\n      \"],[6,\"input\"],[11,\"class\",[27,[[20,\"inputClass\"],\" correction-qroc-box--answer__input\"]]],[11,\"value\",[27,[[20,\"answerToDisplay\"]]]],[10,\"disabled\",\"\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n\"],[4,\"unless\",[[22,[\"isResultOk\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"correction-qroc-box__solution\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"class\",\"correction-qroc-box__solution-img\"],[10,\"src\",\"/images/comparison-window/icon-arrow-right.svg\"],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"correction-qroc-box__solution-text\"],[8],[1,[20,\"solutionToDisplay\"],false],[9],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qroc-solution-panel.hbs" } });
});
define("pix-live/templates/components/qrocm-ind-solution-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "PBjAAjxO", "block": "{\"symbols\":[\"field\"],\"statements\":[[6,\"div\"],[10,\"class\",\"qrocm-solution-panel rounded-panel\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel__row \"],[8],[0,\"\\n\\n    \"],[6,\"div\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"inputFields\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"correction-qrocm\"],[8],[0,\"\\n\\n          \"],[6,\"div\"],[10,\"class\",\"correction-qrocm__label\"],[8],[0,\"\\n            \"],[6,\"span\"],[8],[1,[21,1,[\"label\"]],false],[9],[0,\"\\n          \"],[9],[0,\"\\n\\n          \"],[6,\"div\"],[10,\"class\",\"correction-qrocm__answer-solution\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"correction-qrocm__answer\"],[8],[0,\"\\n              \"],[6,\"input\"],[11,\"value\",[27,[[21,1,[\"answer\"]]]]],[11,\"class\",[27,[\"correction-qrocm__answer-input \",[21,1,[\"inputClass\"]]]]],[10,\"disabled\",\"\"],[8],[9],[0,\"\\n            \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[21,1,[\"emptyOrWrongAnswer\"]]],null,{\"statements\":[[0,\"              \"],[6,\"div\"],[10,\"class\",\"correction-qrocm__solution\"],[8],[0,\"\\n                \"],[6,\"img\"],[10,\"class\",\"correction-qrocm__solution-img\"],[10,\"src\",\"/images/comparison-window/icon-arrow-right.svg\"],[10,\"alt\",\"\"],[8],[9],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"correction-qrocm__solution-text\"],[8],[1,[21,1,[\"solution\"]],false],[9],[0,\"\\n              \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[9],[0,\"\\n\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"    \"],[9],[0,\"\\n\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qrocm-ind-solution-panel.hbs" } });
});
define("pix-live/templates/components/qrocm-proposal", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+VQtm/pE", "block": "{\"symbols\":[\"block\"],\"statements\":[[4,\"each\",[[22,[\"_blocks\"]]],null,{\"statements\":[[0,\"\\n\"],[4,\"if\",[[21,1,[\"text\"]]],null,{\"statements\":[[0,\"    \"],[6,\"span\"],[8],[1,[21,1,[\"text\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[21,1,[\"input\"]]],null,{\"statements\":[[0,\"    \"],[6,\"input\"],[10,\"class\",\"challenge-response__proposal-input\"],[11,\"name\",[21,1,[\"input\"]]],[11,\"placeholder\",[21,1,[\"placeholder\"]]],[11,\"value\",[26,\"property-of\",[[22,[\"answersValue\"]],[21,1,[\"input\"]]],null]],[10,\"type\",\"text\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[21,1,[\"breakline\"]]],null,{\"statements\":[[0,\"    \"],[6,\"br\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/qrocm-proposal.hbs" } });
});
define("pix-live/templates/components/reset-password-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "q0mV3SxZ", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"reset-password-form__heading\"],[8],[0,\"\\n  \"],[1,[20,\"pix-logo\"],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"reset-password-form__user-details\"],[8],[1,[22,[\"user\",\"fullName\"]],false],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"reset-password-form__instruction\"],[8],[0,\"Saisissez votre nouveau mot de passe\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"reset-password-form__password-textfield-container\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"reset-password__textfield\"],[8],[0,\"\\n    \"],[1,[26,\"form-textfield\",null,[[\"label\",\"textfieldName\",\"validationStatus\",\"validate\",\"inputBindingValue\",\"validationMessage\"],[\"Mot de passe\",\"password\",[22,[\"validation\",\"status\"]],\"validatePassword\",[22,[\"user\",\"password\"]],[22,[\"validation\",\"message\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"reset-password-form__button-container\"],[8],[0,\"\\n  \"],[6,\"button\"],[10,\"class\",\"reset-password-form__submit-button\"],[3,\"action\",[[21,0,[]],\"handleResetPassword\"]],[8],[0,\"envoyer\"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/reset-password-form.hbs" } });
});
define("pix-live/templates/components/result-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TMNBX1Nd", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"result-item__index\"],[8],[0,\"\\n  \"],[1,[26,\"add\",[[22,[\"index\"]],1],null],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"result-item__item-line\"],[8],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"result-item__icon\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"data-toggle\",\"tooltip\"],[10,\"data-placement\",\"top\"],[11,\"title\",[27,[[22,[\"resultItem\",\"tooltip\"]]]]],[8],[0,\"\\n    \"],[6,\"img\"],[11,\"class\",[27,[\"result-item__icon-img result-item__icon-img--\",[22,[\"resultItem\",\"status\"]]]]],[11,\"src\",[20,\"resultItemIcon\"]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"result-item__instruction\"],[8],[0,\"\\n  \"],[1,[26,\"strip-instruction\",[[26,\"convert-to-html\",[[22,[\"answer\",\"challenge\",\"instruction\"]]],null]],null],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"result-item__correction\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"validationImplementedForChallengeType\"]]],null,{\"statements\":[[0,\"    \"],[6,\"button\"],[10,\"class\",\"result-item__correction__button js-correct-answer\"],[11,\"id\",[27,[[20,\"a11y-focus-id\"]]]],[3,\"action\",[[21,0,[]],\"openComparisonPopin\",[22,[\"a11y-focus-id\"]]]],[8],[0,\" RÉPONSE\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/result-item.hbs" } });
});
define("pix-live/templates/components/routable-modal-backdrop", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "QfTXJyWy", "block": "{\"symbols\":[\"&default\"],\"statements\":[[13,1],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/routable-modal-backdrop.hbs" } });
});
define("pix-live/templates/components/routable-modal-close-button", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "JrH13rFR", "block": "{\"symbols\":[\"&default\"],\"statements\":[[4,\"if\",[[23,1]],null,{\"statements\":[[0,\"    \"],[13,1],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[6,\"span\"],[8],[0,\"×\"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/routable-modal-close-button.hbs" } });
});
define("pix-live/templates/components/routable-modal-hold", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "IlizcQx0", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"outlet\",[\"routable-modal-outlet\"],null],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/routable-modal-hold.hbs" } });
});
define("pix-live/templates/components/routable-modal-outlet", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "gpNb3r5E", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"current\",\"routeName\"]]],null,{\"statements\":[[0,\"    \"],[1,[20,\"routable-modal-hold\"],false],[0,\"\\n    \"],[1,[20,\"routable-modal-backdrop\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/routable-modal-outlet.hbs" } });
});
define("pix-live/templates/components/score-pastille", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "9PNKOHt2", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"score-pastille__pix-score-wrapper\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"score-pastille__pix-score\"],[8],[1,[20,\"score\"],false],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"score-pastille__pix-score-unit\"],[8],[0,\"pix\"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/score-pastille.hbs" } });
});
define("pix-live/templates/components/scoring-panel-tantpix", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "QpSb3hgK", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"tantpix-panel__illustration-container\"],[8],[0,\"\\n  \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/smiley.png\"]]],[11,\"srcset\",[27,[[20,\"rootURL\"],\"/images/smiley@2x.png 2x,\\n\\t\\t\\t\\t\\t \",[20,\"rootURL\"],\"/images/smiley@3x.png 3x\"]]],[10,\"class\",\"tantpix-panel__illustration\"],[10,\"alt\",\"smiley\"],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"tantpix-panel__title-container\"],[8],[0,\"\\n  \"],[6,\"h1\"],[10,\"class\",\"tantpix-panel__title\"],[8],[0,\"Tant pix !\"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"tantpix-panel__description-container\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"tantpix-panel__description\"],[8],[0,\"\\n    Manifestement, ce n'est pas votre jour mais vous ferez mieux la prochaine fois.\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tantpix-panel__button-container\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"index\"],[[\"class\",\"tagName\"],[\"tantpix-panel__button\",\"button\"]],{\"statements\":[[0,\"    revenir à l'accueil\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/scoring-panel-tantpix.hbs" } });
});
define("pix-live/templates/components/scoring-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "JW/o1kKz", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasSomePix\"]]],null,{\"statements\":[[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"scoring-panel__reward\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"hasATrophy\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"trophy-item\",null,[[\"level\"],[[22,[\"assessment\",\"estimatedLevel\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[1,[26,\"medal-item\",null,[[\"pixScore\"],[[22,[\"assessment\",\"pixScore\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-course-name\"],[8],[1,[22,[\"assessment\",\"course\",\"name\"]],false],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-line\"],[8],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"hasATrophy\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-felicitations\"],[8],[0,\"Félicitations !\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-scoring\"],[8],[0,\"Vous avez obtenu le niveau \"],[1,[22,[\"assessment\",\"estimatedLevel\"]],false],[0,\" pour\\n        cette\\n        compétence et avez gagné \"],[1,[22,[\"assessment\",\"pixScore\"]],false],[0,\" pix.\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-pas-mal\"],[8],[0,\"Pas mal, mais pas max !\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-scoring\"],[8],[0,\"Vous avez gagné \"],[1,[22,[\"assessment\",\"pixScore\"]],false],[0,\" pix ! *\"],[6,\"br\"],[8],[9],[0,\"\\n        Allez, encore quelques petits efforts et vous décrocherez le premier niveau\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"scoring-panel__congrats-beta\"],[8],[0,\"*En version bêta, les pix et niveaux délivrés sont provisoires\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[4,\"link-to\",[\"index\"],[[\"class\",\"tagName\"],[\"scoring-panel__index-link__element\",\"button\"]],{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"scoring-panel__index-link\"],[8],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"scoring-panel__index-link-back\"],[8],[0,\"REVENIR À L'ACCUEIL\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[1,[20,\"scoring-panel-tantpix\"],false],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/scoring-panel.hbs" } });
});
define("pix-live/templates/components/share-profile", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "SlMH63Bk", "block": "{\"symbols\":[\"&default\"],\"statements\":[[6,\"button\"],[10,\"class\",\"share-profile__share-button\"],[3,\"action\",[[21,0,[]],\"openModal\"]],[8],[0,\"\\n  Envoyer \"],[6,\"span\"],[10,\"class\",\"sr-only\"],[8],[0,\"mon profil\"],[9],[0,\"\\n  \"],[6,\"img\"],[10,\"class\",\"share-profile__share-button-image\"],[10,\"src\",\"/images/icon-partager.svg\"],[10,\"alt\",\"\"],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_showingModal\"]]],null,{\"statements\":[[4,\"pix-modale\",null,[[\"containerClass\",\"onClose\"],[\"share-profile__modal\",\"closeModal\"]],{\"statements\":[[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"pix-modal__container\"],[8],[0,\"\\n\\n      \"],[6,\"a\"],[10,\"href\",\"#\"],[10,\"class\",\"pix-modal__close-link\"],[3,\"action\",[[21,0,[]],\"closeModal\"]],[8],[0,\"Fermer\\n        \"],[6,\"img\"],[10,\"src\",\"/images/comparison-window/icon-close-modal.svg\"],[10,\"alt\",\"Fermer la fenêtre modale\"],[10,\"width\",\"24\"],[10,\"height\",\"24\"],[8],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"h1\"],[8],[0,\"Envoi de votre profil\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"stepOrganizationCodeEntry\"]]],null,{\"statements\":[[0,\"\\n        \"],[6,\"section\"],[10,\"class\",\"pix-modal__body share-profile__section share-profile__section--organization-code-entry\"],[8],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__row\"],[8],[0,\"\\n            \"],[6,\"p\"],[8],[0,\"Veuillez saisir le code correspondant à votre organisation (collège, lycée, université, école, entreprise).\"],[9],[0,\"\\n\\n            \"],[1,[26,\"input\",null,[[\"class\",\"id\",\"placeholder\",\"focus-in\",\"focus-out\",\"value\",\"enter\"],[\"pix-modal__input share-profile__organization-code-input\",\"code\",[22,[\"_placeholder\"]],\"focusInOrganizationCodeInput\",\"focusOutOrganizationCodeInput\",[22,[\"_code\"]],\"findOrganizationAndGoToSharingConfirmationView\"]]],false],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_organizationNotFound\"]]],null,{\"statements\":[[0,\"              \"],[6,\"p\"],[10,\"class\",\"share-profile__form-error\"],[8],[0,\"Ce code ne correspond à aucune organisation.\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[9],[0,\"\\n\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__share-modal-buttons\"],[8],[0,\"\\n            \"],[6,\"button\"],[10,\"class\",\"pix-modal__button pix-modal__button--primary share-profile__continue-button\"],[3,\"action\",[[21,0,[]],\"findOrganizationAndGoToSharingConfirmationView\"]],[8],[0,\"Continuer\"],[9],[0,\"\\n            \"],[6,\"button\"],[10,\"class\",\"pix-modal__button pix-modal__button--secondary share-profile__cancel-button\"],[3,\"action\",[[21,0,[]],\"closeModal\"]],[8],[0,\"Annuler\"],[9],[0,\"\\n          \"],[9],[0,\"\\n\\n\\n        \"],[9],[0,\"\\n\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[22,[\"stepProfileSharingConfirmation\"]]],null,{\"statements\":[[0,\"\\n        \"],[6,\"section\"],[10,\"class\",\"pix-modal__body share-profile__section share-profile__section--sharing-confirmation\"],[8],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__row share-profile__row--organization-name\"],[8],[0,\"\\n            \"],[6,\"p\"],[8],[1,[22,[\"organizationLabels\",\"text1\"]],false],[9],[0,\"\\n            \"],[6,\"p\"],[10,\"class\",\"share-profile__organization-name\"],[8],[1,[22,[\"_organization\",\"name\"]],false],[9],[0,\"\\n          \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"isOrganizationHasTypeSupOrPro\"]]],null,{\"statements\":[[0,\"            \"],[6,\"div\"],[10,\"class\",\"share-profile__row share-profile__row--student-code\"],[8],[0,\"\\n              \"],[6,\"p\"],[8],[1,[22,[\"organizationLabels\",\"personalCode\"]],false],[9],[0,\"\\n              \"],[1,[26,\"input\",null,[[\"class\",\"value\",\"maxlength\"],[\"pix-modal__input share-profile__student-code-input\",[22,[\"_studentCode\"]],255]]],false],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__row share-profile__row--campaign-code\"],[8],[0,\"\\n            \"],[6,\"p\"],[8],[0,\"Précisez le code campagne s'il vous a été fourni :\"],[9],[0,\"\\n            \"],[1,[26,\"input\",null,[[\"class\",\"value\",\"maxlength\"],[\"pix-modal__input share-profile__campaign-code-input\",[22,[\"_campaignCode\"]],255]]],false],[0,\"\\n          \"],[9],[0,\"\\n\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__row share-profile__row--disclaimer\"],[8],[0,\"\\n            \"],[6,\"p\"],[8],[1,[22,[\"organizationLabels\",\"text2\"]],false],[9],[0,\"\\n            \"],[6,\"ul\"],[10,\"class\",\"pix-modal__list\"],[8],[0,\"\\n              \"],[6,\"li\"],[10,\"class\",\"pix-modal__list-item\"],[8],[0,\"› votre nom et prénom\"],[9],[0,\"\\n              \"],[6,\"li\"],[10,\"class\",\"pix-modal__list-item\"],[8],[0,\"› l'état actuel de votre profil\"],[9],[0,\"\\n              \"],[6,\"li\"],[10,\"class\",\"pix-modal__list-item\"],[8],[0,\"› \"],[1,[22,[\"organizationLabels\",\"text3\"]],false],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"p\"],[8],[1,[22,[\"organizationLabels\",\"text4\"]],false],[9],[0,\"\\n          \"],[9],[0,\"\\n\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__share-modal-buttons\"],[8],[0,\"\\n            \"],[6,\"button\"],[10,\"class\",\"pix-modal__button pix-modal__button--primary share-profile__confirm-button\"],[3,\"action\",[[21,0,[]],\"shareSnapshotAndGoToSuccessNotificationView\"]],[8],[0,\"Envoyer\"],[9],[0,\"\\n            \"],[6,\"button\"],[10,\"class\",\"pix-modal__button pix-modal__button--secondary share-profile__cancel-button\"],[3,\"action\",[[21,0,[]],\"cancelSharingAndGoBackToOrganizationCodeEntryView\"]],[8],[0,\"Annuler\"],[9],[0,\"\\n          \"],[9],[0,\"\\n\\n        \"],[9],[0,\"\\n\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"\\n        \"],[6,\"section\"],[10,\"class\",\"pix-modal__body share-profile__section share-profile__section--success-notification\"],[8],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"share-profile__row\"],[8],[0,\"\\n            \"],[6,\"p\"],[10,\"class\",\"share-profile__statement\"],[8],[0,\"Votre profil a été envoyé avec succès.\"],[9],[0,\"\\n          \"],[9],[0,\"\\n          \"],[6,\"button\"],[10,\"class\",\"pix-modal__button pix-modal__button--primary share-profile__close-button\"],[3,\"action\",[[21,0,[]],\"closeModal\"]],[8],[0,\"Fermer\"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n      \"]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"\\n    \"],[9],[0,\"\\n\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\\n\"],[13,1],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/share-profile.hbs" } });
});
define("pix-live/templates/components/side-menu-toggle", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jAAVWZKe", "block": "{\"symbols\":[\"&default\"],\"statements\":[[4,\"if\",[[23,1]],null,{\"statements\":[[0,\"  \"],[13,1],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[6,\"span\"],[10,\"class\",\"toggle-bars\"],[8],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/side-menu-toggle.hbs" } });
});
define("pix-live/templates/components/side-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TfDZE2N7", "block": "{\"symbols\":[\"&default\"],\"statements\":[[13,1]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/side-menu.hbs" } });
});
define("pix-live/templates/components/signin-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "RILPBLvI", "block": "{\"symbols\":[],\"statements\":[[6,\"a\"],[10,\"href\",\"/\"],[10,\"class\",\"signin-form__home-link\"],[8],[0,\"Revenir à la page d'accueil\\n  \"],[6,\"img\"],[10,\"class\",\"signin-form__home-link_close\"],[10,\"alt\",\"\"],[10,\"src\",\"/images/icons/icon-close.svg\"],[8],[9],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"signin-form__panel\"],[8],[0,\"\\n\\n  \"],[1,[20,\"pix-logo\"],false],[0,\"\\n\\n  \"],[6,\"h1\"],[10,\"class\",\"signin-form__panel-title\"],[8],[0,\"Se connecter\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"displayErrorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"signin-form__errors\"],[8],[0,\"L'adresse email et/ou le mot de passe saisi sont incorrects\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"signin-form__form\"],[8],[0,\"\\n    \"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"submit\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"signin-form__form-field\"],[8],[0,\"\\n        \"],[6,\"label\"],[10,\"for\",\"pix-email\"],[8],[0,\"Adresse e-mail\"],[9],[0,\"\\n        \"],[1,[26,\"input\",null,[[\"id\",\"type\",\"placeholder\",\"value\"],[\"pix-email\",\"email\",\"nom@exemple.fr\",[22,[\"email\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n\\n\\n      \"],[6,\"div\"],[10,\"class\",\"signin-form__form-field\"],[8],[0,\"\\n        \"],[6,\"label\"],[10,\"for\",\"pix-password\"],[8],[0,\"Mot de passe\"],[9],[0,\"\\n        \"],[1,[26,\"input\",null,[[\"id\",\"type\",\"value\"],[\"pix-password\",\"password\",[22,[\"password\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"signin-form__form-field\"],[8],[0,\"\\n        \"],[4,\"link-to\",[\"password-reset-demand\"],[[\"class\"],[\"signin-form__forgotten-password-link\"]],{\"statements\":[[0,\"Mot de passe oublié ?\"]],\"parameters\":[]},null],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"signin-form__form-field signin-form__form-field-button\"],[8],[0,\"\\n        \"],[6,\"button\"],[10,\"class\",\"signin-form__submit_button\"],[10,\"type\",\"submit\"],[3,\"action\",[[21,0,[]],\"submit\"],[[\"allowedKeys\"],[\"enter\"]]],[8],[0,\"Je me connecte\"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/signin-form.hbs" } });
});
define("pix-live/templates/components/signup-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "NaHIr1Ba", "block": "{\"symbols\":[],\"statements\":[[6,\"form\"],[10,\"class\",\"signup-form-container\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__logo\"],[8],[0,\"\\n    \"],[1,[20,\"pix-logo\"],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__heading-container\"],[8],[0,\"\\n    \"],[6,\"h1\"],[10,\"class\",\"signup-form__heading\"],[8],[0,\"Inscription gratuite\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_notificationMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[10,\"class\",\"signup-form__notification-message\"],[10,\"aria-live\",\"polite\"],[8],[1,[20,\"_notificationMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__input-container\"],[8],[0,\"\\n    \"],[1,[26,\"form-textfield\",null,[[\"label\",\"textfieldName\",\"inputBindingValue\",\"validate\",\"validationStatus\",\"validationMessage\"],[\"Prénom\",\"firstName\",[22,[\"user\",\"firstName\"]],\"validateInput\",[22,[\"validation\",\"firstName\",\"status\"]],[22,[\"validation\",\"firstName\",\"message\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__input-container\"],[8],[0,\"\\n    \"],[1,[26,\"form-textfield\",null,[[\"label\",\"textfieldName\",\"inputBindingValue\",\"validate\",\"validationStatus\",\"validationMessage\"],[\"Nom\",\"lastName\",[22,[\"user\",\"lastName\"]],\"validateInput\",[22,[\"validation\",\"lastName\",\"status\"]],[22,[\"validation\",\"lastName\",\"message\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__input-container\"],[8],[0,\"\\n    \"],[1,[26,\"form-textfield\",null,[[\"label\",\"textfieldName\",\"validationStatus\",\"validate\",\"inputBindingValue\",\"validationMessage\"],[\"Adresse Email\",\"email\",[22,[\"validation\",\"email\",\"status\"]],\"validateInputEmail\",[22,[\"user\",\"email\"]],[22,[\"validation\",\"email\",\"message\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__input-container\"],[8],[0,\"\\n    \"],[1,[26,\"form-textfield\",null,[[\"label\",\"textfieldName\",\"validationStatus\",\"validate\",\"inputBindingValue\",\"validationMessage\"],[\"Mot de passe\",\"password\",[22,[\"validation\",\"password\",\"status\"]],\"validateInputPassword\",[22,[\"user\",\"password\"]],[22,[\"validation\",\"password\",\"message\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__cgu-container\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"user\",\"errors\",\"cgu\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"form-textfield__cgu-message--error\"],[8],[0,\"\\n        \"],[1,[22,[\"user\",\"errors\",\"cgu\",\"firstObject\",\"message\"]],false],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n    \"],[6,\"label\"],[10,\"for\",\"pix-cgu\"],[10,\"class\",\"signup-form__cgu-label\"],[8],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\"],[\"checkbox\",\"pix-cgu\",[22,[\"user\",\"cgu\"]]]]],false],[0,\"\\n      \"],[6,\"span\"],[8],[0,\"J'​accepte les \"],[4,\"link-to\",[\"terms-of-service\"],[[\"class\",\"target\"],[\"signup__cgu-link\",\"_blank\"]],{\"statements\":[[0,\"\\n        conditions d'​utilisation de Pix\"]],\"parameters\":[]},null],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__captcha-container\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"user\",\"errors\",\"recaptchaToken\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"signup-field__recaptcha-message--error\"],[8],[1,[22,[\"user\",\"errors\",\"recaptchaToken\",\"firstObject\",\"message\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[1,[26,\"g-recaptcha\",null,[[\"recaptchaToken\",\"tokenHasBeenUsed\"],[[22,[\"user\",\"recaptchaToken\"]],[22,[\"_tokenHasBeenUsed\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__submit-container\"],[8],[0,\"\\n    \"],[6,\"button\"],[10,\"class\",\"signup__submit-button\"],[3,\"action\",[[21,0,[]],\"signup\"]],[8],[0,\"Je m'inscris\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"signup-form__legal-details-container\"],[8],[0,\"\\n    Les informations recueillies sur ce formulaire sont enregistrées dans un fichier informatisé par Pix pour permettre l'accès au service offert par Pix.\\n    Elles sont conservées pendant la durée d'utilisation du service et sont destinées à Pix exclusivement. Elles ne sont pas communiquées à des tiers.\\n    Conformément à la loi « informatique et libertés », vous pouvez exercer votre droit d'accès aux données vous concernant et les faire rectifier en envoyant un mail à dpo@pix.fr.\\n  \"],[9],[0,\"\\n\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/signup-form.hbs" } });
});
define("pix-live/templates/components/snapshot-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "j7LP8w68", "block": "{\"symbols\":[\"snapshot\"],\"statements\":[[6,\"div\"],[10,\"class\",\"snapshot-list\"],[8],[0,\"\\n  \"],[6,\"table\"],[10,\"class\",\"snapshot-list__body-table\"],[8],[0,\"\\n    \"],[6,\"thead\"],[10,\"class\",\"snapshot-list__body-table__header\"],[8],[0,\"\\n    \"],[6,\"tr\"],[8],[0,\"\\n      \"],[6,\"td\"],[10,\"class\",\"snapshot-list__table-header-cell\"],[8],[0,\"Nom\"],[9],[0,\"\\n      \"],[6,\"td\"],[10,\"class\",\"snapshot-list__table-header-cell\"],[8],[0,\"Prénom\"],[9],[0,\"\\n      \"],[6,\"td\"],[10,\"class\",\"snapshot-list__table-header-cell\"],[8],[0,\"Date d'envoi\"],[9],[0,\"\\n      \"],[6,\"td\"],[10,\"class\",\"snapshot-list__table-header-cell\"],[8],[0,\"Score Pix\"],[9],[0,\"\\n      \"],[6,\"td\"],[10,\"class\",\"snapshot-list__table-header-cell\"],[8],[0,\"Tests Réalisés\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"tbody\"],[10,\"class\",\"snapshot-list__body-table__body\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"_hasSnapshots\"]]],null,{\"statements\":[[4,\"each\",[[22,[\"snapshots\"]]],null,{\"statements\":[[0,\"          \"],[6,\"tr\"],[10,\"class\",\"snapshot-list__snapshot-item\"],[8],[0,\"\\n            \"],[6,\"td\"],[10,\"class\",\"snapshot-list__snapshot-item-cell\"],[8],[1,[21,1,[\"user\",\"lastName\"]],false],[9],[0,\"\\n            \"],[6,\"td\"],[10,\"class\",\"snapshot-list__snapshot-item-cell\"],[8],[1,[21,1,[\"user\",\"firstName\"]],false],[9],[0,\"\\n            \"],[6,\"td\"],[10,\"class\",\"snapshot-list__snapshot-item-cell\"],[8],[1,[26,\"moment-format\",[[21,1,[\"createdAt\"]],\"DD/MM/YYYY\"],[[\"allow-empty\"],[true]]],false],[9],[0,\"\\n            \"],[6,\"td\"],[10,\"class\",\"snapshot-list__snapshot-item-cell\"],[8],[1,[21,1,[\"score\"]],false],[9],[0,\"\\n            \"],[6,\"td\"],[10,\"class\",\"snapshot-list__snapshot-item-cell\"],[8],[1,[21,1,[\"numberOfTestsFinished\"]],false],[0,\"/16\"],[9],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[6,\"tr\"],[8],[0,\"\\n      \"],[6,\"td\"],[10,\"colspan\",\"5\"],[10,\"class\",\"snapshot-list__no-profile\"],[8],[0,\"Aucun profil partagé pour le moment\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n    \"],[9],[0,\"\\n\\n  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/snapshot-list.hbs" } });
});
define("pix-live/templates/components/timeout-jauge", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ogEOQrJE", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"timeout-jauge\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"timeout-jauge-container\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"timeout-jauge-clock\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"hasFinished\"]]],null,{\"statements\":[[0,\"        \"],[6,\"img\"],[10,\"class\",\"svg-timeout-clock-red\"],[10,\"src\",\"/images/icon-timeout-red.svg\"],[10,\"alt\",\"Icône indiquant que le temps alloué est dépassé\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[6,\"img\"],[10,\"class\",\"svg-timeout-clock-black\"],[10,\"src\",\"/images/icon-timeout-black.svg\"],[10,\"alt\",\"Icône indiquant qu'il reste du temps pour accomplir l'épreuve\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[6,\"div\"],[8],[0,\" \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"timeout-jauge-remaining\"],[11,\"data-spent\",[27,[[20,\"remainingSeconds\"]]]],[8],[0,\"\\n        \"],[1,[20,\"remainingTime\"],false],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"timeout-jauge-progress\"],[11,\"style\",[20,\"jaugeWidthStyle\"]],[8],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/timeout-jauge.hbs" } });
});
define("pix-live/templates/components/trophy-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "gW/7Sy/j", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"trophy-item__div-img\"],[8],[0,\"\\n  \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/coupe.svg\"]]],[10,\"alt\",\"Coupe obtenue\"],[10,\"class\",\"trophy-item__img\"],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"trophy-item__level\"],[8],[0,\"NIVEAU \"],[1,[20,\"level\"],false],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"trophy-item__bêta\"],[8],[0,\"BÊTA\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/trophy-item.hbs" } });
});
define("pix-live/templates/components/tutorial-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "RN8IeidR", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"tutorial-item__tutorial-title\"],[8],[0,\"\\n  \"],[6,\"a\"],[11,\"href\",[27,[[22,[\"tutorial\",\"link\"]]]]],[10,\"target\",\"_blank\"],[10,\"class\",\"tutorial-item__tutorial-title-url\"],[8],[1,[22,[\"tutorial\",\"title\"]],false],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tutorial-item__tutorial-details\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"tutorial-item__tutorial-details__format\"],[8],[0,\"\\n    \"],[6,\"img\"],[11,\"src\",[27,[\"/images/icons/\",[20,\"formatImageName\"],\"-icon.svg\"]]],[11,\"alt\",[27,[[22,[\"tutorial\",\"format\"]]]]],[8],[9],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"tutorial-item__tutorial-details__informations\"],[8],[0,\"\\n    \"],[1,[20,\"displayedDuration\"],false],[0,\" | par \"],[1,[22,[\"tutorial\",\"source\"]],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"hr\"],[8],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/tutorial-item.hbs" } });
});
define("pix-live/templates/components/tutorial-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ysf974j3", "block": "{\"symbols\":[\"tutorial\"],\"statements\":[[4,\"if\",[[22,[\"shouldDisplayHintOrTuto\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"tutorial-panel__hint-container\"],[8],[0,\"\\n    \"],[6,\"header\"],[10,\"class\",\"tutorial-panel__hint-container-header\"],[8],[0,\"\\n      \"],[6,\"h3\"],[10,\"class\",\"tutorial-panel__hint-title\"],[8],[6,\"span\"],[8],[0,\"Pour réussir la prochaine fois\"],[9],[9],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"shouldDisplayHint\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"tutorial-panel__hint-container-body\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"tutorial-panel__hint-picto-container\"],[8],[0,\"\\n          \"],[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/comparison-window/icon-lampe.svg\"]]],[10,\"alt\",\"\"],[10,\"class\",\"tutorial-panel__hint-picto\"],[8],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[1,[26,\"markdown-to-html\",null,[[\"class\",\"markdown\"],[\"tutorial-panel__hint-content\",[22,[\"hint\"]]]]],false],[0,\"\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"shouldDisplayTutorial\"]]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"tutorial-panel__tutorials-container\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"limitedTutorials\"]]],null,{\"statements\":[[0,\"          \"],[1,[26,\"tutorial-item\",null,[[\"tutorial\"],[[21,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"      \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"tutorial-panel__tutorial-info\"],[8],[0,\"\\n        Ces liens ont été proposés par des utilisateurs de PIX.\\n      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/tutorial-panel.hbs" } });
});
define("pix-live/templates/components/user-certifications-detail-area", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "K+RFU/mv", "block": "{\"symbols\":[\"competence\",\"index\"],\"statements\":[[6,\"div\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-area__box-name\"],[8],[0,\"\\n    \"],[1,[22,[\"area\",\"title\"]],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[4,\"each\",[[22,[\"sortedCompetences\"]]],null,{\"statements\":[[0,\"\\n    \"],[1,[26,\"user-certifications-detail-competence\",null,[[\"competence\"],[[21,1,[]]]]],false],[0,\"\\n\\n\"]],\"parameters\":[1,2]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-detail-area.hbs" } });
});
define("pix-live/templates/components/user-certifications-detail-competence", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "pxk7cxBk", "block": "{\"symbols\":[\"level\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"user-certifications-detail-competence__box-name\"],[8],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"user-certifications-detail-competence__box-name-label\"],[8],[1,[22,[\"competence\",\"name\"]],false],[9],[0,\"\\n\"],[4,\"if\",[[26,\"gte\",[[22,[\"competence\",\"level\"]],1],null]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-competence__box-level\"],[8],[1,[22,[\"competence\",\"level\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-competence__levels-bar-block\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"levels\"]]],null,{\"statements\":[[4,\"if\",[[26,\"gte\",[[22,[\"competence\",\"level\"]],[21,1,[]]],null]],null,{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-competence__validate-level user-certifications-detail-competence__level-bar\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-competence__not-validate-level user-certifications-detail-competence__level-bar\"],[8],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[1,2]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-detail-competence.hbs" } });
});
define("pix-live/templates/components/user-certifications-detail-header", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zsKF7aEr", "block": "{\"symbols\":[],\"statements\":[[6,\"img\"],[11,\"src\",[27,[[20,\"rootURL\"],\"/images/icons/icon-certification.svg\"]]],[10,\"alt\",\"\"],[10,\"class\",\"user-certifications-detail-header__icon\"],[8],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-header__data-box\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"user-certifications-detail-header__data-box-title\"],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"user-certifications-detail-header__data-box-title-big\"],[8],[0,\"CERTIFICAT\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"certification\",\"date\"]]],null,{\"statements\":[[0,\"      obtenu le \"],[1,[26,\"moment-format\",[[22,[\"certification\",\"date\"]],\"LL\"],[[\"locale\"],[\"fr\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"certification\",\"lastName\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[0,\"Nom : \"],[1,[22,[\"certification\",\"firstName\"]],false],[0,\" \"],[1,[22,[\"certification\",\"lastName\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"certification\",\"birthdate\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[0,\"Date de naissance : \"],[1,[26,\"moment-format\",[[22,[\"certification\",\"birthdate\"]],\"LL\"],[[\"locale\"],[\"fr\"]]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"certification\",\"certificationCenter\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[0,\"Centre de certification : \"],[1,[22,[\"certification\",\"certificationCenter\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-detail-header.hbs" } });
});
define("pix-live/templates/components/user-certifications-detail-profile", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "roH4MGON", "block": "{\"symbols\":[\"area\",\"index\"],\"statements\":[[6,\"div\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"sortedAreas\"]]],null,{\"statements\":[[0,\"\\n  \"],[1,[26,\"user-certifications-detail-area\",null,[[\"area\"],[[21,1,[]]]]],false],[0,\"\\n\\n\"]],\"parameters\":[1,2]},null],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-detail-profile.hbs" } });
});
define("pix-live/templates/components/user-certifications-detail-result", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "nIC8SeoO", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__pix-score\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__badge-pix-score\"],[8],[0,\"\\n    \"],[6,\"span\"],[8],[1,[22,[\"certification\",\"pixScore\"]],false],[9],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__pix-certified\"],[8],[0,\"\\n    Pix certifiés\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__text-pix-certified\"],[8],[0,\"\\n  Votre score certifié a été calculé en fonction de vos réponses lors du passage de la certification.\\n  Il peut donc différer de votre nombre de Pix affiché dans votre profil.\\n\"],[9],[0,\"\\n\\n\"],[6,\"div\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"certification\",\"commentForCandidate\"]]],null,{\"statements\":[[0,\"    \"],[6,\"hr\"],[8],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__title-comment-jury\"],[8],[0,\"Intervention du jury\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"user-certifications-detail-result__comment-jury\"],[8],[0,\"\\n      \"],[1,[22,[\"certification\",\"commentForCandidate\"]],false],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-detail-result.hbs" } });
});
define("pix-live/templates/components/user-certifications-panel", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "EoLD4aZE", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"certifications\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"user-certifications-panel__certifications-list\"],[8],[0,\"\\n    \"],[1,[26,\"certifications-list\",null,[[\"certifications\"],[[22,[\"certifications\"]]]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"user-certifications-panel__no-certification-panel\"],[8],[0,\"\\n    \"],[1,[20,\"no-certification-panel\"],false],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-certifications-panel.hbs" } });
});
define("pix-live/templates/components/user-logged-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ailZaWHp", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"_user\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"logged-user-name\"],[10,\"aria-haspopup\",\"true\"],[11,\"aria-expanded\",[27,[[20,\"_canDisplayMenu\"]]]],[8],[0,\"\\n    \"],[6,\"a\"],[10,\"href\",\"#\"],[10,\"class\",\"logged-user-name__link\"],[3,\"action\",[[21,0,[]],\"toggleUserMenu\"]],[8],[0,\"\\n      \"],[1,[26,\"concat\",[[22,[\"_user\",\"firstName\"]],\" \",[22,[\"_user\",\"lastName\"]]],null],false],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"caret\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"_canDisplayMenu\"]]],null,{\"statements\":[[4,\"click-outside\",null,[[\"action\"],[[26,\"action\",[[21,0,[]],\"closeMenu\"],null]]],{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"logged-user-menu\"],[8],[0,\"\\n          \"],[6,\"ul\"],[10,\"class\",\"logged-user-menu__list\"],[8],[0,\"\\n            \"],[6,\"li\"],[10,\"class\",\"logged-user-menu__item user-menu-item\"],[8],[0,\"\\n              \"],[6,\"div\"],[10,\"class\",\"user-menu-item__details-firstname\"],[8],[0,\" \"],[1,[22,[\"_user\",\"firstName\"]],false],[9],[0,\"\\n              \"],[6,\"div\"],[10,\"class\",\"user-menu-item__details-email\"],[8],[1,[22,[\"_user\",\"email\"]],false],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"canDisplayLinkToProfile\"]]],null,{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"user-menu-item__details-account-link\"],[8],[0,\"\\n                  \"],[4,\"link-to\",[\"index\"],null,{\"statements\":[[0,\"Mon compte\"]],\"parameters\":[]},null],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n            \"],[9],[0,\"\\n\\n            \"],[6,\"li\"],[10,\"class\",\"logged-user-menu__item\"],[8],[0,\"\\n              \"],[6,\"div\"],[10,\"class\",\"user-menu-item__certification-link user-menu-item\"],[8],[0,\"\\n                \"],[4,\"link-to\",[\"user-certifications\"],null,{\"statements\":[[0,\"MES CERTIFICATIONS\"]],\"parameters\":[]},null],[0,\"\\n              \"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"li\"],[10,\"class\",\"logged-user-menu__item user-menu-item__logout\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"logout\"],[[\"class\",\"tagName\"],[\"grey-hover-button logout__button\",\"button\"]],{\"statements\":[[0,\"                \"],[6,\"span\"],[10,\"class\",\"grey-hover-button__label\"],[8],[0,\"se déconnecter\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/user-logged-menu.hbs" } });
});
define("pix-live/templates/components/warning-page", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "wsppG+ll", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"challenge-item-warning\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"challenge-item-warning__instruction-primary\"],[8],[0,\"\\n    Vous disposerez de \"],[6,\"span\"],[10,\"class\",\"challenge-item-warning__instruction-time\"],[8],[1,[20,\"allocatedHumanTime\"],false],[9],[0,\" pour\\n    réussir l’épreuve.\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"challenge-item-warning__intruction-secondary\"],[8],[0,\"\\n    Vous pourrez continuer à répondre ensuite, mais l’épreuve ne sera pas considérée comme réussie.\\n  \"],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"challenge-item-warning__allocated-time\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"challenge__allocated-time__jauge\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"class\",\"challenge__allocated-time__warning-icon\"],[10,\"src\",\"/images/icon-timed-challenge.svg\"],[10,\"alt\",\"Message d'avertissement\"],[8],[9],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"challenge__allocated-time__value\"],[8],[1,[20,\"allocatedTime\"],false],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"challenge-item-warning__action\"],[8],[0,\"\\n    \"],[6,\"button\"],[10,\"class\",\"challenge-item-warning__confirm-btn\"],[3,\"action\",[[21,0,[]],\"confirmWarning\"]],[8],[0,\"Commencer l'épreuve\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/components/warning-page.hbs" } });
});
define("pix-live/templates/compte-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "M3zLzUww", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"app-loader\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__image\"],[8],[6,\"img\"],[10,\"src\",\"/images/interwind.gif\"],[8],[9],[9],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__text\"],[8],[0,\"Votre compte est en cours de chargement...\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/compte-loading.hbs" } });
});
define("pix-live/templates/compte", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XlN9sWGj", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"compte-page\"],[8],[0,\"\\n\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n  \"],[1,[20,\"logged-user-profile-banner\"],false],[0,\"\\n\\n  \"],[1,[26,\"profile-panel\",null,[[\"competences\",\"totalPixScore\",\"searchForOrganization\",\"shareProfileSnapshot\"],[[22,[\"model\",\"competences\"]],[22,[\"model\",\"totalPixScore\"]],[26,\"route-action\",[\"searchForOrganization\"],null],[26,\"route-action\",[\"shareProfileSnapshot\"],null]]]],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/compte.hbs" } });
});
define("pix-live/templates/courses-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "C9eTug28", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"id\",\"home-loading\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"loader-container\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"loader\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"loader-inner ball-zig-zag\"],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"ball-spinner\"],[8],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"ball-spinner\"],[8],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/courses-loading.hbs" } });
});
define("pix-live/templates/courses/create-assessment", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "HIqXDqSQ", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"app-loader\"],[8],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__image\"],[8],[6,\"img\"],[10,\"src\",\"/images/interwind.gif\"],[8],[9],[9],[0,\"\\n  \"],[6,\"p\"],[10,\"class\",\"app-loader__text\"],[8],[0,\"\\n    Votre test est en cours de préparation.\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/courses/create-assessment.hbs" } });
});
define("pix-live/templates/error", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2FzxIvrr", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"pix-page error-page\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"pix-section\"],[8],[0,\"\\n    \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"pix-section error-page__body-section\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"pix-row\"],[8],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"pix-panel error-page__main-content\"],[8],[0,\"\\n        \"],[6,\"h1\"],[8],[0,\"Oups, une erreur est survenue !\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Nous vous invitons à recharger cette page ou \"],[4,\"link-to\",[\"index\"],null,{\"statements\":[[0,\"revenir à la page d’accueil\"]],\"parameters\":[]},null],[0,\".\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Vous pouvez aussi nous contacter par courriel à l’adresse \"],[6,\"a\"],[10,\"href\",\"mailto:support@pix.fr\"],[8],[0,\"support@pix.fr\"],[9],[0,\".\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Nous vous prions de nous excuser pour la gêne occasionnée.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L'équipe Pix.\"],[9],[0,\"\\n        \"],[4,\"link-to\",[\"index\"],[[\"class\"],[\"pix-button error-page__index-link\"]],{\"statements\":[[0,\"Revenir à la page d'accueil\"]],\"parameters\":[]},null],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/error.hbs" } });
});
define("pix-live/templates/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LVdEF8MR", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"index-page\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"index-page__background\"],[8],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"index-page__section index-page__section--hero index-page-hero\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"index-page-hero__navbar-header\"],[8],[0,\"\\n      \"],[1,[20,\"navbar-header\"],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"index-page-hero__content\"],[8],[0,\"\\n      \"],[6,\"h1\"],[10,\"class\",\"index-page-hero__title\"],[8],[0,\"Développez vos compétences numériques\"],[9],[0,\"\\n      \"],[6,\"p\"],[10,\"class\",\"index-page-hero__description\"],[8],[0,\"PIX est un projet public de plateforme en ligne d’évaluation et de certification des compétences numériques, en cours de développement.\"],[9],[0,\"\\n\\n\"],[4,\"unless\",[[22,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"        \"],[4,\"link-to\",[\"inscription\"],[[\"class\"],[\"index-page-hero__inscription-link\"]],{\"statements\":[[0,\"Je m'inscris gratuitement\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"index-page__section index-page__section--courses index-page-courses\"],[8],[0,\"\\n    \"],[6,\"h2\"],[10,\"class\",\"index-page-courses__title\"],[8],[0,\"Découvrez nos épreuves et aidez‑nous à les améliorer !\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"index-page-courses__course-list\"],[8],[0,\"\\n      \"],[1,[26,\"course-list\",null,[[\"courses\",\"startCourse\"],[[22,[\"model\"]],\"startCourse\"]]],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"index-page__section index-page__section--features index-page-features\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"index-page-features__list\"],[8],[0,\"\\n      \"],[1,[20,\"feature-list\"],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"project\"],[[\"class\"],[\"index-page-features__project-button\"]],{\"statements\":[[0,\"En savoir plus sur le projet\"]],\"parameters\":[]},null],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/index.hbs" } });
});
define("pix-live/templates/inscription", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/kvMoPwd", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"inscription-page\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"signup-container\"],[8],[0,\"\\n    \"],[1,[26,\"signup-form\",null,[[\"user\",\"refresh\",\"redirectToProfileRoute\"],[[22,[\"model\"]],\"refresh\",\"redirectToProfileRoute\"]]],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/inscription.hbs" } });
});
define("pix-live/templates/legal-notices", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "o56I2qB8", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"legal-notices-page\"],[8],[0,\"\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel legal-notices-page__container\"],[8],[0,\"\\n    \"],[6,\"h1\"],[10,\"class\",\"legal-notices-page__title\"],[8],[0,\"\\n      Mentions légales\\n    \"],[9],[0,\"\\n    \"],[6,\"section\"],[10,\"class\",\"legal-notices-section legal-notices-section--editor\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"legal-notices-section__title\"],[8],[0,\"Éditeur\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Groupement d’intérêt public « Pix » \"],[6,\"br\"],[8],[9],[0,\"\\n        110 rue de Grenelle \"],[6,\"br\"],[8],[9],[0,\"\\n        75007 Paris\"],[6,\"br\"],[8],[9],[0,\"\\n        tél. : 01 43 40 00 18\"],[6,\"br\"],[8],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"br\"],[8],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Directeur de la publication : M. Benjamin MARTEAU, Directeur\"],[9],[0,\"\\n      \"],[6,\"h3\"],[10,\"class\",\"legal-notices-section__subtitle\"],[8],[0,\"Membres du groupement d'intérêt public pix :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[10,\"class\",\"legal-notices-members\"],[8],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-member\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"legal-notices-member__link\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://www.education.gouv.fr/\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/legal-notices/logo-MEN.jpg\"],[10,\"alt\",\"logo ministère de l'éducation nationale\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-member\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"legal-notices-member__link\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://www.enseignementsup-recherche.gouv.fr/\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/legal-notices/logo-MESRI.jpg\"],[10,\"alt\",\"logo ministère de l'enseignement supérieur, de la recherche et de l'innovation\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"ul\"],[10,\"class\",\"legal-notices-members\"],[8],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-member\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"legal-notices-member__link\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://uoh.fr/front\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/legal-notices/logo-UOH.jpg\"],[10,\"alt\",\"logo université ouverte humaines\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-member\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"legal-notices-member__link\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://www.cned.fr/\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/legal-notices/logo-CNED.jpg\"],[10,\"alt\",\"logo CNED\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-member\"],[8],[0,\"\\n          \"],[6,\"a\"],[10,\"class\",\"legal-notices-member__link\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://unistra.fr/\"],[8],[0,\"\\n            \"],[6,\"img\"],[10,\"src\",\"/images/legal-notices/logo-Univ-strasbourg.jpg\"],[10,\"alt\",\"logo université strasbourg\"],[8],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"\\n        \"],[6,\"a\"],[10,\"target\",\"_blank\"],[10,\"href\",\"https://www.legifrance.gouv.fr/eli/arrete/2017/4/27/MENF1711150A/jo\"],[8],[0,\"\\n          Arrêté du 27 avril 2017 portant approbation de la convention constitutive du groupement d'intérêt\\n          public « PIX »\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"section\"],[10,\"class\",\"legal-notices-section legal-notices-section--personal-data\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"legal-notices-section__title\"],[8],[0,\"Protection des données personnelles\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Correspondante « informatiques et libertés » : Mme Nathalie DENOS\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Conformément à la loi « informatiques et libertés » du 6 janvier 1978, vous bénéficiez d’un droit d’accès, de\\n        rectification et d’opposition sur les données à caractère personnel vous concernant. Vous pouvez exercer ces\\n        droits, et/ou formuler toute demande d'information relative à vos données personnelles, en contactant notre\\n        Correspondant « informatiques et libertés » :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[10,\"class\",\"legal-notices-data-restriction-means\"],[8],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-data-restriction-mean\"],[8],[0,\"\\n          \"],[6,\"p\"],[8],[0,\"- par voie électronique, en adressant votre demande accompagnée de la copie d'un titre d'identité, à \"],[6,\"a\"],[10,\"href\",\"mailto:dpo@pix.fr\"],[10,\"target\",\"_top\"],[8],[0,\"dpo@pix.fr\"],[9],[0,\"\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"li\"],[10,\"class\",\"legal-notices-data-restriction-mean\"],[8],[0,\"\\n          \"],[6,\"p\"],[8],[0,\"\\n            - par courrier, accompagné de la copie d'un titre d'identité, à l'adresse suivante : PIX - 193 rue de Bercy - tour Gamma A - 75012 Paris\\n          \"],[9],[0,\"\\n        \"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"section\"],[10,\"class\",\"legal-notices-section legal-notices-section--hosting\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"legal-notices-section__title\"],[8],[0,\"Hébergements\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"\\n        Scalingo SAS\"],[6,\"br\"],[8],[9],[0,\"\\n        15 avenue du Rhin\"],[6,\"br\"],[8],[9],[0,\"\\n        67100 Strasbourg\"],[6,\"br\"],[8],[9],[0,\"\\n        France\"],[6,\"br\"],[8],[9],[0,\"\\n        SIRET 80866548300018\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"section\"],[10,\"class\",\"legal-notices-section legal-notices-section--credits\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"legal-notices-section__title\"],[8],[0,\"Crédits\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"UX / UI Design : \"],[6,\"a\"],[10,\"target\",\"_blank\"],[10,\"href\",\"http://reloaded.digital/\"],[8],[0,\"Reloaded\"],[9],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/legal-notices.hbs" } });
});
define("pix-live/templates/login", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "1GTynEoB", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"signin-container\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"signin-no-account\"],[8],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"signin-no-account-text\"],[10,\"title\",\"\"],[8],[0,\"Vous n'avez pas encore de compte Pix ?\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"inscription\"],[[\"class\"],[\"signin-inscription-button\"]],{\"statements\":[[0,\"S'inscrire \"],[6,\"span\"],[10,\"class\",\"sr-only\"],[8],[0,\" sur Pix\"],[9],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[1,[26,\"signin-form\",null,[[\"onSubmit\"],[[26,\"route-action\",[\"signin\"],null]]]],false],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/login.hbs" } });
});
define("pix-live/templates/logout", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "U1j1OHw7", "block": "{\"symbols\":[],\"statements\":[[1,[20,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/logout.hbs" } });
});
define("pix-live/templates/password-reset-demand", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+wlCuHrN", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"password-reset-page\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-page__inscription\"],[8],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"password-reset-page__inscription-text\"],[10,\"title\",\"\"],[8],[0,\"Vous n'avez pas encore de compte Pix ?\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"inscription\"],[[\"class\"],[\"password-reset-page__inscription-button\"]],{\"statements\":[[0,\"      S'inscrire \"],[6,\"span\"],[10,\"class\",\"sr-only\"],[8],[0,\" sur Pix\"],[9]],\"parameters\":[]},null],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"password-reset-page__password-reset-form\"],[8],[0,\"\\n    \"],[1,[20,\"password-reset-form\"],false],[0,\"\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/password-reset-demand.hbs" } });
});
define("pix-live/templates/project", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8J2WdEHF", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"project-page\"],[8],[0,\"\\n\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"blue-ribbon\"],[8],[0,\"\\n    \"],[6,\"h1\"],[10,\"class\",\"blue-ribbon__text\"],[8],[0,\"PIX est un projet public de plateforme en ligne d’évaluation et de certification des compétences numériques, en cours de développement.\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"rounded-panel project-page__panel project-page__populations\"],[8],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"project-page__populations-headline\"],[8],[0,\"Le service sera accessible gratuitement et ouvert à tous les francophones :\"],[9],[0,\"\\n    \"],[6,\"ul\"],[10,\"class\",\"project-page__user-types\"],[8],[0,\"\\n      \"],[6,\"li\"],[10,\"class\",\"project-page__user-type\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"class\",\"project-page__user-type-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/schoolers.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[6,\"span\"],[10,\"class\",\"project-page__user-type-name\"],[8],[0,\"Collégiens et lycéens\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"li\"],[10,\"class\",\"project-page__user-type\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"class\",\"project-page__user-type-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/students.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[6,\"span\"],[10,\"class\",\"project-page__user-type-name\"],[8],[0,\"Étudiants\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"li\"],[10,\"class\",\"project-page__user-type\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"class\",\"project-page__user-type-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/professionals.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[6,\"span\"],[10,\"class\",\"project-page__user-type-name\"],[8],[0,\"Professionnels de tous secteurs\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"li\"],[10,\"class\",\"project-page__user-type\"],[8],[0,\"\\n        \"],[6,\"img\"],[10,\"class\",\"project-page__user-type-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/citizens.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n        \"],[6,\"span\"],[10,\"class\",\"project-page__user-type-name\"],[8],[0,\"Citoyens\"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"project-page__populations-description\"],[8],[0,\"Son objectif est d’accompagner l’élévation du niveau général de connaissances et de compétences numériques et ainsi de préparer la transformation digitale de l’ensemble de notre société et de notre économie.\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"rounded-panel project-page__panel project-page__value project-page__value--measure\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-header\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"class\",\"project-page__value-header-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/measure.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"project-page__value-header-name\"],[8],[0,\"Mesurer ses compétences numériques\"],[9],[0,\"\\n      \"],[6,\"hr\"],[10,\"class\",\"project-page__value-header-line\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-body\"],[8],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"PIX permettra d’obtenir un profil de compétences associé à un score global sur 1024 pix. En conformité avec le cadre de référence européen DIGCOMP, PIX évaluera les compétences numériques sur 8 niveaux et 5 grands domaines :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Informations et données\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Communication et collaboration\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Création de contenu\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Protection et sécurité\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Environnement numérique\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les épreuves évalueront les connaissances mais également les savoir-faire et la capacité à identifier les enjeux du numérique.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Des modalités innovantes d’évaluation seront proposées, dépassant le cadre habituel des QCM et privilégiant la mesure in vivo de compétences à partir d’activités réalisées dans leur environnement numérique réel : interactions, manipulations de fichiers, résolutions de problèmes, productions créatives, évaluations par les pairs, etc.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"rounded-panel project-page__panel project-page__value project-page__value--develop\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-header\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"class\",\"project-page__value-header-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/develop.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"project-page__value-header-name\"],[8],[0,\"Développer ses compétences numériques\"],[9],[0,\"\\n      \"],[6,\"hr\"],[10,\"class\",\"project-page__value-header-line\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-body\"],[8],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les apports de PIX au développement des compétences de chacun sont triples :\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"1. PIX permettra d’apprendre en se testant. Une part importante des épreuves PIX sont conçues sous la forme de défis à relever au cours desquels on développe ses compétences.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"2. En s’appuyant sur les résultats des épreuves, PIX offrira également des recommandations ciblées de formation.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"3. Le service proposera enfin un accès dédié aux équipes pédagogiques (collège, lycée, enseignement supérieur) et aux responsables de formation continue. Ils pourront suivre l’évolution des compétences des publics qu’ils encadrent, et concevoir des stratégies de formation sur mesure.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Pour témoigner des progrès de manière continue et stimulante, les utilisateurs disposeront d’un compte personnel sécurisé qui leur permettra de faire valoir leurs nouveaux acquis à leur rythme et tout au long de la vie.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"rounded-panel project-page__panel project-page__value project-page__value--valorize\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-header\"],[8],[0,\"\\n      \"],[6,\"img\"],[10,\"class\",\"project-page__value-header-image\"],[11,\"src\",[27,[[20,\"rootURL\"],\"images/project/valorize.png\"]]],[10,\"alt\",\"\"],[8],[9],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"project-page__value-header-name\"],[8],[0,\"Valoriser ses compétences numériques\"],[9],[0,\"\\n      \"],[6,\"hr\"],[10,\"class\",\"project-page__value-header-line\"],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__value-body\"],[8],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"PIX proposera, de manière optionnelle, un mode « certifiant », permettant d’obtenir une certification\\n        officielle fiable et reconnue par l’éducation nationale, l’enseignement supérieur et le monde professionnel.\"],[9],[0,\"\\n\\n      \"],[6,\"p\"],[8],[0,\"Ce test complémentaire nécessitera, dans un premier temps, une passation en présentiel dans les centres\\n        agréés par PIX : collèges, lycées, établissements d’enseignement supérieur, structures partenaires.\"],[9],[0,\"\\n\\n      \"],[6,\"p\"],[8],[0,\"Des solutions de passation du mode certifiant à distance seront étudiées par la suite, à destination des\\n        professionnels.\"],[9],[0,\"\\n\\n      \"],[6,\"p\"],[8],[0,\"PIX se substituera au Brevet informatique et internet (B2i) et à la Certification informatique et internet\\n        (C2i) progressivement à partir de la rentrée 2017–2018.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[6,\"section\"],[10,\"class\",\"project-page__presentation\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"project-page__panel project-page__presentation-container\"],[8],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"project-page__presentation-header\"],[8],[0,\"\\n        \"],[6,\"h2\"],[10,\"class\",\"project-page__presentation-header-name\"],[8],[0,\"PIX, un service en ligne co-construit et évolutif\"],[9],[0,\"\\n        \"],[6,\"hr\"],[10,\"class\",\"project-page__presentation-header-line\"],[8],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"project-page__presentation-body\"],[8],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"PIX respectera l’exigence de neutralité du service public et sera compatible avec l’ensemble des environnements numériques : diversité des systèmes d’exploitation et des services en ligne, logiciels propriétaires comme logiciels libres, etc.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"PIX est développé selon la méthodologie agile des « Startups d’État » dans le cadre d’un partenariat entre tous les acteurs du ministère de l’Éducation nationale, de l’Enseignement supérieur et la Recherche, le Conseil national éducation-économie et le secrétariat général à la modernisation de l’action publique.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Le projet fait l’objet d’une démarche inédite de co-construction avec des acteurs du monde professionnel.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Des panels de tests sont organisés en établissement scolaire, dans l’enseignement supérieur ou en entreprise toutes les deux semaines pour mettre à l’épreuve les nouvelles fonctionnalités au fur et à mesure de leur développement et pour calibrer les épreuves.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"PIX fait appel à la multitude des utilisateurs. Toutes les personnes, établissements et entreprises qui le souhaitent ont la possibilité de rejoindre la communauté des bêta-testeurs à distance. Le référentiel de compétences et les épreuves sont pensés pour évoluer dans le temps à l’aune des retours des utilisateurs.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Le code source de la plateforme PIX est libre.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/project.hbs" } });
});
define("pix-live/templates/reset-password", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "nhZBCDYv", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"reset-password\"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"reset-password__link-to-home\"],[8],[0,\"\\n    \"],[6,\"a\"],[10,\"href\",\"/\"],[10,\"class\",\"signin-form__home-link\"],[8],[0,\"Annuler\\n      \"],[6,\"img\"],[10,\"class\",\"signin-form__home-link_close\"],[10,\"alt\",\"\"],[10,\"src\",\"/images/icons/icon-close.svg\"],[8],[9],[9],[0,\"\\n  \"],[9],[0,\"\\n\\n  \"],[1,[26,\"reset-password-form\",null,[[\"user\"],[[22,[\"model\"]]]]],false],[0,\"\\n\"],[9]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/reset-password.hbs" } });
});
define("pix-live/templates/terms-of-service", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "1P//T3Cr", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"terms-of-service-page\"],[8],[0,\"\\n  \"],[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n  \"],[6,\"div\"],[10,\"class\",\"rounded-panel terms-of-service-page__content\"],[8],[0,\"\\n\\n    \"],[6,\"h1\"],[10,\"class\",\"terms-of-service-page__title\"],[8],[0,\"Conditions générales d'utilisation du site Pix\"],[9],[0,\"\\n    \"],[6,\"p\"],[10,\"class\",\"terms-of-service-page__subtitle\"],[8],[0,\"Toute utilisation du Site est soumise au préalable à la prise de connaissance et à l’acceptation des présentes Conditions Générales d’Utilisation.\"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--legal-notice\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"1. Notice légale\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Site est édité par Groupement d’intérêt public « Pix »\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"SIRET : 130 023 435 00014\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Adresse : 110 rue de Grenelle 75007 PARIS\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Téléphone : 01 43 40 00 18\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"Email :  contact@pix.beta.gouv.fr\"],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"p\"],[8],[6,\"b\"],[8],[0,\"Directeur de publication :\"],[9],[0,\" M. Benjamin MARTEAU, Directeur du GIP Pix\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[6,\"b\"],[8],[0,\"Objet\"],[9],[9],[0,\"\\n      \"],[6,\"p\"],[8],[6,\"b\"],[8],[0,\"Pix\"],[9],[0,\" \"],[6,\"a\"],[10,\"href\",\"https://pix.beta.gouv.fr\"],[8],[0,\"https://pix.beta.gouv.fr\"],[9],[0,\" est un site visant à permettre l’évaluation et la certification des compétences numériques, et à faciliter l’accès à la formation sur ces compétences.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les conditions générales d’utilisation ont pour objet de définir les droits et obligations de tout Utilisateur du Site et de l’Éditeur.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--definitions\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"2. Définitions\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les termes ci-après définis ont le sens et la portée donnés dans leur définition dans le cadre de la conclusion et l’exécution des présentes Conditions Générales d’Utilisation.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Conditions Générales d’Utilisation » ou « CGU\"],[9],[0,\" » : les présentes Conditions Générales d’Utilisation, destinées à encadrer au plan contractuel l’utilisation du Site par tout Utilisateur.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Contenus informationnels\"],[9],[0,\" » : l’ensemble des textes, photographies, illustrations, à l’exception des contenus de test.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Contenus de test » ou « épreuves\"],[9],[0,\" » : les épreuves (énoncés, consignes, illustrations, documents à télécharger, etc.).\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Éditeur\"],[9],[0,\" » : désigne \"],[6,\"b\"],[8],[0,\"Groupement d’intérêt public « Pix »\"],[9],[0,\" qui édite le Site.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Hébergeur\"],[9],[0,\" » : désigne l’entreprise qui héberge les données pour le Service indiqué dans les \"],[4,\"link-to\",[\"legal-notices\"],null,{\"statements\":[[0,\"mentions légales\"]],\"parameters\":[]},null],[0,\".\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Site\"],[9],[0,\" » : le site internet Pix accessible à partir du lien \"],[6,\"a\"],[10,\"href\",\"https://pix.beta.gouv.fr\"],[8],[0,\"https://pix.beta.gouv.fr.\"],[9],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Service\"],[9],[0,\" » : le service Pix incluant le Service standard et le Service prescripteur.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Service standard\"],[9],[0,\" » : le service standard est celui qui permet à l’utilisateur de bénéficier directement de la fonction première du Site, c’est-à-dire évaluer et préparer la certification de ses propres compétences numériques et disposer d’un accès facilité à la formation permettant de les développer.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Service prescripteur\"],[9],[0,\" » : le service prescripteur est celui qui permet à un acteur d’opérer le suivi pédagogique de cohortes d’utilisateurs du Service standard.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Visiteur\"],[9],[0,\" » : tout usager du Site non doté d’un compte ou non connecté à son compte.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Utilisateur\"],[9],[0,\" » : tout usager du Site doté d’un compte et utilisant tout ou partie du Service.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Utilisateur standard\"],[9],[0,\" » : tout usager du Site doté d’un Compte standard.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Compte standard\"],[9],[0,\" » : compte utilisateur donnant accès au Service standard.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Utilisateur prescripteur\"],[9],[0,\" » : tout usager du Site doté d’un Compte prescripteur.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"« \"],[6,\"span\"],[10,\"class\",\"terms-of-service__definition\"],[8],[0,\"Compte prescripteur\"],[9],[0,\" » : compte utilisateur donnant accès au Service prescripteur.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--site-access\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"3. Accès au site\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le présent article a vocation à décrire les modalités et conditions d’accès au Site et au Service.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Site est mis gratuitement à disposition de tout Visiteur et tout Utilisateur standard à partir de l’adresse \"],[6,\"a\"],[10,\"href\",\"https://pix.beta.gouv.fr\"],[8],[6,\"b\"],[8],[0,\"https://pix.beta.gouv.fr\"],[9],[9],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Visiteur peut naviguer sur le Site pour la consultation des contenus informationnels d’ordre général sans nécessité de disposer d’un compte.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Visiteur peut créer gratuitement un Compte standard et s’y connecter pour accéder au Service standard. Seule une personne physique peut créer un Compte standard, et elle doit en faire un usage personnel.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Pour accéder au Service prescripteur, le Visiteur doit obligatoirement s’adresser à l'Éditeur pour obtenir un Compte prescripteur dans le cadre d’une convention établie à cette occasion, après quoi il aura accès au Service prescripteur. L’Editeur se réserve le droit discrétionnaire de ne pas donner suite aux demandes de création de Compte prescripteur. Même si l’accès au Service prescripteur fait l’objet d’une convention avec une organisation ou entité, tout Compte prescripteur est associé à au moins une personne physique.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L'accès au Site et son utilisation par tout Utilisateur ou Visiteur sont soumis aux présentes CGU, aux lois en vigueur concernant l'utilisation d'Internet, et plus généralement au respect de toutes les lois applicables.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"La navigation au sein du Site emporte acceptation inconditionnelle des présentes CGU.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’accès d’un Utilisateur au Service pourra être révoqué s’il contrevient à l’une de ces dispositions.\"],[9],[0,\"\\n\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--headings-and-warnings\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"4. Rubriques et mises en garde associées\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le présent article a vocation à décrire et à émettre des mises en garde concernant les différents espaces du Site, les rubriques et les fonctionnalités associées, le cas échéant.\"],[9],[0,\"\\n\\n      \"],[6,\"h4\"],[10,\"class\",\"terms-of-service-section__subtitle\"],[8],[0,\"Mises en garde générales relatives au Site :\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les Utilisateurs ne peuvent utiliser le Site à d’autres fins que pour sa destination définie en objet des présentes CGU.\"],[9],[0,\"\\n\\n      \"],[6,\"h4\"],[10,\"class\",\"terms-of-service-section__subtitle\"],[8],[0,\"Mises en garde générales relatives aux contenus informationnels du Site :\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les Contenus informationnels du Site permettent de s’informer sur le projet Pix et sur le Service.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les informations formalisées et organisées dans le cadre des différentes rubriques du Site ont une vocation synthétique et ne sont en aucun cas présentées à titre exhaustif.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Malgré le soin apporté au traitement des informations, l’Editeur décline toute responsabilité concernant les erreurs, omissions ou défauts d’actualisation portant sur les informations diffusées sur ce Site. L’Editeur ne peut être tenu responsable de l'interprétation ou de l’utilisation des Contenus informationnels diffusés par l’intermédiaire du Site, ni des conséquences.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Utilisateur est seul responsable de l’utilisation des informations proposées via le Site, de toute décision prise et de toute action mise en œuvre à partir des informations contenues au sein du Site.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’utilisation des supports d’information accessibles dans le cadre du site se fait dans le respect des modalités d’utilisation du site, de ses contenus et de ses fonctionnalités.\"],[9],[0,\"\\n\\n      \"],[6,\"h4\"],[10,\"class\",\"terms-of-service-section__subtitle\"],[8],[0,\"Mises en garde relatives aux contenus de test du Site :\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les Contenus de test du Site sont soumis à un processus d'amélioration continue. L’Editeur utilise les statistiques issues du passage des tests par les Utilisateurs pour contribuer à ce processus.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur se réserve le droit de mettre à jour les Contenus de tests sans publicité ni préavis. L’Editeur ne pourra pas être tenu pour responsable des dommages éventuels faisant suite à ces modifications.\"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"4.1. Accueil\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Dans cet espace, le Visiteur a accès à un ensemble d’informations sur le projet et le Service.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"4.2. Ressources\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L’Utilisateur standard a accès à des contenus de tests, vidéos, publications (actualités, informations, ...), liens vers des formations en ligne et tout autre contenu relatif aux compétences numériques.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L’Utilisateur standard peut utiliser ces ressources à titre personnel pour appuyer sa démarche de développement de compétences numériques.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"4.3. Abonnement à des lettres d’informations\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L’Utilisateur peut bénéficier de lettres d’informations d’actualités, sur les différentes thématiques abordées dans le cadre du Site.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Les lettres d’informations sont accessibles sur inscription, laquelle nécessite de renseigner des données personnelles, dans le respect des dispositions de l’article relatif à la protection des données personnelles.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--obligations-and-responsabilities\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"5. Obligations générales et responsabilités  des Utilisateurs ou Visisiteurs\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"De manière générale, tout Utilisateur ou Visiteur s’engage à faire du Site un usage conforme à sa destination et à respecter de manière inconditionnelle l'ensemble de la législation applicable, et notamment :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"le droit de la propriété intellectuelle et de la propriété industrielle ayant notamment prises sur les créations multimédias, les textes, les images de toute nature auxquels il a accès dans le cadre du Site ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"la loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés modifiée, dite loi Informatique et Libertés ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"le dispositif légal de protection contre la fraude informatique.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"En conséquence, l’Utilisateur ou Visiteur s’abstient de toute action ou tentative susceptible de porter atteinte à l’intégrité du Site, à sa disponibilité, ainsi plus généralement qu’aux droits de l’Editeur et à ce titre s’interdit :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"de transmettre des virus, un cheval de Troie, des bombes logiques ou tout autre programme nuisible ou destructeur ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"d’entraver le Site par quelque moyen que ce soit ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"de reproduire et/ou utiliser la marque, la dénomination sociale, le logo ou tout signe distinctif et de manière générale toute donnée de quelque nature qu’elle soit, rédactionnel, graphique ou autre appartenant à l’Editeur, un de ses partenaires ou un tiers, sauf autorisation expresse de l’Editeur ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"de procéder ou même de tenter une intrusion au sein du Site ou du système d’information d’administration du Site, ou de modifier, totalement ou partiellement les éléments qui y sont contenus.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Utilisateur est, en tout état de cause, exclusivement responsable de l’utilisation qu’il fait du Site et de ses Contenus, et, de manière générale, de toute décision prise sur la base de ces Contenus.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--hypertext-links\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"6. Liens hypertexte\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"6.1. A partir du Site\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L’Editeur n’est en aucun cas responsable du contenu des sites vers lesquels des liens sont faits.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Leur présence ne signifie en aucune manière que l’Editeur adhère ou valide leur contenu ou accepte une responsabilité quelconque pour le contenu ou l'utilisation de ces sites tiers.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Les liens sont proposés à titre strictement indicatif par l’Editeur, et utilisés par les Utilisateurs sous leur responsabilité exclusive, sans aucune démarche de certification des sites concernés de la part de l’Editeur.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Chaque Utilisateur accède aux sites tiers sous sa seule et entière responsabilité, y compris lorsque des liens ont été proposés à partir du Site.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"6.2. Vers le Site\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Toute mise en œuvre d’un lien vers une page du Site correspondant à un Contenu de test requiert l’autorisation expresse et préalable de l’Editeur qui peut être sollicité à l’adresse électronique suivante : contact@pix.beta.gouv.fr.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--intellectual-property\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"7. Propriété intellectuelle\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"La marque, l’ensemble des Contenus de test et les bases de données sont la propriété exclusive de l’Editeur et sont protégés par le Code français de la propriété intellectuelle et plus généralement par les traités et accords internationaux comportant des dispositions relatives à la protection des droits d'auteur, des producteurs de bases de données et des droits de propriété intellectuelle.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’ensemble des Contenus informationnels du Site peuvent être utilisés par les Visiteurs et Utilisateurs pour leur information et usage personnels, et à des fins de promotion du Site et du Service. Les contenus informationnels relatifs à la description des compétences (notamment le référentiel) sont soumis à la licence Creative Commons CC BY (l’auteur à citer est pix.beta.gouv.fr).\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Toute autre forme d'utilisation des contenus en fraude des droits de l’Editeur constituerait une contrefaçon sanctionnée notamment par les articles L.335-2 et suivants du Code de la propriété intellectuelle français susceptible d’exposer les auteurs de ces agissements à des poursuites judiciaires civiles et pénales.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur se réserve le droit de prendre toutes les mesures qu'il juge adéquates afin d'empêcher ou de mettre un terme à l'atteinte à ses droits d'auteurs ou aux droits d'auteurs de tiers, sans qu'aucune responsabilité ne puisse lui être imputée en raison de ces mesures.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--data-protection\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"8. Protection des données\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Des données à caractère personnel concernant l’Utilisateur (en ce compris des données relatives à l’état civil et éventuellement portant sur la vie personnelle, à l’exclusion de toute donnée de santé au sens de l’article 8 de la loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés modifiée, dite loi Informatique et Libertés et de l’article L.1111-8 du Code de la santé publique) sont collectées et traitées :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"dans le cadre de la création d’un Compte standard ou prescripteur ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"dans le cadre de l’utilisation du Service ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"dans le cadre de l’inscription à une lettre d’information.\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"dans le cadre de l’émission de commentaires (retours d’usage ou feedback utilisateur) ;\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"À ce titre, \"],[6,\"b\"],[8],[0,\"l’Editeur\"],[9],[0,\" revêt la qualité de responsable de traitement au sens de la Loi Informatique et Libertés et a procédé à une formalité de désignation d’un Correspondant Informatique et Libertés auprès de la Commission Nationale de l’Informatique et des Libertés.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les informations concernant les Utilisateurs sont destinées exclusivement :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"à leur propre usage conformément à l’objet du Site ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"à l’amélioration des performances du Site et du Service ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"à leur donner accès, de façon optionnelle et à leur discrétion, à des fonctionnalités de partage en direction de tiers ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"à des fins de statistiques anonymes.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Lorsqu’un Utilisateur standard décide du partage de données personnelles depuis son Compte standard vers un Compte prescripteur, le transfert est opéré par l’Editeur dans le cadre suivant :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"le tiers titulaire du Compte prescripteur s’engage à respecter la charte dressée dans la convention établie en amont lors de la création du Compte prescripteur ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"cette charte est  accessible à l’Utilisateur standard qui peut la consulter avant de déclencher l’opération de partage.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les données personnelles sont stockées sur les bases de données de l’Editeur chez l’Hébergeur. L’Editeur s’engage à ce que les données personnelles soient stockées en France.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"La durée de conservation des données personnelles est établie de façon différenciée selon la finalité de leur collecte, et selon les principes suivants :\"],[9],[0,\"\\n      \"],[6,\"ul\"],[8],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"les données personnelles nécessaires à la création d’un compte sont conservées pour la durée d’utilisation du Service ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"les données personnelles résultant de l’évaluation des compétences numériques de l’Utilisateur standard sont conservées pour la durée d’utilisation du Service ;\"],[9],[0,\"\\n        \"],[6,\"li\"],[8],[0,\"les données personnelles résultant de la certification des compétences numériques de l’Utilisateur standard sont conservées pour une durée cohérente avec la valeur probante du document qui les recèle.\"],[9],[0,\"\\n      \"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Conformément à la loi Informatique et Libertés, l’Utilisateur dispose d'un droit d'accès, d’opposition,  de rectification et de suppression des données à caractère personnel le concernant.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Pour exercer ces droits, l’Utilisateur doit contacter le Correspondant Informatique et Libertés habilité à répondre aux demandes d’exercice des droits des Utilisateurs, via l’adresse électronique suivante : cil.pix@beta.gouv.fr.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"La demande doit préciser les noms, prénom, et adresse électronique de l’Utilisateur et être accompagnée d’une copie de la pièce d’identité de l’Utilisateur, conformément à la réglementation en vigueur.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur met en œuvre toutes les mesures de sécurité afin de garantir la protection et la sécurité des données des Utilisateurs.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Utilisateur dispose également du droit de définir des directives générales relatives à la conservation, à l'effacement et à la communication de ses données à caractère personnel après son décès qui peuvent être enregistrées auprès d'un tiers de confiance numérique certifié par la CNIL, et de directives particulières, concernant les traitements de données à caractère personnel mentionnées par ces directives, qui peuvent être enregistrées auprès de l’Editeur à l’adresse susmentionnée et qui font l’objet de son consentement spécifique à ce titre.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--cookies\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"9. Cookies\"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"terms-of-service-section__subsection\"],[8],[0,\"\\n        \"],[6,\"h3\"],[10,\"class\",\"terms-of-service-section__subsection-title\"],[8],[0,\"9.1. Cookies utilisés\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Un cookie est un petit fichier alphanumérique qui est déposé dans le terminal de l’ordinateur, smartphone, tablette, mobile, etc, de l’Utilisateur, lors de sa connexion au Site.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Le Site n’utilise pas les Cookies pour son fonctionnement à l’exception d’un suivi statistique des visites.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"L’Utilisateur ou Visiteur peut à tout moment désactiver l’usage des cookies dans son navigateur sans altérer le fonctionnement du Site.\"],[9],[0,\"\\n        \"],[6,\"p\"],[8],[0,\"Les informations collectées sont à l’usage exclusif de l’Editeur, et ne sont en aucun cas cédées à des tiers.\"],[9],[0,\"\\n\\n      \"],[9],[0,\"\\n\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--limitations-of-liability\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"10. Limitations de responsabilité\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Autant que possible, l’Editeur intègre au sein du Site des Contenus précis et fiables mais ne fournit aucune garantie quant à leur exhaustivité et leur mise à jour. Ces contenus sont fournis à titre indicatif.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Site ne saurait être tenu responsable des dommages directs ou indirects, qui pourraient résulter de l’accès au Site ou de l’utilisation et/ou de l’interprétation de ses Contenus, et de ses fonctionnalités, quelle qu’en soit la nature.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"En outre, l’Editeur décline toute responsabilité en cas de dommages subis par l’Utilisateur à raison notamment de la perte, de la détérioration ou de l’altération de fichiers ou tout autre bien à l’occasion de la connexion et/ou de la consultation et/ou de l’utilisation du Site, de ses fonctionnalités et de ses Contenus.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"S’agissant de l’accès aux supports d’information, compte tenu des aléas techniques inhérents à l’Internet, l’Editeur ne fournit aucune garantie d’accès et de continuité au Site.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"En cas d’interruption de l’accès au Site, quelle qu’en soit la cause (opération de maintenance en cours, incident sur le réseau Internet ou autre), l’Editeur s’engage à mettre en œuvre les actions nécessaires au rétablissement de l’accès au Site, dans les meilleurs délais et à la bonne information des utilisateurs ou visiteurs.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur fera ses meilleurs efforts pour rendre le Site accessible 24 heures sur 24 et 7 jours sur 7, mais ne saurait en aucun cas engager sa responsabilité à ce titre.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--security\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"11. Sécurité\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"D’une manière générale, la sécurité du Site impose aux Utilisateurs d'avertir l’Editeur à l’adresse \"],[6,\"a\"],[10,\"href\",\"mailto:contact@pix.beta.gouv.fr\"],[8],[0,\"contact@pix.beta.gouv.fr\"],[9],[0,\" de tout dysfonctionnement technique constaté et de toute anomalie découverte, telle que les intrusions.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur ne pourra pas être tenu pour responsable des dommages résultant des défauts de communication entre les serveurs loués chez l’Hébergeur et le dispositif utilisé pour accéder au Site.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur ne pourra pas être tenu pour responsable des dommages résultant des défauts des dispositifs logiciels et matériels utilisés pour accéder au Site.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur ne pourra être tenu pour responsable des dommages résultant de bug(s), voire de tout programme ou d'application qui serait incompatible avec l'infrastructure utilisée par l'Utilisateur, ni des dommages subis par l'Utilisateur par le fait d'une panne, interruption ou erreur, évolution, remise en état, contrôle, maintenance, problème technique, coupure du réseau internet ou des réseaux ou services liés, surcharge, négligence ou faute de tiers ou de l'Utilisateur, ainsi qu'en cas d'évènements indépendants de la volonté de l’Editeur.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Chaque Utilisateur est responsable de la mise en œuvre au sein de son ordinateur ou de son équipement mobile une solution et des mesures de sécurité de nature à prévenir la propagation de virus.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--modifications\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"12. Modifications\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur se réserve le droit de modifier à tout moment les présentes CGU ou les règles concernant l’utilisation du Site ainsi que le Site et ses Contenus. Chaque nouvelle version des présentes CGU sera mise en ligne au sein du Site. L’Editeur s’engage à assurer la bonne information des Utilisateurs sur ces modifications. Le fait de continuer à utiliser le Site après toute modification des CGU entraîne l’acceptation des modifications des CGU.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur se réserve en outre le droit de faire évoluer le Site et ses Contenus. Des modifications techniques pourront intervenir sans préavis de la part de l’Editeur. L’Editeur s’engage à rendre publique chacune des modifications et améliorations techniques apportées.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"L’Editeur se réserve le droit de suspendre provisoirement ou définitivement l’accès au Site, sans délai, ni contrepartie de quelque nature que ce soit.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[6,\"section\"],[10,\"class\",\"terms-of-service-section terms-of-service-section--french-law\"],[8],[0,\"\\n      \"],[6,\"h2\"],[10,\"class\",\"terms-of-service-section__title\"],[8],[0,\"13. Loi française\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Le Site et les Contenus sont destinés à l’Utilisation de résidents français et sont créés conformément aux règles applicables en France.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Les présentes CGU sont régies par la loi française. Les résidents étrangers acceptent expressément l’application de la loi française en visitant le Site et en utilisant tout ou partie des fonctionnalités du Site et sont informés que les autres pays peuvent avoir des réglementations différentes de la réglementation française.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"En conséquence, les Utilisateurs reconnaissent que toute information y figurant est susceptible de ne pas être complète ou compatible ou appropriée en dehors de la France.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Tout litige relatif au Site ou en relation avec son utilisation sera soumis, à défaut de règlement amiable, aux tribunaux français.\"],[9],[0,\"\\n      \"],[6,\"p\"],[8],[0,\"Si une ou plusieurs stipulations des CGU sont tenues pour non valides ou déclarées telle en application d'une loi, d'un règlement ou à la suite d'une décision définitive d'une juridiction compétente, les autres stipulations gardent toute leur force et leur portée.\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n\\n  \"],[9],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/terms-of-service.hbs" } });
});
define("pix-live/templates/user-certifications", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "IS2S+uk5", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"navbar-header\",null,[[\"class\"],[\"navbar-header--white\"]]],false],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"user-certifications-page__container\"],[8],[0,\"\\n  \"],[1,[20,\"outlet\"],false],[0,\"\\n\"],[9],[0,\"\\n\\n\"],[1,[20,\"app-footer\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/user-certifications.hbs" } });
});
define("pix-live/templates/user-certifications/get", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZEj1ajik", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"user-certifications-page-get__top-bar\"],[8],[0,\"\\n\"],[4,\"link-to\",[\"user-certifications\"],[[\"class\"],[\"user-certifications-page-get_link-to\"]],{\"statements\":[[0,\"    ‹‹ Retour à la liste\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\\n\"],[1,[26,\"user-certifications-detail-header\",null,[[\"certification\"],[[22,[\"model\"]]]]],false],[0,\"\\n\\n\"],[6,\"div\"],[10,\"class\",\"user-certifications-page__detail-content\"],[8],[0,\"\\n\\n  \"],[1,[26,\"user-certifications-detail-result\",null,[[\"certification\"],[[22,[\"model\"]]]]],false],[0,\"\\n\\n  \"],[1,[26,\"user-certifications-detail-profile\",null,[[\"resultCompetenceTree\"],[[22,[\"model\",\"resultCompetenceTree\"]]]]],false],[0,\"\\n\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/user-certifications/get.hbs" } });
});
define("pix-live/templates/user-certifications/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/d7L+iC8", "block": "{\"symbols\":[],\"statements\":[[6,\"h1\"],[10,\"class\",\"user-certifications-page__title\"],[8],[0,\"Mes Certifications\"],[9],[0,\"\\n\\n\"],[1,[26,\"user-certifications-panel\",null,[[\"certifications\"],[[22,[\"model\"]]]]],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "pix-live/templates/user-certifications/index.hbs" } });
});
define('pix-live/tests/mirage/mirage.lint-test', [], function () {
  'use strict';

  describe('ESLint | mirage', function () {

    it('mirage/config.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-qcm-answer.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-qcu-answer.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-qroc-answer.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-qrocm-answer.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-timed-answer-bis.js', function () {
      // test passed
    });

    it('mirage/data/answers/ref-timed-answer.js', function () {
      // test passed
    });

    it('mirage/data/assessments/ref-assessment-timed-challenges.js', function () {
      // test passed
    });

    it('mirage/data/assessments/ref-assessment.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-qcm-challenge.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-qcu-challenge.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-qroc-challenge.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-qrocm-challenge.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-timed-challenge-bis.js', function () {
      // test passed
    });

    it('mirage/data/challenges/ref-timed-challenge.js', function () {
      // test passed
    });

    it('mirage/data/courses/highlighted-course.js', function () {
      // test passed
    });

    it('mirage/data/courses/ref-course-timed-challenges.js', function () {
      // test passed
    });

    it('mirage/data/courses/ref-course.js', function () {
      // test passed
    });

    it('mirage/data/feedbacks/ref-feedback.js', function () {
      // test passed
    });

    it('mirage/factories/area.js', function () {
      // test passed
    });

    it('mirage/factories/certification.js', function () {
      // test passed
    });

    it('mirage/factories/challenge.js', function () {
      // test passed
    });

    it('mirage/factories/competence.js', function () {
      // test passed
    });

    it('mirage/factories/correction.js', function () {
      // test passed
    });

    it('mirage/factories/course.js', function () {
      // test passed
    });

    it('mirage/factories/organization.js', function () {
      // test passed
    });

    it('mirage/factories/skill-review.js', function () {
      // test passed
    });

    it('mirage/factories/snapshot.js', function () {
      // test passed
    });

    it('mirage/factories/user.js', function () {
      // test passed
    });

    it('mirage/fixtures/answers.js', function () {
      // test passed
    });

    it('mirage/fixtures/areas.js', function () {
      // test passed
    });

    it('mirage/fixtures/assessments.js', function () {
      // test passed
    });

    it('mirage/fixtures/challenges.js', function () {
      // test passed
    });

    it('mirage/fixtures/competences.js', function () {
      // test passed
    });

    it('mirage/fixtures/corrections.js', function () {
      // test passed
    });

    it('mirage/fixtures/courses.js', function () {
      // test passed
    });

    it('mirage/fixtures/feedbacks.js', function () {
      // test passed
    });

    it('mirage/routes/get-answer-by-challenge-and-assessment.js', function () {
      // test passed
    });

    it('mirage/routes/get-answer.js', function () {
      // test passed
    });

    it('mirage/routes/get-assessment.js', function () {
      // test passed
    });

    it('mirage/routes/get-challenge.js', function () {
      // test passed
    });

    it('mirage/routes/get-challenges.js', function () {
      // test passed
    });

    it('mirage/routes/get-corrections.js', function () {
      // test passed
    });

    it('mirage/routes/get-course.js', function () {
      // test passed
    });

    it('mirage/routes/get-courses-of-the-week.js', function () {
      // test passed
    });

    it('mirage/routes/get-courses.js', function () {
      // test passed
    });

    it('mirage/routes/get-next-challenge.js', function () {
      // test passed
    });

    it('mirage/routes/get-organizations.js', function () {
      // test passed
    });

    it('mirage/routes/get-snapshots.js', function () {
      // test passed
    });

    it('mirage/routes/get-user-me.js', function () {
      // test passed
    });

    it('mirage/routes/patch-answer.js', function () {
      // test passed
    });

    it('mirage/routes/post-answers.js', function () {
      // test passed
    });

    it('mirage/routes/post-assessments.js', function () {
      // test passed
    });

    it('mirage/routes/post-authentications.js', function () {
      // test passed
    });

    it('mirage/routes/post-certification-course.js', function () {
      // test passed
    });

    it('mirage/routes/post-courses.js', function () {
      // test passed
    });

    it('mirage/routes/post-feedbacks.js', function () {
      // test passed
    });

    it('mirage/scenarios/default.js', function () {
      // test passed
    });

    it('mirage/serializers/application.js', function () {
      // test passed
    });

    it('mirage/serializers/competence.js', function () {
      // test passed
    });

    it('mirage/serializers/user.js', function () {
      // test passed
    });
  });
});
define('pix-live/transforms/array', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Transform.extend({
    deserialize: function deserialize(serialized) {
      return serialized;
    },
    serialize: function serialize(deserialized) {
      return deserialized;
    }
  });
});
define('pix-live/utils/answers-as-object', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = answersAsObject;
  function answersAsObject(answer, inputKeys) {
    if (answer === '#ABAND#') {
      return inputKeys.reduce(function (answersObject, key) {
        answersObject[key] = '';
        return answersObject;
      }, {});
    }
    return jsyaml.safeLoad(answer);
  }
});
define('pix-live/utils/call-only-once', ['exports', 'pix-live/config/environment', 'pix-live/utils/lodash-custom'], function (exports, _environment, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = callOnlyOnce;
  function callOnlyOnce(targetFunction) {
    if (_environment.default.APP.useDelay) {
      return _lodashCustom.default.throttle(targetFunction, 1000, { leading: true, trailing: false });
    } else {
      return targetFunction;
    }
  }
});
define('pix-live/utils/can-use-dom', ['exports', 'ember-metrics/utils/can-use-dom'], function (exports, _canUseDom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _canUseDom.default;
    }
  });
});
define("pix-live/utils/email-validator", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isEmailValid;
  function isEmailValid(email) {
    if (!email) {
      return false;
    }
    // From http://stackoverflow.com/a/46181/5430854
    // eslint-disable-next-line no-useless-escape
    var pattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return pattern.test(email.trim());
  }
});
define('pix-live/utils/get-challenge-type', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getChallengeType;
  function getChallengeType(challengeTypeFromAirtable) {
    var result = 'qcu'; // qcu by default, no error thrown
    var challengeType = challengeTypeFromAirtable.toUpperCase();

    if ((0, _lodashCustom.default)(challengeType).isAmongst(['QCUIMG', 'QCU'])) {
      result = 'qcu';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QCMIMG', 'QCM'])) {
      result = 'qcm';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QROC'])) {
      result = 'qroc';
    } else if ((0, _lodashCustom.default)(challengeType).isAmongst(['QROCM', 'QROCM-IND', 'QROCM-DEP'])) {
      result = 'qrocm';
    }

    return result;
  }
});
define('pix-live/utils/get-cmd-key', ['exports', 'ember-keyboard/utils/get-cmd-key'], function (exports, _getCmdKey) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _getCmdKey.default;
    }
  });
});
define('pix-live/utils/labeled-checkboxes', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = labeledCheckboxes;


  /*
   * Example :
   * => Input :
   *     proposals :  ['is sky red ?' , 'is sun red ?' , 'is grass red ?' , 'is cloud red ?']
   * => Input :
   *     userAnswers :  [false, true]
   *
   * WARNING : only first(s) userAnswers are given,
   *           all others have implicitly the boolean value "false"
   *
   * => Output :
   *    [['is sky red ?', false],
   *     ['is sun red ?', true],
   *     ['is grass red ?', false],
   *     ['are clouds red ?' false]]
   */
  function labeledCheckboxes(proposals, userAnswers) {

    // accept that user didn't give any answer yet
    var definedUserAnswers = _lodashCustom.default.isNil(userAnswers) ? [] : userAnswers;

    // check pre-conditions
    if ((0, _lodashCustom.default)(proposals).isNotArrayOfString()) return [];
    if ((0, _lodashCustom.default)(proposals).isEmpty()) return [];
    if ((0, _lodashCustom.default)(definedUserAnswers).isNotArrayOfBoolean()) return [];
    if ((0, _lodashCustom.default)(definedUserAnswers).size() > (0, _lodashCustom.default)(proposals).size()) return [];

    var sizeDifference = (0, _lodashCustom.default)(proposals).size() - (0, _lodashCustom.default)(definedUserAnswers).size(); // 2
    var arrayOfFalse = _lodashCustom.default.times(sizeDifference, _lodashCustom.default.constant(false)); // [false, false]

    return _lodashCustom.default.chain(definedUserAnswers) // [false, true]
    .concat(arrayOfFalse) // [false, true, false, false]
    .zip(proposals) // [[false, 'prop 1'], [true, 'prop 2'], [false, 'prop 3'], [false, 'prop 4']]
    .map(_lodashCustom.default.reverse) // [['prop 1', false], ['prop 2', true], ['prop 3', false], ['prop 4', false]]
    .value();
  }
});
define('pix-live/utils/labels-as-object', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = labelsAsObject;
  function deletePlaceholderInLabel(keyInput) {
    if (keyInput.indexOf('#') != -1) {
      keyInput = keyInput.substring(0, keyInput.indexOf('#'));
    }
    return keyInput;
  }

  function labelsAsObject(labels) {
    var proposalsWithoutLineBreak = labels.replace(/\n/g, '');
    var proposalsSplitted = proposalsWithoutLineBreak.split(/\$\{|}/).slice(0, -1);
    var labelsAsObject = {};
    proposalsSplitted.forEach(function (element, index) {
      if (index % 2 != 0) {
        element = deletePlaceholderInLabel(element);
        labelsAsObject[element] = proposalsSplitted[index - 1];
      }
    });
    return labelsAsObject;
  }
});
define('pix-live/utils/listener-name', ['exports', 'ember-keyboard/utils/listener-name'], function (exports, _listenerName) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _listenerName.default;
    }
  });
});
define('pix-live/utils/lodash-custom', ['exports', 'lodash'], function (exports, _lodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  _lodash.default.mixin({

    // Simple alias for includes, last arg fromIndex excluded.
    // Therefore, no test on this function.
    /* istanbul ignore next */
    isAmongst: function isAmongst(element, collection) {
      return _lodash.default.includes(collection, element);
    },
    // See http://stackoverflow.com/a/10834843
    /* istanbul ignore next */
    isStrictlyPositiveInteger: function isStrictlyPositiveInteger(str) {
      return (/^\+?[1-9]\d*$/.test(str)
      );
    },
    // Just an alias, ignore test
    /* istanbul ignore next */
    checkPoint: _lodash.default.thru,
    removeFirstElement: function removeFirstElement(x) {
      return _lodash.default.drop(x, 1);
    },
    isArrayOfString: function isArrayOfString(x) {
      return _lodash.default.isArray(x) && _lodash.default.every(x, _lodash.default.isString);
    },
    isNotString: function isNotString(x) {
      return !_lodash.default.isString(x);
    },
    isNotArrayOfString: function isNotArrayOfString(x) {
      return !_lodash.default.isArrayOfString(x);
    },
    isNotArray: function isNotArray(x) {
      return !_lodash.default.isArray(x);
    },
    isArrayOfBoolean: function isArrayOfBoolean(x) {
      return _lodash.default.isArray(x) && _lodash.default.every(x, _lodash.default.isBoolean);
    },
    isNotArrayOfBoolean: function isNotArrayOfBoolean(x) {
      return !_lodash.default.isArrayOfBoolean(x);
    },
    isTruthy: function isTruthy(x) {
      return x !== false // not the boolean false
      && x !== 0 // not the number 0
      && x !== undefined // not an undefined value
      && x !== null // not a null value
      && x !== '' // not an empty string
      && !_lodash.default.isNaN(x) // not a NaN
      && !(_lodash.default.isArray(x) && _lodash.default.isEmpty(x)) // not an empty array
      && !(_lodash.default.isObject(x) && _lodash.default.isEmpty(x)); // not an empty object
    },
    // Not enough value to test a one line function, mainly an alias here.
    /* istanbul ignore next */
    isFalsy: function isFalsy(x) {
      return !_lodash.default.isTruthy(x);
    },
    isNonEmptyString: function isNonEmptyString(x) {
      return _lodash.default.isString(x) && !_lodash.default.isEmpty(x);
    },
    isNonEmptyArray: function isNonEmptyArray(x) {
      return _lodash.default.isArray(x) && !_lodash.default.isEmpty(x);
    },
    hasSomeTruthyProps: function hasSomeTruthyProps(x) {
      if (!_lodash.default.isObject(x)) return false;
      if (_lodash.default.isEmpty(x)) return false;
      return _lodash.default.some(x, function (value) {
        return _lodash.default.isTruthy(value);
      });
    },

    isNotInteger: function isNotInteger(x) {
      return !_lodash.default.isInteger(x);
    },

    isNumeric: function isNumeric(value) {
      if (typeof value === 'number') return true;
      var str = (value || '').toString();
      if (!str) return false;
      return !isNaN(str);
    },

    // See http://veerasundar.com/blog/2013/01/underscore-js-and-guid-function/
    guid: function guid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    }

  }, { chain: false });

  exports.default = _lodash.default;
});
define('pix-live/utils/object-transforms', ['exports', 'ember-metrics/utils/object-transforms'], function (exports, _objectTransforms) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _objectTransforms.default;
    }
  });
});
define('pix-live/utils/password-validator', ['exports', 'xregexp'], function (exports, _xregexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isPasswordValid;
  function isPasswordValid(password) {
    if (!password) {
      return false;
    }
    var pattern = (0, _xregexp.default)('^(?=.*\\p{L})(?=.*\\d).{8,}$');
    return pattern.test(password);
  }
});
define('pix-live/utils/proposals-as-array', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = proposalsAsArray;


  function calculate(proposals) {
    return _lodashCustom.default.chain(proposals).thru(function (e) {
      return '\n' + e;
    }).split(/\n\s*-\s*/).removeFirstElement().value();
  }

  function proposalsAsArray(proposals) {
    // check pre-conditions
    var DEFAULT_RETURN_VALUE = [];

    if ((0, _lodashCustom.default)(proposals).isNotString()) return DEFAULT_RETURN_VALUE;
    if ((0, _lodashCustom.default)(proposals).isEmpty()) return DEFAULT_RETURN_VALUE;

    return calculate(proposals);
  }
});
define('pix-live/utils/proposals-as-blocks', ['exports', 'lodash'], function (exports, _lodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = proposalsAsBlocks;


  function parseInput(lastIsOpening, input) {
    var block = false;

    switch (input) {
      case '${':
        lastIsOpening = true;
        break;
      case undefined:
        lastIsOpening = false;
        break;
      case '':
        break;
      default:
        if (lastIsOpening) {
          block = { input: input };
        } else {
          block = { text: input };
        }
    }

    return { lastIsOpening: lastIsOpening, block: block };
  }

  function stringHasPlaceholder(input) {
    return 1 <= input.indexOf('#');
  }

  function proposalsAsBlocks(proposals) {

    if ((0, _lodash.isEmpty)(proposals)) {
      return [];
    }

    var result = [];

    var lines = proposals.split(/[\r|\n]+/);
    lines.forEach(function (line, index) {
      var parts = line.split(/\s*(\${)|}\s*/);
      for (var j = 0; j < parts.length; j += 1) {
        var _parseInput = parseInput(lastIsOpening || false, parts[j]),
            lastIsOpening = _parseInput.lastIsOpening,
            block = _parseInput.block;

        if (!block) {
          continue;
        }
        if (block.input && stringHasPlaceholder(block.input)) {

          var inputParts = block.input.split('#');
          var variable = inputParts[0];
          var placeholder = inputParts[1];

          block.input = variable;
          block.placeholder = placeholder;
        }
        result.push(block);
      }
      if (index !== lines.length - 1) {
        result.push({ breakline: true });
      }
    });
    return result;
  }
});
define('pix-live/utils/result-details-as-object', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = resultDetailsAsObject;
  function resultDetailsAsObject(yamlResultDetails) {
    var resultDetailsAsObject = {};
    if (yamlResultDetails !== 'null\n') {
      resultDetailsAsObject = jsyaml.safeLoad(yamlResultDetails);
    }
    return resultDetailsAsObject;
  }
});
define("pix-live/utils/result-icon-url", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = resultIconUrl;
  function resultIconUrl(resultStatus) {
    if (!resultStatus) {
      return null;
    }
    return "/images/answer-validation/icon-" + resultStatus + ".svg";
  }
});
define('pix-live/utils/solution-as-object', ['exports', 'lodash'], function (exports, _lodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = solutionAsObject;


  function transformSolutionsToString(solutionsAsObject) {
    _lodash.default.each(solutionsAsObject, function (potentialSolution) {
      potentialSolution.forEach(function (value, index) {
        potentialSolution[index] = potentialSolution[index].toString();
      });
    });
    return solutionsAsObject;
  }

  function solutionAsObject(yamlSolution) {
    var solutionsAsObject = jsyaml.safeLoad(yamlSolution);
    solutionsAsObject = transformSolutionsToString(solutionsAsObject);
    return solutionsAsObject;
  }
});
define('pix-live/utils/value-as-array-of-boolean', ['exports', 'pix-live/utils/lodash-custom'], function (exports, _lodashCustom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = valueAsArrayOfBoolean;
  function valueAsArrayOfBoolean(value) {
    return _lodashCustom.default.chain(value) // in the worst case : ',4, 2 , 2,1,  ,'
    .checkPoint(function (e) {
      return _lodashCustom.default.isString(e) ? e : '';
    }) // check if string
    .split(',') // now ['', '4', ' 2 ', ' 2', '1', '  ', '']
    .map(_lodashCustom.default.trim) // now ['', '4', '2', '2', '1', '', '']
    .reject(_lodashCustom.default.isEmpty) // now ['4', '2', '2', '1']
    .checkPoint(function (e) {
      return _lodashCustom.default.every(e, _lodashCustom.default.isStrictlyPositiveInteger) ? e : [];
    }) // check if int >= 1
    .map(_lodashCustom.default.parseInt) // now [4, 2, 2, 1]
    .sortBy() // now [1, 2, 2, 4]
    .uniqBy() // now [1, 2, 4]
    .map(function (e) {
      return e - 1;
    }) // now [0, 1, 3]
    .thru(function (e) {
      return _lodashCustom.default.times(_lodashCustom.default.max(e) + 1, function (o) {
        return (0, _lodashCustom.default)(e).includes(o);
      });
    }).value();
  }
});


define('pix-live/config/environment', [], function() {
  var prefix = 'pix-live';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

if (!runningTests) {
  require("pix-live/app")["default"].create({"API_HOST":"","isChallengeTimerEnable":true,"MESSAGE_DISPLAY_DURATION":1500,"isMobileSimulationEnabled":false,"isTimerCountdownEnabled":true,"isMessageStatusTogglingEnabled":true,"LOAD_EXTERNAL_SCRIPT":true,"GOOGLE_RECAPTCHA_KEY":"6LdPdiIUAAAAADhuSc8524XPDWVynfmcmHjaoSRO","SCROLL_DURATION":800,"useDelay":true,"NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT":5,"name":"pix-live","version":"1.56.0+5663a08a"});
}
//# sourceMappingURL=pix-live.map
