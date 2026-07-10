import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react'

export default function Assessment() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState(null)
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load questions:', err)
        setLoading(false)
      })
  }, [])

  const handleAnswer = (questionId, points, optionText) => {
    setAnswers({
      ...answers,
      [questionId]: { points, optionText }
    })
  }

  const handleNext = () => {
    const currentLayer = questions.layers[currentLayerIndex]
    
    if (currentQuestionIndex < currentLayer.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentLayerIndex < questions.layers.length - 1) {
      setCurrentLayerIndex(currentLayerIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      // Assessment complete
      const results = calculateResults()
      localStorage.setItem('assessmentResults', JSON.stringify(results))
      navigate('/results')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentLayerIndex > 0) {
      setCurrentLayerIndex(currentLayerIndex - 1)
      setCurrentQuestionIndex(questions.layers[currentLayerIndex - 1].questions.length - 1)
    }
  }

  const calculateResults = () => {
    const layerScores = {}
    const assessmentInfo = JSON.parse(localStorage.getItem('assessmentInfo'))

    questions.layers.forEach(layer => {
      let totalPoints = 0
      let maxPoints = layer.questions.length * 100
      
      layer.questions.forEach(question => {
        const answer = answers[question.id]
        if (answer) {
          totalPoints += answer.points
        }
      })

      layerScores[layer.id] = {
        name: layer.name,
        score: Math.round((totalPoints / maxPoints) * 100),
        questions: layer.questions.map(q => ({
          ...q,
          answer: answers[q.id] || null
        }))
      }
    })

    const overallScore = Math.round(
      Object.values(layerScores).reduce((sum, layer) => sum + layer.score, 0) / 
      Object.keys(layerScores).length
    )

    return {
      assessmentInfo,
      overallScore,
      layerScores,
      timestamp: new Date().toISOString()
    }
  }

  const getCurrentQuestion = () => {
    if (!questions) return null
    return questions.layers[currentLayerIndex].questions[currentQuestionIndex]
  }

  const getProgress = () => {
    if (!questions) return 0
    let completed = 0
    let total = 0
    
    for (let i = 0; i < currentLayerIndex; i++) {
      completed += questions.layers[i].questions.length
      total += questions.layers[i].questions.length
    }
    
    completed += currentQuestionIndex
    total += questions.layers[currentLayerIndex].questions.length
    
    return Math.round((completed / (questions.layers.length * 4)) * 100)
  }

  const getTotalQuestions = () => {
    if (!questions) return 0
    return questions.layers.length * 4
  }

  const getCurrentQuestionNumber = () => {
    if (!questions) return 0
    let count = 0
    for (let i = 0; i < currentLayerIndex; i++) {
      count += questions.layers[i].questions.length
    }
    return count + currentQuestionIndex + 1
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  const currentLayer = questions.layers[currentLayerIndex]
  const currentQuestion = getCurrentQuestion()
  const currentAnswer = answers[currentQuestion.id]

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
            </span>
            <span className="text-sm font-medium text-primary-600">{getProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Layer Indicator */}
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4 mr-2" />
            {currentLayer.name}
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion.id, option.points, option.text)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  currentAnswer?.optionText === option.text
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    currentAnswer?.optionText === option.text
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {currentAnswer?.optionText === option.text && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentLayerIndex === 0 && currentQuestionIndex === 0}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLayerIndex === questions.layers.length - 1 && 
             currentQuestionIndex === currentLayer.questions.length - 1
              ? 'Complete Assessment'
              : 'Next'
            }
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}
