'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/service/service';
import { createResource } from '@/lib/actions';
import { toast } from 'sonner';
import { ResourceForm, ResourceFormData } from '../components/ResourceForm';

const CreateResourcePage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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

            data.append('category', formData.category);
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

            await createResource(token, data);
            toast.success('Resource created successfully');
            router.push('/crm/resources');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <ResourceForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Add Resource"
                submitLabel="Save Resource"
            />
        </div>
    );
};

export default CreateResourcePage;
