import express from 'express';
import routes from '../routes';
import { logRequestDetails } from '../middlewares/loggerMiddleware';
import { extractUserContext } from './extractUserContext';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import os from 'os';

function createServer() {
  const app = express();

  app.get('/favicon.ico', (_req, res) => res.status(204));

  // Register Prometheus metrics
  const requestCount = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  const requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 3, 5],
  });

  new Gauge({
    name: 'process_cpu_usage_percent',
    help: 'CPU usage of the Node.js process as a percentage',
    collect() {
      const usage = process.cpuUsage();
      const elapsedTime = process.uptime();
      const userTime = usage.user / 1e6; // Convert from microseconds to milliseconds
      const systemTime = usage.system / 1e6;
      const totalCpuTime = (userTime + systemTime) / (elapsedTime * 1000); // Percentage
      this.set(totalCpuTime * 100); // Set gauge value in percentage
    },
  });

  new Gauge({
    name: 'process_memory_usage_bytes',
    help: 'Memory usage of the Node.js process in bytes',
    collect() {
      const memoryData = process.memoryUsage();
      this.set(memoryData.rss); // Resident Set Size (RSS) - memory allocated in the V8 heap and C++ bindings
    },
  });

  new Gauge({
    name: 'system_load_average',
    help: 'System load average (1 minute)',
    collect() {
      const loadAverage = os.loadavg()[0]; // 1-minute load average
      this.set(loadAverage);
    },
  });

  // middleware to track request metrics
  app.use((req, res, next) => {
    const end = requestDuration.startTimer();
    const route = req.originalUrl || req.url;

    res.on('finish', () => {
      requestCount.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
      });
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // metrics endpoint
  app.get('/metrics', async (_req, res) => {
    try {
      const metrics = await register.metrics(); // Wait for the metrics
      res.set('Content-Type', register.contentType);
      res.end(metrics); // Send the resolved string to the response
    } catch {
      res.status(500).send('Error fetching metrics');
    }
  });

  app.use(express.json());

  app.use(logRequestDetails);

  app.use(extractUserContext);

  routes(app);

  return app;
}

export default createServer;
