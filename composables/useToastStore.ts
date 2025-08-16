type Color = 'info' | 'warning' | 'error';

export const useToastStore = defineStore(
  'toastStore',
  () => {
    // state
    const state = ref<{ message: string; color: Color | undefined }>({
      message: '',
      color: undefined,
    });

    // getters
    const toast = computed(() => {
      return state.value;
    });

    // setters
    function setToast(message: string, color?: Color | undefined) {
      state.value.message = message;
      state.value.color = color ?? 'info';
    }

    return { toast, setToast };
  },
  {
    persist: {
      storage: persistedState.localStorage,
    },
  }
);
