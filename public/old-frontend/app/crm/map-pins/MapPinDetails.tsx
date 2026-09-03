import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/service/service";
import { getMapPinById } from "@/lib/actions";
import { toast } from "sonner";
import { MapPin as MapPinIcon, Calendar, Eye, Tag, AlignLeft } from "lucide-react";

interface MapPinDetailsProps {
    pinId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

interface MapPinDetailData {
    id: string;
    latitude: string;
    longitude: string;
    visibility: string;
    description: string | null;
    created_at: string;
    tags: { id: string; name: string }[];
}

export function MapPinDetails({ pinId, isOpen, onClose }: MapPinDetailsProps) {
    const [pin, setPin] = useState<MapPinDetailData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && pinId) {
            fetchPinDetails();
        } else {
            setPin(null);
        }
    }, [isOpen, pinId]);

    const fetchPinDetails = async () => {
        if (!pinId) return;
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                onClose();
                return;
            }

            const data = await getMapPinById(token, pinId);
            setPin(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load map pin details");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <MapPinIcon className="h-5 w-5 text-primary" />
                        Map Pin Details
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                ) : pin ? (
                    <div className="space-y-6 py-4">
                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latitude</label>
                                <div className="font-mono text-sm bg-muted/50 p-2 rounded-md border text-center">
                                    {pin.latitude}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Longitude</label>
                                <div className="font-mono text-sm bg-muted/50 p-2 rounded-md border text-center">
                                    {pin.longitude}
                                </div>
                            </div>
                        </div>

                        {/* Visibility & Created At */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="h-3 w-3" /> Visibility
                                </label>
                                <div>
                                    <Badge
                                        variant={pin.visibility === 'public' ? 'success' : 'secondary'}
                                        className="capitalize"
                                    >
                                        {pin.visibility}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> Created At
                                </label>
                                <div className="text-sm font-medium">
                                    {format(new Date(pin.created_at), 'PPP')}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <AlignLeft className="h-3 w-3" /> Description
                            </label>
                            <div className="text-sm text-gray-700 bg-muted/50 p-3 rounded-lg border min-h-[60px]">
                                {pin.description || <span className="text-muted-foreground italic">No description provided</span>}
                            </div>
                        </div>

                        {/* Tags */}
                        {pin.tags && pin.tags.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="h-3 w-3" /> Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {pin.tags.map((tag) => (
                                        <Badge key={tag.id} variant="outline" className="bg-background">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        No details available
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
