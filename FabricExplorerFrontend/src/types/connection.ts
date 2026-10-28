export interface Connection {
  id: string;
  name: string;
  workspaceName?: string | null;
  workspaceId: string;
  tenantId?: string;
  tokenEndpoint?: string;
  clientId?: string;
  environment?: string | null;
  isActive?: boolean;
}

export interface ConnectionPayload {
  name: string;
  workspaceId: string;
  tenantId: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
}

export interface ConnectionTestPayload extends ConnectionPayload {
  isProtected: boolean;
}

export interface ConnectionsPage {
  items: Connection[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
