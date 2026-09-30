[EN](Integrations)

# Integrationen

Lasius bietet die Möglichkeit basierend auf Issues in externen Issue-Tracking Systemen `Tags` in einem Projekt automatisch zu erstellen.

ℹ️ Die Verwaltung der Konfiguration erfolgt derzeit in der Datenbank. Für die Verwaltung der Konfiguration in der Applikation ist ein entsprechendes [Issue](https://github.com/tegonal/Lasius/issues/190) geplant.
Deshalb muss aktuell nach dem Anpassen der Konfiguration in der Datenbank der Lasius Backend Service neu gestartet werden.

## Plane

Lasius unterstützt das Auslesen von [Plane](https://plane.so/) Issues.

Dazu muss in die Tabelle `PlaneConfig` ein Eintrag mit dem folgenden JSON Schema erstellt/hinzugefügt werden:

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "_id": {
      "type": "string",
      "description": "Auto generated id from mongodb"
    },
    "name": {
      "type": "string"
    },
    "baseUrl": {
      "type": "string",
      "description": "Base url of plane instance."
    },
    "auth": {
      "type": "object",
      "properties": {
        "apiKey": {
          "type": "string",
          "description": "Long-living API Key to access issues and projects"
        }
      },
      "required": [
        "apiKey"
      ]
    },
    "settings": {
      "type": "object",
      "properties": {
        "checkFrequency": {
          "type": "integer",
          "description": "Interval in millis to check for new issues"
        }
      },
      "required": [
        "checkFrequency"
      ]
    },
    "projects": {
      "type": "array",
      "description": "Map lasius projects to projects in plane",
      "items": [
        {
          "type": "object",
          "properties": {
            "projectId": {
              "type": "string",
              "description": "Lasius project id"
            },
            "settings": {
              "type": "object",
              "properties": {
                "planeWorkspace": {
                  "type": "string",
                },
                "planeProjectId": {
                  "type": "string"
                },
                "params": {
                  "type": "string",
                  "description": "Additional search query params to add"
                },
                "maxResults": {
                  "type": "integer",
                  "description": "Max issues to query at once, defaults to 100 (limit of plane)."
                },
                "tagConfiguration": {
                  "type": "object",
                  "properties": {
                    "useLabels": {
                      "type": "boolean",
                      "description": "True if plane labels should be added booking entry as sub-tags"
                    },
                    "labelFilter": {
                      "type": "array",
                      "description": "Labels part of this array will be not be added as tags",
                      "items": [
                        {
                          "type": "string"
                        }
                      ]
                    },
                    "useTitle": {
                      "type": "boolean",
                      "description": "If true, use issue title as tag",
                    },
                    "includeOnlyIssuesWithState": {
                      "type": "array",
                      "description": "Include only issues in state in the results",
                      "items": {
                        "type": "string"
                      }
                    },
                    "includeOnlyIssuesWithLabels": {
                      "type": "array",
                      "description": "Include only issues having a certain label in the results",
                      "items": {
                        "type": "string"
                      }
                    }
                  },
                  "required": [
                    "useLabels",
                    "labelFilter"
                  ]
                }
              },
              "required": [
                "planeWorkspace",
                "planeProjectId",
                "tagConfiguration"
              ]
            }
          },
          "required": [
            "projectId",
            "settings"
          ]
        }
      ]
    }
  },
  "required": [
    "_id",
    "name",
    "baseUrl",
    "auth",
    "settings",
    "projects"
  ]
```

Hier ein Beispiel-Kommando:

```mongosh
  db.PlaneConfig.insertOne({
	"name" : "Plane Integration",
	"baseUrl" : "https://myplane.instance.com",
	"auth" : {
		"apiKey" : "1234"
	},
	"settings" : {
		"checkFrequency" : 60000
	},
	"projects" : [
		{
			"projectId" : "97e0ea08-7342-4f50-be76-2d1fd0849172",
			"settings" : {
				"planeWorkspace" : "my-plane-workspalce",
				"planeProjectId" : "004e182a-5117-45eb-ad06-7c37a9f83170",
				"maxResults" : 1000,
				"tagConfiguration" : {
					"useLabels" : true,
					"labelFilter" : [
						"Infrastructure",
					],
					"useMilestone" : false,
					"useTitle" : false,
					"includeOnlyIssuesWithState" : [
                      "Backlog",
                      "Todo",
                      "In Progress"
                    ],
					"includeOnlyIssuesWithLabels" : [ ]
				}
			}
		}
	]
})
```

## Gitlab

Lasius unterstützt das Auslesen von [Gitlab](https://gitlab.com/) Issues aus der SaaS oder eine eigens gehosteten Gitlab Instanz.

Dazu muss in die Tabelle `GitlabConfig` ein Eintrag mit dem folgenden JSON Schema erstellt/hinzugefügt werden:

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "_id": {
      "type": "string",
      "description": "Auto generated id from mongodb"
    },
    "name": {
      "type": "string"
    },
    "baseUrl": {
      "type": "string"
    },
    "auth": {
      "type": "object",
      "properties": {
        "accessToken": {
          "type": "string",
          "description": "Long living accesstoken to the linked gitlab project"
        }
      },
      "required": ["accessToken"]
    },
    "settings": {
      "type": "object",
      "properties": {
        "checkFrequency": {
          "type": "integer",
          "description": "Interval in millis to check for new issues"
        }
      },
      "required": ["checkFrequency"]
    },
    "projects": {
      "type": "array",
      "items": [
        {
          "type": "object",
          "properties": {
            "projectId": {
              "type": "string",
              "descrption": "Lasius project id to map parsed tags to"
            },
            "settings": {
              "type": "object",
              "properties": {
                "gitlabProjectId": {
                  "type": "string",
                  "description": "Gitlab project id"
                },
                "projectKeyPrefix": {
                  "type": "string",
                  "description": "Prefix appended to gitlab project key when creating tag (i.e. GL_#130)",
                  "example": "GL_"
                },
                "params": {
                  "type": "string",
                  "description": "Additional search query params to add"
                },
                "maxResults": {
                  "type": "integer",
                  "description": "Max issues to query at once, defaults to 100 (limit of plane)."
                },
                "tagConfiguration": {
                  "type": "object",
                  "properties": {
                    "useLabels": {
                      "type": "boolean",
                      "description": "True if plane labels should be added booking entry as sub-tags"
                    },
                    "labelFilter": {
                      "type": "array",
                      "description": "Only add labels of the provided array as tags if assigned to the issue",
                      "items": [
                        {
                          "type": "string"
                        }
                      ]
                    },
                    "useMilestone": {
                      "type": "boolean",
                      "description": "If true, add milestone name as tag"
                    },
                    "useTitle": {
                      "type": "boolean",
                      "description": "If true, add issue title as tag"
                    }
                  },
                  "required": [
                    "useLabels",
                    "labelFilter",
                    "useMilestone",
                    "useTitle"
                  ]
                }
              },
              "required": ["gitlabProjectId", "tagConfiguration"]
            }
          },
          "required": ["projectId", "settings"]
        }
      ]
    }
  },
  "required": ["_id", "name", "baseUrl", "auth", "settings", "projects"]
}
```

Hier ein Beispiel-Kommando:

```mongosh
  db.GitlabConfig.insertOne({
	"_id" : "63031f5b6dbea8d2c0ae47ed",
	"name" : "Gitlab Project1",
	"baseUrl" : "https://gitlab.com/api/v4/",
	"auth" : {
		"privateKey" : "",
		"accessToken" : "My-Access-Token",
		"consumerKey" : ""
	},
	"settings" : {
		"checkFrequency" : 60000
	},
	"projects" : [
		{
			"projectId" : "01cf9ba6-683a-4a89-a8c1-d0a7d970def6",
			"settings" : {
				"gitlabProjectId" : "111",
				"projectKeyPrefix" : "GL_",
				"tagConfiguration" : {
					"useLabels" : true,
					"labelFilter" : [
						"Doing",
						"Open"
					],
					"useMilestone" : true,
					"useTitle" : true
				}
			}
		}
	]
})
```

## Jira

ℹ️ Die Jira Integration wurde gegen eine veraltete API Version entwickelt und muss bei gebrauch aktualisiert werden
