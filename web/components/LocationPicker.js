'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then((m) => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then((m) => m.Marker),       { ssr: false });

function MapEvents({ setPosition, setLocationText }) {
    const { useMapEvents } = require('react-leaflet');
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            reverseGeocode(e.latlng.lat, e.latlng.lng).then(setLocationText);
        },
    });
    return null;
}

function MapUpdater({ position }) {
    const { useMap } = require('react-leaflet');
    const map = useMap();
    useEffect(() => { if (position) map.setView(position, 15); }, [position, map]);
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

/** Haversine distance in km */
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationPicker({ onChange, sellerLat, sellerLng }) {
    const [mode, setMode]               = useState('map');      // 'map' | 'search' | 'manual'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching]     = useState(false);
    const [position, setPosition]       = useState([5.6037, -0.1870]); // Default: Accra
    const [locationText, setLocationText] = useState('');
    const [manualText, setManualText]   = useState('');
    const debounceRef = useRef(null);

    // Fix leaflet marker icons (client-side only)
    useEffect(() => {
        const L = require('leaflet');
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css'; link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Notify parent on any change
    useEffect(() => {
        if (mode === 'manual') {
            onChange({ lat: null, lng: null, text: manualText });
        } else {
            onChange({ lat: position[0], lng: position[1], text: locationText });
        }
    }, [position, locationText, manualText, mode]); // eslint-disable-line

    // Live search — debounced 400 ms
    useEffect(() => {
        if (mode !== 'search') return;
        if (!searchQuery.trim()) { setSearchResults([]); return; }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gh&limit=5`
                );
                const data = await res.json();
                setSearchResults(data);
            } catch {
                // silently ignore network errors
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => clearTimeout(debounceRef.current);
    }, [searchQuery, mode]);

    function selectSearchResult(result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        setLocationText(result.display_name);
        setMode('map');
        setSearchResults([]);
        setSearchQuery('');
    }

    // Distance from seller to current buyer position
    const distanceKm = sellerLat && sellerLng && position
        ? haversine(sellerLat, sellerLng, position[0], position[1])
        : null;

    const tabStyle = (t) => ({
        flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer',
        background: mode === t ? 'rgba(43,125,233,0.1)' : 'transparent',
        color: mode === t ? 'var(--brand)' : 'var(--text)',
        fontWeight: mode === t ? 600 : 400,
    });

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                <button type="button" onClick={() => setMode('map')}    style={tabStyle('map')}>📍 Map Pin</button>
                <button type="button" onClick={() => setMode('search')} style={tabStyle('search')}>🔍 Search</button>
                <button type="button" onClick={() => setMode('manual')} style={tabStyle('manual')}>✍️ Manual</button>
            </div>

            <div style={{ padding: '1rem', background: 'var(--card-bg)' }}>

                {/* ── Manual ── */}
                {mode === 'manual' && (
                    <div>
                        <textarea
                            className="form-textarea"
                            placeholder="Enter detailed delivery address or pickup point..."
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            style={{ minHeight: 100 }}
                        />
                        <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                            Note: Typing your address manually might make it harder for the seller to calculate the exact delivery fee.
                        </p>
                    </div>
                )}

                {/* ── Search ── */}
                {mode === 'search' && (
                    <div>
                        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                            <input
                                className="form-input"
                                placeholder="E.g. Accra Mall, Spintex Road…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingRight: searching ? '2.5rem' : undefined }}
                                autoFocus
                            />
                            {searching && (
                                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                                    <div className="spinner" style={{ width: 16, height: 16 }} />
                                </div>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                {searchResults.map((res, i) => (
                                    <li
                                        key={i}
                                        onClick={() => selectSearchResult(res)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,125,233,0.07)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div className="text-sm" style={{ fontWeight: 600 }}>{res.display_name.split(',')[0]}</div>
                                        <div className="text-xs text-muted" style={{ marginTop: 2 }}>{res.display_name}</div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!searching && searchQuery.trim() && searchResults.length === 0 && (
                            <p className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>No results found. Try a different name or use Map Pin.</p>
                        )}

                        <p className="text-xs text-muted">
                            Results appear as you type — powered by OpenStreetMap.
                        </p>
                    </div>
                )}

                {/* ── Map ── */}
                {mode === 'map' && (
                    <div>
                        {typeof window !== 'undefined' && (
                            <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem' }}>
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
                            <div className="text-sm" style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                {locationText || `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`}
                            </div>
                            <p className="text-xs text-muted mt-1">Click anywhere on the map to drop a pin.</p>
                        </div>
                    </div>
                )}

                {/* ── Distance indicator ── */}
                {distanceKm !== null && mode !== 'manual' && (
                    <div style={{
                        marginTop: '0.875rem',
                        padding: '0.625rem 0.875rem',
                        background: 'rgba(43,125,233,0.06)',
                        border: '1px solid rgba(43,125,233,0.15)',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <span style={{ fontSize: '1rem' }}>📏</span>
                        <span className="text-xs" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                            ~{distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(1)} km`} from seller's location
                        </span>
                        <span className="text-xs text-muted">— seller will use this to quote delivery fee</span>
                    </div>
                )}
            </div>
        </div>
    );
}
