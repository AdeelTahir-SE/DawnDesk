import { useRef, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { ChevronDown, ChevronRight, GripVertical, Plus, SlidersHorizontal, Sparkles, Palette, Type, Volume2, Layers, X } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';
import ColorGradingPanel from './ColorGradingPanel';
import TextPanel from './TextPanel';
import AudioPanel from './AudioPanel';
import MaskPanel from './MaskPanel';
import type { Effect, EffectParam, Keyframe, KeyframeInterpolation, RightPanelTab } from '../../../engine/video-editor/types';

const tabs: { id: RightPanelTab; icon: React.ElementType }[] = [
  { id: 'properties', icon: SlidersHorizontal },
  { id: 'effects', icon: Sparkles },
  { id: 'color', icon: Palette },
  { id: 'text', icon: Type },
  { id: 'audio', icon: Volume2 },
  { id: 'mask', icon: Layers },
];

const KEYFRAME_COLORS = [
  '#facc15',
  '#38bdf8',
  '#fb7185',
  '#a3e635',
  '#f97316',
  '#c084fc',
  '#2dd4bf',
  '#f472b6',
];

function keyframeColor(index: number) {
  return KEYFRAME_COLORS[index % KEYFRAME_COLORS.length];
}

export default function RightPanel() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-right-panel">
      <div className="ve-panel">
        <div className="ve-panel-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`ve-panel-tab ${state.activeRightPanel === tab.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_RIGHT_PANEL', payload: tab.id })}
              title={tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
            >
              <tab.icon size={14} />
            </button>
          ))}
        </div>
        <div className="ve-panel-body">
          {state.activeRightPanel === 'properties' && <PropertiesPanel />}
          {state.activeRightPanel === 'effects' && <EffectsAppliedPanel />}
          {state.activeRightPanel === 'color' && <ColorGradingPanel />}
          {state.activeRightPanel === 'text' && <TextPanel />}
          {state.activeRightPanel === 'audio' && <AudioPanel />}
          {state.activeRightPanel === 'mask' && <MaskPanel />}
        </div>
      </div>
    </div>
  );
}

