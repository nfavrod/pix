const PROJECT_ROOT = '../../../..';
const TESTS_ROOT = `${PROJECT_ROOT}/tests`;

const { expect } = require(`${TESTS_ROOT}/test-helper`);
const { EventEmitter } = require('events');
const Metrics = require(`${PROJECT_ROOT}/lib/infrastructure/plugins/metrics`);

describe('Unit | Plugins | Metrics', () => {

  let serverStub;

  const defaultRoute = { path: '/api/other/{id}' };
  const defaultInfo = { responded: 2, received: 1 };

  class ResponseStub {
    constructor(response, info, route) {
      this.response = response;
      this.info = info;
      this.route = route;
    }
  }

  beforeEach(() => {
    Metrics.reset();

    serverStub = { events: new EventEmitter() };
    Metrics.register(serverStub, null, () => {});
  });

  it('should be exposed as a Hapi Plugin', () => {
    expect(Metrics.name).to.equal('metrics-plugin');
  });

  it('should set the default labels to current instance', () => {
    expect(Metrics.prometheusClient.metrics()).to.contains('instance=');
  });

  describe('#register', () => {
    it('should be a function', () => {
      expect(Metrics.register).to.be.an.instanceOf(Function);
    });
  });

  function _extractNumericValueFromSingleMetric(allMetrics, metricName) {
    const metricLine = allMetrics
      .split('\n')
      .find((line) => line.startsWith(metricName));

    if (metricLine === undefined) {
      throw new Error(`Expected metric ${metricName} to be found in:\n${allMetrics}`);
    }

    const matches = /(\d+)\s*$/.exec(metricLine);

    if (matches === undefined) {
      throw new Error(`Expected to find numeric value in ${metricLine}`);
    }

    return matches[1];
  }

  function _extractCountFromSpecificPath(allMetrics, metric, path) {
    const metricLine = allMetrics
      .split('\n')
      .find((line) => line.match(new RegExp(`${metric}.*path="${path}"`)));

    if (!metricLine) {
      return '0';
    }

    const matches = /(\d+)\s*$/.exec(metricLine);

    if (matches === undefined) {
      throw new Error(`Expected to find numeric value in ${metricLine}`);
    }

    return matches[1];
  }

  describe('the metric api_request_total', () => {

    it('should start at 0', () => {
      // given
      const prometheusMetrics = Metrics.prometheusClient.metrics();

      // when
      const result = _extractNumericValueFromSingleMetric(prometheusMetrics, 'api_request_total');

      // then
      expect(result).to.equals('0');
    });

    it('should increment on response event', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 200 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const result = _extractNumericValueFromSingleMetric(prometheusMetrics, 'api_request_total');
      expect(result).to.equals('1');
    });
  });

  describe('the metric api_request_success', () => {

    it('should increment on successful response event', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 200 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_success', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('1');
    });

    it('should not increment on error response event', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 500 }, defaultInfo, defaultRoute));
      serverStub.events.emit('response', new ResponseStub({ statusCode: 400 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_success', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('0');
    });
  });

  describe('the metric api_request_server_error', () => {

    it('should NOT increment on successful response event or 400s', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 200 }, defaultInfo, defaultRoute));
      serverStub.events.emit('response', new ResponseStub({ statusCode: 400 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_server_error', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('0');
    });

    it('should increment on error response event', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 500 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_server_error', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('1');
    });
  });

  describe('the metric api_request_client_error', () => {

    it('should increment on response with statusCode 400', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 400 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_client_error', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('1');
    });

    it('should NOT increment on response event with statusCode 200 or 500', () => {
      // when
      serverStub.events.emit('response', new ResponseStub({ statusCode: 500 }, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const expectedCountFromSpecificPath = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_client_error', defaultRoute.path);
      expect(expectedCountFromSpecificPath).to.equal('0');
    });
  });

  describe('the metric api_request_duration', () => {

    it('should start at 0', () => {
      // given
      const prometheusMetrics = Metrics.prometheusClient.metrics();

      // when
      const result = _extractNumericValueFromSingleMetric(prometheusMetrics, 'api_request_duration');

      // then
      expect(result).to.equals('0');
    });

    it('should count request duration metric', () => {

      // when
      serverStub.events.emit('response', new ResponseStub({}, defaultInfo, defaultRoute));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();
      const result = _extractNumericValueFromSingleMetric(prometheusMetrics, 'api_request_duration_count');
      expect(result).to.equals('1');
    });

    it('should register request duration per endpoint', () => {
      // when
      const tenSecondsToAnswer = { received: 1, responded: 11 };
      const oneSecondToAnswer = { received: 1, responded: 2 };
      const threeSecondToAnswer = { received: 1, responded: 4 };

      serverStub.events.emit('response', new ResponseStub({}, tenSecondsToAnswer, { path: '/api/other/{id}' }));
      serverStub.events.emit('response', new ResponseStub({}, oneSecondToAnswer, { path: '/api/toto/{id}' }));
      serverStub.events.emit('response', new ResponseStub({}, threeSecondToAnswer, { path: '/api/toto/{id}' }));

      // then
      const prometheusMetrics = Metrics.prometheusClient.metrics();

      const expectedCountForEndpointToto = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_duration_count', '/api/toto/{id}');
      expect(expectedCountForEndpointToto).to.equal('2');

      const expectedCountForEndpointOther = _extractCountFromSpecificPath(prometheusMetrics, 'api_request_duration_count', '/api/other/{id}');
      expect(expectedCountForEndpointOther).to.equal('1');
    });
  });
});
