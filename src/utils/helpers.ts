import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Get user initials from name (max 2 chars, uppercase).
 * Returns "?" if name is empty/undefined.
 */
export function getInitials(name?: string): string {
 if (!name) return '?';
 return name
  .split(' ')
  .map((n: string) => n[0])
  .join('')
  .substring(0, 2)
  .toUpperCase();
}

/**
 * Get the Portuguese role label for a perfil string.
 */
export function getRoleLabel(perfil?: string): string {
 const labels: Record<string, string> = {
  analista: 'Analista',
  cliente: 'Cliente',
  desenvolvedor: 'Desenvolvedor',
  gestor: 'Gestor',
 };
 return labels[perfil || ''] || perfil || '';
}

/**
 * Format a date string as relative time in Portuguese.
 */
export function formatRelativeTime(dateString: string): string {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffSeconds = Math.floor(diffMs / 1000);
 const diffMinutes = Math.floor(diffSeconds / 60);
 const diffHours = Math.floor(diffMinutes / 60);
 const diffDays = Math.floor(diffHours / 24);

 if (diffSeconds < 60) return 'agora mesmo';
 if (diffMinutes < 60) return `há ${diffMinutes} min`;
 if (diffHours < 24) return `há ${diffHours}h`;
 if (diffDays === 1) return 'ontem';
 if (diffDays < 30) return `há ${diffDays} dias`;
 const diffMonths = Math.floor(diffDays / 30);
 if (diffMonths === 1) return 'há 1 mês';
 return `há ${diffMonths} meses`;
}

/**
 * Format a date string as time only (HH:MM).
 */
export function formatTime(dateString: string): string {
 const date = new Date(dateString);
 return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function calculateProgress(project: { requisitos_count: number; aprovados_count: number }): number {
 if (!project.requisitos_count) return 0;
 return Math.round((project.aprovados_count / project.requisitos_count) * 100);
}

/**
 * Status class name lookup — matches CSS class names (Portuguese).
 */
const STATUS_CLASS: Record<string, string> = {
 aprovado: 'aprovado',
 aprovado_com_ressalvas: 'aprovado_ressalvas',
 rejeitado: 'rejeitado',
 em_revisao: 'em_revisao',
 em_analise: 'em_analise',
 pendente: 'pendente',
 rascunho: 'rascunho',
 implementado: 'implementado',
};

/**
 * Status display label lookup.
 */
const STATUS_LABEL: Record<string, string> = {
 aprovado: 'Aprovado',
 aprovado_com_ressalvas: 'Aprovado c/ Ressalvas',
 rejeitado: 'Rejeitado',
 em_revisao: 'Em Revisão',
 em_analise: 'Em Análise',
 pendente: 'Pendente',
 rascunho: 'Rascunho',
 implementado: 'Implementado',
};

export function statusClass(s: string): string {
 return STATUS_CLASS[s] || 'rascunho';
}

export function statusLabel(s: string): string {
 return STATUS_LABEL[s] || s;
}

/**
 * Hook for logout with navigation.
 */
export function useLogout() {
 const { logout } = useAuth();
 const navigate = useNavigate();

 return async () => {
  await logout();
  navigate('/');
 };
}
