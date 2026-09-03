'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Save,
    MapPin,
    Type,
    FileText,
    ImagePlus,
    X,
    ChevronLeft
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { createState } from '@/lib/actions';
import { toast } from 'sonner';
import Link from 'next/link';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

const stateSchema = z.object({
    state_code: z.string().min(1, 'State code is required'),
    state_name: z.string().min(1, 'State name is required'),
    state_description: z.string().optional(),
    flagImage: z.instanceof(File).optional(),
});

const CreateStatePage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [flagPreview, setFlagPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof stateSchema>>({
        resolver: zodResolver(stateSchema),
        defaultValues: {
            state_code: '',
            state_name: '',
            state_description: '',
        },
        mode: 'onBlur',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('flagImage', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFlagPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFlag = () => {
        form.setValue('flagImage', undefined);
        setFlagPreview(null);
    };

    const onSubmit = async (values: z.infer<typeof stateSchema>) => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('state_code', values.state_code);
            data.append('state_name', values.state_name);
            data.append('state_description', values.state_description || '');

            if (values.flagImage) {
                data.append('flagImage', values.flagImage);
            }

            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await createState(token, data);
            toast.success('State created successfully');
            router.push('/crm/states');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create state. State code might already exist.');
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
                            <Link href="/crm/states" className="hover:text-blue-600 transition-colors">States</Link>
                            <span>&gt;</span>
                            <span className="font-medium text-foreground">Create</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-blue-600" />
                            Add State
                        </h1>
                        <p className="text-sm text-muted-foreground italic">
                            Create a new <span className="text-blue-600 font-medium font-not-italic">state</span> entry
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
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save State
                        </Button>
                    </div>
                </div>

                <Card className="border-border shadow-sm bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <div className="h-5 w-1 bg-blue-600 rounded-full" />
                            State Details
                        </h2>
                    </div>
                    <CardContent className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Flag Upload Section */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-muted/50 pb-8">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-sm font-semibold text-foreground/80">State Flag</Label>
                                        <p className="text-xs text-muted-foreground">Upload the official flag image or SVG.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        {flagPreview ? (
                                            <div className="relative group">
                                                <div className="w-32 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                                                    <img src={flagPreview} alt="Flag Preview" className="h-full object-contain" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeFlag}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 duration-200"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer transition-all group overflow-hidden">
                                                <div className="p-2 rounded-full bg-muted group-hover:bg-blue-100/10 transition-colors mb-1">
                                                    <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-blue-600" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-blue-500 uppercase tracking-widest">Upload Flag</span>
                                                <input type="file" className="hidden" accept="image/*,image/svg+xml" onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* State Code */}
                                    <FormField
                                        control={form.control}
                                        name="state_code"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    State Code <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                            <Type className="w-4 h-4" />
                                                        </div>
                                                        <Input
                                                            placeholder="e.g. HI"
                                                            maxLength={5}
                                                            {...field}
                                                            className="pl-10 h-11 border-border focus:border-blue-500 focus:ring-blue-500/10 transition-all rounded-lg uppercase"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* State Name */}
                                    <FormField
                                        control={form.control}
                                        name="state_name"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    State Name <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                            <Type className="w-4 h-4" />
                                                        </div>
                                                        <Input
                                                            placeholder="e.g. Hawaii"
                                                            {...field}
                                                            className="pl-10 h-11 border-border focus:border-blue-500 focus:ring-blue-500/10 transition-all rounded-lg"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Description */}
                                    <FormField
                                        control={form.control}
                                        name="state_description"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2 col-span-full">
                                                <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute left-3 top-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <Textarea
                                                            placeholder="Detailed description of the state..."
                                                            rows={5}
                                                            {...field}
                                                            className="pl-10 pt-3 border-border focus:border-blue-500 focus:ring-blue-500/10 transition-all rounded-lg resize-none"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreateStatePage;
