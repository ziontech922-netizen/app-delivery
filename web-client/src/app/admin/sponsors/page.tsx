'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  MapPin,
  Tag,
  BarChart3,
  Eye,
  MousePointer,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { formatDate } from '@/utils/format';
import api from '@/services/api';

// ===========================================
// TYPES
// ===========================================

type SponsorPlacement = 
  | 'HOME_BANNER'
  | 'CATEGORY_HEADER'
  | 'FEED_INLINE'
  | 'SEARCH_RESULTS'
  | 'LISTING_DETAIL'
  | 'FEATURED_CAROUSEL';

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  placements: SponsorPlacement[];
  priority: number;
  targetCities: string[];
  targetCategories: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

interface SponsorFormData {
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  websiteUrl: string;
  placements: SponsorPlacement[];
  priority: number;
  targetCities: string[];
  targetCategories: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const initialFormData: SponsorFormData = {
  name: '',
  description: '',
  logoUrl: '',
  bannerUrl: '',
  websiteUrl: '',
  placements: ['HOME_BANNER'],
  priority: 0,
  targetCities: [],
  targetCategories: [],
  startDate: '',
  endDate: '',
  isActive: true,
};

const PLACEMENT_OPTIONS: { value: SponsorPlacement; label: string }[] = [
  { value: 'HOME_BANNER', label: 'Banner Home' },
  { value: 'CATEGORY_HEADER', label: 'Header Categoria' },
  { value: 'FEED_INLINE', label: 'Feed Inline' },
  { value: 'SEARCH_RESULTS', label: 'Resultados Busca' },
  { value: 'LISTING_DETAIL', label: 'Detalhe Anúncio' },
  { value: 'FEATURED_CAROUSEL', label: 'Carrossel Destaque' },
];

// ===========================================
// SPONSOR SERVICE
// ===========================================

const sponsorService = {
  async getAll(params?: { activeOnly?: boolean }): Promise<{ data: Sponsor[]; meta: { total: number } }> {
    const response = await api.get('/sponsors', { params });
    return response.data;
  },
  async create(data: SponsorFormData): Promise<Sponsor> {
    const response = await api.post('/sponsors', data);
    return response.data;
  },
  async update(id: string, data: Partial<SponsorFormData>): Promise<Sponsor> {
    const response = await api.put(`/sponsors/${id}`, data);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/sponsors/${id}`);
  },
  async getMetrics(id: string): Promise<{ impressions: number; clicks: number; ctr: string }> {
    const response = await api.get(`/sponsors/${id}/metrics`);
    return response.data;
  },
};

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function AdminSponsorsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState<SponsorFormData>(initialFormData);
  const [newCity, setNewCity] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Fetch sponsors
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sponsors', statusFilter],
    queryFn: () => sponsorService.getAll({
      activeOnly: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: SponsorFormData) => sponsorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sponsors'] });
      closeFormModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SponsorFormData> }) =>
      sponsorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sponsors'] });
      closeFormModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sponsorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sponsors'] });
      setShowDeleteModal(false);
      setDeletingSponsor(null);
    },
  });

  const sponsors = data?.data || [];
  const filteredSponsors = sponsors.filter((s) =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingSponsor(null);
    setFormData(initialFormData);
    setShowFormModal(true);
  };

  const openEditModal = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      description: sponsor.description || '',
      logoUrl: sponsor.logoUrl || '',
      bannerUrl: sponsor.bannerUrl || '',
      websiteUrl: sponsor.websiteUrl || '',
      placements: sponsor.placements,
      priority: sponsor.priority,
      targetCities: sponsor.targetCities,
      targetCategories: sponsor.targetCategories,
      startDate: sponsor.startDate.split('T')[0],
      endDate: sponsor.endDate.split('T')[0],
      isActive: sponsor.isActive,
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingSponsor(null);
    setFormData(initialFormData);
  };

  const openDeleteModal = (sponsor: Sponsor) => {
    setDeletingSponsor(sponsor);
    setShowDeleteModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };
    
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handlePlacementToggle = (placement: SponsorPlacement) => {
    setFormData(prev => ({
      ...prev,
      placements: prev.placements.includes(placement)
        ? prev.placements.filter(p => p !== placement)
        : [...prev.placements, placement],
    }));
  };

  const addCity = () => {
    if (newCity.trim() && !formData.targetCities.includes(newCity.trim())) {
      setFormData(prev => ({
        ...prev,
        targetCities: [...prev.targetCities, newCity.trim()],
      }));
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      targetCities: prev.targetCities.filter(c => c !== city),
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.targetCategories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        targetCategories: [...prev.targetCategories, newCategory.trim()],
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      targetCategories: prev.targetCategories.filter(c => c !== category),
    }));
  };

  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0.00%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isUpcoming = (startDate: string) => new Date(startDate) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrocinadores</h1>
          <p className="text-gray-500 mt-1">Gerenciar campanhas de patrocinadores</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Patrocinador
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Filtrar por status"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sponsors List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredSponsors.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum patrocinador encontrado</h3>
          <p className="text-gray-500 mb-4">Crie seu primeiro patrocinador para começar</p>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Patrocinador
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSponsors.map((sponsor) => (
            <Card key={sponsor.id} className="overflow-hidden">
              {/* Banner */}
              {sponsor.bannerUrl ? (
                <div className="h-32 bg-gray-100">
                  <img
                    src={sponsor.bannerUrl}
                    alt={sponsor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-white/50" />
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {sponsor.isActive && !isExpired(sponsor.endDate) ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ativo
                          </span>
                        ) : isExpired(sponsor.endDate) ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Expirado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                        {isUpcoming(sponsor.startDate) && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Agendado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sponsor)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(sponsor)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {sponsor.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{sponsor.description}</p>
                )}

                {/* Placements */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {sponsor.placements.map((placement) => (
                    <span
                      key={placement}
                      className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded"
                    >
                      {PLACEMENT_OPTIONS.find(p => p.value === placement)?.label || placement}
                    </span>
                  ))}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(sponsor.startDate)} - {formatDate(sponsor.endDate)}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                      <Eye className="h-3 w-3" />
                      Impressões
                    </div>
                    <p className="font-semibold text-gray-900">{sponsor.impressions.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                      <MousePointer className="h-3 w-3" />
                      Cliques
                    </div>
                    <p className="font-semibold text-gray-900">{sponsor.clicks.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                      <BarChart3 className="h-3 w-3" />
                      CTR
                    </div>
                    <p className="font-semibold text-primary-600">{calculateCTR(sponsor.impressions, sponsor.clicks)}</p>
                  </div>
                </div>

                {/* Website Link */}
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visitar Site
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSponsor ? 'Editar Patrocinador' : 'Novo Patrocinador'}
              </h2>
              <button onClick={closeFormModal} className="p-2 hover:bg-gray-100 rounded-lg" title="Fechar">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder="Nome do patrocinador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Descrição do patrocinador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Logo
                    </label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Banner
                    </label>
                    <input
                      type="url"
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Site
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Placements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posições de Exibição *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PLACEMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handlePlacementToggle(option.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.placements.includes(option.value)
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority and Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Target Cities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidades Alvo (vazio = todas)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome da cidade"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                  />
                  <Button type="button" onClick={addCity} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetCities.map((city) => (
                    <span
                      key={city}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {city}
                      <button type="button" onClick={() => removeCity(city)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorias Alvo (vazio = todas)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome da categoria"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  />
                  <Button type="button" onClick={addCategory} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {category}
                      <button type="button" onClick={() => removeCategory(category)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
                <span className="text-sm text-gray-700">Patrocinador ativo</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeFormModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingSponsor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Excluir Patrocinador</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{deletingSponsor.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingSponsor(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deletingSponsor.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
