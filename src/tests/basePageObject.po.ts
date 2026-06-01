export interface BasePageObjectProps {
  debug?: boolean;
  raiseOnFind?: boolean;
}

export class BasePageObject {
  debug: boolean;
  raiseOnFind: boolean;

  constructor({ debug = false, raiseOnFind = false } = {}) {
    this.debug = debug;
    this.raiseOnFind = raiseOnFind;
  }
}
