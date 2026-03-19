import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListingsService } from '@modules/listings/listings.service';
import { ListingCategory } from '@modules/listings/dto/create-listing.dto';
import { TextInputDto, AudioInputDto, AiExtractedData } from './dto/ai-listing-input.dto';
import OpenAI from 'openai';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AiListingService {
  private readonly logger = new Logger(AiListingService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly listingsService: ListingsService,
  ) {
    // Inicializar OpenAI se a chave estiver configurada
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for audio transcription');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - audio transcription will use fallback');
    }
  }

  // =============================================
  // TEXT PROCESSING
  // =============================================

  async processTextInput(userId: string, dto: TextInputDto) {
    this.logger.log(`Processing text input for user ${userId}`);

    // Extrair dados do texto
    const extracted = await this.extractDataFromText(dto.text);

    // Criar anúncio
    const listing = await this.listingsService.create(userId, {
      title: extracted.title,
      description: extracted.description || dto.text,
      price: extracted.price,
      priceType: extracted.priceType as any,
      category: extracted.category as ListingCategory,
      subcategory: extracted.subcategory,
      tags: extracted.tags,
      images: dto.images || [],
      city: dto.city,
      state: dto.state,
      aiGenerated: true,
      aiMetadata: {
        rawInput: dto.text,
        extractedData: extracted,
        confidence: extracted.confidence,
        processedAt: new Date().toISOString(),
      },
    });

    return {
      listing,
      aiExtraction: extracted,
    };
  }

  // =============================================
  // AUDIO PROCESSING
  // =============================================

  async processAudioInput(userId: string, dto: AudioInputDto) {
    this.logger.log(`Processing audio input for user ${userId}`);

    // Transcrever áudio
    const transcription = await this.transcribeAudio(dto.audioUrl);

    if (!transcription) {
      throw new BadRequestException('Não foi possível transcrever o áudio');
    }

    // Extrair dados da transcrição
    const extracted = await this.extractDataFromText(transcription);

    // Criar anúncio
    const listing = await this.listingsService.create(userId, {
      title: extracted.title,
      description: extracted.description || transcription,
      price: extracted.price,
      priceType: extracted.priceType as any,
      category: extracted.category as ListingCategory,
      subcategory: extracted.subcategory,
      tags: extracted.tags,
      images: dto.images || [],
      audioUrl: dto.audioUrl,
      city: dto.city,
      state: dto.state,
      aiGenerated: true,
      aiMetadata: {
        rawInput: transcription,
        audioUrl: dto.audioUrl,
        extractedData: extracted,
        confidence: extracted.confidence,
        processedAt: new Date().toISOString(),
      },
    });

    return {
      listing,
      transcription,
      aiExtraction: extracted,
    };
  }

  // =============================================
  // AI EXTRACTION (pode ser substituído por OpenAI/Claude)
  // =============================================

  private async extractDataFromText(text: string): Promise<AiExtractedData> {
    const normalizedText = text.toLowerCase().trim();

    // Extrair preço
    const priceMatch = normalizedText.match(
      /(?:por|r\$|reais|valor|preço|pra|preco)\s*:?\s*(\d+(?:[.,]\d{2})?)/i,
    ) || normalizedText.match(/(\d+(?:[.,]\d{2})?)\s*(?:reais|r\$)/i);

    let price: number | undefined;
    let priceType: 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT' = 'FIXED';

    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', '.'));
    }

    // Verificar tipo de preço
    if (normalizedText.includes('negoci') || normalizedText.includes('aceito proposta')) {
      priceType = 'NEGOTIABLE';
    } else if (normalizedText.includes('grátis') || normalizedText.includes('doação') || normalizedText.includes('dou')) {
      priceType = 'FREE';
      price = 0;
    } else if (normalizedText.includes('a combinar') || normalizedText.includes('consulte')) {
      priceType = 'CONTACT';
      price = undefined;
    }

    // Detectar categoria
    const category = this.detectCategory(normalizedText);

    // Gerar título
    const title = this.generateTitle(text, category);

    // Extrair tags
    const tags = this.extractTags(normalizedText, category);

    // Detectar subcategoria
    const subcategory = this.detectSubcategory(normalizedText, category);

    // Calcular confiança
    const confidence = this.calculateConfidence(price, category, title);

    return {
      title,
      description: this.cleanDescription(text),
      price,
      priceType,
      category,
      subcategory,
      tags,
      confidence,
      rawInput: text,
    };
  }

  private detectCategory(text: string): string {
    const categoryKeywords: Record<string, string[]> = {
      VEHICLES: [
        'carro', 'moto', 'bicicleta', 'bike', 'veículo', 'automóvel',
        'caminhão', 'van', 'ônibus', 'scooter', 'quadriciclo',
      ],
      ELECTRONICS: [
        'celular', 'notebook', 'computador', 'tablet', 'tv', 'televisão',
        'fone', 'headset', 'console', 'playstation', 'xbox', 'iphone',
        'samsung', 'xiaomi', 'apple', 'monitor', 'impressora',
      ],
      FASHION: [
        'roupa', 'vestido', 'calça', 'camisa', 'blusa', 'tênis',
        'sapato', 'bolsa', 'relógio', 'jóia', 'óculos', 'acessório',
      ],
      HOME_GARDEN: [
        'móvel', 'sofá', 'mesa', 'cadeira', 'cama', 'armário',
        'geladeira', 'fogão', 'microondas', 'máquina de lavar',
        'jardim', 'planta', 'decoração',
      ],
      REAL_ESTATE: [
        'casa', 'apartamento', 'kitnet', 'quarto', 'aluguel',
        'alugo', 'vendo casa', 'vendo apartamento', 'imóvel',
        'terreno', 'lote', 'chácara', 'sítio',
      ],
      JOBS: [
        'emprego', 'vaga', 'trabalho', 'contrato', 'freelancer',
        'oportunidade', 'home office', 'meio período', 'integral',
      ],
      SERVICES: [
        'serviço', 'conserto', 'reparo', 'instalação', 'manutenção',
        'limpeza', 'faxina', 'pintura', 'eletricista', 'encanador',
        'pedreiro', 'marceneiro', 'aula', 'curso',
      ],
      PETS: [
        'cachorro', 'gato', 'pet', 'filhote', 'adoção', 'ração',
        'aquário', 'pássaro', 'hamster', 'coelho',
      ],
      SPORTS: [
        'academia', 'musculação', 'bicicleta esportiva', 'esteira',
        'halteres', 'bola', 'chuteira', 'raquete', 'skate',
      ],
      FOOD: [
        'comida', 'lanche', 'bolo', 'doce', 'salgado', 'marmita',
        'encomenda', 'festa', 'cozinha',
      ],
      PRODUCTS: [
        'vendo', 'produto', 'item', 'novo', 'usado',
      ],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return 'OTHER';
  }

  private detectSubcategory(text: string, category: string): string | undefined {
    const subcategoryMap: Record<string, Record<string, string[]>> = {
      VEHICLES: {
        'Carros': ['carro', 'automóvel', 'sedan', 'hatch', 'suv'],
        'Motos': ['moto', 'motocicleta', 'scooter'],
        'Bicicletas': ['bicicleta', 'bike', 'aro'],
      },
      ELECTRONICS: {
        'Smartphones': ['celular', 'iphone', 'samsung', 'xiaomi', 'smartphone'],
        'Computadores': ['notebook', 'computador', 'pc', 'laptop'],
        'Games': ['console', 'playstation', 'xbox', 'nintendo', 'jogo'],
        'Áudio': ['fone', 'caixa de som', 'headset', 'airpods'],
      },
      REAL_ESTATE: {
        'Apartamentos': ['apartamento', 'apto', 'kitnet'],
        'Casas': ['casa', 'sobrado'],
        'Terrenos': ['terreno', 'lote'],
        'Aluguel': ['alugo', 'aluguel', 'para alugar'],
      },
    };

    const categorySubcats = subcategoryMap[category];
    if (!categorySubcats) return undefined;

    for (const [subcat, keywords] of Object.entries(categorySubcats)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return subcat;
      }
    }

    return undefined;
  }

  private generateTitle(text: string, category: string): string {
    // Remover preços e informações extras
    let title = text
      .replace(/(?:por|r\$|reais|valor|preço)\s*:?\s*\d+(?:[.,]\d{2})?/gi, '')
      .replace(/\d+(?:[.,]\d{2})?\s*(?:reais|r\$)/gi, '')
      .replace(/aceito\s+(?:negociação|proposta|troca)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalizar primeira letra
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Limitar tamanho
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }

    return title || `Anúncio de ${category.toLowerCase()}`;
  }

  private extractTags(text: string, category: string): string[] {
    const tags: Set<string> = new Set();

    // Adicionar categoria como tag
    tags.add(category.toLowerCase());

    // Palavras comuns para tags
    const tagPatterns = [
      /novo/i,
      /usado/i,
      /semi[\s-]?novo/i,
      /original/i,
      /importado/i,
      /nacional/i,
      /urgente/i,
      /oportunidade/i,
      /único/i,
      /raridade/i,
    ];

    tagPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          tags.add(match[0].toLowerCase().replace(/[\s-]/g, ''));
        }
      }
    });

    // Extrair marcas
    const brands = ['apple', 'samsung', 'xiaomi', 'motorola', 'lg', 'sony', 'dell', 'hp', 'lenovo'];
    brands.forEach((brand) => {
      if (text.includes(brand)) {
        tags.add(brand);
      }
    });

    return Array.from(tags).slice(0, 10);
  }

  private cleanDescription(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
  }

  private calculateConfidence(
    price: number | undefined,
    category: string,
    title: string,
  ): number {
    let confidence = 0.5;

    // Preço detectado aumenta confiança
    if (price !== undefined) {
      confidence += 0.2;
    }

    // Categoria específica aumenta confiança
    if (category !== 'OTHER' && category !== 'PRODUCTS') {
      confidence += 0.2;
    }

    // Título com mais de 10 caracteres aumenta confiança
    if (title.length > 10) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  // =============================================
  // AUDIO TRANSCRIPTION (OpenAI Whisper)
  // =============================================

  private async transcribeAudio(audioUrl: string): Promise<string> {
    this.logger.log(`Transcribing audio from: ${audioUrl}`);

    // Se OpenAI não estiver configurado, usar extração básica do nome do arquivo
    if (!this.openai) {
      this.logger.warn('OpenAI not configured, using fallback transcription');
      return this.fallbackTranscription(audioUrl);
    }

    try {
      // Baixar o arquivo de áudio
      const tempFilePath = await this.downloadAudioFile(audioUrl);

      try {
        // Transcrever usando OpenAI Whisper
        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: 'whisper-1',
          language: 'pt',
          response_format: 'text',
        });

        this.logger.log(`Transcription successful: ${transcription.substring(0, 50)}...`);
        return transcription;
      } finally {
        // Limpar arquivo temporário
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          this.logger.warn(`Failed to delete temp file: ${tempFilePath}`);
        }
      }
    } catch (error) {
      this.logger.error('OpenAI transcription failed:', error);
      throw new BadRequestException(
        'Não foi possível transcrever o áudio. Por favor, tente novamente ou use a entrada de texto.',
      );
    }
  }

  private async downloadAudioFile(url: string): Promise<string> {
    const tempDir = os.tmpdir();
    const fileName = `audio_${Date.now()}.m4a`;
    const filePath = path.join(tempDir, fileName);

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);

      https.get(url, (response) => {
        // Seguir redirecionamentos
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(filePath);
            return this.downloadAudioFile(redirectUrl).then(resolve).catch(reject);
          }
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Limpar arquivo em caso de erro
        reject(err);
      });
    });
  }

  private fallbackTranscription(audioUrl: string): string {
    // Em modo fallback, retornamos uma mensagem padrão
    // que será melhorada pelo motor de extração
    this.logger.log('Using fallback transcription - audio will need manual input');
    throw new BadRequestException(
      'Transcrição de áudio não está disponível no momento. Por favor, digite seu anúncio manualmente.',
    );
  }

  // =============================================
  // PREVIEW (sem criar anúncio)
  // =============================================

  async previewTextExtraction(text: string) {
    const extracted = await this.extractDataFromText(text);
    return {
      preview: true,
      extraction: extracted,
    };
  }
}
