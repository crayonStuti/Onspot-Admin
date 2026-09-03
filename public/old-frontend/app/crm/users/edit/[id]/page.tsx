'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Save,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    Globe,
    Settings,
    Plus,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import { authService, getAuthToken } from '@/service/service';
import { getStates, getUserById, updateUserProfile } from '@/lib/actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { getAppImageUrl } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface State {
    id: string;
    state_id: string;
    state_name: string;
}

interface PreferenceRow {
    key: string;
    value: string;
}

const EditUserPage = () => {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [states, setStates] = useState<State[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [preferenceRows, setPreferenceRows] = useState<PreferenceRow[]>([{ key: '', value: '' }]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        display_name: '',
        phone: '',
        street_address: '',
        street_address_2: '',
        city: '',
        state: '',
        zipcode: '',
        is_hunter: false,
        is_fisherman: false,
        current_tier: 'free',
        status: 'active',
        social_channels: {
            instagram: '',
            facebook: '',
            twitter: ''
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            setFetching(true);
            try {
                const token = await getAuthToken();
                if (!token) throw new Error('No auth token');

                // Fetch states
                setLoadingStates(true);
                const statesResponse = await getStates(token, 1, 999);
                setStates(statesResponse.data || statesResponse || []);
                setLoadingStates(false);

                // Fetch user data
                const userResponse = await getUserById(token, userId);
                if (userResponse && userResponse.user) {
                    const user = userResponse.user;
                    const profile = user.profile || {};
                    const social = profile.social_channels || {};
                    const prefs = profile.preferences || {};

                    setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        display_name: user.display_name || '',
                        phone: profile.phone || '',
                        street_address: profile.street_address || '',
                        street_address_2: profile.street_address_2 || '',
                        city: profile.city || '',
                        state: profile.state || '',
                        zipcode: profile.zipcode || '',
                        is_hunter: profile.is_hunter === true || profile.is_hunter === 'true',
                        is_fisherman: profile.is_fisherman === true || profile.is_fisherman === 'true',
                        current_tier: profile.current_tier || 'free',
                        status: user.status || 'active',
                        social_channels: {
                            instagram: social.instagram || '',
                            facebook: social.facebook || '',
                            twitter: social.twitter || ''
                        }
                    });

                    const initialRows = Object.entries(prefs).map(([k, v]) => {
                        // Convert "dark_mode" to "Dark Mode" for UI display
                        const formattedKey = k
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        return {
                            key: formattedKey,
                            value: String(v)
                        };
                    });
                    if (initialRows.length > 0) {
                        setPreferenceRows(initialRows);
                    } else {
                        setPreferenceRows([{ key: '', value: '' }]);
                    }

                    if (profile.profile_picture) {
                        setPreviewUrl(getAppImageUrl(profile.profile_picture));
                    }
                }
            } catch (error: any) {
                console.error('Failed to fetch user data:', error);
                toast.error(error.message || 'Failed to load user data');
                router.push('/crm/users');
            } finally {
                setFetching(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as any),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as any),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePreferenceChange = (index: number, field: keyof PreferenceRow, value: string) => {
        const updatedRows = [...preferenceRows];
        updatedRows[index][field] = value;
        setPreferenceRows(updatedRows);
    };

    const addPreferenceRow = () => {
        setPreferenceRows([...preferenceRows, { key: '', value: '' }]);
    };

    const removePreferenceRow = (index: number) => {
        const updatedRows = preferenceRows.filter((_, i) => i !== index);
        setPreferenceRows(updatedRows.length > 0 ? updatedRows : [{ key: '', value: '' }]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const submitData = new FormData();
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('display_name', formData.display_name);
            submitData.append('phone', formData.phone);
            submitData.append('street_address', formData.street_address);
            submitData.append('street_address_2', formData.street_address_2);
            submitData.append('city', formData.city);
            submitData.append('state', formData.state);
            submitData.append('zipcode', formData.zipcode);
            submitData.append('is_hunter', String(formData.is_hunter));
            submitData.append('is_fisherman', String(formData.is_fisherman));
            submitData.append('current_tier', formData.current_tier);
            submitData.append('status', formData.status);
            // Social channels
            submitData.append('social_channels[instagram]', formData.social_channels.instagram);
            submitData.append('social_channels[facebook]', formData.social_channels.facebook);
            submitData.append('social_channels[twitter]', formData.social_channels.twitter);

            // Preferences
            preferenceRows.forEach(row => {
                if (row.key.trim()) {
                    // Convert "Dark Mode" to "dark_mode"
                    const sanitizedKey = row.key.trim()
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, ''); // Remove any other non-alphanumeric chars except underscores
                    submitData.append(`preferences[${sanitizedKey}]`, row.value);
                }
            });

            if (profilePicture) {
                submitData.append('profile_picture', profilePicture);
            }

            //console.log(submitData);
            const response = await updateUserProfile(token, userId, submitData);
            console.log(response);
            toast.success('User profile updated successfully');
            router.refresh();
            router.push('/crm/users');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update user profile');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Link href="/crm/users" className="hover:text-blue-600 transition-colors">Users</Link>
                            <span>&gt;</span>
                            <span className="font-medium text-foreground">Edit</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit User Profile</h1>
                        <p className="text-sm text-muted-foreground">Update user profile information</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()} className="bg-background border-border">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Profile Picture
                            </h2>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                                    <AvatarImage src={previewUrl || ''} />
                                    <AvatarFallback className="bg-muted">
                                        <img
                                            src="/assets/user-profile/profile.png"
                                            alt="Profile Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Label htmlFor="profile_picture" className="cursor-pointer">
                                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors inline-block">
                                            Change Photo
                                        </div>
                                    </Label>
                                    <input
                                        id="profile_picture"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Contact & Address
                            </h2>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">First Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                        <Input name="first_name" value={formData.first_name} onChange={handleChange} className="pl-10 h-11" placeholder="First Name" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Last Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                        <Input name="last_name" value={formData.last_name} onChange={handleChange} className="pl-10 h-11" placeholder="Last Name" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Display Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                        <Input name="display_name" value={formData.display_name} onChange={handleChange} className="pl-10 h-11" placeholder="Display Name" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Phone</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                        <Input name="phone" value={formData.phone} onChange={handleChange} className="pl-10 h-11" placeholder="Phone number" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Status</Label>
                                    <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">Current Tier</Label>
                                <Select value={formData.current_tier} onValueChange={(val) => handleSelectChange('current_tier', val)}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">Street Address</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                    <Input name="street_address" value={formData.street_address} onChange={handleChange} className="pl-10 h-11" placeholder="123 Main St" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">Street Address 2</Label>
                                <Input name="street_address_2" value={formData.street_address_2} onChange={handleChange} className="h-11" placeholder="Apartment, suite, etc." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">City</Label>
                                    <Input name="city" value={formData.city} onChange={handleChange} className="h-11" placeholder="City" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">State</Label>
                                    <Select value={formData.state} onValueChange={(val) => handleSelectChange('state', val)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select state" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.map(s => (
                                                <SelectItem key={s.state_id} value={s.state_name}>{s.state_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Zipcode</Label>
                                    <Input name="zipcode" value={formData.zipcode} onChange={handleChange} className="h-11" placeholder="Zipcode" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Interests & Status
                            </h2>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-bold text-foreground">Is Hunter</Label>
                                        <p className="text-xs text-muted-foreground">User is interested in hunting</p>
                                    </div>
                                    <Switch checked={formData.is_hunter} onCheckedChange={(val) => handleSwitchChange('is_hunter', val)} />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-bold text-foreground">Is Fisherman</Label>
                                        <p className="text-xs text-muted-foreground">User is interested in fishing</p>
                                    </div>
                                    <Switch checked={formData.is_fisherman} onCheckedChange={(val) => handleSwitchChange('is_fisherman', val)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Social Channels
                            </h2>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Instagram</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-pink-500" />
                                        <Input name="social_channels.instagram" value={formData.social_channels.instagram} onChange={handleChange} className="pl-10 h-11" placeholder="URL or handle" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Facebook</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600" />
                                        <Input name="social_channels.facebook" value={formData.social_channels.facebook} onChange={handleChange} className="pl-10 h-11" placeholder="URL or handle" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground/80">Twitter</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-400" />
                                        <Input name="social_channels.twitter" value={formData.social_channels.twitter} onChange={handleChange} className="pl-10 h-11" placeholder="@handle" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                Preferences
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPreferenceRow}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </Button>
                        </div>
                        <CardContent className="p-6">
                            <div className="border rounded-lg overflow-hidden border-border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-semibold text-foreground">Key</TableHead>
                                            <TableHead className="font-semibold text-foreground">Value</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {preferenceRows.map((row, index) => (
                                            <TableRow key={index} className="hover:bg-transparent">
                                                <TableCell className="p-2">
                                                    <Input
                                                        placeholder="e.g. favorite_color"
                                                        value={row.key}
                                                        onChange={(e) => handlePreferenceChange(index, 'key', e.target.value)}
                                                        className="h-10 border-border focus:border-blue-500 focus:ring-blue-500/10"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        placeholder="Value"
                                                        value={row.value}
                                                        onChange={(e) => handlePreferenceChange(index, 'value', e.target.value)}
                                                        className="h-10 border-border focus:border-blue-500 focus:ring-blue-500/10"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removePreferenceRow(index)}
                                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default EditUserPage;
