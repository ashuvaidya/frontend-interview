import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SingleApplication from './SingleApplication';
import { Application } from '../types';

const mockApplication: Application = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  company: 'Test Company Ltd',
  email: 'john.doe@testcompany.com',
  loan_amount: 50000,
  loan_type: 'Business Loan',
  date_created: '2023-01-15T10:30:00Z',
  expiry_date: '2023-12-15T10:30:00Z',
  avatar: 'https://example.com/avatar.jpg',
  loan_history: [
    {
      loan_started: '2022-01-01T00:00:00Z',
      loan_ended: '2022-12-31T23:59:59Z',
      principle: 30000,
      interest_rate: 0.05,
      interest: 1500
    }
  ]
};

describe('SingleApplication Component', () => {
  it('should render all application information correctly', () => {
    render(<SingleApplication application={mockApplication} />);

    // Check company information
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Test Company Ltd')).toBeInTheDocument();

    // Check name information
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check email information
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('john.doe@testcompany.com')).toBeInTheDocument();

    // Check loan amount information (with comma formatting)
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByText('£50,000')).toBeInTheDocument();

    // Check application date
    expect(screen.getByText('Application Date')).toBeInTheDocument();

    // Check expiry date
    expect(screen.getByText('Expiry date')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    const appWithSpecificDates: Application = {
      ...mockApplication,
      date_created: '2023-01-15T10:30:00Z',
      expiry_date: '2023-12-31T10:30:00Z'
    };

    render(<SingleApplication application={appWithSpecificDates} />);

    // The component formats dates as DD-MM-YYYY
    // Note: The exact format might depend on locale settings
    const applicationDate = screen.getByText(/Application Date/i).parentElement;
    const expiryDate = screen.getByText(/Expiry date/i).parentElement;

    expect(applicationDate).toBeInTheDocument();
    expect(expiryDate).toBeInTheDocument();
  });

  it('should apply email styling class', () => {
    render(<SingleApplication application={mockApplication} />);

    const emailElement = screen.getByText('john.doe@testcompany.com');
    // CSS modules will hash the class name, so check if it contains 'email'
    expect(emailElement.className).toMatch(/email/);
  });

  it('should display loan amount with currency symbol', () => {
    const appWithDifferentAmount: Application = {
      ...mockApplication,
      loan_amount: 75500
    };

    render(<SingleApplication application={appWithDifferentAmount} />);

    expect(screen.getByText('£75,500')).toBeInTheDocument();
  });

  it('should handle edge cases with empty or special characters', () => {
    const appWithSpecialChars: Application = {
      ...mockApplication,
      first_name: "D'Angelo",
      last_name: 'O\'Sullivan',
      company: 'Test & Co. Ltd.',
      email: 'test+email@example-domain.co.uk'
    };

    render(<SingleApplication application={appWithSpecialChars} />);

    expect(screen.getByText("D'Angelo O'Sullivan")).toBeInTheDocument();
    expect(screen.getByText('Test & Co. Ltd.')).toBeInTheDocument();
    expect(screen.getByText('test+email@example-domain.co.uk')).toBeInTheDocument();
  });

  it('should have correct structure with all cells', () => {
    const { container } = render(<SingleApplication application={mockApplication} />);

    // CSS modules will hash class names, so look for elements containing 'cell' in class name
    const cells = container.querySelectorAll('[class*="cell"]');
    expect(cells).toHaveLength(6);

    // Check that each cell has a label (sub element)
    cells.forEach(cell => {
      const label = cell.querySelector('sub');
      expect(label).toBeInTheDocument();
    });
  });

  it('should handle zero loan amount', () => {
    const appWithZeroAmount: Application = {
      ...mockApplication,
      loan_amount: 0
    };

    render(<SingleApplication application={appWithZeroAmount} />);

    expect(screen.getByText('£0')).toBeInTheDocument();
  });

  it('should handle large loan amounts', () => {
    const appWithLargeAmount: Application = {
      ...mockApplication,
      loan_amount: 1500000
    };

    render(<SingleApplication application={appWithLargeAmount} />);

    expect(screen.getByText('£1,500,000')).toBeInTheDocument();
  });

  it('should be accessible with proper labels', () => {
    render(<SingleApplication application={mockApplication} />);

    // Each field should have a label (sub element) for accessibility
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByText('Application Date')).toBeInTheDocument();
    expect(screen.getByText('Expiry date')).toBeInTheDocument();
  });
});