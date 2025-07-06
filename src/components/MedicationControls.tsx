import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Search, Plus, Filter, Download, Columns, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface MedicationFilters {
  search: string;
  showInactive: boolean;
  type?: string;
  doseForm?: string;
  multiIngredient?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface MedicationControlsProps {
  filters: MedicationFilters;
  pagination: PaginationState;
  onFiltersChange: (filters: Partial<MedicationFilters>) => void;
  onPaginationChange: (pagination: Partial<PaginationState>) => void;
  onAddNew: () => void;
}

export function MedicationControls({
  filters,
  pagination,
  onFiltersChange,
  onPaginationChange,
  onAddNew,
}: MedicationControlsProps) {
  return (
    <>
      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-marek-gray-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-96 bg-marek-gray-750 border-marek-gray-600 pl-12 h-12 text-marek-white placeholder-marek-gray-400 focus:border-marek-red focus:ring-marek-red/20 rounded-xl shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="show-inactive"
              checked={filters.showInactive}
              onCheckedChange={(checked: boolean) => onFiltersChange({ ...filters, showInactive: !!checked })}
              className="border-marek-gray-600 data-[state=checked]:bg-marek-red data-[state=checked]:border-marek-red"
            />
            <label htmlFor="show-inactive" className="text-sm text-marek-gray-700 font-medium cursor-pointer">
              Show Inactive Items
            </label>
          </div>
        </div>
        <Button 
          onClick={onAddNew}
          className="bg-marek-red hover:bg-marek-red-dark text-marek-white gap-2 h-12 px-6 font-semibold rounded-xl shadow-lg"
        >
          <Plus className="w-5 h-5" />
          NEW ITEM
        </Button>
      </div>

      {/* Table Controls */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-marek-gray-600 hover:text-marek-gray-900 hover:bg-marek-gray-700 gap-2 h-10 px-4 rounded-lg"
        >
          <Columns className="w-4 h-4" />
          COLUMNS
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-marek-gray-600 hover:text-marek-gray-900 hover:bg-marek-gray-700 gap-2 h-10 px-4 rounded-lg"
        >
          <Filter className="w-4 h-4" />
          FILTERS
          <Badge variant="secondary" className="bg-marek-red text-marek-white text-xs ml-1">
            1
          </Badge>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-marek-gray-600 hover:text-marek-gray-900 hover:bg-marek-gray-700 gap-2 h-10 px-4 rounded-lg"
        >
          <Download className="w-4 h-4" />
          EXPORT
        </Button>
      </div>
    </>
  );
}

interface PaginationControlsProps {
  pagination: PaginationState;
  onPaginationChange: (pagination: Partial<PaginationState>) => void;
}

export function PaginationControls({ pagination, onPaginationChange }: PaginationControlsProps) {
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-marek-gray-700">
      <div className="flex items-center gap-3 text-sm text-marek-gray-400">
        <span className="font-medium text-marek-gray-400">Rows per page:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-marek-gray-400 gap-2 h-9 px-3 hover:bg-marek-gray-700 rounded-lg"
            >
              {pagination.pageSize}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-marek-gray-750 border-marek-gray-700 shadow-dark-md">
            <DropdownMenuItem
              onClick={() => onPaginationChange({ pageSize: 10, page: 1 })}
              className="text-marek-gray-300 hover:bg-marek-gray-700"
            >
              10
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPaginationChange({ pageSize: 25, page: 1 })}
              className="text-marek-gray-300 hover:bg-marek-gray-700"
            >
              25
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPaginationChange({ pageSize: 50, page: 1 })}
              className="text-marek-gray-300 hover:bg-marek-gray-700"
            >
              50
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-6 text-sm text-marek-gray-400">
        <span className="font-medium text-marek-gray-400">
          {startItem}–{endItem} of {pagination.total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-marek-gray-400 hover:text-marek-gray-100 hover:bg-marek-gray-700 h-9 w-9 p-0 rounded-lg"
            disabled={pagination.page === 1}
            onClick={() => onPaginationChange({ page: pagination.page - 1 })}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-marek-gray-400 hover:text-marek-gray-100 hover:bg-marek-gray-700 h-9 w-9 p-0 rounded-lg"
            disabled={endItem >= pagination.total}
            onClick={() => onPaginationChange({ page: pagination.page + 1 })}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}