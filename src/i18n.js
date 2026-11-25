// Chinese display layer. The English names in CATALOG stay untouched: they are the internal keys used by the
// demo, the voice parser and the tests. Everything the visitor sees goes through the helpers below.
import { LABEL_ZH, INFO_ZH } from './i18n-data.js';

export const CATEGORY_ZH = {
  Wonders: '世界奇观',
  Anatomy: '人体解剖',
  Biology: '生命科学',
  Engines: '发动机',
  Vehicles: '交通工具',
  Machines: '机械装置',
};

export const MODELS_ZH = {
  'Turtle Tower': { name: '龟塔', fact: '河内还剑湖 · 塔高 8.5 米' },
  'Eiffel Tower': { name: '埃菲尔铁塔', fact: '巴黎 · 高 330 米 · 底座 125 米' },
  'Statue of Liberty': { name: '自由女神像', fact: '纽约 · 从地面到火炬 93 米' },
  'Burj Khalifa': { name: '哈利法塔', fact: '迪拜 · 高 828 米 · Y 形平面，27 处退台' },
  'Great Pyramid': { name: '大金字塔', fact: '吉萨 · 高 146.6 米 · 底座 230.3 米' },
  'Colosseum': { name: '罗马斗兽场', fact: '罗马 · 189 × 156 米 · 高 48.5 米' },
  'Leaning Tower of Pisa': { name: '比萨斜塔', fact: '比萨 · 高 56.7 米 · 倾斜 3.97°' },
  'Taj Mahal': { name: '泰姬陵', fact: '阿格拉 · 高 73 米，立于 95 米见方的台基' },
  'Big Ben': { name: '大本钟', fact: '伦敦 · 高 96 米 · 表盘直径 7 米' },
  'Christ the Redeemer': { name: '救世基督像', fact: '里约 · 像高 30 米 · 臂展 28 米' },
  'Sydney Opera House': { name: '悉尼歌剧院', fact: '悉尼 · 壳顶最高 67 米' },
  'Human Brain': { name: '人类大脑', fact: '约 860 亿个神经元 · 1.4 千克 · 消耗全身 20% 的能量' },
  'Human Heart': { name: '人类心脏', fact: '4 个腔室 · 4 组瓣膜 · 每天泵血约 7,000 升' },
  'Kidney': { name: '肾脏', fact: '长 12 厘米 · 每天过滤约 180 升血浆' },
  'Lungs': { name: '肺', fact: '约 4.8 亿个肺泡 · 70 平方米气体交换面积' },
  'Human Eye': { name: '人眼', fact: '直径 24 毫米 · 1.2 亿个视杆细胞 · 600 万个视锥细胞' },
  'Human Ear': { name: '人耳', fact: '可听 20–20,000 赫兹 · 人体最小的骨头就在这里' },
  'Tooth (Molar)': { name: '臼齿', fact: '牙釉质、牙本质、牙髓 · 由两个牙根固定' },
  'Skull': { name: '头骨', fact: '22 块骨 · 只有下颌能活动' },
  'Skeleton': { name: '人体骨骼', fact: '206 块骨 · 股骨是最长的一块' },
  'Human Body': { name: '人体', fact: '11 个器官系统 · 37 万亿个细胞' },
  'DNA Double Helix': { name: 'DNA 双螺旋', fact: '30 亿个碱基对 · 每个细胞里约 2 米长 · A-T、G-C 配对' },
  'Animal Cell': { name: '动物细胞', fact: '直径约 20 微米 · 人体约有 37 万亿个' },
  'Inline-4 Engine': { name: '直列四缸发动机', fact: '双顶置凸轮轴 16 气门 · 4 个气缸 · 点火顺序 1-3-4-2' },
  'Supercharged HEMI V8': { name: '机械增压 HEMI V8', fact: '90° V8 · 推杆式 OHV · 半球形燃烧室' },
  'Turbofan Jet Engine': { name: '涡扇喷气发动机', fact: '风扇 → 压气机 → 燃烧室 → 涡轮 → 尾喷口' },
  'Radial Aircraft Engine': { name: '星形航空发动机', fact: '9 个气缸 · 主连杆与副连杆 · 风冷' },
  'Sports Car': { name: '跑车', fact: '440 × 185 × 130 厘米 · 轴距 260 厘米 · 前置发动机、后轮驱动' },
  'Motorcycle': { name: '摩托车', fact: '车长 210 厘米 · V 型双缸 · 链条传动' },
  'Airliner': { name: '客机', fact: '机长 37.6 米 · 翼展 34 米 · 180 座' },
  'Saturn V Rocket': { name: '土星五号火箭', fact: '高 110 米 · 三级 · 把阿波罗送上月球' },
  'Mechanical Watch': { name: '机械腕表', fact: '表径 40 毫米 · 每小时 28,800 次摆频 · 动力储存约 40 小时' },
  'EV Battery Pack': { name: '电动车电池包', fact: '8 个模组 · 280 个电芯 · 约 400 伏' },
};