function EffectsAppliedPanel() {
  const { state, dispatch } = useVideoEditor();
  const clipId = state.selectedClipIds[0];
  const [collapsedEffectIds, setCollapsedEffectIds] = useState<Set<string>>(() => new Set());
  const timelineEffect = state.project?.tracks
    .flatMap(track => track.effects ?? [])
    .find(effect => effect.id === state.selectedTimelineEffectId);
  const toggleEffectCollapsed = (effectId: string) => {
    setCollapsedEffectIds(previous => {
      const next = new Set(previous);
      if (next.has(effectId)) next.delete(effectId);
      else next.add(effectId);
      return next;
    });
  };

  const renderParamControls = (
    effect: Effect,
    updateParam: (param: EffectParam, value: EffectParam['value']) => void
  ) => (
    effect.params.length > 0 && (
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {effect.params.map(param => (
          <div key={param.key} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span className="ve-slider-label">{param.label}</span>
              {param.type === 'number' && (
                <span className="ve-slider-value">{Number(param.value).toFixed((param.step ?? 1) < 1 ? 1 : 0)}</span>
              )}
            </div>
            {param.type === 'number' && (
              <input
                type="range"
                className="ve-slider"
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 1}
                value={Number(param.value)}
                onChange={(event) => updateParam(param, Number(event.target.value))}
              />
            )}
            {param.type === 'select' && (
              <select
                className="ve-speed-select"
                style={{ width: '100%' }}
                value={String(param.value)}
                onChange={(event) => updateParam(param, event.target.value)}
              >
                {(param.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            )}
            {param.type === 'text' && (
              <textarea
                className="ve-number-input ve-effect-textarea"
                rows={param.key === 'text' ? 3 : 1}
                value={String(param.value)}
                onChange={(event) => updateParam(param, event.target.value)}
              />
            )}
            {param.type === 'boolean' && (
              <button
                className={`ve-toggle ${param.value ? 'active' : ''}`}
                onClick={() => updateParam(param, !param.value)}
              />
            )}
            {param.type === 'color' && (
              <input
                type="color"
                value={String(param.value)}
                onChange={(event) => updateParam(param, event.target.value)}
                style={{ width: 28, height: 28, border: '1px solid var(--ve-border)', borderRadius: 4, padding: 0, background: 'none' }}
              />
            )}
          </div>
        ))}
      </div>
    )
  );

  if (timelineEffect) {
    const updateTimelineParam = (param: EffectParam, value: EffectParam['value']) => {
      dispatch({ type: 'UPDATE_TIMELINE_EFFECT_PARAM', payload: { effectId: timelineEffect.id, paramKey: param.key, value } });
    };
    const collapsed = collapsedEffectIds.has(timelineEffect.id);

    return (
      <div>
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Timeline Effect</div>
        <div className="ve-effect-editor ve-effect-editor-selected">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <button className="ve-collapse-btn" onClick={() => toggleEffectCollapsed(timelineEffect.id)} title={collapsed ? 'Show effect details' : 'Hide effect details'}>
                {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
              <button
                className={`ve-toggle ${timelineEffect.enabled ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_TIMELINE_EFFECT', payload: timelineEffect.id })}
              />
              <span className="ve-effect-editor-title">{timelineEffect.name}</span>
            </div>
            <button
              className="ve-effect-remove-btn"
              onClick={() => dispatch({ type: 'REMOVE_TIMELINE_EFFECT', payload: timelineEffect.id })}
              title="Remove timeline effect"
            >
              <X size={13} />
            </button>
          </div>

          {!collapsed && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
                <EffectTimeStat label="Start" value={`${timelineEffect.startTime.toFixed(2)}s`} />
                <EffectTimeStat label="End" value={`${(timelineEffect.startTime + timelineEffect.duration).toFixed(2)}s`} />
                <EffectTimeStat label="Length" value={`${timelineEffect.duration.toFixed(2)}s`} />
              </div>

              {renderParamControls(timelineEffect, updateTimelineParam)}
            </>
          )}
        </div>
      </div>
    );
  }

  if (!clipId || !state.project) {
    return (
      <div className="ve-empty">
        <Sparkles size={24} className="ve-empty-icon" />
        <div className="ve-empty-title">No clip selected</div>
        <div className="ve-empty-desc">Select a clip to view its effects</div>
      </div>
    );
  }

  const clip = state.project.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
  if (!clip) return null;

  const updateParam = (effectId: string, param: EffectParam, value: EffectParam['value']) => {
    dispatch({ type: 'UPDATE_EFFECT_PARAM', payload: { clipId, effectId, paramKey: param.key, value } });
  };

  const selectedClipStart = clip.startTime;

  return (
    <div>
      <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Applied Effects</div>
      {clip.effects.length === 0 ? (
        <div className="ve-empty">
          <Sparkles size={20} className="ve-empty-icon" />
          <div className="ve-empty-desc">Drag effects from the left panel</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {clip.effects.map(effect => {
            const collapsed = collapsedEffectIds.has(effect.id);
            return (
              <div
                key={effect.id}
                className={`ve-effect-editor ${effect.id === state.selectedEffectId ? 've-effect-editor-selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_EFFECT', payload: effect.id })}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <button
                      className="ve-collapse-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleEffectCollapsed(effect.id);
                      }}
                      title={collapsed ? 'Show effect details' : 'Hide effect details'}
                    >
                      {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button
                      className={`ve-toggle ${effect.enabled ? 'active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: 'TOGGLE_EFFECT', payload: { clipId, effectId: effect.id } });
                      }}
                    />
                    <span className="ve-effect-editor-title">{effect.name}</span>
                  </div>
                  <button
                    className="ve-effect-remove-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      dispatch({ type: 'REMOVE_EFFECT', payload: { clipId, effectId: effect.id } });
                    }}
                    title="Remove effect"
                  >
                    <X size={13} />
                  </button>
                </div>

                {!collapsed && (
                  <>
                    {effect.id === state.selectedEffectId && effect.startOffset !== undefined && effect.duration !== undefined && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
                        <EffectTimeStat label="Start" value={`${effect.startOffset.toFixed(2)}s`} />
                        <EffectTimeStat label="End" value={`${(effect.startOffset + effect.duration).toFixed(2)}s`} />
                        <EffectTimeStat label="Length" value={`${effect.duration.toFixed(2)}s`} />
                      </div>
                    )}

                    {renderParamControls(effect, (param, value) => updateParam(effect.id, param, value))}
                    {effect.id === state.selectedEffectId && (
                      <EffectKeyframes
                        clipId={clipId}
                        effect={effect}
                        clipDuration={clip.duration}
                        effectLocalTime={Math.max(0, state.playheadTime - selectedClipStart - (effect.startOffset ?? 0))}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function effectParamNumber(effect: Effect, key: string, fallback: number) {
  const value = effect.params.find(param => param.key === key)?.value;
  return typeof value === 'number' ? value : Number(value ?? fallback) || fallback;
}

function formatControlValue(value: number, step = 1) {
  return Number(value).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0);
}

function keyframePropertyLabel(effect: Effect, property: string) {
  if (property === 'position') return 'Position';
  return effect.params.find(param => param.key === property)?.label ?? property;
}

function KeyframeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const safeValue = Number.isFinite(value) ? value : min;
  return (
    <div className="ve-keyframe-control">
      <div className="ve-keyframe-control-head">
        <span className="ve-slider-label">{label}</span>
        <span className="ve-slider-value">{formatControlValue(safeValue, step)}</span>
      </div>
      <div className="ve-keyframe-slider-line">
        <input
          type="range"
          className="ve-slider"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={event => onChange(Number(event.target.value))}
        />
        <input
          className="ve-number-input ve-keyframe-number"
          type="number"
          min={min}
          max={max}
          step={step}
          value={formatControlValue(safeValue, step)}
          onChange={event => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

function EffectKeyframes({
  clipId,
  effect,
  clipDuration,
  effectLocalTime,
}: {
  clipId: string;
  effect: Effect;
  clipDuration: number;
  effectLocalTime: number;
}) {
  const { dispatch } = useVideoEditor();
  const numericParams = effect.params.filter(param => param.type === 'number');
  const instantDuration = Math.max(0.1, effect.duration ?? clipDuration);
  const keyframes = effect.keyframes;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [collapsedKeyframeIds, setCollapsedKeyframeIds] = useState<Set<string>>(() => new Set());

  const addNumericInstant = (param: EffectParam) => {
    const boundedTime = Math.max(0, Math.min(instantDuration, effectLocalTime));
    const keyframe: Keyframe = {
      id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: boundedTime,
      property: param.key,
      value: Number(param.value) || 0,
      interpolation: 'ease-in-out',
      handleOut: { x: 0.42, y: 0 },
      handleIn: { x: 0.58, y: 1 },
    };
    dispatch({ type: 'ADD_EFFECT_KEYFRAME', payload: { clipId, effectId: effect.id, keyframe } });
  };

  const addTextPositionInstant = () => {
    const boundedTime = Math.max(0, Math.min(instantDuration, effectLocalTime));
    const keyframe: Keyframe = {
      id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: boundedTime,
      property: 'position',
      value: {
        x: effectParamNumber(effect, 'x', 50),
        y: effectParamNumber(effect, 'y', 50),
      },
      interpolation: 'ease-in-out',
      handleOut: { x: 0.42, y: 0 },
      handleIn: { x: 0.58, y: 1 },
    };
    dispatch({ type: 'ADD_EFFECT_KEYFRAME', payload: { clipId, effectId: effect.id, keyframe } });
  };

  const updateKeyframe = (keyframeId: string, updates: Partial<Keyframe>) => {
    dispatch({ type: 'UPDATE_EFFECT_KEYFRAME', payload: { clipId, effectId: effect.id, keyframeId, updates } });
  };

  const toggleKeyframeCollapsed = (keyframeId: string) => {
    setCollapsedKeyframeIds(previous => {
      const next = new Set(previous);
      if (next.has(keyframeId)) next.delete(keyframeId);
      else next.add(keyframeId);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = keyframes.findIndex(keyframe => keyframe.id === active.id);
    const newIndex = keyframes.findIndex(keyframe => keyframe.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(keyframes.map(keyframe => keyframe.id), oldIndex, newIndex);
    dispatch({ type: 'REORDER_EFFECT_KEYFRAMES', payload: { clipId, effectId: effect.id, keyframeIds: nextIds } });
  };

  return (
    <div className="ve-effect-keyframes">
      <div className="ve-effect-keyframes-head">
        <div className="ve-panel-section-title">Keyframe Instants</div>
        <span>{keyframes.length}</span>
      </div>
      <div className="ve-keyframe-add-row">
        {numericParams.map(param => (
          <button key={param.key} className="ve-keyframe-add-btn" onClick={() => addNumericInstant(param)}>
            <Plus size={12} />
            <span>{param.label}</span>
          </button>
        ))}
        {effect.type === 'text-overlay' && (
          <button className="ve-keyframe-add-btn" onClick={addTextPositionInstant}>
            <Plus size={12} />
            <span>Position</span>
          </button>
        )}
      </div>
      {keyframes.length === 0 ? (
        <div className="ve-keyframe-empty">Add an instant, move the playhead, then add another to animate the value.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={keyframes.map(keyframe => keyframe.id)} strategy={verticalListSortingStrategy}>
            <div className="ve-keyframe-list">
              {keyframes.map((keyframe, index) => (
                <SortableKeyframeCard
                  key={keyframe.id}
                  clipId={clipId}
                  effect={effect}
                  keyframe={keyframe}
                  index={index}
                  color={keyframeColor(index)}
                  instantDuration={instantDuration}
                  collapsed={collapsedKeyframeIds.has(keyframe.id)}
                  onToggleCollapsed={() => toggleKeyframeCollapsed(keyframe.id)}
                  onUpdate={updateKeyframe}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableKeyframeCard({
  clipId,
  effect,
  keyframe,
  index,
  color,
  instantDuration,
  collapsed,
  onToggleCollapsed,
  onUpdate,
}: {
  clipId: string;
  effect: Effect;
  keyframe: Keyframe;
  index: number;
  color: string;
  instantDuration: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onUpdate: (keyframeId: string, updates: Partial<Keyframe>) => void;
}) {
  const { dispatch } = useVideoEditor();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: keyframe.id });
  const isPoint = typeof keyframe.value === 'object' && keyframe.value !== null && 'x' in keyframe.value && 'y' in keyframe.value;
  const point = isPoint ? keyframe.value as { x: number; y: number } : null;
  const param = effect.params.find(item => item.key === keyframe.property);
  const valueStep = param?.step ?? 0.1;
  const valueMin = param?.min ?? 0;
  const valueMax = param?.max ?? Math.max(100, Number(keyframe.value) || 100);

  return (
    <div
      ref={setNodeRef}
      className={`ve-keyframe-card ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="ve-keyframe-card-head">
        <span>
          <button className="ve-keyframe-drag-btn" title="Drag to reorder instant" {...attributes} {...listeners}>
            <GripVertical size={13} />
          </button>
          <button className="ve-collapse-btn" onClick={onToggleCollapsed} title={collapsed ? 'Show instant details' : 'Hide instant details'}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
          <i className="ve-keyframe-color-dot" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
          {index + 1}. {keyframePropertyLabel(effect, keyframe.property)}
        </span>
        <button
          className="ve-tool-btn"
          style={{ width: 22, height: 22 }}
          onClick={() => dispatch({ type: 'REMOVE_EFFECT_KEYFRAME', payload: { clipId, effectId: effect.id, keyframeId: keyframe.id } })}
          title="Remove keyframe"
        >
          <X size={13} />
        </button>
      </div>
      {!collapsed && (
        <>
          <KeyframeSlider
            label="Instant"
            min={0}
            max={instantDuration}
            step={0.05}
            value={Number(keyframe.time)}
            onChange={value => onUpdate(keyframe.id, { time: value })}
          />
          {isPoint && point ? (
            <>
              <KeyframeSlider
                label="X"
                min={0}
                max={100}
                step={1}
                value={point.x}
                onChange={value => onUpdate(keyframe.id, { value: { ...point, x: value } })}
              />
              <KeyframeSlider
                label="Y"
                min={0}
                max={100}
                step={1}
                value={point.y}
                onChange={value => onUpdate(keyframe.id, { value: { ...point, y: value } })}
              />
            </>
          ) : (
            <KeyframeSlider
              label="Value"
              min={valueMin}
              max={valueMax}
              step={valueStep}
              value={Number(keyframe.value)}
              onChange={value => onUpdate(keyframe.id, { value })}
            />
          )}
          <div className="ve-keyframe-select-row">
            <span className="ve-slider-label">Function</span>
            <select
              className="ve-speed-select"
              value={keyframe.interpolation}
              onChange={event => onUpdate(keyframe.id, { interpolation: event.target.value as KeyframeInterpolation })}
            >
              {['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bezier', 'hold'].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <KeyframeCurveGraph keyframe={keyframe} color={color} onUpdate={updates => onUpdate(keyframe.id, updates)} />
          {keyframe.interpolation === 'bezier' && (
            <>
              <KeyframeSlider
                label="Bezier X"
                min={0}
                max={1}
                step={0.01}
                value={keyframe.handleOut?.x ?? 0.42}
                onChange={value => onUpdate(keyframe.id, { handleOut: { x: value, y: keyframe.handleOut?.y ?? 0 } })}
              />
              <KeyframeSlider
                label="Bezier Y"
                min={0}
                max={1}
                step={0.01}
                value={keyframe.handleOut?.y ?? 0}
                onChange={value => onUpdate(keyframe.id, { handleOut: { x: keyframe.handleOut?.x ?? 0.42, y: value } })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function curvePath(interpolation: KeyframeInterpolation, handleOut?: { x: number; y: number }) {
  if (interpolation === 'hold') return 'M 10 70 L 50 70 L 50 10 L 90 10';
  if (interpolation === 'ease-in') return 'M 10 70 C 38 70 54 58 90 10';
  if (interpolation === 'ease-out') return 'M 10 70 C 46 22 62 10 90 10';
  if (interpolation === 'ease-in-out') return 'M 10 70 C 34 70 66 10 90 10';
  if (interpolation === 'bezier') {
    const x = 10 + Math.max(0, Math.min(1, handleOut?.x ?? 0.42)) * 80;
    const y = 70 - Math.max(0, Math.min(1, handleOut?.y ?? 0)) * 60;
    return `M 10 70 C ${x} ${y} ${90 - (x - 10)} ${80 - y} 90 10`;
  }
  return 'M 10 70 L 90 10';
}

function KeyframeCurveGraph({
  keyframe,
  color,
  onUpdate,
}: {
  keyframe: Keyframe;
  color: string;
  onUpdate: (updates: Partial<Keyframe>) => void;
}) {
  const graphRef = useRef<SVGSVGElement | null>(null);
  const handle = keyframe.handleOut ?? { x: 0.42, y: 0 };
  const handleX = 10 + Math.max(0, Math.min(1, handle.x)) * 80;
  const handleY = 70 - Math.max(0, Math.min(1, handle.y)) * 60;

  const updateBezierHandle = (event: React.MouseEvent<SVGSVGElement>) => {
    if (keyframe.interpolation !== 'bezier' || !graphRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left - 10) / Math.max(1, rect.width - 20)));
    const y = Math.max(0, Math.min(1, 1 - ((event.clientY - rect.top - 10) / Math.max(1, rect.height - 20))));
    onUpdate({ handleOut: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) } });
  };

  return (
    <div className="ve-keyframe-curve-editor">
      <svg
        ref={graphRef}
        viewBox="0 0 100 80"
        onMouseDown={updateBezierHandle}
        onMouseMove={event => {
          if (event.buttons === 1) updateBezierHandle(event);
        }}
      >
        <path className="ve-keyframe-curve-grid" d="M 10 10 H 90 M 10 30 H 90 M 10 50 H 90 M 10 70 H 90 M 10 10 V 70 M 30 10 V 70 M 50 10 V 70 M 70 10 V 70 M 90 10 V 70" />
        <path className="ve-keyframe-curve-base" d="M 10 70 L 90 10" />
        <path className="ve-keyframe-curve-line" d={curvePath(keyframe.interpolation, keyframe.handleOut)} style={{ stroke: color }} />
        {keyframe.interpolation === 'bezier' && (
          <>
            <path className="ve-keyframe-curve-handle-line" d={`M 10 70 L ${handleX} ${handleY}`} />
            <circle className="ve-keyframe-curve-handle" cx={handleX} cy={handleY} r="4" style={{ fill: color }} />
          </>
        )}
      </svg>
      <span>{keyframe.interpolation === 'bezier' ? 'Drag handle to shape curve' : keyframe.interpolation}</span>
    </div>
  );
}

function EffectTimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--ve-border)', borderRadius: 4, padding: '6px 7px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 9, color: 'var(--ve-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--ve-text-secondary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{value}</div>
    </div>
  );
}
