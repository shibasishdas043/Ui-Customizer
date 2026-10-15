import type { FormattedTime, GreetingType } from '../types'

export function formatTime(date: Date, use24Hour: boolean): FormattedTime {
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  let period = ''

  if (!use24Hour) {
    period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
  }

  const hoursStr = use24Hour ? hours.toString().padStart(2, '0') : hours.toString()

  const dateString = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return {
    hours: hoursStr,
    minutes,
    seconds,
    period,
    dateString,
  }
}

export function getGreetingType(date: Date): { type: GreetingType; text: string } {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return { type: 'morning', text: 'Good morning' }
  } else if (hour >= 12 && hour < 17) {
    return { type: 'afternoon', text: 'Good afternoon' }
  } else if (hour >= 17 && hour < 22) {
    return { type: 'evening', text: 'Good evening' }
  } else {
    return { type: 'night', text: 'Good night' }
  }
}
