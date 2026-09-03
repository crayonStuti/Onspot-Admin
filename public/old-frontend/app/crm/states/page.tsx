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
import { getAuthToken } from '@/service/service';
import { getStates, deleteState } from '@/lib/actions';
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
import { Plus, MapPin, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface StateItem {
    state_id: string;
    state_code: string;
    state_name: string;
    state_flag_image: string;
    state_description: string;
    created_at: string;
    updated_at: string;
}

const StatesPage = () => {
    const [items, setItems] = useState<StateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [stateToDelete, setstateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchStates = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            const response = await getStates(token, page, limit);

            let stateItems: StateItem[] = [];

            if (response.data && Array.isArray(response.data)) {
                stateItems = response.data;
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                }
            } else if (Array.isArray(response)) {
                stateItems = response;
            }

            setItems(stateItems);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch states');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchStates();
    }, [fetchStates]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleDeleteState = (stateId: string) => {
        setstateToDelete(stateId);
        setConfirmDialog(true);
    };


    const handleConfirmDelete = async () => {
        if (!stateToDelete) return;
        setIsDeleting(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await deleteState(token, stateToDelete);
            toast.success('State deleted successfully');
            fetchStates();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete state');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(false);
            setstateToDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    States
                </h1>
                <Link href="/crm/states/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                        <Plus className="w-4 h-4" />
                        Add State
                    </Button>
                </Link>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead className="w-[100px]">Flag</TableHead>
                                    <TableHead className="w-[120px]">Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-16 rounded-md" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No states found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={item.state_id}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative h-10 w-16 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${item.state_flag_image}`}
                                                        alt={`${item.state_name} Flag`}
                                                        className="h-full w-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/60x40?text=Flag';
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{item.state_code}</TableCell>
                                            <TableCell className="font-medium">{item.state_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={item.state_description}>
                                                {item.state_description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem asChild className='cursor-pointer'>
                                                            <Link href={`/crm/states/edit/${item.state_id}`} className="flex items-center w-full">
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleDeleteState(item.state_id)} className='cursor-pointer'
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
            <ConfirmDialog
                isOpen={confirmDialog}
                onOpenChange={setConfirmDialog}
                title="Delete State?"
                description="Are you sure you want to delete this state? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete State"}
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default StatesPage;
