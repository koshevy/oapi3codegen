/* tslint:disable */
export const schema = {
  "components": {
    "schemas": {
      "AttachmentMeta": {
        "oneOf": [
          {
            "$ref": "#/components/schemas/AttachmentMetaImage"
          },
          {
            "$ref": "#/components/schemas/AttachmentMetaDocument"
          },
          {
            "$ref": "#/components/schemas/ExternalResource"
          }
        ]
      },
      "AttachmentMetaImage": {
        "type": "object",
        "properties": {
          "mediaId": {
            "type": "string",
            "pattern": "^[a-z0-9]{16}$"
          },
          "type": {
            "type": "string",
            "enum": [
              "image"
            ]
          },
          "url": {
            "$ref": "#/components/schemas/Url"
          },
          "thumbs": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "url": {
                  "$ref": "#/components/schemas/Url"
                },
                "imageOptions": {
                  "$ref": "#/components/schemas/ImageOptions"
                }
              }
            }
          },
          "format": {
            "type": "string",
            "enum": [
              "png",
              "jpeg",
              "gif",
              "svg",
              "tiff"
            ]
          },
          "imageOptions": {
            "$ref": "#/components/schemas/ImageOptions"
          }
        },
        "required": [
          "mediaId",
          "type",
          "url",
          "format",
          "imageOptions"
        ]
      },
      "AttachmentMetaDocument": {
        "type": "object",
        "properties": {
          "docId": {
            "type": "string",
            "pattern": "^[a-z0-9]{16}$"
          },
          "type": {
            "type": "string",
            "enum": [
              "document"
            ]
          },
          "url": {
            "$ref": "#/components/schemas/Url"
          },
          "format": {
            "type": "string",
            "enum": [
              "doc",
              "docx",
              "pdf",
              "rtf",
              "xls",
              "xlsx",
              "txt"
            ]
          },
          "size": {
            "type": "number",
            "min": 0,
            "max": 8388607
          }
        },
        "required": [
          "docId",
          "type",
          "url",
          "format",
          "size"
        ]
      },
      "ExternalResource": {
        "$ref": "#/components/schemas/Url"
      },
      "HttpErrorBadRequest": {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "syntax",
              "semantic"
            ]
          },
          "errors": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JsonError"
            }
          }
        }
      },
      "HttpErrorConflict": {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      },
      "HttpErrorNotFound": {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      },
      "HttpErrorServer": {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "description": {
            "type": "string"
          },
          "message": {
            "type": "string"
          }
        }
      },
      "ImageOptions": {
        "type": "object",
        "properties": {
          "width": {
            "type": "number",
            "min": 1,
            "max": 3000
          },
          "height": {
            "type": "number",
            "min": 1,
            "max": 3000
          },
          "size": {
            "type": "number",
            "min": 0,
            "max": 8388607
          }
        },
        "required": [
          "width",
          "height",
          "size"
        ]
      },
      "JsonError": {
        "type": "object",
        "required": [
          "originalMessage",
          "jsonPointer"
        ],
        "properties": {
          "originalMessage": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "jsonPointer": {
            "type": "string"
          }
        }
      },
      "ToDosItemBlank": {
        "properties": {
          "groupUid": {
            "type": "number",
            "min": 1,
            "max": 2147483647
          },
          "title": {
            "type": "string",
            "minLength": 3,
            "maxLength": 64
          },
          "description": {
            "type": [
              "string",
              "null"
            ],
            "minLength": 10,
            "maxLength": 512
          },
          "isDone": {
            "type": "boolean",
            "default": "false"
          },
          "attachments": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AttachmentMeta"
            },
            "maxItems": 16
          }
        },
        "required": [
          "isDone",
          "groupUid",
          "title"
        ]
      },
      "ToDosItem": {
        "allOf": [
          {
            "$ref": "#/components/schemas/ToDosItemBlank"
          },
          {
            "type": "object",
            "properties": {
              "uid": {
                "type": "number",
                "min": 1,
                "max": 2147483647,
                "readOnly": true
              },
              "dateCreated": {
                "type": "string",
                "format": "date-time",
                "readOnly": true
              },
              "dateChanged": {
                "type": "string",
                "format": "date-time",
                "readOnly": true
              },
              "position": {
                "type": "number",
                "min": 0,
                "max": 4096
              }
            },
            "required": [
              "dateChanged",
              "dateCreated",
              "position",
              "uid"
            ]
          }
        ]
      },
      "ToDosGroupBlank": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "minLength": 5,
            "maxLength": 32
          },
          "description": {
            "type": "string",
            "minLength": 16,
            "maxLength": 128
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ToDosItemBlank"
            }
          },
          "isComplete": {
            "type": "boolean"
          }
        },
        "required": [
          "items",
          "title"
        ]
      },
      "ToDosGroupExtendedData": {
        "type": "object",
        "properties": {
          "uid": {
            "type": "number",
            "min": 1,
            "max": 2147483647
          },
          "dateCreated": {
            "type": "string",
            "format": "date-time"
          },
          "dateChanged": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "dateChanged",
          "dateCreated",
          "uid"
        ]
      },
      "ToDosGroup": {
        "allOf": [
          {
            "$ref": "#/components/schemas/ToDosGroupBlank"
          },
          {
            "$ref": "#/components/schemas/ToDosGroupExtendedData"
          }
        ]
      },
      "Url": {
        "type": "string",
        "pattern": "^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?"
      }
    }
  },
  "$id": "schema.3ebc53a18cb5a06777c416"
};

