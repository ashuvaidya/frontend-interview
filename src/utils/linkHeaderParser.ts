export interface LinkInfo {
  url: string;
  rel: string;
  page?: number;
}

/**
 * Parses the Link header to extract pagination information
 * Example Link header:
 * </api/applications?_page=1&_limit=5>; rel="first", </api/applications?_page=2&_limit=5>; rel="next"
 */
export function parseLinkHeader(linkHeader: string): LinkInfo[] {
  if (!linkHeader) return [];

  const links: LinkInfo[] = [];
  const parts = linkHeader.split(',');

  parts.forEach((part) => {
    const section = part.trim();
    const urlMatch = section.match(/<([^>]+)>/);
    const relMatch = section.match(/rel="([^"]+)"/);

    if (urlMatch && relMatch) {
      const url = urlMatch[1];
      const rel = relMatch[1];
      
      // Extract page number from URL - support both _page= and page= parameters
      const pageMatch = url.match(/[?&](?:_page|page)=(\d+)/);
      const page = pageMatch ? parseInt(pageMatch[1], 10) : undefined;

      links.push({ url, rel, page });
    }
  });

  return links;
}

/**
 * Extracts pagination info from parsed Link header
 */
export function extractPaginationInfo(links: LinkInfo[], currentPage: number) {
  const hasNext = links.some(link => link.rel === 'next');
  const hasPrev = links.some(link => link.rel === 'prev');
  const lastLink = links.find(link => link.rel === 'last');
  const totalPages = lastLink?.page;

  return {
    hasNext,
    hasPrev,
    totalPages,
    currentPage
  };
}