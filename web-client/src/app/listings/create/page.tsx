'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  X,
  Sparkles,
  Check,
  Loader2,
  Camera,
  Tag,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { listingService, type CreateListingDto, type ListingCategory, type AiListingResponse } from '@/services/listing.service';
import { useAuthStore } from '@/store';

// ===========================================
// CONSTANTS
// ===========================================

const LISTING_CATEGORIES: { value: ListingCategory; label: string; icon: string }[] = [
  { value: 'PRODUCTS', label: 'Produtos', icon: '📦' },
  { value: 'SERVICES', label: 'Serviços', icon: '🔧' },
  { value: 'VEHICLES', label: 'Veículos', icon: '🚗' },
  { value: 'REAL_ESTATE', label: 'Imóveis', icon: '🏠' },
  { value: 'JOBS', label: 'Empregos', icon: '💼' },
  { value: 'FOOD', label: 'Alimentos', icon: '🍔' },
  { value: 'ELECTRONICS', label: 'Eletrônicos', icon: '📱' },
  { value: 'FASHION', label: 'Moda', icon: '👗' },
  { value: 'HOME_GARDEN', label: 'Casa & Jardim', icon: '🏡' },
  { value: 'SPORTS', label: 'Esportes', icon: '⚽' },
  { value: 'PETS', label: 'Pets', icon: '🐾' },
  { value: 'OTHER', label: 'Outros', icon: '📌' },
];

const PRICE_TYPES = [
  { value: 'FIXED', label: 'Preço fixo' },
  { value: 'NEGOTIABLE', label: 'Negociável' },
  { value: 'FREE', label: 'Grátis' },
  { value: 'CONTACT', label: 'Sob consulta' },
] as const;

