import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, LayoutGrid, Printer, Info, Download, Upload, FileDown, Filter, CheckSquare, Square } from 'lucide-react';
import InputForm from './components/InputForm';
import SignInSheet from './components/SignInSheet';
import SeatingChart from './components/SeatingChart';
import { MeetingInfo, Participant, SeatingConfig } from './types';
import * as docx from 'docx';
import FileSaver from 'file-saver';

const DEFAULT_ROWS = 6;
const DEFAULT_COLS = 8;
const ROWS_PER_PAGE = 10; // Match SignInSheet logic

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'print' | 'seats'>('input');
  
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>({
    organizer: '綜合施工處',
    mainTitle: '「淡水服務所及區域巡修中心新建工程」',
    subTitle: '開工前協調暨工安、環保宣導',
    docName: '會議出席人員簽名冊',
    time: '2022-09-05T09:30', // Default to an ISO string for datetime-local
    location: '處本部8樓會議室',
    chairperson: '張維鈞副處長',
    recorder: '',
    showDietary: true,
    unitLabelType: 'unit',
  });

  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', unit: '綜合施工處', title: '副處長', name: '張維鈞', note: '', dietary: 'meat' },
    { id: '2', unit: '綜合施工處', title: '處長', name: '簡奉順', note: '列席', dietary: 'meat' },
    { id: '3', unit: '綜合施工處', title: '經理', name: '吳世享', note: '', dietary: 'meat' },
    { id: '4', unit: '台北北區營業處', title: '課長', name: '林永華', note: '', dietary: 'meat' },
    { id: '5', unit: '旺邦營造', title: '業務副理', name: '周昌秀', note: '', dietary: 'meat' },
  ]);

  // Filtering State
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // Calculate unique units from participants
  const allUnits = useMemo(() => {
    return Array.from(new Set(participants.map(p => p.unit).filter(Boolean)));
  }, [participants]);

  // Initialize selected units when unit list changes (select all by default if empty)
  useEffect(() => {
    if (selectedUnits.length === 0 && allUnits.length > 0) {
      setSelectedUnits(allUnits);
    }
  }, [allUnits]);

  const toggleUnit = (unit: string) => {
    if (selectedUnits.includes(unit)) {
      setSelectedUnits(selectedUnits.filter(u => u !== unit));
    } else {
      setSelectedUnits([...selectedUnits, unit]);
    }
  };

  const selectAllUnits = () => setSelectedUnits(allUnits);
  const clearAllUnits = () => setSelectedUnits([]);

  // Filtered Participants used for Print and Export
  const filteredParticipants = useMemo(() => {
    if (selectedUnits.length === 0) return [];
    return participants.filter(p => selectedUnits.includes(p.unit));
  }, [participants, selectedUnits]);


  // Lifted Seating Config State
  const [seatingConfig, setSeatingConfig] = useState<SeatingConfig>(() => {
      const seats = [];
      for(let r=0; r<DEFAULT_ROWS; r++) {
          for(let c=0; c<DEFAULT_COLS; c++) {
              seats.push({ 
                id: `seat-${r}-${c}`, 
                row: r, 
                col: c, 
                isActive: true, 
                type: 'standard' as const, 
                participantId: null 
              });
          }
      }
      return { rows: DEFAULT_ROWS, cols: DEFAULT_COLS, seats };
  });

  // Helper to generate a safe filename based on meeting info
  const getSafeFileName = (extension: string) => {
    const dateObj = new Date(meetingInfo.time);
    const dateStr = isNaN(dateObj.getTime()) 
      ? '日期未定' 
      : `${dateObj.getFullYear()}${String(dateObj.getMonth()+1).padStart(2,'0')}${String(dateObj.getDate()).padStart(2,'0')}`;
    
    // Remove illegal characters for filenames
    const cleanMain = meetingInfo.mainTitle.replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 15);
    const cleanSub = meetingInfo.subTitle.replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 15);
    
    const baseName = `${dateStr}_${cleanMain}${cleanSub ? '_' + cleanSub : ''}`;
    return `${baseName}.${extension}`;
  };

  const handleExport = () => {
    const data = {
      version: '1.0',
      meetingInfo,
      participants,
      seatingConfig, // Export seating config too
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    FileSaver.saveAs(blob, getSafeFileName('json'));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.meetingInfo && Array.isArray(json.participants)) {
          setMeetingInfo({
             ...json.meetingInfo,
             unitLabelType: json.meetingInfo.unitLabelType || 'unit' // backward compatibility
          });
          setParticipants(json.participants);
          if (json.seatingConfig) {
             setSeatingConfig(json.seatingConfig);
          }
          alert('資料匯入成功！');
        } else {
          alert('檔案格式錯誤');
        }
      } catch (err) {
        alert('無法解析檔案');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatTimeForDoc = (timeStr: string) => {
     if (!timeStr) return '';
     const date = new Date(timeStr);
     if (isNaN(date.getTime())) return timeStr;
     return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleExportDocx = () => {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, VerticalAlign, TextDirection } = docx;

    const unitHeaderLabel = meetingInfo.unitLabelType === 'unit' ? "單位" : "部門";
    const commonFont = "Microsoft JhengHei";

    // 1. Calculate Pagination (Same logic as SignInSheet.tsx)
    const minRows = ROWS_PER_PAGE;
    const totalRowsNeeded = Math.max(filteredParticipants.length + 3, minRows);
    const pageCount = Math.ceil(totalRowsNeeded / ROWS_PER_PAGE) || 1;

    const docChildren: any[] = [];

    // Loop through each page to generate identical layout
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const startIndex = pageIndex * ROWS_PER_PAGE;
        const pageParticipants = filteredParticipants.slice(startIndex, startIndex + ROWS_PER_PAGE);
        const emptyRowsCount = ROWS_PER_PAGE - pageParticipants.length;
        
        // --- Header Section (Titles) ---
        docChildren.push(
            new Paragraph({
                text: meetingInfo.mainTitle,
                heading: "Heading1",
                alignment: AlignmentType.CENTER,
                run: { font: commonFont, size: 32, bold: true }
            }),
            new Paragraph({
                text: meetingInfo.subTitle,
                heading: "Heading2",
                alignment: AlignmentType.CENTER,
                run: { font: commonFont, size: 28, bold: true }
            }),
            new Paragraph({
                text: meetingInfo.docName,
                heading: "Heading3",
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                run: { font: commonFont, size: 28, bold: true }
            }),
            new Paragraph({
                text: `主辦機關：${meetingInfo.organizer}`,
                alignment: AlignmentType.RIGHT,
                spacing: { after: 100 },
                run: { font: commonFont, size: 24 }
            })
        );

        // --- Info Table (Time, Place, Host, Recorder) ---
        // Formatting: Labels Centered, Values Left Aligned with Indent (to match UI)
        const infoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 8 }, // Thicker outer
                bottom: { style: BorderStyle.SINGLE, size: 8 },
                left: { style: BorderStyle.SINGLE, size: 8 },
                right: { style: BorderStyle.SINGLE, size: 8 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
                insideVertical: { style: BorderStyle.SINGLE, size: 2 },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ 
                            children: [new Paragraph({ text: "時 間", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], 
                            width: { size: 15, type: WidthType.PERCENTAGE }, 
                            shading: { fill: "F3F4F6" },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: formatTimeForDoc(meetingInfo.time), alignment: AlignmentType.LEFT, indent: { left: 100 }, run: { font: commonFont } })], 
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: "地 點", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], 
                            width: { size: 15, type: WidthType.PERCENTAGE }, 
                            shading: { fill: "F3F4F6" },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: meetingInfo.location, alignment: AlignmentType.LEFT, indent: { left: 100 }, run: { font: commonFont } })], 
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ 
                            children: [new Paragraph({ text: "主 持 人", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], 
                            width: { size: 15, type: WidthType.PERCENTAGE }, 
                            shading: { fill: "F3F4F6" },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: meetingInfo.chairperson, alignment: AlignmentType.LEFT, indent: { left: 100 }, run: { font: commonFont } })], 
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: "紀 錄", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], 
                            width: { size: 15, type: WidthType.PERCENTAGE }, 
                            shading: { fill: "F3F4F6" },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                        new TableCell({ 
                            children: [new Paragraph({ text: meetingInfo.recorder, alignment: AlignmentType.LEFT, indent: { left: 100 }, run: { font: commonFont } })], 
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER 
                        }),
                    ]
                })
            ]
        });
        docChildren.push(infoTable);

        // --- Participant Table Rows Construction ---
        // Header Row
        const participantRows: docx.TableRow[] = [
            new TableRow({
                children: [
                    // Corner cell (Top of Sidebar)
                    new TableCell({ 
                        children: [], 
                        width: { size: 5, type: WidthType.PERCENTAGE },
                        shading: { fill: "F3F4F6" }
                    }),
                    new TableCell({ children: [new Paragraph({ text: unitHeaderLabel, alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ text: "職 稱", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ text: "簽 名", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } }), new Paragraph({ text: "(請以正楷書寫，以利辨識)", alignment: AlignmentType.CENTER, run: { font: commonFont, size: 16 } })], width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" }, verticalAlign: VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ text: "備 註", alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" }, verticalAlign: VerticalAlign.CENTER }),
                ]
            })
        ];

        // Data Rows + Empty Rows
        // We need 10 rows total.
        const rowsForThisPage = [...pageParticipants];
        for (let i = 0; i < emptyRowsCount; i++) {
            rowsForThisPage.push({ id: `empty-${i}`, unit: '', title: '', name: '', note: '', dietary: 'meat' });
        }

        rowsForThisPage.forEach((p, idx) => {
            let note = p.note;
            if (meetingInfo.showDietary && p.dietary === 'vegetarian') {
                note += (note ? ' ' : '') + '(素)';
            }

            // For the first row of data, we start the vertical merge for the sidebar
            // For subsequent rows, we continue the merge.
            const isFirstDataRow = idx === 0;

            const cells = [
                // Sidebar Column
                new TableCell({
                    children: isFirstDataRow ? [new Paragraph({ 
                        text: "出席人員", 
                        alignment: AlignmentType.CENTER,
                        run: { font: commonFont, bold: true, size: 28 } 
                    })] : [],
                    verticalMerge: isFirstDataRow ? docx.VerticalMergeType.RESTART : docx.VerticalMergeType.CONTINUE,
                    textDirection: docx.TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT, // Vertical Text
                    verticalAlign: VerticalAlign.CENTER,
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    shading: { fill: "F3F4F6" }
                }),
                // Unit (Center)
                new TableCell({ children: [new Paragraph({ text: p.unit, alignment: AlignmentType.CENTER, run: { font: commonFont } })], verticalAlign: VerticalAlign.CENTER }),
                // Title (Center)
                new TableCell({ children: [new Paragraph({ text: p.title, alignment: AlignmentType.CENTER, run: { font: commonFont } })], verticalAlign: VerticalAlign.CENTER }),
                // Name (Left Aligned with Indent to match UI)
                new TableCell({ 
                    children: [new Paragraph({ text: p.name, alignment: AlignmentType.LEFT, indent: { left: 200 }, run: { font: commonFont, size: 24 } })], 
                    verticalAlign: VerticalAlign.CENTER 
                }),
                // Note (Center)
                new TableCell({ children: [new Paragraph({ text: note, alignment: AlignmentType.CENTER, run: { font: commonFont } })], verticalAlign: VerticalAlign.CENTER }),
            ];

            participantRows.push(new TableRow({
                height: { value: 900, rule: docx.HeightRule.AT_LEAST }, // Approx 1.5cm-2cm
                children: cells
            }));
        });

        const mainTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: participantRows,
            borders: {
                top: { style: BorderStyle.NONE, size: 0 }, 
                bottom: { style: BorderStyle.SINGLE, size: 8 },
                left: { style: BorderStyle.SINGLE, size: 8 },
                right: { style: BorderStyle.SINGLE, size: 8 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
                insideVertical: { style: BorderStyle.SINGLE, size: 2 },
            }
        });
        docChildren.push(mainTable);

        // Footer / Stats
        if (pageIndex === pageCount - 1 && meetingInfo.showDietary) {
             const vegCount = filteredParticipants.filter(p => p.dietary === 'vegetarian').length;
             const meatCount = filteredParticipants.length - vegCount;
             // Add a stats table attached to the bottom
             docChildren.push(new Table({
                 width: { size: 100, type: WidthType.PERCENTAGE },
                 borders: {
                     top: { style: BorderStyle.NONE, size: 0 },
                     bottom: { style: BorderStyle.SINGLE, size: 8 },
                     left: { style: BorderStyle.SINGLE, size: 8 },
                     right: { style: BorderStyle.SINGLE, size: 8 },
                 },
                 rows: [
                     new TableRow({
                         children: [
                             new TableCell({
                                 children: [new Paragraph({ text: `統計：葷 ${meatCount} 人，素 ${vegCount} 人`, alignment: AlignmentType.RIGHT, run: { font: commonFont } })],
                                 borders: { top: { style: BorderStyle.SINGLE, size: 2 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }
                             })
                         ]
                     })
                 ]
             }));
        }

        // Page Number
        docChildren.push(new Paragraph({
            text: `第 ${pageIndex + 1} 頁 / 共 ${pageCount} 頁`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            run: { font: commonFont, size: 20, color: "666666" }
        }));

        // Add Page Break if not the last page
        if (pageIndex < pageCount - 1) {
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
    }

    // --- Seating Chart Section ---
    // Add a page break before seating chart
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    
    // Seating Chart Title
    docChildren.push(new Paragraph({ text: "座位表", heading: "Heading1", alignment: AlignmentType.CENTER, spacing: { after: 400 }, run: { font: commonFont, bold: true, size: 32 } }));
    
    // Stage
    docChildren.push(new Table({
         width: { size: 60, type: WidthType.PERCENTAGE },
         alignment: AlignmentType.CENTER,
         rows: [
            new TableRow({
               children: [new TableCell({ 
                  children: [new Paragraph({ text: "投影幕 / 講台", alignment: AlignmentType.CENTER, style: "strong", run: { font: commonFont } })],
                  shading: { fill: "D9D9D9" },
                  borders: { bottom: { style: BorderStyle.THICK, size: 12 } }
               })]
            })
         ]
    }));
    docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer

    // Seating Grid
    const seatRows: docx.TableRow[] = [];
    const seatMap = new Map<string, typeof seatingConfig.seats[0]>();
    seatingConfig.seats.forEach(s => seatMap.set(`${s.row}-${s.col}`, s));

    for(let r = 0; r < seatingConfig.rows; r++) {
       const cells: docx.TableCell[] = [];
       for(let c = 0; c < seatingConfig.cols; c++) {
          const seat = seatMap.get(`${r}-${c}`);
          let cellContent: docx.Paragraph[] = [];
          let cellBorders = {};
          let cellShading = {};

          if (seat && seat.isActive) {
             const occupant = participants.find(p => p.id === seat.participantId);
             
             if (seat.type === 'console') {
                cellShading = { fill: "F3E5F5" }; 
             } else if (occupant) {
                cellShading = { fill: "E3F2FD" };
             }

             if (occupant) {
                cellContent = [
                   new Paragraph({ text: occupant.name, alignment: AlignmentType.CENTER, run: { font: commonFont, bold: true } }),
                   new Paragraph({ text: occupant.title, alignment: AlignmentType.CENTER, run: { font: commonFont, size: 18 } })
                ];
             } else if (seat.type === 'console') {
                cellContent = [new Paragraph({ text: "控制桌", alignment: AlignmentType.CENTER, run: { font: commonFont, size: 16 } })];
             }
             
             cellBorders = {
                top: { style: BorderStyle.SINGLE, size: 2 },
                bottom: { style: BorderStyle.SINGLE, size: 2 },
                left: { style: BorderStyle.SINGLE, size: 2 },
                right: { style: BorderStyle.SINGLE, size: 2 },
             };
          } else {
             cellBorders = {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
             };
          }

          cells.push(new TableCell({
             children: cellContent,
             borders: cellBorders,
             shading: cellShading,
             verticalAlign: VerticalAlign.CENTER,
             height: { value: 1000, rule: "atLeast" }
          }));
       }
       seatRows.push(new TableRow({ children: cells }));
    }

    docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: seatRows
    }));


    // Generate Doc
    const doc = new Document({
      sections: [{ children: docChildren }],
    });

    Packer.toBlob(doc).then((blob) => {
      FileSaver.saveAs(blob, getSafeFileName('docx'));
    });
  };

  const unitLabel = meetingInfo.unitLabelType === 'unit' ? '單位' : '部門';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar - Hidden when printing */}
      <nav className="bg-slate-900 text-white p-4 shadow-md print:hidden flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold">會議管理系統</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Global Actions */}
           <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-4">
               <button 
                onClick={handleExportDocx}
                className="flex items-center gap-1 text-slate-300 hover:text-white text-sm"
                title="匯出 Word (簽到冊+座位表)"
              >
                 <FileDown size={16} /> 匯出 Word
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-1 text-slate-300 hover:text-white text-sm"
                title="匯出 JSON 備份"
              >
                 <Download size={16} /> 儲存設定
              </button>
              <label className="flex items-center gap-1 text-slate-300 hover:text-white text-sm cursor-pointer" title="匯入 JSON 備份">
                 <Upload size={16} /> 讀取設定
                 <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
           </div>

           {/* Tab Navigation */}
           <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                activeTab === 'input' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-gray-300'
              }`}
            >
              <Info size={18} /> 資料輸入
            </button>
            <button
              onClick={() => setActiveTab('seats')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                activeTab === 'seats' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-gray-300'
              }`}
            >
              <LayoutGrid size={18} /> 座位表
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                activeTab === 'print' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-gray-300'
              }`}
            >
              <Printer size={18} /> 簽到冊預覽
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 overflow-auto">
        {activeTab === 'input' && (
          <div className="max-w-5xl mx-auto py-8 px-4">
             <InputForm 
               meetingInfo={meetingInfo} 
               setMeetingInfo={setMeetingInfo}
               participants={participants}
               setParticipants={setParticipants}
             />
          </div>
        )}

        {activeTab === 'print' && (
          <div className="w-full h-full flex flex-col">
            {/* Filter Toolbar for Print View */}
            <div className="bg-white border-b p-4 print:hidden sticky top-0 z-20 shadow-sm">
               <div className="max-w-4xl mx-auto flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <Filter size={18} />
                        篩選{unitLabel}：
                     </div>
                     <div className="text-sm text-gray-500">
                        (勾選的項目將會顯示於預覽及 Word 匯出檔)
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={selectedUnits.length === allUnits.length ? clearAllUnits : selectAllUnits}
                       className="px-3 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center gap-1 transition-colors"
                     >
                        {selectedUnits.length === allUnits.length ? <CheckSquare size={14}/> : <Square size={14}/>}
                        {selectedUnits.length === allUnits.length ? '取消全選' : '全選'}
                     </button>
                     {allUnits.map(unit => (
                        <button
                          key={unit}
                          onClick={() => toggleUnit(unit)}
                          className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${
                             selectedUnits.includes(unit) 
                               ? 'bg-blue-600 text-white border-blue-600' 
                               : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                           {unit}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-gray-800 text-white p-2 text-center text-sm print:hidden">
              提示：請使用瀏覽器列印功能 (Ctrl+P)，選擇 A4 紙張並勾選「背景圖形」以獲得最佳效果。
            </div>
            {/* Pass Filtered Participants */}
            <SignInSheet meetingInfo={meetingInfo} participants={filteredParticipants} />
          </div>
        )}

        {activeTab === 'seats' && (
          <SeatingChart 
             participants={participants} 
             config={seatingConfig}
             setConfig={setSeatingConfig}
          />
        )}
      </main>
    </div>
  );
};

export default App;