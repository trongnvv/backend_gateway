const { PrometheusMetricsFactory, initTracer } = require('jaeger-client')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');
const promClient = require('prom-client');

const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const init = (serviceName) => {
  const config = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
      collectorEndpoint: JAEGER_ENDPOINT,
    },
  };
  const metrics = new PrometheusMetricsFactory(promClient, serviceName);
  const options = {
    metrics,
    logger: {
      info(msg) {
        console.log('INFO ', msg);
      },
      error(msg) {
        console.log('ERROR', msg);
      },
    },
  };

  return initTracer(config, options);
}

const tracing = (req, spanName, error = null) => {
  const { tracer, headers, url } = req;
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, headers);
  const span = tracer.startSpan(spanName, {
    childOf: parentSpanContext,
  });
  span.setTag(Tags.HTTP_URL, url);
  if (error) {
    span.setTag(Tags.ERROR, true);
    span.log({ error });
  }
  span.finish();
}

module.exports = {
  initTracer: init,
  tracing
};
