import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { createUserWithMembership } from '../helpers/test-init';

import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Acceptance | Session List', function(hooks) {

  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('it should not be accessible by an unauthenticated user', async function(assert) {
    // when
    await visit('/sessions/liste');

    // then
    assert.equal(currentURL(), '/connexion');
  });

  test('it should be accessible for an authenticated user', async function(assert) {
    // given
    const user = createUserWithMembership();

    await authenticateSession({
      user_id: user.id,
    });

    // when
    await visit('/sessions/liste');

    // then
    assert.equal(currentURL(), '/sessions/liste');
  });

  test('it should show title indicate than user can create a session', async function(assert) {
    // given
    const user = createUserWithMembership();

    await authenticateSession({
      user_id: user.id,
    });

    // when
    await visit('/sessions/liste');

    // then
    assert.dom('.page-title').hasText('Créez votre première session');
  });

  test('it should list the sessions', async function(assert) {
    // given
    const user = createUserWithMembership();
    server.createList('session', 12);

    await authenticateSession({
      user_id: user.id,
    });

    // when
    await visit('/sessions/liste');

    // then
    assert.dom('.session-item').exists({ count: 12 });
  });

});
