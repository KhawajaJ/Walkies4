'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, RefreshCw, Save, ArrowLeft, Sparkles, Navigation, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Load map dynamically (no SSR)
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

interface POI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  distance?: number
}

const INTERESTS = [
  { id: 'tourism', label: 'Tourist Spots', emoji: '📸', osmTag: 'tourism' },
  { id: 'historic', label: 'Historic', emoji: '🏛️', osmTag: 'historic' },
  { id: 'museum', label: 'Museums', emoji: '🖼️', osmTag: 'museum' },
  { id: 'park', label: 'Parks & Nature', emoji: '🌳', osmTag: 'leisure=park' },
  { id: 'religious', label: 'Religious Sites', emoji: '⛪', osmTag: 'amenity=place_of_worship' },
  { id: 'viewpoint', label: 'Viewpoints', emoji: '🏔️', osmTag: 'tourism=viewpoint' },
]

export default function GeneratePage() {
  const [duration, setDuration] = useState(90)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['tourism', 'historic'])
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationName, setLocationName] = useState('')
  const [pois, setPois] = useState<POI[]>([])
  const [route, setRoute] = useState<[number, number][]>([])
  const [error, setError] = useState('')
  const router = useRouter()

  // Get user's location on page load
  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    setLoadingLocation(true)
    setError('')
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])
        
        // Get location name via reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await response.json()
          setLocationName(data.address?.city || data.address?.town || data.address?.village || 'Your Location')
        } catch {
          setLocationName('Your Location')
        }
        
        setLoadingLocation(false)
      },
      (err) => {
        setError('Unable to get your location. Please enable location access.')
        setLoadingLocation(false)
        // Default to Berlin if location fails
        setUserLocation([13.405, 52.52])
        setLocationName('Berlin (default)')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const fetchPOIs = async () => {
    if (!userLocation) return []

    const [lng, lat] = userLocation
    const radius = Math.min(duration * 20, 3000) // Rough estimate: ~20m per minute of walking

    // Build Overpass query based on selected interests
    const tags = selectedInterests.map(interest => {
      const found = INTERESTS.find(i => i.id === interest)
      return found?.osmTag || ''
    }).filter(Boolean)

    const overpassQuery = `
      [out:json][timeout:25];
      (
        ${tags.map(tag => {
          if (tag.includes('=')) {
            return `node[${tag}](around:${radius},${lat},${lng});`
          }
          return `node["${tag}"](around:${radius},${lat},${lng});`
        }).join('\n')}
      );
      out body;
    `

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      })
      
      const data = await response.json()
      
      const fetchedPOIs: POI[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: el.id.toString(),
          name: el.tags.name,
          type: el.tags.tourism || el.tags.historic || el.tags.amenity || el.tags.leisure || 'Point of Interest',
          lat: el.lat,
          lng: el.lon,
          distance: calculateDistance(lat, lng, el.lat, el.lon),
        }))
        .sort((a: POI, b: POI) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10) // Limit to 10 POIs

      return fetchedPOIs
    } catch (err) {
      console.error('Error fetching POIs:', err)
      setError('Failed to fetch points of interest. Please try again.')
      return []
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  const generateRoute = (fetchedPOIs: POI[]): [number, number][] => {
    if (!userLocation || fetchedPOIs.length === 0) return []
    
    // Simple route: start from user location, visit POIs in order of distance
    const routePoints: [number, number][] = [userLocation]
    fetchedPOIs.forEach(poi => {
      routePoints.push([poi.lng, poi.lat])
    })
    
    return routePoints
  }

  const handleGenerate = async () => {
    if (!userLocation) {
      setError('Please enable location access to generate a walk')
      return
    }

    setLoading(true)
    setError('')
    
    const fetchedPOIs = await fetchPOIs()
    
    if (fetchedPOIs.length === 0) {
      setError('No points of interest found nearby. Try selecting different interests or increasing duration.')
      setLoading(false)
      return
    }

    setPois(fetchedPOIs)
    setRoute(generateRoute(fetchedPOIs))
    setGenerated(true)
    setLoading(false)
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    alert('Walk saved! (This would save to your profile)')
    router.push('/dashboard')
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const totalDistance = pois.reduce((sum, poi) => sum + (poi.distance || 0), 0)

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
            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <h2 className="font-bold text-gray-900">Starting Point</h2>
                </div>
                <button
                  onClick={getUserLocation}
                  disabled={loadingLocation}
                  className="text-blue-600 text-sm hover:underline disabled:opacity-50"
                >
                  {loadingLocation ? 'Finding...' : 'Update'}
                </button>
              </div>
              
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Getting your location...</span>
                </div>
              ) : userLocation ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{locationName}</span>
                </div>
              ) : (
                <p className="text-gray-500">Location not available</p>
              )}
            </div>

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
              <h2 className="font-bold text-gray-900 mb-4">What do you want to see?</h2>
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !userLocation || selectedInterests.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Finding places...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Walk
                </>
              )}
            </button>
          </div>

          {/* Map & Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '400px' }}>
              {userLocation ? (
                <Map 
                  center={userLocation} 
                  pois={pois}
                  route={generated ? route : undefined}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Enable location to see the map</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {generated && pois.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Your {locationName} Walking Route</h3>
                    <p className="text-gray-500">{pois.length} stops • ~{formatDistance(totalDistance)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{duration} min</div>
                  </div>
                </div>

                {/* Stops */}
                <div className="space-y-3">
                  {pois.map((poi, index) => (
                    <div key={poi.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{poi.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{poi.type}</div>
                      </div>
                      <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                        {formatDistance(poi.distance || 0)}
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
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
