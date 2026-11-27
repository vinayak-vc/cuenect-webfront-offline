import { ConfiguratorProject } from './types';
import { STARTER_TEMPLATES, BLANK_TEMPLATE } from './templates';

export interface TemplateInstanceRecord {
  id: string; // Unique instance ID
  templateId: string; // Associated occasion template ID
  templateTitle?: string; // Associated template title for robust matching
  assetId?: string; // Stage Database Asset ID (if uploaded)
  assetName: string;
  thumbUrl: string; // Data URL or thumbnail URL
  createdAt: number;
  fieldValues?: Record<string, string>;
  projectData?: ConfiguratorProject;
}

const DEFAULT_TEMPLATES_KEY = 'cuenect_default_templates';
const TEMPLATE_INSTANCES_KEY = 'cuenect_template_instances';
const SAVED_PROJECTS_KEY = 'cuenect_saved_projects';

export const TEMPLATES_CHANGED_EVENT = 'cuenect_templates_changed';
export const INSTANCES_CHANGED_EVENT = 'cuenect_instances_changed';

/**
 * Returns all occasion templates:
 * Default starter templates merged with user's permanent modifications,
 * plus any user-created custom occasion templates.
 */
export function getOccasionTemplates(): ConfiguratorProject[] {
  try {
    const raw = localStorage.getItem(DEFAULT_TEMPLATES_KEY);
    const overrides: ConfiguratorProject[] = raw ? JSON.parse(raw) : [];

    // Map starter templates with any permanent user overrides
    const list = STARTER_TEMPLATES.map((tmpl) => {
      const match = overrides.find((o) => o.id === tmpl.id);
      if (!match) return tmpl;
      // Preserve starter template layer settings (like enableAI) unless explicitly overridden
      const mergedLayers = tmpl.layers.map((starterLayer) => {
        const overrideLayer = match.layers?.find((l) => l.id === starterLayer.id);
        if (!overrideLayer) return starterLayer;
        return {
          ...starterLayer,
          ...overrideLayer,
          enableAI: overrideLayer.enableAI !== undefined ? overrideLayer.enableAI : starterLayer.enableAI
        };
      });
      return {
        ...tmpl,
        ...match,
        layers: mergedLayers
      };
    });

    // Add any completely custom templates that aren't starter templates
    overrides.forEach((o) => {
      if (!list.some((t) => t.id === o.id) && o.id !== BLANK_TEMPLATE.id) {
        list.push(o);
      }
    });

    return list;
  } catch (e) {
    console.warn('[templateStorage] Failed to parse default templates:', e);
    return STARTER_TEMPLATES;
  }
}

/**
 * Permanently saves changes to an occasion template.
 * When users select this template anywhere in the app, their customized version is loaded.
 */
export function savePermanentTemplate(project: ConfiguratorProject): void {
  try {
    const raw = localStorage.getItem(DEFAULT_TEMPLATES_KEY);
    const overrides: ConfiguratorProject[] = raw ? JSON.parse(raw) : [];

    const existingIdx = overrides.findIndex((o) => o.id === project.id);
    const updated = { ...project, updatedAt: Date.now() };

    if (existingIdx >= 0) {
      overrides[existingIdx] = updated;
    } else {
      overrides.push(updated);
    }

    localStorage.setItem(DEFAULT_TEMPLATES_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent(TEMPLATES_CHANGED_EVENT, { detail: updated }));
  } catch (e) {
    console.error('[templateStorage] Failed to save permanent template:', e);
  }
}

/**
 * Reset an occasion template back to factory starter settings.
 */
export function resetTemplateToDefault(templateId: string): void {
  try {
    const raw = localStorage.getItem(DEFAULT_TEMPLATES_KEY);
    if (!raw) return;
    const overrides: ConfiguratorProject[] = JSON.parse(raw);
    const filtered = overrides.filter((o) => o.id !== templateId);
    localStorage.setItem(DEFAULT_TEMPLATES_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(TEMPLATES_CHANGED_EVENT));
  } catch (e) {
    console.error('[templateStorage] Failed to reset template:', e);
  }
}

/**
 * Save project as temporary draft / download JSON backup.
 */
export function saveDraftProject(project: ConfiguratorProject, triggerDownload = false): void {
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
    const savedList: ConfiguratorProject[] = raw ? JSON.parse(raw) : [];

    const existingIdx = savedList.findIndex((p) => p.id === project.id);
    const updated = { ...project, updatedAt: Date.now() };

    if (existingIdx >= 0) {
      savedList[existingIdx] = updated;
    } else {
      savedList.unshift(updated);
    }

    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(savedList));

    if (triggerDownload) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(updated, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.cuenect-project.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  } catch (e) {
    console.error('[templateStorage] Failed to save draft project:', e);
  }
}

