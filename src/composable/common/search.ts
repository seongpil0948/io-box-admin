import { ioFire } from "@/plugin/firebase";
import { logEvent, getAnalytics } from "@firebase/analytics";
import { ref, Ref, computed } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useMessage } from "naive-ui";
import { subDays } from "date-fns";
import {
  QueryFieldFilterConstraint,
  Timestamp,
  where,
} from "firebase/firestore";

export function useElasticSearch(d: {
  onSearch: (result: any) => void;
  makeParam: (val: string) => any;
  funcName: string;
}) {
  const searchInputVal = ref<string | null>(null);
  const searchVal = ref<string | null>(null);
  const searchData = ref<any[]>([]);
  const msg = useMessage();

  async function search() {
    searchVal.value = searchInputVal.value;
    const functions = getFunctions(ioFire.app, "asia-northeast3");
    const searchFunc = httpsCallable(functions, d.funcName);
    const param = d.makeParam(searchVal.value ?? "");
    return searchFunc({ searchParam: param })
      .then(d.onSearch)
      .catch((err) => console.error(`error in ${d.funcName}`, err));
  }
  return {
    searchInputVal,
    searchVal,
    searchData,
    search,
    msg,
  };
}

interface IoSearchParam<T> {
  data: Ref<T[]>;
  filterFunc: (data: T, searchVal: string | null) => boolean;
}

export function useSearch<T>(p: IoSearchParam<T>) {
  const searchInputVal = ref<string | null>(null);
  const searchVal = ref<string | null>(null);
  const searchedData = computed(() =>
    p.data.value.filter((e) => p.filterFunc(e, searchVal.value))
  );
  function search() {
    searchVal.value = searchInputVal.value;
    if (searchVal.value && searchVal.value.length > 1) {
      logEvent(getAnalytics(ioFire.app), "search_vendor_prod", {
        search_term: searchVal.value,
      });
    }
  }

  return { searchedData, search, searchInputVal };
}

export function useCalenderSearch() {
  const today = Date.now();
  const message = useMessage();
  const startDate = subDays(today, 1);
  const valueFormat = "yyyy-MM-dd";
  const createdRange = ref<[number, number]>([startDate.valueOf(), today]);
  function onChange(v: number) {
    message.info("onChange " + v);
  }
  function onClear() {
    message.info("onClear ");
  }
  function onConfirm(value: number | number[] | null) {
    message.info("onConfirm");
    console.log("Confirm-5 " + value);
    if (!Array.isArray(value)) return;
  }
  function onBlur() {
    message.warning("Blur-3");
  }

  const millisToDate = (d: number) => Timestamp.fromMillis(d).toDate();
  function getConstraints() {
    const constraints: QueryFieldFilterConstraint[] = [];
    constraints.push(
      where("createdAt", ">=", Timestamp.fromMillis(createdRange.value[0]))
      // where(
      //   "createdAt.seconds",
      //   ">=",
      //   Timestamp.fromMillis(opt.createdRange[0]).seconds
      // )
    );
    constraints.push(
      where("createdAt", "<=", Timestamp.fromMillis(createdRange.value[1]))
    );
    return constraints;
  }
  return {
    today,
    message,
    startDate,
    valueFormat,
    createdRange,
    onChange,
    onClear,
    onConfirm,
    onBlur,
    millisToDate,
    getConstraints,
  };
}
