'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { MapPin, Users, Clock, Plus, LogOut, Route, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WanderWalks</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Ready for a walk?</h2>
          <p className="text-blue-100 mb-6">Generate a personalized route or join a community walk</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/generate')}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate Walk
            </button>
            <button
              onClick={() => router.push('/walks')}
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Users className="h-5 w-5" />
              Browse Walks
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-gray-600">Walks Completed</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-green-600">0 km</div>
            <div className="text-gray-600">Total Distance</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-gray-600">Saved Routes</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-gray-600">Community Walks</div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/generate')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Generate Walk</h4>
            <p className="text-gray-600 text-sm">Create a personalized walking route based on your preferences</p>
          </button>

          <button
            onClick={() => router.push('/walks')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Community Walks</h4>
            <p className="text-gray-600 text-sm">Join walks with other travelers and local guides</p>
          </button>

          <button
            onClick={() => router.push('/walks/create')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Host a Walk</h4>
            <p className="text-gray-600 text-sm">Create and host a walk for other travelers</p>
          </button>
        </div>

        {/* Upcoming Walks */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Community Walks</h3>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No upcoming walks in your area</p>
            <button
              onClick={() => router.push('/walks/create')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              Create the first walk
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
