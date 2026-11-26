import { ConfiguratorProject } from './types';
import { STARTER_TEMPLATES, BLANK_TEMPLATE } from './templates';

export interface TemplateInstanceRecord {
  id: string; // Unique instance ID
  templateId: string; // Associated occasion template ID
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

/**
 * Get all created image instances (or filter by templateId).
 */
export function getTemplateInstances(templateId?: string): TemplateInstanceRecord[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_INSTANCES_KEY);
    const list: TemplateInstanceRecord[] = raw ? JSON.parse(raw) : [];
    if (templateId) {
      return list.filter((item) => item.templateId === templateId);
    }
    return list;
  } catch (e) {
    console.warn('[templateStorage] Failed to read template instances:', e);
    return [];
  }
}

/**
 * Record a new generated image instance created from a template.
 */
export function saveTemplateInstance(record: TemplateInstanceRecord): void {
  try {
    const list = getTemplateInstances();
    // Prepend newest first
    const existingIdx = list.findIndex((i) => i.id === record.id);
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(INSTANCES_CHANGED_EVENT, { detail: record }));
  } catch (e) {
    console.error('[templateStorage] Failed to save template instance:', e);
  }
}

/**
 * Delete a created template instance from local tracking.
 */
export function deleteTemplateInstance(instanceId: string): void {
  try {
    const list = getTemplateInstances().filter((i) => i.id !== instanceId);
    localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(INSTANCES_CHANGED_EVENT, { detail: { deletedId: instanceId } }));
  } catch (e) {
    console.error('[templateStorage] Failed to delete template instance:', e);
  }
}
