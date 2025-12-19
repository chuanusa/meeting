import React, { useState } from 'react';
import { Plus, Trash2, Users, FileText, Upload, X, Lock, Unlock, Utensils, Leaf, Calendar, MapPin, User, PenTool, Building2, AlignLeft, Briefcase } from 'lucide-react';
import { MeetingInfo, Participant } from '../types';

interface InputFormProps {
  meetingInfo: MeetingInfo;
  setMeetingInfo: (info: MeetingInfo) => void;
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
}

const InputForm: React.FC<InputFormProps> = ({
  meetingInfo,
  setMeetingInfo,
  participants,
  setParticipants,
}) => {
  const [newParticipant, setNewParticipant] = useState<Omit<Participant, 'id'>>({
    unit: '',
    title: '',
    name: '',
    note: '',
    dietary: 'meat',
  });
  
  // State for Unit Lock
  const [isUnitLocked, setIsUnitLocked] = useState(true);
  
  // State for Bulk Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMeetingInfo({ ...meetingInfo, [name]: value });
  };

  const addParticipant = () => {
    if (!newParticipant.name) return;
    setParticipants([
      ...participants,
      { ...newParticipant, id: crypto.randomUUID() },
    ]);
    
    // Logic: Keep unit if locked, otherwise clear
    setNewParticipant({ 
      unit: isUnitLocked ? newParticipant.unit : '', 
      title: '', 
      name: '', 
      note: '',
      dietary: 'meat' 
    });
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addParticipant();
    }
  };

  const handleBulkImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n');
    const newItems: Participant[] = [];

    lines.forEach(line => {
      const parts = line.split(/[\t,]+/).map(s => s.trim()).filter(Boolean);
      
      if (parts.length >= 2) {
         let unit = '', title = '', name = '', note = '';
         
         if (parts.length === 2) {
           [unit, name] = parts;
         } else if (parts.length === 3) {
           [unit, title, name] = parts;
         } else {
           [unit, title, name, note] = parts;
         }

         if (name) {
           newItems.push({
             id: crypto.randomUUID(),
             unit,
             title,
             name,
             note: note || '',
             dietary: 'meat'
           });
         }
      }
    });

    setParticipants([...participants, ...newItems]);
    setImportText('');
    setIsImportModalOpen(false);
  };

  // Stats
  const vegCount = participants.filter(p => p.dietary === 'vegetarian').length;
  const meatCount = participants.length - vegCount;

  // Labels based on settings
  const unitLabel = meetingInfo.unitLabelType === 'unit' ? '單位' : '部門';

  // Common Input Class
  const inputClass = "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title Datalist */}
      <datalist id="title-options">
        <option value="處長" />
        <option value="副處長" />
        <option value="經理" />
        <option value="課長" />
        <option value="專員" />
        <option value="主辦" />
        <option value="工程師" />
      </datalist>

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Upload className="w-5 h-5 text-blue-600" /> 批次匯入人員
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-auto">
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                請將 Excel 或文字資料貼入下方。格式建議為：<br/>
                <span className="font-mono bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100">{unitLabel} 職稱 姓名 備註</span> (使用 Tab 或逗號分隔)
              </p>
              <textarea
                className="w-full h-64 p-4 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 resize-none"
                placeholder={`範例：
綜合施工處	副處長	張維鈞
旺邦營造	經理	王大明	列席
...`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleBulkImport}
                className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
              >
                確認匯入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Info Card */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-3 text-blue-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold">會議資訊設定</h2>
           </div>
           
           {/* Settings Toggles */}
           <div className="flex items-center gap-3">
             <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 h-9">
                <label className="text-xs font-medium text-gray-500 px-2">欄位顯示</label>
                <select 
                  name="unitLabelType"
                  value={meetingInfo.unitLabelType}
                  onChange={handleInfoChange}
                  className="bg-white text-xs font-bold text-gray-700 focus:outline-none cursor-pointer py-1 px-2 rounded border border-gray-200 shadow-sm h-full"
                >
                  <option value="unit">單位</option>
                  <option value="department">部門</option>
                </select>
             </div>
             
             <label className={`flex items-center gap-2 cursor-pointer select-none text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors h-9 ${meetingInfo.showDietary ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                <input 
                  type="checkbox" 
                  checked={meetingInfo.showDietary}
                  onChange={(e) => setMeetingInfo({...meetingInfo, showDietary: e.target.checked})}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Utensils size={14} /> 飲食調查
             </label>
           </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Info Group */}
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={labelClass}><AlignLeft size={14}/> 主標題</label>
                <input
                  type="text"
                  name="mainTitle"
                  value={meetingInfo.mainTitle}
                  onChange={handleInfoChange}
                  className={`${inputClass} font-medium text-gray-900`}
                  placeholder="例如：「淡水服務所及區域巡修中心新建工程」"
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}><AlignLeft size={14}/> 副標題</label>
                <input
                  type="text"
                  name="subTitle"
                  value={meetingInfo.subTitle}
                  onChange={handleInfoChange}
                  className={inputClass}
                  placeholder="例如：開工前協調暨工安、環保宣導"
                />
              </div>
              <div>
                <label className={labelClass}><Building2 size={14}/> 主辦機關</label>
                <input
                  type="text"
                  name="organizer"
                  value={meetingInfo.organizer}
                  onChange={handleInfoChange}
                  className={inputClass}
                  placeholder="例如：綜合施工處"
                />
              </div>
              <div>
                <label className={labelClass}><FileText size={14}/> 文件名稱</label>
                <input
                  type="text"
                  name="docName"
                  value={meetingInfo.docName}
                  onChange={handleInfoChange}
                  className={inputClass}
                  placeholder="例如：會議出席人員簽名冊"
                />
              </div>
          </div>

          {/* Logistics Group */}
          <div className="md:col-span-4 bg-gray-50/50 rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className={labelClass}><Calendar size={14}/> 時間</label>
                <input
                  type="datetime-local"
                  name="time"
                  value={meetingInfo.time}
                  onChange={handleInfoChange}
                  className={`${inputClass} bg-white`}
                />
              </div>
              <div>
                <label className={labelClass}><MapPin size={14}/> 地點</label>
                <input
                  list="location-options"
                  type="text"
                  name="location"
                  value={meetingInfo.location}
                  onChange={handleInfoChange}
                  className={`${inputClass} bg-white`}
                  placeholder="可選取或自行輸入"
                />
                <datalist id="location-options">
                   <option value="處本部8樓會議室" />
                   <option value="處本部7樓會議室" />
                   <option value="1樓會議室" />
                   <option value="線上會議" />
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}><User size={14}/> 主持人</label>
                    <input
                      type="text"
                      name="chairperson"
                      value={meetingInfo.chairperson}
                      onChange={handleInfoChange}
                      className={`${inputClass} bg-white`}
                    />
                </div>
                <div>
                    <label className={labelClass}><PenTool size={14}/> 紀錄</label>
                    <input
                      type="text"
                      name="recorder"
                      value={meetingInfo.recorder}
                      onChange={handleInfoChange}
                      className={`${inputClass} bg-white`}
                    />
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Participants Card */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-blue-800">
            <div className="p-2 bg-blue-100 rounded-lg">
               <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold">參加人員名單 <span className="text-sm font-normal text-gray-500 ml-1">({participants.length}人)</span></h2>
          </div>
          
          <div className="flex items-center gap-3">
            {meetingInfo.showDietary && (
              <div className="flex gap-4 text-xs font-medium bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                 <div className="flex items-center gap-1.5 text-gray-700">
                   <div className="w-2 h-2 rounded-full bg-gray-400"></div> 葷: <span className="text-base">{meatCount}</span>
                 </div>
                 <div className="w-px bg-gray-300"></div>
                 <div className="flex items-center gap-1.5 text-green-700">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div> 素: <span className="text-base">{vegCount}</span>
                 </div>
              </div>
            )}
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="text-sm font-medium flex items-center gap-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Upload className="w-4 h-4" /> 批次匯入
            </button>
            <button 
               onClick={() => setParticipants([])}
               className="text-sm font-medium flex items-center gap-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" /> 清空
            </button>
          </div>
        </div>

        {/* Input Row (Floating Card style) */}
        <div className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100/50">
           <div className="grid grid-cols-12 gap-3 items-end">
             {/* Unit Input */}
             <div className="col-span-12 sm:col-span-3 lg:col-span-2 relative group">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-blue-800 flex items-center gap-1">
                    <Building2 size={12}/> {unitLabel}
                  </label>
                  <button 
                    onClick={() => setIsUnitLocked(!isUnitLocked)}
                    className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${isUnitLocked ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-200'}`}
                    title={isUnitLocked ? `新增後保留${unitLabel}` : "新增後清空"}
                  >
                    {isUnitLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    {isUnitLocked ? '鎖定' : '解鎖'}
                  </button>
                </div>
                <input
                  placeholder={unitLabel}
                  className={`${inputClass} ${isUnitLocked ? 'bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-200' : 'bg-white'}`}
                  value={newParticipant.unit}
                  onChange={(e) => setNewParticipant({...newParticipant, unit: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Title Input */}
              <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                <label className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><Briefcase size={12}/> 職稱</label>
                <input
                  list="title-options"
                  placeholder="職稱"
                  className={`${inputClass} bg-white`}
                  value={newParticipant.title}
                  onChange={(e) => setNewParticipant({...newParticipant, title: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Name Input */}
              <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                <label className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><User size={12}/> 姓名*</label>
                <input
                  placeholder="姓名"
                  className={`${inputClass} bg-white`}
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Dietary Input */}
              {meetingInfo.showDietary && (
                <div className="col-span-4 sm:col-span-3 lg:col-span-2">
                   <label className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><Utensils size={12}/> 飲食</label>
                   <select 
                      className={`${inputClass} bg-white appearance-none cursor-pointer`}
                      value={newParticipant.dietary}
                      onChange={(e) => setNewParticipant({...newParticipant, dietary: e.target.value as 'meat'|'vegetarian'})}
                   >
                      <option value="meat">葷食</option>
                      <option value="vegetarian">素食</option>
                   </select>
                </div>
              )}

              {/* Note Input */}
              <div className={`${meetingInfo.showDietary ? 'col-span-8 lg:col-span-3' : 'col-span-12 lg:col-span-5'}`}>
                 <label className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><PenTool size={12}/> 備註</label>
                <input
                  placeholder="備註事項..."
                  className={`${inputClass} bg-white`}
                  value={newParticipant.note}
                  onChange={(e) => setNewParticipant({...newParticipant, note: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Add Button */}
              <div className="col-span-12 sm:col-span-1 lg:col-span-1">
                <button
                  onClick={addParticipant}
                  disabled={!newParticipant.name}
                  className="w-full h-[42px] flex items-center justify-center gap-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200"
                  title="新增人員 (Enter)"
                >
                  <Plus className="w-5 h-5" />
                  <span className="sm:hidden lg:hidden">新增</span>
                </button>
              </div>
           </div>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-[20%]">{unitLabel}</th>
                <th className="px-6 py-4 w-[15%]">職稱</th>
                <th className="px-6 py-4 w-[15%]">姓名</th>
                {meetingInfo.showDietary && <th className="px-6 py-4 w-[15%]">飲食</th>}
                <th className="px-6 py-4 w-[25%]">備註</th>
                <th className="px-6 py-4 w-10 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {participants.length === 0 ? (
                 <tr>
                   <td colSpan={meetingInfo.showDietary ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center gap-2">
                        <Users size={48} className="text-gray-200" />
                        <p>尚未新增參加人員</p>
                        <p className="text-xs">請上方輸入資料後點擊「+」新增，或使用批次匯入</p>
                     </div>
                   </td>
                 </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-2">
                      <input 
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all text-gray-700"
                        value={p.unit}
                        onChange={(e) => updateParticipant(p.id, 'unit', e.target.value)}
                        placeholder={unitLabel}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        list="title-options"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all text-gray-700"
                        value={p.title}
                        onChange={(e) => updateParticipant(p.id, 'title', e.target.value)}
                        placeholder="職稱"
                      />
                    </td>
                    <td className="px-4 py-2">
                       <input 
                        className="w-full px-2 py-1.5 font-bold bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all text-gray-900"
                        value={p.name}
                        onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                      />
                    </td>
                    {meetingInfo.showDietary && (
                      <td className="px-4 py-2">
                         <button
                           onClick={() => updateParticipant(p.id, 'dietary', p.dietary === 'meat' ? 'vegetarian' : 'meat')}
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                             p.dietary === 'vegetarian' 
                               ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                               : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                           }`}
                         >
                           {p.dietary === 'vegetarian' ? <Leaf size={12} /> : <Utensils size={12} />}
                           {p.dietary === 'vegetarian' ? '素食' : '葷食'}
                         </button>
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <input 
                        className="w-full px-2 py-1.5 text-gray-500 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all"
                        value={p.note}
                        onChange={(e) => updateParticipant(p.id, 'note', e.target.value)}
                        placeholder="備註..."
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default InputForm;