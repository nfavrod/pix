require('dotenv').config();
const Bookshelf = require('./lib/infrastructure/bookshelf');
const p = (x)=>console.log(require('util').inspect(x, {depth:10, colors:true}));

const raw = Bookshelf.knex.raw;

Bookshelf.knex('snapshots').select('id', 'studentCode', {
    levels: raw(`jsonb_object_agg(competences.competence#>>'{attributes,index}',
                                  competences.competence#>>'{attributes,level}')`)
  })
  .innerJoin(
    raw(`json_array_elements(snapshots.profile->'included') AS competences(competence)
         ON competences.competence->>'type' = 'competences'
         AND competences.competence#>>'{attributes,index}' IS NOT NULL`))
  .groupBy('snapshots.id')
  .limit(5)
  .then((data) => {
    p(data);
    process.exit(0);
  }, ()=>process.exit(1));
