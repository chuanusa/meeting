import React, { useState } from 'react';
import { Participant, Seat, SeatingConfig } from '../types';
import { Grid, Eraser, Monitor, UserCheck, LayoutTemplate, Laptop, Download, Upload } from 'lucide-react';

interface SeatingChartProps {
  participants: Participant[];
  config: SeatingConfig;
  setConfig: (config: SeatingConfig) => void;
}

const SeatingChart: React.FC<SeatingChartProps> = ({ participants, config, setConfig }) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [mode, setMode] = useState<'assign' | 'layout'>('assign');
  const [layoutTool, setLayoutTool] = useState<'toggle' | 'console'>('toggle');

  const handleSeatClick = (seatId: string) => {
    const seatIndex = config.seats.findIndex(s => s.id === seatId);
    if (seatIndex === -1) return;

    const newSeats = [...config.seats];
    const seat = newSeats[seatIndex];

    if (mode === 'layout') {
      if (layoutTool === 'console') {
         // Toggle console type
         seat.type = seat.type === 'console' ? 'standard' : 'console';
         // Ensure it's active if setting to console
         if (seat.type === 'console') seat.isActive = true;
      } else {
         // Default toggle active/inactive
         seat.isActive = !seat.isActive;
         // If disabling, remove occupant and reset type
         if (!seat.isActive) {
           seat.participantId = null;
           seat.type = 'standard';
         }
      }
    } else {
      // Assign mode
      if (!seat.isActive) return;

      if (selectedParticipantId) {
        // 1. Remove selected user from any other seat
        newSeats.forEach(s => {
          if (s.participantId === selectedParticipantId) s.participantId = null;
        });

        // 2. Place in new seat
        seat.participantId = selectedParticipantId;
        setSelectedParticipantId(null); 
      } else {
        // If no user selected, clicking a seated seat unseats them
        if (seat.participantId) {
          seat.participantId = null;
        }
      }
    }
    setConfig({ ...config, seats: newSeats });
  };

  const resizeGrid = (rows: number, cols: number) => {
    const newSeats: Seat[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const existing = config.seats.find(s => s.row === r && s.col === c);
        newSeats.push(existing || {
          id: `seat-${r}-${c}`,
          row: r,
          col: c,
          isActive: true,
          type: 'standard',
          participantId: null,
        });
      }
    }
    setConfig({ rows, cols, seats: newSeats });
  };

  const applyTemplate = (type: string) => {
    const newSeats = config.seats.map(seat => {
      const { row: r, col: c } = seat;
      const { rows, cols } = config;
      let isActive = true;

      switch(type) {
        case 'full':
          isActive = true;
          break;
        case 'u_single':
          isActive = (c === 0) || (c === cols - 1) || (r === rows - 1);
          break;
        case 'u_double':
          isActive = (c < 2) || (c >= cols - 2) || (r >= rows - 2);
          break;
        case 'classroom':
          const mid = Math.floor(cols / 2);
          const isAisle = (cols % 2 === 0) ? (c === mid || c === mid - 1) : (c === mid);
          isActive = !isAisle;
          break;
        case 'hollow':
          isActive = (r === 0) || (r === rows - 1) || (c === 0) || (c === cols - 1);
          break;
        default:
          isActive = true;
      }
      
      return { 
        ...seat, 
        isActive, 
        type: 'standard' as const, // Reset special types on template change
        participantId: isActive ? seat.participantId : null 
      };
    });
    
    setConfig({ ...config, seats: newSeats });
  };

  const handleExportLayout = () => {
    const layoutData = {
      type: 'seating-layout',
      rows: config.rows,
      cols: config.cols,
      seats: config.seats.map(s => ({
         id: s.id, row: s.row, col: s.col, isActive: s.isActive, type: s.type
         // Do not export participantId
      }))
    };
    
    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-config-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (event) => {
       try {
         const json = JSON.parse(event.target?.result as string);
         if (json.type === 'seating-layout' && json.rows && json.seats) {
           // Restore layout
           setConfig({
             rows: json.rows,
             cols: json.cols,
             seats: json.seats.map((s: any) => ({
               ...s,
               participantId: null // Clear participants on layout import
             }))
           });
           alert('版型匯入成功！(已清除現有座位安排)');
         } else {
           alert('無效的版型檔案');
         }
       } catch (err) {
         alert('檔案解析錯誤');
       }
     };
     reader.readAsText(file);
     e.target.value = '';
  };

  const seatedIds = new Set(config.seats.map(s => s.participantId).filter(Boolean));
  const unseatedParticipants = participants.filter(p => !seatedIds.has(p.id));

  return (
    <div className="flex flex-col h-[calc(100vh-150px)]">
      {/* Toolbar */}
      <div className="bg-white p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <div className="flex bg-gray-100 rounded-lg p-1">
             <button
               onClick={() => setMode('assign')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'assign' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <UserCheck size={16} /> 排列座位 (Assign)
             </button>
             <button
               onClick={() => setMode('layout')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'layout' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Grid size={16} /> 場地配置 (Layout)
             </button>
           </div>
        </div>

        {mode === 'layout' && (
          <div className="flex items-center gap-4 text-sm bg-gray-50 p-2 rounded-lg border border-gray-200 flex-wrap">
             <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
               <span className="font-semibold text-gray-700">工具:</span>
               <button 
                 onClick={() => setLayoutTool('toggle')}
                 className={`flex items-center gap-1 px-2 py-1 rounded ${layoutTool === 'toggle' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                 title="點擊切換座位有無"
               >
                 <Grid size={14} /> 一般座位/空地
               </button>
               <button 
                 onClick={() => setLayoutTool('console')}
                 className={`flex items-center gap-1 px-2 py-1 rounded ${layoutTool === 'console' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}
                 title="點擊設定為電腦操作位置"
               >
                 <Laptop size={14} /> 電腦/控制桌
               </button>
             </div>

             <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-700">快速版型:</span>
                <select 
                  className="border rounded p-1 text-sm bg-white"
                  onChange={(e) => applyTemplate(e.target.value)}
                  defaultValue="default"
                >
                  <option value="default" disabled>選擇版型...</option>
                  <option value="full">全滿 (Grid)</option>
                  <option value="u_single">ㄇ字型/U型 (單排)</option>
                  <option value="u_double">ㄇ字型/U型 (雙排)</option>
                  <option value="hollow">回字型 (Hollow)</option>
                  <option value="classroom">教室型 (中間走道)</option>
                </select>
             </div>
             
             <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
               <label>列:</label>
               <input 
                 type="number" min="3" max="15" 
                 value={config.rows} 
                 onChange={(e) => resizeGrid(parseInt(e.target.value) || 1, config.cols)}
                 className="w-12 border rounded p-1"
               />
               <label>行:</label>
               <input 
                 type="number" min="3" max="15" 
                 value={config.cols} 
                 onChange={(e) => resizeGrid(config.rows, parseInt(e.target.value) || 1)}
                 className="w-12 border rounded p-1"
               />
             </div>

             {/* Layout Export/Import */}
             <div className="flex items-center gap-2">
                <button onClick={handleExportLayout} className="text-gray-500 hover:text-blue-600" title="匯出版型">
                   <Download size={16} />
                </button>
                <label className="text-gray-500 hover:text-blue-600 cursor-pointer" title="匯入版型">
                   <Upload size={16} />
                   <input type="file" accept=".json" onChange={handleImportLayout} className="hidden" />
                </label>
             </div>
          </div>
        )}
        
        {mode === 'assign' && (
           <div className="text-sm text-gray-600">
              {selectedParticipantId 
                ? <span className="text-blue-600 font-bold animate-pulse">請點擊座位入座...</span> 
                : <span>1. 點選左側人員 2. 點擊座位</span>
              }
           </div>
        )}
        
        <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-black print:hidden">
            列印座位表
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Unseated List */}
        <div className={`w-64 bg-gray-50 border-r overflow-y-auto p-4 transition-all ${mode === 'layout' ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            未入座人員 ({unseatedParticipants.length})
          </h3>
          <div className="space-y-2">
            {unseatedParticipants.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedParticipantId(selectedParticipantId === p.id ? null : p.id)}
                className={`p-3 rounded border cursor-pointer transition-all select-none ${
                  selectedParticipantId === p.id 
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-800 flex justify-between">
                    {p.name}
                    {p.dietary === 'vegetarian' && <span className="text-green-600 text-xs flex items-center bg-green-50 px-1 rounded">素</span>}
                </div>
                <div className="text-xs text-gray-500">{p.title}</div>
              </div>
            ))}
            {unseatedParticipants.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                全員已入座
              </div>
            )}
          </div>
        </div>

        {/* Main Area: Stage & Grid */}
        <div className="flex-1 bg-gray-100 p-8 overflow-auto flex flex-col items-center">
          
          {/* Stage / Screen indicator */}
          <div className="w-2/3 h-12 bg-gray-300 rounded-lg mb-12 flex items-center justify-center text-gray-600 font-bold shadow-inner border-b-4 border-gray-400">
             <Monitor className="w-5 h-5 mr-2" /> 投影幕 / 講台 (Stage)
          </div>

          {/* Grid */}
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(80px, 1fr))`,
            }}
          >
            {config.seats.map((seat) => {
               const occupant = participants.find(p => p.id === seat.participantId);
               
               if (!seat.isActive && mode === 'assign') {
                 return <div key={seat.id} className="w-20 h-20" />; // Spacer
               }

               return (
                 <div
                   key={seat.id}
                   onClick={() => handleSeatClick(seat.id)}
                   className={`
                     relative w-24 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-center p-1 transition-all cursor-pointer shadow-sm
                     ${!seat.isActive && mode === 'layout' ? 'border-dashed border-gray-300 bg-transparent opacity-40 hover:opacity-100' : ''}
                     ${seat.isActive && mode === 'layout' && seat.type === 'standard' ? 'bg-white border-gray-400 hover:border-blue-500' : ''}
                     ${seat.isActive && mode === 'layout' && seat.type === 'console' ? 'bg-purple-50 border-purple-500 hover:border-purple-600' : ''}
                     
                     ${seat.isActive && mode === 'assign' ? 'bg-white hover:shadow-md' : ''}
                     ${seat.isActive && mode === 'assign' && selectedParticipantId ? 'hover:ring-2 ring-blue-400' : ''}
                     ${seat.isActive && seat.type === 'console' && mode === 'assign' ? 'bg-purple-50 border-purple-300' : ''}
                     
                     ${occupant ? 'border-blue-500 bg-blue-50' : (seat.type === 'standard' ? 'border-gray-300' : '')}
                   `}
                 >
                   {!seat.isActive ? (
                     <span className="text-xs text-gray-400">空地</span>
                   ) : (
                     <>
                        {/* Seat Type Label/Icon */}
                        {seat.type === 'console' && !occupant && (
                           <div className="text-purple-400 flex flex-col items-center">
                              <Laptop size={20} />
                              <span className="text-[10px] font-bold">電腦/控制</span>
                           </div>
                        )}

                        {occupant ? (
                          <>
                            <div className="font-bold text-blue-900 truncate w-full">{occupant.name}</div>
                            <div className="text-[10px] text-gray-500 truncate w-full">{occupant.title}</div>
                            {occupant.dietary === 'vegetarian' && (
                                <div className="absolute top-1 right-1 text-green-600" title="素食">
                                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            )}
                            {mode === 'assign' && (
                               <button 
                                 className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 hover:bg-red-200 print:hidden"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   // Manually unseat
                                   const newSeats = [...config.seats];
                                   const s = newSeats.find(x => x.id === seat.id);
                                   if(s) s.participantId = null;
                                   setConfig({...config, seats: newSeats});
                                 }}
                               >
                                 <Eraser size={12} />
                               </button>
                            )}
                          </>
                        ) : (
                          <>
                            {seat.type === 'standard' && <span className="text-gray-300 text-xs">空位</span>}
                          </>
                        )}
                     </>
                   )}
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingChart;