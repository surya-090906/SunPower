import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, List, ListItemButton, Stack, TextField, Typography } from '@mui/material';
import { Crosshair, MapPin, Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geocoding from '@sunpower/geocoding';
import { validPoint } from '../lib/location';
export { validPoint } from '../lib/location';

const DEFAULT_CENTER = [12.9716, 77.5946];
const pinIcon = L.divIcon({ className: 'roof-pin', html: '<span></span>', iconSize: [30, 40], iconAnchor: [15, 39] });

export default function LocationPicker({ initial, onChange, onPendingChange, geocoderUrl, error, client: suppliedClient }) {
  const container = useRef(null), map = useRef(null), marker = useRef(null), version = useRef(0), lookup = useRef(null), searchRequest = useRef(null);
  const client = useMemo(() => suppliedClient || geocoding.createClient(geocoderUrl, window.fetch.bind(window)), [geocoderUrl, suppliedClient]);
  const [point, setPoint] = useState(validPoint(initial) ? initial : null);
  const [query, setQuery] = useState(''), [results, setResults] = useState([]), [searching, setSearching] = useState(false), [locating, setLocating] = useState(false);
  const [status, setStatus] = useState(point ? 'Your installation location is selected.' : '');
  const [searchStatus, setSearchStatus] = useState('');
  const publish = useCallback(value => { setPoint(value); onChange(value); }, [onChange]);
  const placeMarker = useCallback((lat,lng) => {
    if (!map.current) return;
    if (marker.current) marker.current.setLatLng([lat,lng]);
    else marker.current = L.marker([lat,lng], { draggable: true, icon: pinIcon, alt: 'Installation location' }).addTo(map.current).on('dragend', () => { const p=marker.current.getLatLng(); selectRef.current(p.lat,p.lng); });
  }, []);
  const selectPoint = useCallback(async (lat, lng, feature) => {
    const current=++version.current;
    lookup.current?.abort();
    setLocating(false);
    placeMarker(lat,lng);
    const base={lat:Number(lat).toFixed(6),lng:Number(lng).toFixed(6),address:`Map location: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,city:'',pincode:''};
    publish(base);
    if(feature) { onPendingChange?.(false);publish({...base,...geocoding.addressFields(feature)}); setStatus('Location selected. Move the pin to refine your roof location.'); return; }
    onPendingChange?.(true);
    setStatus('Pin selected. Finding the address…');
    const controller=new AbortController(); lookup.current=controller;
    try {
      const features=await client.reverse(Number(lat),Number(lng),controller.signal);
      if (current!==version.current || controller.signal.aborted) return;
      if (features[0]) publish({...base,...geocoding.addressFields(features[0])});
      setStatus(features[0] ? 'Address filled automatically. Check the selected location below.' : 'Pin selected. No street address was available; you can continue with this location.');
    } catch(e) { if(current===version.current && !controller.signal.aborted) setStatus('Pin selected. Address lookup is unavailable; you can continue using this map location.'); }
    finally {if(current===version.current && !controller.signal.aborted)onPendingChange?.(false);}
  }, [client, placeMarker, publish, onPendingChange]);
  const selectRef=useRef(selectPoint); selectRef.current=selectPoint;
  useEffect(() => {
    const start=validPoint(initial) ? [Number(initial.lat),Number(initial.lng)] : DEFAULT_CENTER;
    map.current=L.map(container.current, { scrollWheelZoom: false }).setView(start, validPoint(initial)?17:11);
    const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map.current);
    tiles.on('tileerror',()=>setStatus('Map tiles could not load. You can still search for a place or use your current location.'));
    map.current.on('click',e=>selectRef.current(e.latlng.lat,e.latlng.lng));
    if(validPoint(initial)) placeMarker(...start);
    const resize=new ResizeObserver(()=>map.current?.invalidateSize()); resize.observe(container.current);
    return ()=>{ ++version.current;lookup.current?.abort();searchRequest.current?.abort();resize.disconnect();map.current?.remove();map.current=null; };
  }, []);
  async function search() {
    if(!query.trim()) { setSearchStatus('Enter a place, area or pincode to search.');return; }
    searchRequest.current?.abort();const controller=new AbortController();searchRequest.current=controller;
    setSearching(true);setResults([]);setSearchStatus('Searching places…');
    try { const found=await client.search(query.trim(),controller.signal); if(controller.signal.aborted)return;setResults(found);setSearchStatus(found.length?'Choose the result closest to your property.':'No places found. Try a nearby area or select a point on the map.'); }
    catch(e) { if(!controller.signal.aborted)setSearchStatus('Search is unavailable. Tap the map or use your current location.'); }
    finally {if(!controller.signal.aborted)setSearching(false);}
  }
  function choose(feature) { const [lng,lat]=feature.geometry.coordinates;map.current?.setView([lat,lng],17);selectPoint(lat,lng,feature);setResults([]);setSearchStatus('Location selected. You can move the pin to your roof.'); }
  function locate() {
    if(!navigator.geolocation) {setStatus('This browser cannot share your location. Search or select a point on the map.');return;}
    const current=++version.current;lookup.current?.abort();onPendingChange?.(true);setLocating(true);setStatus('Finding your current location…');
    navigator.geolocation.getCurrentPosition(p=>{if(current!==version.current)return;map.current?.setView([p.coords.latitude,p.coords.longitude],18);selectPoint(p.coords.latitude,p.coords.longitude);},()=>{if(current!==version.current)return;setLocating(false);onPendingChange?.(false);setStatus('Location access was unavailable. Search for your property or tap the map to continue.');},{enableHighAccuracy:true,timeout:10000});
  }
  function clear() {++version.current;lookup.current?.abort();searchRequest.current?.abort();onPendingChange?.(false);setSearching(false);setLocating(false);setResults([]);setSearchStatus('');publish(null);if(marker.current){marker.current.remove();marker.current=null;}setStatus('Location cleared. Choose your installation site.');}
  return <Box className="location-picker">
    <Stack direction="row" sx={{gap:1}}><TextField id="location-search" label="Search place, area or pincode" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}} slotProps={{htmlInput:{'aria-controls':'location-results',maxLength:200}}} /><Button type="button" variant="contained" color="secondary" onClick={search} disabled={searching} aria-label="Search locations">{searching?<CircularProgress size={20} color="inherit" />:<Search size={20} />}</Button></Stack>
    {searchStatus && <Typography role="status" variant="body2" color="text.secondary" sx={{my:1}}>{searchStatus}</Typography>}
    {results.length>0 && <List id="location-results" aria-label="Location search results" className="location-results">{results.map((feature,i)=><ListItemButton component="button" type="button" key={i} onClick={()=>choose(feature)}><MapPin size={17} /><span>{geocoding.addressFields(feature).address || 'Map location'}</span></ListItemButton>)}</List>}
    <div ref={container} className="installation-map" role="region" aria-label="Installation location map" aria-describedby="map-guidance" />
    <Stack direction="row" sx={{mt:1.5,gap:1,flexWrap:"wrap"}}><Button type="button" variant="outlined" color="secondary" startIcon={<Crosshair size={17}/>} onClick={locate} disabled={locating}>{locating?'Locating…':'Use my location'}</Button><Button type="button" color="secondary" onClick={()=>{const c=map.current.getCenter();selectPoint(c.lat,c.lng);}}>Use map center</Button>{point && <Button type="button" color="secondary" startIcon={<X size={16}/>} onClick={clear}>Clear pin</Button>}</Stack>
    <Typography role="status" variant="body2" sx={{mt:1,color:point?'#246745':'text.secondary'}}>{status}</Typography>
    {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    {point && <Box className="selected-location"><MapPin size={20}/><Box><Typography sx={{fontWeight:700}}>Selected installation site</Typography><Typography variant="body2">{point.address}</Typography><Typography variant="body2" color="text.secondary">{point.city || 'City unavailable'}{point.pincode?` · ${point.pincode}`:''}</Typography><Typography variant="caption" color="text.secondary">{point.lat}, {point.lng}</Typography></Box></Box>}
    {['site_lat','site_lng','address','city','pincode'].map(name=><input key={name} type="hidden" name={name} value={point?.[name==='site_lat'?'lat':name==='site_lng'?'lng':name] ?? ''} />)}
  </Box>;
}
