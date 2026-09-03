'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

import { Skeleton } from '@/components/ui/skeleton';
import { getGallery } from '@/lib/actions';
import { getAuthToken } from '@/service/service';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getAppImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface GalleryItem {
    id: string;
    user_id: string;
    image_url: string;
    image_caption: string;
    user?: {
        email: string;
        first_name: string;
        last_name: string;
        display_name: string;
        profile?: {
            profile_picture: string | null;
        }
    };
}

const GalleryPage = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const fetchGallery = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No authentication token');

            const response = await getGallery(token, page, limit);

            let galleryItems: GalleryItem[] = [];

            if (response.data && Array.isArray(response.data)) {
                galleryItems = response.data;
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                }
            } else if (Array.isArray(response)) {
                galleryItems = response;
            }

            setItems(galleryItems);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch gallery');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Gallery</h1>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead className="w-[150px]">Image</TableHead>
                                    <TableHead>Caption</TableHead>
                                    <TableHead>User Email</TableHead>
                                    <TableHead>User Name</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                            <TableCell><Skeleton className="h-16 w-24 rounded-md" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No images found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative h-16 w-24 overflow-hidden rounded-md border bg-muted">
                                                    <img
                                                        src={getAppImageUrl(item.image_url)}
                                                        alt={item.image_caption || "Gallery Image"}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.image_caption || '-'}</TableCell>
                                            <TableCell>
                                                {item.user?.email || <span className="text-muted-foreground italic">N/A</span>}
                                            </TableCell>
                                            <TableCell>
                                                {item.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{item.user.display_name || `${item.user.first_name} ${item.user.last_name}`}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Unknown User</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Rows per page</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(value) => {
                                    setLimit(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={limit.toString()} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={pageSize.toString()}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(page - 1)}
                                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    isActive={page === p}
                                                    onClick={() => handlePageChange(p)}
                                                    className="cursor-pointer"
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(page + 1)}
                                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GalleryPage;
