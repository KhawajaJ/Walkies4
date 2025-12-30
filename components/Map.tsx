'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

interface POI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
}

interface MapProps {
  center: [number, number]
  pois: POI[]
  route?: [number, number][]
}

export default function Map({ center, pois, route }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: 14,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update center when it changes
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({ center, zoom: 14 })
    }
  }, [center])

  // Add POI markers
  useEffect(() => {
    if (!map.current || !loaded) return

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.poi-marker')
    existingMarkers.forEach(m => m.remove())

    // Add new markers
    pois.forEach(poi => {
      const el = document.createElement('div')
      el.className = 'poi-marker'
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      `

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong>${poi.name}</strong>
          <p style="margin: 4px 0 0; color: #666; font-size: 12px;">${poi.type}</p>
        </div>
      `)

      new maplibregl.Marker(el)
        .setLngLat([poi.lng, poi.lat])
        .setPopup(popup)
        .addTo(map.current!)
    })
  }, [pois, loaded])

  // Draw route line
  useEffect(() => {
    if (!map.current || !loaded || !route || route.length < 2) return

    const sourceId = 'route'
    const layerId = 'route-line'

    // Remove existing route
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId)
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId)
    }

    // Add new route
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      },
    })

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    })
  }, [route, loaded])

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '12px' }}
    />
  )
}
