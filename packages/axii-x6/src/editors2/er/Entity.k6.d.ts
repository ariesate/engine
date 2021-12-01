export default interface IExample {
    /**
     * 页面名称
     */
    name: string;
    /**
     * 字段
     */
    fields: Array<{
      /**
       * id
       */
      id: string;
      /**
       * 名称
       */
      name: string;
      /**
       * 字段类型
       */
      type: 'string' | 'rel';
      /**
       * 集合
       */
      isCollection: boolean;
    }>;
  }