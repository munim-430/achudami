import { FieldBoundingBox, FieldValues, CalibrationPreset } from './types';
import { DEFAULT_INITIAL_BOXES, DEFAULT_INITIAL_VALUES } from './presets';

const STORAGE_KEY_BOXES = 'achudami_field_bounding_boxes_v1';
const STORAGE_KEY_VALUES = 'achudami_saved_field_values_v1';

export function loadSavedBoundingBoxes(): FieldBoundingBox[] {
  if (typeof window === 'undefined') {
    return DEFAULT_INITIAL_BOXES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BOXES);
    if (!raw) return DEFAULT_INITIAL_BOXES;
    const parsed = JSON.parse(raw) as FieldBoundingBox[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load bounding boxes from localStorage:', error);
  }
  return DEFAULT_INITIAL_BOXES;
}

export function saveBoundingBoxesToStorage(boxes: FieldBoundingBox[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_BOXES, JSON.stringify(boxes));
  } catch (error) {
    console.error('Failed to save bounding boxes to localStorage:', error);
  }
}

export function loadSavedFieldValues(): FieldValues {
  if (typeof window === 'undefined') {
    return DEFAULT_INITIAL_VALUES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_VALUES);
    if (!raw) return DEFAULT_INITIAL_VALUES;
    const parsed = JSON.parse(raw) as FieldValues;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load field values from localStorage:', error);
  }
  return DEFAULT_INITIAL_VALUES;
}

export function saveFieldValuesToStorage(values: FieldValues): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_VALUES, JSON.stringify(values));
  } catch (error) {
    console.error('Failed to save field values to localStorage:', error);
  }
}

export function resetStorageToDefaults(): {
  boxes: FieldBoundingBox[];
  values: FieldValues;
} {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY_BOXES);
    window.localStorage.removeItem(STORAGE_KEY_VALUES);
  }
  return {
    boxes: DEFAULT_INITIAL_BOXES,
    values: DEFAULT_INITIAL_VALUES,
  };
}

export function exportCalibrationAsJson(
  boxes: FieldBoundingBox[],
  values: FieldValues
): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      boxes,
      values,
    },
    null,
    2
  );
}

export function importCalibrationFromJson(jsonString: string): {
  boxes: FieldBoundingBox[];
  values?: FieldValues;
} | null {
  try {
    const data = JSON.parse(jsonString) as {
      boxes?: FieldBoundingBox[];
      values?: FieldValues;
    };
    if (data.boxes && Array.isArray(data.boxes)) {
      return {
        boxes: data.boxes,
        values: data.values,
      };
    }
  } catch (error) {
    console.error('Failed to import calibration JSON:', error);
  }
  return null;
}

// --- DOCUMENT TEMPLATE STORAGE ---
const STORAGE_KEY_TEMPLATES = 'achudami_custom_templates_v1';

export function loadCustomTemplates(): CalibrationPreset[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load custom templates from localStorage:', err);
  }
  return [];
}

export function saveCustomTemplate(template: CalibrationPreset): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomTemplates();
    const index = existing.findIndex((t) => t.id === template.id);
    const updated = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      existing[index] = updated;
    } else {
      existing.push(updated);
    }

    window.localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save custom template to localStorage:', err);
  }
}

export function deleteCustomTemplate(templateId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomTemplates();
    const filtered = existing.filter((t) => t.id !== templateId);
    window.localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom template from localStorage:', err);
  }
}

export function exportTemplateAsJson(template: CalibrationPreset): string {
  return JSON.stringify(
    {
      app: 'achudami',
      format: 'achudami-template-v1',
      exportedAt: new Date().toISOString(),
      template,
    },
    null,
    2
  );
}

export function importTemplateFromJson(jsonString: string): CalibrationPreset | null {
  try {
    const data = JSON.parse(jsonString);
    const candidate: CalibrationPreset = data.template || data;

    if (
      candidate &&
      typeof candidate.name === 'string' &&
      Array.isArray(candidate.boxes) &&
      candidate.boxes.length > 0
    ) {
      if (!candidate.id) {
        candidate.id = `imported-${Date.now()}`;
      }
      return candidate;
    }
  } catch (err) {
    console.error('Failed to import template from JSON:', err);
  }
  return null;
}

