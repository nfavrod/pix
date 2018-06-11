const _ = require('../../utils/lodash-utils');
const Challenge = require('../../../domain/models/Challenge');
const Skill = require('../../../domain/models/Skill');

class ChallengeSerializer {

  deserialize(airtableRecord) {

    const challenge = Challenge.fromAttributes();

    challenge.id = airtableRecord.id;

    if (airtableRecord.fields) {

      const fields = airtableRecord.fields;
      challenge.instruction = fields['Consigne'];
      challenge.proposals = fields['Propositions'];

      _(fields['acquis']).forEach((acquis) => {
        challenge.addSkill(new Skill({ name: acquis }));
      });

      challenge.status = fields['Statut'];
      challenge.type = fields['Type d\'épreuve'];
      challenge.competence = (fields['competences']) ? fields['competences'][0] : undefined;

      if (fields['Timer']) {
        challenge.timer = _.defaultTo(_.parseInt(fields['Timer']), undefined);
      }

      if (fields['Illustration de la consigne']) {
        challenge.illustrationUrl = fields['Illustration de la consigne'][0].url;
      }

      if (fields['Pièce jointe']) {
        challenge.attachments = fields['Pièce jointe'].map(attachment => attachment.url).reverse();
      }
    }

    return challenge;
  }

}

module.exports = new ChallengeSerializer();