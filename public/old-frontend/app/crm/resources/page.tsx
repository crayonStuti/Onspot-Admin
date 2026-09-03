'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Library,
    MoreVertical,
    Eye,
    Edit2,
    Trash2
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getAdminResources, getAdminResourceById, deleteResource, getStates } from '@/lib/actions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ResourceDetails from './ResourceDetails';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/confirm-dialog';

const ResourcesPage = () => {
    const [resources, setResources] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit, setLimit] = useState(10);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Record<string, any> | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [states, setStates] = useState<any[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<string>('all');
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1);
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchStates = React.useCallback(async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;
            const response = await getStates(token, 1, 100);
            if (response && response.data) {
                setStates(response?.data || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch states:', error);
            toast.error(error.message || 'Failed to fetch states');
        }
    }, []);

    useEffect(() => {
        fetchStates();
    }, [fetchStates]);

    const fetchResources = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await getAdminResources(
                token,
                page,
                limit,
                debouncedSearchTerm,
                selectedStateId !== 'all' ? selectedStateId : ''
            );
            if (response && response.data) {
                setResources(response.data.resources);
                const { totalPages, totaldata } = response.data.pagination;
                setTotalItems(totaldata);
                setTotalPages(totalPages);
            } else {
                setResources([]);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch resources');
            setResources([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearchTerm, selectedStateId]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const handleViewResource = async (resourceId: string) => {
        setIsViewOpen(true);
        setIsDetailsLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                setIsViewOpen(false);
                return;
            }

            const data = await getAdminResourceById(token, resourceId);
            setSelectedResource(data);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch resource details');
            setIsViewOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleDeleteResource = (resourceId: string) => {
        setResourceToDelete(resourceId);
        setConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!resourceToDelete) return;
        setIsDeleting(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await deleteResource(token, resourceToDelete);
            toast.success('Resource deleted successfully');
            fetchResources();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete resource');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(false);
            setResourceToDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Library className="w-6 h-6 text-blue-600" />
                    Resources
                </h1>
                <Link href="/crm/resources/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                        <Plus className="w-4 h-4" />
                        Add Resource
                    </Button>
                </Link>
            </div>

            {/* Main Content */}
            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search resources..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="w-full sm:w-48">
                            <Select
                                value={selectedStateId}
                                onValueChange={(val) => {
                                    setSelectedStateId(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All States" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All States</SelectItem>
                                    {states.map((state) => (
                                        <SelectItem key={state.state_id} value={state.state_id}>
                                            {state.state_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Resource Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : resources.length > 0 ? (
                                    resources.map((resource, index) => (
                                        <TableRow key={resource.id as string}>
                                            <TableCell className="font-medium text-xs text-muted-foreground" title={resource.id as string}>
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                <div className="flex flex-col">
                                                    <span>{resource.title as string}</span>

                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize text-sm">{resource.resource_type as string}</TableCell>
                                            <TableCell className="text-sm">{resource.category as string}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={resource.is_published ? 'success' : 'secondary'}
                                                    appearance="light"
                                                    className="rounded-md px-2 py-0.5"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${resource.is_published ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                                                        {resource.is_published ? 'Published' : 'Draft'}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleViewResource(resource.id as string)} className='cursor-pointer'>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className='cursor-pointer'>
                                                            <Link href={`/crm/resources/edit/${resource.id}`} className="flex items-center w-full">
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className='cursor-pointer'
                                                            variant="destructive"
                                                            onClick={() => handleDeleteResource(resource.id as string)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No resources found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rows per page</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(val) => setLimit(Number(val))}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={limit} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground mr-4">
                                {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} of {totalItems}
                            </span>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                                        <PaginationItem key={i}>
                                            <Button
                                                variant={page === i + 1 ? 'primary' : 'ghost'}
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </Button>
                                        </PaginationItem>
                                    ))}
                                    {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages || totalPages === 0}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ResourceDetails
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                selectedResource={selectedResource}
                isDetailsLoading={isDetailsLoading}
            />

            <ConfirmDialog
                isOpen={confirmDialog}
                onOpenChange={setConfirmDialog}
                title="Delete Resource?"
                description="Are you sure you want to delete this Resource? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Resource"}
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default ResourcesPage;
