import React from 'react';
import type { RequirementData } from '../services/api';

/* ═══ Base Topics ═══ */
export interface Topic {
  id: number;
  nome: string;
}

export const BASE_TOPICS: Topic[] = [
  { id: 1, nome: 'Introdução' },
  { id: 2, nome: 'Visão Geral do Produto' },
  { id: 3, nome: 'Requisitos Funcionais' },
  { id: 4, nome: 'Requisitos Não Funcionais' },
  { id: 5, nome: 'Regras de Negócio' },
  { id: 6, nome: 'Restrições' },
  { id: 7, nome: 'Interfaces e Integrações' },
  { id: 8, nome: 'Glossário' },
];

/** Mapeamento canônico: topic ID → tipo de requisito (string usada no backend) */
export const TOPIC_TYPE_MAP: Record<number, string> = {
  3: 'funcional',
  4: 'nao_funcional',
  5: 'negocio',
  6: 'restricao',
};

/** Tópicos de requisitos com campo `type` derivado do mapeamento canônico */
export interface RequirementTopic {
  id: number;
  name: string;
  type: string;
}

export const REQUIREMENT_TOPICS: RequirementTopic[] = BASE_TOPICS
  .filter(t => t.id in TOPIC_TYPE_MAP)
  .map(t => ({ id: t.id, name: t.nome, type: TOPIC_TYPE_MAP[t.id] }));

/* ═══ Shared Types ═══ */
export type Perfil = 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
export type View = 'projetos' | 'itens' | 'validacao' | 'auditoria' | 'download';
export interface TopicSelection {
  topic: RequirementTopic & { count: number };
  requirements: RequirementData[];
}
export type TopicInfo = RequirementTopic & { count: number };

/* ═══ Audit: Action Type Colors ═══ */
export const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string; accent: string }> = {
  criacao:          { bg: '#e6f9ec', text: '#1a7a36', dot: '#22883f', accent: '#34c45a' },
  edicao:           { bg: '#f0e8fc', text: '#7c3aed', dot: '#8b5cf6', accent: '#a78bfa' },
  atualizacao:      { bg: '#f0e8fc', text: '#7c3aed', dot: '#8b5cf6', accent: '#a78bfa' },
  aprovacao:        { bg: '#e0f8e8', text: '#166534', dot: '#22c55e', accent: '#4ade80' },
  reprovacao:       { bg: '#fde8ea', text: '#be123c', dot: '#f43f5e', accent: '#fb7185' },
  comentario:       { bg: '#e8f4fd', text: '#1e6fa8', dot: '#3b82f6', accent: '#60a5fa' },
  anexo:            { bg: '#e4f0fb', text: '#1e40af', dot: '#3b82f6', accent: '#93c5fd' },
  autenticacao:     { bg: '#f0f2f5', text: '#4b5563', dot: '#6b7280', accent: '#9ca3af' },
  permissao:        { bg: '#fef3e2', text: '#92400e', dot: '#f59e0b', accent: '#fbbf24' },
  exclusao:         { bg: '#fce4e4', text: '#7f1d1d', dot: '#dc2626', accent: '#f87171' },
  status:           { bg: '#e8f4fd', text: '#1e6fa8', dot: '#3b82f6', accent: '#60a5fa' },
  validacao:        { bg: '#e0f8e8', text: '#166534', dot: '#22c55e', accent: '#4ade80' },
  submissao_revisao:{ bg: '#e8f4fd', text: '#1e6fa8', dot: '#3b82f6', accent: '#60a5fa' },
  upload_diagrama:  { bg: '#f0f9f3', text: '#1a7a36', dot: '#34c45a', accent: '#6ee7a0' },
  exclusao_diagrama:{ bg: '#fce4e4', text: '#7f1d1d', dot: '#dc2626', accent: '#f87171' },
};

export const ACTION_LABELS: Record<string, string> = {
  criacao: 'Requisito criado',
  edicao: 'Requisito editado',
  atualizacao: 'Registro atualizado',
  aprovacao: 'Requisito aprovado',
  reprovacao: 'Requisito reprovado',
  comentario: 'Comentário adicionado',
  anexo: 'Documento anexado',
  autenticacao: 'Novo utilizador autenticado',
  permissao: 'Permissão alterada',
  exclusao: 'Exclusão realizada',
  status: 'Status atualizado',
  validacao: 'Requisito validado',
  submissao_revisao: 'Submetido para revisão',
  upload_diagrama:   'Diagrama adicionado',
  exclusao_diagrama: 'Diagrama excluído',
};

export const ENTITY_LABELS: Record<string, string> = {
  requisito: 'Requisito',
  projeto: 'Projeto',
  usuario: 'Usuário',
  validacao: 'Validação',
  auth: 'Autenticação',
  diagrama: 'Diagrama',
};

/* ═══ Audit: Action Type Icons ═══ */
export const TYPE_ICONS: Record<string, React.ReactNode> = {
  criacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></svg>
  ),
  edicao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  atualizacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  aprovacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
  ),
  reprovacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /><circle cx="12" cy="12" r="10" /></svg>
  ),
  comentario: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
  ),
  anexo: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
  ),
  autenticacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
  ),
  permissao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  exclusao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
  ),
  status: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  ),
  validacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
  ),
  submissao_revisao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
  ),
  upload_diagrama: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
  ),
  exclusao_diagrama: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
  ),
};

/* ═══ Sidebar Nav Config ═══ */
export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const ProjectsIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="2" y="3" width="8" height="8" rx="2" />
    <rect x="14" y="3" width="8" height="8" rx="2" />
    <rect x="2" y="13" width="8" height="8" rx="2" />
    <rect x="14" y="13" width="8" height="8" rx="2" />
  </svg>
);

const AuditIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 12l2 2 4-4" />
    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
  </svg>
);

export const NAV_ITEMS: Record<string, NavItem[]> = {
  analista: [
    { key: 'projetos', label: 'Projetos', icon: ProjectsIcon },
    { key: 'auditoria', label: 'Auditoria', icon: AuditIcon },
  ],
  cliente: [
    { key: 'projetos', label: 'Projetos', icon: ProjectsIcon },
    { key: 'auditoria', label: 'Auditoria', icon: AuditIcon },
  ],
  desenvolvedor: [
    { key: 'projetos', label: 'Meus Projetos', icon: ProjectsIcon },
  ],
  gestor: [
    { key: 'projetos', label: 'Painel Gerencial', icon: ProjectsIcon },
  ],
};
