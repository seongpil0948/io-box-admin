import { Timestamp } from "@firebase/firestore";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

type TIME_FORMATS = "DAY" | "MIN";
const TIME_FORMATS = Object.freeze({
  DAY: "yyyy-MM-dd",
  MIN: "yyyy-MM-dd HH:mm",
});

export const formatDate = (t: Date, f: TIME_FORMATS = "DAY") =>
  format(t, TIME_FORMATS[f], { locale: ko });
export const getCurrDate = (f: TIME_FORMATS = "DAY") =>
  formatDate(new Date(), f);
export const timeToDate = (t: any, f: TIME_FORMATS = "DAY") =>
  formatDate(new Date(t), f);

export function loadDate(
  d: Date | { [x: string]: number } | string | undefined
): Date {
  if (!d) return new Date();
  else if (d instanceof Date) return d;
  else if (typeof d === "string") return parseISO(d);
  else if (typeof d === "number") return Timestamp.fromMillis(d).toDate();
  else if (d.seconds && d.nanoseconds)
    return new Timestamp(d.seconds, d.nanoseconds).toDate();
  else if (
    Object.keys(d).includes("seconds") &&
    Object.keys(d).includes("nanoseconds")
  )
    return new Timestamp(d.seconds, d.nanoseconds).toDate();
  else if (d.seconds && d.constructor.name === "ut")
    return new Timestamp(d.seconds + 60 * 60 * 15, d.nanoseconds).toDate();
  else throw Error("Fail to load Date " + JSON.stringify(d));
}
