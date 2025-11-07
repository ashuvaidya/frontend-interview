import { useState, useEffect, useCallback } from "react";
import { Application, PaginationInfo } from "../types";
import { parseLinkHeader, extractPaginationInfo } from "../utils/linkHeaderParser";

export const useFetch = () => {
  const [data, setData] = useState<Application[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    hasNext: false,
    hasPrev: false,
    currentPage: 0,
  });

  const getApplications = async (page: number, isLoadMore = false) => {
    setLoading(true);
    setError("");
    
    try {
      const result = await fetch(
        `http://localhost:3001/api/applications?_page=${page}&_limit=5`
      );

      if (result.status === 200) {
        const applications: Application[] = await result.json();
        const linkHeader = result.headers.get('Link');
        
        // Parse Link header for pagination info
        const links = parseLinkHeader(linkHeader || '');
        const pagination = extractPaginationInfo(links, page);
        
        setPaginationInfo(pagination);

        // Update data - append if loading more, replace if first load
        if (isLoadMore) {
          setData(prevData => [...prevData, ...applications]);
        } else {
          setData(applications);
        }
      } else {
        setError("Unable to fetch applications.");
      }
    } catch (error) {
      setError("Failed to fetch applications.");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && paginationInfo.hasNext) {
      getApplications(paginationInfo.currentPage + 1, true);
    }
  }, [loading, paginationInfo.hasNext, paginationInfo.currentPage]);

  const refetch = useCallback(() => {
    setData([]);
    setPaginationInfo({
      hasNext: false,
      hasPrev: false,
      currentPage: 0,
    });
    getApplications(1, false);
  }, []);

  // Load first page on mount
  useEffect(() => {
    getApplications(1, false);
  }, []);

  return { 
    data, 
    error, 
    loading, 
    paginationInfo,
    loadMore,
    refetch 
  };
};
