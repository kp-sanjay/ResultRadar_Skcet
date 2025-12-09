import { useState } from 'react'
import axios from 'axios'

export default function RegistrationForm({ onSuccess, apiBase }) {
  const [formData, setFormData] = useState({
    name: '',
    rollno: '',
    dob: '',
    whatsapp: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.name || !formData.rollno || !formData.dob) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (!formData.whatsapp && !formData.email) {
      setError('Please provide either WhatsApp number or Email')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${apiBase}/users`, formData)
      setSuccess(true)
      setTimeout(() => {
        onSuccess(response.data.user.id)
      }, 1500)
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error)
        if (err.response.status === 409 && err.response.data.user) {
          // User already exists, redirect to status page
          setTimeout(() => {
            onSuccess(err.response.data.user.id)
          }, 2000)
        }
      } else {
        setError('Failed to register. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Register for Result Notifications</h2>
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Registration successful! Redirecting...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="rollno" className="block text-sm font-medium text-gray-700 mb-2">
            Roll Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="rollno"
            name="rollno"
            value={formData.rollno}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your roll number"
          />
        </div>

        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="DD-MM-YYYY or DD/MM/YYYY"
          />
          <p className="mt-1 text-sm text-gray-500">Format: DD-MM-YYYY or DD/MM/YYYY</p>
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Number
          </label>
          <input
            type="tel"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1234567890 (with country code)"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Please provide at least one contact method (WhatsApp or Email) to receive notifications.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register for Notifications'}
        </button>
      </form>
    </div>
  )
}

