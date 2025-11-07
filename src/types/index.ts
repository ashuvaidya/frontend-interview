export type Application = {
  avatar: string;
  company: string;
  date_created: string;
  email: string;
  expiry_date: string;
  first_name: string;
  id: number;
  last_name: string;
  loan_amount: number;
  loan_history: LoanHistory[];
  loan_type: string;
};

type LoanHistory = {
  interest: number;
  interest_rate: number;
  loan_ended: string;
  loan_started: string;
  principle: number;
};

export type PaginationInfo = {
  hasNext: boolean;
  hasPrev: boolean;
  totalPages?: number;
  currentPage: number;
};

export type FetchState = {
  data: Application[];
  error: string;
  loading: boolean;
  paginationInfo: PaginationInfo;
};
