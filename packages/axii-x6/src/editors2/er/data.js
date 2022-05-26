const data = {
    "entities": [
      {
        "id": "1634893564933-93656",
        "name": "Product",
        "view": {
          "x": 460,
          "y": 50
        },
        "fields": [
          {
            "id": "1634893589516-69864",
            "name": "creator",
            "type": "rel"
          },
          {
            "id": "1634893598216-33591",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634893725195-48475",
            "name": "description",
            "type": "string"
          },
          {
            "id": "1634894934356-79520",
            "name": "members",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1634896346280-30368",
            "name": "versions",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635318903352-52149",
            "name": "children",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1636974763439-17173",
            "name": "parent",
            "type": "rel"
          },
          {
            "id": "1638254374371-83923",
            "name": "codebaseUrl",
            "type": "string"
          },
          {
            "id": "1638426807074-26308",
            "name": "logoBucket",
            "type": "string"
          },
          {
            "id": "1638426829503-7461",
            "name": "logoPath",
            "type": "string"
          },
          {
            "id": "1638426829504-1234",
            "name": "entities",
            "type": "rel"
          },
          {
            "id": "1639375987899-1610",
            "name": "codebase",
            "type": "rel"
          },
          {
            "id": "1641975175951-37578",
            "name": "lcdpAppId",
            "type": "number"
          },
          {
            "id": "1642398963030-63978",
            "name": "teamProjectId",
            "type": "string"
          },
          {
            "id": "1642667478432-37340",
            "name": "fireflyId",
            "type": "string"
          },
          {
            "id": "1643003441095-2392",
            "name": "metGroups",
            "type": "rel"
          },
          {
            "id": "1643338149751-54208",
            "name": "lingoId",
            "type": "string"
          },
          {
            "id": "1643341637294-21139",
            "name": "documents",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1634893806612-90426",
        "name": "ProductVersion",
        "view": {
          "x": 950,
          "y": 180
        },
        "fields": [
          {
            "id": "1634893817720-00001",
            "name": "currentStatus",
            "type": "string",
            "isCollection": false
          },
          {
            "id": "1634893817720-00002",
            "name": "base",
            "type": "number",
            "isCollection": false
          },
          {
            "id": "1634893817720-00003",
            "name": "groups",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1634893817720-60185",
            "name": "creator",
            "type": "rel"
          },
          {
            "id": "1634893847025-26789",
            "name": "product",
            "type": "rel"
          },
          {
            "id": "1634893872418-93252",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634893878833-14167",
            "name": "description",
            "type": "string"
          },
          {
            "id": "1634896475229-68649",
            "name": "resources",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635239223686-79189",
            "name": "status",
            "type": "rel"
          },
          {
            "id": "1635319722042-68912",
            "name": "notice",
            "type": "string"
          },
          {
            "id": "1636622456409-74583",
            "name": "pages",
            "type": "rel"
          },
          {
            "id": "1636622463956-23590",
            "name": "navigations",
            "type": "rel"
          },
          {
            "id": "1636622471824-41417",
            "name": "chunks",
            "type": "rel"
          },
          {
            "id": "1641799454973-19822",
            "name": "useCases",
            "type": "rel"
          },
          {
            "id": "1642399004158-47094",
            "name": "teamSectionId",
            "type": "string"
          },
          {
            "id": "1642399004158-47095",
            "name": "nodeMode",
            "type": "string"
          },
          {
            "id": "1642399004158-47096",
            "name": "hideExternal",
            "type": "boolean"
          },
          {
            "id": "1646191956680-43258",
            "name": "localMetas",
            "type": "rel"
          },
          {
            "id": "1647588942592-45230",
            "name": "modelGroups",
            "type": "rel",
            "isCollection": false
          }
        ]
      },
      {
        "id": "1634893806612-9042600",
        "name": "VersionGroup",
        "view": {
          "x": 1250,
          "y": 180
        },
        "fields": [
          {
            "id": "1634893806612-90426001",
            "name": "version",
            "type": "rel"
          },
          {
            "id": "1634893806612-90426002",
            "name": "name",
            "type": "string"
          }
        ]
      },
      {
        "id": "1634894093742-84692",
        "name": "Page",
        "view": {
          "x": 520,
          "y": 320
        },
        "fields": [
          {
            "id": "1634894156342-83994",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634896023255-63712",
            "name": "chunks",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1634896076167-49392",
            "name": "params",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635254826806-9309",
            "name": "statusSet",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635315486389-64163",
            "name": "navigation",
            "type": "rel"
          },
          {
            "id": "1636380604982-6796",
            "name": "navbars",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1636622695522-74764",
            "name": "version",
            "type": "rel"
          },
          {
            "id": "1636711211859-74904",
            "name": "posX",
            "type": "number"
          },
          {
            "id": "1636711218160-2581",
            "name": "posY",
            "type": "number"
          },
          {
            "id": "1636711223616-121",
            "name": "baseStatus",
            "type": "rel"
          },
          {
            "id": "1639467380320-610",
            "name": "links",
            "type": "rel"
          },
          {
            "id": "1639905945150-46420",
            "name": "lcdpId",
            "type": "number"
          },
          {
            "id": "1639998286826-50247",
            "name": "users",
            "type": "rel"
          },
          {
            "id": "1640152380759-26859",
            "name": "key",
            "type": "string"
          },
          {
            "id": "1640166058077-85904",
            "name": "path",
            "type": "string"
          },
          {
            "id": "1640594609669-40895",
            "name": "designPreviewUrl",
            "type": "string"
          },
          {
            "id": "1642055114682-36395",
            "name": "dollyId",
            "type": "number"
          },
          {
            "id": "1642055114682-36396",
            "name": "tasks",
            "type": "string"
          },
          {
            "id": "1642055114682-36397",
            "name": "isHide",
            "type": "boolean"
          },
          {
            "id": "1642055114682-36398",
            "name": "hideChildren",
            "type": "boolean"
          },
          {
            "id": "1642055114682-36400",
            "name": "childrenNum",
            "type": "number"
          },
          {
            "id": "1642055114682-36401",
            "name": "height",
            "type": "number"
          },
          {
            "id": "1642055114682-36402",
            "name": "width",
            "type": "number"
          },
          {
            "id": "1642055114682-36403",
            "name": "external",
            "type": "boolean"
          }
        ]
      },
      {
        "id": "1634894197650-46396",
        "name": "Link",
        "view": {
          "x": 760,
          "y": 760
        },
        "fields": [
          {
            "id": "1634894258612-89045",
            "name": "source",
            "type": "rel"
          },
          {
            "id": "1634894265962-94092",
            "name": "target",
            "type": "rel"
          },
          {
            "id": "1634894270832-49464",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1636748627078-87375",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1639467393415-60021",
            "name": "page",
            "type": "rel"
          },
          {
            "id": "1639467393415-60022",
            "name": "visible",
            "type": "boolean"
          }
        ]
      },
      {
        "id": "1634894294141-30715",
        "name": "Chunk",
        "view": {
          "x": 480,
          "y": 450
        },
        "fields": [
          {
            "id": "1634894312456-50996",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634896004452-16754",
            "name": "pages",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1634896082203-41905",
            "name": "params",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1636622712658-6672",
            "name": "version",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1634894368200-45735",
        "name": "Param",
        "view": {
          "x": 1730,
          "y": 450
        },
        "fields": [
          {
            "id": "1634894490205-62495",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634894501705-78713",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1634894506026-56235",
            "name": "page",
            "type": "rel"
          },
          {
            "id": "1634894555507-94017",
            "name": "chunk",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1634894582176-23593",
        "name": "Resource",
        "view": {
          "x": 1090,
          "y": 160
        },
        "fields": [
          {
            "id": "1634894859530-78267",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634894867891-50396",
            "name": "link",
            "type": "string"
          },
          {
            "id": "1634895352598-60244",
            "name": "version",
            "type": "rel"
          },
          {
            "id": "1635149582951-43239",
            "name": "creator",
            "type": "rel"
          },
          {
            "id": "1635149675385-51245",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1636006793197-8656",
            "name": "bucket",
            "type": "string"
          },
          {
            "id": "1636006829421-75207",
            "name": "path",
            "type": "string"
          },
          {
            "id": "1636337339909-88617",
            "name": "contentType",
            "type": "string"
          }
        ]
      },
      {
        "id": "1634895401642-39041",
        "name": "User",
        "view": {
          "x": 210,
          "y": 50
        },
        "fields": [
          {
            "id": "1634895411117-12745",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1634895414222-39458",
            "name": "avatar",
            "type": "string"
          },
          {
            "id": "1634895418361-50921",
            "name": "position",
            "type": "string"
          },
          {
            "id": "1634895464658-50843",
            "name": "resources",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1634896183447-3986",
            "name": "versions",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635149388686-89146",
            "name": "email",
            "type": "string"
          },
          {
            "id": "1635228142885-72752",
            "name": "products",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635318178170-82005",
            "name": "department",
            "type": "string"
          },
          {
            "id": "1635905963069-66875",
            "name": "displayName",
            "type": "string"
          },
          {
            "id": "1639998161072-50499",
            "name": "pages",
            "type": "rel"
          },
          {
            "id": "1643341962782-67765",
            "name": "documents",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1635239275116-92203",
        "name": "VersionStatus",
        "view": {
          "x": 640,
          "y": 60
        },
        "fields": [
          {
            "id": "1635239288016-26117",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1635239358797-96532",
            "name": "order",
            "type": "number"
          },
          {
            "id": "1635239368154-37410",
            "name": "version",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1635254846143-22652",
        "name": "PageStatus",
        "view": {
          "x": 600,
          "y": 1080
        },
        "fields": [
          {
            "id": "1635254853576-93649",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1635254858996-23271",
            "name": "page",
            "type": "rel"
          },
          {
            "id": "1636879827607-92816",
            "name": "basePage",
            "type": "rel"
          },
          {
            "id": "1641800687041-28123",
            "name": "pins",
            "type": "rel"
          },
          {
            "id": "1641893843542-30930",
            "name": "proto",
            "type": "string"
          },
          {
            "id": "1641980298473-74538",
            "name": "prevId",
            "type": "number"
          },
          {
            "id": "1642085042891-76422",
            "name": "x",
            "type": "number"
          },
          {
            "id": "1642085045875-46186",
            "name": "y",
            "type": "number"
          },
          {
            "id": "1643169757285-49191",
            "name": "protoDraft",
            "type": "rel"
          },
          {
            "id": "1643289407945-82812",
            "name": "designPreviewUrl",
            "type": "string"
          },
          {
            "id": "1644992917712-85491",
            "name": "width",
            "type": "number"
          },
          {
            "id": "1644992928522-72168",
            "name": "height",
            "type": "number"
          },
          {
            "id": "1648018592420-45028",
            "name": "prevPin",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1635257181430-94279",
        "name": "Navigation",
        "view": {
          "x": 90,
          "y": 510
        },
        "fields": [
          {
            "id": "1635257190913-40228",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1635257232247-5789",
            "name": "children",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635257245165-72295",
            "name": "page",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1635315731418-73548",
            "name": "order",
            "type": "number"
          },
          {
            "id": "1635321637635-52509",
            "name": "href",
            "type": "string"
          },
          {
            "id": "1635926140724-66241",
            "name": "parent",
            "type": "rel"
          },
          {
            "id": "1636011748218-56284",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1636380743974-88715",
            "name": "pages",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1636622703870-60800",
            "name": "version",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1635323274010-34896",
        "name": "UserProduct",
        "view": {
          "x": 130,
          "y": 1480
        },
        "fields": [
          {
            "id": "1635323311770-7129",
            "name": "user",
            "type": "rel"
          },
          {
            "id": "1635323316898-57675",
            "name": "product",
            "type": "rel"
          },
          {
            "id": "1635323332667-55868",
            "name": "role",
            "type": "string"
          },
          {
            "id": "1635323412244-11620",
            "name": "lastVisit",
            "type": "number"
          }
        ]
      },
      {
        "id": "1636788985068-57559",
        "name": "LinkPort",
        "view": {
          "x": 350,
          "y": 720
        },
        "fields": [
          {
            "id": "1636789024879-44413",
            "name": "page",
            "type": "number"
          },
          {
            "id": "1636789063582-52114",
            "name": "status",
            "type": "number"
          },
          {
            "id": "1636789070226-84874",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1636789142838-93417",
            "name": "link",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1637578127674-70752",
        "name": "Entity",
        "view": {
          "x": 810,
          "y": 490
        },
        "fields": [
          {
            "id": "1637578132135-44736",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1637578135688-17656",
            "name": "fields",
            "type": "rel"
          },
          {
            "id": "1637599096840-12750",
            "name": "posX",
            "type": "number"
          },
          {
            "id": "1637599102797-41985",
            "name": "posY",
            "type": "number"
          },
          {
            "id": "1637599102797-12345",
            "name": "product",
            "type": "rel"
          },
          {
            "id": "1637599102797-12346",
            "name": "groupId",
            "type": "number"
          }
        ]
      },
      {
        "id": "1637578140620-60996",
        "name": "Field",
        "view": {
          "x": 1050,
          "y": 810
        },
        "fields": [
          {
            "id": "1637578145920-75170",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1637578148336-49065",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1637578150684-91525",
            "name": "isCollection",
            "type": "boolean"
          },
          {
            "id": "1637599433557-51860",
            "name": "entity",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1637578171464-90267",
        "name": "Relation",
        "view": {
          "x": 1470,
          "y": 380
        },
        "fields": [
          {
            "id": "1637578187832-72000",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1637578213634-74505",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1637578216258-93914",
            "name": "source",
            "type": "rel"
          },
          {
            "id": "1637578224098-76196",
            "name": "target",
            "type": "rel"
          },
          {
            "id": "1638774367090-62460",
            "name": "product",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1637599274986-64218",
        "name": "RelationPort",
        "view": {
          "x": 1330,
          "y": 520
        },
        "fields": [
          {
            "id": "1637599310683-24280",
            "name": "entity",
            "type": "number"
          },
          {
            "id": "1637599320008-37928",
            "name": "field",
            "type": "number"
          },
          {
            "id": "1637599325032-6668",
            "name": "side",
            "type": "string"
          },
          {
            "id": "1637599390438-28969",
            "name": "relation",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1639573008934-49082",
        "name": "LogMessage",
        "view": {
          "x": 90,
          "y": 150
        },
        "fields": [
          {
            "id": "1639573032112-91802",
            "name": "productId",
            "type": "number"
          },
          {
            "id": "1639573040873-73686",
            "name": "pageId",
            "type": "number"
          },
          {
            "id": "1639573060099-7826",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1639573068663-13000",
            "name": "action",
            "type": "string"
          },
          {
            "id": "1639573078892-16050",
            "name": "member",
            "type": "string"
          },
          {
            "id": "1639573082046-59452",
            "name": "value",
            "type": "string"
          }
        ]
      },
      {
        "id": "1639573008934-49083",
        "name": "TaskLink",
        "view": {
          "x": 200,
          "y": 970
        },
        "fields": [
          {
            "id": "1639573032212-91802",
            "name": "pageId",
            "type": "number"
          },
          {
            "id": "1639573040973-73686",
            "name": "useCaseId",
            "type": "number"
          },
          {
            "id": "1639573060199-7826",
            "name": "taskId",
            "type": "string"
          },
          {
            "id": "1639573068664-13000",
            "name": "versionId",
            "type": "number"
          }
        ]
      },
      {
        "id": "1639998093041-96042",
        "name": "UserPage",
        "view": {
          "position": {
            "x": 1320,
            "y": 170
          }
        },
        "fields": [
          {
            "id": "1639998098991-7768",
            "name": "user",
            "type": "rel"
          },
          {
            "id": "1639998106595-65103",
            "name": "page",
            "type": "rel"
          },
          {
            "id": "1639998112074-99315",
            "name": "role",
            "type": "string"
          }
        ]
      },
      {
        "id": "1641283992624-30061",
        "name": "Codebase",
        "view": {
          "position": {
            "x": 1580,
            "y": 60
          }
        },
        "fields": [
          {
            "id": "1641284002542-65000",
            "name": "modelPath",
            "type": "string"
          },
          {
            "id": "1641284002542-65090",
            "name": "product",
            "type": "rel"
          },
          {
            "id": "1641284014302-26080",
            "name": "projectId",
            "type": "number"
          },
          {
            "id": "1641284020662-39329",
            "name": "projectUrl",
            "type": "string"
          },
          {
            "id": "1641284029117-13821",
            "name": "pagePath",
            "type": "string"
          },
          {
            "id": "1641284036114-56547",
            "name": "pageType",
            "type": "string"
          },
          {
            "id": "1641284043760-77246",
            "name": "metadataPath",
            "type": "string"
          },
          {
            "id": "1641377083668-52297",
            "name": "projectName",
            "type": "string"
          },
          {
            "id": "1641436845992-57647",
            "name": "targetBranch",
            "type": "string"
          }
        ]
      },
      {
        "id": "1641798110654-97344",
        "name": "PagePin",
        "view": {
          "x": 910,
          "y": 1230
        },
        "fields": [
          {
            "id": "1641798121715-48582",
            "name": "x",
            "type": "number"
          },
          {
            "id": "1641798125987-42472",
            "name": "y",
            "type": "number"
          },
          {
            "id": "1641798130379-23501",
            "name": "width",
            "type": "number"
          },
          {
            "id": "1641798135418-72430",
            "name": "height",
            "type": "number"
          },
          {
            "id": "1641798483274-27014",
            "name": "markup",
            "type": "rel"
          },
          {
            "id": "1641798490403-17504",
            "name": "action",
            "type": "rel"
          },
          {
            "id": "1641798688736-58055",
            "name": "pageStatus",
            "type": "rel"
          },
          {
            "id": "1641799679924-91431",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1646383319509-73820",
            "name": "tips",
            "type": "rel"
          },
          {
            "id": "1648018705861-39133",
            "name": "nextStatus",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1641798330016-92930",
        "name": "Markup",
        "view": {
          "x": 1460,
          "y": 820
        },
        "fields": [
          {
            "id": "1641798440863-11209",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1641798472074-69985",
            "name": "content",
            "type": "string"
          },
          {
            "id": "1641798511947-28774",
            "name": "pins",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1641798793802-72284",
        "name": "UseCase",
        "view": {
          "position": {
            "x": 1610,
            "y": 780
          }
        },
        "fields": [
          {
            "id": "1641798801664-49099",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1641798801664-49091",
            "name": "taskId",
            "type": "string"
          },
          {
            "id": "1641798826401-4879",
            "name": "version",
            "type": "rel"
          },
          {
            "id": "1641798834361-36984",
            "name": "actions",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1641798894062-95644",
        "name": "Action",
        "view": {
          "x": 1530,
          "y": 1010
        },
        "fields": [
          {
            "id": "1641799005016-19241",
            "name": "pins",
            "type": "rel"
          },
          {
            "id": "1641799131195-75723",
            "name": "triggerType",
            "type": "string"
          },
          {
            "id": "1641799131195-75724",
            "name": "triggerValue",
            "type": "string"
          },
          {
            "id": "1641799276067-66536",
            "name": "destinationType",
            "type": "string"
          },
          {
            "id": "1641799342702-63067",
            "name": "destinationValue",
            "type": "number"
          },
          {
            "id": "1641799485695-3519",
            "name": "useCase",
            "type": "rel"
          },
          {
            "id": "1641799485695-0001",
            "name": "index",
            "type": "number"
          },
          {
            "id": "1641799485695-0002",
            "name": "prevId",
            "type": "number"
          }
        ]
      },
      {
        "id": "1642386442012-33511",
        "name": "Meta",
        "view": {
          "x": 860,
          "y": 1070
        },
        "fields": [
          {
            "id": "1642386515008-21603",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1642386524908-93682",
            "name": "sourceId",
            "type": "number"
          },
          {
            "id": "1642386574939-24234",
            "name": "group",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1642386727838-51310",
        "name": "MetaGroup",
        "view": {
          "x": 1170,
          "y": 1080
        },
        "fields": [
          {
            "id": "1642386746579-30129",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1642386764686-6319",
            "name": "folderId",
            "type": "number"
          },
          {
            "id": "1642386771042-16430",
            "name": "publishId",
            "type": "string"
          },
          {
            "id": "1642387120902-17928",
            "name": "children",
            "type": "rel"
          },
          {
            "id": "1643003409551-75102",
            "name": "product",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1643169772116-56275",
        "name": "ProtoDraft",
        "view": {
          "position": {
            "x": 1220,
            "y": 10
          }
        },
        "fields": [
          {
            "id": "1643169779127-82337",
            "name": "pageStatus",
            "type": "rel"
          },
          {
            "id": "1643169789127-73042",
            "name": "protoNodes",
            "type": "string"
          },
          {
            "id": "1643169801783-42206",
            "name": "imgSrc",
            "type": "string"
          }
        ]
      },
      {
        "id": "1643341372366-78931",
        "name": "Document",
        "view": {
          "x": 900,
          "y": 1330
        },
        "fields": [
          {
            "id": "1643341385427-76750",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1643341408614-16316",
            "name": "content",
            "type": "string"
          },
          {
            "id": "1643341482278-46173",
            "name": "product",
            "type": "rel"
          },
          {
            "id": "1643341917536-21377",
            "name": "creator",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1645586441628-2167",
        "name": "TaskRemark",
        "view": {
          "position": {
            "x": 990,
            "y": 80
          }
        },
        "fields": [
          {
            "id": "1645586446461-54894",
            "name": "url",
            "type": "string"
          },
          {
            "id": "1645586449239-32056",
            "name": "taskId",
            "type": "string"
          }
        ]
      },
      {
        "id": "1646019993113-17754",
        "name": "Bug",
        "view": {
          "position": {
            "x": 820,
            "y": 100
          }
        },
        "fields": [
          {
            "id": "1646019997824-40479",
            "name": "taskId",
            "type": "string"
          },
          {
            "id": "1646020720860-54985",
            "name": "versionId",
            "type": "string"
          }
        ]
      },
      {
        "id": "1646191738715-13347",
        "name": "LocalMeta",
        "view": {
          "position": {
            "x": 320,
            "y": 1220
          }
        },
        "fields": [
          {
            "id": "1646191753906-98070",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1646191766889-40300",
            "name": "desc",
            "type": "string"
          },
          {
            "id": "1646191780822-5728",
            "name": "type",
            "type": "string"
          },
          {
            "id": "1646191809415-20987",
            "name": "editor",
            "type": "string"
          },
          {
            "id": "1646191812496-23032",
            "name": "content",
            "type": "string"
          },
          {
            "id": "1646191820052-75785",
            "name": "version",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1646383048563-61672",
        "name": "Tips",
        "view": {
          "x": 290,
          "y": 380
        },
        "fields": [
          {
            "id": "1646383107259-40587",
            "name": "content",
            "type": "string"
          },
          {
            "id": "1646383116424-22614",
            "name": "fontSize",
            "type": "number"
          },
          {
            "id": "1646383123553-34239",
            "name": "color",
            "type": "string"
          },
          {
            "id": "1646383361207-79893",
            "name": "pin",
            "type": "rel"
          }
        ]
      },
      {
        "id": "1647588879138-66446",
        "name": "ModelGroup",
        "view": {
          "x": 800,
          "y": 920
        },
        "fields": [
          {
            "id": "1647588899099-81742",
            "name": "name",
            "type": "string"
          },
          {
            "id": "1647588903513-9719",
            "name": "version",
            "type": "rel",
            "isCollection": false
          },
          {
            "id": "1648006974852-47687",
            "name": "centerX",
            "type": "number"
          },
          {
            "id": "1648006996701-8505",
            "name": "centerY",
            "type": "number"
          }
        ]
      }
    ],
    "relations": [
      {
        "id": "015cd1dd-e5c5-41d3-a10a-72a92020ecb4",
        "name": "share",
        "type": "n:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1634896023255-63712"
        },
        "target": {
          "entity": "1634894294141-30715",
          "field": "1634896004452-16754"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "0b9df05b-a4fa-4205-a13a-11251d31ac5f",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1634896076167-49392"
        },
        "target": {
          "entity": "1634894368200-45735",
          "field": "1634894506026-56235"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "64e1bab2-1edc-483f-b846-e0575b4bab95",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634894294141-30715",
          "field": "1634896082203-41905"
        },
        "target": {
          "entity": "1634894368200-45735",
          "field": "1634894555507-94017"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "2ddad300-0e76-42c3-ace7-0e1452316c6a",
        "name": "create",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1634896183447-3986"
        },
        "target": {
          "entity": "1634893806612-90426",
          "field": "1634893817720-60185"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "b51dfa38-2d65-4f93-a333-d855961cc938",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1634896346280-30368"
        },
        "target": {
          "entity": "1634893806612-90426",
          "field": "1634893847025-26789"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "49dff94d-5821-4418-931b-fd9bded1ea1f",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1634896475229-68649"
        },
        "target": {
          "entity": "1634894582176-23593",
          "field": "1634895352598-60244"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "665fe889-f31d-4e2d-846c-76abdf52fb1d",
        "name": "create",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1634895464658-50843"
        },
        "target": {
          "entity": "1634894582176-23593",
          "field": "1635149582951-43239"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "f09043b8-9a9c-4f63-b204-eac105a7d21e",
        "name": "create",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1635228142885-72752"
        },
        "target": {
          "entity": "1634893564933-93656",
          "field": "1634893589516-69864"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "fdcb15a3-e2fe-4624-a9a1-f507281c2a91",
        "name": "is",
        "type": "n:1",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1635239223686-79189"
        },
        "target": {
          "entity": "1635239275116-92203",
          "field": "1635239368154-37410"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "a29712ac-61d5-4cb2-97b1-5df285144c16",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1635254826806-9309"
        },
        "target": {
          "entity": "1635254846143-22652",
          "field": "1635254858996-23271"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "right"
        }
      },
      {
        "id": "676faaab-4de2-47ab-9adf-4a81ca5ed111",
        "name": "link",
        "type": "n:1",
        "source": {
          "entity": "1635257181430-94279",
          "field": "1635257245165-72295"
        },
        "target": {
          "entity": "1634894093742-84692",
          "field": "1635315486389-64163"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "7d957706-8920-49aa-96bc-26a474e4abe8",
        "name": "link",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1635228142885-72752"
        },
        "target": {
          "entity": "1635323274010-34896",
          "field": "1635323311770-7129"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "2ba57b8f-af9f-481b-a843-98d62d52a4a1",
        "name": "link",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1634894934356-79520"
        },
        "target": {
          "entity": "1635323274010-34896",
          "field": "1635323316898-57675"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "50336d68-99e2-45fc-9900-794c5f86a990",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1635257181430-94279",
          "field": "1635257232247-5789"
        },
        "target": {
          "entity": "1635257181430-94279",
          "field": "1635926140724-66241"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "b5d128d4-3617-4ca2-993f-d97858a54df6",
        "name": "has",
        "type": "n:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1636380604982-6796"
        },
        "target": {
          "entity": "1635257181430-94279",
          "field": "1636380743974-88715"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "4f0e4cd5-6e60-45cb-8460-96f63466be20",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1636622456409-74583"
        },
        "target": {
          "entity": "1634894093742-84692",
          "field": "1636622695522-74764"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "d4c3445e-e3ec-48df-a558-d4bea6848681",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1636622463956-23590"
        },
        "target": {
          "entity": "1635257181430-94279",
          "field": "1636622703870-60800"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "9ded7c92-85ca-42f5-abc7-53e4b3b1b9eb",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1636622471824-41417"
        },
        "target": {
          "entity": "1634894294141-30715",
          "field": "1636622712658-6672"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "4637b91d-c1f7-4a59-ac20-061d8e6b7a29",
        "name": "is",
        "type": "n:1",
        "source": {
          "entity": "1634894197650-46396",
          "field": "1634894258612-89045"
        },
        "target": {
          "entity": "1636788985068-57559",
          "field": "1636789142838-93417"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "02ded926-204b-4c2d-9883-575703df895a",
        "name": "is",
        "type": "n:1",
        "source": {
          "entity": "1634894197650-46396",
          "field": "1634894265962-94092"
        },
        "target": {
          "entity": "1636788985068-57559",
          "field": "1636789142838-93417"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "1fe73035-44fd-42f6-ae26-b0097e77aeb2",
        "name": "link",
        "type": "1:1",
        "source": {
          "entity": "1635254846143-22652",
          "field": "1636879827607-92816"
        },
        "target": {
          "entity": "1634894093742-84692",
          "field": "1636711223616-121"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "c8941452-2c9b-41f8-8a99-2bcf1332f78d",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1635318903352-52149"
        },
        "target": {
          "entity": "1634893564933-93656",
          "field": "1636974763439-17173"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "right"
        }
      },
      {
        "id": "09565ebd-47f9-457c-a478-93852c188402",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1637578127674-70752",
          "field": "1637578135688-17656"
        },
        "target": {
          "entity": "1637578140620-60996",
          "field": "1637599433557-51860"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "b4ef8ba1-f92c-466b-9ecd-b670a41951bf",
        "name": "is",
        "type": "n:1",
        "source": {
          "entity": "1637578171464-90267",
          "field": "1637578216258-93914"
        },
        "target": {
          "entity": "1637599274986-64218",
          "field": "1637599390438-28969"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "2941dde6-cbe6-4a08-80ba-c8b1fd75d99a",
        "name": "is",
        "type": "n:1",
        "source": {
          "entity": "1637578171464-90267",
          "field": "1637578224098-76196"
        },
        "target": {
          "entity": "1637599274986-64218",
          "field": "1637599390438-28969"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "right"
        }
      },
      {
        "id": "2941dde6-1234-4a08-1234-1234",
        "name": "is",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1638426829504-1234"
        },
        "target": {
          "entity": "1637578127674-70752",
          "field": "1637599102797-12345"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "ba58f267-711a-47bb-a3bf-f2a797f52368",
        "name": "is",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1638426829504-1234"
        },
        "target": {
          "entity": "1637578171464-90267",
          "field": "1638774367090-62460"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "d61555c2-ae1d-4a53-989e-1a24cd50a4a5",
        "name": "is",
        "type": "1:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1639467380320-610"
        },
        "target": {
          "entity": "1634894197650-46396",
          "field": "1639467393415-60021"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "8fdd2a4a-5bf3-44a2-a179-d8b8fb35ce2f",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1639998161072-50499"
        },
        "target": {
          "entity": "1639998093041-96042",
          "field": "1639998098991-7768"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "813b3d21-58db-4e16-8faa-d41b5fbb3473",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634894093742-84692",
          "field": "1639998286826-50247"
        },
        "target": {
          "entity": "1639998093041-96042",
          "field": "1639998106595-65103"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "right"
        }
      },
      {
        "id": "205321bc-8e44-4d5c-b7c9-f28248f38e23",
        "name": "is",
        "type": "1:1",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1639375987899-1610"
        },
        "target": {
          "entity": "1641283992624-30061",
          "field": "1641284002542-65090"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "71eb3a53-53c4-4232-94b1-d6ae4b0f501e",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1641798330016-92930",
          "field": "1641798511947-28774"
        },
        "target": {
          "entity": "1641798110654-97344",
          "field": "1641798483274-27014"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "287a6a29-c223-4dcc-b0c1-c22914a68b40",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1641798894062-95644",
          "field": "1641799005016-19241"
        },
        "target": {
          "entity": "1641798110654-97344",
          "field": "1641798490403-17504"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "d05bebf5-3c72-4858-8f92-9991c6832e05",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1641799454973-19822"
        },
        "target": {
          "entity": "1641798793802-72284",
          "field": "1641798826401-4879"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "7fa44c17-b7b9-4b6d-a51f-75838a62d84a",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1641798793802-72284",
          "field": "1641798834361-36984"
        },
        "target": {
          "entity": "1641798894062-95644",
          "field": "1641799485695-3519"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "right"
        }
      },
      {
        "id": "5ee2a644-bfd6-4c66-8f93-b121fc649651",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1635254846143-22652",
          "field": "1641800687041-28123"
        },
        "target": {
          "entity": "1641798110654-97344",
          "field": "1641798688736-58055"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "cd4f663f-1aeb-4f0f-abce-807168a7923a",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1642386727838-51310",
          "field": "1642387120902-17928"
        },
        "target": {
          "entity": "1642386442012-33511",
          "field": "1642386574939-24234"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "b4875bc6-f253-4be4-bddf-e8c176d8a149",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1643003441095-2392"
        },
        "target": {
          "entity": "1642386727838-51310",
          "field": "1643003409551-75102"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "8d88ffd8-ac05-48f1-bf71-6c1db645ba3d",
        "name": "is",
        "type": "1:1",
        "source": {
          "entity": "1635254846143-22652",
          "field": "1643169757285-49191"
        },
        "target": {
          "entity": "1643169772116-56275",
          "field": "1643169779127-82337"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "80b77dca-2e76-44b9-a3ec-d311d2a86829",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893564933-93656",
          "field": "1643341637294-21139"
        },
        "target": {
          "entity": "1643341372366-78931",
          "field": "1643341482278-46173"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "35d8d6bb-d8dc-401f-8fd9-b8b177e2d3f0",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634895401642-39041",
          "field": "1643341962782-67765"
        },
        "target": {
          "entity": "1643341372366-78931",
          "field": "1643341917536-21377"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "35d8d6bb-d8dc-401f-8fd9-b8b177e000100",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1634893817720-00003"
        },
        "target": {
          "entity": "1634893806612-9042600",
          "field": "1634893806612-90426001"
        },
        "view": {
          "sourcePortSide": "right",
          "targetPortSide": "left"
        }
      },
      {
        "id": "27ec511c-5b57-4a37-870e-245f2383f85c",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1646191956680-43258"
        },
        "target": {
          "entity": "1646191738715-13347",
          "field": "1646191820052-75785"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "4109b882-8fc1-4627-8f64-fa9c5caffb7b",
        "name": "has",
        "type": "1:1",
        "source": {
          "entity": "1641798110654-97344",
          "field": "1646383319509-73820"
        },
        "target": {
          "entity": "1646383048563-61672",
          "field": "1646383361207-79893"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "left"
        }
      },
      {
        "id": "5d116511-67e7-4946-b91c-a91e31676d63",
        "name": "create",
        "type": "1:n",
        "source": {
          "entity": "1641798110654-97344",
          "field": "1648018705861-39133"
        },
        "target": {
          "entity": "1635254846143-22652",
          "field": "1648018592420-45028"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      },
      {
        "id": "82b6623b-ad55-4b2c-a761-a02f8894b4cf",
        "name": "has",
        "type": "1:n",
        "source": {
          "entity": "1634893806612-90426",
          "field": "1647588942592-45230"
        },
        "target": {
          "entity": "1647588879138-66446",
          "field": "1647588903513-9719"
        },
        "view": {
          "sourcePortSide": "left",
          "targetPortSide": "right"
        }
      }
    ]
  }
  export default data