import { useState, useMemo } from 'react';

interface PaginationConfig {
  pageSize?: number;
}

export function usePagination<T>(items: T[], config: PaginationConfig = {}) {
  const { pageSize = 20 } = config;
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const totalPages = Math.ceil(items.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (hasNextPage) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (hasPrevPage) setCurrentPage(prev => prev - 1);
  };

  const reset = () => setCurrentPage(1);

  return {
    data: paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems: items.length,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    reset,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, items.length)
  };
}
