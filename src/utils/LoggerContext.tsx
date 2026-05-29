import React, { createContext, useContext, useCallback, ReactNode, useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { writeTextFile, BaseDirectory, mkdir, exists } from '@tauri-apps/plugin-fs';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type LogChannel = 'navigation' | 'operation';
export type LoggerSource =
  | 'shell'
  | 'dashboard'
  | 'photo-editor'
  | 'video-editor'
  | 'project-manager'
  | 'finance'
  | 'notes'
  | 'prompts'
  | 'dev-tools'
  | 'settings';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  channel: LogChannel;
  source: LoggerSource;
  action: string;
  message: string;
}

export interface LoggerSettings {
  enabled: boolean;
  toastsEnabled: boolean;
  fileEnabled: boolean;
  consoleEnabled: boolean;
  channels: Record<LogChannel, boolean>;
  levels: Record<LogLevel, boolean>;
  sources: Record<LoggerSource, boolean>;
  mutedActions: Record<string, boolean>;
}

type LogOptions = {
  channel?: LogChannel;
  source?: LoggerSource;
};

interface LoggerContextType {
  logs: LogEntry[];
  settings: LoggerSettings;
  updateLoggerSettings: (patch: Partial<LoggerSettings>) => void;
  resetLoggerSettings: () => void;
  logInfo: (action: string, message: string, options?: LogOptions) => void;
  logSuccess: (action: string, message: string, options?: LogOptions) => void;
  logWarning: (action: string, message: string, options?: LogOptions) => void;
  logError: (action: string, message: string, options?: LogOptions) => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

const LOG_FILE_NAME = 'dawndesk_activity.log';
export const LOGGER_SETTINGS_KEY = 'dawndesk_logger_settings';

export const LOGGER_SOURCES: { id: LoggerSource; label: string }[] = [
  { id: 'shell', label: 'Shell & Navigation' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'photo-editor', label: 'Photo Editor' },
  { id: 'video-editor', label: 'Video Editor' },
  { id: 'project-manager', label: 'Project Manager' },
  { id: 'finance', label: 'Finance Manager' },
  { id: 'notes', label: 'Notes' },
  { id: 'prompts', label: 'Prompt Manager' },
  { id: 'dev-tools', label: 'Dev Tools' },
  { id: 'settings', label: 'Settings' },
];

export const defaultLoggerSettings: LoggerSettings = {
  enabled: true,
  toastsEnabled: true,
  fileEnabled: true,
  consoleEnabled: true,
  channels: {
    navigation: false,
    operation: true,
  },
  levels: {
    info: true,
    success: true,
    warning: true,
    error: true,
  },
  sources: Object.fromEntries(LOGGER_SOURCES.map(source => [source.id, true])) as Record<LoggerSource, boolean>,
  mutedActions: {},
};

function normalizeLoggerSettings(value: unknown): LoggerSettings {
  const parsed = value && typeof value === 'object' ? value as Partial<LoggerSettings> : {};
  return {
    ...defaultLoggerSettings,
    ...parsed,
    channels: { ...defaultLoggerSettings.channels, ...(parsed.channels ?? {}) },
    levels: { ...defaultLoggerSettings.levels, ...(parsed.levels ?? {}) },
    sources: { ...defaultLoggerSettings.sources, ...(parsed.sources ?? {}) },
    mutedActions: { ...defaultLoggerSettings.mutedActions, ...(parsed.mutedActions ?? {}) },
  };
}

function loadLoggerSettings(): LoggerSettings {
  try {
    return normalizeLoggerSettings(JSON.parse(localStorage.getItem(LOGGER_SETTINGS_KEY) || 'null'));
  } catch {
    return defaultLoggerSettings;
  }
}

function routeToSource(pathname: string): LoggerSource {
  if (pathname.includes('/photo-editor')) return 'photo-editor';
  if (pathname.includes('/video-editor')) return 'video-editor';
  if (pathname.includes('/project-manager')) return 'project-manager';
  if (pathname.includes('/finance')) return 'finance';
  if (pathname.includes('/notes')) return 'notes';
  if (pathname.includes('/prompts')) return 'prompts';
  if (pathname.includes('/dev-tools')) return 'dev-tools';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/dashboard')) return 'dashboard';
  return 'shell';
}

function inferSource(action: string, message: string): LoggerSource {
  const haystack = `${action} ${message}`.toLowerCase();
  if (action === 'Navigation') return routeToSource(message);
  if (haystack.includes('photo')) return 'photo-editor';
  if (haystack.includes('video') || haystack.includes('ffmpeg') || haystack.includes('clip') || haystack.includes('effect') || haystack.includes('transition')) return 'video-editor';
  if (haystack.includes('finance') || haystack.includes('invoice') || haystack.includes('ledger')) return 'finance';
  if (haystack.includes('project')) return 'project-manager';
  if (haystack.includes('note')) return 'notes';
  if (haystack.includes('prompt')) return 'prompts';
  if (haystack.includes('dev')) return 'dev-tools';
  if (haystack.includes('setting')) return 'settings';
  return 'shell';
}

export const LoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<LoggerSettings>(() => loadLoggerSettings());

