'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-leaflet components to avoid SSR 'window is not defined' errors
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const useMapEvents = dynamic(() => import('react-leaflet').then((m) => Object({ default: Object.values(m).find(v => typeof v === 'function' && v.name === 'useMapEvents') || m.useMapEvents })), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then((m) => Object({ default: Object.values(m).find(v => typeof v === 'function' && v.name === 'useMap') || m.useMap })), { ssr: false });

function MapEvents({ setPosition, setLocationText }) {
    const MapEventsHook = require('react-leaflet').useMapEvents;
    MapEventsHook({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            reverseGeocode(e.latlng.lat, e.latlng.lng).then(setLocationText);
        },
    });
    return null;
}

function MapUpdater({ position }) {
    const useMapHook = require('react-leaflet').useMap;
    const map = useMapHook();
    useEffect(() => {
        if (position) map.setView(position, 15);
    }, [position, map]);
    return null;
}

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

export default function LocationPicker({ onChange }) {
    const [mode, setMode] = useState('map'); // 'map', 'search', 'manual'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [position, setPosition] = useState([5.6037, -0.1870]); // Default Accra
    const [locationText, setLocationText] = useState('');
    const [manualText, setManualText] = useState('');

    // Fix leaflet marker icon via vanilla JS since markerIcon.src requires webpack setup
    useEffect(() => {
        // Only run on client
        const L = require('leaflet');
        // Include leaflet CSS
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Effect to notify parent of changes
    useEffect(() => {
        if (mode === 'manual') {
            onChange({ lat: null, lng: null, text: manualText });
        } else {
            onChange({ lat: position[0], lng: position[1], text: locationText });
        }
    }, [position, locationText, manualText, mode]);

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchQuery) return;
        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    }

    function selectSearchResult(result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        setLocationText(result.display_name);
        setMode('map');
        setSearchResults([]);
        setSearchQuery('');
    }

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                <button type="button" onClick={() => setMode('map')} style={{ flex: 1, padding: '0.75rem', border: 'none', background: mode === 'map' ? 'rgba(43,125,233,0.1)' : 'transparent', color: mode === 'map' ? 'var(--brand)' : 'var(--text)', fontWeight: mode === 'map' ? 600 : 400, cursor: 'pointer' }}>📍 Map Pin</button>
                <button type="button" onClick={() => setMode('search')} style={{ flex: 1, padding: '0.75rem', border: 'none', background: mode === 'search' ? 'rgba(43,125,233,0.1)' : 'transparent', color: mode === 'search' ? 'var(--brand)' : 'var(--text)', fontWeight: mode === 'search' ? 600 : 400, cursor: 'pointer' }}>🔍 Search</button>
                <button type="button" onClick={() => setMode('manual')} style={{ flex: 1, padding: '0.75rem', border: 'none', background: mode === 'manual' ? 'rgba(43,125,233,0.1)' : 'transparent', color: mode === 'manual' ? 'var(--brand)' : 'var(--text)', fontWeight: mode === 'manual' ? 600 : 400, cursor: 'pointer' }}>✍️ Manual</button>
            </div>

            {/* Content */}
            <div style={{ padding: '1rem', background: 'var(--card-bg)' }}>
                {mode === 'manual' && (
                    <div>
                        <textarea
                            className="form-textarea"
                            placeholder="Enter detailed delivery address or pickup point..."
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            style={{ minHeight: '100px' }}
                        />
                        <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Note: Typing your address manually might make it harder for the seller to calculate the exact delivery fee.</p>
                    </div>
                )}

                {mode === 'search' && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                className="form-input"
                                placeholder="E.g. Accra Mall, Spintex Road"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            />
                            <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                                {searching ? '...' : 'Search'}
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                {searchResults.map((res, i) => (
                                    <li
                                        key={i}
                                        onClick={() => selectSearchResult(res)}
                                        style={{ padding: '0.75rem 1rem', borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(43,125,233,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div className="text-sm" style={{ fontWeight: 500 }}>{res.display_name.split(',')[0]}</div>
                                        <div className="text-xs text-muted">{res.display_name}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Powered by OpenStreetMap. Accurate location helps the seller give you the best delivery quote.</p>
                    </div>
                )}

                {mode === 'map' && (
                    <div>
                        {typeof window !== 'undefined' && (
                            <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                    <Marker position={position} />
                                    <MapEvents setPosition={setPosition} setLocationText={setLocationText} />
                                    <MapUpdater position={position} />
                                </MapContainer>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label className="text-xs" style={{ fontWeight: 600 }}>Selected Location:</label>
                            <div className="text-sm" style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {locationText || `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`}
                            </div>
                            <p className="text-xs text-muted mt-1">Click anywhere on the map to drop a pin.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
