export default interface IExample {
  /**
   * 字段
   */
  fields: Array<{
      id: string;
      name: string;
      rel: boolean;
  }>;
  /**
   * @name 用户
   */
  w: string,
  /**
   * @name 活动id
   */
  b: boolean,
  c: number;
  d: {
      /**
       * @name 属性
       */
      d1: number;
  },
  e: {
      e1: boolean;
  }[];
  f: Array<{
      f1: number;
  }>;
  h: string[];
}