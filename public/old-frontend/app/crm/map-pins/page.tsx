'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getMapPins } from '@/lib/actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { MapPinDetails } from './MapPinDetails';

interface MapPin {
    id: string;
    latitude: string;
    longitude: string;
    visibility: string;
    user?: {
        email: string;
    };
    description?: string;
}

const MapPinsPage = () => {
    const [mapPins, setMapPins] = useState<MapPin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit, setLimit] = useState(10);
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset to first page on new search
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchMapPins = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await getMapPins(token, page, limit, debouncedSearchTerm);
            // Determine if response is array or paginated object
            if (response && response.data) {
                // Handle standard paginated response
                // Expected format: { data: [...], total: N, totalPages: M, page: P, limit: L }
                if (Array.isArray(response.data)) {
                    setMapPins(response.data);

                    // Check for direct total/totalPages properties
                    if (typeof response.total !== 'undefined') {
                        setTotalItems(response.total);
                        setTotalPages(response.totalPages || Math.ceil(response.total / limit));
                    } else if (response.pagination) {
                        // Fallback to pagination object if structure differs
                        setTotalPages(response.pagination.totalPages);
                        setTotalItems(response.pagination.totaldata);
                    }
                }
            } else if (Array.isArray(response)) {
                // Fallback for flat array if API reverts or differs
                setMapPins(response);
                setTotalItems(response.length);
                setTotalPages(1);
            }
        } catch (error: any) {
            setMapPins([]);
            toast.error(error.message || 'Failed to fetch map pins');
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearchTerm]);

    useEffect(() => {
        fetchMapPins();
    }, [fetchMapPins]);

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Map Pins</h1>
            </div>

            {/* Main Content */}
            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search pins..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Latitude</TableHead>
                                    <TableHead>Longitude</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: limit }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    mapPins.length > 0 ? (
                                        mapPins.map((pin, index) => (
                                            <TableRow key={pin.id}>
                                                <TableCell className="font-medium text-xs text-muted-foreground" title={pin.id}>
                                                    {(page - 1) * limit + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    {pin.user?.email || 'N/A'}
                                                </TableCell>
                                                <TableCell>{pin.latitude}</TableCell>
                                                <TableCell>{pin.longitude}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            pin.visibility?.toLowerCase() === 'public' ? 'success' :
                                                                pin.visibility?.toLowerCase() === 'private' ? 'destructive' :
                                                                    'info'
                                                        }
                                                        appearance="light"
                                                        className="capitalize rounded-md px-2 py-0.5"
                                                    >
                                                        {pin.visibility}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedPinId(pin.id);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View Details</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No map pins found.
                                            </TableCell>
                                        </TableRow>
                                    )
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
                                            disabled={page === totalPages && totalPages > 0}
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

            <MapPinDetails
                pinId={selectedPinId}
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
            />
        </div>
    );
};

export default MapPinsPage;
