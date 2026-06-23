import { apiClient } from '../api/client';
import type { ProcessedIssue, Issue } from '../types';

export interface CurrentUser {
  id: string;
  name: string;
}

// for testing purpose, set username from here, eg. NKodz
const DEBUG_IMPERSONATE_USER_KEY: string | null = null;

function getCurrentUserKey(): string | null {
  if (DEBUG_IMPERSONATE_USER_KEY) return DEBUG_IMPERSONATE_USER_KEY;

  try {
    const scriptData = [...document.body.querySelectorAll('script')].find(item =>
      item.textContent?.includes('pushHost'),
    );
    if (!scriptData?.textContent) return null;

    const user_data = JSON.parse(scriptData.textContent.split(';')[3].split('=')[1]);

    const loggedInKey = Object.keys(user_data).find(key => user_data[key]?.status === 'Logged in');
    return loggedInKey ?? null;
  } catch (e) {
    console.error('getCurrentUserKey failed:', e);
    return null;
  }
}

function processIssue(issue: Issue, idToName: Record<string, string>): ProcessedIssue & { assigneeIds: string[] } {
  let assigneeFields: any[] = [];

  if (issue.additional_fields && typeof issue.additional_fields === 'object') {
    assigneeFields = Object.values(issue.additional_fields)
      .flat()
      .filter((field: any) => field?.name?.toLowerCase().includes('assignee'));
  }

  const allAssigneeIds: string[] = [];
  assigneeFields.forEach((field: any) => {
    if (field.value !== undefined && field.value !== null) {
      if (Array.isArray(field.value)) {
        field.value.forEach((v: any) => {
          if (v) allAssigneeIds.push(String(v));
        });
      } else {
        allAssigneeIds.push(String(field.value));
      }
    } else if (field.values) {
      field.values.forEach((v: any) => {
        if (v.answer_value) allAssigneeIds.push(String(v.answer_value));
      });
    }
  });

  const uniqueAssigneeIds = Array.from(new Set(allAssigneeIds));
  const assigneeNames = uniqueAssigneeIds.map(id => idToName[id] || id);

  return {
    id: issue.id,
    title: issue.issue,
    hasChecklists: parseInt(issue.checkpoints_total || '0', 10) > 0,
    assignees: assigneeNames,
    assigneeIds: uniqueAssigneeIds,
    allAssigneesFields: assigneeFields,
    issueUrl: `${window.location.origin}/react/logs/issue_logs/${issue.id}`,
    columnName: issue.issue_board_column_name,
  };
}

export async function fetchAllIssuesWithChecklists(
  boardId: number,
  status: string = 'open',
): Promise<{ issues: ProcessedIssue[]; currentUser: CurrentUser | null }> {
  const pages: Issue[][] = [];

  const [firstPage, { idToName, keyToUser }, titlesResponse] = await Promise.all([
    apiClient.fetchIssuesPage(boardId, 1, status),
    apiClient.fetchUsersMap(),
    apiClient.fetchChecklistTitles(),
  ]);

  const currentUserKey = getCurrentUserKey();
  const currentUser: CurrentUser | null = currentUserKey ? (keyToUser[currentUserKey] ?? null) : null;

  if (!firstPage || !firstPage.issue_list) {
    return { issues: [], currentUser };
  }
  pages.push(firstPage.issue_list);

  const total = parseInt(firstPage.issue_pagination.total || '0', 10);
  const perPage = firstPage.issue_pagination.per_page;
  const totalPages = Math.ceil(total / perPage);

  const CONCURRENCY_LIMIT = 3;

  for (let i = 2; i <= totalPages; i += CONCURRENCY_LIMIT) {
    const chunkPromises = [];
    for (let j = 0; j < CONCURRENCY_LIMIT && i + j <= totalPages; j++) {
      chunkPromises.push(apiClient.fetchIssuesPage(boardId, i + j, status));
    }
    const results = await Promise.allSettled(chunkPromises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        pages.push(result.value.issue_list);
      }
    });
  }

  const allIssues = pages.flat();
  const processedIssues = allIssues.map(issue => processIssue(issue, idToName));

  const allChecklistTitles = titlesResponse?.titles || [];
  const targetIssueIds = new Set(
    allChecklistTitles.filter((t: any) => t.title === 'All Languages').map((t: any) => String(t.issue_id)),
  );

  const issuesToFetchDetailedChecklists = processedIssues.filter(i => targetIssueIds.has(i.id));

  if (issuesToFetchDetailedChecklists.length > 0) {
    const checklistMap = await apiClient.fetchChecklistsBatch(
      issuesToFetchDetailedChecklists.map(i => i.id),
      20,
    );

    processedIssues.forEach(issue => {
      if (targetIssueIds.has(issue.id)) {
        const responseData = checklistMap.get(issue.id);
        const rawChecklists = responseData?.checklists || [];

        const allLanguagesList = rawChecklists.find((c: any) => c.title === 'All Languages');

        if (allLanguagesList && allLanguagesList.checkpoints) {
          issue.translations = allLanguagesList.checkpoints.map((cp: any) => ({
            description: cp.description,
            done: cp.done === '1',
          }));
        } else {
          issue.translations = [];
        }
      }
    });
  }

  return { issues: processedIssues, currentUser };
}
