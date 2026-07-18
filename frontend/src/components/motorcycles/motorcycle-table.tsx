"use client";

import { useState, useMemo } from "react";
import { type Motorcycle } from "@/lib/api";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
  Printer,
  Filter,
} from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value
  );

interface MotorcycleTableProps {
  motorcycles: Motorcycle[];
  onEdit: (motorcycle: Motorcycle) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

export function MotorcycleTable({
  motorcycles,
  onEdit,
  onDelete,
  loading,
}: MotorcycleTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const uniqueBranches = useMemo(() => {
    return Array.from(
      new Set(motorcycles.filter(m => m.is_other_branch && m.branch_name).map(m => m.branch_name))
    ).sort();
  }, [motorcycles]);

  const filteredData = useMemo(() => {
    let data = motorcycles;

    if (statusFilter !== "all") {
      data = data.filter((m) => m.status === statusFilter);
    }

    if (locationFilter !== "all") {
      if (locationFilter === "merkez") {
        data = data.filter((m) => !m.is_other_branch);
      } else {
        data = data.filter((m) => m.is_other_branch && m.branch_name === locationFilter);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((m) => {
        const statusText = m.status === "available" ? "bekliyor" : "satıldı";
        const locationText = (m.is_other_branch && m.branch_name) ? m.branch_name.toLowerCase() : "merkez";
        
        return (
          m.chassis_number.toLowerCase().includes(query) ||
          m.brand.toLowerCase().includes(query) ||
          m.model.toLowerCase().includes(query) ||
          m.year.toString().includes(query) ||
          m.color.toLowerCase().includes(query) ||
          m.purchase_price.toString().includes(query) ||
          m.sale_price.toString().includes(query) ||
          statusText.includes(query) ||
          locationText.includes(query)
        );
      });
    }

    return data;
  }, [motorcycles, searchQuery, statusFilter, locationFilter]);

  const columns: ColumnDef<Motorcycle>[] = useMemo(
    () => [
      {
        accessorKey: "chassis_number",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Şasi No
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-zinc-300">
            {row.getValue("chassis_number")}
          </span>
        ),
      },
      {
        accessorKey: "brand",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Marka
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-zinc-200">
            {row.getValue("brand")}
          </span>
        ),
      },
      {
        accessorKey: "model",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Model
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-300">{row.getValue("model")}</span>
        ),
      },
      {
        accessorKey: "year",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Yıl
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-400">{row.getValue("year")}</span>
        ),
      },
      {
        accessorKey: "color",
        header: () => <span className="text-zinc-400">Renk</span>,
        cell: ({ row }) => (
          <span className="text-zinc-400">{row.getValue("color")}</span>
        ),
      },
      {
        accessorKey: "purchase_price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Alış Fiyatı
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-400 tabular-nums">
            {formatCurrency(row.getValue("purchase_price"))}
          </span>
        ),
      },
      {
        accessorKey: "sale_price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-zinc-400 hover:text-zinc-200 -ml-4"
          >
            Satış Fiyatı
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-200 font-semibold tabular-nums">
            {formatCurrency(row.getValue("sale_price"))}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <span className="text-zinc-400">Durum</span>,
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              className={
                status === "available"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
              }
            >
              {status === "available" ? "Bekliyor" : "Satıldı"}
            </Badge>
          );
        },
      },
      {
        id: "location",
        header: () => <span className="text-zinc-400">Konum</span>,
        cell: ({ row }) => {
          const isOther = row.original.is_other_branch;
          const branch = row.original.branch_name;
          if (isOther && branch) {
            return (
              <div title={branch} className="max-w-[140px]">
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[11px] whitespace-nowrap truncate block w-full text-center">
                  {branch}
                </Badge>
              </div>
            );
          }
          return <span className="text-zinc-500 text-sm whitespace-nowrap">Merkez</span>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-zinc-400">İşlemler</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
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
          </div>
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Motosiklet Listesi</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #000; }
            h2 { text-align: center; margin-bottom: 20px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            @media print {
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h2>Motosiklet Listesi</h2>
          <table>
            <thead>
              <tr>
                <th>Şasi No</th>
                <th>Marka</th>
                <th>Model</th>
                <th>Yıl</th>
                <th>Renk</th>
              </tr>
            </thead>
            <tbody>
              ${table.getRowModel().rows.map(row => `
                <tr>
                  <td>${row.original.chassis_number}</td>
                  <td>${row.original.brand}</td>
                  <td>${row.original.model}</td>
                  <td>${row.original.year}</td>
                  <td>${row.original.color}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 bg-zinc-800/50" />
          <Skeleton className="h-10 w-40 bg-zinc-800/50" />
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
            placeholder="Tüm tablodaki verilerde ara (Şasi, Marka, Model, Yıl, Renk, Fiyat, Durum, Konum)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 transition-colors"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-zinc-900/50 border-zinc-800 text-zinc-300">
            <Filter className="w-4 h-4 mr-2 opacity-50" />
            <SelectValue placeholder="Konum" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
            <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-800">Tüm Konumlar</SelectItem>
            <SelectItem value="merkez" className="text-zinc-300 focus:bg-zinc-800">Merkez</SelectItem>
            {uniqueBranches.map(branch => (
              <SelectItem key={branch} value={branch} className="text-zinc-300 focus:bg-zinc-800">{branch}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-zinc-900/50 border-zinc-800 text-zinc-300">
            <SelectValue placeholder="Durum Filtresi" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-800">
              Tümü
            </SelectItem>
            <SelectItem
              value="available"
              className="text-zinc-300 focus:bg-zinc-800"
            >
              Bekliyor
            </SelectItem>
            <SelectItem
              value="sold"
              className="text-zinc-300 focus:bg-zinc-800"
            >
              Satıldı
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handlePrint}
          className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
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

      <DataTablePagination table={table} />
    </div>
  );
}
