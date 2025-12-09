import { useState, useEffect } from 'react'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

export default function StatusPage({ userId, onNewRegistration, apiBase }) {
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${apiBase}/users/${userId}/status`)
      setStatus(response.data)
      
      // If result is released, fetch the result HTML
      if (response.data.status === 'RESULT_RELEASED') {
        try {
          const resultResponse = await axios.get(`${apiBase}/users/${userId}/result`)
          setResult(resultResponse.data)
        } catch (err) {
          console.error('Error fetching result:', err)
        }
      }
    } catch (err) {
      setError('Failed to fetch status')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchStatus()
      // Poll for status updates every 30 seconds
      const interval = setInterval(fetchStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [userId])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      await axios.post(`${apiBase}/users/${userId}/check`)
      // Refresh status after check
      setTimeout(fetchStatus, 2000)
    } catch (err) {
      setError('Failed to check result')
    } finally {
      setChecking(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!result || !result.result_html) {
      alert('Result not available for download')
      return
    }

    const element = document.createElement('div')
    element.innerHTML = result.result_html
    element.style.padding = '20px'
    element.style.fontFamily = 'Arial, sans-serif'

    const opt = {
      margin: 1,
      filename: `result_${result.rollno}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

  const getStatusDisplay = () => {
    if (!status) return null

    switch (status.status) {
      case 'IN_PROGRESS':
        return {
          text: 'Checking',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-400',
          icon: '⏳'
        }
      case 'RESULT_RELEASED':
        return {
          text: 'Released',
          color: 'bg-green-100 text-green-800 border-green-400',
          icon: '✅'
        }
      default:
        return {
          text: 'Not Released',
          color: 'bg-gray-100 text-gray-800 border-gray-400',
          icon: '⏸️'
        }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading status...</p>
      </div>
    )
  }

  if (error && !status) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchStatus}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Result Status
            </h2>
            {status && (
              <p className="text-gray-600">Roll Number: {status.rollno}</p>
            )}
          </div>
          <button
            onClick={onNewRegistration}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Register New
          </button>
        </div>

        {status && (
          <>
            <div className="mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${statusDisplay.color}`}>
                <span className="text-2xl mr-2">{statusDisplay.icon}</span>
                <span className="font-semibold">Status: {statusDisplay.text}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Registered On</p>
                <p className="font-semibold text-gray-800">
                  {new Date(status.created_at).toLocaleString()}
                </p>
              </div>
              {status.result_released_at && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Result Released On</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(status.result_released_at).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-gray-800">
                  {new Date(status.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleManualCheck}
                disabled={checking || status.status === 'RESULT_RELEASED'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checking ? 'Checking...' : 'Check Now'}
              </button>

              {status.status === 'RESULT_RELEASED' && result && (
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  📥 Download Result PDF
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {result && result.result_html && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Result</h3>
          <div 
            className="result-container border border-gray-200 rounded-lg p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: result.result_html }}
          />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> The system automatically checks for results every 5 minutes. 
          You can also manually check using the "Check Now" button above.
        </p>
      </div>
    </div>
  )
}

