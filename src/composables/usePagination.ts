import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
export function usePagination<T>(
  source: MaybeRefOrGetter<readonly T[]>,
  filters: MaybeRefOrGetter<unknown>[] = [],
  size = 10,
) {
  const page = ref(1);
  const total = computed(() => toValue(source).length);
  const pages = computed(() => Math.max(1, Math.ceil(total.value / size)));
  const currentPage = computed(() =>
    Math.min(Math.max(1, page.value), pages.value),
  );
  const entries = computed(() =>
    toValue(source).slice(
      (currentPage.value - 1) * size,
      currentPage.value * size,
    ),
  );
  watch(pages, () => {
    page.value = currentPage.value;
  });
  watch(
    () => filters.map((filter) => toValue(filter)),
    () => {
      page.value = 1;
    },
  );
  return { page, total, entries, pageSize: size };
}
