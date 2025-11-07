import { describe, it, expect } from 'vitest';
import { parseLinkHeader, extractPaginationInfo } from './linkHeaderParser';

describe('linkHeaderParser', () => {
  describe('parseLinkHeader', () => {
    it('should parse a simple next link', () => {
      const linkHeader = '<http://localhost:3001/api/applications?_page=2&_limit=5>; rel="next"';
      const result = parseLinkHeader(linkHeader);

      expect(result).toEqual([
        {
          url: 'http://localhost:3001/api/applications?_page=2&_limit=5',
          rel: 'next',
          page: 2
        }
      ]);
    });

    it('should parse multiple link relations', () => {
      const linkHeader = `<http://localhost:3001/api/applications?_page=1&_limit=5>; rel="first", <http://localhost:3001/api/applications?_page=2&_limit=5>; rel="next", <http://localhost:3001/api/applications?_page=10&_limit=5>; rel="last"`;
      const result = parseLinkHeader(linkHeader);

      expect(result).toEqual([
        {
          url: 'http://localhost:3001/api/applications?_page=1&_limit=5',
          rel: 'first',
          page: 1
        },
        {
          url: 'http://localhost:3001/api/applications?_page=2&_limit=5',
          rel: 'next',
          page: 2
        },
        {
          url: 'http://localhost:3001/api/applications?_page=10&_limit=5',
          rel: 'last',
          page: 10
        }
      ]);
    });

    it('should parse all standard pagination relations', () => {
      const linkHeader = `<http://localhost:3001/api/applications?_page=1&_limit=5>; rel="first", <http://localhost:3001/api/applications?_page=4&_limit=5>; rel="prev", <http://localhost:3001/api/applications?_page=6&_limit=5>; rel="next", <http://localhost:3001/api/applications?_page=20&_limit=5>; rel="last"`;
      const result = parseLinkHeader(linkHeader);

      expect(result).toHaveLength(4);
      expect(result.find(link => link.rel === 'first')).toEqual({
        url: 'http://localhost:3001/api/applications?_page=1&_limit=5',
        rel: 'first',
        page: 1
      });
      expect(result.find(link => link.rel === 'prev')).toEqual({
        url: 'http://localhost:3001/api/applications?_page=4&_limit=5',
        rel: 'prev',
        page: 4
      });
      expect(result.find(link => link.rel === 'next')).toEqual({
        url: 'http://localhost:3001/api/applications?_page=6&_limit=5',
        rel: 'next',
        page: 6
      });
      expect(result.find(link => link.rel === 'last')).toEqual({
        url: 'http://localhost:3001/api/applications?_page=20&_limit=5',
        rel: 'last',
        page: 20
      });
    });

    it('should return empty array for empty link header', () => {
      const result = parseLinkHeader('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null/undefined link header', () => {
      expect(parseLinkHeader('')).toEqual([]);
    });

    it('should handle malformed link headers gracefully', () => {
      const malformedHeader = 'invalid-link-header';
      const result = parseLinkHeader(malformedHeader);
      expect(result).toEqual([]);
    });

    it('should handle links without page numbers', () => {
      const linkHeader = '<http://localhost:3001/api/applications?limit=5>; rel="next"';
      const result = parseLinkHeader(linkHeader);

      expect(result).toEqual([
        {
          url: 'http://localhost:3001/api/applications?limit=5',
          rel: 'next',
          page: undefined
        }
      ]);
    });

    it('should handle different URL formats', () => {
      const linkHeader = '<https://api.example.com/users?page=3&per_page=10>; rel="next"';
      const result = parseLinkHeader(linkHeader);

      expect(result).toEqual([
        {
          url: 'https://api.example.com/users?page=3&per_page=10',
          rel: 'next',
          page: 3
        }
      ]);
    });
  });

  describe('extractPaginationInfo', () => {
    it('should extract pagination info with next and prev', () => {
      const links = [
        { url: '/api/apps?_page=1&_limit=5', rel: 'first', page: 1 },
        { url: '/api/apps?_page=2&_limit=5', rel: 'prev', page: 2 },
        { url: '/api/apps?_page=4&_limit=5', rel: 'next', page: 4 },
        { url: '/api/apps?_page=10&_limit=5', rel: 'last', page: 10 }
      ];

      const result = extractPaginationInfo(links, 3);

      expect(result).toEqual({
        hasNext: true,
        hasPrev: true,
        totalPages: 10,
        currentPage: 3
      });
    });

    it('should handle first page correctly', () => {
      const links = [
        { url: '/api/apps?_page=2&_limit=5', rel: 'next', page: 2 },
        { url: '/api/apps?_page=10&_limit=5', rel: 'last', page: 10 }
      ];

      const result = extractPaginationInfo(links, 1);

      expect(result).toEqual({
        hasNext: true,
        hasPrev: false,
        totalPages: 10,
        currentPage: 1
      });
    });

    it('should handle last page correctly', () => {
      const links = [
        { url: '/api/apps?_page=1&_limit=5', rel: 'first', page: 1 },
        { url: '/api/apps?_page=9&_limit=5', rel: 'prev', page: 9 }
      ];

      const result = extractPaginationInfo(links, 10);

      expect(result).toEqual({
        hasNext: false,
        hasPrev: true,
        totalPages: undefined,
        currentPage: 10
      });
    });

    it('should handle single page scenario', () => {
      const links: any[] = [];

      const result = extractPaginationInfo(links, 1);

      expect(result).toEqual({
        hasNext: false,
        hasPrev: false,
        totalPages: undefined,
        currentPage: 1
      });
    });

    it('should handle missing last link', () => {
      const links = [
        { url: '/api/apps?_page=3&_limit=5', rel: 'next', page: 3 }
      ];

      const result = extractPaginationInfo(links, 2);

      expect(result).toEqual({
        hasNext: true,
        hasPrev: false,
        totalPages: undefined,
        currentPage: 2
      });
    });

    it('should handle links without page information', () => {
      const links = [
        { url: '/api/apps?limit=5', rel: 'next' },
        { url: '/api/apps?limit=5', rel: 'prev' }
      ];

      const result = extractPaginationInfo(links, 5);

      expect(result).toEqual({
        hasNext: true,
        hasPrev: true,
        totalPages: undefined,
        currentPage: 5
      });
    });
  });
});