"use client";

import { useState, useMemo } from "react";
import { type SparePart } from "@/lib/api";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";

interface SparePartTableProps {
  spareParts: SparePart[];
  onEdit: (sparePart: SparePart) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

export function SparePartTable({
  spareParts,
  onEdit,
  onDelete,
  loading,
}: SparePartTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = spareParts;

    if (statusFilter === "defective") {
      data = data.filter((sp) => sp.is_defective);
    } else if (statusFilter === "good") {
      data = data.filter((sp) => !sp.is_defective);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (sp) =>
          sp.name.toLowerCase().includes(query) ||
          (sp.description && sp.description.toLowerCase().includes(query))
      );
    }

    return data;
  }, [spareParts, searchQuery, statusFilter]);

  const columns: ColumnDef<SparePart>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Parça Adı
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-zinc-200">
            {row.getValue("name")}
          </span>
        ),
      },
      {
        accessorKey: "is_defective",
        header: () => <span className="text-zinc-400">Durum</span>,
        cell: ({ row }) => {
          const isDefective = row.getValue("is_defective") as boolean;
          return isDefective ? (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bozuk
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              Sağlam
            </Badge>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Stok Adedi
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const quantity = row.getValue("quantity") as number;
          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold tabular-nums ${
                  quantity < 5
                    ? "text-red-400"
                    : quantity < 10
                    ? "text-amber-400"
                    : "text-zinc-200"
                }`}
              >
                {quantity}
              </span>
              {quantity < 5 && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: () => <span className="text-zinc-400">Açıklama</span>,
        cell: ({ row }) => (
          <span className="text-zinc-500 text-sm max-w-[240px] truncate block">
            {row.getValue("description") || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-zinc-400">İşlemler</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem
                onClick={() => onEdit(row.original)}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 bg-zinc-800/50" />
          <Skeleton className="h-10 w-44 bg-zinc-800/50" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Parça adı veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 transition-colors"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-zinc-300">
            <SelectValue placeholder="Durum Filtresi" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-800">
              Tümü
            </SelectItem>
            <SelectItem
              value="good"
              className="text-zinc-300 focus:bg-zinc-800"
            >
              Sağlam
            </SelectItem>
            <SelectItem
              value="defective"
              className="text-zinc-300 focus:bg-zinc-800"
            >
              Bozuk
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-zinc-800/50 overflow-hidden bg-zinc-900/30">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-zinc-800/50 hover:bg-transparent bg-zinc-900/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-zinc-800/50 transition-colors duration-150 hover:bg-zinc-800/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-zinc-500"
                >
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-zinc-600 text-right">
        {filteredData.length} kayıt gösteriliyor
      </div>
    </div>
  );
}
