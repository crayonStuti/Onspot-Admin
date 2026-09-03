'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
    Save,
    Info,
    Globe,
    Type,
    FileText,
    CheckCircle2,
    ImagePlus,
    X
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getLicenseTypes } from '@/lib/actions';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RulesTable } from '@/components/RulesTable';

import { z } from 'zod';

const CATEGORIES = [
    'DNR Website',
    'DOWNLOAD GUIDES - MAPS-PDF',
    'Hunting Regulations - PDF',
    'License Regulations - PDF',
    'Safety & Ethics - PDF',
    'Season Dates'
];

const RESOURCE_TYPES = [
    { label: 'Guide', value: 'guide' },
    { label: 'Regulation', value: 'regulation' },
    { label: 'DNR', value: 'dnr' }
];

const urlSchema = z.string().refine(
    (val) => !val || val.startsWith('https://'),
    { message: 'URL must start with https://' }
);

export interface ResourceFormData {
    title: string;
    resource_type: string;
    resource_url: string;
    category: string;
    content: string;
    is_published: boolean;
    category_icon: File | null;
    resource_file: File | string | null;
    activity: string;
    species: string;
    season_name: string;
    season_start: string;
    season_end: string;
    rules: string;
}

interface ResourceFormProps {
    initialData?: Partial<ResourceFormData> & { iconPreview?: string | null };
    onSubmit: (data: ResourceFormData) => Promise<void>;
    loading: boolean;
    isEdit?: boolean;
    title: string;
    submitLabel: string;
}

