import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

export default function LayerDetail() {
  const { layerId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedResults = localStorage.getItem('assessmentResults')
    if (savedResults) {
      setResults(JSON.parse(savedResults))
    }
    setLoading(false)
  }, [layerId])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading layer details...</p>
        </div>
      </div>
    )
  }

  if (!results || !results.layerScores[layerId]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Layer not found</p>
          <button onClick={() => navigate('/results')} className="btn-primary">
            Back to Results
          </button>
        </div>
      </div>
    )
  }

  const layerData = results.layerScores[layerId]

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/results')}
          className="btn-secondary flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </button>

        {/* Layer Header */}
        <div className={`card mb-8 border-l-4 ${getScoreBgColor(layerData.score)}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{layerData.name}</h1>
            <div className={getScoreColor(layerData.score)}>
              {getScoreIcon(layerData.score)}
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(layerData.score)}>{layerData.score}</span>
            <span className="text-2xl text-gray-400">/100</span>
          </div>
          <p className="text-gray-600">
            {layerData.score >= 80
              ? 'Strong security posture in this layer'
              : layerData.score >= 50
              ? 'Moderate security posture - room for improvement'
              : 'Critical security gaps require immediate attention'}
          </p>
        </div>

        {/* Questions Detail */}
        <div className="space-y-6">
          {layerData.questions.map((question, index) => (
            <div key={question.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex-1">
                  <span className="text-gray-400 mr-2">Q{index + 1}.</span>
                  {question.text}
                </h3>
                {question.answer && (
                  <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                    question.answer.points >= 80
                      ? 'bg-success-100 text-success-700'
                      : question.answer.points >= 50
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-danger-100 text-danger-700'
                  }`}>
                    {question.answer.points} pts
                  </div>
                )}
              </div>

              {question.answer ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                  <p className="text-gray-800 font-medium">{question.answer.optionText}</p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500 italic">No answer provided</p>
                </div>
              )}

              {/* Risk Explanation */}
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Risk Explanation
                </h4>
                <p className="text-red-900 text-sm">{question.riskExplanation}</p>
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Recommendation
                </h4>
                <p className="text-blue-900 text-sm">{question.recommendation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Layer Summary */}
        <div className="card mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Layer Summary</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Questions Answered</p>
              <p className="text-2xl font-bold text-gray-800">
                {layerData.questions.filter(q => q.answer).length}/{layerData.questions.length}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Points</p>
              <p className="text-2xl font-bold text-gray-800">
                {layerData.questions.filter(q => q.answer).length > 0
                  ? Math.round(
                      layerData.questions
                        .filter(q => q.answer)
                        .reduce((sum, q) => sum + q.answer.points, 0) /
                        layerData.questions.filter(q => q.answer).length
                    )
                  : 0}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/results')}
            className="btn-primary w-full"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
