import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, CheckCircle, XCircle, Loader2, ArrowLeft, Shield, Clock, Lock, FileText, Mail } from 'lucide-react'

export default function WebsiteScanner() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setScanning(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || 'Scan failed')
      }
    } catch (err) {
      setError('Failed to connect to scanner service')
    } finally {
      setScanning(false)
    }
  }

  const getCheckIcon = (pass) => {
    return pass ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
  }

  const getCheckColor = (pass) => {
    return pass ? 'text-success-600' : 'text-danger-600'
  }

  const getCheckBgColor = (pass) => {
    return pass ? 'bg-success-50 border-success-500' : 'bg-danger-50 border-danger-500'
  }

  const getCheckIconBg = (pass) => {
    return pass ? 'bg-success-100' : 'bg-danger-100'
  }

  const checkItems = [
    { key: 'https', label: 'HTTPS Enabled', icon: Lock },
    { key: 'ssl', label: 'SSL Certificate', icon: Shield },
    { key: 'statusCode', label: 'HTTP Status Code', icon: Globe },
    { key: 'responseTime', label: 'Response Time', icon: Clock },
    { key: 'securityHeaders', label: 'Security Headers', icon: Shield },
    { key: 'spf', label: 'SPF Record', icon: Mail },
    { key: 'dmarc', label: 'DMARC Record', icon: Mail },
    { key: 'robotsTxt', label: 'robots.txt', icon: FileText },
    { key: 'sitemap', label: 'sitemap.xml', icon: FileText }
  ]

  const calculateScore = () => {
    if (!results) return 0
    const passed = Object.values(results).filter(r => r.pass).length
    return Math.round((passed / Object.keys(results).length) * 100)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex items-center mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center mb-4">
            <Globe className="w-12 h-12 text-primary-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Security Scanner</h1>
              <p className="text-gray-600">Analyze your website's security posture</p>
            </div>
          </div>
        </div>

        {/* Scan Form */}
        <div className="card mb-8">
          <form onSubmit={handleScan}>
            <div className="flex gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., example.com or https://example.com)"
                className="input-field flex-1"
                disabled={scanning}
              />
              <button
                type="submit"
                disabled={scanning}
                className="btn-primary flex items-center px-6"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Scan
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="text-danger-600 mt-2 text-sm">{error}</p>
            )}
          </form>
        </div>

        {/* Loading State */}
        {scanning && (
          <div className="card text-center py-12">
            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Scanning website security...</p>
            <p className="text-gray-500 text-sm mt-2">This may take up to 30 seconds</p>
          </div>
        )}

        {/* Results */}
        {results && !scanning && (
          <>
            {/* Overall Score */}
            <div className="card mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Security Score</h2>
              <div className="text-5xl font-bold mb-2">
                <span className={calculateScore() >= 80 ? 'text-success-600' : calculateScore() >= 50 ? 'text-warning-600' : 'text-danger-600'}>
                  {calculateScore()}
                </span>
                <span className="text-3xl text-gray-400">/100</span>
              </div>
              <p className="text-gray-600">
                {calculateScore() >= 80 ? 'Strong security posture' : calculateScore() >= 50 ? 'Moderate security posture' : 'Critical security issues'}
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
              {checkItems.map((item) => {
                const result = results[item.key]
                if (!result) return null

                const Icon = item.icon

                return (
                  <div
                    key={item.key}
                    className={`card border-l-4 ${getCheckBgColor(result.pass)}`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-full ${getCheckIconBg(result.pass)} mr-4`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{item.label}</h3>
                          <div className={getCheckColor(result.pass)}>
                            {getCheckIcon(result.pass)}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{result.detail}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Scan Again */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setResults(null)
                  setUrl('')
                }}
                className="btn-secondary"
              >
                Scan Another Website
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
