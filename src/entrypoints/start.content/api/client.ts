import type { IssueListResponse } from '../types';

class ApiClient {
  private cache = new Map<string, any>();
  private pendingRequests = new Map<string, Promise<any>>();

  private async fetchWithCache<T>(url: string, options?: RequestInit): Promise<T> {
    const cacheKey = url;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        this.cache.set(cacheKey, data);
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(err => {
        this.pendingRequests.delete(cacheKey);
        throw err;
      });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  async fetchIssuesPage(boardId: number, page: number, status: string = 'open') {
    const url = `${window.location.origin}/api/issueLog/list/?status=${status}&setting_view=1&issue_board=${boardId}&page=${page}`;
    return this.fetchWithCache<IssueListResponse>(url);
  }

  async fetchChecklist(issueId: string) {
    const url = `${window.location.origin}/api/issueLog/checklist/?issue_id=${issueId}`;
    return this.fetchWithCache<any>(url);
  }

  async fetchChecklistTitles() {
    const url = `${window.location.origin}/api/issueLog/getChecklistTitles/?`;
    return this.fetchWithCache<any>(url);
  }

  async fetchChecklistsBatch(issueIds: string[], chunkSize: number = 5): Promise<Map<string, any>> {
    const results = new Map();

    for (let i = 0; i < issueIds.length; i += chunkSize) {
      const chunk = issueIds.slice(i, i + chunkSize);

      const promises = chunk.map(async id => {
        try {
          const data = await this.fetchChecklist(id);
          results.set(id, data);
        } catch (error) {
          console.warn(`Failed to fetch checklist for issue ${id}:`, error);
          results.set(id, null);
        }
      });

      await Promise.allSettled(promises);
    }

    return results;
  }

  async fetchUsersMap(): Promise<{
    idToName: Record<string, string>;
    keyToUser: Record<string, { id: string; name: string }>;
  }> {
    const url = `${window.location.origin}/api/filtersOptions/?type%5B%5D=users_ext&with_inactive_users=0`;
    const data = await this.fetchWithCache<any>(url);

    const idToName: Record<string, string> = {};
    const keyToUser: Record<string, { id: string; name: string }> = {};

    if (data?.options?.users_ext) {
      for (const key in data.options.users_ext) {
        const user = data.options.users_ext[key];
        if (user && user.id && user.value) {
          idToName[String(user.id)] = String(user.value);
          keyToUser[key] = { id: String(user.id), name: String(user.value) };
        }
      }
    }
    return { idToName, keyToUser };
  }
}

export const apiClient = new ApiClient();
