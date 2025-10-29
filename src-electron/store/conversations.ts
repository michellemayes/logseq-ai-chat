import Store from 'electron-store';
import { Conversation, ConversationMetadata } from '../types';
import { randomUUID } from 'crypto';

interface ConversationStoreData {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
}

const defaultData: ConversationStoreData = {
  conversations: {},
  activeConversationId: null,
};

const conversationStore = new Store<ConversationStoreData>({
  name: 'conversations',
  defaults: defaultData,
});

export function createConversation(title: string): Conversation {
  const now = Date.now();
  const id = randomUUID();
  const conversation: Conversation = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  
  const conversations = conversationStore.get('conversations') || {};
  conversations[id] = conversation;
  conversationStore.set('conversations', conversations);
  conversationStore.set('activeConversationId', id);
  
  return conversation;
}

export function getConversation(id: string): Conversation | null {
  const conversations = conversationStore.get('conversations') || {};
  return conversations[id] || null;
}

export function getAllConversations(): Conversation[] {
  const conversations = conversationStore.get('conversations') || {};
  return Object.values(conversations);
}

export function getConversationMetadata(): ConversationMetadata[] {
  const conversations = getAllConversations();
  return conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messageCount: conv.messages.length,
    lastMessagePreview: conv.messages.length > 0 
      ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
      : undefined,
  })).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveConversation(conversation: Conversation): void {
  conversation.updatedAt = Date.now();
  const conversations = conversationStore.get('conversations') || {};
  conversations[conversation.id] = conversation;
  conversationStore.set('conversations', conversations);
  conversationStore.set('activeConversationId', conversation.id);
}

export function deleteConversation(id: string): void {
  const conversations = conversationStore.get('conversations') || {};
  delete conversations[id];
  conversationStore.set('conversations', conversations);
  const activeId = conversationStore.get('activeConversationId');
  if (activeId === id) {
    conversationStore.set('activeConversationId', null);
  }
}

export function getActiveConversationId(): string | null {
  return conversationStore.get('activeConversationId') || null;
}

export function setActiveConversationId(id: string | null): void {
  conversationStore.set('activeConversationId', id);
}

export function searchConversations(query: string): ConversationMetadata[] {
  const lowerQuery = query.toLowerCase();
  const conversations = getAllConversations();
  
  return conversations
    .filter(conv => {
      // Search in title
      if (conv.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Search in message content
      return conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
    })
    .map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length,
      lastMessagePreview: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
        : undefined,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearAllConversations(): void {
  conversationStore.clear();
  conversationStore.set('conversations', {});
  conversationStore.set('activeConversationId', null);
}

