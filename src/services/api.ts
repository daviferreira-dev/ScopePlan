const API_BASE = '/api';

// Token management
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Generic fetch wrapper with JWT
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If token expired, try refresh
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new ApiError(retryResponse.status, error.message || 'Erro na requisição');
      }
      return retryResponse.json();
    }
    // Refresh failed, clear tokens
    clearTokens();
    window.location.href = '/';
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Erro na requisição');
  }

  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refresh}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access_token, refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Custom error class
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ==================== AUTH API ====================

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
  };
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
  };
}

export interface MeResponse {
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
    criado_em: string;
    atualizado_em: string;
  };
}

export const authApi = {
  login(email: string, senha: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  },

  register(nome: string, email: string, senha: string, perfil: string): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, perfil }),
    });
  },

  me(): Promise<MeResponse> {
    return apiFetch<MeResponse>('/auth/me');
  },

  refresh(): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
  },

  logout(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};

// ==================== PROJECTS API ====================

export interface ProjectData {
  id: number;
  nome: string;
  descricao: string | null;
  status: string;
  custo_estimado: number | null;
  gestor_id: number;
  gestor: string | null;
  nome_cliente: string | null;
  ativo: boolean;
  requisitos_count: number;
  aprovados_count: number;
  criado_em: string;
  atualizado_em: string;
  requisitos?: RequirementData[];
}

export interface ProjectsListResponse {
  projetos: ProjectData[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const projectsApi = {
  list(page = 1, perPage = 20, status?: string, search?: string): Promise<ProjectsListResponse> {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return apiFetch<ProjectsListResponse>(`/projects?${params.toString()}`);
  },

  get(projectId: number, includeRequirements = false): Promise<{ project: ProjectData }> {
    return apiFetch<{ project: ProjectData }>(
      `/projects/${projectId}?include_requirements=${includeRequirements}`
    );
  },

  create(data: {
    nome: string;
    descricao?: string;
    status?: string;
    custo_estimado?: number;
    nome_cliente?: string;
  }): Promise<{ message: string; project: ProjectData }> {
    return apiFetch<{ message: string; project: ProjectData }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(
    projectId: number,
    data: Partial<{
      nome: string;
      descricao: string | null;
      status: string;
      custo_estimado: number | null;
      nome_cliente: string | null;
    }>
  ): Promise<{ message: string; project: ProjectData }> {
    return apiFetch<{ message: string; project: ProjectData }>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(projectId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  downloadERS(projectId: number, format: 'pdf' | 'docx'): Promise<Blob> {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}/projects/${projectId}/ers/download?format=${format}`, {
      method: 'POST',
      headers,
    }).then((response) => {
      if (!response.ok) throw new Error('Falha ao gerar o documento.');
      return response.blob();
    });
  },
};

// ==================== REQUIREMENTS API ====================

export interface RequirementData {
  id: number;
  projeto_id: number;
  autor_id: number;
  autor: string | null;
  codigo: string | null;
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string | null;
  prioridade: string;
  status: string;
  numero_versao: number;
  ativo: boolean;
  validacoes_count: number;
  ultima_validacao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface RequirementsListResponse {
  requisitos: RequirementData[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ==================== VALIDACOES API ====================

export interface ValidacaoData {
  id: number;
  requisito_id: number;
  validador_id: number;
  validador: string | null;
  resultado: string;
  comentario: string | null;
  validado_em: string;
}

export interface ValidacoesListResponse {
  validacoes: ValidacaoData[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const requirementsApi = {
  list(
    projetoId: number,
    page = 1,
    perPage = 50,
    filters?: { tipo?: string; prioridade?: string; status?: string; search?: string }
  ): Promise<RequirementsListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      projeto_id: String(projetoId),
    });
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.prioridade) params.set('prioridade', filters.prioridade);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    return apiFetch<RequirementsListResponse>(
      `/requirements?${params.toString()}`
    );
  },

  create(
    data: {
      titulo: string;
      descricao?: string;
      projeto_id: number;
      codigo?: string;
      tipo?: string;
      categoria?: string;
      prioridade?: string;
      status?: string;
    }
  ): Promise<{ message: string; requirement: RequirementData }> {
    return apiFetch<{ message: string; requirement: RequirementData }>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(
    requirementId: number,
    data: Partial<{
      titulo: string;
      descricao: string;
      codigo: string;
      tipo: string;
      categoria: string;
      prioridade: string;
      status: string;
    }>
  ): Promise<{ message: string; requirement: RequirementData }> {
    return apiFetch<{ message: string; requirement: RequirementData }>(`/requirements/${requirementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(requirementId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/requirements/${requirementId}`, {
      method: 'DELETE',
    });
  },

  submitReview(requirementId: number): Promise<{ message: string; requirement: RequirementData }> {
    return apiFetch<{ message: string; requirement: RequirementData }>(
      `/requirements/${requirementId}/submit-review`,
      { method: 'POST' }
    );
  },

  createValidacao(
    requirementId: number,
    data: { resultado: string; comentario?: string }
  ): Promise<{ message: string; validacao: ValidacaoData }> {
    return apiFetch<{ message: string; validacao: ValidacaoData }>(
      `/requirements/${requirementId}/validacoes`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  listValidacoes(
    requirementId: number,
    page = 1,
    perPage = 50
  ): Promise<ValidacoesListResponse> {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return apiFetch<ValidacoesListResponse>(
      `/requirements/${requirementId}/validacoes?${params.toString()}`
    );
  },

  getVersionHistory(requirementId: number): Promise<{ versions: RequirementData[] }> {
    return apiFetch<{ versions: RequirementData }>(
      `/requirements/${requirementId}/version-history`
    );
  },
};
