import EmberObject from '@ember/object';
import Service from '@ember/service';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import sinon from 'sinon';

describe('Unit | Route | Courses | Create Assessment', function() {
  setupTest('route:courses.create-assessment', {
    needs: ['service:session', 'service:current-routed-modal', 'service:metrics']
  });

  let route;
  let queryRecordStub;
  let createRecordStub;
  let queryStub;
  let getAssessmentStub;
  let storeStub;
  let course;
  let assessment;
  let createdAssessment;
  let challenge;

  beforeEach(function() {
    course = EmberObject.create({ id: 1, type: 'PLACEMENT' });
    assessment = EmberObject.create({ id: 123 });
    createdAssessment = EmberObject.create({ id: 1234 });
    challenge = EmberObject.create({ id: 1 });
    createRecordStub = sinon.stub().returns({
      save: sinon.stub().resolves(createdAssessment),
    });
    queryRecordStub = sinon.stub().resolves(challenge);
    getAssessmentStub = sinon.stub().returns(assessment);
    queryStub = sinon.stub().resolves({
      get: getAssessmentStub,
    }),

    storeStub = Service.extend({
      queryRecord: queryRecordStub, query: queryStub, createRecord: createRecordStub });
    this.register('service:store', storeStub);
    this.inject.service('store', { as: 'store' });
    route = this.subject();
    route.replaceWith = sinon.stub();
  });

  describe('#redirect', function() {
    it('should call queryStub with filters', function() {
      // when
      const promise = route.redirect(course);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(queryStub, 'assessment', { filter: { type: course.get('type'), courseId: course.id, state: 'started' } });
      });
    });

    context('when there is started assessment', function() {

      it('should set assessment with the retrieved one', function() {
        // when
        const promise = route.redirect(course);

        // then
        return promise.then(() => {
          sinon.assert.called(getAssessmentStub);
        });
      });

      it('should call queryRecordStub with retrieved assessment id', function() {
        // when
        const promise = route.redirect(course);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(queryRecordStub, 'challenge', { assessmentId: assessment.get('id') });
        });
      });
    });

    context('when there is no started assessment', function() {

      beforeEach(function() {
        queryStub.resolves([]);
      });

      it('should call createRecordStub with filters', function() {
        // when
        const promise = route.redirect(course);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(createRecordStub, 'assessment', { course, type: course.get('type') });
        });
      });

      it('should call queryRecordStub with created assessment id', function() {
        // when
        const promise = route.redirect(course);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(queryRecordStub, 'challenge', { assessmentId: createdAssessment.get('id') });
        });
      });
    });
  });
});
