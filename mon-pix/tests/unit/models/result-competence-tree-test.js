import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupModelTest } from 'ember-mocha';

describe('Unit | Model | result competence tree', function() {
  setupModelTest('result-competence-tree', {
    // Specify the other units that are required for this test.
    needs: []
  });

  // Replace this with your real tests.
  it('exists', function() {
    const model = this.subject();
    // var store = this.store();
    expect(model).to.be.ok;
  });
});
