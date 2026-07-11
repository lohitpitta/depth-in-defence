# Defense in Depth Security Portal
live at : https://depth-in-defence.onrender.com

A security posture self-assessment tool for organizations that evaluates security practices across 8 defense-in-depth layers.

## Features

- **8 Security Layers**: Perimeter Security, Network Security, Endpoint Security, Application Security, Data Security, Identity & Access Management, Physical Security, and Policies & Awareness
- **32 Assessment Questions**: 4 questions per layer with point-based scoring (0-100 points each)
- **Interactive Assessment Wizard**: Step-by-step question flow with progress tracking
- **Results Dashboard**: Overall score, layer-specific scores, and radar chart visualization
- **Detailed Layer Reports**: In-depth analysis with risk explanations and remediation steps
- **PDF Export**: Generate professional PDF reports for sharing and documentation
- **Color-Coded Scoring**: Green (80-100), Yellow (50-79), Red (below 50)
- **Actionable Recommendations**: Specific fixes for low-scoring areas
- **Local Data Storage**: SQLite database for assessment history

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, JSON file storage
- **PDF Generation**: jsPDF

## Prerequisites

- Node.js 16+ and npm

### Individual Services

**Backend only:**
```bash
npm run backend
```

**Frontend only:**
```bash
npm run frontend
```

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend:
```bash
cd ../backend
npm start
```

3. Serve the built frontend using a web server or configure Express to serve static files.

## Usage

1. **Start Assessment**: Enter organization details (name, industry, size) on the landing page
2. **Complete Questions**: Answer 32 questions across 8 security layers
3. **View Results**: See overall score, layer breakdown, and radar chart
4. **Explore Details**: Click on layer cards for detailed analysis
5. **Export Report**: Download PDF summary for documentation

## Customizing Questions

The assessment questions, point values, and recommendations are stored in `backend/questions.json`. To modify the question bank:

1. Open `backend/questions.json`
2. Edit the `layers` array to add/remove layers or modify questions
3. Each question has:
   - `id`: Unique identifier
   - `text`: Question text
   - `options`: Array of answer choices with `text` and `points`
   - `recommendation`: Actionable remediation advice
   - `riskExplanation`: Description of the security risk

## Project Structure

```
defense-in-depth-security-portal/
├── backend/
│   ├── server.js           # Express server with API endpoints
│   ├── questions.json      # Assessment questions configuration
│   ├── package.json
│   └── assessments.db      # SQLite database (created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx       # Landing page with org form
│   │   │   ├── Assessment.jsx    # Assessment wizard
│   │   │   ├── Results.jsx       # Results dashboard
│   │   │   └── LayerDetail.jsx   # Detailed layer report
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

- `GET /api/questions` - Retrieve assessment questions
- `POST /api/assessments` - Save assessment results
- `GET /api/assessments/:id` - Retrieve specific assessment
- `GET /api/assessments` - Retrieve all assessments

## Security Notes

- This is a self-reported assessment tool only
- No real security scanning or network probing
- Results are based on user responses
- Suitable for internal security posture evaluation and awareness

## License

This project is provided as-is for security assessment purposes.
