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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getAppImageUrl } from '@/lib/utils';

interface UserDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: Record<string, any> | null;
  selectedUserLicenses: Record<string, any>[];
  selectedUserResources: Record<string, any>[];
  selectedUserMapPins: Record<string, any>[];
  isDetailsLoading: boolean;
  onLoadMoreMapPins?: () => void;
  mapPinsTotal?: number;
}

const UserDetails: React.FC<UserDetailsProps> = ({
  isOpen,
  onClose,
  selectedUser,
  selectedUserLicenses,
  selectedUserResources,
  selectedUserMapPins,
  isDetailsLoading,
  onLoadMoreMapPins,
  mapPinsTotal
}) => {
  const InfoRow = ({ label, value, showCopy = false }: { label: string; value: string; showCopy?: boolean }) => (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{value || 'N/A'}</span>
        {showCopy && value && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60" onClick={() => {
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
      <DialogContent showCloseButton={false} className="max-w-4xl p-0 overflow-hidden border border-border bg-background rounded-xl shadow-2xl h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Detailed information about the selected user.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">User Profile</h2>
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
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            </div>
          ) : selectedUser?.user ? (
            <>
              <div className="space-y-6">
                {/* Header Card (Updated to match image) */}
                <div className="relative overflow-hidden bg-muted/10 border border-border rounded-xl p-6">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.05]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='currentColor' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                  }}></div>

                  <div className="relative flex items-center gap-6">
                    {(() => {
                      const userObj = selectedUser.user as Record<string, any>;
                      const profile = userObj.profile as Record<string, any> | undefined;
                      const profilePicture = profile?.profile_picture as string | undefined;
                      const firstName = userObj.first_name as string | undefined;
                      const lastName = userObj.last_name as string | undefined;
                      const displayName = userObj.display_name as string | undefined;
                      return (
                        <>
                          <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-background shadow-md ring-1 ring-border">
                              <AvatarImage src={getAppImageUrl(profilePicture)} />
                              <AvatarFallback className="bg-muted">
                                <img
                                  src="/assets/user-profile/profile.png"
                                  alt="Default Profile"
                                  className="h-full w-full object-cover"
                                />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                                {String(displayName || `${firstName} ${lastName}`)}
                              </h3>
                              <Badge
                                variant={userObj.status === 'active' ? 'success' : 'destructive'}
                                appearance="light"
                                className={`rounded-full px-2.5 py-0.5 h-6 flex items-center gap-1.5 border-none ${userObj.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${userObj.status === 'active' ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                                <span className="text-[11px] font-bold uppercase tracking-wider">{String(userObj.status)}</span>
                              </Badge>
                            </div>
                            <p className="text-muted-foreground font-medium">{String(userObj.email)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-6">
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList variant="line" className="mb-6 w-full justify-start overflow-x-auto">
                      <TabsTrigger value="profile">Profile Info</TabsTrigger>
                      <TabsTrigger value="membership">Membership</TabsTrigger>
                      <TabsTrigger value="licenses">Licenses</TabsTrigger>
                      <TabsTrigger value="resources">Bookmarks (Resource)</TabsTrigger>
                      <TabsTrigger value="map_pins">Map Pins</TabsTrigger>
                    </TabsList>

                    {/* Profile Information */}
                    <TabsContent value="profile">
                      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/30">
                          <h4 className="font-bold text-foreground">Profile Information</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-5 py-2">
                          <div className="space-y-0">
                            {(() => {
                              const userObj = selectedUser.user as Record<string, any>;
                              const profile = userObj.profile as Record<string, any> | undefined;
                              return (
                                <>
                                  <InfoRow label="Username" value={String(userObj.username || '')} />
                                  <InfoRow label="Email" value={String(userObj.email || '')} showCopy />
                                  <InfoRow label="First Name" value={String(userObj.first_name || '')} />
                                  <InfoRow label="Last Name" value={String(userObj.last_name || '')} />
                                  <InfoRow label="Display Name" value={String(userObj.display_name || '')} />
                                  <InfoRow label="Role" value={String(userObj.role || '')} />
                                  <InfoRow label="Status" value={String(userObj.status || '')} />
                                  <InfoRow label="Phone" value={String(profile?.phone || '')} />
                                  <InfoRow label="Is Hunter" value={profile?.is_hunter ? 'Yes' : 'No'} />
                                  <InfoRow label="Is Fisherman" value={profile?.is_fisherman ? 'Yes' : 'No'} />
                                </>
                              );
                            })()}
                          </div>
                          <div className="space-y-0">
                            {(() => {
                              const userObj = selectedUser.user as Record<string, any>;
                              const profile = userObj.profile as Record<string, any> | undefined;
                              const socialChannels = profile?.social_channels as Record<string, any> | undefined;
                              return (
                                <>
                                  <InfoRow label="Street Address" value={String(profile?.street_address || '')} />
                                  <InfoRow label="Street Address 2" value={String(profile?.street_address_2 || '')} />
                                  <InfoRow label="City" value={String(profile?.city || '')} />
                                  <InfoRow label="State" value={String(profile?.state || '')} />
                                  <InfoRow label="Zipcode" value={String(profile?.zipcode || '')} />
                                  <InfoRow label="Twitter" value={String(socialChannels?.twitter || '')} />
                                  <InfoRow label="Facebook" value={String(socialChannels?.facebook || '')} />
                                  <InfoRow label="Instagram" value={String(socialChannels?.instagram || '')} />
                                  <InfoRow label="Created At" value={userObj.created_at ? new Date(userObj.created_at as string).toLocaleString() : ''} />
                                  <InfoRow label="Updated At" value={userObj.updated_at ? new Date(userObj.updated_at as string).toLocaleString() : ''} />
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Membership Details */}
                    <TabsContent value="membership">
                      {Boolean(selectedUser.membership) ? (
                        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                          <div className="px-5 py-4 border-b border-border bg-muted/30">
                            <h4 className="font-bold text-foreground">Membership Details</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-5 py-2">
                            <div className="space-y-0">
                              {(() => {
                                const membership = selectedUser.membership as Record<string, any>;
                                return (
                                  <>
                                    <InfoRow label="Membership Name" value={String(membership.name || '')} />
                                    <InfoRow label="Description" value={String(membership.description || '')} />
                                    <InfoRow label="Price (USD)" value={`$${membership.price_usd || ''}`} />
                                    <InfoRow label="Duration (Days)" value={String(membership.duration_days || '')} />
                                  </>
                                );
                              })()}
                            </div>
                            <div className="space-y-0 text-sm py-3 text-foreground">
                              <span className="text-muted-foreground font-medium block mb-2">Features:</span>
                              <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                                {(() => {
                                  const membership = selectedUser.membership as Record<string, any>;
                                  try {
                                    const features = JSON.parse(String(membership.feature || '{}'));
                                    return (Object.entries(features) as [string, any][]).map(([key, val]) => (
                                      <div key={key} className="flex justify-between border-b border-border py-1 last:border-0 capitalize">
                                        <span className="font-medium text-[12px]">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-primary text-[12px] font-semibold">{val === true ? 'Yes' : val === false ? 'No' : String(val || '')}</span>
                                      </div>
                                    ));
                                  } catch {
                                    return <span>{String(membership.feature || '')}</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                          <p className="text-muted-foreground text-sm">No membership details found</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* License Details */}
                    <TabsContent value="licenses">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <h4 className="font-bold text-foreground">License Details</h4>
                          <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 px-2 py-0 text-[10px]">
                            {selectedUserLicenses.length} {selectedUserLicenses.length === 1 ? 'License' : 'Licenses'}
                          </Badge>
                        </div>

                        {selectedUserLicenses.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6">
                            {selectedUserLicenses.map((license, index) => {
                              const licenseId = String(license.id || index);
                              const licenseType = String(license.license_type || '');
                              const validTo = license.valid_to as string | undefined;
                              const validFrom = license.valid_from as string | undefined;
                              const licenseNumber = String(license.license_number || '');
                              const sendAlerts = license.send_alerts;
                              // const tierConstraints = String(license.tier_constraints || '');
                              const licenseIssuer = license.issued_by_entity.organisation
                              const documentUrl = String(license.document_url || '');
                              const photos = license.photos as Record<string, any>[] | undefined;

                              return (
                                <div key={licenseId} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                  <div className="px-5 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                                    <span className="font-bold text-sm text-foreground">License #{index + 1} - {licenseType.toUpperCase()}</span>
                                    <Badge variant={validTo && new Date(validTo) > new Date() ? 'success' : 'destructive'} appearance="light" className="text-[10px]">
                                      {validTo && new Date(validTo) > new Date() ? 'Active' : 'Expired'}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-5 py-2">
                                    <div className="space-y-0">
                                      <InfoRow label="License Number" value={licenseNumber} showCopy />
                                      <InfoRow label="Type" value={licenseType} />
                                      <InfoRow label="Valid From" value={validFrom || ''} />
                                      <InfoRow label="Valid To" value={validTo || ''} />
                                    </div>
                                    <div className="space-y-0">
                                      <InfoRow label="Send Alerts" value={sendAlerts ? 'Yes' : 'No'} />
                                      {/* <InfoRow label="Tier Constraints" value={tierConstraints} /> */}
                                      <InfoRow label="Issued By" value={licenseIssuer} />
                                      <InfoRow label="Document URL" value={documentUrl} showCopy />
                                    </div>
                                  </div>

                                  {photos && photos.length > 0 && (
                                    <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {photos.map((photo, pIdx: number) => {
                                        const photoId = String(photo.id || pIdx);
                                        const frontImage = photo.front_image as string | undefined;
                                        const backImage = photo.back_image as string | undefined;

                                        return (
                                          <React.Fragment key={photoId}>
                                            {frontImage && (
                                              <div className="space-y-1.5">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Front Image</span>
                                                <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden border border-border bg-muted group">
                                                  <img
                                                    src={getAppImageUrl(frontImage)}
                                                    alt="License Front"
                                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                      e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center p-2">Image not found</div>';
                                                    }}
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                                </div>
                                              </div>
                                            )}
                                            {backImage && (
                                              <div className="space-y-1.5">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Back Image</span>
                                                <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden border border-border bg-muted group">
                                                  <img
                                                    src={getAppImageUrl(backImage)}
                                                    alt="License Back"
                                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                      e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center p-2">Image not found</div>';
                                                    }}
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                                </div>
                                              </div>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-muted-foreground text-sm">No licenses found for this user</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Bookmarks (Resource) */}
                    <TabsContent value="resources">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <h4 className="font-bold text-foreground">Bookmarked Resources</h4>
                          <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0 text-[10px]">
                            {selectedUserResources.length} {selectedUserResources.length === 1 ? 'Bookmark' : 'Bookmarks'}
                          </Badge>
                        </div>

                        {selectedUserResources.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6">
                            {selectedUserResources.map((bookmark: any, index) => {
                              const resource = bookmark.resource || {};
                              const resourceId = String(resource.id || index);
                              const title = String(resource.title || 'N/A');
                              const isPublished = resource.is_published;
                              const resourceType = String(resource.resource_type || '');
                              const resourceUrl = resource.resource_url as string | undefined;
                              const category = String(resource.category || '');
                              const content = String(resource.content || '');
                              const createdAt = resource.created_at as string | undefined;
                              const categoryIcon = resource.category_icon as string | undefined;

                              return (
                                <div key={resourceId} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                  <div className="px-5 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                                    <span className="font-bold text-sm text-foreground">Resource #{index + 1} - {title}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={isPublished ? 'success' : 'secondary'} appearance="light" className="text-[10px]">
                                        {isPublished ? 'Published' : 'Draft'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="px-5 py-2">
                                    <Table>
                                      <TableBody>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">Title</TableHead>
                                          <TableCell className="text-sm text-foreground py-2">{title}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">Type</TableHead>
                                          <TableCell className="text-sm text-foreground py-2 capitalize">{resourceType}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">URL</TableHead>
                                          <TableCell className="text-sm text-primary py-2">
                                            <a href={resourceUrl?.startsWith('http') ? resourceUrl : `https://${resourceUrl}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                              {resourceUrl}
                                            </a>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">Category</TableHead>
                                          <TableCell className="text-sm text-foreground py-2">{category}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">Content</TableHead>
                                          <TableCell className="text-sm text-foreground py-2">{content}</TableCell>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent border-b-0">
                                          <TableHead className="text-xs font-semibold text-muted-foreground h-auto py-2">Created At</TableHead>
                                          <TableCell className="text-sm text-foreground py-2">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                  {categoryIcon && (
                                    <div className="px-5 pb-5 pt-2">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider block mb-2">Category Icon</span>
                                      <div className="h-16 w-16 rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                                        <img
                                          src={getAppImageUrl(categoryIcon)}
                                          alt="Category Icon"
                                          className="object-cover w-full h-full"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">Image not found</div>';
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-muted-foreground text-sm">No bookmarks found</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Map Pins */}
                    <TabsContent value="map_pins">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <h4 className="font-bold text-foreground">User Map Pins</h4>
                          <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 px-2 py-0 text-[10px]">
                            {selectedUserMapPins.length} {selectedUserMapPins.length === 1 ? 'Pin' : 'Pins'}
                          </Badge>
                        </div>

                        {selectedUserMapPins.length > 0 ? (
                          <>
                            <div className="grid grid-cols-1 gap-6">
                              {selectedUserMapPins.map((pin: any, index) => {
                                return (
                                  <div key={pin.id || index} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                    <div className="px-5 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                                      <span className="font-bold text-sm text-foreground">Pin #{index + 1}</span>
                                      <Badge variant={pin.visibility === 'public' ? 'success' : 'secondary'} appearance="light" className="text-[10px]">
                                        {pin.visibility}
                                      </Badge>
                                    </div>
                                    <div className="px-5 py-2">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-0 text-sm">
                                          <InfoRow label="Latitude" value={String(pin.latitude || '')} />
                                          <InfoRow label="Longitude" value={String(pin.longitude || '')} />
                                        </div>
                                        <div className="space-y-0 text-sm">
                                          <InfoRow label="Visibility" value={String(pin.visibility || '')} />
                                          <InfoRow label="Created At" value={pin.created_at ? new Date(pin.created_at).toLocaleString() : ''} />
                                        </div>
                                      </div>
                                      <div className="pt-3 pb-2 border-t border-border mt-2">
                                        <p className="text-xs font-semibold text-muted-foreground/60 mb-1">Description</p>
                                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg border border-border">
                                          {pin.description || 'No description provided'}
                                        </p>
                                      </div>
                                      {pin.tags && pin.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                          {pin.tags.map((tag: any, tIdx: number) => (
                                            <Badge key={tIdx} variant="outline" className="text-[10px] rounded-full bg-muted">
                                              {tag.name || tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {selectedUserMapPins.length < (mapPinsTotal || 0) && (
                              <div className="flex justify-center mt-4">
                                <Button onClick={onLoadMoreMapPins} variant="outline">
                                  Load More ({selectedUserMapPins.length} of {mapPinsTotal})
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-muted-foreground text-sm">No map pins found</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetails;