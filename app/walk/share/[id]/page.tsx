'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Clock, Users, Navigation, ArrowLeft, Loader2, Share2, Check, Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
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

interface Walk {
  id: string
  title: string
  description: string
  share_id: string
  visibility: string
  route_data: {
    pois: POI[]
    locationName: string
    duration: number
    vibe: string
    pace: string
  }
  user_id: string
  created_at: string
}

export default function ShareWalkPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [walk, setWalk] = useState<Walk | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchWalk = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data, error } = await supabase
        .from('walks')
        .select('*')
        .eq('share_id', params.id)
        .single()

      if (error || !data) {
        setError('Walk not found or is private')
        setLoading(false)
        return
      }

      setWalk(data)

      if (user) {
        const { data: participant } = await supabase
          .from('walk_participants')
          .select('*')
          .eq('walk_id', data.id)
          .eq('user_id', user.id)
          .single()

        if (participant) {
          setJoined(true)
        }
      }

      setLoading(false)
    }

    fetchWalk()
  }, [params.id, supabase])

  const handleJoin = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!walk) return

    setJoining(true)

    const { error } = await supabase
      .from('walk_participants')
      .insert({
        walk_id: walk.id,
        user_id: user.id,
        status: 'joined'
      })

    if (error) {
      setError('Failed to join walk')
    } else {
      setJoined(true)
    }

    setJoining(false)
  }

  const handleStartWalk = () => {
    if (!walk?.route_data) return
    sessionStorage.setItem('activeWalk', JSON.stringify({
      pois: walk.route_data.pois,
      locationName: walk.route_data.locationName
    }))
    router.push('/walk/active')
  }

  const handleShare = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !walk) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Walk Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'This walk may be private or deleted'}</p>
          <button
            onClick={() => router.push('/walks')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            Browse Walks
          </button>
        </div>
      </div>
    )
  }

  const routeData = walk.route_data
  const pois = routeData?.pois || []
  const totalDistance = pois.reduce((sum: number, poi: POI) => sum + (poi.distance || 0), 0)
  const center: [number, number] = pois.length > 0 ? [pois[0].lng, pois[0].lat] : [0, 0]
  const route: [number, number][] = pois.map((p: POI) => [p.lng, p.lat])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/walks')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{walk.title}</h1>
                  {walk.visibility === 'public' ? (
                    <Globe className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{pois.length} stops in {routeData?.locationName}</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '400px' }}>
              {pois.length > 0 && (
                <Map center={center} pois={pois} route={route} />
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="font-bold text-gray-900 mb-4">Route Stops</h2>
              <div className="space-y-3">
                {pois.map((poi: POI, index: number) => (
                  <div key={poi.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    {poi.image ? (
                      <img src={poi.image} alt={poi.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{poi.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{poi.type}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistance(poi.distance || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{routeData?.duration || 60} min</div>
                  <div className="text-gray-500">{formatDistance(totalDistance)}</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="capitalize">{routeData?.pace || 'moderate'} pace</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Navigation className="h-5 w-5" />
                  <span className="capitalize">{routeData?.vibe || 'balanced'} vibe</span>
                </div>
              </div>

              {joined ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">You've joined this walk</span>
                  </div>
                  <button
                    onClick={handleStartWalk}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-5 w-5" />
                    Start Walk
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Join This Walk
                    </>
                  )}
                </button>
              )}
            </div>

            {walk.description && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{walk.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
