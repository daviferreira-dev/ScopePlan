// In production, VITE_API_URL points to the backend service (e.g. https://scopeplan-api.onrender.com/api)
// In dev, falls back to /api which Vite proxies to localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Types ────────────────────────────────────────────────────

export interface ProjectData {
  id: number;
  nome: string;
  nome_cliente?: string;
  cliente_id?: number;
  cliente_email?: string;
  descricao?: string;
  gestor_id?: number;
  gestor?: { id: number; nome: string; email: string; perfil: string };
  requisitos_count: number;
  aprovados_count: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Validacao {
  id: number;
  requisito_id: number;
  validador_id: number;
  resultado: string;
  comentario?: string;
  criado_em?: string;
  validador?: User;
}

export interface AssinaturaData {
  id: number;
  requisito_id: number;
  signatario_id: number;
  signatario?: User;
  declaracao?: string;
  assinado_em: string;
}

export interface RequirementData {
  id: number;
  projeto_id: number;
  tipo: string;
  codigo?: string;
  titulo?: string;
  descricao?: string;
  status: string;
  prioridade?: string;
  categoria?: string;
  criado_em?: string;
  atualizado_em?: string;
  autor?: User;
  validacoes?: Validacao[];
  validacoes_count?: number;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo?: boolean;
}

export interface MembroData {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  origem: 'gestor' | 'cliente' | 'convite';
}

export interface AuditLogData {
  id: number;
  usuario_id?: number;
  usuario_nome?: string;
  usuario_email?: string;
  usuario?: User;
  acao: string;
  entidade_tipo: string;
  entidade_id?: number;
  detalhes?: string | Record<string, unknown> | null;
  projeto_id?: number | null;
  criado_em: string;
}

export interface AuditListResponse {
  audit_logs: AuditLogData[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ── Token management ─────────────────────────────────────────
// Access token in memory only; refresh token via HttpOnly cookie

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setTokens(access: string): void {
  accessToken = access;
  // Refresh token is handled via HttpOnly cookie — no client-side storage needed
}

export function clearTokens(): void {
  accessToken = null;
}

// ── Refresh token mutex ──────────────────────────────────────
// Only one refresh request in flight at a time

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Refresh token is sent automatically via HttpOnly cookie (path=/api/auth)
      // credentials: 'include' ensures cookies are sent cross-origin
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Server rotates refresh tokens — new cookie is set via Set-Cookie header
        setTokens(data.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Auth headers builder ─────────────────────────────────────

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Core fetch wrappers ──────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const { headers: callerHeaders, ...rest } = options;
  const mergedHeaders = mergeHeaders(buildAuthHeaders(), callerHeaders);

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Auth endpoints (login/register) return 401 for bad credentials — don't treat as session expiry
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register');
    if (isAuthEndpoint) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || `Erro ${response.status}`);
    }

    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = mergeHeaders(buildAuthHeaders(), callerHeaders);
      const retryResponse = await fetch(url, {
        ...rest,
        headers: retryHeaders,
        credentials: 'include',
      });
      if (retryResponse.ok) return retryResponse.json();
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Sessao expirada');
    }
    clearTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Sessao expirada');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message || err.error || `Erro ${response.status}`);
  }

  return response.json();
}

export async function apiFetchBlob(
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const { headers: callerHeaders, ...rest } = options;
  const mergedHeaders = mergeHeaders(buildAuthHeaders(), callerHeaders);

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = mergeHeaders(buildAuthHeaders(), callerHeaders);
      const retryResponse = await fetch(url, {
        ...rest,
        headers: retryHeaders,
        credentials: 'include',
      });
      if (retryResponse.ok) return retryResponse.blob();
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Sessao expirada');
    }
    clearTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Sessao expirada');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message || err.error || `Erro ${response.status}`);
  }

  return response.blob();
}

// ── Logout ───────────────────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      credentials: 'include',
    });
  } catch {
    /* ignore — clear local state anyway */
  }
  clearTokens();
}

// ── Header merge helper ──────────────────────────────────────