  const initLogDir = async () => {
    try {
      const dirExists = await exists('', { baseDir: BaseDirectory.AppLocalData });
      if (!dirExists) {
        await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
      }
      
      const fileExists = await exists(LOG_FILE_NAME, { baseDir: BaseDirectory.AppLocalData });
      if (!fileExists) {
        await writeTextFile(LOG_FILE_NAME, '--- DawnDesk Log Started ---\n', { baseDir: BaseDirectory.AppLocalData, append: true });
      }
    } catch (error) {
      console.error('Failed to initialize log directory', error);
    }
  };

  useEffect(() => {
    initLogDir();
  }, []);

  useEffect(() => {
    const refresh = () => setSettings(loadLoggerSettings());
    window.addEventListener('storage', refresh);
    window.addEventListener('dawndesk_logger_settings_changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('dawndesk_logger_settings_changed', refresh);
    };
  }, []);

  const updateLoggerSettings = useCallback((patch: Partial<LoggerSettings>) => {
    setSettings(prev => {
      const next = normalizeLoggerSettings({
        ...prev,
        ...patch,
        channels: patch.channels ? { ...prev.channels, ...patch.channels } : prev.channels,
        levels: patch.levels ? { ...prev.levels, ...patch.levels } : prev.levels,
        sources: patch.sources ? { ...prev.sources, ...patch.sources } : prev.sources,
        mutedActions: patch.mutedActions ? { ...prev.mutedActions, ...patch.mutedActions } : prev.mutedActions,
      });
      localStorage.setItem(LOGGER_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetLoggerSettings = useCallback(() => {
    localStorage.setItem(LOGGER_SETTINGS_KEY, JSON.stringify(defaultLoggerSettings));
    setSettings(defaultLoggerSettings);
  }, []);

  const persistLog = async (entry: LogEntry) => {
    try {
      const logString = `[${entry.timestamp}] [${entry.source}] [${entry.channel}] [${entry.level.toUpperCase()}] ${entry.action} - ${entry.message}\n`;
      await writeTextFile(LOG_FILE_NAME, logString, { baseDir: BaseDirectory.AppLocalData, append: true });
    } catch (error) {
      console.error('Failed to write log to file', error);
    }
  };

  const createLog = useCallback((level: LogLevel, action: string, message: string, options?: LogOptions) => {
    const channel = options?.channel ?? (action === 'Navigation' ? 'navigation' : 'operation');
    const source = options?.source ?? inferSource(action, message);
    const currentSettings = settings;

    if (
      !currentSettings.enabled ||
      !currentSettings.levels[level] ||
      !currentSettings.channels[channel] ||
      !currentSettings.sources[source] ||
      currentSettings.mutedActions[action]
    ) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      channel,
      source,
      action,
      message,
    };
    
    // Add to state
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100
    
    if (currentSettings.toastsEnabled && channel === 'operation') {
      const toastOptions = {
        description: message,
      };
      switch (level) {
        case 'success':
          toast.success(action, toastOptions);
          break;
        case 'error':
          toast.error(action, toastOptions);
          break;
        case 'warning':
          toast.warning(action, toastOptions);
          break;
        case 'info':
        default:
          toast.info(action, toastOptions);
          break;
      }
    }

    if (currentSettings.fileEnabled) {
      persistLog(entry);
    }
    
    if (currentSettings.consoleEnabled) {
      console.log(`[Logger][${source}][${channel}][${level}] ${action}: ${message}`);
    }
  }, [settings]);

  const logInfo = useCallback((action: string, message: string, options?: LogOptions) => createLog('info', action, message, options), [createLog]);
  const logSuccess = useCallback((action: string, message: string, options?: LogOptions) => createLog('success', action, message, options), [createLog]);
  const logWarning = useCallback((action: string, message: string, options?: LogOptions) => createLog('warning', action, message, options), [createLog]);
  const logError = useCallback((action: string, message: string, options?: LogOptions) => createLog('error', action, message, options), [createLog]);

  return (
    <LoggerContext.Provider value={{ logs, settings, updateLoggerSettings, resetLoggerSettings, logInfo, logSuccess, logWarning, logError }}>
      <Toaster 
        position="bottom-right" 
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: '#171717',
            color: '#ffffff',
            border: '1px solid #262626',
            borderRadius: '0.5rem',
          },
          classNames: {
            closeButton: '!bg-transparent !border-none !text-white/70 hover:!text-yellow-300 !static !translate-x-0 !translate-y-0 transition-colors',
            description: '!text-white/60',
            title: '!text-yellow-300 !font-semibold',
            icon: '!text-yellow-300',
          }
        }} 
      />
      {children}
    </LoggerContext.Provider>
  );
};

export const useAppLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useAppLogger must be used within a LoggerProvider');
  }
  return context;
};
