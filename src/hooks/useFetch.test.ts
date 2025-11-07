import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useFetch } from './useFetch';
import { Application } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the linkHeaderParser module
vi.mock('../utils/linkHeaderParser', () => ({
  parseLinkHeader: vi.fn(),
  extractPaginationInfo: vi.fn(),
}));

import { parseLinkHeader, extractPaginationInfo } from '../utils/linkHeaderParser';

const mockParseLinkHeader = parseLinkHeader as MockedFunction<typeof parseLinkHeader>;
const mockExtractPaginationInfo = extractPaginationInfo as MockedFunction<typeof extractPaginationInfo>;

const mockApplications: Application[] = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    company: 'Test Company',
    email: 'john@test.com',
    loan_amount: 50000,
    loan_type: 'Business Loan',
    date_created: '2023-01-01',
    expiry_date: '2023-12-01',
    avatar: 'avatar1.jpg',
    loan_history: []
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    company: 'Another Company',
    email: 'jane@test.com',
    loan_amount: 75000,
    loan_type: 'Flexi-Loan',
    date_created: '2023-01-02',
    expiry_date: '2023-12-02',
    avatar: 'avatar2.jpg',
    loan_history: []
  }
];

const createMockResponse = (data: any, status = 200, linkHeader: string | null = null) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => data,
  headers: {
    get: (name: string) => name === 'Link' ? linkHeader : null
  }
} as unknown as Response);

describe('useFetch Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockParseLinkHeader.mockClear();
    mockExtractPaginationInfo.mockClear();
  });

  describe('Initial Load', () => {
    it('should fetch applications on mount', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockApplications));

      mockParseLinkHeader.mockReturnValue([]);
      mockExtractPaginationInfo.mockReturnValue({
        hasNext: true,
        hasPrev: false,
        totalPages: 20,
        currentPage: 1
      });

      const { result } = renderHook(() => useFetch());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/applications?_page=1&_limit=5'
      );
      expect(result.current.data).toEqual(mockApplications);
      expect(result.current.error).toBe('');
    });

    it('should set loading state correctly during initial fetch', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise as any);

      const { result } = renderHook(() => useFetch());

      expect(result.current.loading).toBe(true);

      act(() => {
        resolvePromise!(createMockResponse(mockApplications));
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Pagination', () => {
    it('should load more applications when loadMore is called', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce(createMockResponse([mockApplications[0]]));

      mockParseLinkHeader.mockReturnValue([]);
      mockExtractPaginationInfo.mockReturnValue({
        hasNext: true,
        hasPrev: false,
        totalPages: 10,
        currentPage: 1
      });

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);

      // Load more
      mockFetch.mockResolvedValueOnce(createMockResponse([mockApplications[1]]));

      mockExtractPaginationInfo.mockReturnValue({
        hasNext: false,
        hasPrev: true,
        totalPages: 10,
        currentPage: 2
      });

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:3001/api/applications?_page=2&_limit=5'
      );
    });

    it('should not load more when already loading', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([mockApplications[0]]));

      mockExtractPaginationInfo.mockReturnValue({
        hasNext: true,
        hasPrev: false,
        totalPages: 10,
        currentPage: 1
      });

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start a slow loading request
      const slowPromise = new Promise((resolve) => 
        setTimeout(() => resolve(createMockResponse([mockApplications[1]])), 100)
      );

      mockFetch.mockReturnValueOnce(slowPromise as any);

      act(() => {
        result.current.loadMore();
      });

      // Try to load more again while still loading
      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should only make one additional request
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not load more when hasNext is false', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockApplications));

      mockExtractPaginationInfo.mockReturnValue({
        hasNext: false,
        hasPrev: false,
        totalPages: 1,
        currentPage: 1
      });

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.loadMore();
      });

      // Should not make additional request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should parse Link headers correctly', async () => {
      const mockLinkHeader = '<http://localhost:3001/api/applications?_page=2&_limit=5>; rel="next"';
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockApplications, 200, mockLinkHeader));

      const mockLinks = [{ url: 'test', rel: 'next', page: 2 }];
      mockParseLinkHeader.mockReturnValue(mockLinks);
      mockExtractPaginationInfo.mockReturnValue({
        hasNext: true,
        hasPrev: false,
        totalPages: 10,
        currentPage: 1
      });

      renderHook(() => useFetch());

      await waitFor(() => {
        expect(mockParseLinkHeader).toHaveBeenCalledWith(mockLinkHeader);
        expect(mockExtractPaginationInfo).toHaveBeenCalledWith(mockLinks, 1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch applications.');
      expect(result.current.data).toEqual([]);
    });

    it('should handle HTTP error status codes', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500));

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Unable to fetch applications.');
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Refetch', () => {
    it('should reset data and reload from first page', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce(createMockResponse(mockApplications));

      mockExtractPaginationInfo.mockReturnValue({
        hasNext: true,
        hasPrev: false,
        totalPages: 10,
        currentPage: 1
      });

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);

      // Refetch
      mockFetch.mockResolvedValueOnce(createMockResponse([mockApplications[0]]));

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:3001/api/applications?_page=1&_limit=5'
      );
    });

    it('should reset pagination info on refetch', async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockApplications));

      mockExtractPaginationInfo.mockReturnValue({
        hasNext: false,
        hasPrev: true,
        totalPages: 5,
        currentPage: 3
      });

      const { result } = renderHook(() => useFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refetch();
      });

      // During refetch, pagination should be reset
      expect(result.current.paginationInfo).toEqual({
        hasNext: false,
        hasPrev: false,
        currentPage: 0
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});