<!--
  PhoneCallSheet – bottom-sheet / dialog for selecting a phone number to call.

  Usage:
    <PhoneCallSheet :phone="provider.phone" />

  If the provider has only one valid number the component renders a plain <a>
  (tel: link) that calls immediately on tap/click.  If there are multiple
  numbers it renders a trigger button that opens a bottom-sheet listing each
  number as a separate call link.
-->
<script setup>
import { computed, ref } from 'vue'
import { Phone, X } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { parsePhoneNumbers, buildTelLink } from '../utils/maps'

const props = defineProps({
  /** Raw phone string from the provider (may contain multiple numbers). */
  phone: { type: [String, Number], default: null },
  /** Extra CSS classes forwarded to the trigger element. */
  triggerClass: { type: String, default: '' },
  /** When true the trigger only shows the phone icon (no text label). */
  iconOnly: { type: Boolean, default: false },
  /** Label override. Falls back to t('call'). */
  label: { type: String, default: '' },
})

const { t } = useI18n()

const numbers = computed(() => parsePhoneNumbers(props.phone))
const single = computed(() => numbers.value.length === 1)
const open = ref(false)

function openSheet() {
  open.value = true
}
function closeSheet() {
  open.value = false
}
function onOverlayClick() {
  closeSheet()
}
function onKey(e) {
  if (e.key === 'Escape') closeSheet()
}
</script>

<template>
  <!-- nothing to render if no valid numbers -->
  <template v-if="numbers.length === 0"></template>

  <!-- single number → plain tel: anchor, no sheet needed -->
  <a
    v-else-if="single"
    :href="buildTelLink(numbers[0])"
    :class="triggerClass"
    :title="t('call')"
  >
    <slot>
      <Phone class="h-4 w-4" />
      <span v-if="!iconOnly">{{ label || t('call') }}</span>
    </slot>
  </a>

  <!-- multiple numbers → trigger + bottom sheet -->
  <template v-else>
    <button
      type="button"
      :class="triggerClass"
      :title="t('call')"
      @click="openSheet"
    >
      <slot>
        <Phone class="h-4 w-4" />
        <span v-if="!iconOnly">{{ label || t('call') }}</span>
      </slot>
    </button>

    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="open"
          class="fixed inset-0 z-[9999] flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          :aria-label="t('selectNumber')"
          @keydown="onKey"
        >
          <!-- backdrop -->
          <div
            class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            @click="onOverlayClick"
          ></div>

          <!-- sheet panel -->
          <div class="relative w-full max-w-md rounded-t-3xl bg-white pb-safe shadow-2xl dark:bg-slate-900">
            <!-- handle -->
            <div class="flex items-center justify-between px-5 pb-3 pt-4">
              <span class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Phone class="h-4 w-4 text-brand-500" />
                {{ t('selectNumber') }}
              </span>
              <button
                class="icon-btn"
                :aria-label="t('close')"
                @click="closeSheet"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- divider -->
            <div class="h-px bg-slate-100 dark:bg-slate-800"></div>

            <!-- number list -->
            <ul class="divide-y divide-slate-100 dark:divide-slate-800">
              <li v-for="(num, idx) in numbers" :key="idx">
                <a
                  :href="buildTelLink(num)"
                  class="flex items-center gap-3 px-5 py-4 text-sm font-medium text-brand-600 transition hover:bg-brand-50 active:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-950/50 dark:active:bg-brand-950"
                  dir="ltr"
                  @click="closeSheet"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
                    <Phone class="h-4 w-4" />
                  </span>
                  {{ num }}
                </a>
              </li>
            </ul>

            <!-- cancel button (mobile-friendly) -->
            <div class="px-4 pb-4 pt-2">
              <button
                class="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                @click="closeSheet"
              >
                {{ t('close') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>

<style scoped>
/* Bottom-sheet slide-up animation */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}

/* Safe-area bottom padding for iOS */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
