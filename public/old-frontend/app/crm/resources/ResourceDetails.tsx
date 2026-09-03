'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ExternalLink, Calendar, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getAppImageUrl, getResourceFileUrl } from '@/lib/utils';

interface ResourceDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    selectedResource: Record<string, any> | null;
    isDetailsLoading: boolean;
}


const ResourceDetails: React.FC<ResourceDetailsProps> = ({
    isOpen,
    onClose,
    selectedResource,
    isDetailsLoading
}) => {

    const InfoRow = ({ label, value, showCopy = false, isUrl = false, isResourceFile = false }: { label: string; value: string; showCopy?: boolean; isUrl?: boolean; isResourceFile?: boolean }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                {isResourceFile ? (
                    value ? (
                        <button
                            onClick={() => window.open(getResourceFileUrl(value), '_blank')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            View PDF
                        </button>
                    ) : (
                        <span className="text-sm text-gray-400">No file</span>
                    )
                ) : isUrl ? (
                    <a
                        href={value?.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        {value || 'N/A'}
                        {value && <ExternalLink className="h-3 w-3" />}
                    </a>
                ) : (
                    <span className="text-sm text-gray-700">{value || 'N/A'}</span>
                )}
                {showCopy && value && !isResourceFile && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400" onClick={() => {
                        navigator.clipboard.writeText(value);
                        toast.success(`${label} copied!`);
                    }}>
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-3xl p-0 overflow-hidden border-none bg-white rounded-xl shadow-2xl h-[80vh] flex flex-col">
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Resource Details</DialogTitle>
                        <DialogDescription>Detailed information about the selected resource.</DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Resource Details
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold px-3 py-1 h-auto"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>

                    {isDetailsLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    ) : selectedResource ? (
                        <div className="space-y-6">
                            <div className="relative overflow-hidden bg-gray-50/50 border border-gray-100 rounded-xl p-6">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23000' fill='none'/%3E%3C/svg%3E")`,
                                    backgroundSize: '40px 40px'
                                }}></div>

                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge
                                            variant={selectedResource.is_published ? 'success' : 'secondary'}
                                            appearance="light"
                                            className="rounded-full px-2 py-0 h-5"
                                        >
                                            <span className="flex items-center gap-1.5 text-[10px]">
                                                <span className={`h-1 w-1 rounded-full ${selectedResource.is_published ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                                                {selectedResource.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </Badge>
                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {selectedResource.created_at ? new Date(selectedResource.created_at as string).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{String(selectedResource.title || '')}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{String(selectedResource.content || '')}</p>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                        <Tag className="w-4 h-4 text-blue-500" />
                                        General Information
                                    </h4>
                                </div>
                                <div className="px-5 py-2">
                                    <InfoRow label="Title" value={String(selectedResource.title || '')} showCopy />
                                    <InfoRow label="Category" value={String(selectedResource.category || '')} />
                                    <InfoRow label="Resource Type" value={String(selectedResource.resource_type || '')} />
                                    <InfoRow label="Resource URL" value={String(selectedResource.resource_url || '')} isUrl showCopy />
                                    {!!selectedResource.resource_file && (
                                        <InfoRow label="Resource File" value={String(selectedResource.resource_file || '')} isUrl isResourceFile showCopy />
                                    )}
                                    <InfoRow label="Creator's Email" value={String((selectedResource?.creator as any)?.email || '')} showCopy />
                                </div>
                            </div>

                            {/* Seasonal Data Section */}
                            {selectedResource.category === 'Season Dates' && !!selectedResource.seasonalData && (
                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                            <div className="h-4 w-1 bg-green-500 rounded-full" />
                                            Seasonal Information
                                        </h4>
                                    </div>
                                    <div className="px-5 py-2">
                                        <InfoRow label="Activity" value={String((selectedResource.seasonalData as any).activity || '')} />
                                        <InfoRow label="Species" value={String((selectedResource.seasonalData as any).species || '')} />
                                        <InfoRow label="Season Name" value={String((selectedResource.seasonalData as any).season_name || '')} />
                                        <InfoRow label="Start Date" value={String((selectedResource.seasonalData as any).season_start || '')} />
                                        <InfoRow label="End Date" value={String((selectedResource.seasonalData as any).season_end || '')} />

                                        {(selectedResource.seasonalData as any).rules && (
                                            <div className="flex flex-col py-3 border-b border-gray-100 last:border-0">
                                                <span className="text-sm text-gray-500 font-medium mb-2">Rules</span>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    {(() => {
                                                        try {
                                                            const rulesStr = (selectedResource.seasonalData as any).rules;
                                                            const rules = typeof rulesStr === 'string' ? JSON.parse(rulesStr) : rulesStr;
                                                            
                                                            if (typeof rules === 'object' && rules !== null) {
                                                                return (
                                                                    <div className="space-y-2">
                                                                        {Object.entries(rules).map(([key, value]) => (
                                                                            <div key={key} className="flex items-start gap-2">
                                                                                <span className="text-sm font-medium text-gray-700 capitalize">{key}:</span>
                                                                                <span className="text-sm text-gray-600">{String(value)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            }
                                                            return <span className="text-sm text-gray-600">{String(rules)}</span>;
                                                        } catch (e) {
                                                            return <span className="text-sm text-gray-600">{String((selectedResource.seasonalData as any).rules)}</span>;
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                                    <h4 className="font-bold text-gray-800 text-sm">Description / Content</h4>
                                </div>
                                <div className="p-5 text-sm text-gray-700 leading-relaxed bg-gray-50/20 whitespace-pre-wrap">
                                    {String(selectedResource.content || '') || 'No content available.'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                        <Tag className="w-4 h-4 text-blue-500" />
                                        Resource Images
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Boolean(selectedResource.category_icon) && (
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Category Icon</span>
                                            <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 group">
                                                <img
                                                    src={getAppImageUrl(selectedResource.category_icon as string)}
                                                    alt="Category Icon"
                                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center p-2">Image not found</div>';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                            </div>
                                        </div>
                                    )}
                                    {Array.isArray(selectedResource.photos) && (selectedResource.photos as Record<string, any>[]).map((photo: Record<string, any>, idx: number) => (
                                        <div key={idx} className="space-y-1.5">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Photo {idx + 1}</span>
                                            <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 group">
                                                <img
                                                    src={getAppImageUrl((photo.image as string) || (photo as any as string))}
                                                    alt={`Resource photo ${idx + 1}`}
                                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center p-2">Image not found</div>';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No Resource Selected</h3>
                            <p className="text-gray-500 max-w-xs">Something went wrong while loading the resource details.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ResourceDetails;
