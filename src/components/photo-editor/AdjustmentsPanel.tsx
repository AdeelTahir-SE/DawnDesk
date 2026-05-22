import { useEditor } from '../../engine/photo-editor/EditorContext';
import type { AdjustmentState } from '../../engine/photo-editor/types';

interface SliderDef {
  key: keyof AdjustmentState;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

const LIGHT_SLIDERS: SliderDef[] = [
  { key: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.05, format: (v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
];

const COLOR_SLIDERS: SliderDef[] = [
  { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1, format: (v) => (v >= 0 ? `+${v}` : `${v}`) },
];

export default function AdjustmentsPanel() {
  const { activeDocument, dispatch } = useEditor();
  const adjustments = activeDocument?.pendingAdjustments;

  const handleChange = (key: keyof AdjustmentState, value: number) => {
    dispatch({ type: 'UPDATE_ADJUSTMENT', payload: { key, value } });
  };

  const renderSliderGroup = (title: string, sliders: SliderDef[]) => (
    <div className="pe-adj-section">
      <div className="pe-adj-section__header">
        <span className="pe-adj-section__title">{title}</span>
        <button
          className="pe-adj-section__more"
          title="More options"
          onClick={() => dispatch({ type: 'RESET_ADJUSTMENTS' })}
        >
          ···
        </button>
      </div>
      {sliders.map((s) => {
        const value = adjustments?.[s.key] ?? 0;
        return (
          <div key={s.key} className="pe-adj-slider">
            <span className="pe-adj-slider__label">{s.label}</span>
            <input
              type="range"
              className="pe-adj-slider__input"
              min={s.min}
              max={s.max}
              step={s.step}
              value={value}
              onChange={(e) => handleChange(s.key, Number(e.target.value))}
              disabled={!activeDocument}
            />
            <span className="pe-adj-slider__value">
              {s.format ? s.format(value) : value}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="pe-adjustments">
      {renderSliderGroup('Light', LIGHT_SLIDERS)}
      {renderSliderGroup('Color', COLOR_SLIDERS)}
    </div>
  );
}
