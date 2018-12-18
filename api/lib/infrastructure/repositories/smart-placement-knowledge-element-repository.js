const Bookshelf = require('../bookshelf');
const _ = require('lodash');

const SmartPlacementKnowledgeElement = require('../../domain/models/SmartPlacementKnowledgeElement');
const BookshelfKnowledgeElement = require('../data/knowledge-element');

module.exports = {

  save(smartPlacementKnowledgeElement) {

    return Promise.resolve(_.omit(smartPlacementKnowledgeElement, 'createdAt'))
      .then((smartPlacementKnowledgeElement) => new BookshelfKnowledgeElement(smartPlacementKnowledgeElement))
      .then((knowledgeElementBookshelf) => knowledgeElementBookshelf.save())
      .then(toDomain);
  },

  findByAssessmentId(assessmentId) {
    return BookshelfKnowledgeElement
      .where({ assessmentId })
      .fetchAll()
      .then((knowledgeElements) => knowledgeElements.map(toDomain));
  },

  findByUserId(userId) {
    const subquery = Bookshelf.knex('knowledge-elements as ke2')
      .select('ke2.id')
      .innerJoin('assessments', 'ke2.assessmentId', 'assessments.id')
      .where('assessments.userId', '=', userId)
      .andWhere('assessments.type', '=', 'SMART_PLACEMENT')
      .andWhere('ke2.skillId', '=', 'ke.skillId')
      .orderBy('ke2.createdAt', 'desc')
      .limit(1);

    return Bookshelf.knex('knowledge-elements as ke')
      .innerJoin('assessments', 'ke.assessmentId', 'assessments.id')
      .where('assessments.userId', '=', userId)
      .andWhere('ke.id', '=', subquery)
      .orderBy('ke.skillId')
      .then((knowledgeElements) => knowledgeElements.map(toDomain2));
  }
};

function toDomain(knowledgeElementBookshelf) {
  return new SmartPlacementKnowledgeElement(knowledgeElementBookshelf.toJSON());
}

function toDomain2(knowledgeElementBookshelf) {
  return new SmartPlacementKnowledgeElement(knowledgeElementBookshelf);
}
