/** @jsx createElement */
import { createElement, render, useRef } from 'axii'
import { ToastGrid, Button } from 'axii-components'

function App() {
	const editor = useRef()
	const save = () => {
		console.log(editor.current.getData())
	}

	const tables = [{
		"name": "Page",
		"columns": [
			{
				"name": "title",
				"type": "text",
				"field": {
					"id": "f1",
					"name": "title",
					"type": "string",
					"fieldsMap": null,
					"storage": {
						"table": "Page",
						"column": "title"
					}
				}
			},
			{
				"name": "description",
				"type": "text",
				"field": {
					"name": "description",
					"type": "string",
					"fieldsMap": null,
					"storage": {
						"table": "Page",
						"column": "description"
					}
				}
			},
			{
				"name": "id",
				"type": "id",
				"auto": true,
				"field": {
					"name": "id",
					"type": "id",
					"auto": true,
					"fieldsMap": null,
					"storage": {
						"table": "Page",
						"column": "id"
					}
				}
			},
			{
				"name": "createdAt",
				"type": "integer",
				"field": {
					"name": "createdAt",
					"auto": true,
					"type": "number",
					"size": 10,
					"fieldsMap": null,
					"storage": {
						"table": "Page",
						"column": "createdAt"
					}
				}
			},
			{
				"name": "modifiedAt",
				"type": "integer",
				"field": {
					"name": "modifiedAt",
					"auto": true,
					"type": "number",
					"size": 10,
					"fieldsMap": null,
					"storage": {
						"table": "Page",
						"column": "modifiedAt"
					}
				}
			},
			{
				"name": "url",
				"type": "id"
			}
		]
	}, {
		"name": "PageUrl",
		"columns": [
			{
				"name": "id",
				"type": "id",
				"auto": true,
				"field": {
					"name": "id",
					"type": "id",
					"auto": true,
					"fieldsMap": null,
					"storage": {
						"table": "PageUrl",
						"column": "id"
					}
				}
			},
			{
				"name": "site",
				"type": "id"
			},
			{
				"name": "path",
				"type": "id"
			},
			{
				"name": "query",
				"type": "id"
			},
			{
				"name": "hash",
				"type": "id"
			}
		]
	},
		{
			"name": "PageUrlSite",
			"columns": [
				{
					"name": "value",
					"type": "text",
					"field": {
						"name": "value",
						"type": "string",
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlSite",
							"column": "value"
						}
					}
				},
				{
					"name": "id",
					"type": "id",
					"auto": true,
					"field": {
						"name": "id",
						"type": "id",
						"auto": true,
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlSite",
							"column": "id"
						}
					}
				}
			]
		},
		{
			"name": "PageUrlPath",
			"columns": [
				{
					"name": "value",
					"type": "string",
					"size": 128,
					"field": {
						"name": "value",
						"type": "string",
						"size": 128,
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlPath",
							"column": "value"
						}
					}
				},
				{
					"name": "queryElement",
					"type": "string",
					"size": 128,
					"field": {
						"name": "queryElement",
						"type": "string",
						"size": 128,
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlPath",
							"column": "queryElement"
						}
					}
				},
				{
					"name": "useHash",
					"type": "boolean",
					"field": {
						"name": "useHash",
						"type": "boolean",
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlPath",
							"column": "useHash"
						}
					}
				},
				{
					"name": "id",
					"type": "id",
					"auto": true,
					"field": {
						"name": "id",
						"type": "id",
						"auto": true,
						"fieldsMap": null,
						"storage": {
							"table": "PageUrlPath",
							"column": "id"
						}
					}
				},
				{
					"name": "site",
					"type": "id"
				}
			]
		}]

	const maxColumnLength = Math.max(...tables.map(t => t.columns.length))
	const columns = [{header: 'Table', name: 'name'}].concat(
		Array(maxColumnLength).fill(null).map((_, index) => ({ header: `Column_${index}`, name:`column_${index}`}))
	)

	const data = tables.map(table => ({
		name: table.name,
		...table.columns.reduce((result, currentColumn, index) =>{
			return {
				...result,
				[`column_${index}`]: `${currentColumn.name}[${currentColumn.type}]`
			}
		}, {})
	}))


	return (
		<div>
			<Button primary onClick={save}>保存</Button>
			<ToastGrid ref={editor} data={data} columns={columns} header={{align: 'left'}}/>
		</div>
	)
}


render(<App />, document.getElementById('root'))
