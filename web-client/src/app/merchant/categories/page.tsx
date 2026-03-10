'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  X,
  Save,
  Package,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { merchantDashboardService, MerchantCategory } from '@/services/merchant.dashboard.service';

type CategoryFormData = {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function MerchantCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MerchantCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<MerchantCategory | null>(null);

  // Fetch categories
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'categories'],
    queryFn: () => merchantDashboardService.getCategories(),
    placeholderData: {
      data: [
        {
          id: 'c1',
          restaurantId: 'r1',
          name: 'Pizzas',
          description: 'Nossas deliciosas pizzas artesanais',
          sortOrder: 1,
          isActive: true,
          productCount: 8,
        },
        {
          id: 'c2',
          restaurantId: 'r1',
          name: 'Bebidas',
          description: 'Refrigerantes, sucos e mais',
          sortOrder: 2,
          isActive: true,
          productCount: 5,
        },
        {
          id: 'c3',
          restaurantId: 'r1',
          name: 'Sobremesas',
          description: 'Doces especiais para finalizar sua refeição',
          sortOrder: 3,
          isActive: true,
          productCount: 3,
        },
        {
          id: 'c4',
          restaurantId: 'r1',
          name: 'Combos',
          description: 'Ofertas especiais com desconto',
          sortOrder: 4,
          isActive: true,
          productCount: 4,
        },
        {
          id: 'c5',
          restaurantId: 'r1',
          name: 'Entradas',
          description: 'Para começar bem',
          sortOrder: 5,
          isActive: false,
          productCount: 0,
        },
      ],
      total: 5,
      page: 1,
      totalPages: 1,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => merchantDashboardService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'categories'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      merchantDashboardService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'categories'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => merchantDashboardService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'categories'] });
      setShowDeleteModal(false);
      setDeletingCategory(null);
    },
  });

  const categories = data?.data || [];

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      ...initialFormData,
      sortOrder: categories.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (category: MerchantCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (category: MerchantCategory) => {
    updateMutation.mutate({
      id: category.id,
      data: { isActive: !category.isActive },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">Organize os produtos do seu cardápio</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada</p>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Categoria
          </Button>
        </Card>
      ) : (
        <Card className="divide-y">
          {categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((category) => (
              <div
                key={category.id}
                className={`p-4 flex items-center gap-4 ${!category.isActive ? 'opacity-50' : ''}`}
              >
                {/* Drag Handle */}
                <div className="text-gray-400 cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order Badge */}
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{category.sortOrder}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {!category.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{category.description}</p>
                </div>

                {/* Product Count */}
                <div className="flex items-center gap-2 text-gray-500">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">{category.productCount} produtos</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(category)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    title={category.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {category.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingCategory(category);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                    disabled={category.productCount > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Dica:</strong> Arraste as categorias para reorganizar a ordem em que aparecem no
          cardápio. Categorias desativadas não aparecem para os clientes.
        </p>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pizzas, Bebidas, Sobremesas"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Uma breve descrição da categoria..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Categoria ativa (visível no cardápio)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Excluir Categoria</h3>

            {deletingCategory.productCount > 0 ? (
              <>
                <p className="text-gray-500 mb-6">
                  A categoria <strong>{deletingCategory.name}</strong> possui{' '}
                  <strong>{deletingCategory.productCount} produtos</strong> associados. Remova ou
                  mova os produtos antes de excluir a categoria.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Entendi
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-6">
                  Tem certeza que deseja excluir a categoria{' '}
                  <strong>{deletingCategory.name}</strong>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingCategory(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => deleteMutation.mutate(deletingCategory.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    Excluir
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
