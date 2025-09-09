import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactGA4 from 'react-ga4';
import { getApiBaseUrl } from '../config/api';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonSpinner,
    IonBadge,
    IonButton,
    IonIcon,
    IonRouterLink,
    IonButtons,
} from '@ionic/react';
import RequestMap from '../components/RequestMap';
import ResourceMap from '../components/ResourceMap';
import RequestFilters, { RequestFilters as RequestFiltersType } from '../components/RequestFilters';
import FloatingFilters from '../components/FloatingFilters';
import { ResourceFilters as ResourceFiltersType } from '../types/resource';
import RequestCard, { ReliefRequest } from '../components/RequestCard';
import RequestModal from '../components/RequestModal';
import ResourceModal from '../components/ResourceModal';
import DataTable, { DataTableColumn } from '../components/DataTable';
import { ReliefResource } from '../types/resource';
import { useLocation } from '../hooks/useLocation';
import { useExploreLocation } from '../hooks/useExploreLocation';
import { useAuth } from '../contexts/AuthContext';
import api from '../../services/api';
import { logInOutline, personAddOutline, heartOutline, mapOutline, handRightOutline, personOutline, logOutOutline, homeOutline, informationCircleOutline } from 'ionicons/icons';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Landing.css';

const Landing: React.FC = () => {
    const { t } = useTranslation();
    const [showLanguagePopover, setShowLanguagePopover] = useState(false);
    
    // Remove duplicate location state - use the hook instead
    // const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
    // const [locationError, setLocationError] = useState<string | null>(null);
    // const [fetchingLocation, setFetchingLocation] = useState(false);
    
    // Add authentication state
    const { isAuthenticated, user, logout } = useAuth();
    
    const { userCoords, mapError, mapLoading } = useLocation();
    const { getActiveCoords } = useExploreLocation();
    
    // Get active coordinates (explore coords if set, otherwise user coords)
    const activeCoords = getActiveCoords(userCoords);
    
    // Debug logging for coordinate changes
    useEffect(() => {
        console.log('🗺️ Landing: Active coords changed to:', activeCoords);
    }, [activeCoords]);
    const [requests, setRequests] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'map' | 'data' | 'table'>('map');

    // Track landing page view
    useEffect(() => {
        ReactGA4.send({
            hitType: 'pageview',
            page: '/landing',
            title: 'Landing Page'
        });
    }, []);

    // Track tab switches
    useEffect(() => {
        ReactGA4.event({
            category: 'User Interaction',
            action: 'Tab Switched',
            label: `Switched to ${activeTab} view`
        });
    }, [activeTab]);
    
    // Debounce refs for API calls
    const debounceRequestsRef = useRef<NodeJS.Timeout | null>(null);
    const debounceResourcesRef = useRef<NodeJS.Timeout | null>(null);
    
    const [filters, setFilters] = useState<RequestFiltersType>({
        searchRadius: 50,
        statusFilter: 'pending',
        priorityFilter: 'all',
        typeFilter: 'all',
        myRequestsFilter: false,
        searchTerm: '',
        sortBy: 'distance_km',
        sortOrder: 'asc'
    });
    const [resourceFilters, setResourceFilters] = useState<ResourceFiltersType>({
        searchRadius: 50,
        availabilityFilter: 'available',
        typeFilter: 'all',
        myResourcesFilter: false,
        searchTerm: '',
        sortBy: 'distance_km',
        sortOrder: 'asc'
    });

    // Modal state for viewing details
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
    const [requestComments, setRequestComments] = useState<any[]>([]);
    const [loadingRequestComments, setLoadingRequestComments] = useState(false);

    const [showResourceModal, setShowResourceModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState<ReliefResource | null>(null);
    const fetchResourceData = async () => {
        if(!activeCoords) return;
        
        try {
            const base = getApiBaseUrl();

            let resUrl = `${base.replace(/\/$/, '')}/api/resources?lat=${activeCoords.lat}&lng=${activeCoords.lng}&radius_km=${resourceFilters.searchRadius}`;
            
            // Add filter parameters
            if (resourceFilters.availabilityFilter !== 'all') resUrl += `&availability=${resourceFilters.availabilityFilter}`;
            if (resourceFilters.typeFilter !== 'all') resUrl += `&resource_type=${resourceFilters.typeFilter}`;
            if (resourceFilters.searchTerm.trim()) resUrl += `&search=${encodeURIComponent(resourceFilters.searchTerm.trim())}`;

            const resRes = await api.get(resUrl, { headers: { Accept: 'application/json' } });
            const resItems = (resRes.data && resRes.data.success) ? resRes.data.data.map((it: any) => ({
                id: it.id,
                location: it.location || `${it.lat},${it.lng}`,
                address: it.address,
                contact: it.contact,
                resource_type: it.resource_type,
                details: it.details || '',
                capacity: it.capacity,
                availability: it.availability || 'available',
                distance_km: it.distance_km,
                timestamp: new Date(it.created_at || Date.now()),
                lat: parseFloat(it.lat),
                lng: parseFloat(it.lng),
                photos: it.photos ? (typeof it.photos === 'string' ? JSON.parse(it.photos) : it.photos) : undefined,
            })) : [];

            setResources(resItems);
        } catch (e) {
            console.error('Failed to fetch resource data', e);
            // Keep existing resources on error
        }
    };
    
    // Debounced fetch for requests
    useEffect(() => {
        if (!activeCoords) return;

        if (debounceRequestsRef.current) {
            clearTimeout(debounceRequestsRef.current);
        }

        debounceRequestsRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const base = getApiBaseUrl();
                let reqUrl = `${base.replace(/\/$/, '')}/api/requests?lat=${activeCoords.lat}&lng=${activeCoords.lng}&radius_km=${filters.searchRadius}`;

                // Add filter parameters for nearby search
                if (filters.statusFilter !== 'all') reqUrl += `&status=${filters.statusFilter}`;
                if (filters.priorityFilter !== 'all') reqUrl += `&priority=${filters.priorityFilter}`;
                if (filters.typeFilter !== 'all') reqUrl += `&request_type=${filters.typeFilter}`;
                if (filters.searchTerm.trim()) reqUrl += `&search=${encodeURIComponent(filters.searchTerm.trim())}`;

                console.log('🗺️ Landing: Fetching requests for coords:', activeCoords, 'URL:', reqUrl);

                const resReq = await api.get(reqUrl, { headers: { Accept: 'application/json' } });
                const reqItems = (resReq.data && resReq.data.success) ? resReq.data.data.map((it: any) => ({
                    id: it.id,
                    location: it.location || `${it.lat},${it.lng}`,
                    address: it.address,
                    contact: it.contact,
                    priority: it.priority || 'Low',
                    request_type: it.request_type,
                    details: it.details || '',
                    distance_km: it.distance_km,
                    timestamp: new Date(it.created_at || Date.now()),
                    lat: parseFloat(it.lat),
                    lng: parseFloat(it.lng),
                    photos: it.photos ? JSON.parse(it.photos) : undefined,
                    videos: it.videos ? JSON.parse(it.videos) : undefined,
                    status: it.status || 'pending',
                })) : [];

                console.log('🗺️ Landing: Found', reqItems.length, 'requests for coords:', activeCoords);
                setRequests(reqItems);
            } catch (e) {
                console.error('Landing requests fetch failed', e);
                // Keep existing requests on error
            } finally {
                setLoading(false);
            }
        }, 1000);

        return () => {
            if (debounceRequestsRef.current) {
                clearTimeout(debounceRequestsRef.current);
            }
        };
    }, [activeCoords, filters]);
    
    // Debounced fetch for resources
    useEffect(() => {
        if (!activeCoords) return;

        if (debounceResourcesRef.current) {
            clearTimeout(debounceResourcesRef.current);
        }

        debounceResourcesRef.current = setTimeout(async () => {
            // Inline the resource fetch logic to use current activeCoords
            try {
                const base = getApiBaseUrl();

                let resUrl = `${base.replace(/\/$/, '')}/api/resources?lat=${activeCoords.lat}&lng=${activeCoords.lng}&radius_km=${resourceFilters.searchRadius}`;
                
                // Add filter parameters
                if (resourceFilters.availabilityFilter !== 'all') resUrl += `&availability=${resourceFilters.availabilityFilter}`;
                if (resourceFilters.typeFilter !== 'all') resUrl += `&resource_type=${resourceFilters.typeFilter}`;
                if (resourceFilters.searchTerm.trim()) resUrl += `&search=${encodeURIComponent(resourceFilters.searchTerm.trim())}`;

                console.log('🗺️ Landing: Fetching resources for coords:', activeCoords, 'URL:', resUrl);

                const resRes = await api.get(resUrl, { headers: { Accept: 'application/json' } });
                const resItems = (resRes.data && resRes.data.success) ? resRes.data.data.map((it: any) => ({
                    id: it.id,
                    location: it.location || `${it.lat},${it.lng}`,
                    address: it.address,
                    contact: it.contact,
                    resource_type: it.resource_type,
                    details: it.details || '',
                    capacity: it.capacity,
                    availability: it.availability || 'available',
                    distance_km: it.distance_km,
                    timestamp: new Date(it.created_at || Date.now()),
                    lat: parseFloat(it.lat),
                    lng: parseFloat(it.lng),
                    photos: it.photos ? (typeof it.photos === 'string' ? JSON.parse(it.photos) : it.photos) : undefined,
                })) : [];

                console.log('🗺️ Landing: Found', resItems.length, 'resources for coords:', activeCoords);
                setResources(resItems);
            } catch (e) {
                console.error('Failed to fetch resource data', e);
                // Keep existing resources on error
            }
        }, 1000);

        return () => {
            if (debounceResourcesRef.current) {
                clearTimeout(debounceResourcesRef.current);
            }
        };
    }, [activeCoords, resourceFilters]);
    // Expose helpers for map popup buttons (RequestMap/ResourceMap use window.openRequestModal)
    useEffect(() => {
        (window as any).openRequestModal = (r: ReliefRequest) => {
            setSelectedRequest(r);
            setShowRequestModal(true);
        };
        (window as any).openResourceModal = (res: ReliefResource) => {
            setSelectedResource(res);
            setShowResourceModal(true);
        };

        return () => {
            try { delete (window as any).openRequestModal; } catch { }
            try { delete (window as any).openResourceModal; } catch { }
        };
    }, []);

    // Handler for exploration location changes from the maps
    const handleExploreLocationChange = (coords: { lat: number; lng: number } | null) => {
        console.log('🗺️ Landing: Explore location changed to', coords);
        console.log('🗺️ Landing: Will trigger data refresh with new coordinates');
        // Track exploration activity
        ReactGA4.event('map_exploration', {
            content_type: 'landing_page',
            has_explore_location: !!coords,
            explore_lat: coords?.lat,
            explore_lng: coords?.lng
        });
    };

    // Define columns for request table
    const requestColumns: DataTableColumn[] = [
        {
            key: 'location',
            label: 'Location',
            sortable: true,
        },
        {
            key: 'request_type',
            label: 'Type',
            sortable: true,
            render: (value) => value ? <IonBadge color="primary">{value}</IonBadge> : null
        },
        {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            render: (value) => {
                const color = value?.toLowerCase() === 'high' ? 'danger' : 
                             value?.toLowerCase() === 'medium' ? 'warning' : 'success';
                return value ? <IonBadge color={color}>{value}</IonBadge> : null;
            }
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value) => {
                const color = value === 'pending' ? 'warning' : 
                             value === 'in-progress' ? 'primary' : 'success';
                return value ? <IonBadge color={color}>{value}</IonBadge> : null;
            }
        },
        {
            key: 'distance_km',
            label: 'Distance (km)',
            sortable: true,
            render: (value) => value !== undefined ? `${parseFloat(value).toFixed(1)} km` : ''
        },
        {
            key: 'contact',
            label: 'Contact',
            sortable: false,
            render: (value) => value ? <small>{value}</small> : ''
        },
        {
            key: 'details',
            label: 'Details',
            sortable: false,
            render: (value) => value ? <small>{value.substring(0, 100)}...</small> : ''
        }
    ];

    // Define columns for resource table
    const resourceColumns: DataTableColumn[] = [
        {
            key: 'location',
            label: 'Location',
            sortable: true,
        },
        {
            key: 'resource_type',
            label: 'Type',
            sortable: true,
            render: (value) => value ? <IonBadge color="primary">{value}</IonBadge> : null
        },
        {
            key: 'availability',
            label: 'Availability',
            sortable: true,
            render: (value) => {
                const color = value === 'available' ? 'success' : 
                             value === 'limited' ? 'warning' : 'medium';
                return value ? <IonBadge color={color}>{value}</IonBadge> : null;
            }
        },
        {
            key: 'capacity',
            label: 'Capacity',
            sortable: true,
        },
        {
            key: 'distance_km',
            label: 'Distance (km)',
            sortable: true,
            render: (value) => value !== undefined ? `${parseFloat(value).toFixed(1)} km` : ''
        },
        {
            key: 'contact',
            label: 'Contact',
            sortable: false,
            render: (value) => value ? <small>{value}</small> : ''
        },
        {
            key: 'address',
            label: 'Address',
            sortable: false,
            render: (value) => value ? <small>{value}</small> : ''
        }
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{t('app.title')}</IonTitle>
                    <IonButtons slot="end">
                        <LanguageSwitcher 
                            showPopover={showLanguagePopover}
                            setShowPopover={setShowLanguagePopover}
                        />
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {/* App Information Hero Section */}
                <div className="landing-hero-section">
                    <IonGrid>
                        <IonRow className="ion-align-items-center">
                            <IonCol size="12" sizeMd="8">
                                <div className="landing-hero-content">
                                    <h1 className="landing-hero-title">
                                        <IonIcon icon={heartOutline} className="landing-hero-icon" />
                                        {t('hero.title')}
                                    </h1>
                                    <p className="landing-hero-subtitle">
                                        {t('hero.subtitle')}
                                    </p>
                                    <div className="landing-hero-features">
                                        <div className="landing-feature-item">
                                            <IonIcon icon={mapOutline} />
                                            <span>{t('hero.features.map')}</span>
                                        </div>
                                        <div className="landing-feature-item">
                                            <IonIcon icon={handRightOutline} />
                                            <span>{t('hero.features.connect')}</span>
                                        </div>
                                    </div>
                                    <div className="landing-hero-description">
                                        <IonText color="medium">
                                            <p>
                                                {t('hero.description')}
                                            </p>
                                        </IonText>
                                    </div>
                                    
                                    {/* Tutorial Section */}
                                    <div className="landing-tutorial-section">
                                        <details className="landing-tutorial-details" onToggle={(e) => {
                                            if ((e.target as HTMLDetailsElement).open) {
                                                ReactGA4.event('tutorial_interaction', {
                                                    tutorial_section: 'main_tutorial',
                                                    action: 'opened'
                                                });
                                            }
                                        }}>
                                            <summary className="landing-tutorial-summary">
                                                <IonIcon icon={informationCircleOutline} />
                                                <span>{t('tutorial.title')}</span>
                                            </summary>
                                            <div className="landing-tutorial-content">
                                                {/* Authentication Flow Section */}
                                                <div className="tutorial-step tutorial-auth-flow">
                                                    <h4>� ਖਾਤਾ ਬਣਾਉਣਾ ਜ਼ਰੂਰੀ ਕਿਉਂ? (Why Create Account?)</h4>
                                                    <div className="auth-comparison">
                                                        <div className="without-login">
                                                            <h5>🔍 ਬਿਨਾ ਲਾਗਇਨ ਦੇਖ ਸਕਦੇ ਹੋ (View Without Login):</h5>
                                                            <p>✅ ਨਕਸ਼ੇ ਤੇ ਸਾਰੀਆਂ ਬੇਨਤੀਆਂ ਦੇਖਣਾ</p>
                                                            <p>✅ ਉਪਲੱਬਧ ਸਹਾਇਤਾ ਸਰੋਤ ਦੇਖਣਾ</p>
                                                            <p>✅ ਐਮਰਜੈਂਸੀ ਨੰਬਰ ਦੇਖਣਾ</p>
                                                            <p>✅ ਸੁਰੱਖਿਆ ਦੀਆਂ ਗੱਲਾਂ ਪੜ੍ਹਨਾ</p>
                                                        </div>
                                                        <div className="with-login">
                                                            <h5>�🚨 ਲਾਗਇਨ ਦੇ ਬਾਅਦ ਕਰ ਸਕਦੇ ਹੋ (After Login Can Do):</h5>
                                                            <p>🆘 <strong>ਮਦਦ ਮੰਗਣਾ</strong> - ਆਪਣੀ ਬੇਨਤੀ ਭੇਜਣਾ</p>
                                                            <p>🏥 <strong>ਸਹਾਇਤਾ ਦੇਣਾ</strong> - ਆਪਣੇ ਸਰੋਤ ਸਾਂਝੇ ਕਰਨਾ</p>
                                                            <p>💬 <strong>ਟਿੱਪਣੀਆਂ</strong> - ਬੇਨਤੀਆਂ ਤੇ ਜਵਾਬ ਦੇਣਾ</p>
                                                            <p>📊 <strong>ਡੈਸ਼ਬੋਰਡ</strong> - ਆਪਣੀਆਂ ਬੇਨਤੀਆਂ ਟਰੈਕ ਕਰਨਾ</p>
                                                            <p>📝 <strong>ਸਟੇਟਸ ਅਪਡੇਟ</strong> - ਬੇਨਤੀ ਦੀ ਹਾਲਤ ਬਦਲਣਾ</p>
                                                            <p>🗑️ <strong>ਮੈਨੇਜਮੈਂਟ</strong> - ਆਪਣੀਆਂ ਪੋਸਟਾਂ ਮਿਟਾਉਣਾ</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Account Creation Steps */}
                                                <div className="tutorial-step">
                                                    <h4>📝 ਖਾਤਾ ਬਣਾਉਣਾ (Sign Up Process)</h4>
                                                    <p><strong>ਕਦਮ 1:</strong> "Sign Up to Help" ਬਟਨ ਦਬਾਓ</p>
                                                    <p><strong>ਕਦਮ 2:</strong> ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ ਭਰੋ:</p>
                                                    <p>  • ਪੂਰਾ ਨਾਮ (ਜਿਵੇਂ: ਰਾਮ ਸਿੰਘ)</p>
                                                    <p>  • ਈਮੇਲ (ਜਿਵੇਂ: ram@gmail.com)</p>
                                                    <p>  • ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ)</p>
                                                    <p>  • ਪਾਸਵਰਡ (ਘੱਟੋ ਘੱਟ 8 ਅੱਖਰ)</p>
                                                    <p>  • ਪਤਾ (ਐਮਰਜੈਂਸੀ ਲਈ)</p>
                                                    <p><strong>ਕਦਮ 3:</strong> "Create Account" ਦਬਾਓ</p>
                                                </div>

                                                {/* Login Process */}
                                                <div className="tutorial-step">
                                                    <h4>🔑 ਲਾਗਇਨ ਕਰਨਾ (Login Process)</h4>
                                                    <p><strong>ਪਹਿਲੀ ਵਾਰ:</strong> ਖਾਤਾ ਬਣਨ ਤੋਂ ਬਾਅਦ ਆਪਣੇ ਆਪ ਲਾਗਇਨ ਹੋ ਜਾਓਗੇ</p>
                                                    <p><strong>ਅਗਲੀ ਵਾਰ:</strong> "Login" ਬਟਨ ਦਬਾ ਕੇ:</p>
                                                    <p>  • ਈਮੇਲ ਪਾਓ</p>
                                                    <p>  • ਪਾਸਵਰਡ ਪਾਓ</p>
                                                    <p>  • "Login" ਦਬਾਓ</p>
                                                    <p><strong>ਭੁੱਲ ਗਏ?</strong> "Forgot Password" ਵਰਤੋ</p>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>🚨 ਐਮਰਜੈਂਸੀ ਨੰਬਰ (Emergency Numbers)</h4>
                                                    <p><strong>112</strong> - ਯੂਰਪੀਅਨ ਐਮਰਜੈਂਸੀ | <strong>108</strong> - ਮੈਡੀਕਲ ਐਮਰਜੈਂਸੀ</p>
                                                    <p><em>ਇਹ ਨੰਬਰ ਬਿਨਾ ਲਾਗਇਨ ਵੀ ਕੰਮ ਕਰਦੇ ਹਨ!</em></p>
                                                    <IonButton 
                                                        fill="outline" 
                                                        size="small" 
                                                        color="danger"
                                                        onClick={() => {
                                                            ReactGA4.event('emergency_contact', {
                                                                contact_type: 'emergency_numbers',
                                                                action: 'emergency_numbers_viewed'
                                                            });
                                                        }}
                                                    >
                                                        📞 Emergency Contacts
                                                    </IonButton>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>📱 ਮਦਦ ਮੰਗਣਾ (Request Help) - ⚠️ ਲਾਗਇਨ ਚਾਹੀਦਾ</h4>
                                                    <p><strong>ਮਹੱਤਵਪੂਰਨ:</strong> ਮਦਦ ਮੰਗਣ ਲਈ ਪਹਿਲਾਂ ਲਾਗਇਨ ਕਰੋ</p>
                                                    <p>1. ਲਾਗਇਨ ਹੋਣ ਤੋਂ ਬਾਅਦ "Submit Relief Request" ਦਬਾਓ</p>
                                                    <p>2. ਆਪਣਾ ਪਤਾ ਅਤੇ ਮੋਬਾਈਲ ਨੰਬਰ ਦਿਓ</p>
                                                    <p>3. ਮਦਦ ਦੀ ਕਿਸਮ ਚੁਣੋ: ਖਾਣਾ, ਪਾਣੀ, ਦਵਾਈ, ਬਚਾਅ, ਰਹਿਣ ਦੀ ਜਗ੍ਹਾ</p>
                                                    <p>4. ਤਰਜੀਹ ਚੁਣੋ: High (ਜ਼ਰੂਰੀ), Medium, Low</p>
                                                    <p>5. ਤਸਵੀਰਾਂ ਜੋੜੋ ਅਤੇ "Submit Request" ਦਬਾਓ</p>
                                                </div>

                                                <div className="tutorial-step">
                                                    <h4>🏥 ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਨਾ (Provide Resources) - ⚠️ ਲਾਗਇਨ ਚਾਹੀਦਾ</h4>
                                                    <p><strong>ਮਦਦ ਕਰਨ ਲਈ:</strong></p>
                                                    <p>1. ਲਾਗਇਨ ਹੋਣ ਤੋਂ ਬਾਅਦ "Add Resource" ਦਬਾਓ</p>
                                                    <p>2. ਆਪਣੇ ਸਰੋਤ ਦੀ ਜਾਣਕਾਰੀ ਦਿਓ</p>
                                                    <p>3. ਉਪਲੱਬਧਤਾ ਅਤੇ ਸਮਰੱਥਾ ਦੱਸੋ</p>
                                                    <p>4. ਸੰਪਰਕ ਜਾਣਕਾਰੀ ਸਹੀ ਰੱਖੋ</p>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>🗺️ ਨਕਸ਼ਾ ਵਰਤਣਾ (Using Maps) - ✅ ਬਿਨਾ ਲਾਗਇਨ ਵੀ</h4>
                                                    <p><span className="map-legend-red">🔴</span> ਲਾਲ ਨਿਸ਼ਾਨ = ਮਦਦ ਚਾਹੀਦੀ ਹੈ</p>
                                                    <p><span className="map-legend-green">🟢</span> ਹਰੇ ਨਿਸ਼ਾਨ = ਮਦਦ ਉਪਲੱਬਧ ਹੈ</p>
                                                    <p>📍 ਬਟਨ ਦਬਾ ਕੇ ਆਪਣੀ ਲੋਕੇਸ਼ਨ ਲੱਭੋ</p>
                                                    <p><em>ਨਕਸ਼ਾ ਦੇਖਣ ਲਈ ਲਾਗਇਨ ਦੀ ਲੋੜ ਨਹੀਂ</em></p>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>💬 ਟਿੱਪਣੀਆਂ ਅਤੇ ਅਪਡੇਟ (Comments & Updates) - ⚠️ ਲਾਗਇਨ ਚਾਹੀਦਾ</h4>
                                                    <p><strong>ਟਿੱਪਣੀ ਕਰਨ ਲਈ:</strong></p>
                                                    <p>1. ਲਾਗਇਨ ਹੋਣਾ ਜ਼ਰੂਰੀ</p>
                                                    <p>2. ਕਿਸੇ ਬੇਨਤੀ ਤੇ ਕਲਿੱਕ ਕਰੋ</p>
                                                    <p>3. "Add Comment" ਬਕਸੇ ਵਿੱਚ ਲਿਖੋ</p>
                                                    <p>4. "Submit" ਬਟਨ ਦਬਾਓ</p>
                                                </div>

                                                <div className="tutorial-step">
                                                    <h4>📊 ਡੈਸ਼ਬੋਰਡ ਅਤੇ ਪ੍ਰੋਫਾਈਲ (Dashboard & Profile) - ⚠️ ਲਾਗਇਨ ਚਾਹੀਦਾ</h4>
                                                    <p><strong>ਆਪਣੀਆਂ ਬੇਨਤੀਆਂ ਦੇਖਣ ਲਈ:</strong></p>
                                                    <p>1. "Dashboard" ਬਟਨ ਦਬਾਓ</p>
                                                    <p>2. ਕੁੱਲ, ਪੂਰੀਆਂ, ਜਾਰੀ, ਬਾਕੀ ਬੇਨਤੀਆਂ ਦੇਖੋ</p>
                                                    <p>3. ਹਰੇਕ ਬੇਨਤੀ ਦਾ ਸਟੇਟਸ ਚੈੱਕ ਕਰੋ</p>
                                                    <p><strong>ਪ੍ਰੋਫਾਈਲ ਅਪਡੇਟ:</strong></p>
                                                    <p>• "Profile" ਟੈਬ → "Edit Profile" → ਜਾਣਕਾਰੀ ਬਦਲੋ</p>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>⚠️ ਸੁਰੱਖਿਆ ਦੀਆਂ ਗੱਲਾਂ (Safety Tips)</h4>
                                                    <p>✅ ਉੱਚੀ ਜਗ੍ਹਾ ਤੇ ਜਾਓ</p>
                                                    <p>✅ ਬਿਜਲੀ ਦਾ ਮੇਨ ਸਵਿੱਚ ਬੰਦ ਕਰੋ</p>
                                                    <p>❌ ਪਾਣੀ ਵਿੱਚ ਨਾ ਚੱਲੋ</p>
                                                    <p>❌ ਬਿਜਲੀ ਦੀਆਂ ਤਾਰਾਂ ਨਾ ਛੂਹੋ</p>
                                                </div>
                                                
                                                <div className="tutorial-step">
                                                    <h4>🎒 ਐਮਰਜੈਂਸੀ ਕਿੱਟ (Emergency Kit)</h4>
                                                    <p>• ਪਾਣੀ (3 ਦਿਨ ਲਈ) • ਡੱਬੇ ਵਾਲਾ ਖਾਣਾ • ਜਰੂਰੀ ਦਵਾਈਆਂ</p>
                                                    <p>• ਫਲੈਸ਼ਲਾਈਟ ਅਤੇ ਬੈਟਰੀਆਂ • ਮੋਬਾਈਲ ਚਾਰਜਰ/ਪਾਵਰ ਬੈਂਕ</p>
                                                </div>

                                                {/* User Journey Summary */}
                                                <div className="tutorial-step tutorial-journey">
                                                    <h4>🚀 ਤੁਹਾਡਾ ਸਫ਼ਰ (Your Journey)</h4>
                                                    <div className="journey-steps">
                                                        <div className="journey-step">
                                                            <span className="step-number">1</span>
                                                            <div className="step-content">
                                                                <strong>ਸ਼ੁਰੂਆਤ</strong> - ਪਹਿਲਾਂ ਨਕਸ਼ਾ ਦੇਖੋ, ਕੀ ਹੋ ਰਿਹਾ ਹੈ
                                                            </div>
                                                        </div>
                                                        <div className="journey-step">
                                                            <span className="step-number">2</span>
                                                            <div className="step-content">
                                                                <strong>ਖਾਤਾ ਬਣਾਓ</strong> - Sign Up ਕਰਕੇ ਸਿਸਟਮ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਓ
                                                            </div>
                                                        </div>
                                                        <div className="journey-step">
                                                            <span className="step-number">3</span>
                                                            <div className="step-content">
                                                                <strong>ਮਦਦ ਮੰਗੋ/ਦਿਓ</strong> - ਆਪਣੀ ਲੋੜ ਜਾਂ ਸਰੋਤ ਸਾਂਝੇ ਕਰੋ
                                                            </div>
                                                        </div>
                                                        <div className="journey-step">
                                                            <span className="step-number">4</span>
                                                            <div className="step-content">
                                                                <strong>ਜੁੜੇ ਰਹੋ</strong> - ਡੈਸ਼ਬੋਰਡ ਤੇ ਸਟੇਟਸ ਚੈੱਕ ਕਰੋ
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="tutorial-important">
                                                    <IonText color="primary">
                                                        <strong>ਯਾਦ ਰੱਖੋ: ਪਹਿਲਾਂ ਸੁਰੱਖਿਆ, ਫਿਰ ਮਦਦ। ਬਿਨਾ ਖਾਤੇ ਵੀ ਬਹੁਤ ਕੁਝ ਦੇਖ ਸਕਦੇ ਹੋ, ਪਰ ਮਦਦ ਮੰਗਣ ਲਈ ਖਾਤਾ ਬਣਾਉਣਾ ਜ਼ਰੂਰੀ ਹੈ। ਸਾਰੇ ਮਿਲ ਕੇ ਮੁਸ਼ਕਿਲ ਸਮੇਂ ਵਿੱਚ ਇੱਕ ਦੂਸਰੇ ਦੀ ਮਦਦ ਕਰਾਂਗੇ। 🙏</strong>
                                                    </IonText>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </IonCol>
                            <IonCol size="12" sizeMd="4">
                                <div className="landing-auth-section">
                                    <IonCard className="landing-auth-card">
                                        <IonCardContent>
                                            {isAuthenticated && user ? (
                                                // Show user information when logged in
                                                <>
                                                    <h3>{t('auth.welcome')}</h3>
                                                    <div className="landing-user-info">
                                                        <div className="landing-user-header">
                                                            <IonIcon icon={personOutline} />
                                                            <strong>{user.name || user.email}</strong>
                                                        </div>
                                                        {user.email && (
                                                            <div className="landing-user-details">
                                                                {user.email}
                                                            </div>
                                                        )}
                                                        {user.phone && (
                                                            <div className="landing-user-details">
                                                                📞 {user.phone}
                                                            </div>
                                                        )}
                                                        {user.address && (
                                                            <div className="landing-user-details landing-user-address">
                                                                📍 {user.address}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="landing-auth-buttons">
                                                        <IonRouterLink routerLink="/tabs/home">
                                                            <IonButton expand="block" color="primary" onClick={() => {
                                                                ReactGA4.event({
                                                                    category: 'User Interaction',
                                                                    action: 'Dashboard Button Clicked',
                                                                    label: 'Authenticated user clicked dashboard'
                                                                });
                                                            }}>
                                                                <IonIcon icon={homeOutline} slot="start" />
                                                                {t('auth.dashboard')}
                                                            </IonButton>
                                                        </IonRouterLink>
                                                        <IonButton expand="block" fill="outline" color="medium" onClick={() => {
                                                            ReactGA4.event({
                                                                category: 'User Interaction',
                                                                action: 'Logout Button Clicked',
                                                                label: 'User initiated logout from landing page'
                                                            });
                                                            logout();
                                                        }}>
                                                            <IonIcon icon={logOutOutline} slot="start" />
                                                            {t('auth.logout')}
                                                        </IonButton>
                                                    </div>
                                                    <IonText color="medium">
                                                        <small>{t('auth.manageRequests')}</small>
                                                    </IonText>
                                                </>
                                            ) : (
                                                // Show login/signup when not authenticated
                                                <>
                                                    <h3>{t('auth.helpSaveLives')}</h3>
                                                    <IonText color="medium">
                                                        <p>{t('auth.joinNetwork')}</p>
                                                    </IonText>
                                                    <div className="landing-auth-buttons">
                                                        <IonRouterLink routerLink="/signup">
                                                            <IonButton expand="block" color="primary" onClick={() => {
                                                                ReactGA4.event({
                                                                    category: 'User Interaction',
                                                                    action: 'Signup Button Clicked',
                                                                    label: 'User clicked signup from landing page'
                                                                });
                                                            }}>
                                                                <IonIcon icon={personAddOutline} slot="start" />
                                                                {t('auth.signUpToHelp')}
                                                            </IonButton>
                                                        </IonRouterLink>
                                                        <IonRouterLink routerLink="/login">
                                                            <IonButton expand="block" fill="outline" color="primary" onClick={() => {
                                                                ReactGA4.event({
                                                                    category: 'User Interaction',
                                                                    action: 'Login Button Clicked',
                                                                    label: 'User clicked login from landing page'
                                                                });
                                                            }}>
                                                                <IonIcon icon={logInOutline} slot="start" />
                                                                {t('auth.login')}
                                                            </IonButton>
                                                        </IonRouterLink>
                                                    </div>
                                                    <IonText color="medium">
                                                        <small>{t('auth.viewWithoutAccount')}</small>
                                                    </IonText>
                                                </>
                                            )}
                                        </IonCardContent>
                                    </IonCard>
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </div>

                <IonGrid className="landing-grid">
                    <IonRow>
                        <IonCol size="12">
                            {/* Stats Summary Section */}
                            <div className="landing-stats-section">
                                <IonCard className="landing-stats-card">
                                    <IonCardContent>
                                        <div className="landing-stats-grid">
                                            <div className="landing-stat-item">
                                                <div className="landing-stat-count">
                                                    <IonText color="danger">
                                                        <h2>{requests.length}</h2>
                                                    </IonText>
                                                </div>
                                                <div className="landing-stat-label">
                                                    <IonText color="medium">
                                                        <p>{t('stats.reliefRequests')}</p>
                                                    </IonText>
                                                    <IonBadge color="danger">{t('stats.helpNeeded')}</IonBadge>
                                                </div>
                                            </div>
                                            <div className="landing-stat-divider"></div>
                                            <div className="landing-stat-item">
                                                <div className="landing-stat-count">
                                                    <IonText color="success">
                                                        <h2>{resources.length}</h2>
                                                    </IonText>
                                                </div>
                                                <div className="landing-stat-label">
                                                    <IonText color="medium">
                                                        <p>{t('stats.reliefResources')}</p>
                                                    </IonText>
                                                    <IonBadge color="success">{t('stats.helpAvailable')}</IonBadge>
                                                </div>
                                            </div>
                                        </div>
                                        {loading && (
                                            <div className="landing-stats-loading">
                                                <IonSpinner name="crescent" />
                                                <IonText color="medium">
                                                    <small>{t('requests.loadingText')}</small>
                                                </IonText>
                                            </div>
                                        )}
                                    </IonCardContent>
                                </IonCard>
                            </div>

                            <div className="landing-segment-wrap">
                                <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as 'map' | 'data' | 'table')}>
                                    <IonSegmentButton value="map">
                                        <IonLabel>{t('navigation.mapView')}</IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton value="data">
                                        <IonLabel>{t('navigation.listView')}</IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton value="table">
                                        <IonLabel>{t('navigation.tableView')}</IonLabel>
                                    </IonSegmentButton>
                                </IonSegment>
                            </div>
                        </IonCol>

                        {/* Maps side */}
                        <IonCol size="12" sizeMd="6" className={`landing-tab-content ${activeTab !== 'map' ? 'hidden' : ''}`}>
                            <IonCard style={{ height: '90vh' }}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        {t('requests.title')} 
                                        <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                                            {requests.length}
                                        </IonBadge>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText color="medium"><p>{t('requests.subtitle')}</p></IonText>
                                    <div className="landing-map-wrapper">
                                        <RequestMap 
                                            requests={requests} 
                                            isVisible={activeTab === 'map'} 
                                            onExploreLocationChange={handleExploreLocationChange}
                                        />
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        <IonCol size="12" sizeMd="6" className={`landing-tab-content ${activeTab !== 'map' ? 'hidden' : ''}`}>
                            <IonCard style={{ height: '90vh' }}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        {t('resources.title')} 
                                        <IonBadge color="success" style={{ marginLeft: '8px' }}>
                                            {resources.length}
                                        </IonBadge>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText color="medium"><p>{t('resources.subtitle')}</p></IonText>
                                    <div className="landing-map-wrapper">
                                        <ResourceMap 
                                            resources={resources} 
                                            isVisible={activeTab === 'map'} 
                                            onExploreLocationChange={handleExploreLocationChange}
                                        />
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        {/* Data / List side - show lists and filters */}
                        <IonCol size="12" sizeMd="6" className={`landing-tab-content ${activeTab !== 'data' ? 'hidden' : ''}`}>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        {t('requests.title')} 
                                        <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                                            {requests.length}
                                        </IonBadge>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText color="medium"><p>{t('requests.subtitle')}</p></IonText>
                                    { requests.length === 0 ? (
                                        <div className="landing-no-results"><IonText color="medium"><p>{t('requests.noRequests')}</p></IonText></div>
                                    ) : (
                                        <IonList>
                                            {requests.map((r: any) => (
                                                <IonCard key={r.id} button onClick={() => { 
                                                    ReactGA4.event('select_content', {
                                                        content_type: 'relief_request',
                                                        item_id: r.id.toString(),
                                                        request_type: r.request_type,
                                                        priority: r.priority,
                                                        status: r.status
                                                    });
                                                    setSelectedRequest(r); 
                                                    setShowRequestModal(true); 
                                                }}>
                                                    <IonCardContent>
                                                        <div className="landing-request-row">
                                                            <div>
                                                                <h3 className="landing-request-title">
                                                                    {r.location}
                                                                    <IonBadge color="medium" style={{ marginLeft: '8px', fontSize: '0.6em' }}>
                                                                        ID: {r.id}
                                                                    </IonBadge>
                                                                </h3>
                                                                <div className="landing-request-meta">
                                                                    <small>{r.request_type || ''}</small>
                                                                    {r.address && <small>• {r.address}</small>}
                                                                    {r.distance_km !== undefined && <small>• {parseFloat(r.distance_km + "" || "0").toFixed(1)} km</small>}
                                                                </div>
                                                            </div>
                                                            <div className="landing-request-right">
                                                                {r.priority && <div className="landing-request-priority">{r.priority}</div>}
                                                                {r.status && <div className="landing-request-status">{r.status}</div>}
                                                            </div>
                                                        </div>

                                                        <p>{r.details}</p>

                                                        {r.contact && <div><small><strong>Contact:</strong> {r.contact}</small></div>}

                                                        <div className="landing-request-footer">
                                                            <IonButton size="small" fill="outline" onClick={(e) => { e.stopPropagation(); setSelectedRequest(r); setShowRequestModal(true); }}>{t('requests.view')}</IonButton>
                                                            {r.lat && r.lng && (
                                                                <IonButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir//${r.lat},${r.lng}`, '_blank'); }}>{t('requests.directions')}</IonButton>
                                                            )}
                                                        </div>
                                                    </IonCardContent>
                                                </IonCard>
                                            ))}
                                        </IonList>
                                    )}
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        <IonCol size="12" sizeMd="6" style={{ display: activeTab === 'data' ? 'block' : 'none' }}>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        Where help is available 
                                        <IonBadge color="success" style={{ marginLeft: '8px' }}>
                                            {resources.length}
                                        </IonBadge>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText color="medium"><p>Resources</p></IonText>
                                    { resources.length === 0 ? (
                                        <div className="landing-no-results"><IonText color="medium"><p>No resources found nearby</p></IonText></div>
                                    ) : (
                                        <IonList>
                                            {resources.map((res: any) => (
                                                <IonCard key={res.id} className="landing-resource-card" button onClick={() => { 
                                                    ReactGA4.event('select_content', {
                                                        content_type: 'relief_resource',
                                                        item_id: res.id.toString(),
                                                        resource_type: res.resource_type,
                                                        availability: res.availability,
                                                        capacity: res.capacity
                                                    });
                                                    setSelectedResource(res); 
                                                    setShowResourceModal(true); 
                                                }}>
                                                    <IonCardContent>
                                                        <div className="landing-resource-row">
                                                            <h3 className="landing-resource-title">
                                                                {res.location || res.address || 'Resource'}
                                                                <IonBadge color="medium" style={{ marginLeft: '8px', fontSize: '0.6em' }}>
                                                                    ID: {res.id}
                                                                </IonBadge>
                                                            </h3>
                                                            <div className="landing-resource-meta">
                                                                {res.resource_type && <IonBadge color="primary">{res.resource_type}</IonBadge>}
                                                                {res.availability && <IonBadge color={res.availability === 'available' ? 'success' : res.availability === 'limited' ? 'warning' : 'medium'}>{res.availability}</IonBadge>}
                                                            </div>
                                                        </div>

                                                        {res.capacity !== undefined && (
                                                            <div><small><strong>Capacity:</strong> {res.capacity}</small></div>
                                                        )}

                                                        {res.address && (
                                                            <div><small><strong>Address:</strong> {res.address}</small></div>
                                                        )}

                                                        {res.distance_km !== undefined && (
                                                            <div><small><strong>Distance:</strong> {parseFloat(res.distance_km + "" || "0").toFixed(1)} km</small></div>
                                                        )}

                                                        {res.contact && (
                                                            <div><small><strong>Contact:</strong> {res.contact}</small></div>
                                                        )}

                                                        {res.reporter_name && (
                                                            <div><small><strong>Provided by:</strong> {res.reporter_name}</small></div>
                                                        )}

                                                        {res.timestamp && (
                                                            <div><small className="landing-resource-timestamp">{new Date(res.timestamp).toLocaleString()}</small></div>
                                                        )}

                                                        <div className="landing-resource-footer">
                                                            <IonButton size="small" fill="outline" onClick={(e) => { e.stopPropagation(); setSelectedResource(res); setShowResourceModal(true); }}>View</IonButton>
                                                            {res.lat && res.lng && (
                                                                <IonButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir//${res.lat},${res.lng}`, '_blank'); }}>Directions</IonButton>
                                                            )}
                                                        </div>
                                                    </IonCardContent>
                                                </IonCard>
                                            ))}
                                        </IonList>
                                    )}
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        {/* Table View */}
                        <IonCol size="12" style={{ display: activeTab === 'table' ? 'block' : 'none' }}>
                                    <IonCard>
                                        <IonCardHeader>
                                            <IonCardTitle>
                                                {t('stats.reliefRequests')} 
                                                <IonBadge color="danger" style={{ marginLeft: '8px' }}>
                                                    {requests.length}
                                                </IonBadge>
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <DataTable
                                                data={requests}
                                                columns={requestColumns}
                                                loading={false}
                                                onRowClick={(request) => {
                                                    ReactGA4.event('select_content', {
                                                        content_type: 'relief_request',
                                                        item_id: request.id.toString(),
                                                        request_type: request.request_type,
                                                        priority: request.priority,
                                                        status: request.status
                                                    });
                                                    setSelectedRequest(request);
                                                    setShowRequestModal(true);
                                                }}
                                                emptyMessage={t('requests.noRequests')}
                                            />
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>

                                <IonCol size="12"  style={{ display: activeTab === 'table' ? 'block' : 'none' }}>
                                    <IonCard>
                                        <IonCardHeader>
                                            <IonCardTitle>
                                                {t('stats.reliefResources')} 
                                                <IonBadge color="success" style={{ marginLeft: '8px' }}>
                                                    {resources.length}
                                                </IonBadge>
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <DataTable
                                                data={resources}
                                                columns={resourceColumns}
                                                loading={false}
                                                onRowClick={(resource) => {
                                                    ReactGA4.event('select_content', {
                                                        content_type: 'relief_resource',
                                                        item_id: resource.id.toString(),
                                                        resource_type: resource.resource_type,
                                                        availability: resource.availability,
                                                        capacity: resource.capacity
                                                    });
                                                    setSelectedResource(resource);
                                                    setShowResourceModal(true);
                                                }}
                                                emptyMessage={t('resources.noResources')}
                                            />
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>
                    </IonRow>
                </IonGrid>
                {/* Mount floating FAB filter controls directly under IonContent so they can use slot="fixed" and popovers work */}
                <>
                    <RequestFilters landing={true} filters={filters} onFiltersChange={(f) => {
                        ReactGA4.event('search', {
                            search_term: f.searchTerm || '',
                            filter_type: 'request_filters',
                            status_filter: f.statusFilter,
                            priority_filter: f.priorityFilter,
                            type_filter: f.typeFilter,
                            search_radius: f.searchRadius
                        });
                        setFilters(prev => ({ ...prev, ...f }));
                    }} />
                    <FloatingFilters filters={resourceFilters} onFiltersChange={(f) => {
                        ReactGA4.event('search', {
                            search_term: f.searchTerm || '',
                            filter_type: 'resource_filters',
                            availability_filter: f.availabilityFilter,
                            type_filter: f.typeFilter,
                            search_radius: f.searchRadius
                        });
                        setResourceFilters(prev => ({ ...prev, ...f }));
                    }} />
                </>

                {/* Detail modals for requests and resources */}
                <RequestModal
                    isOpen={showRequestModal}
                    request={selectedRequest}
                    comments={requestComments}
                    loadingComments={loadingRequestComments}
                    newComment={''}
                    onNewCommentChange={() => { }}
                    onSubmitComment={() => { }}
                    submittingComment={false}
                    isUserRequest={false}
                    onClose={() => setShowRequestModal(false)}
                    onStatusUpdate={() => { }}
                    onDeleteRequest={() => { }}
                    isAuthenticated={false}
                />

                <ResourceModal
                    isOpen={showResourceModal}
                    resource={selectedResource}
                    comments={[]}
                    loadingComments={false}
                    newComment={''}
                    onNewCommentChange={() => { }}
                    onSubmitComment={() => { }}
                    submittingComment={false}
                    isUserResource={false}
                    onClose={() => setShowResourceModal(false)}
                    onAvailabilityUpdate={() => { }}
                />
            </IonContent>
        </IonPage>
    );
};

export default Landing;
