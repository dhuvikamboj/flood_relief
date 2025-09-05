import React, { useEffect, useState } from 'react';
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
} from '@ionic/react';
import RequestMap from '../components/RequestMap';
import ResourceMap from '../components/ResourceMap';
import RequestFilters, { RequestFilters as RequestFiltersType } from '../components/RequestFilters';
import FloatingFilters from '../components/FloatingFilters';
import { ResourceFilters as ResourceFiltersType } from '../types/resource';
import RequestCard, { ReliefRequest } from '../components/RequestCard';
import RequestModal from '../components/RequestModal';
import ResourceModal from '../components/ResourceModal';
import { ReliefResource } from '../types/resource';
import { useLocation } from '../hooks/useLocation';
import api from '../../services/api';
import { logInOutline, personAddOutline, heartOutline, mapOutline, handRightOutline } from 'ionicons/icons';
import './Landing.css';

const Landing: React.FC = () => {
    const { userCoords } = useLocation();
    const [requests, setRequests] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
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
        if(!userCoords) return;
        const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';


        const resUrl = `${base.replace(/\/$/, '')}/api/resources?lat=${userCoords?.lat}&lng=${userCoords?.lng}&radius_km=10`;
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


    }
    useEffect(() => {
        const fetchData = async () => {
            if (!userCoords) return;
            setLoading(true);
            try {
                const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';

                let reqUrl = `${base.replace(/\/$/, '')}/api/requests?lat=${userCoords.lat}&lng=${userCoords.lng}`;
                reqUrl = `${base.replace(/\/$/, '')}/api/resources?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${resourceFilters.searchRadius}`;
                if (resourceFilters.availabilityFilter !== 'all') reqUrl += `&availability=${resourceFilters.availabilityFilter}`;
                if (resourceFilters.typeFilter !== 'all') reqUrl += `&resource_type=${resourceFilters.typeFilter}`;
                if (resourceFilters.searchTerm.trim()) reqUrl += `&search=${encodeURIComponent(resourceFilters.searchTerm.trim())}`;
                // Use regular nearby requests endpoint
                reqUrl = `${base.replace(/\/$/, '')}/api/requests?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${filters.searchRadius}`;

                // Add filter parameters for nearby search
                if (filters.statusFilter !== 'all') reqUrl += `&status=${filters.statusFilter}`;
                if (filters.priorityFilter !== 'all') reqUrl += `&priority=${filters.priorityFilter}`;
                if (filters.typeFilter !== 'all') reqUrl += `&request_type=${filters.typeFilter}`;
                if (filters.searchTerm.trim()) reqUrl += `&search=${encodeURIComponent(filters.searchTerm.trim())}`;

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

                const resUrl = `${base.replace(/\/$/, '')}/api/resources?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=10`;
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

                setRequests(reqItems);
            } catch (e) {
                // ignore network failures for now
                console.error('Landing fetch failed', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userCoords,filters]);
    useEffect(() => {
        fetchResourceData();
    }, [userCoords, resourceFilters]);
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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Maps — Help Needed & Available</IonTitle>
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
                                        Punjab Seva (Flood Relief)
                                    </h1>
                                    <p className="landing-hero-subtitle">
                                        Real-time coordination platform connecting flood victims with resources and volunteers
                                    </p>
                                    <div className="landing-hero-features">
                                        <div className="landing-feature-item">
                                            <IonIcon icon={mapOutline} />
                                            <span>Map relief requests & available resources</span>
                                        </div>
                                        <div className="landing-feature-item">
                                            <IonIcon icon={handRightOutline} />
                                            <span>Connect helpers with those in need</span>
                                        </div>
                                    </div>
                                    <div className="landing-hero-description">
                                        <IonText color="medium">
                                            <p>
                                                During flood emergencies, critical time is lost searching for help. 
                                                Our platform instantly connects victims needing rescue, supplies, or shelter 
                                                with nearby volunteers and resources.
                                            </p>
                                        </IonText>
                                    </div>
                                </div>
                            </IonCol>
                            <IonCol size="12" sizeMd="4">
                                <div className="landing-auth-section">
                                    <IonCard className="landing-auth-card">
                                        <IonCardContent>
                                            <h3>Help Save Lives</h3>
                                            <IonText color="medium">
                                                <p>Join our emergency response network</p>
                                            </IonText>
                                            <div className="landing-auth-buttons">
                                                <IonRouterLink routerLink="/signup">
                                                    <IonButton expand="block" color="primary">
                                                        <IonIcon icon={personAddOutline} slot="start" />
                                                        Sign Up to Help
                                                    </IonButton>
                                                </IonRouterLink>
                                                <IonRouterLink routerLink="/login">
                                                    <IonButton expand="block" fill="outline" color="primary">
                                                        <IonIcon icon={logInOutline} slot="start" />
                                                        Login
                                                    </IonButton>
                                                </IonRouterLink>
                                            </div>
                                            <IonText color="medium">
                                                <small>View live updates without account</small>
                                            </IonText>
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
                            <div className="landing-segment-wrap">
                                <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as 'map' | 'data')}>
                                    <IonSegmentButton value="map">
                                        <IonLabel>Map View</IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton value="data">
                                        <IonLabel>List View</IonLabel>
                                    </IonSegmentButton>
                                </IonSegment>
                            </div>
                        </IonCol>

                        {/* Maps side */}
                        {activeTab === 'map' && (
                            <>
                                <IonCol size="12" sizeMd="6">
                                    <IonCard style={{ height: '90vh' }}>
                                        <IonCardHeader>
                                            <IonCardTitle>Where help is needed</IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonText color="medium"><p>Relief requests reported in the area</p></IonText>
                                            <div className="landing-map-wrapper">
                                                <RequestMap requests={requests} />
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>

                                <IonCol size="12" sizeMd="6" >
                                    <IonCard style={{ height: '90vh' }}>
                                        <IonCardHeader>
                                            <IonCardTitle>Where help is available</IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonText color="medium"><p>Resources and volunteers offering assistance</p></IonText>
                                            <div className="landing-map-wrapper">
                                                <ResourceMap resources={resources} />
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                </IonCol>
                            </>
                        )}

                        {/* Data / List side - show lists and filters */}
                        {activeTab === 'data' && (
                            <>
                                <IonCol size="12" sizeMd="6">
                                    <IonCard>
                                        <IonCardHeader>
                                            <IonCardTitle>Where help is needed</IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonText color="medium"><p>Relief requests</p></IonText>
                                            {loading ? (
                                                <div className="landing-spinner-wrap"><IonSpinner name="crescent" /></div>
                                            ) : requests.length === 0 ? (
                                                <div className="landing-no-results"><IonText color="medium"><p>No relief requests in your area</p></IonText></div>
                                            ) : (
                                                <IonList>
                                                    {requests.map((r: any) => (
                                                        <IonCard key={r.id} button onClick={() => { setSelectedRequest(r); setShowRequestModal(true); }}>
                                                            <IonCardContent>
                                                                <div className="landing-request-row">
                                                                    <div>
                                                                        <h3 className="landing-request-title">{r.location}</h3>
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
                                                                    <IonButton size="small" fill="outline" onClick={(e) => { e.stopPropagation(); setSelectedRequest(r); setShowRequestModal(true); }}>View</IonButton>
                                                                    {r.lat && r.lng && (
                                                                        <IonButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir//${r.lat},${r.lng}`, '_blank'); }}>Directions</IonButton>
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

                                <IonCol size="12" sizeMd="6">
                                    <IonCard>
                                        <IonCardHeader>
                                            <IonCardTitle>Where help is available</IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <IonText color="medium"><p>Resources</p></IonText>
                                            {loading ? (
                                                <div className="landing-spinner-wrap"><IonSpinner name="crescent" /></div>
                                            ) : resources.length === 0 ? (
                                                <div className="landing-no-results"><IonText color="medium"><p>No resources found nearby</p></IonText></div>
                                            ) : (
                                                <IonList>
                                                    {resources.map((res: any) => (
                                                        <IonCard key={res.id} className="landing-resource-card" button onClick={() => { setSelectedResource(res); setShowResourceModal(true); }}>
                                                            <IonCardContent>
                                                                <div className="landing-resource-row">
                                                                    <h3 className="landing-resource-title">{res.location || res.address || 'Resource'}</h3>
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

                                {/* Floating filters are mounted as fixed children of IonContent below so the FAB/popover can position correctly */}
                            </>
                        )}
                    </IonRow>
                </IonGrid>
                {/* Mount floating FAB filter controls directly under IonContent so they can use slot="fixed" and popovers work */}
                <>
                    <RequestFilters landing={true} filters={filters} onFiltersChange={(f) => setFilters(prev => ({ ...prev, ...f }))} />
                    <FloatingFilters filters={resourceFilters} onFiltersChange={(f) => setResourceFilters(prev => ({ ...prev, ...f }))} />
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