export const STATE_ZH = { idle: '待召唤', sphere: '汇聚中', formed: '已呈现', dissolve: '消散中' };
export const POSE_ZH = {
  open: ['✋', '张开手掌'],
  fist: ['✊', '握拳'],
  peace: ['✌', '剪刀手'],
  point: ['☝', '指向'],
  other: ['🤚', '挥动'],
  none: ['·', '未见手'],
  pinch: ['🤏', '捏合'],
};

export const categoryName = (c) => CATEGORY_ZH[c] || c;
export const modelName = (d) => MODELS_ZH[d?.name]?.name || d?.name || '';
export const modelFact = (d) => MODELS_ZH[d?.name]?.fact ?? d?.fact ?? '';
export const labelName = (L) => LABEL_ZH[L?.label] || L?.label || '';
export const labelInfo = (L) => INFO_ZH[L?.info] || L?.info || '';

/** Chinese spoken names -> internal model names. The full Chinese name is added automatically below. */
export const VOICE_ALIASES_ZH = {
  心脏: 'Human Heart', 心: 'Human Heart', 大脑: 'Human Brain', 脑: 'Human Brain',
  肾: 'Kidney', 肾脏: 'Kidney', 肺: 'Lungs', 眼睛: 'Human Eye', 眼: 'Human Eye',
  耳朵: 'Human Ear', 耳: 'Human Ear', 牙齿: 'Tooth (Molar)', 牙: 'Tooth (Molar)', 臼齿: 'Tooth (Molar)',
  头骨: 'Skull', 颅骨: 'Skull', 骨骼: 'Skeleton', 骨架: 'Skeleton', 人体: 'Human Body', 身体: 'Human Body',
  DNA: 'DNA Double Helix', 双螺旋: 'DNA Double Helix', 细胞: 'Animal Cell', 跑车: 'Sports Car', 汽车: 'Sports Car',
  摩托车: 'Motorcycle', 客机: 'Airliner', 飞机: 'Airliner', 涡扇: 'Turbofan Jet Engine', 喷气发动机: 'Turbofan Jet Engine',
  火箭: 'Saturn V Rocket', 土星五号: 'Saturn V Rocket', 手表: 'Mechanical Watch', 腕表: 'Mechanical Watch',
  电池: 'EV Battery Pack', 电池包: 'EV Battery Pack', V8: 'Supercharged HEMI V8', HEMI: 'Supercharged HEMI V8',
  发动机: 'Inline-4 Engine', 星形发动机: 'Radial Aircraft Engine', 埃菲尔铁塔: 'Eiffel Tower', 铁塔: 'Eiffel Tower',
  金字塔: 'Great Pyramid', 斗兽场: 'Colosseum', 比萨斜塔: 'Leaning Tower of Pisa', 斜塔: 'Leaning Tower of Pisa',
  泰姬陵: 'Taj Mahal', 大本钟: 'Big Ben', 自由女神: 'Statue of Liberty', 自由女神像: 'Statue of Liberty',
  哈利法塔: 'Burj Khalifa', 基督像: 'Christ the Redeemer', 歌剧院: 'Sydney Opera House', 龟塔: 'Turtle Tower',
};
for (const [en, v] of Object.entries(MODELS_ZH)) VOICE_ALIASES_ZH[v.name] = en;
