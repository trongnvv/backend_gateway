const httpProxy = require('http-proxy');
const { tracing } = require('../utils/tracer');
const services = require('../config/backendService');

module.exports = {
  name: 'backend',
  policy: (actionParams) => {
    return async (req, res, next) => {
      const params = req.url.split('api/v1/');
      if (!params[1]) {
        tracing(req, 'BACKEND POOL', {
          ms: 'Not found module from url !!!',
          path: req.url,
        });
        return res.status(404).json({
          message: 'Not found module from url !!!',
        });
      }
      const serviceName = req.url.trim().split('/')[3].split('?')[0];
      if (!services[serviceName]) {
        tracing(req, 'BACKEND POOL', {
          serviceName,
          ms: 'Not found module from services list.',
          path: req.url,
        });
        return res.status(404).json({
          message: 'Not found module from services list.',
        });
      }

      const target = `http://${services[serviceName].name}:${services[serviceName].port}`;

      const proxy = httpProxy.createProxyServer({ changeOrigin: true });
      proxy.on('error', (error, req, res) => {
        console.log('error', error);
        // tracing(req, 'PROXY', {
        //   ...error,
        //   serviceTarget: target,
        // });

        if (!res.headersSent) {
          res.status(502).send('Bad gateway.');
        } else {
          res.end();
        }
      });
      // eslint-disable-next-line no-console
      proxy.web(req, res, { target });
    };
  },
};
