/**@jsx createElement */
import { createElement, useViewEffect, useImperativeHandle } from 'axii'
import XSpreadsheet from 'x-data-spreadsheet'

export default function Spreadsheet({ data, ref:parentRef }) {
  const id = 'spreadsheetroot'
  let spreadsheet

  if (parentRef) {
    useImperativeHandle(parentRef, () => new Proxy({}, {
      get(target, method) {
        return spreadsheet[method]
      }
    }))
  }

  useViewEffect(async () => {

    spreadsheet = new XSpreadsheet(`#${id}`, {
      view: {
        height: () => 500,
        width: () => 800,
      },
    })
    if (data?.length) spreadsheet.loadData(data)
  })

  return (
    <div id={id} style={{height: 500, width: 800}}/>
  )
}

Spreadsheet.forwardRef = true