function mergeHeaders(
  base: Record<string, string>,
  caller: HeadersInit | undefined
): Record<string, string> {
  if (!caller) return base;
  const merged = { ...base };
  if (caller instanceof Headers) {
    caller.forEach((v, k) => { merged[k] = v; });
  } else if (Array.isArray(caller)) {
    for (const [k, v] of caller as [string, string][]) { merged[k] = v; }
  } else {
    Object.assign(merged, caller);
  }
  return merged;
}

// ── Domain API helpers ───────────────────────────────────────

export const authApi = {
  register(nome: string, email: string, senha: string, perfil: string) {
    return apiFetch<{ access_token: string; user: unknown }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ nome, email, senha, perfil }) }
    );
  },

  login(email: string, senha: string) {
    return apiFetch<{ access_token: string; user: unknown }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, senha }) }
    );
  },

  me(options?: { signal?: AbortSignal }) {
    return apiFetch<{ user: unknown }>(
      '/auth/me',
      options?.signal ? { signal: options.signal } : {}
    );
  },

  getUser(id: number) {
    return apiFetch<{ user: unknown }>(`/auth/${id}`);
  },

  updateUser(id: number, data: Record<string, unknown>) {
    return apiFetch<{ user: unknown }>(`/auth/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  listClientes(options?: { signal?: AbortSignal }) {
    return apiFetch<{ clientes: { id: number; nome: string; email: string }[] }>(
      '/auth/clientes',
      options?.signal ? { signal: options.signal } : {}
    );
  },

  forgotPassword(email: string) {
    return apiFetch<{ message: string; reset_code?: string }>('/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    });
  },

  verifyResetCode(email: string, code: string) {
    return apiFetch<{ message: string }>('/auth/verify-reset-code', {
      method: 'POST', body: JSON.stringify({ email, code }),
    });
  },

  resetPassword(email: string, code: string, senha: string) {
    return apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ email, code, senha }),
    });
  },
};

export interface ProjectMetrics {
  total: number;
  aprovados: number;
  taxa_aprovacao: number;
  por_status: Record<string, number>;
  por_tipo: Record<string, number>;
  por_prioridade: Record<string, number>;
  por_categoria: Record<string, number>;
  evolucao_semanal: { semana: string; total: number }[];
  tempo_medio_aprovacao_horas: number | null;
  aprovacao_amostras: number;
}

export const projectsApi = {
  list(
    page: number = 1,
    size: number = 20,
    filters?: Record<string, string>,
    search?: string,
    options?: { signal?: AbortSignal }
  ) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set('search', search);
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
    }
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ projetos: ProjectData[]; total: number }>(
      `/projetos?${params.toString()}`,
      init
    );
  },

  create(data: Record<string, unknown>) {
    return apiFetch<{ projeto: ProjectData }>('/projetos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get(id: number) {
    return apiFetch<{ projeto: ProjectData }>(`/projetos/${id}`);
  },

  update(id: number, data: Record<string, unknown>) {
    return apiFetch<{ projeto: ProjectData }>(`/projetos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: number) {
    return apiFetch(`/projetos/${id}`, { method: 'DELETE' });
  },

  downloadERS(projectId: number, format: 'pdf' | 'docx', body?: Record<string, unknown>) {
    return apiFetchBlob(`/projetos/${projectId}/ers.${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  metrics(projectId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<ProjectMetrics>(`/projetos/${projectId}/metrics`, init);
  },

  membros(projectId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ membros: MembroData[] }>(`/projetos/${projectId}/membros`, init);
  },
};

export const requirementsApi = {
  list(
    projectId: number,
    page: number = 1,
    size: number = 50,
    filters?: Record<string, string>,
    options?: { signal?: AbortSignal }
  ) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
    }
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ requisitos: RequirementData[]; total: number }>(
      `/projetos/${projectId}/requisitos?${params.toString()}`,
      init
    );
  },

  create(projectId: number, data: Record<string, unknown>) {
    return apiFetch<{ requisito: RequirementData }>(`/projetos/${projectId}/requisitos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get(projectId: number, id: number) {
    return apiFetch<{ requisito: RequirementData }>(`/projetos/${projectId}/requisitos/${id}`);
  },

  update(projectId: number, id: number, data: Record<string, unknown>) {
    return apiFetch<{ requisito: RequirementData }>(`/projetos/${projectId}/requisitos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(projectId: number, id: number) {
    return apiFetch(`/projetos/${projectId}/requisitos/${id}`, { method: 'DELETE' });
  },

  moveStatus(projectId: number, id: number, status: string) {
    return apiFetch<{ requisito: RequirementData }>(`/projetos/${projectId}/requisitos/${id}/mover`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  listarAssinaturas(projectId: number, reqId: number) {
    return apiFetch<{ assinaturas: AssinaturaData[] }>(`/projetos/${projectId}/requisitos/${reqId}/assinaturas`);
  },

  assinar(projectId: number, reqId: number, declaracao?: string) {
    return apiFetch<{ assinatura: AssinaturaData }>(`/projetos/${projectId}/requisitos/${reqId}/assinar`, {
      method: 'POST',
      body: JSON.stringify({ declaracao: declaracao ?? '' }),
    });
  },

  submitReview(requirementId: number) {
    return apiFetch<{ requisito: RequirementData }>(`/requisitos/${requirementId}/submit-review`, {
      method: 'POST',
    });
  },

  createValidacao(requirementId: number, data: Record<string, unknown>) {
    return apiFetch<{ validacao: unknown }>(`/requisitos/${requirementId}/validacoes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  versionHistory(requirementId: number) {
    return apiFetch<{ versions: unknown[] }>(`/requisitos/${requirementId}/versions`);
  },
};

export const auditApi = {
  list(
    page: number = 1,
    size: number = 20,
    filters?: Record<string, string>,
    options?: { signal?: AbortSignal }
  ) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
    }
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<AuditListResponse>(
      `/audit?${params.toString()}`,
      init
    );
  },
};

export const validationApi = {
  list(requirementId: number) {
    return apiFetch<{ validacoes: unknown[] }>(`/requisitos/${requirementId}/validacoes`);
  },

  create(requirementId: number, data: Record<string, unknown>) {
    return apiFetch<{ validacao: unknown }>(`/requisitos/${requirementId}/validacoes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(requirementId: number, id: number, data: Record<string, unknown>) {
    return apiFetch<{ validacao: unknown }>(`/requisitos/${requirementId}/validacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(requirementId: number, id: number) {
    return apiFetch(`/requisitos/${requirementId}/validacoes/${id}`, { method: 'DELETE' });
  },
};

export interface CommentData {
  id: number;
  requisito_id: number;
  autor_id: number | null;
  autor?: User;
  parent_id: number | null;
  texto: string;
  oculto: boolean;
  criado_em?: string;
  editado_em?: string | null;
}

export const commentsApi = {
  list(requirementId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ comentarios: CommentData[]; total: number }>(
      `/requisitos/${requirementId}/comentarios`,
      init
    );
  },

  create(requirementId: number, texto: string, parentId?: number) {
    return apiFetch<{ comentario: CommentData }>(`/requisitos/${requirementId}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ texto, parent_id: parentId ?? null }),
    });
  },

  update(commentId: number, texto: string) {
    return apiFetch<{ comentario: CommentData }>(`/comentarios/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ texto }),
    });
  },

  hide(commentId: number) {
    return apiFetch<{ comentario: CommentData }>(`/comentarios/${commentId}/ocultar`, {
      method: 'POST',
    });
  },
};

