import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import type { Medication } from "../types";

interface MedicationTableProps {
  medications: Medication[];
  loading: boolean;
  onMedicationClick: (medication: Medication) => void;
}

export function MedicationTable({ medications, loading, onMedicationClick }: MedicationTableProps) {
  if (loading) {
    return (
      <div className="bg-marek-gray-750 rounded-2xl overflow-hidden border border-marek-gray-600 shadow-lg">
        <div className="p-12 text-center text-marek-gray-500">
          <div className="animate-spin w-8 h-8 border-3 border-marek-red border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-medium text-marek-gray-300">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-marek-gray-750 rounded-2xl overflow-hidden border border-marek-gray-600 shadow-lg">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors data-[state=selected]:bg-muted border-marek-gray-600 hover:bg-marek-gray-700 bg-marek-gray-700">
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  NAME
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  ACTIVE VENDOR
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  TYPE
                  <ChevronDown className="w-4 h-4 opacity-50" />
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  VENDORS
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  SKUS
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-300 font-bold text-sm tracking-wide py-4">
                <div className="flex items-center gap-2">
                  POSITION
                  <MoreHorizontal className="w-4 h-4 opacity-50" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center text-marek-gray-400 py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-marek-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-3xl">📋</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-marek-white">No medications found</p>
                      <p className="text-sm text-marek-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              medications.map((medication, index) => (
                <tr
                  key={medication.id}
                  className="border-b data-[state=selected]:bg-muted border-marek-gray-600 hover:bg-marek-gray-700 transition-colors cursor-pointer"
                  onClick={() => onMedicationClick(medication)}
                >
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-marek-white font-semibold py-5">{medication.name}</td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          medication.isActive ? "bg-green-500" : "bg-marek-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          medication.isActive ? "text-green-700" : "text-marek-gray-400"
                        }`}
                      >
                        {medication.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-5">
                    <div className="inline-flex items-center rounded-full text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-marek-red text-marek-white border-0 hover:bg-marek-red-dark font-medium px-3 py-1">
                      {medication.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-400 py-5 font-medium">{medication.vendor || "—"}</td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-400 py-5 font-mono text-sm">{medication.sku || "—"}</td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-marek-gray-400 py-5 font-mono text-sm">{medication.position || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}