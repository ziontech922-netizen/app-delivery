'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  Filter,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  MoreVertical,
  MapPin,
  Calendar,
  User,
  Tag,
  DollarSign,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { formatDate } from '@/utils/format';
import api from '@/services/api';

// ===========================================
// TYPES
// ===========================================

type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'PENDING' | 'REPORTED';
type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'FOR_PARTS';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';
  category: string;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[];
  city: string;
  state: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userHandle: string | null;
  };
}

interface ListingFilters {
  status?: ListingStatus;
  category?: string;
  search?: string;
}

// ===========================================
// CONSTANTS
// ===========================================

const statusColors: Record<ListingStatus, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  SOLD: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Vendido' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  REPORTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Denunciado' },
};

const conditionLabels: Record<ListingCondition, string> = {
  NEW: 'Novo',
  LIKE_NEW: 'Semi-novo',
  GOOD: 'Bom estado',
  FAIR: 'Usado',
  FOR_PARTS: 'Para peças',
};

const CATEGORIES = [
  { value: 'VEHICLES', label: 'Veículos' },
  { value: 'ELECTRONICS', label: 'Eletrônicos' },
  { value: 'HOME', label: 'Casa' },
  { value: 'FASHION', label: 'Moda' },
  { value: 'SPORTS', label: 'Esportes' },
  { value: 'SERVICES', label: 'Serviços' },
  { value: 'JOBS', label: 'Empregos' },
  { value: 'OTHER', label: 'Outros' },
];

// ===========================================
// LISTING SERVICE
// ===========================================

const listingAdminService = {
  async getListings(filters: ListingFilters = {}, page = 1, limit = 20) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/listings?${params.toString()}`);
    return response.data;
  },
  
  async deleteListing(id: string) {
    const response = await api.delete(`/listings/${id}`);
    return response.data;
  },
  
  async updateListingStatus(id: string, status: ListingStatus) {
    const response = await api.put(`/listings/${id}`, { status });
    return response.data;
  },
};

// ===========================================
// COMPONENT
// ===========================================

export default function AdminListingsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionModal, setActionModal] = useState<'view' | 'delete' | 'deactivate' | null>(null);
  const [page, setPage] = useState(1);

  // Fetch listings
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listings', statusFilter, categoryFilter, searchQuery, page],
    queryFn: () => listingAdminService.getListings(
      {
        status: statusFilter !== 'all' ? statusFilter as ListingStatus : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      },
      page
    ),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => listingAdminService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      setActionModal(null);
      setSelectedListing(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => listingAdminService.updateListingStatus(id, 'INACTIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      setActionModal(null);
      setSelectedListing(null);
    },
  });

  const listings: Listing[] = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const formatPrice = (price: number | null, priceType: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'A combinar';
    if (!price) return 'Consulte';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anúncios</h1>
          <p className="text-gray-600">Gerenciar anúncios do marketplace</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="w-4 h-4" />
          <span>{total} anúncios</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(statusColors).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Listings Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : listings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum anúncio encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {listings.map((listing) => {
                  const statusStyle = statusColors[listing.status] || statusColors.ACTIVE;
                  const categoryInfo = CATEGORIES.find(c => c.value === listing.category);

                  return (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {listing.images[0] ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-xs">
                              {listing.title}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.city}, {listing.state}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">
                            {listing.user.firstName} {listing.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{listing.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-lg">
                          <Tag className="w-3 h-3" />
                          {categoryInfo?.label || listing.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {formatPrice(listing.price, listing.priceType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-4 h-4" />
                          {listing.viewCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(listing.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setActionModal('view');
                            }}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {listing.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setActionModal('deactivate');
                              }}
                              className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Desativar"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setActionModal('delete');
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Modal */}
      {actionModal === 'view' && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Anúncio</h2>
              <button
                onClick={() => {
                  setActionModal(null);
                  setSelectedListing(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Images */}
              {selectedListing.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedListing.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Imagem ${i + 1}`}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedListing.title}</h3>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {formatPrice(selectedListing.price, selectedListing.priceType)}
                  </p>
                </div>

                <p className="text-gray-600">{selectedListing.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Categoria:</span>
                    <p className="font-medium">{CATEGORIES.find(c => c.value === selectedListing.category)?.label}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Condição:</span>
                    <p className="font-medium">{conditionLabels[selectedListing.condition]}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Localização:</span>
                    <p className="font-medium">{selectedListing.city}, {selectedListing.state}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Visualizações:</span>
                    <p className="font-medium">{selectedListing.viewCount}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Vendedor</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedListing.user.firstName} {selectedListing.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selectedListing.user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {actionModal === 'delete' && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excluir Anúncio</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir o anúncio &quot;{selectedListing.title}&quot;? Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionModal(null);
                    setSelectedListing(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate(selectedListing.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Deactivate Modal */}
      {actionModal === 'deactivate' && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Desativar Anúncio</h3>
              <p className="text-gray-600 mb-6">
                Desativar o anúncio &quot;{selectedListing.title}&quot;? Ele não aparecerá mais nas buscas.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionModal(null);
                    setSelectedListing(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => deactivateMutation.mutate(selectedListing.id)}
                  disabled={deactivateMutation.isPending}
                >
                  {deactivateMutation.isPending ? 'Desativando...' : 'Desativar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
