import { useState, useCallback, useRef } from 'react';
import { ConfiguratorProject } from './types';

export function useHistory(initialPresent: ConfiguratorProject) {
  const [past, setPast] = useState<ConfiguratorProject[]>([]);
  const [present, setPresent] = useState<ConfiguratorProject>(initialPresent);
  const [future, setFuture] = useState<ConfiguratorProject[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Use ref to hold current present for synchronous shortcut access
  const presentRef = useRef(present);
  presentRef.current = present;

  const pastRef = useRef(past);
  pastRef.current = past;

  const futureRef = useRef(future);
  futureRef.current = future;

  // Push new state into history
  const set = useCallback((newPresentOrFn: ConfiguratorProject | ((prev: ConfiguratorProject) => ConfiguratorProject), shouldRecordHistory = true) => {
    const nextPresent = typeof newPresentOrFn === 'function' ? newPresentOrFn(presentRef.current) : newPresentOrFn;
    
    // If not recording history (e.g. continuous drag), just update present
    if (!shouldRecordHistory) {
      setPresent(nextPresent);
      return;
    }

    setPast((prevPast) => {
      // Keep maximum 50 steps
      const updated = [...prevPast, presentRef.current];
      if (updated.length > 50) updated.shift();
      return updated;
    });
    setPresent(nextPresent);
    setFuture([]); // clear redo stack on new action
  }, []);

  // Undo (Ctrl+Z)
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const previous = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    setPast(newPast);
    setFuture((prevFuture) => [presentRef.current, ...prevFuture]);
    setPresent(previous);
  }, []);

  // Redo (Ctrl+Y or Ctrl+Shift+Z)
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const next = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);

    setPast((prevPast) => [...prevPast, presentRef.current]);
    setFuture(newFuture);
    setPresent(next);
  }, []);

  // Reset history completely (e.g. when loading a new template)
  const reset = useCallback((newProject: ConfiguratorProject) => {
    setPast([]);
    setPresent(newProject);
    setFuture([]);
  }, []);

  return {
    state: present,
    setState: set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
}
