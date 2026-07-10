import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import Assessment from './components/Assessment'
import Results from './components/Results'
import LayerDetail from './components/LayerDetail'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/results" element={<Results />} />
          <Route path="/layer/:layerId" element={<LayerDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
