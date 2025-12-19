export interface Participant {
  id: string;
  unit: string; // 單位/部門
  title: string; // 職稱
  name: string; // 姓名
  note: string; // 備註
  dietary: 'meat' | 'vegetarian'; // 飲食習慣
}

export interface MeetingInfo {
  organizer: string; // 主辦機關
  mainTitle: string; // 主標題 (e.g. 淡水服務所...)
  subTitle: string; // 副標題 (e.g. 開工前協調...)
  docName: string; // 文件名稱 (e.g. 會議出席人員簽名冊)
  time: string; // 時間
  location: string; // 地點
  chairperson: string; // 主持人
  recorder: string; // 紀錄
  showDietary: boolean; // 是否顯示飲食習慣
  unitLabelType: 'unit' | 'department'; // 顯示「單位」或「部門」
}

export interface Seat {
  id: string;
  row: number;
  col: number;
  isActive: boolean; // Is this a valid seat or empty space?
  type: 'standard' | 'console'; // 座位類型：一般座位 | 電腦操作/控制桌
  participantId?: string | null;
}

export interface SeatingConfig {
  rows: number;
  cols: number;
  seats: Seat[];
}