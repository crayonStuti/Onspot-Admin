'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Save,
    CreditCard,
    Type,
    FileText,
    DollarSign,
    Calendar,
    Settings,
    ChevronLeft,
    Check,
    X,
    Loader2
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getMembershipById, updateMembership } from '@/lib/actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const EditMembershipPage = () => {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_usd: '',
        duration_days: '',
    });

    const [features, setFeatures] = useState({
        front_end_pages: true,
        license_wallet: '3',
        gps_mapping_basic: true,
        extended_mapping_friends: '3',
        dnr_library_access: true,
        post_tagging: 'unlimited',
        social_media_channels: 'unlimited',
        kids_included: 1,
        ads_displayed: 'optional',
        license_expiry_alerts: true,
        location_setting: 'optional'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchMembership = async () => {
            try {
                const token = await getAuthToken();
                if (!token) {
                    toast.error('Authentication required');
                    router.push('/crm/memberships');
                    return;
                }

                const response = await getMembershipById(token, id);
                // The API returns { membership: { ... } }
                const membership = response.membership || response;

                setFormData({
                    name: membership.name || '',
                    description: membership.description || '',
                    price_usd: String(membership.price_usd ?? ''),
                    duration_days: String(membership.duration_days ?? ''),
                });

                if (membership.feature) {
                    try {
                        const parsedFeatures = typeof membership.feature === 'string'
                            ? JSON.parse(membership.feature)
                            : membership.feature;

                        setFeatures(prev => ({ ...prev, ...parsedFeatures }));
                    } catch (parseError) {
                        console.warn('⚠️ Failed to parse features, using default:', parseError);
                        console.warn('⚠️ Raw feature value:', membership.feature);
                        toast.warning(`Feature data is not in JSON format. Using default features.`);
                        // Keep default features if parsing fails
                    }
                }

                if (membership.image) {
                    setImagePreview(`${process.env.NEXT_PUBLIC_BASE_URL}${membership.image}`);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to fetch membership details');
                router.push('/crm/memberships');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchMembership();
        }
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureChange = (name: string, value: any) => {
        setFeatures(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();



        // Trim values and check
        const name = formData.name?.trim();
        const price = formData.price_usd?.trim();
        const duration = formData.duration_days?.trim();



        // Check which fields are missing
        const missingFields = [];
        if (!name) missingFields.push('Name');
        if (price === '' || price === undefined || price === null) missingFields.push('Price');
        if (duration === '' || duration === undefined || duration === null) missingFields.push('Duration');

        if (missingFields.length > 0) {
            console.error('❌ Validation failed. Missing fields:', missingFields);
            toast.error(`Please fill in: ${missingFields.join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            const formPayload = new FormData();
            formPayload.append('name', formData.name);
            formPayload.append('description', formData.description || '');
            formPayload.append('price_usd', formData.price_usd);
            formPayload.append('duration_days', formData.duration_days);

            Object.entries(features).forEach(([key, value]) => {
                formPayload.append(`feature[${key}]`, String(value));
            });

            if (imageFile) {
                formPayload.append('image', imageFile);
            }

            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await updateMembership(token, id, formPayload);
            toast.success('Membership updated successfully');
            router.push('/crm/memberships');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update membership');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Loading Membership...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Link href="/crm/memberships" className="hover:text-blue-600 transition-colors">Memberships</Link>
                            <span>&gt;</span>
                            <span className="font-medium text-foreground">Edit</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                            Edit Membership
                        </h1>
                        <p className="text-sm text-muted-foreground italic">
                            Modify <span className="text-blue-600 font-medium font-not-italic">{formData.name || 'membership'}</span> tier details
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="bg-background border-border text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-border shadow-sm bg-card">
                            <div className="px-6 py-4 border-b border-border bg-muted/30">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                    Basic Info
                                </h2>
                            </div>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500">
                                            <Type className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="e.g. Premium"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price_usd" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Price (USD) *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="price_usd"
                                            name="price_usd"
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 29.99"
                                            value={formData.price_usd}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_days" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Duration (Days) *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="duration_days"
                                            name="duration_days"
                                            type="number"
                                            placeholder="e.g. 365"
                                            value={formData.duration_days}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            placeholder="Describe this membership tier..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="pl-10 pt-2 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Image</Label>
                                    <Input
                                        id="image"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="h-11"
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img src={imagePreview} alt="Membership preview" className="h-24 w-auto rounded-md border border-border" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Features Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border shadow-sm bg-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                    Membership Features
                                </h2>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded uppercase tracking-widest">Configure Access</span>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* BOOLEAN FEATURES */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-2">Boolean Access</h3>

                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Front End Pages</Label>
                                                <p className="text-[10px] text-muted-foreground">Access to member-only pages</p>
                                            </div>
                                            <Checkbox
                                                checked={!!features.front_end_pages}
                                                onCheckedChange={(checked) => handleFeatureChange('front_end_pages', !!checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">GPS Mapping Basic</Label>
                                                <p className="text-[10px] text-muted-foreground">Basic mapping functionality</p>
                                            </div>
                                            <Checkbox
                                                checked={!!features.gps_mapping_basic}
                                                onCheckedChange={(checked) => handleFeatureChange('gps_mapping_basic', !!checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">DNR Library Access</Label>
                                                <p className="text-[10px] text-muted-foreground">Access to digital resources</p>
                                            </div>
                                            <Checkbox
                                                checked={!!features.dnr_library_access}
                                                onCheckedChange={(checked) => handleFeatureChange('dnr_library_access', !!checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">License Expiry Alerts</Label>
                                                <p className="text-[10px] text-muted-foreground">Automatic notifications</p>
                                            </div>
                                            <Checkbox
                                                checked={!!features.license_expiry_alerts}
                                                onCheckedChange={(checked) => handleFeatureChange('license_expiry_alerts', !!checked)}
                                            />
                                        </div>
                                    </div>

                                    {/* QUANTITY/OPTIONS FEATURES */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-2">Limits & Settings</h3>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">License Wallet Limit</Label>
                                            <Input
                                                value={features.license_wallet}
                                                onChange={(e) => handleFeatureChange('license_wallet', e.target.value)}
                                                placeholder="e.g. 3 or unlimited"
                                                className="h-10 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extended Mapping Friends</Label>
                                            <Input
                                                value={features.extended_mapping_friends}
                                                onChange={(e) => handleFeatureChange('extended_mapping_friends', e.target.value)}
                                                placeholder="e.g. 3 or unlimited"
                                                className="h-10 text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Post Tagging</Label>
                                                <Input
                                                    value={features.post_tagging}
                                                    onChange={(e) => handleFeatureChange('post_tagging', e.target.value)}
                                                    placeholder="unlimited"
                                                    className="h-10 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Social Media Channels</Label>
                                                <Input
                                                    value={features.social_media_channels}
                                                    onChange={(e) => handleFeatureChange('social_media_channels', e.target.value)}
                                                    placeholder="unlimited"
                                                    className="h-10 text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kids Included</Label>
                                            <Input
                                                type="number"
                                                value={features.kids_included}
                                                onChange={(e) => handleFeatureChange('kids_included', parseInt(e.target.value) || 0)}
                                                className="h-10 text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ads Displayed</Label>
                                                <Select value={features.ads_displayed} onValueChange={(v) => handleFeatureChange('ads_displayed', v)}>
                                                    <SelectTrigger className="h-10 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                        <SelectItem value="no">No</SelectItem>
                                                        <SelectItem value="optional">Optional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location Setting</Label>
                                                <Select value={features.location_setting} onValueChange={(v) => handleFeatureChange('location_setting', v)}>
                                                    <SelectTrigger className="h-10 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="on">On</SelectItem>
                                                        <SelectItem value="off">Off</SelectItem>
                                                        <SelectItem value="optional">Optional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditMembershipPage;
