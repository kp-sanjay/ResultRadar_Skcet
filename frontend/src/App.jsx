import { useState, useEffect } from 'react'
import RegistrationForm from './components/RegistrationForm'
import StatusPage from './components/StatusPage'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function App() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [view, setView] = useState('register') // 'register' or 'status'

  // Check if there's a stored user ID in localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('resultNotifierUserId')
    if (storedUserId) {
      setCurrentUserId(storedUserId)
      setView('status')
    }
  }, [])

  const handleRegistrationSuccess = (userId) => {
    localStorage.setItem('resultNotifierUserId', userId)
    setCurrentUserId(userId)
    setView('status')
  }

  const handleNewRegistration = () => {
    setView('register')
    setCurrentUserId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎓 Auto Result Notifier
          </h1>
          <p className="text-gray-600">
            Get notified automatically when your exam results are released
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {view === 'register' ? (
            <RegistrationForm 
              onSuccess={handleRegistrationSuccess}
              apiBase={API_BASE}
            />
          ) : (
            <StatusPage 
              userId={currentUserId}
              onNewRegistration={handleNewRegistration}
              apiBase={API_BASE}
            />
          )}
        </div>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Auto Result Notifier © 2024</p>
        </footer>
      </div>
    </div>
  )
}

export default App

