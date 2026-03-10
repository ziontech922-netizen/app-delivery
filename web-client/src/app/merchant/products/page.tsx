'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  X,
  Save,
  Package,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { merchantDashboardService, MerchantProduct, MerchantCategory } from '@/services/merchant.dashboard.service';
import { formatCurrency } from '@/utils/format';

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  imageUrl: string;
  preparationTime: number;
  isAvailable: boolean;
};

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  imageUrl: '',
  preparationTime: 20,
  isAvailable: true,
};

export default function MerchantProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MerchantProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<MerchantProduct | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['merchant', 'categories'],
    queryFn: () => merchantDashboardService.getCategories(),
    placeholderData: {
      data: [
        { id: 'c1', restaurantId: 'r1', name: 'Pizzas', description: 'Nossas deliciosas pizzas', sortOrder: 1, isActive: true, productCount: 8 },
        { id: 'c2', restaurantId: 'r1', name: 'Bebidas', description: 'Refrigerantes, sucos e mais', sortOrder: 2, isActive: true, productCount: 5 },
        { id: 'c3', restaurantId: 'r1', name: 'Sobremesas', description: 'Doces especiais', sortOrder: 3, isActive: true, productCount: 3 },
        { id: 'c4', restaurantId: 'r1', name: 'Combos', description: 'Ofertas especiais', sortOrder: 4, isActive: true, productCount: 4 },
      ],
      total: 4,
      page: 1,
      totalPages: 1,
    },
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['merchant', 'products', searchTerm, selectedCategory],
    queryFn: () =>
      merchantDashboardService.getProducts({
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
      }),
    placeholderData: {
      data: [
        {
          id: 'p1',
          restaurantId: 'r1',
          categoryId: 'c1',
          categoryName: 'Pizzas',
          name: 'Pizza Margherita',
          description: 'Molho de tomate, mussarela e manjericão fresco',
          price: 45.9,
          originalPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300',
          isAvailable: true,
          preparationTime: 25,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'p2',
          restaurantId: 'r1',
          categoryId: 'c1',
          categoryName: 'Pizzas',
          name: 'Pizza Calabresa',
          description: 'Calabresa fatiada, cebola e mussarela',
          price: 42.9,
          originalPrice: 49.9,
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300',
          isAvailable: true,
          preparationTime: 25,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'p3',
          restaurantId: 'r1',
          categoryId: 'c1',
          categoryName: 'Pizzas',
          name: 'Pizza Portuguesa',
          description: 'Presunto, ovos, cebola, ervilhas e mussarela',
          price: 48.9,
          originalPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
          isAvailable: false,
          preparationTime: 30,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'p4',
          restaurantId: 'r1',
          categoryId: 'c2',
          categoryName: 'Bebidas',
          name: 'Refrigerante 2L',
          description: 'Coca-Cola, Guaraná ou Fanta',
          price: 12.0,
          originalPrice: null,
          imageUrl: null,
          isAvailable: true,
          preparationTime: 5,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'p5',
          restaurantId: 'r1',
          categoryId: 'c3',
          categoryName: 'Sobremesas',
          name: 'Petit Gateau',
          description: 'Bolo de chocolate com recheio cremoso e sorvete',
          price: 22.9,
          originalPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300',
          isAvailable: true,
          preparationTime: 15,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      total: 5,
      page: 1,
      totalPages: 1,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => merchantDashboardService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'products'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      merchantDashboardService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'products'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => merchantDashboardService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'products'] });
      setShowDeleteModal(false);
      setDeletingProduct(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => 
      merchantDashboardService.toggleProductAvailability(id, !isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'products'] });
    },
  });

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (product: MerchantProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      preparationTime: product.preparationTime,
      isAvailable: product.isAvailable,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie os produtos do seu cardápio</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Nenhum produto encontrado</p>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Indisponível
                    </span>
                  </div>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      PROMOÇÃO
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-primary-600">{product.categoryName}</p>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: product.id, isAvailable: product.isAvailable })}
                    className="text-gray-400 hover:text-gray-600"
                    title={product.isAvailable ? 'Desativar' : 'Ativar'}
                  >
                    {product.isAvailable ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="ml-2 text-sm text-gray-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingProduct(product);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pizza Margherita"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o produto..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço *
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Original
                    </label>
                    <Input
                      type="number"
                      value={formData.originalPrice || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalPrice: parseFloat(e.target.value) || undefined,
                        })
                      }
                      min="0"
                      step="0.01"
                      placeholder="Deixe vazio se não houver promoção"
                    />
                  </div>
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo de Preparo (min) *
                  </label>
                  <Input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationTime: parseInt(e.target.value) || 20 })
                    }
                    min="1"
                    max="120"
                    required
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem
                  </label>
                  <Input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {/* Available */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isAvailable" className="text-sm text-gray-700">
                    Produto disponível para venda
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
                  {editingProduct ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Excluir Produto</h3>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir o produto <strong>{deletingProduct.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deletingProduct.id)}
                isLoading={deleteMutation.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
