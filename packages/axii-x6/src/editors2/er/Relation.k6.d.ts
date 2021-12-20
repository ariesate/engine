export default interface Relation {
    /**
     * 名称
     */
    name: string;
    /**
     * 类型
     */
    type: '1:1' | '1:n' | 'n:1' | 'n:n';
  }