import express, { Express } from 'express';
import { createDashboardRouter, DashboardApiConfig } from './dashboard-api';

/**
 * Dashboard server configuration
 */
export interface DashboardServerConfig extends DashboardApiConfig {
  port?: number;
  path?: string;
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
}

/**
 * Dashboard server for monitoring notifications
 * Similar to Hangfire dashboard
 */
export class DashboardServer {
  private app: Express;
  private config: DashboardServerConfig;
  private server?: ReturnType<Express['listen']>;

  constructor(config: DashboardServerConfig) {
    this.config = {
      port: 3000,
      path: '/dashboard',
      ...config,
    };
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Basic authentication if enabled
    if (this.config.auth?.enabled) {
      this.app.use((req, res, next) => {
        const auth = req.headers.authorization;

        if (!auth) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
          return res.status(401).json({ error: 'Authentication required' });
        }

        const [scheme, credentials] = auth.split(' ');
        if (scheme !== 'Basic') {
          return res.status(401).json({ error: 'Invalid authentication scheme' });
        }

        const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

        if (username === this.config.auth?.username && password === this.config.auth?.password) {
          next();
        } else {
          res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Dashboard API routes
    const dashboardRouter = createDashboardRouter({
      queueManager: this.config.queueManager,
      storageManager: this.config.storageManager,
    });

    this.app.use(this.config.path!, dashboardRouter);

    // Simple HTML dashboard UI
    this.app.get(this.config.path!, (req, res) => {
      res.send(this.getHtmlDashboard());
    });
  }

  /**
   * Get simple HTML dashboard
   */
  private getHtmlDashboard(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TownKrier Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f5f5f5; }
    .header { background: #2c3e50; color: white; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header h1 { font-size: 24px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-card h3 { color: #7f8c8d; font-size: 14px; margin-bottom: 10px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #2c3e50; }
    .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .section h2 { margin-bottom: 15px; color: #2c3e50; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }
    th { background: #ecf0f1; font-weight: 600; color: #2c3e50; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status-pending { background: #3498db; color: white; }
    .status-processing { background: #f39c12; color: white; }
    .status-completed { background: #27ae60; color: white; }
    .status-failed { background: #e74c3c; color: white; }
    .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #3498db; color: white; }
    .btn-danger { background: #e74c3c; color: white; }
    .refresh-btn { float: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏰 TownKrier Dashboard</h1>
    <p>Notification Monitoring System</p>
  </div>
  
  <div class="container">
    <button class="btn btn-primary refresh-btn" onclick="loadStats()">Refresh</button>
    
    <div class="stats-grid" id="stats">
      <div class="stat-card">
        <h3>Pending Jobs</h3>
        <div class="value" id="stat-pending">-</div>
      </div>
      <div class="stat-card">
        <h3>Processing</h3>
        <div class="value" id="stat-processing">-</div>
      </div>
      <div class="stat-card">
        <h3>Completed</h3>
        <div class="value" id="stat-completed">-</div>
      </div>
      <div class="stat-card">
        <h3>Failed</h3>
        <div class="value" id="stat-failed">-</div>
      </div>
    </div>

    <div class="section">
      <h2>Recent Jobs</h2>
      <table id="jobs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Channel</th>
            <th>Attempts</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="jobs-body">
          <tr><td colspan="6">Loading...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Recent Logs</h2>
      <table id="logs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Channel</th>
            <th>Recipient</th>
            <th>Status</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody id="logs-body">
          <tr><td colspan="5">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const basePath = '${this.config.path}';
    
    async function loadStats() {
      try {
        const response = await fetch(basePath + '/api/stats');
        const data = await response.json();
        
        document.getElementById('stat-pending').textContent = data.queue.pending;
        document.getElementById('stat-processing').textContent = data.queue.processing;
        document.getElementById('stat-completed').textContent = data.queue.completed;
        document.getElementById('stat-failed').textContent = data.queue.failed;
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }

    async function loadJobs() {
      try {
        const response = await fetch(basePath + '/api/jobs?limit=10');
        const data = await response.json();
        
        const tbody = document.getElementById('jobs-body');
        tbody.innerHTML = data.jobs.map(job => \`
          <tr>
            <td>\${job.id.substring(0, 8)}</td>
            <td><span class="status status-\${job.status}">\${job.status}</span></td>
            <td>\${job.notification.constructor.name || 'N/A'}</td>
            <td>\${job.attempts}/\${job.maxRetries}</td>
            <td>\${new Date(job.createdAt).toLocaleString()}</td>
            <td>
              \${job.status === 'failed' ? \`<button class="btn btn-primary" onclick="retryJob('\${job.id}')">Retry</button>\` : ''}
              <button class="btn btn-danger" onclick="deleteJob('\${job.id}')">Delete</button>
            </td>
          </tr>
        \`).join('') || '<tr><td colspan="6">No jobs found</td></tr>';
      } catch (error) {
        console.error('Failed to load jobs:', error);
        document.getElementById('jobs-body').innerHTML = '<tr><td colspan="6">Error loading jobs</td></tr>';
      }
    }

    async function loadLogs() {
      try {
        const response = await fetch(basePath + '/api/logs?limit=10');
        const data = await response.json();
        
        const tbody = document.getElementById('logs-body');
        tbody.innerHTML = data.logs.map(log => \`
          <tr>
            <td>\${log.id.substring(0, 8)}</td>
            <td>\${log.channel}</td>
            <td>\${log.recipient}</td>
            <td><span class="status status-\${log.status}">\${log.status}</span></td>
            <td>\${log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}</td>
          </tr>
        \`).join('') || '<tr><td colspan="5">No logs found</td></tr>';
      } catch (error) {
        console.error('Failed to load logs:', error);
        document.getElementById('logs-body').innerHTML = '<tr><td colspan="5">Error loading logs</td></tr>';
      }
    }

    async function retryJob(jobId) {
      try {
        const response = await fetch(basePath + \`/api/jobs/\${jobId}/retry\`, { method: 'POST' });
        if (response.ok) {
          alert('Job queued for retry');
          loadJobs();
        }
      } catch (error) {
        console.error('Failed to retry job:', error);
        alert('Failed to retry job');
      }
    }

    async function deleteJob(jobId) {
      if (!confirm('Are you sure you want to delete this job?')) return;
      
      try {
        const response = await fetch(basePath + \`/api/jobs/\${jobId}\`, { method: 'DELETE' });
        if (response.ok) {
          alert('Job deleted');
          loadJobs();
        }
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete job');
      }
    }

    // Load data on page load
    loadStats();
    loadJobs();
    loadLogs();

    // Auto-refresh every 5 seconds
    setInterval(() => {
      loadStats();
      loadJobs();
      loadLogs();
    }, 5000);
  </script>
</body>
</html>
    `;
  }

  /**
   * Start the dashboard server
   */
  start(): void {
    this.server = this.app.listen(this.config.port, () => {
      console.log(
        `Dashboard server started on http://localhost:${this.config.port}${this.config.path}`,
      );
    });
  }

  /**
   * Stop the dashboard server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      console.log('Dashboard server stopped');
    }
  }

  /**
   * Get the Express app instance
   */
  getApp(): Express {
    return this.app;
  }
}
