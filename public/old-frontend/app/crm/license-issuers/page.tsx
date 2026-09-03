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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Building2,
    Plus,
    MoreVertical,
    Edit2,
    Trash2
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getLicenseIssuers, createLicenseIssuer, updateLicenseIssuer, deleteLicenseIssuer } from '@/lib/actions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';

const LicenseIssuersPage = () => {
    const [licenseIssuers, setLicenseIssuers] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit, setLimit] = useState(10);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIssuer, setEditingIssuer] = useState<Record<string, any> | null>(null);
    const [organisation, setOrganisation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [issuersToDelete, setIssuersToDelete] = useState<any | null>(null);
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

    const fetchLicenseIssuers = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await getLicenseIssuers(token, page, limit, debouncedSearchTerm);
            if (response && response.data) {
                setLicenseIssuers(response.data);
                const { totalPages, totalItems } = response.pagination;
                setTotalItems(totalItems);
                setTotalPages(totalPages);
            } else {
                setLicenseIssuers([]);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch license issuers');
            setLicenseIssuers([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearchTerm]);

    useEffect(() => {
        fetchLicenseIssuers();
    }, [fetchLicenseIssuers]);

    const handleCreate = () => {
        setEditingIssuer(null);
        setOrganisation('');
        setIsDialogOpen(true);
    };

    const handleEdit = (issuer: Record<string, any>) => {
        setEditingIssuer(issuer);
        setOrganisation(issuer.organisation);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organisation.trim()) {
            toast.error('Organisation name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            if (editingIssuer) {
                await updateLicenseIssuer(token, editingIssuer.id, { organisation });
                toast.success('License issuer updated successfully');
            } else {
                await createLicenseIssuer(token, { organisation });
                toast.success('License issuer created successfully');
            }

            setIsDialogOpen(false);
            fetchLicenseIssuers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to save license issuer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (issuerId: string) => {
        setIssuersToDelete(issuerId);
        setConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog) return;
        setIsDeleting(true);

        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await deleteLicenseIssuer(token, issuersToDelete);
            toast.success('License issuer deleted successfully');
            fetchLicenseIssuers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete license issuer');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(false);
            setIssuersToDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    License Issuers
                </h1>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                    <Plus className="w-4 h-4" />
                    Add License Issuer
                </Button>
            </div>

            {/* Main Content */}
            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
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
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : licenseIssuers.length > 0 ? (
                                    licenseIssuers.map((issuer, index) => (
                                        <TableRow key={issuer.id as string}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {issuer.organisation as string}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleEdit(issuer)} className='cursor-pointer'>
                                                            <Edit2 className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleDelete(issuer.id as string)} className='cursor-pointer'
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
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No license issuers found.
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingIssuer ? 'Edit License Issuer' : 'Create License Issuer'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="organisation">Organization Name</Label>
                            <Input
                                id="organisation"
                                value={organisation}
                                onChange={(e) => setOrganisation(e.target.value)}
                                placeholder="Enter organization name"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : editingIssuer ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                isOpen={confirmDialog}
                onOpenChange={setConfirmDialog}
                title="Delete License Issuer?"
                description="Are you sure you want to delete this license issuer? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete License Issuer"}
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default LicenseIssuersPage;