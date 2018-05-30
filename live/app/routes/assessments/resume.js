import BaseRoute from 'pix-live/routes/base-route';

export default BaseRoute.extend({

  afterModel(assessment) {
    return this.get('store')
      .queryRecord('challenge', { assessmentId: assessment.get('id') })
      .then((nextChallenge) => this.transitionTo('assessments.challenge', assessment.get('id'), nextChallenge.get('id')))
      .catch(() => this.transitionTo('assessments.rating', assessment.get('id')));
  },

  actions: {
    error() {
      this.transitionTo('index');
    }
  }
});
