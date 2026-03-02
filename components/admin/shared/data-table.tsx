'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  /** Hide this column on mobile card view */
  hideOnMobile?: boolean;
  /** Show this column as the primary/header content on mobile */
  mobileHeader?: boolean;
  render?: (value: unknown, row: T, index?: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  rowKey: keyof T | ((row: T) => string);
  /** Custom mobile card render function */
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado',
  searchable = false,
  searchPlaceholder = 'Buscar...',
  onSearch,
  pagination,
  onRowClick,
  rowKey,
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    const typedRow = row as Record<string, unknown>;
    return String(typedRow[rowKey as string] ?? index);
  };

  const getValue = (row: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      if (value && typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  };

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  // Get columns for mobile display
  const mobileHeaderColumn = columns.find(c => c.mobileHeader);
  const mobileColumns = columns.filter(c => !c.hideOnMobile && !c.mobileHeader);

  // Default mobile card render
  const defaultMobileCard = (row: T, index: number) => {
    return (
      <div
        key={getRowKey(row, index)}
        className={cn(
          'bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3 transition-all duration-150',
          onRowClick && 'cursor-pointer active:bg-zinc-800/70'
        )}
        onClick={() => onRowClick?.(row)}
      >
        {/* Header row with primary column */}
        {mobileHeaderColumn && (
          <div className="border-b border-zinc-800/50 pb-3">
            {mobileHeaderColumn.render
              ? mobileHeaderColumn.render(getValue(row, mobileHeaderColumn.key), row, index)
              : String(getValue(row, mobileHeaderColumn.key) ?? '-')}
          </div>
        )}

        {/* Grid of other columns */}
        <div className="grid grid-cols-2 gap-3">
          {mobileColumns.map((column) => {
            // Skip actions column in grid, render separately
            if (column.key === 'actions') return null;

            return (
              <div key={column.key} className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{column.header}</p>
                <div className="text-sm text-zinc-300">
                  {column.render
                    ? column.render(getValue(row, column.key), row, index)
                    : String(getValue(row, column.key) ?? '-')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions row */}
        {mobileColumns.find(c => c.key === 'actions') && (
          <div className="pt-3 border-t border-zinc-800/50">
            {mobileColumns
              .filter(c => c.key === 'actions')
              .map(column => (
                <div key={column.key}>
                  {column.render
                    ? column.render(getValue(row, column.key), row, index)
                    : null}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search - outside card on mobile for better UX */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-zinc-700 transition-all duration-200"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-2 text-zinc-500">Carregando...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {data.map((row, index) =>
              mobileCardRender
                ? mobileCardRender(row, index)
                : defaultMobileCard(row, index)
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          'px-4 py-3.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider',
                          column.className
                        )}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr
                      key={getRowKey(row, index)}
                      className={cn(
                        'border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/30 transition-colors duration-150',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3.5 text-sm text-zinc-300',
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(getValue(row, column.key), row, index)
                            : String(getValue(row, column.key) ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination - Responsive */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-500 text-center sm:text-left">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150',
                      pagination.page === pageNum
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
