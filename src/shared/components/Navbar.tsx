import React from 'react'
import { motion } from 'framer-motion'

interface NavbarProps {
  onOpenSettings?: () => void
  isAnalogClock: boolean
  weatherSlot?: React.ReactNode
  clockSlot?: React.ReactNode
}

export const Navbar: React.FC<NavbarProps> = ({
  isAnalogClock,
  weatherSlot,
  clockSlot,
}) => {
  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 select-none pointer-events-none"
    >
      {/* Top Left Slot: Clean (when Analog, as weather is merged in center) OR Digital Clock (when Digital) */}
      <div className="flex items-center min-h-[44px] pointer-events-auto">
        {!isAnalogClock && clockSlot}
      </div>

      {/* Top Right Slot: Clean (when Analog) OR Weather (when Digital) */}
      <div className="flex items-center min-h-[44px] pointer-events-auto">
        {!isAnalogClock && weatherSlot}
      </div>
    </motion.header>
  )
}
