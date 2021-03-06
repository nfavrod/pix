const _ = require('lodash');
const CatSkill = require('./skill');

class Challenge {

  constructor(id, status, skills, timer) {
    this.id = id;
    this.status = status;
    this.skills = skills;
    this.timer = timer;
  }

  get isActive() {
    const unactiveChallengeStatus = ['validé', 'validé sans test', 'pré-validé'];
    return unactiveChallengeStatus.includes(this.status);
  }

  get hardestSkill() {
    return this.skills.reduce((s1, s2) => (s1.difficulty > s2.difficulty) ? s1 : s2);
  }

  testsAtLeastOneNewSkill(assessedSkills) {
    return _(this.skills).differenceWith(assessedSkills, CatSkill.areEqual).size() > 0;
  }
}

module.exports = Challenge;
