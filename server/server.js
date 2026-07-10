const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dns = require('dns');
const tls = require('tls');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Only use CORS in development (same origin in production)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}
app.use(bodyParser.json());

// Data storage file
const dataFile = path.join(__dirname, 'assessments.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Helper functions
const readAssessments = () => {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading assessments:', error);
    return [];
  }
};

const writeAssessments = (assessments) => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(assessments, null, 2));
  } catch (error) {
    console.error('Error writing assessments:', error);
  }
};

// API Routes

// Save assessment
app.post('/api/assessments', (req, res) => {
  try {
    const { orgName, industry, companySize, overallScore, layerScores, answers } = req.body;
    
    const assessments = readAssessments();
    const newAssessment = {
      id: Date.now(),
      org_name: orgName,
      industry,
      company_size: companySize,
      overall_score: overallScore,
      layer_scores: layerScores,
      answers,
      created_at: new Date().toISOString()
    };
    
    assessments.push(newAssessment);
    writeAssessments(assessments);
    
    res.json({ id: newAssessment.id, success: true });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// Get assessment by ID
app.get('/api/assessments/:id', (req, res) => {
  try {
    const assessments = readAssessments();
    const assessment = assessments.find(a => a.id === parseInt(req.params.id));
    
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Get all assessments
app.get('/api/assessments', (req, res) => {
  try {
    const assessments = readAssessments();
    res.json(assessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Serve questions config
app.get('/api/questions', (req, res) => {
  try {
    const questionsPath = path.join(__dirname, 'questions.json');
    const questionsData = require(questionsPath);
    res.json(questionsData);
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Website Security Scanner
app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Parse and normalize URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith('http')) {
        parsedUrl = new URL('https://' + url);
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const hostname = parsedUrl.hostname;
    const fullUrl = parsedUrl.href;
    const results = {};

    // Helper function with timeout
    const withTimeout = (promise, timeoutMs = 5000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    // 1. HTTPS Enabled
    try {
      await withTimeout(axios.get(fullUrl, { timeout: 5000, validateStatus: () => true }));
      results.https = { pass: true, detail: 'HTTPS is enabled' };
    } catch (error) {
      // Try HTTP as fallback
      try {
        const httpUrl = parsedUrl.protocol === 'https:' ? fullUrl.replace('https:', 'http:') : fullUrl;
        await withTimeout(axios.get(httpUrl, { timeout: 5000, validateStatus: () => true }));
        results.https = { pass: false, detail: 'HTTPS not enabled - site uses HTTP' };
      } catch (httpError) {
        results.https = { pass: false, detail: 'Unable to connect to website' };
      }
    }

    // 2. SSL Certificate Validation
    try {
      const certCheck = await withTimeout(new Promise((resolve, reject) => {
        const socket = tls.connect(443, hostname, () => {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          
          if (!cert || Object.keys(cert).length === 0) {
            resolve({ pass: false, detail: 'No certificate found' });
            return;
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.ceil((validTo - new Date()) / (1000 * 60 * 60 * 24));
          
          if (!authorized) {
            resolve({ 
              pass: false, 
              detail: `Certificate not trusted (self-signed or invalid issuer). Expires in ${daysRemaining} days` 
            });
          } else if (daysRemaining < 0) {
            resolve({ pass: false, detail: 'Certificate has expired' });
          } else if (daysRemaining < 30) {
            resolve({ pass: false, detail: `Certificate expires soon (${daysRemaining} days remaining)` });
          } else {
            resolve({ 
              pass: true, 
              detail: `Certificate valid, issued by ${cert.issuer.O || cert.issuer.CN || 'Unknown'}, expires in ${daysRemaining} days` 
            });
          }
          
          socket.end();
        });

        socket.on('error', (error) => {
          resolve({ pass: false, detail: `SSL connection failed: ${error.message}` });
        });

        socket.setTimeout(5000, () => {
          socket.destroy();
          resolve({ pass: false, detail: 'SSL connection timeout' });
        });
      }), 5000);
      
      results.ssl = certCheck;
    } catch (error) {
      results.ssl = { pass: false, detail: `SSL check failed: ${error.message}` };
    }

    // 3. HTTP Status Code
    try {
      const response = await withTimeout(axios.get(fullUrl, { timeout: 5000, validateStatus: () => true }));
      const statusCode = response.status;
      if (statusCode >= 200 && statusCode < 400) {
        results.statusCode = { pass: true, detail: `HTTP ${statusCode} - OK` };
      } else if (statusCode >= 400 && statusCode < 500) {
        results.statusCode = { pass: false, detail: `HTTP ${statusCode} - Client error` };
      } else if (statusCode >= 500) {
        results.statusCode = { pass: false, detail: `HTTP ${statusCode} - Server error` };
      } else {
        results.statusCode = { pass: false, detail: `HTTP ${statusCode} - Unusual status code` };
      }
    } catch (error) {
      results.statusCode = { pass: false, detail: `Failed to get status code: ${error.message}` };
    }

    // 4. Response Time
    try {
      const start = Date.now();
      await withTimeout(axios.get(fullUrl, { timeout: 5000, validateStatus: () => true }));
      const responseTime = Date.now() - start;
      
      if (responseTime < 500) {
        results.responseTime = { pass: true, detail: `${responseTime}ms - Excellent` };
      } else if (responseTime < 1000) {
        results.responseTime = { pass: true, detail: `${responseTime}ms - Good` };
      } else if (responseTime < 2000) {
        results.responseTime = { pass: false, detail: `${responseTime}ms - Slow` };
      } else {
        results.responseTime = { pass: false, detail: `${responseTime}ms - Very slow` };
      }
    } catch (error) {
      results.responseTime = { pass: false, detail: `Failed to measure response time: ${error.message}` };
    }

    // 5. Security Headers
    try {
      const response = await withTimeout(axios.get(fullUrl, { timeout: 5000, validateStatus: () => true }));
      const headers = response.headers;
      
      const securityHeaders = {
        'Strict-Transport-Security': headers['strict-transport-security'],
        'Content-Security-Policy': headers['content-security-policy'],
        'X-Frame-Options': headers['x-frame-options'],
        'X-Content-Type-Options': headers['x-content-type-options'],
        'Referrer-Policy': headers['referrer-policy'],
        'Permissions-Policy': headers['permissions-policy']
      };

      const missingHeaders = Object.entries(securityHeaders)
        .filter(([_, value]) => !value)
        .map(([name]) => name);

      if (missingHeaders.length === 0) {
        results.securityHeaders = { pass: true, detail: 'All security headers present' };
      } else {
        results.securityHeaders = { 
          pass: false, 
          detail: `Missing security headers: ${missingHeaders.join(', ')}` 
        };
      }
    } catch (error) {
      results.securityHeaders = { pass: false, detail: `Failed to check headers: ${error.message}` };
    }

    // 6. SPF Record
    try {
      const txtRecords = await withTimeout(new Promise((resolve, reject) => {
        dns.resolveTxt(hostname, (error, records) => {
          if (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'NXDOMAIN') {
              resolve([]);
            } else {
              reject(error);
            }
          } else {
            resolve(records);
          }
        });
      }), 5000);

      const spfRecord = txtRecords.flat().find(record => record.startsWith('v=spf1'));
      if (spfRecord) {
        results.spf = { pass: true, detail: `SPF record found: ${spfRecord.substring(0, 50)}...` };
      } else {
        results.spf = { pass: false, detail: 'No SPF record found - emails may be marked as spam' };
      }
    } catch (error) {
      results.spf = { pass: false, detail: `SPF check failed: ${error.message}` };
    }

    // 7. DMARC Record
    try {
      const dmarcDomain = `_dmarc.${hostname}`;
      const txtRecords = await withTimeout(new Promise((resolve, reject) => {
        dns.resolveTxt(dmarcDomain, (error, records) => {
          if (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'NXDOMAIN') {
              resolve([]);
            } else {
              reject(error);
            }
          } else {
            resolve(records);
          }
        });
      }), 5000);

      const dmarcRecord = txtRecords.flat().find(record => record.toLowerCase().startsWith('v=dmarc1'));
      if (dmarcRecord) {
        results.dmarc = { pass: true, detail: `DMARC record found: ${dmarcRecord.substring(0, 50)}...` };
      } else {
        results.dmarc = { pass: false, detail: 'No DMARC record found - email authentication not configured' };
      }
    } catch (error) {
      results.dmarc = { pass: false, detail: 'No DMARC record found - email authentication not configured' };
    }

    // 8. robots.txt Availability
    try {
      const robotsUrl = `${parsedUrl.protocol}//${hostname}/robots.txt`;
      const response = await withTimeout(axios.get(robotsUrl, { timeout: 5000, validateStatus: () => true }));
      if (response.status === 200) {
        results.robotsTxt = { pass: true, detail: 'robots.txt is available' };
      } else {
        results.robotsTxt = { pass: false, detail: `robots.txt returned status ${response.status}` };
      }
    } catch (error) {
      results.robotsTxt = { pass: false, detail: 'robots.txt not found' };
    }

    // 9. sitemap.xml Availability
    try {
      const sitemapUrl = `${parsedUrl.protocol}//${hostname}/sitemap.xml`;
      const response = await withTimeout(axios.get(sitemapUrl, { timeout: 5000, validateStatus: () => true }));
      if (response.status === 200) {
        results.sitemap = { pass: true, detail: 'sitemap.xml is available' };
      } else {
        results.sitemap = { pass: false, detail: `sitemap.xml returned status ${response.status}` };
      }
    } catch (error) {
      results.sitemap = { pass: false, detail: 'sitemap.xml not found' };
    }

    res.json(results);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all: send index.html for any non-API route (required for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
