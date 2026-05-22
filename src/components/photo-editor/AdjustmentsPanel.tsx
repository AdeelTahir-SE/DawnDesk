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

const signed = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

const LIGHT_SLIDERS: SliderDef[] = [
  { key: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.05, format: (v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, format: signed },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, format: signed },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, format: signed },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1, format: signed },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1, format: signed },
];

const COLOR_SLIDERS: SliderDef[] = [
  { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v} deg` },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, format: signed },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1, format: signed },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1, format: signed },
];

const LEVEL_SLIDERS: SliderDef[] = [
  { key: 'levelsBlack', label: 'Black', min: 0, max: 254, step: 1 },
  { key: 'levelsMid', label: 'Gamma', min: 0.1, max: 4, step: 0.05, format: (v) => v.toFixed(2) },
  { key: 'levelsWhite', label: 'White', min: 1, max: 255, step: 1 },
  { key: 'curveAmount', label: 'Curve', min: -100, max: 100, step: 1, format: signed },
];

const BALANCE_SLIDERS: SliderDef[] = [
  { key: 'colorBalanceCyanRed', label: 'Cyan / Red', min: -100, max: 100, step: 1, format: signed },
  { key: 'colorBalanceMagentaGreen', label: 'Magenta / Green', min: -100, max: 100, step: 1, format: signed },
  { key: 'colorBalanceYellowBlue', label: 'Yellow / Blue', min: -100, max: 100, step: 1, format: signed },
];

const SELECTIVE_SLIDERS: SliderDef[] = [
  { key: 'selectiveRed', label: 'Reds', min: -100, max: 100, step: 1, format: signed },
  { key: 'selectiveGreen', label: 'Greens', min: -100, max: 100, step: 1, format: signed },
  { key: 'selectiveBlue', label: 'Blues', min: -100, max: 100, step: 1, format: signed },
];

const CHANNEL_SLIDERS: SliderDef[] = [
  { key: 'channelRedFromGreen', label: 'Red from Green', min: -100, max: 100, step: 1, format: signed },
  { key: 'channelRedFromBlue', label: 'Red from Blue', min: -100, max: 100, step: 1, format: signed },
  { key: 'channelGreenFromRed', label: 'Green from Red', min: -100, max: 100, step: 1, format: signed },
  { key: 'channelGreenFromBlue', label: 'Green from Blue', min: -100, max: 100, step: 1, format: signed },
  { key: 'channelBlueFromRed', label: 'Blue from Red', min: -100, max: 100, step: 1, format: signed },
  { key: 'channelBlueFromGreen', label: 'Blue from Green', min: -100, max: 100, step: 1, format: signed },
];

export default function AdjustmentsPanel() {
  const { state, activeDocument, dispatch } = useEditor();
  const adjustments = activeDocument?.pendingAdjustments;
  const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);
  const canEditLayer = Boolean(activeDocument && activeLayer && !activeLayer.locked);

  const handleChange = (key: keyof AdjustmentState, value: number) => {
    dispatch({ type: 'UPDATE_ADJUSTMENT', payload: { key, value } });
  };

  const renderSliderGroup = (title: string, sliders: SliderDef[]) => (
    <div className="pe-adj-section">
      <div className="pe-adj-section__header">
        <span className="pe-adj-section__title">{title}</span>
        <button
          className="pe-adj-section__more"
          title="Reset adjustments"
          onClick={() => dispatch({ type: 'RESET_ADJUSTMENTS' })}
        >
          ...
        </button>
      </div>
      {sliders.map((s) => {
        const value = adjustments?.[s.key] ?? (s.key === 'levelsMid' ? 1 : s.key === 'levelsWhite' ? 255 : 0);
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
              disabled={!canEditLayer}
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
      {renderSliderGroup('Levels & Curves', LEVEL_SLIDERS)}
      {renderSliderGroup('Color Balance', BALANCE_SLIDERS)}
      {renderSliderGroup('Selective Color', SELECTIVE_SLIDERS)}
      <div className="pe-adj-section">
        <div className="pe-adj-section__header">
          <span className="pe-adj-section__title">LUT / Color Lookup</span>
          <button className="pe-adj-section__more" title="Reset adjustments" onClick={() => dispatch({ type: 'RESET_ADJUSTMENTS' })}>...</button>
        </div>
        <div className="pe-adj-slider">
          <span className="pe-adj-slider__label">Preset</span>
          <select
            className="pe-options-bar__select"
            value={adjustments?.lutPreset ?? 0}
            onChange={(e) => handleChange('lutPreset', Number(e.target.value))}
            disabled={!canEditLayer}
          >
            <option value={0}>None</option>
            <option value={1}>Cinema Warm</option>
            <option value={2}>Matte Fade</option>
            <option value={3}>Cool Steel</option>
          </select>
          <span className="pe-adj-slider__value">v3</span>
        </div>
      </div>
      {renderSliderGroup('Channel Mixer', CHANNEL_SLIDERS)}
      <div className="pe-adj-section" style={{ padding: '8px 12px' }}>
        <button
          className="pe-action-button pe-action-button--primary"
          disabled={!canEditLayer}
          onClick={() => dispatch({ type: 'COMMIT_ADJUSTMENT' })}
        >
          Apply Adjustments
        </button>
      </div>
    </div>
  );
}
