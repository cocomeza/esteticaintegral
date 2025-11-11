'use client'
import { useState, useEffect } from 'react'
import { X, AlertCircle, Info, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'alert' | 'success' | 'vacation'
  show_on_home: boolean
  block_bookings: boolean
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
}

const getDismissalKey = (announcement: Announcement) => {
  const timestamp = announcement.updated_at || announcement.created_at || ''
  return `${announcement.id}:${timestamp}`
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
    // Recuperar anuncios descartados del localStorage
    const storedDismissed = localStorage.getItem('dismissedAnnouncements')
    if (storedDismissed) {
      try {
        const parsed = JSON.parse(storedDismissed)
        if (Array.isArray(parsed)) {
          setDismissed(parsed.filter((item) => typeof item === 'string'))
        }
      } catch (error) {
        console.error('Error parsing dismissed announcements from storage:', error)
      }
    }
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (announcement: Announcement) => {
    const dismissalKey = getDismissalKey(announcement)
    const legacyKey = announcement.id

    const keysToStore = new Set(dismissed)
    keysToStore.add(dismissalKey)
    keysToStore.add(legacyKey)

    const updatedDismissed = Array.from(keysToStore)
    setDismissed(updatedDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updatedDismissed))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'alert':
        return <AlertCircle className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'vacation':
        return <Calendar className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'vacation':
        return 'bg-purple-50 border-purple-200 text-purple-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'alert':
        return 'text-red-600'
      case 'success':
        return 'text-green-600'
      case 'vacation':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) return null

  const visibleAnnouncements = announcements.filter((announcement) => {
    if (!announcement.show_on_home) {
      return false
    }

    const dismissalKey = getDismissalKey(announcement)
    const legacyKey = announcement.id

    return !dismissed.includes(dismissalKey) && !dismissed.includes(legacyKey)
  })

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`border-l-4 p-4 rounded-lg shadow-sm ${getStyles(announcement.type)}`}
        >
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getIconColor(announcement.type)}`}>
              {getIcon(announcement.type)}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold mb-1">{announcement.title}</h3>
              <p className="text-sm opacity-90 whitespace-pre-line">{announcement.message}</p>
              {announcement.start_date && announcement.end_date && (
                <p className="text-xs mt-2 opacity-75">
                  Desde {new Date(announcement.start_date).toLocaleDateString('es-AR')} 
                  {' '}hasta{' '}
                  {new Date(announcement.end_date).toLocaleDateString('es-AR')}
                </p>
              )}
              {announcement.block_bookings && (
                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-white bg-opacity-50 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Reservas temporalmente suspendidas
                </div>
              )}
            </div>
            <button
              onClick={() => handleDismiss(announcement)}
              className="ml-3 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Cerrar anuncio"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

