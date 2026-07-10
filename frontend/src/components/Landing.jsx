import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    orgName: '',
    industry: '',
    companySize: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('assessmentInfo', JSON.stringify(formData))
    navigate('/assessment')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="w-20 h-20 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Defense in Depth Security Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Assess your organization's security posture across 8 critical defense layers
          </p>
        </div>

        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Start Your Assessment</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select your industry</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select company size</option>
                <option value="Small">Small (1-100 employees)</option>
                <option value="Medium">Medium (101-1000 employees)</option>
                <option value="Large">Large (1000+ employees)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full text-lg py-3">
              Start Assessment
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <Lock className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">8 Security Layers</h3>
            <p className="text-sm text-gray-600">
              Comprehensive assessment across perimeter, network, endpoint, and more
            </p>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">Actionable Insights</h3>
            <p className="text-sm text-gray-600">
              Get specific recommendations to improve your security posture
            </p>
          </div>
          <div className="card text-center">
            <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">Risk Prioritization</h3>
            <p className="text-sm text-gray-600">
              Identify and address your most critical security gaps
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