// ===========================================
// COMPONENTS
// ===========================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step < currentStep
                ? 'bg-green-500 text-white'
                : step === currentStep
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? <Check className="h-4 w-4" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-12 h-1 mx-1 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ImageUploader({
  images,
  onAddImages,
  onRemoveImage,
}: {
  images: string[];
  onAddImages: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Fotos do anúncio (até 5)
      </label>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={url}
              alt={`Imagem ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-orange-50">
            <Camera className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Adicionar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function AiPreviewCard({
  preview,
  onEdit,
  onConfirm,
  isLoading,
}: {
  preview: AiListingResponse;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { aiExtraction } = preview;
  const categoryInfo = LISTING_CATEGORIES.find((c) => c.value === aiExtraction.category);

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-600">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Gerado por IA</span>
        </div>
        <span className="text-sm text-gray-500">
          {Math.round(aiExtraction.confidence * 100)}% confiança
        </span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900">{aiExtraction.title}</h3>

      {aiExtraction.description && (
        <p className="text-gray-600 line-clamp-3">{aiExtraction.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {aiExtraction.price != null && (
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="h-4 w-4" />
            <span>R$ {aiExtraction.price.toLocaleString('pt-BR')}</span>
          </div>
        )}
        {categoryInfo && (
          <div className="flex items-center gap-1 text-blue-600">
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.label}</span>
          </div>
        )}
      </div>

      {aiExtraction.tags && aiExtraction.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {aiExtraction.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Editar manualmente
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Publicar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ===========================================
// MAIN PAGE
// ===========================================

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // State
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [aiText, setAiText] = useState('');
  const [aiPreview, setAiPreview] = useState<AiListingResponse | null>(null);
  const [images, setImages] = useState<string[]>([]);

  // Manual form state
  const [formData, setFormData] = useState<CreateListingDto>({
    title: '',
    description: '',
    price: undefined,
    priceType: 'FIXED',
    category: 'PRODUCTS',
    tags: [],
    city: '',
    state: '',
    neighborhood: '',
    images: [],
  });
  const [tagInput, setTagInput] = useState('');

  // Mutations
  const aiMutation = useMutation({
    mutationFn: (text: string) => listingService.createFromText(text, images.length > 0 ? images : undefined),
    onSuccess: (data) => {
      setAiPreview(data);
      setStep(2);
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateListingDto) => listingService.create(dto),
    onSuccess: (listing) => {
      setStep(3);
      setTimeout(() => {
        router.push(`/listings/${listing.id}`);
      }, 2000);
    },
  });

  // Handlers
  const handleAddImages = (files: FileList) => {
    // In a real app, you'd upload to a storage service
    // For now, we'll use data URLs for preview
    Array.from(files).slice(0, 5 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiSubmit = () => {
    if (!aiText.trim()) return;
    aiMutation.mutate(aiText);
  };

  const handleAiConfirm = () => {
    if (!aiPreview) return;
    const { listing, aiExtraction } = aiPreview;
    createMutation.mutate({
      title: aiExtraction.title,
      description: aiExtraction.description,
      price: aiExtraction.price,
      priceType: (aiExtraction.priceType || 'FIXED') as 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT',
      category: aiExtraction.category as ListingCategory,
      subcategory: aiExtraction.subcategory,
      tags: aiExtraction.tags,
      images,
    });
  };

  const handleAiEdit = () => {
    if (!aiPreview) return;
    const { aiExtraction } = aiPreview;
    setFormData({
      title: aiExtraction.title,
      description: aiExtraction.description,
      price: aiExtraction.price,
      priceType: (aiExtraction.priceType || 'FIXED') as 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT',
      category: aiExtraction.category as ListingCategory,
      subcategory: aiExtraction.subcategory,
      tags: aiExtraction.tags || [],
      images,
    });
    setMode('manual');
    setStep(1);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      images,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((_, i) => i !== index),
    });
  };

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login necessário</h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para criar um anúncio.
          </p>
          <Link
            href="/login?redirect=/listings/create"
            className="inline-block w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  // Success step
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Anúncio publicado!</h2>
          <p className="text-gray-600 mb-4">
            Seu anúncio foi criado com sucesso e já está disponível.
          </p>
          <Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/listings"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Criar Anúncio</h1>
              <p className="text-sm text-gray-500">
                {mode === 'ai' ? 'Descreva o que quer anunciar' : 'Preencha os detalhes'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <StepIndicator currentStep={step} totalSteps={3} />

        {/* Mode selector */}
        {step === 1 && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'ai'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              Com IA
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
              }`}
            >
              <FileText className="h-5 w-5" />
              Manual
            </button>
          </div>
        )}

        {/* AI Mode */}
        {step === 1 && mode === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Descreva seu anúncio</h3>
                  <p className="text-sm text-gray-500">
                    Digite ou fale o que você quer vender. Nossa IA vai preencher tudo automaticamente!
                  </p>
                </div>
              </div>

              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Ex: Vendo iPhone 12 128GB, preto, com caixa original e todos os acessórios. Bateria 92%. Preço R$ 2.500, aceito propostas..."
                rows={5}
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />

              <ImageUploader
                images={images}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
              />

              <button
                type="button"
                onClick={handleAiSubmit}
                disabled={!aiText.trim() || aiMutation.isPending}
                className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Gerar anúncio com IA
                  </>
                )}
              </button>

              {aiMutation.isError && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Erro ao processar. Tente novamente.
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Preview */}
        {step === 2 && aiPreview && (
          <AiPreviewCard
            preview={aiPreview}
            onEdit={handleAiEdit}
            onConfirm={handleAiConfirm}
            isLoading={createMutation.isPending}
          />
        )}

        {/* Manual Mode */}
        {step === 1 && mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: iPhone 12 128GB Preto"
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os detalhes do seu anúncio..."
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ListingCategory })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="priceType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de preço
                  </label>
                  <select
                    id="priceType"
                    value={formData.priceType}
                    onChange={(e) => setFormData({ ...formData, priceType: e.target.value as 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT' })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {PRICE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Adicione tags..."
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    aria-label="Adicionar tag"
                  >
                    <Tag className="h-5 w-5" />
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="hover:text-orange-900"
                          aria-label={`Remover tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <ImageUploader
                images={images}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!formData.title.trim() || createMutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Publicar Anúncio
                </>
              )}
            </button>

            {createMutation.isError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Erro ao publicar. Tente novamente.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
