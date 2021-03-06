const dataObjects = require('../../../../lib/infrastructure/datasources/airtable/objects/index');

module.exports = function buildAreaAirtableDataObject({
  id = 'recvoGdo7z2z7pXWa',
  code = '1',
  name = '1. Information et données',
  title = 'Information et données',
  competenceIds = [
    'recsvLz0W2ShyfD63',
    'recNv8qhaY887jQb2',
    'recIkYm646lrGvLNT',
  ],
} = {}) {

  return new dataObjects.Area({
    id,
    code,
    name,
    title,
    competenceIds,
  });
};
