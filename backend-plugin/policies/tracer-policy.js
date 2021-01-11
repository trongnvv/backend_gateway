const tracer = require('../utils/tracer').initTracer('backend_gateway');
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');

module.exports = {
  name: 'gateway_tracer',
  policy: () => (req, res, next) => {
    const { url, headers, method } = req;

    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, headers);
    const span = tracer.startSpan(
      `HTTP ${method} /${url.trim().split('/')[3].split('?')[0]}`,
      {
        childOf: parentSpanContext,
      }
    );
    span.setTag(Tags.HTTP_URL, url);
    span.log({ inputs: 'trongnv' });

    // Send span context via request headers (parent id etc.)
    tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
    span.finish();
    req.tracer = tracer;
    next();
  },
};
