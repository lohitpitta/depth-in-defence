import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Shield, Download, AlertCircle, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import jsPDF from 'jspdf'

export default function Results() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedResults = localStorage.getItem('assessmentResults')
    if (savedResults) {
      setResults(JSON.parse(savedResults))
      
      // Save to backend
      fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: JSON.parse(savedResults).assessmentInfo.orgName,
          industry: JSON.parse(savedResults).assessmentInfo.industry,
          companySize: JSON.parse(savedResults).assessmentInfo.companySize,
          overallScore: JSON.parse(savedResults).overallScore,
          layerScores: JSON.parse(savedResults).layerScores,
          answers: JSON.parse(savedResults).layerScores
        })
      }).catch(err => console.error('Failed to save assessment:', err))
    }
    setLoading(false)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 50) return 'text-warning-600'
    return 'text-danger-600'
  }

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-success-100 border-success-500'
    if (score >= 50) return 'bg-warning-100 border-warning-500'
    return 'bg-danger-100 border-danger-500'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6" />
    if (score >= 50) return <AlertTriangle className="w-6 h-6" />
    return <AlertCircle className="w-6 h-6" />
  }

  const getRecommendations = () => {
    if (!results) return []
    const recommendations = []
    
    Object.entries(results.layerScores).forEach(([layerId, layerData]) => {
      if (layerData.score < 60) {
        const lowScoreQuestions = layerData.questions.filter(q => q.answer?.points < 50)
        if (lowScoreQuestions.length > 0) {
          recommendations.push({
            layer: layerData.name,
            layerId,
            score: layerData.score,
            recommendation: lowScoreQuestions[0].recommendation
          })
        }
      }
    })
    
    return recommendations.slice(0, 5)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = margin

    // Title
    doc.setFontSize(24)
    doc.setTextColor(0, 102, 204)
    doc.text('Defense in Depth Security Assessment', margin, y)
    y += 15

    // Organization info
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Organization: ${results.assessmentInfo.orgName}`, margin, y)
    y += 8
    doc.text(`Industry: ${results.assessmentInfo.industry}`, margin, y)
    y += 8
    doc.text(`Company Size: ${results.assessmentInfo.companySize}`, margin, y)
    y += 8
    doc.text(`Assessment Date: ${new Date(results.timestamp).toLocaleDateString()}`, margin, y)
    y += 15

    // Overall Score
    doc.setFontSize(16)
    doc.setTextColor(0, 102, 204)
    doc.text(`Overall Security Score: ${results.overallScore}/100`, margin, y)
    y += 15

    // Layer Scores
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Layer Scores', margin, y)
    y += 10

    Object.entries(results.layerScores).forEach(([layerId, layerData]) => {
      const color = layerData.score >= 80 ? [34, 197, 94] : layerData.score >= 50 ? [234, 179, 8] : [239, 68, 68]
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(`${layerData.name}: ${layerData.score}/100`, margin + 5, y)
      y += 8
    })

    y += 10

    // Recommendations
    const recommendations = getRecommendations()
    if (recommendations.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('Top Recommendations', margin, y)
      y += 10

      recommendations.forEach((rec, index) => {
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        const text = `${index + 1}. ${rec.layer} (${rec.score}/100): ${rec.recommendation}`
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
        doc.text(lines, margin, y)
        y += lines.length * 6 + 5
      })
    }

    doc.save(`security-assessment-${results.assessmentInfo.orgName.replace(/\s+/g, '-')}.pdf`)
  }

  const prepareRadarData = () => {
    if (!results) return []
    return Object.entries(results.layerScores).map(([layerId, layerData]) => ({
      layer: layerData.name.substring(0, 15),
      score: layerData.score,
      fullMark: 100
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No assessment results found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Start New Assessment
          </button>
        </div>
      </div>
    )
  }

  const recommendations = getRecommendations()
  const radarData = prepareRadarData()

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button onClick={() => navigate('/')} className="btn-secondary flex items-center mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Security Assessment Results
            </h1>
            <p className="text-gray-600 mt-2">
              {results.assessmentInfo.orgName} • {results.assessmentInfo.industry} • {results.assessmentInfo.companySize}
            </p>
          </div>
          <button onClick={handleExportPDF} className="btn-primary flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export PDF
          </button>
        </div>

        {/* Overall Score */}
        <div className="card mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-primary-600" />
          </div>
          <h2 className="text-5xl font-bold mb-2">
            <span className={getScoreColor(results.overallScore)}>
              {results.overallScore}
            </span>
            <span className="text-3xl text-gray-400">/100</span>
          </h2>
          <p className="text-xl text-gray-600">Overall Security Score</p>
        </div>

        {/* Layer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(results.layerScores).map(([layerId, layerData]) => (
            <div
              key={layerId}
              onClick={() => navigate(`/layer/${layerId}`)}
              className={`card cursor-pointer border-l-4 transition-all hover:shadow-lg ${getScoreBgColor(layerData.score)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">{layerData.name}</h3>
                <div className={getScoreColor(layerData.score)}>
                  {getScoreIcon(layerData.score)}
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                <span className={getScoreColor(layerData.score)}>{layerData.score}</span>
                <span className="text-lg text-gray-400">/100</span>
              </div>
            </div>
          ))}
        </div>

        {/* Radar Chart */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Security Layer Overview</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="layer" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <AlertTriangle className="w-6 h-6 text-warning-500 mr-2" />
              Top Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-warning-50 border-l-4 border-warning-500 rounded-r-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{rec.layer}</h4>
                    <span className="text-sm font-medium text-warning-600">
                      Score: {rec.score}/100
                    </span>
                  </div>
                  <p className="text-gray-700">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length === 0 && (
          <div className="card text-center py-8">
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Excellent Security Posture!
            </h3>
            <p className="text-gray-600">
              All security layers are scoring above 60. Continue monitoring and improving your security practices.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
