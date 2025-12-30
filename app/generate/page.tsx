'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, RefreshCw, Save, ArrowLeft, Sparkles } from 'lucide-react'

const INTERESTS = [
  { id: 'historic', label: 'Historic', emoji: '🏛️' },
  { id: 'architecture', label: 'Architecture', emoji: '🏗️' },
  { id: 'parks', label: 'Parks & Nature', emoji: '🌳' },
  { id: 'food', label: 'Food & Cafes', emoji: '☕' },
  { id: 'art', label: 'Street Art', emoji: '🎨' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'photo', label: 'Photo Spots', emoji: '📸' },
  { id: 'local', label: 'Local Gems', emoji: '💎' },
]

const MOCK_STOPS = [
  { name: 'Brandenburg Gate', type: 'Historic landmark', time: '20 min', emoji: '🏛️' },
  { name: 'Memorial to the Murdered Jews', type: 'Memorial', time: '15 min', emoji: '🕯️' },
  { name: 'Tiergarten Park', type: 'Park & Nature', time: '25 min', emoji: '🌳' },
  { name: 'Victory Column', type: 'Historic viewpoint', time: '15 min', emoji: '🏆' },
  { name: 'Potsdamer Platz', type: 'Modern architecture', time: '20 min', emoji: '🏙️' },
]

export default function GeneratePage() {
  const [duration, setDuration] = useState(90)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['historic', 'architecture'])
  const [vibe, setVibe] = useState('balanced')
  const [pace, setPace] = useState('moderate')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const router = useRouter()

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGenerated(true)
    setLoading(false)
  }

  const handleSave = () => {
    alert('Walk saved! (This would save to your profile)')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Generate a Walk</h1>
              <p className="text-sm text-gray-500">Create your personalized route</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Duration */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Duration</h2>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-blue-600">{duration}</span>
                <span className="text-gray-600 ml-1">minutes</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>15 min</span>
                <span>4 hours</span>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Interests</h2>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg mr-1">{interest.emoji}</span>
                    <span className="text-sm font-medium">{interest.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Vibe</h2>
              <div className="grid grid-cols-3 gap-2">
                {['quiet', 'balanced', 'lively'].map(v => (
                  <button
                    key={v}
                    onClick={() => setVibe(v)}
                    className={`py-3 px-4 rounded-xl capitalize font-medium transition-all ${
                      vibe === v
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Pace</h2>
              <div className="grid grid-cols-3 gap-2">
                {['slow', 'moderate', 'fast'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPace(p)}
                    className={`py-3 px-4 rounded-xl capitalize font-medium transition-all ${
                      pace === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || selectedInterests.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Walk
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {!generated ? (
              <div className="bg-white rounded-xl shadow-sm p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <MapPin className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Route Will Appear Here</h3>
                <p className="text-gray-500 max-w-md">
                  Set your preferences on the left and click "Generate Walk" to create a personalized walking route.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Map Placeholder */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-100 to-green-100 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive map would appear here</p>
                      <p className="text-sm text-gray-500">Powered by MapLibre</p>
                    </div>
                  </div>
                </div>

                {/* Route Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Your Berlin Walking Route</h3>
                      <p className="text-gray-500">A {vibe} walk at {pace} pace</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{duration} min</div>
                      <div className="text-gray-500">~3.2 km</div>
                    </div>
                  </div>

                  {/* Stops */}
                  <div className="space-y-3">
                    {MOCK_STOPS.map((stop, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                          {stop.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{stop.name}</div>
                          <div className="text-sm text-gray-500">{stop.type}</div>
                        </div>
                        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                          {stop.time}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="h-5 w-5" />
                      Save Walk
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
