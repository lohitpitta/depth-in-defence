const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
