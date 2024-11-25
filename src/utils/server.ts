import express from 'express';
import routes from '../routes';
import { logRequestDetails } from '../middlewares/loggerMiddleware';
import { extractUserContext } from './extractUserContext';

function createServer() {
  const app = express();

  app.use(express.json());

  app.use(logRequestDetails);

  app.use(extractUserContext);

  routes(app);

  return app;
}

export default createServer;
