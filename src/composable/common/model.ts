import { dateToTimeStamp } from "@io-boxies/js-lib";

export class CommonField {
  createdAt?: Date;
  updatedAt?: Date;
  constructor(createdAt?: Date, updatedAt?: Date) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }
  toJson(): { [x: string]: Partial<unknown> } {
    return CommonField.toJson(this);
  }
  static toJson(c: any) {
    const dateKeys: string[] = [];
    Object.entries(c).forEach(([k, v]) => {
      if (
        v instanceof Date ||
        Object.prototype.toString.call(v) === "[object Date]"
      ) {
        dateKeys.push(k);
      }
    });
    const j = JSON.parse(JSON.stringify(c));
    dateKeys.forEach((dk) => {
      j[dk] = dateToTimeStamp(j[dk]);
    });
    return j;
  }
  update(): Promise<void> {
    throw Error("not implement error");
  }
  // public abstract copyWith(d: any): T;
  // public abstract fromJson(d: any): T;
}
