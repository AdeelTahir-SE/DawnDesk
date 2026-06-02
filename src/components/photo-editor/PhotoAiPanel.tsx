import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Bot, ImagePlus, Loader2, Layers, Wand2, Image as ImageIcon } from 'lucide-react';
import { useAppLogger } from '../../utils/LoggerContext';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import { getAiSettings, IMAGE_MODEL_OPTIONS } from '../../lib/aiTextGeneration';

type GeneratedImage = {
  dataUrl: string;
};

function imageDataToThumbnail(imageData: ImageData) {
  const canvas = document.createElement('canvas');
  const maxW = 96;
  const scale = Math.min(1, maxW / imageData.width);
  canvas.width = Math.max(1, Math.round(imageData.width * scale));
  canvas.height = Math.max(1, Math.round(imageData.height * scale));
  const source = document.createElement('canvas');
  source.width = imageData.width;
  source.height = imageData.height;
  source.getContext('2d')!.putImageData(imageData, 0, 0);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function imageDataToDataUrl(imageData: ImageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not read generated image.'));
        return;
      }
      ctx.drawImage(image, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error('Generated image could not be loaded.'));
    image.src = dataUrl;
  });
}

function makeGeneratedDocument(name: string, imageData: ImageData) {
  return {
    id: `ai-doc-${Date.now()}`,
    fileName: name,
    filePath: null,
    width: imageData.width,
    height: imageData.height,
    dpi: 72,
    colorMode: 'RGB' as const,
    bitDepth: 8 as const,
    imageData,
    originalImageData: imageData,
    thumbnail: imageDataToThumbnail(imageData),
    isDirty: true,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    pendingAdjustments: {
      exposure: 0, contrast: 0, highlights: 0, shadows: 0,
      whites: 0, blacks: 0, brightness: 0, hue: 0, saturation: 0,
      lightness: 0, levelsBlack: 0, levelsMid: 1, levelsWhite: 255,
      curveAmount: 0, colorBalanceCyanRed: 0, colorBalanceMagentaGreen: 0,
      colorBalanceYellowBlue: 0, vibrance: 0, selectiveRed: 0,
      selectiveGreen: 0, selectiveBlue: 0, channelRedFromGreen: 0,
      channelRedFromBlue: 0, channelGreenFromRed: 0, channelGreenFromBlue: 0,
      channelBlueFromRed: 0, channelBlueFromGreen: 0, lutPreset: 0,
    },
  };
}

