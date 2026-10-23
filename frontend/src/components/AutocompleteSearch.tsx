import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, Search } from 'lucide-react';
import { api, type AutocompleteSuggestion, type AutocompleteSuggestionType } from '../services/api';

interface AutocompleteSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  placeholder: string;
  allowedTypes?: AutocompleteSuggestionType[];
  minQueryLength?: number;
  limit?: number;
  className?: string;
  inputClassName?: string;
}

export default function AutocompleteSearch({
  value,
  onChange,
  onSelect,
  placeholder,
  allowedTypes,
  minQueryLength = 2,
  limit = 10,
  className = '',
  inputClassName = '',
}: AutocompleteSearchProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestVersion = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const query = value.trim();
  const allowedTypeKey = allowedTypes?.join('|') ?? '';

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const version = ++requestVersion.current;
    if (query.length < minQueryLength) {
      setSuggestions([]);
      setError('');
      setIsLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.autocomplete(query, limit);
        if (version !== requestVersion.current) return;
        const next = Array.isArray(response?.suggestions) ? response.suggestions : [];
        setSuggestions(next.filter((item): item is AutocompleteSuggestion =>
          Boolean(item && typeof item.text === 'string' && typeof item.id === 'string' && typeof item.type === 'string')
          && (!allowedTypes || allowedTypes.includes(item.type as AutocompleteSuggestionType))
        ));
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        if (version === requestVersion.current) {
          setSuggestions([]);
          setError('Suggestions are temporarily unavailable.');
          setIsOpen(true);
        }
      } finally {
        if (version === requestVersion.current) setIsLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [allowedTypeKey, limit, minQueryLength, query]);

  const choose = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.text);
    onSelect(suggestion);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOpen(false);
      }}
    >
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(event) => { onChange(event.target.value); setIsOpen(true); }}
        onFocus={() => { if (query.length >= minQueryLength) setIsOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className={`w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043] focus:outline-none ${inputClassName}`}
      />
      {isLoading && <LoaderCircle className="w-4 h-4 text-teal-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" aria-label="Loading suggestions" />}
      {isOpen && query.length >= minQueryLength && (
        <div id={listId} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {error ? <p className="px-3 py-2.5 text-xs text-rose-700">{error}</p> : suggestions.length === 0 && !isLoading ? <p className="px-3 py-2.5 text-xs text-slate-500">No matching suggestions.</p> : suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
              className={`w-full px-3 py-2.5 text-left text-xs border-b last:border-0 border-slate-100 ${activeIndex === index ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
            >
              <span className="font-semibold text-slate-900">{suggestion.text}</span>
              <span className="ml-2 text-[10px] font-bold text-teal-700">{suggestion.type.replace('_', ' ')}</span>
              {Object.values(suggestion.metadata || {}).filter((item) => typeof item === 'string' || typeof item === 'number').length > 0 && (
                <span className="block mt-0.5 text-[10px] text-slate-500">
                  {Object.values(suggestion.metadata || {}).filter((item) => typeof item === 'string' || typeof item === 'number').join(' · ')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
