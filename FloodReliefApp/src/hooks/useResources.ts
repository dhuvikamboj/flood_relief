import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../services/api';
import secureStorage from '../../services/secureStorage';
import { getApiBaseUrl } from '../config/api';
// ...existing code...
import { useAuth } from '../contexts/AuthContext';
import { ReliefResource, ResourceFilters } from '../types/resource';

export const useResources = (userCoords: { lat: number; lng: number } | null) => {
  const { user, isAuthenticated } = useAuth();
  const [resources, setResources] = useState<ReliefResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<ResourceFilters>({
    searchRadius: parseInt(localStorage.getItem('preferred_search_radius') || '5', 10),
    availabilityFilter: 'available',
    typeFilter: 'all',
    myResourcesFilter: false,
    searchTerm: '',
    sortBy: 'distance_km',
    sortOrder: 'asc',
  });

  // Save radius to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferred_search_radius', filters.searchRadius.toString());
  }, [filters.searchRadius]);

  // Fetch resources when filters or coordinates change
  useEffect(() => {
    if (!userCoords) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingResources(true);

      // Build URL same as before
      try {
        const base = getApiBaseUrl();

        let url: string;
        if (filters.myResourcesFilter && isAuthenticated && user) {
          url = `${base.replace(/\/$/, '')}/api/user/resources`;
        } else {
          url = `${base.replace(/\/$/, '')}/api/resources?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${filters.searchRadius}`;
          if (filters.availabilityFilter !== 'all') url += `&availability=${filters.availabilityFilter}`;
          if (filters.typeFilter !== 'all') url += `&resource_type=${filters.typeFilter}`;
          if (filters.searchTerm.trim()) url += `&search=${encodeURIComponent(filters.searchTerm.trim())}`;
        }

        const cacheKey = `resources:${url}`;

        // Try to read from secure storage (native) or fallback (web)
        try {
          const cached = await secureStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setResources(parsed);
          }
        } catch (cacheErr) {
          // ignore cache read errors
        }

        // Then fetch from network with axios wrapper (auth headers)
        const res = await api.get(url, { headers: { Accept: 'application/json' } });
        if (res.data && res.data.success) {
          const items = res.data.data.map((it: any) => ({
            id: it.id,
            location: it.location || `${it.lat},${it.lng}`,
            address: it.address,
            contact: it.contact,
            contact_phone: it.contact_phone,
            resource_type: it.resource_type,
            details: it.details || '',
            capacity: it.capacity,
            availability: it.availability || 'available',
            distance_km: it.distance_km,
            timestamp: new Date(it.created_at || Date.now()),
            lat: parseFloat(it.lat),
            lng: parseFloat(it.lng),
            photos: it.photos ? (typeof it.photos === 'string' ? JSON.parse(it.photos) : it.photos) : undefined,
            videos: it.videos ? (typeof it.videos === 'string' ? JSON.parse(it.videos) : it.videos) : undefined,
            user_id: it.user_id,
            reporter_name: it.user?.name || it.reporter_name,
            reporter_email: it.user?.email || it.reporter_email,
            reporter_phone: it.user?.phone || it.reporter_phone,
            comments: it.comments || []
          }));

          setResources(items);

          // Update cache in secure storage (or fallback)
          try {
            await secureStorage.setItem(cacheKey, JSON.stringify(items));
          } catch (cacheErr) {
            // ignore cache write errors
          }
        } else {
        //   setResources([]);
        }
      } catch (e) {
        console.error('Failed to load resources', e);
        // keep cached data if any
      } finally {
        setLoadingResources(false);
      }
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [userCoords, filters, isAuthenticated, user]);

  // Sort resources based on current sort settings
  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (filters.sortBy) {
        case 'distance_km':
          aVal = a.distance_km || 0;
          bVal = b.distance_km || 0;
          break;
        case 'capacity':
          aVal = a.capacity || 0;
          bVal = b.capacity || 0;
          break;
        case 'availability':
          const availabilityOrder = { 'available': 3, 'limited': 2, 'unavailable': 1 };
          aVal = availabilityOrder[a.availability as keyof typeof availabilityOrder] || 0;
          bVal = availabilityOrder[b.availability as keyof typeof availabilityOrder] || 0;
          break;
        case 'timestamp':
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        default:
          return 0;
      }
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [resources, filters.sortBy, filters.sortOrder]);

  const deleteResource = async (id: number) => {
    try {
      const base = getApiBaseUrl();
      const url = `${base.replace(/\/$/, '')}/api/resources/${id}`;

      const headers: any = { Accept: 'application/json' };
      if (isAuthenticated && user) {
        // The auth token should already be set in axios defaults from the auth context
      }

  await api.delete(url, { headers });

      // Update local state
      setResources(resources.filter(r => r.id !== id));
      return { success: true, message: 'Resource deleted successfully' };
    } catch (error: any) {
      console.error('Failed to delete resource', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete resource';
      return { success: false, message: errorMessage };
    }
  };

  const updateResourceAvailability = async (id: number, newAvailability: string) => {
    try {
      const base = getApiBaseUrl();
      const url = `${base.replace(/\/$/, '')}/api/resources/${id}/availability`;

      const headers: any = { Accept: 'application/json' };
      if (isAuthenticated && user) {
        // The auth token should already be set in axios defaults from the auth context
      }

  await api.patch(url, { availability: newAvailability }, { headers });

      // Update local state
      setResources(resources.map(r =>
        r.id === id ? { ...r, availability: newAvailability } : r
      ));

      return { success: true, message: `Availability updated to ${newAvailability}` };
    } catch (error: any) {
      console.error('Failed to update availability', error);
      const errorMessage = error.response?.data?.message || 'Failed to update availability';
      return { success: false, message: errorMessage };
    }
  };

  const isUserResource = (resource: ReliefResource) => {
    return isAuthenticated && user && resource.user_id == user.id;
  };

  const updateFilters = (newFilters: Partial<ResourceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    resources,
    sortedResources,
    loadingResources,
    filters,
    updateFilters,
    deleteResource,
    updateResourceAvailability,
    isUserResource,
  };
};