export interface DiagramaData {
  id: number;
  projeto_id: number;
  nome: string;
  tipo_mime: string;
  tamanho: number;
  criado_em: string;
}

export const diagramasApi = {
  list(projectId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ diagramas: DiagramaData[] }>(`/projetos/${projectId}/diagramas`, init);
  },

  async upload(projectId: number, file: File, nome?: string): Promise<{ diagrama: DiagramaData }> {
    const form = new FormData();
    form.append('arquivo', file);
    if (nome) form.append('nome', nome);
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = `${API_BASE}/projetos/${projectId}/diagramas`;
    const response = await fetch(url, { method: 'POST', body: form, headers, credentials: 'include' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || `Erro ${response.status}`);
    }
    return response.json();
  },

  getImageBlob(projectId: number, diagramaId: number) {
    return apiFetchBlob(`/projetos/${projectId}/diagramas/${diagramaId}/imagem`);
  },

  delete(projectId: number, diagramaId: number) {
    return apiFetch<{ message: string }>(`/projetos/${projectId}/diagramas/${diagramaId}`, {
      method: 'DELETE',
    });
  },
};

export interface BlocoPersonalizadoData {
  id: number;
  projeto_id: number;
  nome: string;
  tipo_chave: string;
  ordem: number;
}

export const blocosApi = {
  list(projectId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ blocos: BlocoPersonalizadoData[] }>(`/projetos/${projectId}/blocos`, init);
  },

  create(projectId: number, nome: string) {
    return apiFetch<{ bloco: BlocoPersonalizadoData }>(`/projetos/${projectId}/blocos`, {
      method: 'POST',
      body: JSON.stringify({ nome }),
    });
  },

  delete(projectId: number, blocoId: number) {
    return apiFetch<{ message: string }>(`/projetos/${projectId}/blocos/${blocoId}`, {
      method: 'DELETE',
    });
  },
};

