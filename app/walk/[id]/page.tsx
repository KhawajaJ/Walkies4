'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, X, ChevronRight, Volume2, VolumeX, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

interface POI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  distance?: number
  image?: string
  summary?: string
}

// Get walk data from sessionStorage (set when starting walk)
const getWalkData = (): { pois: POI[], locationName: string } | null => {
  if (typeof window === 'undefined') return null
  const data = sessionStorage.getItem('activeWalk')
  return data ? JSON.parse(data) : null
}

export default function ActiveWalkPage() {
  const router = useRouter()
  const [walkData, setWalkData] = useState<{ pois: POI[], locationName: string } | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null)
  const [arrived, setArrived] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Load walk data
  useEffect(() => {
    const data = getWalkData()
    if (!data || data.pois.length === 0) {
      router.push('/generate')
      return
    }
    setWalkData(data)
  }, [router])

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }, [])

  // Play arrival sound
  const playArrivalSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.log('Audio not supported')
    }
  }, [soundEnabled])

  // Vibrate on arrival
  const vibrateOnArrival = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
  }, [])

  // Start watching location
  useEffect(() => {
    if (!walkData) return

    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])
        setError('')

        // Calculate distance to current POI
        const currentPoi = walkData.pois[currentIndex]
        if (currentPoi) {
          const dist = calculateDistance(latitude, longitude, currentPoi.lat, currentPoi.lng)
          setDistanceToNext(dist)

          // Check if arrived (within 50 meters)
          if (dist < 50 && !arrived && !completedStops.has(currentIndex)) {
            setArrived(true)
            setShowInfo(true)
            playArrivalSound()
            vibrateOnArrival()
            setCompletedStops(prev => new Set([...prev, currentIndex]))
          }
        }
      },
      (err) => {
        setError('Unable to track location. Please enable GPS.')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    setWatchId(id)

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [walkData, currentIndex, arrived, completedStops, calculateDistance, playArrivalSound, vibrateOnArrival])

  const goToNext = () => {
    if (!walkData) return
    if (currentIndex < walkData.pois.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setArrived(false)
      setShowInfo(false)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setArrived(false)
      setShowInfo(false)
    }
  }

  const endWalk = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
    }
    sessionStorage.removeItem('activeWalk')
    router.push('/dashboard')
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (!walkData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const currentPoi = walkData.pois[currentIndex]
  const progress = ((completedStops.size) / walkData.pois.length) * 100
  const isLastStop = currentIndex === walkData.pois.length - 1
  const route: [number, number][] = walkData.pois.map(p => [p.lng, p.lat])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={endWalk}
          className="p-2 text-gray-400 hover:text-white rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="text-center">
          <div className="text-white font-semibold">{walkData.locationName} Walk</div>
          <div className="text-gray-400 text-sm">
            Stop {currentIndex + 1} of {walkData.pois.length}
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 text-gray-400 hover:text-white rounded-lg"
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-700">
        <div 
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Map */}
      <div className="h-48 relative">
        {userLocation && (
          <Map 
            center={userLocation}
            pois={walkData.pois}
            route={route}
          />
        )}
        {error && (
          <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Current POI Card */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Distance Indicator */}
        <div className="text-center mb-4">
          {distanceToNext !== null && (
            <div className={`text-5xl font-bold ${arrived ? 'text-green-500' : 'text-white'}`}>
              {arrived ? "You've arrived!" : formatDistance(distanceToNext)}
            </div>
          )}
          {!arrived && distanceToNext !== null && (
            <div className="text-gray-400 mt-1">to next stop</div>
          )}
        </div>

        {/* POI Card */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col">
          {/* Image */}
          {currentPoi.image ? (
            <div className="h-40 overflow-hidden">
              <img 
                src={currentPoi.image} 
                alt={currentPoi.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white/50" />
            </div>
          )}

          {/* Info */}
          <div className="p-4 flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-white">{currentPoi.name}</h2>
                <p className="text-gray-400 capitalize">{currentPoi.type}</p>
              </div>
              {completedStops.has(currentIndex) && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
            </div>
            
            {currentPoi.summary && (
              <p className="text-gray-300 text-sm mt-3">{currentPoi.summary}</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="p-4 pt-0 flex gap-3">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {isLastStop && completedStops.has(currentIndex) ? (
              <button
                onClick={endWalk}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                Finish Walk
              </button>
            ) : (
              <button
                onClick={goToNext}
                disabled={isLastStop}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stop Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {walkData.pois.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setArrived(completedStops.has(index))
                setShowInfo(false)
              }}
              className="p-1"
            >
              {completedStops.has(index) ? (
                <CheckCircle2 className={`h-4 w-4 ${index === currentIndex ? 'text-green-500' : 'text-green-500/50'}`} />
              ) : (
                <Circle className={`h-4 w-4 ${index === currentIndex ? 'text-white' : 'text-gray-600'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && currentPoi.summary && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            {currentPoi.image && (
              <img 
                src={currentPoi.image} 
                alt={currentPoi.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPoi.name}</h3>
              <p className="text-gray-600 mb-4">{currentPoi.summary}</p>
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Continue Walking
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
