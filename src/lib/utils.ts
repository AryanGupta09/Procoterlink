import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ExportData {
  participantName: string;
  participantEmail: string;
  collegeName: string;
  passingYear: string;
  score: string;
  rawScore: number;
  totalQuestions: number;
  submittedAt: string;
  submittedAtDate: Date;
}

export function exportToExcel(data: ExportData[], filename: string = 'exam-results') {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel - flatten and format
  const excelData = data.map((item, index) => ({
    'S.No': index + 1,
    'Participant Name': item.participantName,
    'Email': item.participantEmail,
    'College Name': item.collegeName,
    'Passing Year': item.passingYear,
    'Score': item.score,
    'Total Questions': item.totalQuestions,
    'Submitted At': item.submittedAt,
    'Status': 'Completed'
  }));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for better formatting
  const columnWidths = [
    { wch: 8 },   // S.No
    { wch: 25 },  // Participant Name
    { wch: 30 },  // Email
    { wch: 25 },  // College Name
    { wch: 15 },  // Passing Year
    { wch: 12 },  // Score
    { wch: 15 },  // Total Questions
    { wch: 20 },  // Submitted At
    { wch: 12 }   // Status
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
  
  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
