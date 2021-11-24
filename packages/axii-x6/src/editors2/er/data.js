
const data = {
  "nodes":[
    {
      "id":"_1","name":"Page",
      "data": {
        "fields": [
          {"id":"f1","name":"title","type":"string"},
          {"id":"f2","name":"url","type":"string"},
          {"id":"f3","name":"posts","type":"rel"},
          {"name":"description","type":"string"},
          {"id":"_a","name":"keywords","type":"string","isCollection":true}
        ],
        "d": {
          "d1": "123"
        }
      },
      "view":{"position":{"x":100,"y":100}}
    }, 
    {
      "id":"_2","name":"Post",
      "data": {
        "fields": [
          {"id":"f1","name":"content","type":"string"},
          {"id":"f3","name":"page","type":"rel"},
          {"id":"_a","name":"comments","type":"rel"}
        ]
      },
      "view":{"x":460,"y":140}
    },{"id":"_a","name":"Comment","view":{"x":710,"y":390}, "data": {
        "fields":[ 
          {"id":"_b","name":"target","type":"rel"},{"id":"_c","name":"content","type":"string"},{"id":"_d","name":"comments","type":"rel"}
        ]
      }
    }
  ],
  "edges":[
    {
      "id":"r1","name":"has","type":"1:n",
      "source":{"entity":"_1","field":"f3"},
      "target":{"entity":"_2","field":"f3"},
      "view":{"sourcePortSide":"right","targetPortSide":"left"}
    }, {"id":"6bcc4b95-d6b1-4db2-9de1-2cd885d715cb","name":"has","type":"1:n","source":{"entity":"_2","field":"_a"},"target":{"entity":"_a","field":"_b"},"view":{"sourcePortSide":"right","targetPortSide":"left"}},{"id":"b6a3bc7f-d1a7-480c-a11c-76d23dfb5e7e","name":"has","type":"1:n","source":{"entity":"_a","field":"_d"},"target":{"entity":"_a","field":"_b"},"view":{"sourcePortSide":"right","targetPortSide":"right"}}
  ]
};
export default data;

