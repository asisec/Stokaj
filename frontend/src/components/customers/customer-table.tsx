"use client";

import { useState, useMemo } from "react";
import { type Customer } from "@/lib/api";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value
  );

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  loading,
}: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        (c.identity_number && c.identity_number.includes(query)) ||
        c.phone.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      {
        accessorKey: "identity_number",
        header: () => <span className="text-zinc-400">T.C. Kimlik No</span>,
        cell: ({ row }) => (
          <span className="text-zinc-300 font-mono text-sm">
            {row.getValue("identity_number") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "first_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Ad
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-zinc-200">
            {row.getValue("first_name")}
          </span>
        ),
      },
      {
        accessorKey: "last_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Soyad
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-zinc-200">
            {row.getValue("last_name")}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: () => <span className="text-zinc-400">Telefon</span>,
        cell: ({ row }) => (
          <span className="text-zinc-300 font-mono text-sm">
            {row.getValue("phone")}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: () => <span className="text-zinc-400">E-posta</span>,
        cell: ({ row }) => (
          <span className="text-zinc-400 text-sm">
            {row.getValue("email") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: () => <span className="text-zinc-400">Adres</span>,
        cell: ({ row }) => (
          <span 
            className="text-zinc-400 text-sm max-w-[250px] whitespace-normal break-words block"
            title={row.getValue("address") || ""}
          >
            {row.getValue("address") || "-"}
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
        <Skeleton className="h-10 w-full bg-zinc-800/50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Ad, soyad veya telefon ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 transition-colors"
        />
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