export default function PhotoAiPanel() {
  const { state, dispatch, activeDocument } = useEditor();
  const { logSuccess: logSuccessBase, logError: logErrorBase } = useAppLogger();
  const logSuccess = (action: string, message: string) => {
    logSuccessBase(action, message, { source: 'photo-editor', toast: false });
  };
  const logError = (action: string, message: string) => {
    logErrorBase(action, message, { source: 'photo-editor', toast: false });
  };
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(IMAGE_MODEL_OPTIONS[0].value);
  const [count, setCount] = useState(2);
  const [size, setSize] = useState('1024x1024');
  const [mode, setMode] = useState<'layers' | 'replace'>('layers');
  const [imageContext, setImageContext] = useState<'none' | 'document' | 'layer'>('document');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);
  const canReplace = Boolean(activeDocument && activeLayer && !activeLayer.locked);
  const canUseImageContext = Boolean(activeDocument?.imageData);

  useEffect(() => {
    getAiSettings()
      .then((settings) => setModel(settings.openai.image_model || IMAGE_MODEL_OPTIONS[0].value))
      .catch(() => undefined);
  }, []);

  const generate = async () => {
    if (!prompt.trim()) {
      setMessage('Enter a prompt first.');
      return;
    }
    if (mode === 'replace' && !canReplace) {
      setMessage('Select an unlocked layer before updating a layer with AI.');
      return;
    }

    setLoading(true);
    setMessage(mode === 'layers' ? 'Generating image layers...' : 'Generating replacement layer...');
    try {
      const contextImageData = imageContext === 'layer'
        ? activeLayer?.imageData
        : imageContext === 'document'
          ? activeDocument?.imageData
          : null;
      const images = await invoke<GeneratedImage[]>('ai_generate_images', {
        request: {
          prompt: mode === 'replace'
            ? `${prompt.trim()}\n\nCreate this as a replacement/update for the selected layer.`
            : prompt.trim(),
          size,
          count: mode === 'replace' ? 1 : count,
          model,
          inputImage: contextImageData ? imageDataToDataUrl(contextImageData) : null,
        },
      });
      const imageDataList = await Promise.all(images.map((image) => dataUrlToImageData(image.dataUrl)));

      if (!activeDocument && imageDataList[0]) {
        dispatch({ type: 'OPEN_DOCUMENT', payload: makeGeneratedDocument('AI Generated Image', imageDataList[0]) });
        imageDataList.slice(1).forEach((imageData, index) => {
          dispatch({
            type: 'ADD_IMAGE_LAYER',
            payload: {
              imageData,
              name: `AI Variation ${index + 2}`,
              thumbnail: imageDataToThumbnail(imageData),
            },
          });
        });
      } else if (mode === 'replace' && imageDataList[0]) {
        dispatch({ type: 'APPLY_TOOL_RESULT', payload: { imageData: imageDataList[0], label: 'AI Layer Update' } });
      } else {
        imageDataList.forEach((imageData, index) => {
          dispatch({
            type: 'ADD_IMAGE_LAYER',
            payload: {
              imageData,
              name: `AI Image ${index + 1}`,
              thumbnail: imageDataToThumbnail(imageData),
            },
          });
        });
      }

      const created = mode === 'replace' ? 'updated the active layer' : `added ${imageDataList.length} AI image layer${imageDataList.length === 1 ? '' : 's'}`;
      setMessage(`Done: ${created}.`);
      logSuccess('Photo AI generation complete', `${created} using ${model}.`, { source: 'photo-editor' });
    } catch (err) {
      const text = String(err);
      setMessage(text);
      logError('Photo AI generation failed', text, { source: 'photo-editor' });
    }
    setLoading(false);
  };

  return (
    <div className="pe-ai-panel">
      <div className="pe-ai-panel__header">
        <div className="pe-ai-panel__icon">
          <Bot size={18} />
        </div>
        <div>
          <h3>AI Image Studio</h3>
          <p>Generate images, stack variations as layers, or update the active layer.</p>
        </div>
      </div>

      <div className="pe-ai-panel__mode-grid">
        <button
          className={`pe-ai-panel__mode ${mode === 'layers' ? 'pe-ai-panel__mode--active' : ''}`}
          onClick={() => setMode('layers')}
        >
          <Layers size={16} />
          <span>Variations as Layers</span>
        </button>
        <button
          className={`pe-ai-panel__mode ${mode === 'replace' ? 'pe-ai-panel__mode--active' : ''}`}
          onClick={() => setMode('replace')}
          disabled={!canReplace}
          title={canReplace ? 'Update the active layer with AI.' : 'Select an unlocked layer first.'}
        >
          <Wand2 size={16} />
          <span>Update Active Layer</span>
        </button>
      </div>

      <label className="pe-ai-panel__field">
        <span>Prompt</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the image you want to generate..."
          disabled={loading}
        />
      </label>

      <label className="pe-ai-panel__field">
        <span>Image model</span>
        <select value={model} onChange={(event) => setModel(event.target.value)} disabled={loading}>
          {IMAGE_MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="pe-ai-panel__field">
        <span>Image context</span>
        <select
          value={imageContext}
          onChange={(event) => setImageContext(event.target.value as typeof imageContext)}
          disabled={loading || !canUseImageContext}
        >
          <option value="document">Use current image</option>
          <option value="layer">Use active layer</option>
          <option value="none">Text prompt only</option>
        </select>
      </label>

      <div className="pe-ai-panel__row">
        <label className="pe-ai-panel__field">
          <span>Size</span>
          <select value={size} onChange={(event) => setSize(event.target.value)} disabled={loading}>
            <option value="1024x1024">Square 1024</option>
            <option value="1536x1024">Landscape</option>
            <option value="1024x1536">Portrait</option>
          </select>
        </label>
        <label className="pe-ai-panel__field">
          <span>Images</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))} disabled={loading || mode === 'replace'}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
      </div>

      <button className="pe-ai-panel__generate" onClick={generate} disabled={loading || !prompt.trim()}>
        {loading ? <Loader2 size={16} className="pe-spin" /> : <ImagePlus size={16} />}
        {loading ? 'Generating...' : mode === 'replace' ? 'Update Layer with AI' : 'Generate as Layers'}
      </button>

      {canUseImageContext && imageContext !== 'none' && (
        <div className="pe-ai-panel__context">
          <ImageIcon size={14} />
          <span>{imageContext === 'layer' ? 'Active layer' : 'Current image'} will be included with your text prompt.</span>
        </div>
      )}

      {message && (
        <div className={`pe-ai-panel__message ${message.startsWith('Done') ? 'pe-ai-panel__message--ok' : ''}`}>
          {message}
        </div>
      )}
    </div>
  );
}