export interface AnexoData {
  id: number;
  requisito_id: number;
  projeto_id: number;
  nome: string;
  tipo_mime: string;
  tamanho: number;
  criado_em: string;
}

export const anexosApi = {
  list(reqId: number, options?: { signal?: AbortSignal }) {
    const init: RequestInit = {};
    if (options?.signal) init.signal = options.signal;
    return apiFetch<{ anexos: AnexoData[] }>(`/requisitos/${reqId}/anexos`, init);
  },

  async upload(reqId: number, file: File): Promise<{ anexo: AnexoData }> {
    const form = new FormData();
    form.append('arquivo', file);
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = `${API_BASE}/requisitos/${reqId}/anexos`;
    const response = await fetch(url, { method: 'POST', body: form, headers, credentials: 'include' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || `Erro ${response.status}`);
    }
    return response.json();
  },

  getFileBlob(reqId: number, anexoId: number) {
    return apiFetchBlob(`/requisitos/${reqId}/anexos/${anexoId}/arquivo`);
  },

  delete(reqId: number, anexoId: number) {
    return apiFetch<{ message: string }>(`/requisitos/${reqId}/anexos/${anexoId}`, {
      method: 'DELETE',
    });
  },
};

export interface ConviteData {
  id: number;
  projeto_id: number;
  email: string;
  perfil: 'cliente' | 'desenvolvedor' | 'gestor';
  token: string;
  status: 'pendente' | 'aceito' | 'cancelado';
  expirado: boolean;
  convidado_por?: User;
  aceito_por?: User;
  criado_em: string;
  expira_em: string;
}

export const convitesApi = {
  verificarEmail(email: string) {
    return apiFetch<{ existe: false } | { existe: true; perfil: string; nome: string }>(
      '/convites/verificar-email',
      { method: 'POST', body: JSON.stringify({ email }) }
    );
  },

  list(projectId: number) {
    return apiFetch<{ convites: ConviteData[] }>(`/projetos/${projectId}/convites`);
  },

  criar(projectId: number, email: string, perfil: 'cliente' | 'desenvolvedor' | 'gestor') {
    return apiFetch<{ message: string; convite: ConviteData }>(`/projetos/${projectId}/convites`, {
      method: 'POST',
      body: JSON.stringify({ email, perfil }),
    });
  },

  cancelar(projectId: number, conviteId: number) {
    return apiFetch<{ message: string }>(`/projetos/${projectId}/convites/${conviteId}`, {
      method: 'DELETE',
    });
  },

  info(token: string) {
    return apiFetch<{ convite: ConviteData; projeto: { id: number; nome: string; descricao?: string } | null; email_existe: boolean }>(
      `/convites/${token}`
    );
  },

  aceitar(token: string) {
    return apiFetch<{ message: string; projeto_id: number; perfil: string }>(
      `/convites/${token}/aceitar`,
      { method: 'POST' }
    );
  },
};

// Legacy aliases (pages may import these names)
export { projectsApi as projectApi, requirementsApi as requirementApi };
