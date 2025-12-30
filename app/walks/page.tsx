'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Users, Clock, ArrowLeft, Plus, Calendar, Filter } from 'lucide-react'

const MOCK_WALKS = [
  {
    id: '1',
    title: 'Historic Berlin Morning Walk',
    host: 'Maria K.',
    date: 'Tomorrow, 9:00 AM',
    duration: '2 hours',
    participants: 4,
    maxParticipants: 8,
    description: 'Explore the historic heart of Berlin including Brandenburg Gate and Museum Island.',
    tags: ['Historic', 'Architecture'],
  },
  {
    id: '2',
    title: 'Street Art Tour - Kreuzberg',
    host: 'Alex T.',
    date: 'Saturday, 2:00 PM',
    duration: '1.5 hours',
    participants: 6,
    maxParticipants: 10,
    description: 'Discover the vibrant street art scene in one of Berlin\'s most creative neighborhoods.',
    tags: ['Street Art', 'Culture'],
  },
  {
    id: '3',
    title: 'Sunset at Tempelhofer Feld',
    host: 'Jonas M.',
    date: 'Sunday, 6:00 PM',
    duration: '1 hour',
    participants: 2,
    maxParticipants: 6,
    description: 'Casual evening walk at the former airport turned public park. Great for photos!',
    tags: ['Parks', 'Photography'],
  },
]

export default function WalksPage() {
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Community Walks</h1>
                <p className="text-sm text-gray-500">Join walks with other travelers</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/walks/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Host a Walk
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'today', 'this week', 'historic', 'nature', 'food'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full whitespace-nowrap capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Walks List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_WALKS.map(walk => (
            <div
              key={walk.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => alert(`Join walk: ${walk.title}`)}
            >
              <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-white/50" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-1">{walk.title}</h3>
                <p className="text-sm text-gray-500 mb-3">Hosted by {walk.host}</p>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{walk.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {walk.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {walk.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {walk.participants}/{walk.maxParticipants}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {MOCK_WALKS.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No walks found</h3>
            <p className="text-gray-500 mb-6">Be the first to host a walk in your area!</p>
            <button
              onClick={() => router.push('/walks/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Host a Walk
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
