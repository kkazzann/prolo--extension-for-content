export interface Issue {
  id: string;
  issue: string;
  checkpoints_total: string;
  additional_fields: AdditionalField[];
  added_time: string;
  status: string;
  issue_board_column_name?: string;
}

interface AdditionalField {
  field_id: string;
  name: string;
  field_type: string;
  value: any[];
  values: FieldValue[];
}

interface FieldValue {
  id: string;
  answer_value: string;
  is_default_value: string;
  order_num: string;
}

export interface IssueListResponse {
  issue_pagination: {
    page: number;
    per_page: number;
    total: string;
  };
  issue_list: Issue[];
}

interface LanguageTranslation {
  description: string;
  done: boolean;
}

export interface ProcessedIssue {
  id: string;
  title: string;
  hasChecklists: boolean;
  assignees: string[];
  assigneeIds: string[];
  allAssigneesFields: AdditionalField[];
  issueUrl: string;
  translations?: LanguageTranslation[];
  columnName?: string;
}
