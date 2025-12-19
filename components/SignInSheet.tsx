import React from 'react';
import { MeetingInfo, Participant } from '../types';

interface SignInSheetProps {
  meetingInfo: MeetingInfo;
  participants: Participant[];
}

const ROWS_PER_PAGE = 10;

const SignInSheet: React.FC<SignInSheetProps> = ({ meetingInfo, participants }) => {
  // Calculate how many pages we need.
  // We need at least 1 page.
  // If participants exceed ROWS_PER_PAGE, we add more pages.
  // We also want to ensure there are some empty rows at the end if the last page is full,
  // or just fill the last page with empty rows to look nice.
  
  const minRows = ROWS_PER_PAGE;
  const totalRowsNeeded = Math.max(participants.length + 3, minRows); // Ensure some extra space
  const pageCount = Math.ceil(totalRowsNeeded / ROWS_PER_PAGE) || 1;

  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const startIndex = pageIndex * ROWS_PER_PAGE;
    // Get participants for this page
    const pageParticipants = participants.slice(startIndex, startIndex + ROWS_PER_PAGE);
    
    // Fill the rest of the page with empty rows if needed
    const emptyRowsCount = ROWS_PER_PAGE - pageParticipants.length;
    const emptyRows = Array.from({ length: Math.max(0, emptyRowsCount) }, (_, i) => ({
      id: `empty-${pageIndex}-${i}`,
      unit: '',
      title: '',
      name: '',
      note: '',
      dietary: 'meat' as const,
      isEmpty: true
    }));

    return [...pageParticipants, ...emptyRows];
  });

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr; // Return original if not a valid date
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const unitHeaderLabel = meetingInfo.unitLabelType === 'unit' ? '單 位' : '部 門';

  return (
    <div className="w-full flex flex-col items-center gap-8 bg-gray-200 p-8 print:p-0 print:bg-white print:block">
      {pages.map((rows, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] p-[15mm] relative box-border mx-auto page-break font-serif-tc text-black"
        >
          {/* Header Section */}
          <div className="text-center mb-1">
            <h1 className="text-2xl font-bold tracking-wide leading-relaxed">
              {meetingInfo.mainTitle}
              <br />
              {meetingInfo.subTitle}
              <br />
              {meetingInfo.docName}
            </h1>
          </div>

          <div className="text-right mb-1 text-sm">
            <span>主辦機關：{meetingInfo.organizer}</span>
          </div>

          {/* Info Table */}
          <div className="border-2 border-black">
            {/* Row 1: Time & Place */}
            <div className="flex border-b border-black">
              <div className="w-24 flex items-center justify-center border-r border-black p-2 font-bold bg-gray-50 print:bg-transparent">
                時 間
              </div>
              <div className="flex-1 p-2 flex items-center border-r border-black">
                {formatTime(meetingInfo.time)}
              </div>
              <div className="w-24 flex items-center justify-center border-r border-black p-2 font-bold bg-gray-50 print:bg-transparent">
                地 點
              </div>
              <div className="w-48 p-2 flex items-center">
                {meetingInfo.location}
              </div>
            </div>

            {/* Row 2: Host & Recorder */}
            <div className="flex border-b border-black">
              <div className="w-24 flex items-center justify-center border-r border-black p-2 font-bold bg-gray-50 print:bg-transparent">
                主 持 人
              </div>
              <div className="flex-1 p-2 flex items-center border-r border-black">
                {meetingInfo.chairperson}
              </div>
              <div className="w-24 flex items-center justify-center border-r border-black p-2 font-bold bg-gray-50 print:bg-transparent">
                紀 錄
              </div>
              <div className="w-48 p-2 flex items-center">
                {meetingInfo.recorder}
              </div>
            </div>

            {/* Main Table Header */}
            <div className="flex border-b border-black text-center h-14">
              <div className="w-12 border-r border-black flex items-center justify-center bg-gray-50 print:bg-transparent">
                {/* Empty corner for vertical text column */}
              </div>
              <div className="w-28 border-r border-black flex items-center justify-center font-bold bg-gray-50 print:bg-transparent">
                {unitHeaderLabel}
              </div>
              <div className="w-28 border-r border-black flex items-center justify-center font-bold bg-gray-50 print:bg-transparent">
                職 稱
              </div>
              <div className="flex-1 border-r border-black flex flex-col items-center justify-center font-bold bg-gray-50 print:bg-transparent">
                <span>簽 名</span>
                <span className="text-[10px] font-normal">(請以正楷書寫，以利辨識)</span>
              </div>
              <div className="w-24 flex items-center justify-center font-bold bg-gray-50 print:bg-transparent">
                備 註
              </div>
            </div>

            {/* Table Body Container with Sidebar */}
            <div className="flex">
               {/* Vertical Sidebar "出席人員" */}
               <div className="w-12 border-r border-black flex items-center justify-center py-4 bg-gray-50 print:bg-transparent">
                  <span className="text-lg font-bold" style={{ writingMode: 'vertical-rl', letterSpacing: '0.5em' }}>
                    出席人員
                  </span>
               </div>

               {/* Rows Container */}
               <div className="flex-1 flex flex-col">
                  {rows.map((row, idx) => (
                    <div 
                      key={row.id} 
                      className={`flex h-[20mm] ${idx !== rows.length - 1 ? 'border-b border-black' : ''}`}
                    >
                      {/* Unit */}
                      <div className="w-28 border-r border-black flex items-center justify-center p-1 text-center">
                        {row.unit}
                      </div>
                      {/* Title */}
                      <div className="w-28 border-r border-black flex items-center justify-center p-1 text-center">
                        {row.title}
                      </div>
                      {/* Name (Signature Area) */}
                      <div className="flex-1 border-r border-black flex items-center justify-start px-4 text-xl font-handwriting text-blue-900">
                        {!row.name ? '' : <span className="font-medium text-black">{row.name}</span>}
                      </div>
                      {/* Note */}
                      <div className="w-24 flex items-center justify-center p-1 text-sm text-center">
                        {row.note}
                        {/* Auto-append vegetarian info to note for printing if enabled */}
                        {meetingInfo.showDietary && row.dietary === 'vegetarian' && (
                           <span className="block text-[10px] font-bold mt-1">(素)</span>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          
          {/* Footer Page Number */}
          <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-500">
            第 {pageIndex + 1} 頁 / 共 {pageCount} 頁
          </div>
        </div>
      ))}
    </div>
  );
};

export default SignInSheet;