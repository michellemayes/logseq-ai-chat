import { Conversation } from '../types';

export function formatConversationAsMarkdown(conversation: Conversation): string {
  const createdDate = new Date(conversation.createdAt).toLocaleString();
  const updatedDate = new Date(conversation.updatedAt).toLocaleString();
  
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Created:** ${createdDate}\n`;
  markdown += `**Last Updated:** ${updatedDate}\n`;
  markdown += `**Messages:** ${conversation.messages.length}\n\n`;
  markdown += `---\n\n`;

  for (const message of conversation.messages) {
    const roleHeader = message.role === 'user' ? '## You' : '## Assistant';
    const ts = message.createdAt ? new Date(message.createdAt).toLocaleString() : '';
    markdown += `${roleHeader}\n\n`;
    
    // Add message content
    markdown += `${message.content}\n\n`;

    // Add timestamp (local timezone)
    if (ts) {
      markdown += `*Timestamp:* ${ts}\n\n`;
    }
    
    // Add citations if present
    if (message.citations && message.citations.length > 0) {
      markdown += `### Sources\n\n`;
      for (const citation of message.citations) {
        markdown += `- **${citation.pageName}**\n`;
        if (citation.excerpt) {
          // Indent excerpt
          const excerptLines = citation.excerpt.split('\n');
          for (const line of excerptLines) {
            if (line.trim()) {
              markdown += `  > ${line}\n`;
            }
          }
        }
        if (citation.filePath) {
          markdown += `  *Path: ${citation.filePath}*\n`;
        }
        markdown += `\n`;
      }
    }
    
    // Add action info if present
    if (message.action) {
      markdown += `### Action\n\n`;
      markdown += `- **Type:** ${message.action.type}\n`;
      if (message.action.pageName) {
        markdown += `- **Page:** ${message.action.pageName}\n`;
      }
      if (message.action.date) {
        markdown += `- **Date:** ${message.action.date}\n`;
      }
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  }
  
  return markdown;
}

export function sanitizeFilename(title: string): string {
  // Remove or replace invalid filename characters
  return title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100); // Limit length
}

