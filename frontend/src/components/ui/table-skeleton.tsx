"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

interface TableSkeletonProps {
  columnsCount: number;
  rowCount?: number;
}

export function TableSkeleton({ columnsCount, rowCount = 5 }: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-zinc-800/50 hover:bg-transparent">
          {Array.from({ length: columnsCount }).map((_, colIndex) => (
            <TableCell key={colIndex} className="py-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: rowIndex * 0.1 }}
              >
                <Skeleton className="h-5 w-full bg-zinc-800/80 rounded" />
              </motion.div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
