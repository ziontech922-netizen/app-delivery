export { default as api } from './api';
export { authService } from './auth.service';
export { merchantService } from './merchant.service';
export { productService } from './product.service';
export { orderService, addressService } from './order.service';
export { paymentService } from './payment.service';
export { uploadService, type UploadType } from './upload.service';
export * from './socket';

// Super App Services
export { chatService } from './chat.service';
export { feedService } from './feed.service';
export { sponsorService } from './sponsor.service';

// Re-export types
export type { 
  Message, 
  Conversation, 
  ChatUser, 
  MessageType, 
  SendMessagePayload 
} from './chat.service';
export type { 
  FeedItem, 
  FeedItemType, 
  FeedQuery, 
  FeedResponse 
} from './feed.service';
export type { 
  Sponsor, 
  SponsorPlacement, 
  SponsorResponse 
} from './sponsor.service';
