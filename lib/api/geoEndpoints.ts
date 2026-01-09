/**
 * Geo API Endpoints - Geographic data for Philippines
 * All endpoints call /api/admin/geo
 */

import { ApiResponse } from '@/types';
import { fetchData } from './client';

const GEO_BASE = '/api/geo';

/**
 * Province data type
 */
export interface Province {
  code: string;
  name: string;
  region: string;
}

/**
 * Municipality/City data type
 */
export interface Municipality {
  _id?: string; // MongoDB ID from geo API
  code: string;
  name: string;
  type: string;
  district: string;
  zip_code: string;
  region: string;
  province: string;
  lat?: number;
  lng?: number;
}

/**
 * Barangay data type
 */
export interface Barangay {
  code: string;
  name: string;
  municipalityCode: string;
}

/**
 * Get all provinces
 * GET /provinces
 */
export async function getProvinces(): Promise<ApiResponse<Province[]>> {
  return fetchData<Province[]>(`${GEO_BASE}/provinces`);
}

/**
 * Get municipalities/cities by province or search by name/code
 * GET /municipalities?province=<province_name>
 * GET /municipalities?query=<city_name_or_code>
 */
export async function getMunicipalities(
  provinceName?: string,
  query?: string
): Promise<ApiResponse<Municipality[]>> {
  const params = new URLSearchParams();
  
  if (query) {
    params.append('query', encodeURIComponent(query));
  } else if (provinceName) {
    params.append('province', encodeURIComponent(provinceName));
  }
  
  const queryString = params.toString();
  const url = queryString ? `${GEO_BASE}/municipalities?${queryString}` : `${GEO_BASE}/municipalities`;
  
  return fetchData<Municipality[]>(url);
}

/**
 * Get barangays by municipality code
 * GET /barangays?municipalityCode=<code>
 */
export async function getBarangays(
  municipalityCode: string
): Promise<ApiResponse<Barangay[]>> {
  return fetchData<Barangay[]>(
    `${GEO_BASE}/barangays?municipalityCode=${encodeURIComponent(municipalityCode)}`
  );
}

/**
 * Reverse geocode coordinates to address
 * GET /reverse-geocode?lat=<lat>&lon=<lon>&zoom=<zoom>&addressDetails=<bool>
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  zoom: number = 18,
  addressDetails: boolean = true
): Promise<ApiResponse<any>> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    zoom: zoom.toString(),
    addressDetails: addressDetails.toString(),
  });

  return fetchData<any>(`${GEO_BASE}/reverse-geocode?${params}`);
}

/**
 * Mapbox Search Box API suggestion type
 */
export interface SearchSuggestion {
  name: string;
  name_preferred?: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted: string;
  context: {
    country?: { name: string; country_code: string };
    region?: { name: string };
    place?: { name: string };
    address?: { name: string };
  };
  distance?: number;
}

/**
 * Search Box API search results
 */
export interface SearchResult {
  type: string;
  geometry: {
    coordinates: [number, number]; // [lng, lat]
    type: string;
  };
  properties: {
    name: string;
    name_preferred?: string;
    mapbox_id: string;
    feature_type: string;
    address?: string;
    full_address?: string;
    place_formatted: string;
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy?: string;
    };
    context: {
      country?: { name: string; country_code: string };
      region?: { name: string };
      place?: { name: string };
      address?: { name: string };
    };
  };
}

/**
 * Get search suggestions using Mapbox Search Box API /suggest endpoint
 * For autocomplete functionality
 */
export async function searchSuggestions(
  query: string,
  sessionToken: string,
  proximity?: { lat: number; lng: number }
): Promise<SearchSuggestion[]> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox token not configured');
      return [];
    }

    const params = new URLSearchParams({
      q: query,
      access_token: token,
      session_token: sessionToken,
      country: 'PH',
      limit: '10',
    });

    if (proximity) {
      params.append('proximity', `${proximity.lng},${proximity.lat}`);
    }

    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`;
    console.log('[searchSuggestions] Calling URL:', url.replace(token, '***'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('[searchSuggestions] Response:', data);
    return data.suggestions || [];
  } catch (error) {
    console.error('Mapbox Search Box suggestion error:', error);
    return [];
  }
}

/**
 * Retrieve detailed information about a suggested result
 * Using Mapbox Search Box API /retrieve endpoint
 */
export async function retrieveSearchResult(
  mapboxId: string,
  sessionToken: string
): Promise<{ lat: number; lng: number; name: string; address?: string } | null> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox token not configured');
      return null;
    }

    const params = new URLSearchParams({
      access_token: token,
      session_token: sessionToken,
    });

    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${params}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const { longitude, latitude } = feature.properties.coordinates;
      const name = feature.properties.name || feature.properties.full_address;
      const address = feature.properties.full_address;

      return { lat: latitude, lng: longitude, name, address };
    }

    return null;
  } catch (error) {
    console.error('Mapbox Search Box retrieve error:', error);
    return null;
  }
}

/**
 * Search for places using Mapbox Search Box API /forward endpoint
 * One-off search request (per-request billing)
 * Returns lat/lng coordinates for a search query
 */
export async function searchPlace(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox token not configured');
      return null;
    }

    const params = new URLSearchParams({
      q: query,
      access_token: token,
      country: 'PH',
      limit: '1',
    });

    if (proximity) {
      params.append('proximity', `${proximity.lng},${proximity.lat}`);
    }

    const url = `https://api.mapbox.com/search/searchbox/v1/forward?${params}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const { longitude, latitude } = feature.properties.coordinates;
      const name = feature.properties.name || feature.properties.full_address;
      return { lat: latitude, lng: longitude, name };
    }

    return null;
  } catch (error) {
    console.error('Mapbox Search Box error:', error);
    return null;
  }
}
/**
 * Geocode municipality name to coordinates using Mapbox
 * Uses Mapbox Geocoding API to get lat/lng for a municipality
 */
export async function geocodeMunicipality(
  municipalityName: string,
  provinceName?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox token not configured');
      return null;
    }

    const query = provinceName 
      ? `${municipalityName}, ${provinceName}, Philippines`
      : `${municipalityName}, Philippines`;
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=PH&limit=1&access_token=${token}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error('Mapbox geocoding error:', error);
    return null;
  }
}
