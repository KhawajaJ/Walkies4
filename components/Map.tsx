'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

interface POI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  image?: string
  summary?: string
}

interface MapProps {
  center: [number, number]
  pois: POI[]
  route?: [number, number][]
}

export default function Map({ center, pois, route }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])

  // Fetch walking route from OSRM
  useEffect(() => {
    const fetchWalkingRoute = async () => {
      if (!route || route.length < 2) {
        setRouteCoords([])
        return
      }

      try {
        // Build coordinates string for OSRM
        const coords = route.map(([lng, lat]) => `${lng},${lat}`).join(';')
        
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`
        )
        
        const data = await response.json()
        
        if (data.routes && data.routes[0]) {
          const geometry = data.routes[0].geometry.coordinates
          setRouteCoords(geometry)
        } else {
          // Fallback to straight lines if routing fails
          setRouteCoords(route)
        }
      } catch (error) {
        console.error('Error fetching route:', error)
        // Fallback to straight lines
        setRouteCoords(route)
      }
    }

    fetchWalkingRoute()
  }, [route])

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: 14,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Add user location marker
    const userMarkerEl = document.createElement('div')
    userMarkerEl.className = 'user-marker'
    userMarkerEl.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `
    
    new maplibregl.Marker({ element: userMarkerEl })
      .setLngLat(center)
      .addTo(map.current)

    return () => {
      map.current?.remove()
    }
  }, [center])

  // Update POI markers
  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.poi-marker')
    existingMarkers.forEach(m => m.remove())

    // Add POI markers
    pois.forEach((poi, index) => {
      const el = document.createElement('div')
      el.className = 'poi-marker'
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">${index + 1}</div>
      `

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <strong style="font-size: 14px;">${poi.name}</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: capitalize;">${poi.type}</p>
          ${poi.summary ? `<p style="margin: 8px 0 0; font-size: 11px; color: #888;">${poi.summary}</p>` : ''}
        </div>
      `)

      new maplibregl.Marker({ element: el })
        .setLngLat([poi.lng, poi.lat])
        .setPopup(popup)
        .addTo(map.current!)
    })
  }, [pois])

  // Update route line with real walking path
  useEffect(() => {
    if (!map.current || routeCoords.length === 0) return

    const sourceId = 'route'
    const layerId = 'route-line'

    // Wait for map to load
    const addRoute = () => {
      // Remove existing route
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId)
      }
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId)
      }

      // Add new route
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoords,
          },
        },
      })

      map.current!.addLayer({
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
    }

    if (map.current.isStyleLoaded()) {
      addRoute()
    } else {
      map.current.on('load', addRoute)
    }
  }, [routeCoords])

  // Fit bounds to show all POIs
  useEffect(() => {
    if (!map.current || pois.length === 0) return

    const bounds = new maplibregl.LngLatBounds()
    bounds.extend(center)
    pois.forEach(poi => {
      bounds.extend([poi.lng, poi.lat])
    })

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    })
  }, [pois, center])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
