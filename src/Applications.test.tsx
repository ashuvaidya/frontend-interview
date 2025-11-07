import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Applications from './Applications';
import { Application } from './types';

// Mock the useFetch hook
const mockUseFetch = vi.fn();
vi.mock('./hooks/useFetch', () => ({
  useFetch: () => mockUseFetch()
}));

// Mock the SingleApplication component to simplify testing
vi.mock('./components/SingleApplication', () => ({
  default: ({ application }: { application: Application }) => (
    <div data-testid={`application-${application.id}`}>
      {application.company} - {application.first_name} {application.last_name}
    </div>
  )
}));

// Mock the Button component
vi.mock('./ui/Button/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

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

describe('Applications Component', () => {
  const mockLoadMore = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    mockLoadMore.mockClear();
    mockRefetch.mockClear();
  });

  describe('Loading States', () => {
    it('should show loading message when initially loading', () => {
      mockUseFetch.mockReturnValue({
        data: [],
        error: '',
        loading: true,
        paginationInfo: { hasNext: false, hasPrev: false, currentPage: 0 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not show initial loading when there is already data', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: true,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      // Should not show the initial loading div (not in a button)
      const loadingElements = screen.queryAllByText('Loading...');
      const initialLoadingDiv = loadingElements.find(el => el.tagName !== 'BUTTON');
      expect(initialLoadingDiv).toBeUndefined();
      expect(screen.getByText('Test Company - John Doe')).toBeInTheDocument();
    });

    it('should show "Loading..." on button when loading more', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: true,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const loadMoreButton = screen.getByRole('button');
      expect(loadMoreButton).toHaveTextContent('Loading...');
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe('Error States', () => {
    it('should show error message when there is an error', () => {
      mockUseFetch.mockReturnValue({
        data: [],
        error: 'Failed to fetch applications.',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: false, currentPage: 0 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
      expect(screen.getByText('Message: Failed to fetch applications.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', () => {
      mockUseFetch.mockReturnValue({
        data: [],
        error: 'Network error',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: false, currentPage: 0 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Applications Display', () => {
    it('should render applications when data is available', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.getByTestId('application-1')).toBeInTheDocument();
      expect(screen.getByTestId('application-2')).toBeInTheDocument();
      expect(screen.getByText('Test Company - John Doe')).toBeInTheDocument();
      expect(screen.getByText('Another Company - Jane Smith')).toBeInTheDocument();
    });

    it('should render empty state when no applications', () => {
      mockUseFetch.mockReturnValue({
        data: [],
        error: '',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.queryByTestId(/application-/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Load More Button', () => {
    it('should show Load More button when there are more pages', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const loadMoreButton = screen.getByRole('button');
      expect(loadMoreButton).toHaveTextContent('Load More');
      expect(loadMoreButton).not.toBeDisabled();
    });

    it('should call loadMore when Load More button is clicked', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should disable Load More button when no more pages', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: true, currentPage: 2 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const loadMoreButton = screen.getByRole('button');
      expect(loadMoreButton).toHaveTextContent('Load More');
      expect(loadMoreButton).toBeDisabled();
    });

    it('should show "No more applications to load" message when no more pages', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: true, currentPage: 2 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.getByText('No more applications to load')).toBeInTheDocument();
    });

    it('should not show Load More button when no applications', () => {
      mockUseFetch.mockReturnValue({
        data: [],
        error: '',
        loading: false,
        paginationInfo: { hasNext: false, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByText('No more applications to load')).not.toBeInTheDocument();
    });

    it('should have correct button id for testing', () => {
      mockUseFetch.mockReturnValue({
        data: mockApplications,
        error: '',
        loading: false,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: mockLoadMore,
        refetch: mockRefetch
      });

      render(<Applications />);

      const loadMoreButton = screen.getByRole('button');
      expect(loadMoreButton).toHaveAttribute('id', 'load-more-applications');
    });
  });

  describe('Integration', () => {
    it('should handle complete loading cycle', async () => {
      let currentLoading = true;
      let currentData = mockApplications.slice(0, 1);
      
      // Mock changing state over time
      mockUseFetch.mockImplementation(() => ({
        data: currentData,
        error: '',
        loading: currentLoading,
        paginationInfo: { hasNext: true, hasPrev: false, currentPage: 1 },
        loadMore: () => {
          currentLoading = false;
          currentData = mockApplications;
        },
        refetch: mockRefetch
      }));

      const { rerender } = render(<Applications />);

      // Initially should show loading button
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate loading completion
      currentLoading = false;
      rerender(<Applications />);

      expect(screen.getByText('Load More')).toBeInTheDocument();
      expect(screen.getByTestId('application-1')).toBeInTheDocument();
    });
  });
});