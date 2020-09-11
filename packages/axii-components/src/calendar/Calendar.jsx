import {
  createElement,
  ref,
  createComponent,
  propTypes
} from 'axii'
import scen from '../pattern'

import moment from 'moment';

export function Calendar({ value, current, onSelect, onSelectNextMonth, onSelectLastMonth, onChange }, fragments) {

  return <container inline>

      {fragments.header()(() => (
        <header inline flex-display>
          <lastYear>{'<<'}</lastYear>
          <lastMonth onClick={onSelectLastMonth}>{'<'}</lastMonth>
          <month inline flex-grow-1>{current.value.month() + 1} 月</month>
          <nextMonth onClick={onSelectNextMonth}>{'>'}</nextMonth>
          <nextYear>{'>>'}</nextYear>
        </header>
      ))}

    <dates use="table">
      <dayIndexesCotainer use="thead">
        <dayIndexes use="tr">
          {['一', '二', '三', '四', '五', '六', '日'].map(index => (
            <dayIndex
              use="th"
              inline
              inline-display-table-cell
              inline-padding-10px
            >
              {index}
            </dayIndex>
          ))}
        </dayIndexes>
      </dayIndexesCotainer>
      <days use="tbody">
        {fragments.days()(() => {

          // 开始计算有几周
          const startDay = moment(current.value).startOf('month')
          const endDay = moment(current.value).endOf('month')

          const dates = Array(endDay.date()).fill(0).map((_, i) => ({
            year: current.value.year(),
            month: current.value.month(),
            date: i+1,
          }))
          // 往前补
          const startDayOfWeek = startDay.isoWeekday()
          if (startDayOfWeek > 1) {
            const lastMonth = moment(startDay).subtract('1', 'day')
            const lastDayOfLastMonth = lastMonth.date()
            for( let i = startDayOfWeek - 1; i > 0; i-- ) {
              dates.unshift({
                year: lastMonth.year(),
                month: lastMonth.month(),
                date: lastDayOfLastMonth - (startDayOfWeek - i - 1)
              })
            }
          }

          const endDayOfWeek  = endDay.isoWeekday()

          if (endDayOfWeek < 7) {
            const nextMonth = moment(endDay).add('1', 'day')
            for( let i = endDayOfWeek + 1; i < 8; i++) {
              dates.push({
                year: nextMonth.year(),
                month: nextMonth.month(),
                date: i
              })
            }
          }

          // 每 7 个一组
          const datesGroupByWeek = dates.reduce((result, current) => {
            const lastGroup =  result[result.length - 1]
            if (lastGroup.length === 7) {
              result.push([current])
            } else {
              lastGroup.push(current)
            }
            return result
          }, [[]])

          return datesGroupByWeek.map(week => (
            <week use='tr'>{
              week.map(dayData => fragments.day(dayData)(() => (
                <day
                  use='td'
                  onClick={() => onChange(dayData)}
                  inline
                  inline-display-table-cell
                  inline-padding-10px
                >
                  {dayData.date}
                </day>
              )))
            }</week>
          ))
        })}
      </days>
    </dates>
    <div>{() => value.value.format('YYYY-MM-DD')}</div>
  </container>

}

Calendar.propTypes = {
  value: propTypes.object.default(() => ref(moment())),
  current: propTypes.object.default(({ value }) => ref(moment(value))),
  onSelectNextMonth: propTypes.callback.default(() => ({ current }) => {
    const thisMouth = current.value.month()
    current.value = moment(current.value).month( (thisMouth + 1) % 12 )
  }),
  onSelectLastMonth: propTypes.callback.default(() => ({ current }) => {
    const thisMouth = current.value.month()
    current.value = moment(current.value).month( (thisMouth + 11) % 12 )
  }),
  onChange: propTypes.callback.default(() => ({year, month, date}, { value }) => {
    value.value = moment().year(year).month(month).date(date)
  })
}

Calendar.Style = (fragments) => {
  fragments.root.elements.container.style({
    background: scen().active().bgColor()
  })

  fragments.header.elements.month.style({
    textAlign: 'center'
  })

  fragments.header.elements.lastMonth.style({
    cursor: 'pointer'
  })

  fragments.header.elements.nextMonth.style({
    cursor: 'pointer'
  })

  fragments.day.elements.day.style(({ value, year, month, date}) => {

    const equal = (value.value.year() === year && value.value.month() === month && value.value.date() === date)
    return {
      background: equal?
        scen().inverted().active().bgColor() :
        scen().active().bgColor(),
      color: equal ? scen().interactable().active().inverted().color() : scen().color(),
      cursor: 'pointer',
      textAlign: 'center'
    }
  })
}

export default createComponent(Calendar)