export function ResourceForm({
    initialData,
    onSubmit,
    loading,
    isEdit = false,
    title,
    submitLabel
}: ResourceFormProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('details');
    const [iconPreview, setIconPreview] = useState<string | null>(initialData?.iconPreview || null);
    const [activityTypes, setActivityTypes] = useState<string[]>([]);
    const [urlError, setUrlError] = useState('');

    const [formData, setFormData] = useState<ResourceFormData>({
        title: initialData?.title || '',
        resource_type: initialData?.resource_type || '',
        resource_url: initialData?.resource_url || '',
        category: initialData?.category || '',
        content: initialData?.content || '',
        is_published: initialData?.is_published ?? false,
        category_icon: null,
        resource_file: null,
        activity: initialData?.activity || '',
        species: initialData?.species || '',
        season_name: initialData?.season_name || '',
        season_start: initialData?.season_start || '',
        season_end: initialData?.season_end || '',
        rules: initialData?.rules || ''
    });

    const hasInitialUrl = isEdit && !!initialData?.resource_url;
    const hasInitialFile = isEdit && !!initialData?.resource_file;

    const hasCurrentUrl = !!formData.resource_url;
    const hasCurrentFile = !!formData.resource_file;

    const showUrlField = !isEdit || hasInitialUrl || (!hasInitialFile && !hasCurrentFile);

    const showFileField = !isEdit || hasInitialFile || (!hasInitialUrl && !hasCurrentUrl);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                category_icon: prev.category_icon,
                resource_file: prev.resource_file,
            }));
            if (initialData.iconPreview) {
                setIconPreview(initialData.iconPreview);
            }
        }
    }, [initialData]);

    useEffect(() => {
        const fetchActivityTypes = async () => {
            try {
                const token = await getAuthToken();
                if (!token) return;
                const types = await getLicenseTypes(token);
                setActivityTypes(types);
            } catch (error: any) {
                console.error('Failed to fetch activity types:', error);
                toast.error(error.message || 'Failed to load activity types');
            }
        };

        fetchActivityTypes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'season_start' || name === 'season_end') {
            const today = new Date().toISOString().split('T')[0];

            if (value < today) {
                toast.error('Date cannot be in the past');
                return;
            }

            if (name === 'season_end' && formData.season_start && value < formData.season_start) {
                toast.error('Season End cannot be earlier than Season Start');
                return;
            }

            if (name === 'season_start' && formData.season_end && value > formData.season_end) {
                toast.error('Season Start cannot be later than Season End');
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleResourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, resource_url: value }));

        if (value) {
            try {
                urlSchema.parse(value);
                setUrlError('');
            } catch (error) {
                if (error instanceof z.ZodError && error.issues.length > 0) {
                    setUrlError(error.issues[0].message);
                }
            }
            if (formData.resource_file) {
                setFormData(prev => ({ ...prev, resource_file: null }));
            }
        } else {
            setUrlError('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, category_icon: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, resource_file: file, resource_url: '' }));
        }
    };

    const removeIcon = () => {
        setFormData(prev => ({ ...prev, category_icon: null }));
        setIconPreview(null);
    };

    const removeResourceFile = () => {
        setFormData(prev => ({ ...prev, resource_file: null }));
        const fileInput = document.getElementById('resource_file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };


    const handleSelectChange = (name: keyof ResourceFormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_published: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.resource_type || (!isEdit && !formData.category)) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.resource_url && !formData.resource_file) {
            toast.error('Please provide either a URL or upload a file');
            return;
        }

        if (formData.resource_url) {
            try {
                urlSchema.parse(formData.resource_url);
            } catch (error) {
                if (error instanceof z.ZodError && error.issues.length > 0) {
                    toast.error(error.issues[0].message);
                    return;
                }
            }
        }

        await onSubmit(formData);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        {isEdit ? 'Modify resource details' : 'Add a new resource to your library'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                        className="bg-muted border-border"
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
                        {submitLabel}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start ">
                <Card className="border-none shadow-sm bg-card overflow-hidden">
                    <div className="p-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'details'
                                ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <div className={`p-1.5 rounded-md ${activeTab === 'details' ? 'bg-primary/20' : 'bg-muted'}`}>
                                <Info className="w-4 h-4" />
                            </div>
                            Details
                        </button>
                    </div>
                </Card>

                <div className="space-y-6 ">
                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Details
                            </h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Icon Upload */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-border pb-8">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-sm font-semibold text-foreground/80">Category Icon</Label>
                                        <p className="text-xs text-muted-foreground">Upload an icon for this resource category.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        {iconPreview ? (
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-100 shadow-lg shadow-blue-50 ring-4 ring-white">
                                                    <img src={iconPreview} alt="Icon Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeIcon}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 duration-200"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group">
                                                <div className="p-2 rounded-full bg-muted group-hover:bg-blue-100 transition-colors mb-1">
                                                    <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-700 uppercase tracking-widest">Upload Icon</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* Title */}
                                    <div className="space-y-2 col-span-full">
                                        <Label htmlFor="title" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                            Resource Title <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                <Type className="w-4 h-4" />
                                            </div>
                                            <Input
                                                id="title"
                                                name="title"
                                                placeholder="Enter resource title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="pl-10 h-11"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Resource Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="resource_type" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                            Resource Type <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.resource_type}
                                            onValueChange={(val) => handleSelectChange('resource_type', val)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RESOURCE_TYPES.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                            Category <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => handleSelectChange('category', val)}
                                            disabled={isEdit}
                                        >
                                            <SelectTrigger className={`h-11 ${isEdit ? 'bg-muted cursor-not-allowed' : ''}`}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Resource URL */}
                                    {showUrlField && (
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="resource_url" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                Resource URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="resource_url"
                                                    name="resource_url"
                                                    type="url"
                                                    placeholder="https://example.com/resource"
                                                    value={formData.resource_url}
                                                    onChange={handleResourceUrlChange}
                                                    disabled={hasCurrentFile}
                                                    className="pl-10 h-11 disabled:bg-muted disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            {urlError && (
                                                <p className="text-xs text-red-600">{urlError}</p>
                                            )}
                                            {hasCurrentFile ? (
                                                <p className="text-xs text-amber-600">URL disabled - File is selected</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Must start with https://</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="space-y-2 col-span-full">
                                        <Label htmlFor="content" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                            Description / Content
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <Textarea
                                                id="content"
                                                name="content"
                                                placeholder="Detailed description..."
                                                value={formData.content}
                                                onChange={handleChange}
                                                rows={5}
                                                className="pl-10 pt-3 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* File */}
                                    {showFileField && (
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="resource_file" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                Resource File
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors z-10">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="resource_file"
                                                    name="resource_file"
                                                    type="file"
                                                    onChange={handleResourceFileChange}
                                                    disabled={hasCurrentUrl}
                                                    className="pl-10 h-11 pt-2 disabled:bg-muted disabled:cursor-not-allowed"
                                                />
                                                {formData.resource_file && (
                                                    <button
                                                        type="button"
                                                        onClick={removeResourceFile}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {hasCurrentUrl ? (
                                                <p className="text-xs text-amber-600">File upload disabled - URL is provided</p>
                                            ) : hasCurrentFile ? (
                                                <p className="text-xs text-green-600">File selected:
                                                    {formData.resource_file instanceof File
                                                        ? formData.resource_file.name
                                                        : String(formData.resource_file).split('/').pop()}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">{isEdit ? 'Upload to replace existing file.' : 'Upload a file (PDF, Image).'}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Season Dates Fields */}
                                    {formData.category === 'Season Dates' && (
                                        <>
                                            <div className="col-span-full border-t border-border pt-6 mt-2">
                                                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                                    <div className="h-4 w-1 bg-green-500 rounded-full" />
                                                    Seasonal Information
                                                </h3>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="activity" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Activity <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.activity}
                                                    onValueChange={(val) => handleSelectChange('activity', val)}
                                                >
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Select activity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activityTypes.map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="species" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Species <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="species"
                                                    name="species"
                                                    placeholder="e.g. Deer"
                                                    value={formData.species}
                                                    onChange={handleChange}
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="season_name" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Season Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="season_name"
                                                    name="season_name"
                                                    placeholder="e.g. Fall Season"
                                                    value={formData.season_name}
                                                    onChange={handleChange}
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="col-span-full">
                                                <RulesTable
                                                    value={formData.rules}
                                                    onChange={(val) => handleSelectChange('rules', val)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="season_start" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Season Start <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="season_start"
                                                    name="season_start"
                                                    type="date"
                                                    value={formData.season_start}
                                                    onChange={handleChange}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="season_end" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Season End <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="season_end"
                                                    name="season_end"
                                                    type="date"
                                                    value={formData.season_end}
                                                    onChange={handleChange}
                                                    min={formData.season_start || new Date().toISOString().split('T')[0]}
                                                    className="h-11"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Published Toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50 col-span-full group hover:border-blue-200 transition-colors">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="is_published" className="text-sm font-bold text-foreground cursor-pointer">
                                                    Published Status
                                                </Label>
                                                {formData.is_published && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Make this resource visible to users immediately</p>
                                        </div>
                                        <Switch
                                            id="is_published"
                                            checked={formData.is_published}
                                            onCheckedChange={handleSwitchChange}
                                            className="data-[state=checked]:bg-blue-600 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
