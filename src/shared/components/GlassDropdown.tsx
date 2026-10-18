import type React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'

export interface GlassDropdownOption<T extends string | number = string> {
  value: T
  label: string
  description?: string
  icon?: React.ReactNode
  badge?: string
  badgeColor?: string
  disabled?: boolean
}

export interface GlassDropdownProps<T extends string | number = string> {
  id?: string
  label?: string
  headerTitle?: string
  value: T
  options: GlassDropdownOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  menuClassName?: string
  align?: 'left' | 'right'
  direction?: 'down' | 'up' | 'auto'
}

export function GlassDropdown<T extends string | number = string>({
  id,
  label,
  headerTitle,
  value,
  options,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  align = 'left',
  direction = 'auto',
}: GlassDropdownProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [calculatedDirection, setCalculatedDirection] = useState<'down' | 'up'>('down')

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsListRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const selectedIndex = options.findIndex((opt) => opt.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const openDropdown = useCallback(() => {
    if (disabled) return
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    if (direction === 'up' || direction === 'down') {
      setCalculatedDirection(direction)
    } else if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setCalculatedDirection(spaceBelow < 260 && spaceAbove > spaceBelow ? 'up' : 'down')
    }
    setIsOpen(true)
  }, [disabled, selectedIndex, direction])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }, [isOpen, closeDropdown, openDropdown])

  // Close dropdown on click outside
  useClickOutside(containerRef, () => {
    if (isOpen) {
      closeDropdown()
    }
  })

  // Auto-scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [isOpen, focusedIndex])

  const handleSelect = useCallback(
    (optionValue: T) => {
      onChange(optionValue)
      closeDropdown()
      triggerRef.current?.focus()
    },
    [onChange, closeDropdown]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        if (!isOpen) {
          openDropdown()
        } else {
          setFocusedIndex((prev) => (prev + 1 >= options.length ? 0 : prev + 1))
        }
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (!isOpen) {
          openDropdown()
        } else {
          setFocusedIndex((prev) => (prev - 1 < 0 ? options.length - 1 : prev - 1))
        }
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (isOpen && focusedIndex >= 0 && options[focusedIndex] && !options[focusedIndex].disabled) {
          handleSelect(options[focusedIndex].value)
        } else if (!isOpen) {
          openDropdown()
        }
        break
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault()
          closeDropdown()
          triggerRef.current?.focus()
        }
        break
      }
      case 'Tab': {
        if (isOpen) {
          closeDropdown()
        }
        break
      }
      default:
        break
    }
  }

  const isUpward = calculatedDirection === 'up'

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-300 mb-1.5 cursor-pointer"
          onClick={() => triggerRef.current?.focus()}
        >
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
        className={`glass-dropdown-trigger h-10 w-full flex items-center justify-between px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] border-0 outline-none ring-0 shadow-[0_1px_3px_rgba(20,20,19,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${
          isOpen
            ? 'bg-[#fcfbf9] text-[#141413] dark:bg-[#35312b] dark:text-[#faf9f5]'
            : 'bg-white hover:bg-[#faf9f5] text-[#141413] dark:bg-[#2b2824] dark:hover:bg-[#35312b] dark:text-[#faf9f5]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {selectedOption?.badge && (
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                selectedOption.badgeColor || 'bg-black/5 dark:bg-white/10 text-[#383531] dark:text-slate-300'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 opacity-60 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isOpen ? 'rotate-180 text-[var(--accent-color)] opacity-100' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Floating Glass Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: isUpward ? 6 : -6,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: isUpward ? 4 : -4,
              scale: 0.97,
            }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: isUpward ? 'bottom' : 'top' }}
            className={`glass-dropdown-menu absolute z-50 ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${
              align === 'right' ? 'w-56 sm:w-64' : 'w-full'
            } ${
              isUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } bg-white dark:bg-[#252320] rounded-2xl p-1 shadow-[0_16px_40px_rgba(20,20,19,0.15)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.85)] border-0 outline-none ring-0 max-h-[300px] overflow-y-auto scrollbar-none ${menuClassName}`}
          >
            {headerTitle && (
              <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] select-none">
                {headerTitle}
              </div>
            )}

            <div
              ref={optionsListRef}
              className="py-0.5 px-0.5 space-y-0.5"
              role="listbox"
              tabIndex={-1}
            >
              {options.map((option, idx) => {
                const isSelected = option.value === value
                const isFocused = idx === focusedIndex

                return (
                  <button
                    key={String(option.value)}
                    ref={(el) => {
                      itemRefs.current[idx] = el
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer rounded-xl border-0 outline-none ${
                      isSelected
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-xs'
                        : isFocused
                        ? 'bg-black/5 dark:bg-white/10 text-[#141413] dark:text-white'
                        : 'text-[#141413] dark:text-[#ece6dc] hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {option.icon && (
                        <span className="shrink-0 flex items-center justify-center opacity-85">
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate leading-tight">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {option.badge && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                            option.badgeColor || 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent-color)] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
