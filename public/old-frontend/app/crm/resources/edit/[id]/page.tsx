'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/service/service';
import { getAdminResourceById, updateResource } from '@/lib/actions';
import { toast } from 'sonner';
import { ResourceForm, ResourceFormData } from '../../components/ResourceForm';

const EditResourcePage = () => {
    const router = useRouter();
    const params = useParams();
    const resourceId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [initialData, setInitialData] = useState<Partial<ResourceFormData> & { iconPreview?: string | null } | null>(null);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                setFetching(true);
                const token = await getAuthToken();
                if (!token) {
                    toast.error('Authentication required');
                    router.push('/crm/resources');
                    return;
                }

                const response = await getAdminResourceById(token, resourceId);
                const resource = response.data || response;

                let iconPreview = null;
                if (resource.category_icon) {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
                    iconPreview = resource.category_icon.startsWith('http') ? resource.category_icon : `${baseUrl}${resource.category_icon}`;
                }

                setInitialData({
                    title: resource.title || '',
                    resource_type: resource.resource_type || '',
                    resource_url: resource.resource_url || '',
                    category: resource.category || '',
                    content: resource.content || '',
                    is_published: resource.is_published == '1' || resource.is_published === true,
                    activity: resource.seasonalData?.activity || '',
                    species: resource.seasonalData?.species || '',
                    season_name: resource.seasonalData?.season_name || '',
                    season_start: resource.seasonalData?.season_start || '',
                    season_end: resource.seasonalData?.season_end || '',
                    rules: resource.seasonalData?.rules || '',
                    iconPreview,
                    resource_file: resource.resource_file || null
                });

            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Failed to load resource data');
                router.push('/crm/resources');
            } finally {
                setFetching(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId, router]);

    const handleSubmit = async (formData: ResourceFormData) => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('resource_type', formData.resource_type);

            // Only append resource_url if it has a value
            if (formData.resource_url) {
                data.append('resource_url', formData.resource_url);
            }

            // data.append('category', formData.category); // Category update is typically disabled in edit
            data.append('content', formData.content || '');

            // Send as boolean string 'true' or 'false'
            data.append('is_published', String(formData.is_published));


            if (formData.category_icon) {
                data.append('category_icon', formData.category_icon);
            }

            if (formData.resource_file) {
                data.append('resource_file', formData.resource_file);
            }

            if (formData.category === 'Season Dates') {
                data.append('activity', formData.activity);
                data.append('species', formData.species);
                data.append('season_name', formData.season_name);
                data.append('season_start', formData.season_start);
                data.append('season_end', formData.season_end);
                data.append('rules', formData.rules);
            }

            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await updateResource(token, resourceId, data);
            toast.success('Resource updated successfully');
            router.push('/crm/resources');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update resource');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Loading resource details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <ResourceForm
                initialData={initialData || {}}
                onSubmit={handleSubmit}
                loading={loading}
                isEdit={true}
                title="Update Resource"
                submitLabel="Update Resource"
            />
        </div>
    );
};

export default EditResourcePage;
