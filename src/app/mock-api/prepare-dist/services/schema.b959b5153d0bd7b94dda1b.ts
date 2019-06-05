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
          },
          "type": {
            "type": "string",
            "enum": [
              "syntax",
              "semantic"
            ]
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
      "ToDosItem": {
        "type": "object",
        "properties": {
          "uid": {
            "type": "number",
            "min": 1,
            "max": 2147483647
          },
          "listUid": {
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
            "type": "string",
            "minLength": 10,
            "maxLength": 512
          },
          "isDone": {
            "type": "boolean",
            "default": "false"
          },
          "dateCreated": {
            "type": "string",
            "format": "date-time"
          },
          "dateChanged": {
            "type": "string",
            "format": "date-time"
          },
          "position": {
            "type": "number",
            "min": 0,
            "max": 4096
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
          "title",
          "isDone",
          "position"
        ]
      },
      "ToDosList": {
        "type": "object",
        "properties": {
          "uid": {
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
            "type": "string",
            "minLength": 10,
            "maxLength": 512
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ToDosItem"
            }
          },
          "isComplete": {
            "type": "boolean"
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
          "title",
          "items"
        ]
      },
      "Url": {
        "type": "string",
        "pattern": "^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?"
      }
    }
  },
  "$id": "schema.b959b5153d0bd7b94dda1b"
};

