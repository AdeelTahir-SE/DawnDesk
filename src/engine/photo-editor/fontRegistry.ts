export type PhotoEditorFont = {
  id: string;
  name: string;
  family: string;
  source: 'built-in' | 'loaded';
};

const STORAGE_KEY = 'dawndesk.photoEditor.loadedFonts';

export const BUILT_IN_TEXT_FONTS: PhotoEditorFont[] = [
  { id: 'arial', name: 'Arial', family: 'Arial', source: 'built-in' },
  { id: 'segoe-ui', name: 'Segoe UI', family: 'Segoe UI', source: 'built-in' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia', source: 'built-in' },
  { id: 'times-new-roman', name: 'Times New Roman', family: 'Times New Roman', source: 'built-in' },
  { id: 'courier-new', name: 'Courier New', family: 'Courier New', source: 'built-in' },
  { id: 'verdana', name: 'Verdana', family: 'Verdana', source: 'built-in' },
  { id: 'trebuchet-ms', name: 'Trebuchet MS', family: 'Trebuchet MS', source: 'built-in' },
  { id: 'impact', name: 'Impact', family: 'Impact', source: 'built-in' },
  { id: 'lucida-console', name: 'Lucida Console', family: 'Lucida Console', source: 'built-in' },
  { id: 'comic-sans-ms', name: 'Comic Sans MS', family: 'Comic Sans MS', source: 'built-in' },
  { id: 'brush-script-mt', name: 'Brush Script MT', family: 'Brush Script MT', source: 'built-in' },
];

type StoredFont = {
  id: string;
  name: string;
  family: string;
  dataUrl: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'loaded-font';
}

function readStoredFonts(): StoredFont[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((font) => font?.dataUrl && font?.family) : [];
  } catch {
    return [];
  }
}

function writeStoredFonts(fonts: StoredFont[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected font file.'));
    reader.readAsDataURL(file);
  });
}

async function registerFont(font: StoredFont) {
  const face = new FontFace(font.family, `url(${font.dataUrl})`);
  await face.load();
  document.fonts.add(face);
}

export async function getAvailableTextFonts(): Promise<PhotoEditorFont[]> {
  const loaded: PhotoEditorFont[] = [];
  for (const font of readStoredFonts()) {
    try {
      await registerFont(font);
      loaded.push({ id: font.id, name: font.name, family: font.family, source: 'loaded' });
    } catch {
      // Skip corrupted or unsupported saved font files.
    }
  }
  return [...BUILT_IN_TEXT_FONTS, ...loaded];
}

export async function loadTextFontFile(file: File): Promise<PhotoEditorFont> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'ttf' && extension !== 'otf') {
    throw new Error('Choose a .ttf or .otf font file.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '').trim() || 'Loaded Font';
  const id = `loaded-${slugify(file.name)}-${Date.now()}`;
  const family = `DawnDesk ${baseName} ${Date.now()}`;
  const dataUrl = await fileToDataUrl(file);
  const stored: StoredFont = { id, name: baseName, family, dataUrl };
  await registerFont(stored);

  const fonts = readStoredFonts().filter((font) => font.name !== baseName);
  fonts.push(stored);
  writeStoredFonts(fonts);

  return { id, name: baseName, family, source: 'loaded' };
}
