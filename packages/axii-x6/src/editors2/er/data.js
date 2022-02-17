
const data = {
  "nodes": [
    {
      "id": "_1", "name": "Page",
      "data": {
        "name": "Page",
        "fields": [
          { "id": "f1", "name": "title", "type": "string" },
          { "id": "f2", "name": "url", "type": "string" },
          { "id": "f3", "name": "posts", "type": "rel" },
          { "name": "description", "type": "string" },
          { "id": "_a", "name": "keywords", "type": "string", "isCollection": true }
        ],
        "d": {
          "d1": "123"
        }
      },
      "view": { "position": { "x": 100, "y": 100 } }
    },
    {
      "id": "_2", "name": "Post",
      "data": {
        "name": "Post",
        "fields": [
          { "id": "f1", "name": "content", "type": "string" },
          { "id": "f3", "name": "page", "type": "rel" },
          { "id": "_b", "name": "comments", "type": "rel" }
        ]
      },
      "view": { "x": 660, "y": 140 },
      "height":200,
      "width":200
    }
  ],
  "edges": [
    {
      "id": "_1", "name": "has", "type": "1:n",
      "source": { "cell": "_1", "port": "f3-right" },
      "target": { "cell": "_2", "port": "_b-left" }
    }
  ]
};
export default data;

