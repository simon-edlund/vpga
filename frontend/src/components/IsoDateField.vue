<template>
  <div ref="root" class="iso-field">
    <div class="iso-input-wrap">
      <input
        :value="modelValue"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder"
        pattern="\d{4}-\d{2}-\d{2}"
        maxlength="10"
        :required="required"
        :disabled="disabled"
        @input="onInput"
        @focus="openPicker"
        @click="openPicker"
        @keydown="handleInputKeydown"
      />
      <button type="button" class="picker-toggle" :disabled="disabled" aria-label="Open date picker" @click="togglePicker">
        📅
      </button>
    </div>

    <div v-if="open" class="picker-popover">
      <div class="picker-header">
        <button type="button" class="picker-nav" aria-label="Previous month" @click="changeMonth(-1)">‹</button>
        <strong>{{ monthLabel }}</strong>
        <button type="button" class="picker-nav" aria-label="Next month" @click="changeMonth(1)">›</button>
      </div>

      <div class="weekday-row">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>

      <div class="day-grid">
        <template v-for="cell in calendarCells" :key="cell.key">
          <span v-if="!cell.iso" class="day-cell empty"></span>
          <button
            v-else
            type="button"
            class="day-cell"
            :class="{ selected: cell.iso === modelValue, today: cell.iso === todayIso }"
            @click="selectDay(cell.iso)"
          >
            {{ cell.day }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'YYYY-MM-DD' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const todayIso = getTodayIso()

const parsedValue = computed(() => parseIsoDate(props.modelValue))
const viewedYear = ref(parsedValue.value?.year ?? new Date().getFullYear())
const viewedMonth = ref((parsedValue.value?.month ?? new Date().getMonth() + 1) - 1)

const monthLabel = computed(() => `${viewedYear.value}-${String(viewedMonth.value + 1).padStart(2, '0')}`)

const calendarCells = computed(() => buildCalendarCells(viewedYear.value, viewedMonth.value))

watch(parsedValue, value => {
  if (!value) return
  viewedYear.value = value.year
  viewedMonth.value = value.month - 1
})

function onInput(event) {
  emit('update:modelValue', formatIsoDateInput(event.target.value))
}

function handleInputKeydown(event) {
  if (event.key === 'ArrowDown' || event.key === 'Enter') {
    event.preventDefault()
    openPicker()
    return
  }

  if (event.key === 'Escape') {
    open.value = false
  }
}

function openPicker() {
  if (props.disabled) return
  syncCalendarToValue()
  open.value = true
}

function togglePicker() {
  if (open.value) {
    open.value = false
    return
  }
  openPicker()
}

function syncCalendarToValue() {
  if (!parsedValue.value) return
  viewedYear.value = parsedValue.value.year
  viewedMonth.value = parsedValue.value.month - 1
}

function changeMonth(offset) {
  const nextMonth = viewedMonth.value + offset
  if (nextMonth < 0) {
    viewedYear.value -= 1
    viewedMonth.value = 11
    return
  }
  if (nextMonth > 11) {
    viewedYear.value += 1
    viewedMonth.value = 0
    return
  }
  viewedMonth.value = nextMonth
}

function selectDay(iso) {
  emit('update:modelValue', iso)
  open.value = false
}

function handleDocumentClick(event) {
  if (root.value && !root.value.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})

function formatIsoDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

function buildCalendarCells(year, monthIndex) {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const firstDayOffset = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7
  const cells = []

  for (let i = 0; i < firstDayOffset; i += 1) {
    cells.push({ key: `empty-${i}` })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `${year}-${monthIndex + 1}-${day}`,
      day,
      iso: formatIsoDate(year, monthIndex + 1, day),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}` })
  }

  return cells
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function formatIsoDate(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayIso() {
  const today = new Date()
  return formatIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
}
</script>

<style scoped>
.iso-field {
  position: relative;
  display: inline-block;
}

.iso-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.picker-toggle,
.picker-nav {
  padding: 0.35rem 0.55rem;
  line-height: 1;
}

.picker-popover {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 20;
  width: 18rem;
  padding: 0.75rem;
  border: 1px solid #d8e6dc;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(27, 67, 50, 0.14);
}

.picker-header,
.weekday-row,
.day-grid {
  display: grid;
}

.picker-header {
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.picker-header strong {
  text-align: center;
  color: #1b4332;
}

.weekday-row,
.day-grid {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
}

.weekday-row {
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  color: #6b7280;
  text-align: center;
}

.day-cell {
  width: 100%;
  min-height: 2.1rem;
  padding: 0;
  border-radius: 6px;
}

.day-cell.empty {
  background: transparent;
}

.day-cell.today {
  outline: 1px solid #2d6a4f;
  outline-offset: -1px;
}

.day-cell.selected {
  background: #1b4332;
}
</style>
