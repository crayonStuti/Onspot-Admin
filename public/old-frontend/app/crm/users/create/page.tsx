'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Save,
    User,
    Mail,
    Lock,
    UserPlus,
    Type,
    MapPin,
    Shield,
    Eye,
    EyeOff
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { registerUser, getStates } from '@/lib/actions';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';

interface State {
    state_id: string;
    state_name: string;
}

const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    role: z.string().min(1, 'Role is required'),
    status: z.string().min(1, 'Status is required'),
    state_id: z.string().optional().or(z.literal('')),
}).refine((data) => {
    if (data.role === 'admin' && !data.state_id) {
        return false;
    }
    return true;
}, {
    message: "State is required for admin users",
    path: ["state_id"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const CreateUserPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [states, setStates] = useState<State[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'user',
            status: 'active',
            state_id: '',
        }
    });

    const selectedRole = watch('role');

    useEffect(() => {
        const fetchStates = async () => {
            setLoadingStates(true);
            try {
                const token = await getAuthToken();
                if (!token) return;
                const response = await getStates(token, 1, 999);
                setStates(response.data || response || []);
            } catch (error) {
                console.error('Failed to fetch states:', error);
            } finally {
                setLoadingStates(false);
            }
        };
        fetchStates();
    }, []);

    const onSubmit = async (data: CreateUserFormData) => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }

            const payload = {
                ...data,
                display_name: `${data.first_name} ${data.last_name}`,
            };

            await registerUser(token, payload);
            toast.success('User created successfully');
            router.refresh();
            router.push('/crm/users');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Link href="/crm/users" className="hover:text-blue-600 transition-colors">Users</Link>
                            <span>&gt;</span>
                            <span className="font-medium text-foreground">Create</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                            Add User
                        </h1>
                        <p className="text-sm text-muted-foreground italic">
                            Create a new <span className="text-blue-600 font-medium font-not-italic">user account</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="bg-background border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save User
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                User Information
                            </h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name" className="text-sm font-semibold text-foreground/80">First Name <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                            <Input
                                                id="first_name"
                                                placeholder=""
                                                {...register('first_name')}
                                                className={`pl-10 h-11 `}
                                            />
                                        </div>
                                        {errors.first_name && (
                                            <p className="text-xs text-red-600 font-medium">{errors.first_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="last_name" className="text-sm font-semibold text-foreground/80">Last Name <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                            <Input
                                                id="last_name"
                                                placeholder=""
                                                {...register('last_name')}
                                                className={`pl-10 h-11 `}
                                            />
                                        </div>
                                        {errors.last_name && (
                                            <p className="text-xs text-red-600 font-medium">{errors.last_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email Address <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder=""
                                                {...register('email')}
                                                className={`pl-10 h-11 `}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500" />
                                            <Input
                                                id="password"
                                                type={passwordVisible ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                {...register('password')}
                                                className={`pl-10 pr-10 h-11 `}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPasswordVisible(!passwordVisible)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {passwordVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
                                        )}
                                        {!errors.password && (
                                            <p className="text-xs text-gray-500">Must contain uppercase, lowercase, number, and special character</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-sm font-semibold text-foreground/80">Role <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                            <Controller
                                                name="role"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className={`pl-10 h-11 ${errors.role ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">User</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="dnr">DNR</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        {errors.role && (
                                            <p className="text-xs text-red-600 font-medium">{errors.role.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-semibold text-foreground/80">Status <span className="text-red-600">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                            <Controller
                                                name="status"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className={`pl-10 h-11 ${errors.status ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="suspended">Suspended</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        {errors.status && (
                                            <p className="text-xs text-red-600 font-medium">{errors.status.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state_id" className="text-sm font-semibold text-foreground/80">
                                            State <span className="text-red-600">{selectedRole === 'admin' && '*'}</span>
                                        </Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                            <Controller
                                                name="state_id"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={loadingStates}
                                                    >
                                                        <SelectTrigger className={`pl-10 h-11 text-left ${errors.state_id ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {states.map((state) => (
                                                                <SelectItem key={state.state_id} value={state.state_id}>
                                                                    {state.state_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        {errors.state_id && (
                                            <p className="text-xs text-red-600 font-medium">{errors.state_id.message}</p>
                                        )}
                                        {selectedRole === 'admin' && !errors.state_id && (
                                            <p className="text-xs font-medium text-blue-600">Required for admin users</p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateUserPage;
