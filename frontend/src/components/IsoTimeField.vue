<template>
  <div ref="root" class="iso-field">
    <div class="iso-input-wrap">
      <input
        :value="modelValue"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder"
        pattern="([01]\d|2[0-3]):[0-5]\d"
        maxlength="5"
        :required="required"
        :disabled="disabled"
        @input="onInput"
        @focus="openPicker"
        @click="openPicker"
        @keydown="handleInputKeydown"
      />
      <button type="button" class="picker-toggle" :disabled="disabled" aria-label="Open time picker" @click="togglePicker">
        🕒
      </button>
    </div>

    <div v-if="open" class="picker-popover">
      <div class="time-selectors">
        <label>
          Hour
          <select v-model="draftHour">
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
          </select>
        </label>
        <label>
          Minute
          <select v-model="draftMinute">
            <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
          </select>
        </label>
      </div>
      <button type="button" class="apply-btn" @click="applyTime">Set</button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'HH:MM' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
const draftHour = ref('08')
const draftMinute = ref('00')

function onInput(event) {
  emit('update:modelValue', formatIsoTimeInput(event.target.value))
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
  syncDraftToValue()
  open.value = true
}

function togglePicker() {
  if (open.value) {
    open.value = false
    return
  }
  openPicker()
}

function syncDraftToValue() {
  if (!isValidIsoTime(props.modelValue)) return
  const [hour, minute] = props.modelValue.split(':')
  draftHour.value = hour
  draftMinute.value = minute
}

function applyTime() {
  emit('update:modelValue', `${draftHour.value}:${draftMinute.value}`)
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

function formatIsoTimeInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function isValidIsoTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '')
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

.picker-toggle {
  padding: 0.35rem 0.55rem;
  line-height: 1;
}

.picker-popover {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 20;
  width: 14rem;
  padding: 0.75rem;
  border: 1px solid #d8e6dc;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(27, 67, 50, 0.14);
}

.time-selectors {
  display: grid;
  gap: 0.65rem;
}

.time-selectors label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.82rem;
  color: #4b5563;
}

.time-selectors select {
  min-width: 0;
  width: 100%;
}

.apply-btn {
  margin-top: 0.75rem;
  width: 100%;
}
</style>
