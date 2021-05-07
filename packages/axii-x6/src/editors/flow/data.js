const data = [
  {
    "type": "event",
    "id": "_1",
    "name": "A 申请好友",
    "nextParallelBranches": [
      {
        "id": "p11",
        "conditionBranches": [
          {
            "name": "l1",
            "id": "l1",
            "target": {
              "id": "1620287987690-36124"
            }
          }
        ]
      }
    ],
    "view": {
      "position": {
        "x": 210,
        "y": 180
      }
    }
  },
  {
    "id": "1620287987690-36124",
    "shape": "response-node",
    "view": {
      "position": {
        "x": 210,
        "y": 310
      }
    },
    "name": "发送消息",
    "nextParallelBranches": [
      {
        "name": "同意",
        "id": "1620291994934-2092",
        "conditionBranches": [
          {
            "name": "1",
            "id": "1620291994934-915",
            "target": {
              "id": "1620292497911-36364"
            }
          }
        ]
      },
      {
        "name": "拒绝",
        "id": "1620292004915-30512",
        "conditionBranches": [
          {
            "name": "1",
            "id": "1620292004915-99588",
            "target": {
              "id": "1620292509470-95836"
            }
          }
        ]
      },
      {
        "name": "取消",
        "id": "1620292579191-54126",
        "conditionBranches": [
          {
            "name": "1",
            "id": "1620292579192-46128",
            "target": {
              "id": "1620292530704-23569"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "1620292497911-36364",
    "shape": "event-node",
    "view": {
      "position": {
        "x": 100,
        "y": 450
      }
    },
    "name": "B同意",
    "nextParallelBranches": [
      {
        "name": "",
        "id": "1620292613427-49840",
        "conditionBranches": [
          {
            "name": "",
            "id": "1620292613427-35976",
            "target": {
              "id": "1620292601916-22827"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "1620292509470-95836",
    "shape": "event-node",
    "view": {
      "position": {
        "x": 210,
        "y": 450
      }
    },
    "name": "B拒绝",
    "nextParallelBranches": [
      {
        "name": "",
        "id": "1620292620815-44319",
        "conditionBranches": [
          {
            "name": "",
            "id": "1620292620815-32390",
            "target": {
              "id": "1620292609891-95314"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "1620292530704-23569",
    "shape": "event-node",
    "view": {
      "position": {
        "x": 320,
        "y": 450
      }
    },
    "name": "A取消",
    "nextParallelBranches": [
      {
        "name": "",
        "id": "1620292624782-50045",
        "conditionBranches": [
          {
            "name": "",
            "id": "1620292624782-53427",
            "target": {
              "id": "1620292609891-95314"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "1620292601916-22827",
    "shape": "response-node",
    "view": {
      "position": {
        "x": 100,
        "y": 539
      }
    },
    "name": "建立关系",
    "nextParallelBranches": [
      {
        "name": "",
        "id": "1620292629310-12193",
        "conditionBranches": [
          {
            "name": "",
            "id": "1620292629310-79689",
            "target": {
              "id": "1620292609891-95314"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "1620292609891-95314",
    "shape": "end-node",
    "view": {
      "position": {
        "x": 215,
        "y": 626
      }
    },
    "name": "X"
  }
]; export default data;