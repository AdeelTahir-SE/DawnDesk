import React, { createContext, useContext, useCallback, ReactNode, useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { writeTextFile, BaseDirectory, mkdir, exists } from '@tauri-apps/plugin-fs';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  message: string;
}

interface LoggerContextType {
  logs: LogEntry[];
  logInfo: (action: string, message: string) => void;
  logSuccess: (action: string, message: string) => void;
  logWarning: (action: string, message: string) => void;
  logError: (action: string, message: string) => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

const LOG_FILE_NAME = 'dawndesk_activity.log';

export const LoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

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

  const persistLog = async (entry: LogEntry) => {
    try {
      const logString = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.action} - ${entry.message}\n`;
      await writeTextFile(LOG_FILE_NAME, logString, { baseDir: BaseDirectory.AppLocalData, append: true });
    } catch (error) {
      console.error('Failed to write log to file', error);
    }
  };

  const createLog = useCallback((level: LogLevel, action: string, message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
    };
    
    // Add to state
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100
    
    // Display Toast
    switch (level) {
      case 'success':
        toast.success(action, { description: message });
        break;
      case 'error':
        toast.error(action, { description: message });
        break;
      case 'warning':
        toast.warning(action, { description: message });
        break;
      case 'info':
      default:
        toast.info(action, { description: message });
        break;
    }

    // Persist Log
    persistLog(entry);
    
    // Also log to console for dev mode
    console.log(`[Logger][${level}] ${action}: ${message}`);
  }, []);

  const logInfo = useCallback((action: string, message: string) => createLog('info', action, message), [createLog]);
  const logSuccess = useCallback((action: string, message: string) => createLog('success', action, message), [createLog]);
  const logWarning = useCallback((action: string, message: string) => createLog('warning', action, message), [createLog]);
  const logError = useCallback((action: string, message: string) => createLog('error', action, message), [createLog]);

  return (
    <LoggerContext.Provider value={{ logs, logInfo, logSuccess, logWarning, logError }}>
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