// In-memory instances cache to ensure zero loss even if localStorage quota is exceeded
let memoryInstances: TemplateInstanceRecord[] = [];
let memoryLoaded = false;

function loadMemoryInstances(): TemplateInstanceRecord[] {
  if (memoryLoaded) return memoryInstances;
  try {
    const raw = localStorage.getItem(TEMPLATE_INSTANCES_KEY);
    memoryInstances = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[templateStorage] Failed to read template instances from localStorage:', e);
    memoryInstances = [];
  }
  memoryLoaded = true;
  return memoryInstances;
}

function normKey(s?: string): string {
  return (s || '').trim().toLowerCase().replace(/[\s\-_()]+/g, '');
}

/**
 * Get all created image instances (or filter by templateId or templateTitle).
 */
export function getTemplateInstances(templateId?: string, templateTitle?: string): TemplateInstanceRecord[] {
  const list = loadMemoryInstances();
  if (!templateId && !templateTitle) {
    return list;
  }

  const tIdNorm = normKey(templateId);
  const tTitleNorm = normKey(templateTitle);

  return list.filter((item) => {
    const itemTmplId = item.templateId || '';
    const itemTmplTitle = item.templateTitle || (item as any).templateTitle || item.projectData?.title || '';
    const itemProjId = item.projectData?.id || '';

    const itemIdNorm = normKey(itemTmplId);
    const itemTitleNorm = normKey(itemTmplTitle);
    const itemProjIdNorm = normKey(itemProjId);

    // 1. Direct match by templateId
    if (templateId) {
      if (itemTmplId === templateId || itemProjId === templateId) return true;
      if (tIdNorm && (itemIdNorm === tIdNorm || itemProjIdNorm === tIdNorm || itemTitleNorm === tIdNorm)) return true;
    }

    // 2. Direct match by templateTitle
    if (templateTitle) {
      if (itemTmplTitle === templateTitle || itemTmplId === templateTitle) return true;
      if (tTitleNorm && (itemTitleNorm === tTitleNorm || itemIdNorm === tTitleNorm || itemProjIdNorm === tTitleNorm)) return true;
    }

    // 3. Substring match for variations (e.g. "Option 1 ( girl )" vs "Baby Born Celebration (Option 1)")
    if (tTitleNorm && itemTitleNorm && (tTitleNorm.includes(itemTitleNorm) || itemTitleNorm.includes(tTitleNorm))) {
      return true;
    }
    if (tIdNorm && itemIdNorm && (tIdNorm.includes(itemIdNorm) || itemIdNorm.includes(tIdNorm))) {
      return true;
    }

    return false;
  });
}

/**
 * Record a new generated image instance created from a template.
 */
export function saveTemplateInstance(record: TemplateInstanceRecord): void {
  const list = loadMemoryInstances();
  // Match by instance ID, or by assetId if already provided
  const existingIdx = list.findIndex(
    (i) => i.id === record.id || (record.assetId && i.assetId && i.assetId === record.assetId)
  );

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...record };
  } else {
    list.unshift(record);
  }

  // Persist a lightweight version to localStorage to prevent quota exhaustion
  try {
    const storable = list.slice(0, 50).map((item) => ({
      id: item.id,
      templateId: item.templateId,
      templateTitle: item.templateTitle,
      assetId: item.assetId,
      assetName: item.assetName,
      // Only keep small thumbnails in localStorage (<100KB)
      thumbUrl: item.thumbUrl && item.thumbUrl.length < 120000 ? item.thumbUrl : '',
      createdAt: item.createdAt,
      fieldValues: item.fieldValues
    }));
    localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(storable));
  } catch (e) {
    console.warn('[templateStorage] localStorage write failed, retained in memory:', e);
    try {
      // Emergency fallback with minimal payload
      const minimal = list.slice(0, 15).map((item) => ({
        id: item.id,
        templateId: item.templateId,
        templateTitle: item.templateTitle,
        assetId: item.assetId,
        assetName: item.assetName,
        createdAt: item.createdAt
      }));
      localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(minimal));
    } catch {
      // Retained in memoryInstances
    }
  }

  // ALWAYS dispatch change event so the UI updates immediately!
  window.dispatchEvent(new CustomEvent(INSTANCES_CHANGED_EVENT, { detail: record }));
}

/**
 * Delete a created template instance from local tracking.
 */
export function deleteTemplateInstance(instanceId: string): void {
  loadMemoryInstances();
  memoryInstances = memoryInstances.filter((i) => i.id !== instanceId && i.assetId !== instanceId);
  try {
    localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(memoryInstances));
  } catch (e) {
    console.warn('[templateStorage] Failed to update localStorage on delete:', e);
  }
  window.dispatchEvent(new CustomEvent(INSTANCES_CHANGED_EVENT, { detail: { deletedId: instanceId } }));
}
