const Snapshot = require('../data/snapshot');
const { knex } = require('../bookshelf');

module.exports = {
  save(snapshotRawData) {
    return new Snapshot(snapshotRawData).save();
  },

  getSnapshotsByOrganizationId(organizationId) {
    return Snapshot
      .where({ organizationId })
      .orderBy('createdAt', 'desc')
      .fetchAll();
  },

  find(options) {
    return Snapshot
      .where({ organizationId: options.organizationId })
      .orderBy('createdAt', 'desc')
      .fetchPage({ page: options.page, pageSize: options.pageSize });
  },

  getDataForSnapshotExport(organizationId) {
    return knex('snapshots').select({
      id: 'snapshots.id',
      studentCode: 'snapshots.studentCode',
      campaignCode: 'snapshots.campaignCode',
      createdAt: 'snapshots.createdAt',
      score: 'snapshots.score',
      userLastName: 'users.lastName',
      userFirstName: 'users.firstName',
      testsFinished: 'snapshots.testsFinished',
      competenceLevels: knex.raw(`jsonb_object_agg(competences.competence#>>'{attributes,index}',
                                                   competences.competence#>>'{attributes,level}')`)
    })
      .innerJoin(
        knex.raw(`json_array_elements(snapshots.profile->'included') AS competences(competence)
                  ON competences.competence->>'type' = 'competences'
                  AND competences.competence#>>'{attributes,index}' IS NOT NULL`))
      .innerJoin('users', 'snapshots.userId', '=', 'users.id')
      .groupBy('snapshots.id', 'users.id')
      .where({ organizationId });
  }

};
