/**
 * Standardized icon mapping for Aarogya Care clinical departments.
 * Ensures consistent, valid Google Material Symbols are rendered and
 * prevents ligature fallbacks from printing raw text strings (e.g. HEARTPULSE, FLAME, BRAIN, BONE, BABY).
 */

const KNOWN_MATERIAL_SYMBOLS: Record<string, string> = {
  // Cardiology
  cardiology: 'cardiology',
  heartpulse: 'cardiology',
  heart: 'cardiology',
  cardio: 'cardiology',
  cardiac: 'cardiology',

  // Emergency & Trauma
  flame: 'emergency',
  emergency: 'emergency',
  trauma: 'emergency',
  resuscitation: 'emergency',

  // General Medicine & Diagnostics
  stethoscope: 'stethoscope',
  genmed: 'stethoscope',
  medicine: 'stethoscope',
  internal: 'stethoscope',

  // Neurology
  brain: 'neurology',
  neuro: 'neurology',
  neurology: 'neurology',
  stroke: 'neurology',

  // Orthopedics & Spine
  bone: 'orthopedics',
  ortho: 'orthopedics',
  orthopedics: 'orthopedics',
  joint: 'orthopedics',
  spine: 'orthopedics',

  // Pediatrics & Neonatology
  baby: 'child_care',
  pedia: 'child_care',
  pediatrics: 'child_care',
  child_care: 'child_care',
  maternity: 'child_care',
  nicu: 'child_care',

  // Gastroenterology & Hepatology
  gastro: 'gastroenterology',
  gastroenterology: 'gastroenterology',
  hepatology: 'gastroenterology',

  // Oncology
  oncology: 'coronavirus',
  cancer: 'coronavirus',

  // Ophthalmology
  eye: 'visibility',
  ophthalmology: 'visibility',

  // ENT
  ent: 'hearing',

  // Pulmonology
  pulmo: 'pulmonology',
  pulmonology: 'pulmonology',
  lungs: 'pulmonology'
};

/**
 * Returns a guaranteed valid Material Symbol identifier for a department.
 */
export function getDepartmentIcon(
  rawIcon?: string | null,
  deptName?: string | null,
  deptCode?: string | null
): string {
  // 1. Direct match on icon string
  if (rawIcon) {
    const cleanIcon = rawIcon.trim().toLowerCase();
    if (KNOWN_MATERIAL_SYMBOLS[cleanIcon]) {
      return KNOWN_MATERIAL_SYMBOLS[cleanIcon];
    }
  }

  // 2. Match on department code
  if (deptCode) {
    const cleanCode = deptCode.trim().toLowerCase();
    if (KNOWN_MATERIAL_SYMBOLS[cleanCode]) {
      return KNOWN_MATERIAL_SYMBOLS[cleanCode];
    }
  }

  // 3. Substring match on department name
  if (deptName) {
    const cleanName = deptName.toLowerCase();
    for (const [key, symbol] of Object.entries(KNOWN_MATERIAL_SYMBOLS)) {
      if (cleanName.includes(key)) {
        return symbol;
      }
    }
  }

  // 4. Safe fallback
  return 'local_hospital';
}
